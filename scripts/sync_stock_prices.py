#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
动态股票行情同步与指标计算引擎 (Dynamic Stock Price Synchronizer & Indicator Engine)
=============================================================================
金融数据源降级链条：
  1. TuShare Pro (若配置 TUSHARE_TOKEN 优先调用)
  2. AKShare (开源多通道直连：A股 stock_zh_a_hist / 港股 stock_hk_hist)
  3. Terminal 仓库本地缓存兜底

特性：
  - 智能增量更新：自动检测本地时序最新日期，仅拉取最新日期至今天的增量数据，毫秒级合并；
  - 自动全量补全：若标的缺失，从 2021-01-01 起拉取完整时序；
  - 级联动态计算：支持 --recalc 参数，股票数据落地后自动触发基本面背离指标与相关性矩阵重算。
"""

import os
import sys
import json
import argparse
import subprocess
from datetime import datetime, timedelta

# 控制台编码防乱码
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "public", "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "stock-prices.json")
COMPANIES_FILE = os.path.join(DATA_DIR, "companies.json")
TERM_MARKET_DIR = r"C:\Users\vega_\Documents\GitHub\terminal\public\data\market"

# 初始化数据源
TUSHARE_TOKEN = os.environ.get("TUSHARE_TOKEN", "").strip()
ts_pro = None
if TUSHARE_TOKEN:
    try:
        import tushare as ts
        ts.set_token(TUSHARE_TOKEN)
        ts_pro = ts.pro_api()
    except Exception as e:
        print(f"⚠️ TuShare 初始化失败，将降级至 AKShare: {e}")

try:
    import akshare as ak
except ImportError:
    ak = None

def fetch_kline_tushare(code: str, start_date: str, end_date: str):
    """从 TuShare 获取前复权日 K 线"""
    if not ts_pro:
        return None
    try:
        # code 如 "600309.SH", "000519.SZ"
        ts_code = code
        if "HK" in code:
            pure = "".join(filter(str.isdigit, code))
            ts_code = f"{pure.zfill(5)}.HK"
            df = ts_pro.hk_daily(ts_code=ts_code, start_date=start_date, end_date=end_date)
        else:
            df = ts_pro.daily(ts_code=ts_code, start_date=start_date, end_date=end_date)
        
        if df is not None and not df.empty:
            df = df.sort_values("trade_date")
            pts = []
            for _, row in df.iterrows():
                d_str = str(row["trade_date"])
                dt = f"{d_str[:4]}-{d_str[4:6]}-{d_str[6:]}"
                pts.append({"date": dt, "value": round(float(row["close"]), 3)})
            return pts
    except Exception as e:
        # 降级
        pass
    return None

def fetch_kline_akshare(code: str, start_date: str, end_date: str):
    """从 AKShare 获取前复权日 K 线"""
    if not ak:
        return None
    try:
        pure_digits = "".join(filter(str.isdigit, code))
        if "HK" in code:
            symbol = pure_digits.zfill(5)
            df = ak.stock_hk_hist(symbol=symbol, period="daily", start_date=start_date, end_date=end_date, adjust="qfq")
            date_col, close_col = "日期", "收盘"
        else:
            symbol = pure_digits.zfill(6)
            df = ak.stock_zh_a_hist(symbol=symbol, period="daily", start_date=start_date, end_date=end_date, adjust="qfq")
            date_col, close_col = "日期", "收盘"

        if df is not None and not df.empty:
            df = df.sort_values(date_col)
            pts = []
            for _, row in df.iterrows():
                dt = str(row[date_col])[:10]
                val = float(row[close_col])
                pts.append({"date": dt, "value": round(val, 3)})
            return pts
    except Exception as e:
        pass
    return None

def fetch_kline_terminal_local(code: str):
    """从 terminal 目录历史快照兜底读取"""
    if not os.path.exists(TERM_MARKET_DIR):
        return None
    kline_path = os.path.join(TERM_MARKET_DIR, f"{code}.kline.json")
    if not os.path.exists(kline_path):
        pure = code.split(".")[0]
        for f in os.listdir(TERM_MARKET_DIR):
            if f.startswith(pure) and f.endswith(".kline.json"):
                kline_path = os.path.join(TERM_MARKET_DIR, f)
                break
    if os.path.exists(kline_path):
        try:
            with open(kline_path, "r", encoding="utf-8") as kf:
                kdata = json.load(kf)
            daily = kdata.get("periods", {}).get("daily", [])
            pts = []
            for d in daily:
                dt = d.get("date")
                val = d.get("close")
                if dt and val is not None:
                    pts.append({"date": dt, "value": float(val)})
            pts.sort(key=lambda x: x["date"])
            return pts
        except Exception:
            return None
    return None

def sync_stock_prices(force_full: bool = False):
    print("=" * 70)
    print("【动态股票行情同步】基于 TuShare Pro -> AKShare 降级链条动态拉取")
    print(f"执行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    with open(COMPANIES_FILE, "r", encoding="utf-8") as f:
        companies = json.load(f)

    # 1. 读取本地现有基准数据
    existing_data = {}
    if os.path.exists(OUTPUT_FILE) and not force_full:
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
            print(f"✔ 载入本地现有股票数据: {len(existing_data)} 支标的")
        except Exception:
            existing_data = {}

    today_str = datetime.now().strftime("%Y%m%d")
    today_iso = datetime.now().strftime("%Y-%m-%d")

    stock_prices_dict = {}
    updated_count = 0
    full_count = 0
    fail_count = 0

    print(f"开始同步 {len(companies)} 家上市公司股票日K线...")

    for i, comp in enumerate(companies, 1):
        code = comp["code"]
        name = comp["name"]

        local_pts = existing_data.get(code, [])
        need_full = force_full or (len(local_pts) < 30)

        pts = None
        source_tag = ""

        if not need_full:
            # 增量拉取
            last_date = local_pts[-1]["date"]
            if last_date >= today_iso:
                # 已经是最新
                stock_prices_dict[code] = local_pts
                continue
            
            # 从 last_date 后一天开始拉取
            start_dt = datetime.strptime(last_date[:10], "%Y-%m-%d") + timedelta(days=1)
            start_str = start_dt.strftime("%Y%m%d")

            # 1. 尝试 TuShare
            new_pts = fetch_kline_tushare(code, start_str, today_str)
            if new_pts:
                source_tag = "TuShare"
            else:
                # 2. 尝试 AKShare
                new_pts = fetch_kline_akshare(code, start_str, today_str)
                if new_pts:
                    source_tag = "AKShare"

            if new_pts:
                # 合并增量
                date_set = {p["date"]: p["value"] for p in local_pts}
                for np in new_pts:
                    date_set[np["date"]] = np["value"]
                merged = [{"date": d, "value": v} for d, v in sorted(date_set.items())]
                stock_prices_dict[code] = merged
                updated_count += 1
                if i % 20 == 0 or i == len(companies):
                    print(f"  [{i}/{len(companies)}] 增量同步 {code} {name}: 追加 {len(new_pts)} 个交易日至 {merged[-1]['date']} ({source_tag})")
            else:
                # 未获取到新增（可能是周末或休市），保留本地
                stock_prices_dict[code] = local_pts
        else:
            # 全量拉取
            start_str = "20210101"
            # 1. 尝试 TuShare
            pts = fetch_kline_tushare(code, start_str, today_str)
            if pts:
                source_tag = "TuShare"
            else:
                # 2. 尝试 AKShare
                pts = fetch_kline_akshare(code, start_str, today_str)
                if pts:
                    source_tag = "AKShare"
                else:
                    # 3. 本地兜底
                    pts = fetch_kline_terminal_local(code)
                    if pts:
                        source_tag = "Terminal-Local"

            if pts and len(pts) >= 30:
                stock_prices_dict[code] = pts
                full_count += 1
                print(f"  [{i}/{len(companies)}] 全量同步 {code} {name}: 共 {len(pts)} 交易日 ({source_tag})")
            else:
                # 回退原数据
                if local_pts:
                    stock_prices_dict[code] = local_pts
                else:
                    fail_count += 1
                    print(f"  ❌ [{i}/{len(companies)}] 失败: 未能获取 {code} {name} 行情时序")

    # 写入文件
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        json.dump(stock_prices_dict, out, ensure_ascii=False)

    max_date = max((pts[-1]["date"] for pts in stock_prices_dict.values() if pts), default="N/A")
    file_size_mb = os.path.getsize(OUTPUT_FILE) / 1024 / 1024

    print("\n" + "=" * 70)
    print(f"✅ 股票行情同步完成:")
    print(f"  纳管公司: {len(stock_prices_dict)} / {len(companies)} 家")
    print(f"  增量更新: {updated_count} 支 | 全量刷新: {full_count} 支 | 失败: {fail_count} 支")
    print(f"  最新行情推进至: {max_date}")
    print(f"  已保存至: {OUTPUT_FILE} (文件大小: {file_size_mb:.2f} MB)")
    print("=" * 70)

    return True

def trigger_indicator_recalc():
    """触发动态指标重算引擎"""
    print("\n▶ 正在触发基本面背离信号与相关性矩阵动态重算...")
    calc_script = os.path.join(PROJECT_ROOT, "scripts", "calculate_fundamental_divergence.py")
    ret = subprocess.run([sys.executable, calc_script], cwd=PROJECT_ROOT)
    if ret.returncode == 0:
        print("✔ 基本面指标与相关性矩阵已动态更新完毕！")
        return True
    else:
        print(f"❌ 指标重算失败，返回码: {ret.returncode}")
        return False

def main():
    parser = argparse.ArgumentParser(description="动态股票行情同步与指标计算引擎")
    parser.add_argument("--full", action="store_true", help="强制从头全量拉取而非增量更新")
    parser.add_argument("--recalc", action="store_true", help="行情同步完成后自动触发背离指标重算")
    args = parser.parse_args()

    success = sync_stock_prices(force_full=args.full)
    if success and args.recalc:
        trigger_indicator_recalc()

if __name__ == "__main__":
    main()
