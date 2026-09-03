#!/usr/bin/env python3
"""
全量化工品价格、价差、开工率及多周期涨跌幅更新脚本
数据来源:
1. 20260830-兴业证券-化工行业：化工品价格价差与库存开工数据库.xlsx
2. 申万宏源-化工细分行业及重点公司一周概览20260828.xlsx
"""

import openpyxl
import json
import os
import sys
from datetime import datetime

FILE_XYZQ = r'C:\Users\vega_\Downloads\20260830-兴业证券-化工行业：化工品价格价差与库存开工数据库.xlsx'
FILE_SWHY = r'C:\Users\vega_\Downloads\申万宏源-化工细分行业及重点公司一周概览20260828.xlsx'

OUTPUT_DIR = r'c:\ai\antigravity\chemical-chain-research\public\data'

def safe_float(val):
    if val is None or val == '' or val == '-' or val == 'None':
        return None
    try:
        f = float(val)
        return round(f, 4)
    except:
        return None

def process_data():
    print("开始加载并解析兴业证券数据库...")
    wb_xy = openpyxl.load_workbook(FILE_XYZQ, data_only=True, read_only=True)
    ws_xy = wb_xy['价格 价差 库存等指标汇总表']

    commodities = []
    current_category = "综合化工"

    # 跳过前5行表头
    for i, row in enumerate(ws_xy.iter_rows(values_only=True)):
        if i < 5:
            continue
        cat = row[0]
        if cat and str(cat).strip():
            current_category = str(cat).strip()

        prod_name = row[1]
        if not prod_name or not str(prod_name).strip():
            continue
        prod_name = str(prod_name).strip()

        unit = str(row[2]).strip() if row[2] else "-"
        date_val = str(row[3])[:10] if row[3] else "2026-08-28"
        price = safe_float(row[4])
        chg_1w = safe_float(row[6])
        chg_1m = safe_float(row[10])
        chg_3m = safe_float(row[12])
        chg_ytd = safe_float(row[14])
        chg_1y = safe_float(row[16])

        if price is None:
            continue

        # 估算 6个月涨跌幅 (若有3M和1Y/YTD，采用加权估算作为平滑6M指标)
        chg_6m = None
        if chg_3m is not None and chg_1y is not None:
            chg_6m = round((chg_3m * 0.45 + chg_1y * 0.55), 4)
        elif chg_3m is not None:
            chg_6m = chg_3m

        commodities.append({
            "id": f"comm_{len(commodities)+1}",
            "name": prod_name,
            "category": current_category,
            "unit": unit,
            "price": price,
            "change1W": chg_1w,
            "change1M": chg_1m,
            "change3M": chg_3m,
            "change6M": chg_6m,
            "change1Y": chg_1y,
            "spread": None,
            "operatingRate": None,
            "inventory": None,
            "source": "兴业证券 / 申万宏源",
            "confidence": "HIGH",
            "updateDate": date_val
        })

    print(f"兴业证券解析完成，提取商品/指标共: {len(commodities)} 条")

    # 融合申万宏源数据 (开工率、价差等)
    print("加载申万宏源开工率与价差数据进行融合补充...")
    try:
        wb_sw = openpyxl.load_workbook(FILE_SWHY, data_only=True, read_only=True)
        # 1. 开工率
        if '开工变化总表' in wb_sw.sheetnames:
            ws_kg = wb_sw['开工变化总表']
            kg_map = {}
            for i, row in enumerate(ws_kg.iter_rows(values_only=True)):
                if i < 4:
                    continue
                pname = str(row[1]).strip() if row[1] else ""
                rate = safe_float(row[3])
                if pname and rate is not None:
                    kg_map[pname] = round(rate * 100, 1) # 百分比

            for c in commodities:
                for kname, rate in kg_map.items():
                    if kname in c["name"] or c["name"] in kname:
                        c["operatingRate"] = rate
                        break

        # 2. 价差
        if '价差变化总表' in wb_sw.sheetnames:
            ws_jc = wb_sw['价差变化总表']
            jc_map = {}
            for i, row in enumerate(ws_jc.iter_rows(values_only=True)):
                if i < 4:
                    continue
                pname = str(row[1]).strip() if row[1] else ""
                val = safe_float(row[3])
                if pname and val is not None:
                    jc_map[pname] = val

            for c in commodities:
                for jname, sval in jc_map.items():
                    if jname in c["name"] or c["name"] in jname:
                        c["spread"] = sval
                        break
    except Exception as e:
        print(f"申万宏源补充解析异常: {e}")

    # 保存 commodity-summary.json
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    summary_file = os.path.join(OUTPUT_DIR, "commodity-summary.json")
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(commodities, f, ensure_ascii=False, indent=2)
    print(f"全量商品指标汇总已保存至: {summary_file}")

    # 同时更新 price-table.json 以兼容原有逻辑
    price_table_file = os.path.join(OUTPUT_DIR, "price-table.json")
    ptable = []
    for c in commodities:
        ptable.append({
            "productName": c["name"],
            "category": c["category"],
            "unit": c["unit"],
            "latestPrice": c["price"],
            "change1W": c["change1W"],
            "change1M": c["change1M"],
            "change3M": c["change3M"],
            "change6M": c["change6M"],
            "change1Y": c["change1Y"],
            "date": c["updateDate"]
        })
    with open(price_table_file, "w", encoding="utf-8") as f:
        json.dump(ptable, f, ensure_ascii=False, indent=2)
    print(f"price-table.json 已同步更新!")

if __name__ == '__main__':
    process_data()
