import os
import json
import re

term_root = r"C:\Users\vega_\Documents\GitHub\terminal"
shelf_file = os.path.join(term_root, "src/data/report-shelf-data.ts")
facts_dir = os.path.join(term_root, "public/data/industries")
cur_companies_file = "public/data/companies.json"
comm_prices_file = "public/data/commodity-prices.json"

# 1. Load current companies
with open(cur_companies_file, "r", encoding="utf-8") as f:
    cur_comps = json.load(f)
cur_codes = {c["code"]: c for c in cur_comps}
print(f"Current companies count: {len(cur_comps)}")

# 2. Load available commodity keys
with open(comm_prices_file, "r", encoding="utf-8") as f:
    comm_prices = json.load(f)
comm_keys = list(comm_prices.keys())
print(f"Available commodity keys: {len(comm_keys)}")

# 3. Load shelf data
with open(shelf_file, "r", encoding="utf-8") as f:
    shelf_text = f.read()
m = re.search(r"export const REPORT_SHELF_DATA:\s*ReportItem\[\]\s*=\s*(\[[\s\S]*?\]);", shelf_text)
shelf_data = json.loads(m.group(1)) if m else []
shelf_by_code = {}
for s in shelf_data:
    c = s.get("stockCode", "").strip()
    if c:
        shelf_by_code[c] = s
print(f"Shelf companies count: {len(shelf_by_code)}")

# 4. Load terminal product map
term_prod_map = {}
prod_map_file = "scripts/terminal_product_map.json"
if os.path.exists(prod_map_file):
    with open(prod_map_file, "r", encoding="utf-8") as f:
        term_prod_map = json.load(f)
print(f"Terminal product map items: {len(term_prod_map)}")

# 5. Load all facts files
all_facts = {}
for fname in os.listdir(facts_dir):
    if fname.startswith("company-") and fname.endswith(".facts.json"):
        pcode = fname.replace("company-", "").replace(".facts.json", "")
        with open(os.path.join(facts_dir, fname), "r", encoding="utf-8") as ff:
            all_facts[pcode] = json.load(ff)
print(f"Facts files count: {len(all_facts)}")

# Let's inspect facts files that are NOT in cur_comps
missing_facts = []
for pcode, fact in all_facts.items():
    suffix = ".SH" if pcode.startswith("6") else (".SZ" if pcode.startswith(("0", "3")) else (".BJ" if pcode.startswith(("8", "4", "9")) else ""))
    full_code = f"{pcode}{suffix}" if suffix else pcode
    if full_code not in cur_codes:
        missing_facts.append((full_code, pcode, fact))

print(f"Missing facts count: {len(missing_facts)}")
for fc, pc, f_item in missing_facts[:10]:
    print(f"  {fc} - {f_item.get('name')}")
