import os
import json
import re

term_root = r"C:\Users\vega_\Documents\GitHub\terminal"

# Load local companies
with open("public/data/companies.json", "r", encoding="utf-8") as f:
    local_comps = json.load(f)
local_codes = {c["code"]: c for c in local_comps}
print(f"Current local companies: {len(local_comps)}")

# Load terminal product map
with open("scripts/terminal_product_map.json", "r", encoding="utf-8") as f:
    term_prod_map = json.load(f)
print(f"Terminal product map companies: {len(term_prod_map)}")

# Load terminal shelf data
with open(os.path.join(term_root, "src/data/report-shelf-data.ts"), "r", encoding="utf-8") as f:
    shelf_text = f.read()
m = re.search(r"export const REPORT_SHELF_DATA:\s*ReportItem\[\]\s*=\s*(\[[\s\S]*?\]);", shelf_text)
shelf_data = json.loads(m.group(1)) if m else []
shelf_map = {}
for s in shelf_data:
    code = s.get("stockCode", "").strip()
    if code and code not in shelf_map:
        shelf_map[code] = s
print(f"Terminal shelf companies: {len(shelf_map)}")

# Load commodity prices keys
with open("public/data/commodity-prices.json", "r", encoding="utf-8") as f:
    comm_prices = json.load(f)
comm_keys = set(comm_prices.keys())
print(f"Available commodity keys in database: {len(comm_keys)}")

# Load all facts
facts_dir = os.path.join(term_root, "public/data/industries")
facts_map = {}
for fname in os.listdir(facts_dir):
    if fname.startswith("company-") and fname.endswith(".facts.json"):
        pcode = fname.replace("company-", "").replace(".facts.json", "")
        with open(os.path.join(facts_dir, fname), "r", encoding="utf-8") as ff:
            facts_map[pcode] = json.load(ff)
print(f"Terminal facts files: {len(facts_map)}")

# Check overlap of missing companies with shelf / facts / product_map
all_term_codes = set()
for s in shelf_map.keys():
    all_term_codes.add(s)
for p in term_prod_map.keys():
    all_term_codes.add(p)
for pcode in facts_map.keys():
    suffix = ".SH" if pcode.startswith("6") else (".SZ" if pcode.startswith(("0", "3")) else (".BJ" if pcode.startswith(("8", "4", "9")) else ""))
    if suffix:
        all_term_codes.add(f"{pcode}{suffix}")
    else:
        all_term_codes.add(pcode)

print(f"Total unified terminal companies: {len(all_term_codes)}")
missing = [c for c in sorted(all_term_codes) if c not in local_codes]
print(f"Missing from current local companies: {len(missing)}")

# Analyze each missing company's metadata availability
coverage = {
    "has_prod_map": 0,
    "has_shelf": 0,
    "has_facts": 0,
    "has_prod_map_and_shelf": 0
}

detailed_missing = []
for c in missing:
    pcode = c.split(".")[0]
    has_pm = c in term_prod_map
    has_sh = c in shelf_map
    has_fc = pcode in facts_map
    if has_pm: coverage["has_prod_map"] += 1
    if has_sh: coverage["has_shelf"] += 1
    if has_fc: coverage["has_facts"] += 1
    if has_pm and has_sh: coverage["has_prod_map_and_shelf"] += 1

    sh_item = shelf_map.get(c, {})
    fc_item = facts_map.get(pcode, {})
    pm_items = term_prod_map.get(c, [])

    # Check commodity keys match rate
    matched_pm = []
    for p in pm_items:
        sk = p.get("sourceKey", "")
        matched = sk in comm_keys
        matched_pm.append({
            "displayName": p.get("displayName"),
            "sourceKey": sk,
            "in_db": matched
        })

    comp_name = sh_item.get("companyName")
    if not comp_name:
        parts = fc_item.get("name", "").split()
        comp_name = parts[0] if parts else c

    detailed_missing.append({
        "code": c,
        "name": comp_name,
        "industryKey": sh_item.get("industryKey") or "chemical",
        "industryLabel": sh_item.get("industryLabel") or "化工",
        "category": sh_item.get("category") or "",
        "summary": sh_item.get("summary") or fc_item.get("summary", ""),
        "keyPoints": fc_item.get("keyPoints", []),
        "has_pm": has_pm,
        "pm_items": matched_pm
    })

print(f"Coverage stats for {len(missing)} missing companies:")
print(json.dumps(coverage, indent=2))

with open("scripts/detailed_missing_companies.json", "w", encoding="utf-8") as out:
    json.dump(detailed_missing, out, ensure_ascii=False, indent=2)

print("Saved scripts/detailed_missing_companies.json")
