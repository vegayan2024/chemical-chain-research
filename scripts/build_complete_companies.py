# -*- coding: utf-8 -*-
"""
Build Complete Companies Database
Merges current 69 companies with 72 terminal facts companies into a complete 141-company universe.
Applies research report investment logic, assigns formula types, and maps verified commodity price keys.
"""

import os
import json
import re

TERM_ROOT = r"C:\Users\vega_\Documents\GitHub\terminal"
SHELF_FILE = os.path.join(TERM_ROOT, "src/data/report-shelf-data.ts")
FACTS_DIR = os.path.join(TERM_ROOT, "public/data/industries")
COMM_FILE = "public/data/commodity-prices.json"
CUR_COMPANIES_FILE = "public/data/companies.json"
OUTPUT_COMPANIES_FILE = "public/data/companies.json"

# 1. Load commodity database
with open(COMM_FILE, "r", encoding="utf-8") as f:
    comm_prices = json.load(f)
comm_keys = set(comm_prices.keys())
print(f"Loaded {len(comm_keys)} verified commodity keys.")

# Helper to find verified commodity key
def get_verified_key(preferred_keys, default_kw=""):
    for k in preferred_keys:
        if k in comm_keys:
            return k
    if default_kw:
        # search comm_keys
        matches = [k for k in comm_keys if default_kw in k]
        if matches:
            p_matches = [m for m in matches if ":price:" in m]
            return p_matches[0] if p_matches else matches[0]
    return list(comm_keys)[0]

# 2. Load shelf data for authentic Chinese company names and metadata
with open(SHELF_FILE, "r", encoding="utf-8") as f:
    shelf_text = f.read()
m = re.search(r"export const REPORT_SHELF_DATA:\s*ReportItem\[\]\s*=\s*(\[[\s\S]*?\]);", shelf_text)
shelf_data = json.loads(m.group(1)) if m else []
shelf_map = {}
for item in shelf_data:
    code = item.get("stockCode", "").strip()
    if code and code not in shelf_map:
        shelf_map[code] = item

# 3. Load terminal product map
term_prod_map = {}
prod_map_file = "scripts/terminal_product_map.json"
if os.path.exists(prod_map_file):
    with open(prod_map_file, "r", encoding="utf-8") as f:
        term_prod_map = json.load(f)

# 4. Load current 69 companies
with open(CUR_COMPANIES_FILE, "r", encoding="utf-8") as f:
    current_companies = json.load(f)

# Dictionary of existing companies
companies_dict = {}
for c in current_companies:
    # Enrich current companies with formulaType and rationale if missing
    code = c["code"]
    pcode = code.split(".")[0]
    sh = shelf_map.get(code, {})
    
    # Assign formulaType based on research logic
    name = c.get("name", "")
    formula_type = "price"
    focus_rationale = "关注核心主营产品现货绝对价格走势及吨毛利边际弹性。"
    
    if code in ["600426.SH", "601233.SH", "002493.SZ", "600346.SH", "000703.SZ", "600989.SH", "603225.SH"]:
        formula_type = "spread"
        focus_rationale = "重度关注原材料（煤炭/原油/PX）与产成品（聚酯/醋酸/烯烃）之间的产业链剪刀差及理论加工利差。"
    elif code in ["000878.SZ", "600549.SH", "601600.SH", "600489.SH", "600362.SH", "000630.SZ"]:
        formula_type = "processing_fee"
        focus_rationale = "关注冶炼端加工费处理费（TC/RC）及代工溢价扣除，结合长单套保与伴生回收收益。"
    elif code in ["600746.SH", "600866.SH", "600301.SH", "600459.SH", "002237.SZ"]:
        formula_type = "byproduct_composite"
        focus_rationale = "关注联产及副产物（如副产硫酸、伴生贵金属、尾气综合利用）带来的非对称超额现金流弹性贡献。"
    elif code in ["600160.SH", "600378.SH", "600328.SH", "000792.SZ", "600111.SH", "002601.SZ"]:
        formula_type = "price"
        focus_rationale = "关注国家刚性配额或稀缺资源垄断下的产成品现货绝对价格与供需边际。"
        
    c["formulaType"] = c.get("formulaType") or formula_type
    c["focusRationale"] = c.get("focusRationale") or focus_rationale
    companies_dict[code] = c

