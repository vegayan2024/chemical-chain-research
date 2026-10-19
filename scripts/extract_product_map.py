import os
import json
import re

term_root = r"C:\Users\vega_\Documents\GitHub\terminal"
import_script = os.path.join(term_root, "scripts/import-chemical-prices.py")

with open(import_script, "r", encoding="utf-8") as f:
    text = f.read()

# Pattern to find each company block: "CODE": [ { ... }, ... ]
company_blocks = re.findall(r'\"([0-9]{6}\.[A-Z]{2}|[0-9]{4,5}\.HK)\":\s*\[([\s\S]*?)\]', text)
print(f"Total company blocks matched: {len(company_blocks)}")

all_mappings = {}
for code, block in company_blocks:
    items = []
    # Match each dict: displayName and sourceKey
    # Could be "displayName": "...", "sourceKey": "..." or without quotes on keys
    entries = re.findall(r'\{[^{}]*?(?:\"?displayName\"?:\s*\"([^\"]*?)\")[^{}]*?(?:\"?sourceKey\"?:\s*\"([^\"]*?)\")[^{}]*?\}', block)
    if not entries:
        # try opposite order
        entries_rev = re.findall(r'\{[^{}]*?(?:\"?sourceKey\"?:\s*\"([^\"]*?)\")[^{}]*?(?:\"?displayName\"?:\s*\"([^\"]*?)\")[^{}]*?\}', block)
        for sk, dn in entries_rev:
            items.append({"displayName": dn, "sourceKey": sk})
    else:
        for dn, sk in entries:
            items.append({"displayName": dn, "sourceKey": sk})
            
    if items:
        all_mappings[code] = items

print(f"Successfully extracted {len(all_mappings)} distinct companies with mappings!")
with open("scripts/terminal_product_map.json", "w", encoding="utf-8") as out:
    json.dump(all_mappings, out, ensure_ascii=False, indent=2)

print("Saved to scripts/terminal_product_map.json")
