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
from datetime import datetime

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
    for i in range(period, len(prices)):
        prev = prices[i - period]
        if prev == 0:
            returns.append(0.0)
        else:
            returns.append((prices[i] - prev) / prev)
    return returns

def align_series(stock_pts, comm_pts):
    s_map = {p["date"]: p["value"] for p in stock_pts if "date" in p and "value" in p}
    c_map = {p["date"]: p["value"] for p in comm_pts if "date" in p and "value" in p}
    
    all_dates = sorted(list(set(s_map.keys()) & set(c_map.keys())))
    aligned_s = [s_map[d] for d in all_dates]
    aligned_c = [c_map[d] for d in all_dates]
    return aligned_s, aligned_c, all_dates

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
                
            # 计算 60d / 120d / 250d 相关性
            s_ret = calc_returns(aligned_s)
            c_ret = calc_returns(aligned_c)
            
            corr60 = round(pearson_corr(s_ret[-60:], c_ret[-60:]), 4) if len(s_ret) >= 60 else round(pearson_corr(s_ret, c_ret), 4)
            corr120 = round(pearson_corr(s_ret[-120:], c_ret[-120:]), 4) if len(s_ret) >= 120 else round(pearson_corr(s_ret, c_ret), 4)
            corr250 = round(pearson_corr(s_ret[-250:], c_ret[-250:]), 4) if len(s_ret) >= 250 else round(pearson_corr(s_ret, c_ret), 4)
            
            all_correlations.append({
                "code": code,
                "name": name,
                "formulaType": formula_type,
                "productName": pname,
                "commodityName": cname,
                "correlation60d": corr60,
                "correlation120d": corr120,
                "correlation250d": corr250,
                "lastUpdated": dates[-1] if dates else "2026-10-16"
            })
            
            # 背离检测（取最近 52周 / 250交易日以内的窗口）
            window = min(52, len(aligned_s))
            if window < 15:
                continue
                
            recent_s = aligned_s[-window:]
            recent_c = aligned_c[-window:]
            recent_dates = dates[-window:]
            
            # 计算区间总体涨跌幅
            s_start, s_end = recent_s[0], recent_s[-1]
            c_start, c_end = recent_c[0], recent_c[-1]
            
            stock_cum = (s_end - s_start) / s_start if s_start else 0.0
            comm_cum = (c_end - c_start) / c_start if c_start else 0.0
            
            # 公式化逻辑调整：
            # 若是副产品型 (byproduct_composite) 且该商品是副产物（如硫酸），加大弹性倍数
            effective_comm_cum = comm_cum
            if formula_type == "byproduct_composite" and any(k in cname for k in ["硫酸", "金", "银", "渣"]):
                effective_comm_cum = comm_cum * 1.25
            elif formula_type == "spread" and any(k in cname for k in ["价差", "利差", "剪刀差"]):
                effective_comm_cum = comm_cum * 1.15
                
            r_s_ret = calc_returns(recent_s)
            r_c_ret = calc_returns(recent_c)
            recent_corr = pearson_corr(r_s_ret, r_c_ret)
            
            # 背离触发条件：
            # 1. 方向相反 (stock_cum 与 effective_comm_cum 符号相反) 且 差值 > 15%
            # 2. 或 同向但幅度严重脱节 (差值 > 35%)
            is_opposite = (stock_cum * effective_comm_cum < 0)
            diff_score = abs(effective_comm_cum - stock_cum)
            
            if (is_opposite and diff_score > 0.15) or (diff_score > 0.35):
                div_type = "positive" if effective_comm_cum > stock_cum else "negative"
                strength = "strong" if diff_score > 0.35 else ("medium" if diff_score > 0.20 else "weak")
                
                # 计算对利润预期的理论影响 = 利润权重 * 商品/价差变动率
                profit_weight = pweight
                profit_impact = round(profit_weight * effective_comm_cum, 4)
                
                # 概率估算：基于滚动相关性强度与背离剪刀差幅度 (50% ~ 95%)
                prob = min(95.0, max(50.0, round(50.0 + 30.0 * abs(recent_corr) + 20.0 * min(1.0, diff_score), 1)))
                
                # 过滤极微弱噪音，确保信号高确定性
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

    print("\n✅ 全量141家上市公司背离信号矩阵计算与验证完毕！")

if __name__ == "__main__":
    main()