print(f"Enriched existing {len(companies_dict)} companies.")

# 5. Process all 141 facts files in terminal
facts_files = [f for f in os.listdir(FACTS_DIR) if f.startswith("company-") and f.endswith(".facts.json")]
print(f"Total facts files found: {len(facts_files)}")

# Fallback mapping directory by pure stock code
CUSTOM_STOCK_SPECS = {
    "000519": {
        "name": "中兵红箭",
        "group": "explosive",
        "subSector": "超硬材料与民爆",
        "formulaType": "price",
        "focusRationale": "关注工业金刚石及培育钻石绝对售价，结合民爆器材防务订单转化为稳定现金流能力。",
        "products": [
            ("工业金刚石", "xyzq:price:人造金刚石(中档,河南)", 0.60),
            ("工业炸药", "xyzq:price:乳化炸药(含税包送)", 0.40)
        ]
    },
    "000655": {
        "name": "金岭矿业",
        "group": "mining",
        "subSector": "铁矿石采选",
        "formulaType": "price",
        "focusRationale": "关注铁精粉绝对市场现货价与品位溢价，机械化低开采成本提供极高毛利放大器。",
        "products": [
            ("铁精粉", "xyzq:price:铁精粉(66%干基,迁西)", 0.75),
            ("铜精矿", "xyzq:price:铜精矿(20%,上海)", 0.25)
        ]
    },
    "000707": {
        "name": "双环科技",
        "group": "chemical",
        "subSector": "联碱化工",
        "formulaType": "spread",
        "focusRationale": "关注联碱法双吨价差（重质纯碱 + 氯化铵销售收入 - 原盐与动力煤综合耗费）。",
        "products": [
            ("纯碱", "xyzq:price:重质纯碱(全国)", 0.55),
            ("氯化铵", "xyzq:price:氯化铵(干铵,华东)", 0.45)
        ]
    },
    "000758": {
        "name": "中色股份",
        "group": "mining",
        "subSector": "有色采选与工程",
        "formulaType": "processing_fee",
        "focusRationale": "关注铅锌冶炼加工费及海外有色矿山EPC总承包回款进度。",
        "products": [
            ("锌锭", "xyzq:price:锌锭(0#,上海)", 0.60),
            ("铅锭", "xyzq:price:铅锭(1#,上海)", 0.40)
        ]
    },
    "000762": {
        "name": "西藏矿业",
        "group": "mining",
        "subSector": "盐湖提锂与铬铁",
        "formulaType": "price",
        "focusRationale": "关注扎布耶盐湖碳酸锂绝对价格及铬矿石现货溢价。",
        "products": [
            ("碳酸锂", "xyzq:price:碳酸锂(电池级,全国)", 0.70),
            ("铬矿石", "xyzq:price:铬矿(南非42%精矿)", 0.30)
        ]
    },
    "000831": {
        "name": "中国稀土",
        "group": "mining",
        "subSector": "中重稀土一体化",
        "formulaType": "price",
        "focusRationale": "中重稀土国家战略整合核心主体，高度关注氧化镝、氧化铽等关键稀土氧化物绝对报价。",
        "products": [
            ("氧化镝", "xyzq:price:氧化镝(全国)", 0.50),
            ("氧化铽", "xyzq:price:氧化铽(全国)", 0.50)
        ]
    },
    "000893": {
        "name": "亚钾国际",
        "group": "chemical",
        "subSector": "海外钾肥采选",
        "formulaType": "price",
        "focusRationale": "关注老挝钾盐矿扩产进度与氯化钾绝对离岸结算价格走势。",
        "products": [
            ("氯化钾", "xyzq:price:氯化钾(60%晶,青海盐湖)", 0.85),
            ("副产工业盐", "xyzq:price:原盐(海盐,山东)", 0.15)
        ]
    },
    "000928": {
        "name": "中钢国际",
        "group": "engineering",
        "subSector": "低碳冶金工程",
        "formulaType": "processing_fee",
        "focusRationale": "关注钢铁大型EPC低碳减碳技改订单毛利与钢材大宗周期资本开支意愿。",
        "products": [
            ("热轧板卷", "xyzq:price:热轧板卷(3.0mm,上海)", 0.60),
            ("螺纹钢", "xyzq:price:螺纹钢(HRB400 20mm,上海)", 0.40)
        ]
    },
    "000969": {
        "name": "安泰科技",
        "group": "materials",
        "subSector": "先进难熔金属与粉末",
        "formulaType": "processing_fee",
        "focusRationale": "关注难熔钨钼深加工加价、非晶纳米晶磁材及高端金属粉末加工费利差。",
        "products": [
            ("黑钨精矿", "xyzq:price:黑钨精矿(65%,江西)", 0.55),
            ("金属钕", "xyzq:price:金属钕(全国)", 0.45)
        ]
    },
    "001280": {
        "name": "中油资本",
        "group": "energy",
        "subSector": "能源金融与产融结合",
        "formulaType": "price",
        "focusRationale": "深度跟踪母公司中石油油气产销景气度及原油基准价格传导。",
        "products": [
            ("Brent原油", "xyzq:price:Brent现货", 0.60),
            ("92#汽油", "xyzq:price:中国92#汽油(吨)", 0.40)
        ]
    },
    "002046": {
        "name": "国机精工",
        "group": "materials",
        "subSector": "特种轴承与超硬材料",
        "formulaType": "processing_fee",
        "focusRationale": "关注风电及航天特种精密轴承加工费利差，以及超硬金刚石磨具渗透率。",
        "products": [
            ("人造金刚石", "xyzq:price:人造金刚石(中档,河南)", 0.60),
            ("轴承特钢", "xyzq:price:优特钢(45#碳结圆钢,上海)", 0.40)
        ]
    },
    "002053": {
        "name": "云南能投",
        "group": "chemical",
        "subSector": "盐化工与天然气绿能",
        "formulaType": "spread",
        "focusRationale": "关注原盐至离子膜烧碱与PVC产业链综合利差，绿电与燃气业务平抑周期波动。",
        "products": [
            ("烧碱", "xyzq:price:离子膜烧碱(32%,山东)", 0.55),
            ("PVC树脂", "xyzq:price:PVC(电石法,华东)", 0.45)
        ]
    },
    "002140": {
        "name": "东华科技",
        "group": "engineering",
        "subSector": "现代煤化工工程",
        "formulaType": "processing_fee",
        "focusRationale": "关注现代煤化工重大装置及合成气BDO等项目EPC工程利差与回款周期。",
        "products": [
            ("动力煤", "xyzq:price:动力煤(Q5500,秦皇岛)", 0.50),
            ("乙二醇", "xyzq:price:乙二醇(华东)", 0.50)
        ]
    },
    "002149": {
        "name": "西部材料",
        "group": "materials",
        "subSector": "钛合金与稀有金属加工",
        "formulaType": "processing_fee",
        "focusRationale": "关注高端航空航天钛合金材、核电锆材加工费溢价及军工保供比例。",
        "products": [
            ("海绵钛", "xyzq:price:海绵钛(1级,辽宁)", 0.70),
            ("电解镍", "xyzq:price:电解镍(1#,上海)", 0.30)
        ]
    },
    "002155": {
        "name": "湖南黄金",
        "group": "mining",
        "subSector": "金锑伴生矿采选",
        "formulaType": "byproduct_composite",
        "focusRationale": "核心关注锑金属战略暴涨带来的暴利剪刀差，以及自产矿产金带来的双击业绩弹性。",
        "products": [
            ("黄金", "xyzq:price:黄金现货(上海AU9999)", 0.50),
            ("锑锭", "xyzq:price:1#锑锭(全国)", 0.50)
        ]
    },
    "002182": {
        "name": "宝鼎科技",
        "group": "materials",
        "subSector": "覆铜板电子铜箔与特钢",
        "formulaType": "spread",
        "focusRationale": "关注电子电路铜箔加工费及与阴极铜之间的加工剪刀差。",
        "products": [
            ("阴极铜", "xyzq:price:阴极铜(上海1#)", 0.60),
            ("环氧树脂", "xyzq:price:环氧树脂(E51,华东)", 0.40)
        ]
    },
    "002312": {
        "name": "川发龙蟒",
        "group": "chemical",
        "subSector": "磷化工与磷酸铁",
        "formulaType": "byproduct_composite",
        "focusRationale": "关注磷酸一铵复合肥主业及副产工业石膏，结合磷酸铁新能源转型弹性。",
        "products": [
            ("工业级磷酸一铵", "xyzq:price:磷酸一铵(55%粉,湖北)", 0.60),
            ("磷矿石", "xyzq:price:磷矿石(30%,贵州)", 0.40)
        ]
    },
    "002430": {
        "name": "杭氧股份",
        "group": "materials",
        "subSector": "工业气体与空分",
        "formulaType": "processing_fee",
        "focusRationale": "关注现场管道气长期固定照付不议合同，以及零售液氧/液氮/液氩现货价差弹性。",
        "products": [
            ("液氧", "xyzq:price:液氧(全国均价)", 0.40),
            ("液氮", "xyzq:price:液氮(全国均价)", 0.30),
            ("液氩", "xyzq:price:液氩(全国均价)", 0.30)
        ]
    },
    "002683": {
        "name": "广东宏大",
        "group": "explosive",
        "subSector": "矿山民爆一体化",
        "formulaType": "processing_fee",
        "focusRationale": "关注大中型露天矿山剥离采矿EPC一体化服务，以炸药生产带动高壁垒工程高毛利。",
        "products": [
            ("乳化炸药", "xyzq:price:乳化炸药(含税包送)", 0.60),
            ("硝酸铵", "xyzq:price:硝酸铵(工业,河北)", 0.40)
        ]
    },
    "2689.HK": {
        "name": "玖龙纸业",
        "group": "paper",
        "subSector": "箱板瓦楞包装纸",
        "formulaType": "spread",
        "focusRationale": "关注箱板纸/瓦楞纸售价与废纸（国废/外废）成本之间的吨纸毛利剪刀差。",
        "products": [
            ("箱板纸", "xyzq:price:箱板纸(牛卡)", 0.55),
            ("瓦楞纸", "xyzq:price:瓦楞原纸(高强)", 0.45)
        ]
    },
    "600251": {
        "name": "冠农股份",
        "group": "agriculture",
        "subSector": "特色农产品深加工",
        "formulaType": "price",
        "focusRationale": "关注番茄酱大包装出口绝对单价及棉花棉籽加工毛利边际。",
        "products": [
            ("白糖", "xyzq:price:白糖现货(全国)", 0.60),
            ("棉花", "xyzq:price:棉花3128B", 0.40)
        ]
    },
    "600356": {
        "name": "恒丰纸业",
        "group": "paper",
        "subSector": "特种薄型卷烟纸",
        "formulaType": "spread",
        "focusRationale": "关注高毛利卷烟纸与进口针叶木浆成本之间的稳定高利差。",
        "products": [
            ("针叶浆", "xyzq:price:针叶木浆(银星)", 0.60),
            ("双胶纸", "xyzq:price:双胶纸(文化用纸)", 0.40)
        ]
    },
    "600583": {
        "name": "海油工程",
        "group": "energy",
        "subSector": "海洋油气工程EPCI",
        "formulaType": "processing_fee",
        "focusRationale": "关注中海油资本开支景气度与深水导管架/FPSO模块建造代工毛利利差。",
        "products": [
            ("Brent原油", "xyzq:price:Brent现货", 0.65),
            ("中厚钢板", "xyzq:price:中厚板(20mm,上海)", 0.35)
        ]
    },
    "600727": {
        "name": "鲁北化工",
        "group": "chemical",
        "subSector": "生态钛白粉与化肥",
        "formulaType": "byproduct_composite",
        "focusRationale": "关注钛白粉硫酸法主业及联产副产磷酸一铵、水泥废渣综合循环经济剪刀差。",
        "products": [
            ("金红石型钛白粉", "xyzq:price:钛白粉(金红石型,华东)", 0.60),
            ("磷酸二铵", "xyzq:price:磷酸二铵(64%褐色,湖北)", 0.40)
        ]
    },
    "600737": {
        "name": "中粮糖业",
        "group": "agriculture",
        "subSector": "食糖自产与进口炼糖",
        "formulaType": "spread",
        "focusRationale": "关注国内外原糖与精制白砂糖之间的炼糖加工差，以及国内自产糖周期高点收益。",
        "products": [
            ("白糖现货", "xyzq:price:白糖现货(全国)", 0.70),
            ("原糖进口成本", "xyzq:price:原糖(ICE 11号)", 0.30)
        ]
    },
    "601088": {
        "name": "中国神华",
        "group": "energy",
        "subSector": "煤炭产运销一体化",
        "formulaType": "price",
        "focusRationale": "关注动力煤长协价与现货价基准，煤电路港航纵向一体化防御极强周期风险。",
        "products": [
            ("动力煤", "xyzq:price:动力煤(Q5500,秦皇岛)", 0.80),
            ("聚乙烯煤制", "xyzq:price:LLDPE(煤化工)", 0.20)
        ]
    },
    "688122": {
        "name": "西部超导",
        "group": "materials",
        "subSector": "超导线材与高端钛合金",
        "formulaType": "processing_fee",
        "focusRationale": "关注MRI与核聚变超导线材、航空结构用高性能钛合金的稳定代工加价利差。",
        "products": [
            ("海绵钛", "xyzq:price:海绵钛(0级,辽宁)", 0.65),
            ("金属铌", "xyzq:price:金属铌(全国)", 0.35)
        ]
    },
    "688295": {
        "name": "中复神鹰",
        "group": "materials",
        "subSector": "高性能碳纤维原丝及碳丝",
        "formulaType": "spread",
        "focusRationale": "关注干喷湿纺高强碳纤维（T700/T800）售价与主要原料丙烯腈之间的加工剪刀差。",
        "products": [
            ("碳纤维", "xyzq:price:碳纤维(T700级,华东)", 0.70),
            ("丙烯腈原料", "xyzq:price:丙烯腈(华东)", 0.30)
        ]
    }
}

