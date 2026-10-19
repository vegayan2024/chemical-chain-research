import os
import json
import re

term_root = r"C:\Users\vega_\Documents\GitHub\terminal"
shelf_file = os.path.join(term_root, "src/data/report-shelf-data.ts")
facts_dir = os.path.join(term_root, "public/data/industries")
comm_file = "public/data/commodity-prices.json"

# Load commodities
with open(comm_file, "r", encoding="utf-8") as f:
    comm_data = json.load(f)
comm_keys = list(comm_data.keys())

# Load shelf
with open(shelf_file, "r", encoding="utf-8") as f:
    text = f.read()
m = re.search(r"export const REPORT_SHELF_DATA:\s*ReportItem\[\]\s*=\s*(\[[\s\S]*?\]);", text)
shelf_data = json.loads(m.group(1)) if m else []
shelf_map = {s.get("stockCode", "").strip(): s for s in shelf_data}

# Load current
with open("public/data/companies.json", "r", encoding="utf-8") as f:
    cur_comps = json.load(f)
cur_codes = {c["code"]: c for c in cur_comps}

# Load terminal product map
term_prod_map = {}
if os.path.exists("scripts/terminal_product_map.json"):
    with open("scripts/terminal_product_map.json", "r", encoding="utf-8") as f:
        term_prod_map = json.load(f)

# Collect 72 missing facts
missing_list = []
for fname in os.listdir(facts_dir):
    if fname.startswith("company-") and fname.endswith(".facts.json"):
        pcode = fname.replace("company-", "").replace(".facts.json", "")
        suffix = ".SH" if pcode.startswith("6") else (".SZ" if pcode.startswith(("0", "3")) else (".BJ" if pcode.startswith(("8", "4", "9")) else ""))
        code = f"{pcode}{suffix}" if suffix else pcode
        if code not in cur_codes:
            with open(os.path.join(facts_dir, fname), "r", encoding="utf-8") as ff:
                f_data = json.load(ff)
            missing_list.append((code, pcode, f_data))

print(f"Total missing: {len(missing_list)}")

# Test match helper
def find_comm(keywords):
    for kw in keywords:
        # direct contains in comm_keys
        matches = [k for k in comm_keys if kw.lower() in k.lower()]
        if matches:
            # prefer price over profit/spread if general
            p_matches = [m for m in matches if ":price:" in m]
            return p_matches[0] if p_matches else matches[0]
    return None

# Check missing companies match
matched_count = 0
unmatched = []

for code, pcode, f_data in missing_list:
    sh = shelf_map.get(code, {})
    name = sh.get("companyName") or f_data.get("name", "").split()[0] or code
    summary = sh.get("summary") or f_data.get("summary", "")
    key_points = " ".join(f_data.get("keyPoints", []))
    
    # check if in term_prod_map
    pm = term_prod_map.get(code, [])
    valid_pm = [p for p in pm if p.get("sourceKey") in comm_data]
    
    if valid_pm:
        matched_count += 1
    else:
        # search based on name and summary
        found = False
        text_corp = f"{name} {summary} {key_points}"
        # try common keywords
        trial_keys = []
        for kw in ["黄金", "白银", "铜", "铝", "锌", "铅", "锡", "锑", "钨", "钼", "稀土", "氧化镨钕", "钛白粉", "氯化钾", "钾肥", "纯碱", "烧碱", "尿素", "磷酸", "炸药", "硝酸铵", "纸", "原油", "汽油", "柴油", "煤", "PTA", "聚酯", "长丝", "乙二醇", "甲醇", "醋酸", "丙烯", "聚丙烯", "PVC", "顺酐", "炭黑", "维生素"]:
            if kw in text_corp:
                ck = find_comm([kw])
                if ck:
                    trial_keys.append(ck)
        if trial_keys:
            matched_count += 1
        else:
            unmatched.append((code, name, summary[:50]))

print(f"Matched with commodity data: {matched_count} / {len(missing_list)}")
print(f"Unmatched: {len(unmatched)}")
for u in unmatched:
    print(" ", u)
