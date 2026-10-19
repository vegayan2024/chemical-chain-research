#!/usr/bin/env python3
"""
基于新研报投资逻辑与最新大宗价格/价差数据的背离信号计算引擎
数据逻辑：
1. 公司盈利逻辑与产品价格/价差一一对齐
2. 计算股票价格与商品价格/价差的 52周滑动相关性与动态阈值
3. 检测股价滞后于基本面（正向背离/积极）与股价透支基本面（负向背离/谨慎）
4. 输出至 public/data/divergence-signals.json 和 public/data/correlations.json
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
    # stock_pts: [{"date": ..., "value": ...}], comm_pts: [{"date": ..., "value": ...}]
    s_map = {p["date"]: p["value"] for p in stock_pts if "date" in p and "value" in p}
    c_map = {p["date"]: p["value"] for p in comm_pts if "date" in p and "value" in p}
    
    all_dates = sorted(list(set(s_map.keys()) & set(c_map.keys())))
    aligned_s = [s_map[d] for d in all_dates]
    aligned_c = [c_map[d] for d in all_dates]
    return aligned_s, aligned_c, all_dates

def main():
    print("=" * 60)
    print("开始基于新研报投资逻辑与最新价格价差计算背离信号...")
    print(f"运行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # 1. 加载基础数据
    with open(os.path.join(DATA_DIR, "companies.json"), "r", encoding="utf-8") as f:
        companies = json.load(f)
    with open(os.path.join(DATA_DIR, "commodity-prices.json"), "r", encoding="utf-8") as f:
        commodity_prices = json.load(f)
    with open(os.path.join(DATA_DIR, "stock-prices.json"), "r", encoding="utf-8") as f:
        stock_prices = json.load(f)

    all_signals = []
    all_correlations = []

    print(f"载入公司数: {len(companies)}, 商品价格序列数: {len(commodity_prices)}, 股票序列数: {len(stock_prices)}")

    for comp in companies:
        code = comp["code"]
        name = comp["name"]
        
        c_stock = stock_prices.get(code, [])
        if not c_stock or len(c_stock) < 30:
            continue
            
        # 遍历公司主营产品
        for p in comp.get("productsByRevenue", []):
            pname = p["productName"]
            ckey = p["commodityKey"]
            cname = p.get("commodityName", pname)
            
            # 兼容 key
            c_comm = commodity_prices.get(ckey)
            if not c_comm:
                # 尝试纯品名查找
                plain_k = ckey.replace("xyzq:price:", "").replace("cj:price:", "").replace("lme:price:", "")
                c_comm = commodity_prices.get(f"xyzq:price:{plain_k}") or commodity_prices.get(plain_k)
                
            if not c_comm or len(c_comm) < 30:
                continue
                
            aligned_s, aligned_c, dates = align_series(c_stock, c_comm)
            if len(aligned_s) < 30:
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
                "productName": pname,
                "commodityName": cname,
                "correlation60d": corr60,
                "correlation120d": corr120,
                "correlation250d": corr250,
                "lastUpdated": dates[-1] if dates else "2026-10-16"
            })
            
            # 背离检测（取最近 52周 / 250交易日以内的窗口）
            window = min(52, len(aligned_s))
            if window < 20:
                continue
                
            recent_s = aligned_s[-window:]
            recent_c = aligned_c[-window:]
            recent_dates = dates[-window:]
            
            r_s_ret = calc_returns(recent_s)
            r_c_ret = calc_returns(recent_c)
            
            stock_cum = sum(r_s_ret)
            comm_cum = sum(r_c_ret)
            recent_corr = pearson_corr(r_s_ret, r_c_ret)
            
            # 背离触发条件：相关性解耦或方向相反，且变动幅度显著
            is_opposite = (stock_cum * comm_cum < 0)
            diff_score = abs(stock_cum - comm_cum)
            
            if is_opposite and diff_score > 0.15:
                div_type = "positive" if comm_cum > stock_cum else "negative"
                strength = "strong" if diff_score > 0.35 else ("medium" if diff_score > 0.22 else "weak")
                
                all_signals.append({
                    "code": code,
                    "name": name,
                    "productName": pname,
                    "commodityName": cname,
                    "divergenceType": div_type,
                    "divergenceScore": round(diff_score, 3),
                    "correlation": round(recent_corr, 2),
                    "stockChange": round(stock_cum, 3),
                    "commodityChange": round(comm_cum, 3),
                    "startDate": recent_dates[0],
                    "endDate": recent_dates[-1],
                    "signalStrength": strength
                })

    # 按信号强度排序
    strength_map = {"strong": 0, "medium": 1, "weak": 2}
    all_signals.sort(key=lambda s: (strength_map.get(s["signalStrength"], 3), -s["divergenceScore"]))

    print(f"\n计算结果统计:")
    print(f"  相关性记录: {len(all_correlations)} 条")
    print(f"  检出背离信号: {len(all_signals)} 条 (强信号: {len([s for s in all_signals if s['signalStrength'] == 'strong'])} 条, 中等: {len([s for s in all_signals if s['signalStrength'] == 'medium'])} 条)")

    # 保存
    sig_file = os.path.join(DATA_DIR, "divergence-signals.json")
    with open(sig_file, "w", encoding="utf-8") as f:
        json.dump(all_signals, f, ensure_ascii=False, indent=2)
    print(f"  已更新: {sig_file}")

    corr_file = os.path.join(DATA_DIR, "correlations.json")
    with open(corr_file, "w", encoding="utf-8") as f:
        json.dump(all_correlations, f, ensure_ascii=False, indent=2)
    print(f"  已更新: {corr_file}")

    print("\n✅ 背离信号与多周期相关性矩阵计算完毕！")

if __name__ == "__main__":
    main()
