#!/usr/bin/env python3
"""
AKShare 大宗化工商品及主力期货行情采集脚本
信源等级: HIGH (高置信度, 权威开源大宗金融数据)
"""

import json
import os
import sys
from datetime import datetime
import akshare as ak

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, "public", "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "akshare-commodity-prices.json")

# 重点化工品映射与合约代码
CHEMICAL_FUTURES_MAPPING = {
    "纯碱": {"symbol": "SA0", "name": "纯碱主力", "unit": "元/吨"},
    "PVC": {"symbol": "V0", "name": "聚氯乙烯主力", "unit": "元/吨"},
    "甲醇": {"symbol": "MA0", "name": "甲醇主力", "unit": "元/吨"},
    "尿素": {"symbol": "UR0", "name": "尿素主力", "unit": "元/吨"},
    "烧碱": {"symbol": "SH0", "name": "烧碱主力", "unit": "元/吨"},
    "工业硅": {"symbol": "SI0", "name": "工业硅主力", "unit": "元/吨"},
    "乙二醇": {"symbol": "EG0", "name": "乙二醇主力", "unit": "元/吨"},
    "苯乙烯": {"symbol": "EB0", "name": "苯乙烯主力", "unit": "元/吨"},
}

def fetch_futures_data():
    """获取主力期货行情与基差数据"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 启动 AKShare 高置信度行情同步...")
    results = {}

    for name, item in CHEMICAL_FUTURES_MAPPING.items():
        symbol = item["symbol"]
        try:
            print(f"正在从 AKShare 抓取 [{name}] (主力合约: {symbol})...")
            # 获取日线历史行情
            df = ak.futures_main_sina(symbol=symbol)
            if df is not None and not df.empty:
                # 统一字段
                df = df.tail(120) # 最近半个自然年
                series = []
                for _, row in df.iterrows():
                    d_str = str(row["日期"])[:10]
                    series.append({
                        "date": d_str,
                        "value": float(row["收盘价"]),
                        "source": "AKShare",
                        "confidence": "HIGH"
                    })
                results[name] = {
                    "commodityName": name,
                    "futuresSymbol": symbol,
                    "unit": item["unit"],
                    "source": "AKShare",
                    "confidence": "HIGH",
                    "confidenceScore": 96,
                    "lastUpdated": datetime.now().strftime("%Y-%m-%d"),
                    "data": series
                }
                print(f"成功获取 [{name}]: {len(series)} 个价格点")
        except Exception as e:
            print(f"获取 [{name}] 失败: {e}", file=sys.stderr)

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"AKShare 高置信度数据已写入: {OUTPUT_FILE}")

if __name__ == "__main__":
    fetch_futures_data()
