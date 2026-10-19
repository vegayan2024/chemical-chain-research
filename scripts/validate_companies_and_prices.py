import json
import os

with open("public/data/companies.json", "r", encoding="utf-8") as f:
    comps = json.load(f)

with open("public/data/commodity-prices.json", "r", encoding="utf-8") as f:
    commodities = json.load(f)

print(f"Validating {len(comps)} companies...")
missing_keys = []
weight_errors = []

for c in comps:
    code = c["code"]
    name = c["name"]
    # Check revenue products
    rev_w = 0.0
    for p in c.get("productsByRevenue", []):
        ck = p.get("commodityKey")
        if ck not in commodities:
            missing_keys.append((code, name, "revenue", ck))
        rev_w += p.get("weight", 0)
    
    # Check profit products
    prf_w = 0.0
    for p in c.get("productsByProfit", []):
        ck = p.get("commodityKey")
        if ck not in commodities:
            missing_keys.append((code, name, "profit", ck))
        prf_w += p.get("weight", 0)
        
    if abs(rev_w - 1.0) > 0.05:
        weight_errors.append((code, name, "rev_w", rev_w))
    if abs(prf_w - 1.0) > 0.05:
        weight_errors.append((code, name, "prf_w", prf_w))

print(f"Missing commodity keys: {len(missing_keys)}")
if missing_keys:
    print("Sample missing keys:", missing_keys[:5])
print(f"Weight errors: {len(weight_errors)}")
if weight_errors:
    print("Sample weight errors:", weight_errors[:5])

# Update company-latest-prices.json
latest_prices = {}
for c in comps:
    code = c["code"]
    c_prices = []
    seen = set()
    for p in c.get("productsByProfit", []) + c.get("productsByRevenue", []):
        ck = p.get("commodityKey")
        pname = p.get("productName")
        if ck in commodities and ck not in seen:
            seen.add(ck)
            series = commodities[ck].get("data", [])
            if series:
                last_pt = series[-1]
                prev_pt = series[-2] if len(series) > 1 else last_pt
                chg = ((last_pt["value"] - prev_pt["value"]) / prev_pt["value"] * 100) if prev_pt["value"] else 0.0
                c_prices.append({
                    "productName": pname,
                    "commodityKey": ck,
                    "price": last_pt["value"],
                    "unit": commodities[ck].get("unit", "元/吨"),
                    "date": last_pt["date"],
                    "change": round(chg, 2)
                })
    latest_prices[code] = c_prices

with open("public/data/company-latest-prices.json", "w", encoding="utf-8") as f:
    json.dump(latest_prices, f, ensure_ascii=False, indent=2)

print(f"Updated company-latest-prices.json for {len(latest_prices)} companies!")