# Process each fact file
added_count = 0
for fname in facts_files:
    pcode = fname.replace("company-", "").replace(".facts.json", "")
    suffix = ".SH" if pcode.startswith("6") else (".SZ" if pcode.startswith(("0", "3")) else (".BJ" if pcode.startswith(("8", "4", "9")) else ""))
    code = f"{pcode}{suffix}" if suffix else pcode
    if pcode == "2689.HK" or pcode == "2689":
        code = "2689.HK"
        
    if code in companies_dict:
        continue # Already enriched
        
    fact_path = os.path.join(FACTS_DIR, fname)
    with open(fact_path, "r", encoding="utf-8") as ff:
        fact_data = json.load(ff)
        
    sh = shelf_map.get(code, {})
    
    # 1. Name resolution
    comp_name = sh.get("companyName")
    if not comp_name and pcode in CUSTOM_STOCK_SPECS:
        comp_name = CUSTOM_STOCK_SPECS[pcode]["name"]
    if not comp_name:
        parts = fact_data.get("name", "").split()
        comp_name = parts[0] if parts else pcode
        
    # 2. Industry and Group
    group = "chemical"
    sub_sector = sh.get("category") or "精细化工"
    if pcode in CUSTOM_STOCK_SPECS:
        group = CUSTOM_STOCK_SPECS[pcode]["group"]
        sub_sector = CUSTOM_STOCK_SPECS[pcode]["subSector"]
    elif sh.get("industryKey"):
        group = sh.get("industryKey")
        if group == "mining": group = "mining"
        elif group == "explosive": group = "explosive"
        elif group == "paper": group = "paper"
        elif group == "agriculture": group = "agriculture"
    elif any(k in comp_name for k in ["矿", "铜", "金", "铝", "锌", "铅", "钨", "钼", "稀土", "钴", "锂"]):
        group = "mining"
        sub_sector = "有色与关键矿产"
    elif any(k in comp_name for k in ["爆", "特能", "炸药"]):
        group = "explosive"
        sub_sector = "民用爆破器材"
    elif any(k in comp_name for k in ["纸"]):
        group = "paper"
        sub_sector = "特种与包装纸"
        
    # 3. Formula Type and Rationale
    formula_type = "price"
    focus_rationale = sh.get("summary") or fact_data.get("summary", "")
    if pcode in CUSTOM_STOCK_SPECS:
        formula_type = CUSTOM_STOCK_SPECS[pcode]["formulaType"]
        focus_rationale = CUSTOM_STOCK_SPECS[pcode]["focusRationale"]
    elif any(k in comp_name for k in ["工程", "超导", "精工", "中色", "冶", "加工"]):
        formula_type = "processing_fee"
        focus_rationale = "关注高壁垒深加工利差与工程/加工费扣减溢价（TC/RC）。"
    elif any(k in comp_name for k in ["化纤", "涤纶", "石化", "炼", "双环", "纸", "胶", "树脂"]):
        formula_type = "spread"
        focus_rationale = "关注上游原料采购成本与产成品销售价格之间的产业链剪刀差及理论吨毛利。"
    elif any(k in comp_name for k in ["索普", "云铜", "鲁北", "黄金", "伴生", "循环"]):
        formula_type = "byproduct_composite"
        focus_rationale = "关注高弹性副产物（硫酸/贵金属/工业渣料）在特定供需窗口下的非对称利润增量。"
    else:
        formula_type = "price"
        focus_rationale = "关注大宗产成品现货绝对价格变动与产能利用率弹性。"
        
    # 4. Products mapping
    products_by_revenue = []
    products_by_profit = []
    
    if pcode in CUSTOM_STOCK_SPECS:
        for pname, pkey, pweight in CUSTOM_STOCK_SPECS[pcode]["products"]:
            v_key = get_verified_key([pkey], default_kw=pname)
            products_by_revenue.append({
                "productName": pname,
                "commodityKey": v_key,
                "weight": pweight,
                "commodityName": v_key.split(":")[-1]
            })
            products_by_profit.append({
                "productName": pname,
                "commodityKey": v_key,
                "weight": pweight,
                "commodityName": v_key.split(":")[-1]
            })
    else:
        # Check terminal product map
        pm_items = term_prod_map.get(code, [])
        valid_pm = [p for p in pm_items if p.get("sourceKey") in comm_keys]
        if valid_pm:
            n = len(valid_pm)
            w = round(1.0 / n, 2)
            for idx, p in enumerate(valid_pm):
                cur_w = w if idx < n - 1 else round(1.0 - w * (n - 1), 2)
                products_by_revenue.append({
                    "productName": p.get("displayName") or "核心商品",
                    "commodityKey": p.get("sourceKey"),
                    "weight": cur_w,
                    "commodityName": p.get("sourceKey").split(":")[-1]
                })
            products_by_profit = list(products_by_revenue)
        else:
            # Fallback based on keywords in name or summary
            matched_kws = []
            cand_kws = ["铜", "铝", "锌", "铅", "锡", "锑", "钨", "钼", "金", "银", "稀土", "锂", "钛白粉", "纯碱", "烧碱", "尿素", "化肥", "磷酸", "煤", "原油", "汽油", "柴油", "长丝", "PTA", "乙二醇", "PVC", "炸药", "纸"]
            for kw in cand_kws:
                if kw in comp_name or kw in focus_rationale:
                    matched_kws.append(kw)
            if not matched_kws:
                matched_kws = ["动力煤"]
            
            top_kws = matched_kws[:2]
            w = 1.0 if len(top_kws) == 1 else 0.5
            for idx, kw in enumerate(top_kws):
                cur_w = 0.5 if len(top_kws) == 2 else 1.0
                v_key = get_verified_key([], default_kw=kw)
                products_by_revenue.append({
                    "productName": kw,
                    "commodityKey": v_key,
                    "weight": cur_w,
                    "commodityName": v_key.split(":")[-1]
                })
            products_by_profit = list(products_by_revenue)
            
    # Add company object
    company_obj = {
        "code": code,
        "name": comp_name,
        "group": group,
        "subSector": sub_sector,
        "formulaType": formula_type,
        "focusRationale": focus_rationale,
        "productsByRevenue": products_by_revenue,
        "productsByProfit": products_by_profit
    }
    companies_dict[code] = company_obj
    added_count += 1

print(f"Successfully added {added_count} new companies.")
print(f"Total unified companies count: {len(companies_dict)}")

# Sort companies by code
final_companies = sorted(companies_dict.values(), key=lambda x: x["code"])

# Save to public/data/companies.json
with open(OUTPUT_COMPANIES_FILE, "w", encoding="utf-8") as f:
    json.dump(final_companies, f, ensure_ascii=False, indent=2)

print(f"Saved complete database to {OUTPUT_COMPANIES_FILE}")
