import os
import json
import re

term_root = r"C:\Users\vega_\Documents\GitHub\terminal"
import_script = os.path.join(term_root, "scripts/import-chemical-prices.py")
shelf_file = os.path.join(term_root, "src/data/report-shelf-data.ts")

# 1. Parse COMPANY_PRODUCT_MAP
with open(import_script, "r", encoding="utf-8") as f:
    import_text = f.read()

# Extract COMPANY_PRODUCT_MAP dictionary
start_marker = "COMPANY_PRODUCT_MAP: dict[str, list[dict[str, str]]] = {"
start_idx = import_text.find(start_marker)
if start_idx != -1:
    sub = import_text[start_idx + len(start_marker) - 1:]
    # count braces
    depth = 0
    end_idx = 0
    for i, ch in enumerate(sub):
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                end_idx = i + 1
                break
    map_str = sub[:end_idx]
    # parse python dict using eval/ast or json
    import ast
    try:
        product_map = ast.literal_eval(map_str)
        print(f"Parsed COMPANY_PRODUCT_MAP successfully! Total companies: {len(product_map)}")
    except Exception as e:
        print(f"ast.literal_eval failed: {e}")
        product_map = {}
else:
    print("Could not find COMPANY_PRODUCT_MAP marker")
    product_map = {}

# 2. Parse REPORT_SHELF_DATA
with open(shelf_file, "r", encoding="utf-8") as f:
    shelf_text = f.read()

m = re.search(r"export const REPORT_SHELF_DATA:\s*ReportItem\[\]\s*=\s*(\[[\s\S]*?\]);", shelf_text)
shelf_data = json.loads(m.group(1)) if m else []
shelf_map = {}
for item in shelf_data:
    c = item.get("stockCode", "").strip()
    if c and c not in shelf_map:
        shelf_map[c] = item

print(f"Parsed REPORT_SHELF_DATA! Total unique companies: {len(shelf_map)}")

# 3. Read local companies.json
with open("public/data/companies.json", "r", encoding="utf-8") as f:
    local_comps = json.load(f)
local_map = {c["code"]: c for c in local_comps}
print(f"Local companies currently: {len(local_comps)}")

# 4. Check facts directory
facts_dir = os.path.join(term_root, "public/data/industries")
all_facts = {}
for fname in os.listdir(facts_dir):
    if fname.startswith("company-") and fname.endswith(".facts.json"):
        pure_code = fname.replace("company-", "").replace(".facts.json", "")
        with open(os.path.join(facts_dir, fname), "r", encoding="utf-8") as ff:
            all_facts[pure_code] = json.load(ff)

print(f"Found {len(all_facts)} company facts files in terminal")

# Combine all unique company codes from terminal
all_terminal_codes = set()
all_terminal_codes.update(shelf_map.keys())
all_terminal_codes.update(product_map.keys())
for pcode in all_facts.keys():
    # add with .SZ or .SH suffix
    if pcode.startswith("6"):
        all_terminal_codes.add(f"{pcode}.SH")
    elif pcode.startswith("0") or pcode.startswith("3"):
        all_terminal_codes.add(f"{pcode}.SZ")
    elif pcode.startswith("8") or pcode.startswith("4") or pcode.startswith("9"):
        all_terminal_codes.add(f"{pcode}.BJ")
    elif "HK" in pcode:
        all_terminal_codes.add(pcode)

print(f"Total union of terminal companies: {len(all_terminal_codes)}")
missing_codes = [c for c in all_terminal_codes if c not in local_map]
print(f"Missing from local companies.json: {len(missing_codes)}")

# Output summary to JSON
result = {
    "product_map_count": len(product_map),
    "product_map_keys": list(product_map.keys()),
    "shelf_map_count": len(shelf_map),
    "shelf_map_keys": list(shelf_map.keys()),
    "facts_count": len(all_facts),
    "all_terminal_codes_count": len(all_terminal_codes),
    "missing_codes_count": len(missing_codes),
    "missing_codes": sorted(missing_codes)
}

with open("scripts/terminal_companies_audit.json", "w", encoding="utf-8") as out:
    json.dump(result, out, ensure_ascii=False, indent=2)

print("Saved audit to scripts/terminal_companies_audit.json")
