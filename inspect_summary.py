import openpyxl

f1 = r'C:\Users\vega_\Downloads\20260830-兴业证券-化工行业：化工品价格价差与库存开工数据库.xlsx'
wb = openpyxl.load_workbook(f1, data_only=True, read_only=True)
ws = wb['价格 价差 库存等指标汇总表']

rows = []
for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i < 15:
        rows.append([str(c) if c is not None else "" for c in row[:25]])

with open(r'c:\ai\antigravity\chemical-chain-research\inspect_summary_sheet.txt', 'w', encoding='utf-8') as f:
    for r in rows:
        f.write(" | ".join(r) + "\n")

print("INSPECTED SUMMARY SHEET")
