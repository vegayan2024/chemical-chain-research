# -*- coding: utf-8 -*-
"""
Sync 141 stock kline series from terminal repo into local public/data/stock-prices.json
"""

import os
import json

TERM_MARKET_DIR = r"C:\Users\vega_\Documents\GitHub\terminal\public\data\market"
OUTPUT_FILE = "public/data/stock-prices.json"
COMPANIES_FILE = "public/data/companies.json"

with open(COMPANIES_FILE, "r", encoding="utf-8") as f:
    companies = json.load(f)

print(f"Syncing stock price series for {len(companies)} companies...")

stock_prices_dict = {}
success_count = 0
missing_count = 0

for c in companies:
    code = c["code"]
    kline_path = os.path.join(TERM_MARKET_DIR, f"{code}.kline.json")
    if not os.path.exists(kline_path):
        # try without .SZ/.SH
        pure = code.split(".")[0]
        for f in os.listdir(TERM_MARKET_DIR):
            if f.startswith(pure) and f.endswith(".kline.json"):
                kline_path = os.path.join(TERM_MARKET_DIR, f)
                break
                
    if os.path.exists(kline_path):
        with open(kline_path, "r", encoding="utf-8") as kf:
            kdata = json.load(kf)
            
        periods = kdata.get("periods", {})
        daily = periods.get("daily", [])
        if not daily:
            daily = periods.get("weekly", [])
            
        if daily:
            # take daily close prices
            pts = []
            for d in daily:
                dt = d.get("date")
                val = d.get("close")
                if dt and val is not None:
                    pts.append({"date": dt, "value": float(val)})
            pts.sort(key=lambda x: x["date"])
            stock_prices_dict[code] = pts
            success_count += 1
        else:
            missing_count += 1
    else:
        missing_count += 1

print(f"Successfully processed {success_count} / {len(companies)} stocks. (Missing: {missing_count})")

with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
    json.dump(stock_prices_dict, out, ensure_ascii=False)

print(f"Saved complete stock prices to {OUTPUT_FILE} (size: {os.path.getsize(OUTPUT_FILE) / 1024 / 1024:.2f} MB)")
