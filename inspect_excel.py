import openpyxl
import os

f1 = r'C:\Users\vega_\Downloads\20260830-兴业证券-化工行业：化工品价格价差与库存开工数据库.xlsx'
f2 = r'C:\Users\vega_\Downloads\申万宏源-化工细分行业及重点公司一周概览20260828.xlsx'

out_lines = []

def inspect(filepath, label):
    out_lines.append(f"=== {label}: {os.path.basename(filepath)} ===")
    wb = openpyxl.load_workbook(filepath, data_only=True, read_only=True)
    out_lines.append(f"Sheets ({len(wb.sheetnames)}): {wb.sheetnames}\n")
    for sname in wb.sheetnames[:5]:
        out_lines.append(f"--- Sheet: {sname} ---")
        ws = wb[sname]
        row_count = 0
        for row in ws.iter_rows(values_only=True):
            if any(row):
                # 过滤掉空行，显示前 6 行
                filtered = [str(cell)[:30] if cell is not None else "" for cell in row[:12]]
                out_lines.append(" | ".join(filtered))
                row_count += 1
                if row_count >= 8:
                    break
        out_lines.append("\n")

inspect(f1, "兴业证券")
inspect(f2, "申万宏源")

with open(r'c:\ai\antigravity\chemical-chain-research\inspect_output.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(out_lines))

print("DONE")
