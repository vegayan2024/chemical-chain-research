#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
基于新研报投资逻辑与全量141家上市公司的基本面背离信号计算引擎
四大关注逻辑公式化：
1. 绝对价格型 (price): I_proxy = sum(w_i * P_i / P_i0)
2. 产业链价差型 (spread): 优先跟踪加工价差与产品-原料剪刀差变动率
3. 加工费/处理费型 (processing_fee): 跟踪TC/RC与代工加工利差
4. 副产品综合弹性型 (byproduct_composite): 强化副产物(硫酸/贵金属)权重测算超额利润贡献
"""

import sys
import os
import json
import math
from datetime import datetime, timedelta

# 解决 Windows 终端编码
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "public", "data")

def pearson_corr(x, y):
    n = min(len(x), len(y))
    if n < 2:
        return 0.0
    x_slice = x[:n]
    y_slice = y[:n]
    x_mean = sum(x_slice) / n
    y_mean = sum(y_slice) / n
    
    num = 0.0
    den_x = 0.0
    den_y = 0.0
    for i in range(n):
        dx = x_slice[i] - x_mean
        dy = y_slice[i] - y_mean
        num += dx * dy
        den_x += dx * dx
        den_y += dy * dy
        
    den = math.sqrt(den_x * den_y)
    if den == 0:
        return 0.0
    return num / den

def calc_returns(prices, period=1):
    returns = []
    if not prices or len(prices) <= period:
        return returns
    # 检查序列是否包含非正数（如化工加工亏损价差、利差）
    has_non_positive = any(p <= 0 for p in prices)
    if has_non_positive:
        # 对可能含负值的价差序列，使用一阶差分除以标准差标准化，避免负值分母导致收益率方向反转
        n = len(prices)
        mean_p = sum(prices) / n
        var_p = sum((p - mean_p) ** 2 for p in prices) / n
        std_p = math.sqrt(var_p) if var_p > 0 else 1.0
        scale = std_p if std_p > 1e-4 else 1.0
        for i in range(period, len(prices)):
            returns.append((prices[i] - prices[i - period]) / scale)
        return returns

    for i in range(period, len(prices)):
        prev = prices[i - period]
        if prev <= 0:
            returns.append(0.0)
        else:
            returns.append((prices[i] - prev) / prev)
    return returns

# 统一周频口径：股票为日K、商品 418 个周频 + 129 个日频。
# 原实现按"日期交集"对齐，导致日频商品的 52 窗口 = 52 个交易日(约 2.5 个月)，
# 周频商品的 52 窗口 = 52 周(1 年)，同一公司不同产品的统计区间不一致。
# 现统一重采样为 ISO 周最后一个观测值，再按周对齐。
WEEKS_PER_YEAR = 52
# 相关性窗口（周）：对应约 60 / 120 / 250 个交易日
CORR_WINDOWS = {"correlation60d": 12, "correlation120d": 24, "correlation250d": 52}
# 商品序列最新日期落后股票最新日期超过该天数，视为停更，不产生背离信号
STALE_DAYS = 35
# 副产品弹性放大仅对明确的副产物生效（避免"金"误匹配"金红石型钛白粉"等）
BYPRODUCT_KEYWORDS = ["硫酸", "黄金", "白银", "渣"]
SPREAD_KEYWORDS = ["价差", "利差", "剪刀差"]

def to_weekly(pts):
    """按 ISO 周取最后一个观测值，返回 {week_key: (date, value)}"""
    out = {}
    for p in pts:
        d, v = p.get("date"), p.get("value")
        if not d or v is None:
            continue
        y, w, _ = datetime.strptime(d[:10], "%Y-%m-%d").isocalendar()
        key = (y, w)
        if key not in out or d > out[key][0]:
            out[key] = (d, v)
    return out

def align_series(stock_pts, comm_pts):
    s_w = to_weekly(stock_pts)
    c_w = to_weekly(comm_pts)
    weeks = sorted(set(s_w) & set(c_w))
    aligned_s = [s_w[k][1] for k in weeks]
    aligned_c = [c_w[k][1] for k in weeks]
    # 日期取股票所在周的最后交易日，保证同一公司各产品日期口径一致
    dates = [s_w[k][0] for k in weeks]
    return aligned_s, aligned_c, dates

def main():
    print("=" * 70)
    print("【新研报投资逻辑驱动】全量141家上市公司背离信号与相关性矩阵计算")
    print(f"运行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    # 1. 加载基础数据
    with open(os.path.join(DATA_DIR, "companies.json"), "r", encoding="utf-8") as f:
        companies = json.load(f)
    with open(os.path.join(DATA_DIR, "commodity-prices.json"), "r", encoding="utf-8") as f:
        commodity_prices = json.load(f)
    with open(os.path.join(DATA_DIR, "stock-prices.json"), "r", encoding="utf-8") as f:
        stock_prices = json.load(f)

    all_signals = []
    all_correlations = []
    stale_skipped = []

    print(f"载入监控公司: {len(companies)} 家")
    print(f"载入商品序列: {len(commodity_prices)} 个")
    print(f"载入股票序列: {len(stock_prices)} 支")

    for comp in companies:
        code = comp["code"]
        name = comp["name"]
        formula_type = comp.get("formulaType", "price")
        rationale = comp.get("focusRationale", "")
        
        c_stock = stock_prices.get(code, [])
        if not c_stock or len(c_stock) < 30:
            continue
            
        # 根据公司的产品权重计算基本面综合序列，同时计算主打单品的指标
        profit_prods = comp.get("productsByProfit", []) or comp.get("productsByRevenue", [])
        if not profit_prods:
            continue
            
        for p in profit_prods:
            pname = p["productName"]
            ckey = p["commodityKey"]
            cname = p.get("commodityName", pname)
            pweight = p.get("weight", 1.0)
            
            c_comm = commodity_prices.get(ckey)
            if not c_comm or len(c_comm) < 30:
                continue
                
            aligned_s, aligned_c, dates = align_series(c_stock, c_comm)
            if len(aligned_s) < 25:
                continue
                
            # 周收益率相关性：12 / 24 / 52 周 ≈ 60 / 120 / 250 交易日
            s_ret = calc_returns(aligned_s)
            c_ret = calc_returns(aligned_c)
            
            corr_row = {}
            for field, w in CORR_WINDOWS.items():
                if len(s_ret) >= w:
                    corr_row[field] = round(pearson_corr(s_ret[-w:], c_ret[-w:]), 4)
                else:
                    corr_row[field] = round(pearson_corr(s_ret, c_ret), 4)
            
            all_correlations.append({
                "code": code,
                "name": name,
                "formulaType": formula_type,
                "productName": pname,
                "commodityName": cname,
                **corr_row,
                "lastUpdated": dates[-1]
            })

            # 停更保护：商品最新日期显著落后于股票最新日期，不产生背离信号
            stock_last = datetime.strptime(c_stock[-1]["date"][:10], "%Y-%m-%d")
            comm_last = datetime.strptime(c_comm[-1]["date"][:10], "%Y-%m-%d")
            if (stock_last - comm_last).days > STALE_DAYS:
                stale_skipped.append((code, ckey, c_comm[-1]["date"]))
                continue
            
            # 背离检测：按日历锚定统一 1 年窗口（股票最新日 - 364 天）
            # 原实现取"最近 N 个对齐点"，商品序列中间缺周时窗口会被拉长到一年以上，
            # 导致同一公司不同产品子项的股价涨跌幅不一致。
            window_start = (stock_last - timedelta(days=364)).strftime("%Y-%m-%d")
            idx = [i for i, d in enumerate(dates) if d >= window_start]
            if len(idx) < 15:
                continue
                
            recent_s = [aligned_s[i] for i in idx]
            recent_c = [aligned_c[i] for i in idx]
            recent_dates = [dates[i] for i in idx]
            
            # 股价区间涨跌幅：仅由股票自身周序列决定（公司内所有子项一致）
            s_weekly = sorted(to_weekly(c_stock).values())
            s_window = [v for d, v in s_weekly if d >= window_start]
            s_start, s_end = s_window[0], s_window[-1]
            s_start_date = next(d for d, _ in s_weekly if d >= window_start)
            c_start, c_end = recent_c[0], recent_c[-1]
            stock_cum = (s_end - s_start) / s_start if s_start else 0.0

            # 区分绝对价格与价差/加工费/零负值指标，防止分母崩溃与符号反转 (#01)
            is_spread_metric = (
                formula_type in ("spread", "processing_fee")
                or any(k in cname for k in SPREAD_KEYWORDS)
                or c_start <= 0
            )
            if is_spread_metric:
                c_delta = c_end - c_start
                # 使用历史滚动标准差进行量纲缩放映射 (1 个标准差改善对应约 15% 弹性变动)
                c_mean = sum(recent_c) / len(recent_c)
                c_var = sum((x - c_mean) ** 2 for x in recent_c) / len(recent_c)
                c_std = math.sqrt(c_var)
                if c_std > 1e-4:
                    comm_cum = (c_delta / c_std) * 0.15
                elif abs(c_mean) > 1e-4:
                    comm_cum = c_delta / abs(c_mean)
                else:
                    comm_cum = 0.0
            else:
                comm_cum = (c_end - c_start) / c_start if c_start > 0 else 0.0

            # 公式化逻辑调整：
            effective_comm_cum = comm_cum
            if formula_type == "byproduct_composite" and any(k in cname for k in BYPRODUCT_KEYWORDS):
                effective_comm_cum = comm_cum * 1.25
            elif formula_type == "spread" and any(k in cname for k in SPREAD_KEYWORDS):
                effective_comm_cum = comm_cum * 1.15

            r_s_ret = calc_returns(recent_s)
            r_c_ret = calc_returns(recent_c)
            recent_corr = pearson_corr(r_s_ret, r_c_ret)

            # 背离触发与连续分级 (消除集合漏斗死锁与断层 #03)
            diff_score = abs(effective_comm_cum - stock_cum)
            max_move = max(abs(stock_cum), abs(effective_comm_cum))

            # 变动显著性过滤：至少一方变动 >= 10% 且 差值 >= 10%
            if max_move >= 0.10 and diff_score >= 0.10:
                div_type = "positive" if effective_comm_cum > stock_cum else "negative"

                # 若方向相反，给予 1.15 倍反向共振加成
                is_opposite = (stock_cum * effective_comm_cum < 0)
                dir_bonus = 1.15 if is_opposite else 1.0
                effective_score = diff_score * dir_bonus

                strength = "strong" if effective_score >= 0.30 else ("medium" if effective_score >= 0.18 else "weak")

                # 计算对利润预期的理论影响 = 利润权重 * 商品/价差变动率
                profit_weight = pweight
                profit_impact = round(profit_weight * effective_comm_cum, 4)

                # 概率估算：基于滚动相关性强度与背离剪刀差幅度 (50% ~ 95%)
                prob = min(95.0, max(50.0, round(50.0 + 30.0 * abs(recent_corr) + 20.0 * min(1.0, effective_score), 1)))

                # 过滤微弱噪音，保留强背离与中等背离
                if strength in ["strong", "medium"]:
                    all_signals.append({
                        "code": code,
                        "name": name,
                        "formulaType": formula_type,
                        "focusRationale": rationale,
                        "productName": pname,
                        "commodityName": cname,
                        "profitWeight": round(profit_weight, 2),
                        "profitImpact": profit_impact,
                        "probability": prob,
                        "divergenceType": div_type,
                        "divergenceScore": round(diff_score, 3),
                        "correlation": round(recent_corr, 2),
                        "stockChange": round(stock_cum, 3),
                        "commodityChange": round(effective_comm_cum, 3),
                        "startDate": recent_dates[0],
                        "endDate": recent_dates[-1],
                        "signalStrength": strength
                    })

    # 按公司聚合：将同一公司下的多个细分产品信号汇总在一起，并保留细分子项 items
    company_groups = {}
    for s in all_signals:
        c_code = s["code"]
        if c_code not in company_groups:
            company_groups[c_code] = {
                "code": s["code"],
                "name": s["name"],
                "formulaType": s["formulaType"],
                "focusRationale": s["focusRationale"],
                "startDate": s["startDate"],
                "endDate": s["endDate"],
                "stockChange": s["stockChange"],
                "items": []
            }
        company_groups[c_code]["items"].append(s)

    # 计算公司层级的主导指标
    filtered_signals = []
    for c_code, g in company_groups.items():
        items = g["items"]
        # 按单项得分排序
        items.sort(key=lambda x: -x["divergenceScore"])
        top_item = items[0]
        
        # 综合背离类型：取最高权重或最高得分项的主导方向
        total_impact = round(sum(it["profitImpact"] for it in items), 4)
        avg_prob = round(sum(it["probability"] * it.get("profitWeight", 1.0) for it in items) / max(0.01, sum(it.get("profitWeight", 1.0) for it in items)), 1)
        max_score = top_item["divergenceScore"]
        top_strength = "strong" if any(it["signalStrength"] == "strong" for it in items) else "medium"
        
        company_signal = {
            "code": g["code"],
            "name": g["name"],
            "formulaType": g["formulaType"],
            "focusRationale": g["focusRationale"],
            "productName": top_item["productName"] if len(items) == 1 else f"{top_item['productName']} 等 {len(items)} 个产品",
            "commodityName": top_item["commodityName"] if len(items) == 1 else f"综合大宗基本面 ({len(items)}项)",
            "divergenceType": top_item["divergenceType"],
            "divergenceScore": max_score,
            "correlation": top_item["correlation"],
            "stockChange": g["stockChange"],
            "commodityChange": top_item["commodityChange"],
            "profitWeight": round(sum(it["profitWeight"] for it in items), 2),
            "profitImpact": total_impact,
            "probability": avg_prob,
            "startDate": g["startDate"],
            "endDate": g["endDate"],
            "signalStrength": top_strength,
            "items": [
                {
                    "productName": it["productName"],
                    "commodityName": it["commodityName"],
                    "profitWeight": it["profitWeight"],
                    "commodityChange": it["commodityChange"],
                    "stockChange": it["stockChange"],
                    "divergenceType": it["divergenceType"],
                    "divergenceScore": it["divergenceScore"],
                    "correlation": it["correlation"],
                    "profitImpact": it["profitImpact"],
                    "probability": it["probability"],
                    "signalStrength": it["signalStrength"]
                }
                for it in items
            ]
        }
        filtered_signals.append(company_signal)

    # 按信号强度与得分排序
    strength_map = {"strong": 0, "medium": 1, "weak": 2}
    filtered_signals.sort(key=lambda s: (strength_map.get(s["signalStrength"], 3), -s["divergenceScore"]))

    print(f"\n计算结果统计:")
    print(f"  多周期相关性记录: {len(all_correlations)} 条")
    print(f"  停更商品跳过背离检测: {len(stale_skipped)} 组 {stale_skipped[:5]}")
    print(f"  检出有效公司背离信号: {len(filtered_signals)} 家")
    print(f"    - 强背离 (Strong): {len([s for s in filtered_signals if s['signalStrength'] == 'strong'])} 家")
    print(f"    - 中等背离 (Medium): {len([s for s in filtered_signals if s['signalStrength'] == 'medium'])} 家")

    # 保存
    sig_file = os.path.join(DATA_DIR, "divergence-signals.json")
    with open(sig_file, "w", encoding="utf-8") as f:
        json.dump(filtered_signals, f, ensure_ascii=False, indent=2)
    print(f"  已更新: {sig_file}")

    corr_file = os.path.join(DATA_DIR, "correlations.json")
    with open(corr_file, "w", encoding="utf-8") as f:
        json.dump(all_correlations, f, ensure_ascii=False, indent=2)
    print(f"  已更新: {corr_file}")

    # 同步元数据：信号数量与股票最新日期（只重算信号时也保持勾稽6一致）
    src_file = os.path.join(DATA_DIR, "data-sources.json")
    if os.path.exists(src_file):
        with open(src_file, "r", encoding="utf-8") as f:
            sources = json.load(f)
        cov = sources.setdefault("databaseCoverage", {})
        cov["totalDivergenceSignals"] = len(filtered_signals)
        stock_dates = [pts[-1]["date"][:10] for pts in stock_prices.values() if pts]
        if stock_dates:
            cov["stockLatestDate"] = max(stock_dates)
        with open(src_file, "w", encoding="utf-8") as f:
            json.dump(sources, f, ensure_ascii=False, indent=2)
        print(f"  已同步: {src_file}")

    print("\n✅ 全量141家上市公司背离信号矩阵计算与验证完毕！")

if __name__ == "__main__":
    main()
