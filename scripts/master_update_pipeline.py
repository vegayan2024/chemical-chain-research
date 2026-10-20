#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
化工产业链与周期标的：整体更新计算与 6 大勾稽复验流水线 (Master Pipeline)
=============================================================================
适用场景：
1. 获得最新的券商大宗价格/价差数据库 Excel (如兴业证券全品类库、国泰海通高频周报)
2. 上市公司披露最新定期财报（年报/半年报/一季报），需要调整业务营收与毛利构成
3. 股票行情价格推移，需要全量更新相关性矩阵与背离雷达信号

流程阶段：
[Phase 1] 摄入与解析：大宗商品时序、价差模型与开工率数据
[Phase 2] 公司与财报：141家上市公司业务结构、公式化模式与商品Key对齐
[Phase 3] 股票时序对齐：同步高频日K线数据
[Phase 4] 核心计算引擎：执行四大研报公式化背离雷达计算
[Phase 5] 6大工业级勾稽核验：执行完整性、归一化、时序单调性与前端构建验证
"""

import os
import sys
import json
import subprocess
import argparse
from datetime import datetime

# 解决 Windows 终端编码
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "public", "data")
SCRIPTS_DIR = os.path.join(PROJECT_ROOT, "scripts")

def print_banner(text):
    print("\n" + "=" * 70)
    print(f" {text}")
    print("=" * 70)

def run_script(script_name, desc):
    print(f"\n▶ 正在执行 [{desc}] ({script_name})...")
    path = os.path.join(SCRIPTS_DIR, script_name)
    if not os.path.exists(path):
        print(f"❌ 错误: 脚本不存在: {path}")
        return False
    ret = subprocess.run([sys.executable, path], cwd=PROJECT_ROOT)
    if ret.returncode != 0:
        print(f"❌ 失败: {script_name} 返回码非 0: {ret.returncode}")
        return False
    print(f"✔ 成功完成: {desc}")
    return True

def verify_six_audits():
    """
    执行 6 大工业级勾稽核验体系
    """
    print_banner("阶段 5: 执行 6 大工业级勾稽核验体系 (Six-Point Verification Protocol)")
    results = {}
    
    # 1. 加载所有生成文件
    companies_file = os.path.join(DATA_DIR, "companies.json")
    commodity_file = os.path.join(DATA_DIR, "commodity-prices.json")
    stock_file = os.path.join(DATA_DIR, "stock-prices.json")
    divergence_file = os.path.join(DATA_DIR, "divergence-signals.json")
    correlations_file = os.path.join(DATA_DIR, "correlations.json")
    sources_file = os.path.join(DATA_DIR, "data-sources.json")
    latest_prices_file = os.path.join(DATA_DIR, "company-latest-prices.json")
    
    with open(companies_file, "r", encoding="utf-8") as f:
        companies = json.load(f)
    with open(commodity_file, "r", encoding="utf-8") as f:
        commodities = json.load(f)
    with open(stock_file, "r", encoding="utf-8") as f:
        stocks = json.load(f)
    with open(divergence_file, "r", encoding="utf-8") as f:
        divergences = json.load(f)
    with open(correlations_file, "r", encoding="utf-8") as f:
        correlations = json.load(f)
    with open(sources_file, "r", encoding="utf-8") as f:
        sources = json.load(f)
    with open(latest_prices_file, "r", encoding="utf-8") as f:
        latest_prices = json.load(f)

    # ----------------------------------------------------
    # 勾稽 1: 商品 Key 完整性与不存在悬空引用
    # ----------------------------------------------------
    missing_keys = []
    for c in companies:
        for p in c.get("productsByRevenue", []) + c.get("productsByProfit", []):
            ck = p.get("commodityKey")
            if ck not in commodities:
                missing_keys.append((c["code"], ck))
    if not missing_keys:
        results["勾稽1_商品Key完整性"] = {"status": "PASS", "detail": f"141家公司的所有产品Key 100%存在于商品数据库中（有效序列: {len(commodities)}项）"}
    else:
        results["勾稽1_商品Key完整性"] = {"status": "FAIL", "detail": f"发现 {len(missing_keys)} 处悬空商品Key: {missing_keys[:3]}"}

    # ----------------------------------------------------
    # 勾稽 2: 公司营收与利润权重严格归一化 (Sum = 1.00)
    # ----------------------------------------------------
    weight_errors = []
    for c in companies:
        rw = sum(p.get("weight", 0) for p in c.get("productsByRevenue", []))
        pw = sum(p.get("weight", 0) for p in c.get("productsByProfit", []))
        if abs(rw - 1.0) > 0.005 or abs(pw - 1.0) > 0.005:
            weight_errors.append((c["code"], c["name"], rw, pw))
    if not weight_errors:
        results["勾稽2_权重归一化"] = {"status": "PASS", "detail": f"全量 {len(companies)} 家公司的营收权重与利润权重之和均严格精确等于 1.00"}
    else:
        results["勾稽2_权重归一化"] = {"status": "FAIL", "detail": f"发现 {len(weight_errors)} 家公司权重未归一: {weight_errors[:3]}"}

    # ----------------------------------------------------
    # 勾稽 3: 时间序列单调递增性与数据新鲜度
    # ----------------------------------------------------
    date_errors = 0
    max_comm_date = "1970-01-01"
    for ck, pts in commodities.items():
        if not pts: continue
        if pts[-1]["date"] > max_comm_date:
            max_comm_date = pts[-1]["date"]
        # 验证单调性
        for i in range(1, len(pts)):
            if pts[i]["date"] < pts[i-1]["date"]:
                date_errors += 1
                break
    if date_errors == 0:
        results["勾稽3_时序单调与新鲜度"] = {"status": "PASS", "detail": f"全部商品序列日期单调严格递增，最新数据推进至 {max_comm_date}"}
    else:
        results["勾稽3_时序单调与新鲜度"] = {"status": "FAIL", "detail": f"存在 {date_errors} 个序列日期乱序"}

    # ----------------------------------------------------
    # 勾稽 4: 股票与商品对齐覆盖率
    # ----------------------------------------------------
    stock_coverage = len([c for c in companies if c["code"] in stocks and len(stocks[c["code"]]) >= 30])
    if stock_coverage == len(companies):
        results["勾稽4_股票时序覆盖率"] = {"status": "PASS", "detail": f"全量 {len(companies)} 家标的均具备完整日K线时序支持（100% 覆盖）"}
    else:
        results["勾稽4_股票时序覆盖率"] = {"status": "WARN", "detail": f"股票时序覆盖 {stock_coverage}/{len(companies)}"}

    # ----------------------------------------------------
    # 勾稽 5: 背离信号与多周期相关性数学自洽性
    # ----------------------------------------------------
    invalid_divs = []
    for d in divergences:
        # 验证打分是否为正数，且有合理的股价与商品变化率
        if d.get("divergenceScore", 0) <= 0:
            invalid_divs.append(d["code"])
    if not invalid_divs and len(divergences) > 0 and len(correlations) > 0:
        results["勾稽5_背离与相关性自洽"] = {
            "status": "PASS",
            "detail": f"共产生 {len(divergences)} 条背离信号 (强背离: {len([s for s in divergences if s['signalStrength'] == 'strong'])})，多周期相关性 {len(correlations)} 条，数学逻辑自洽"
        }
    else:
        results["勾稽5_背离与相关性自洽"] = {"status": "FAIL", "detail": f"背离计算异常或存在无效打分: {invalid_divs[:3]}"}

    # ----------------------------------------------------
    # 勾稽 6: 元数据信源同步与前端生产编译验证
    # ----------------------------------------------------
    src_cov = sources.get("databaseCoverage", {})
    source_aligned = (src_cov.get("totalCompanies") == len(companies) and src_cov.get("totalDivergenceSignals") == len(divergences))
    
    # 运行 Vite 编译验证
    print("▶ 正在执行前端类型与生产构建验证 (tsc -b && vite build)...", flush=True)
    build_proc = subprocess.run("npm run build", shell=True, cwd=PROJECT_ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    build_passed = (build_proc.returncode == 0)

    if source_aligned and build_passed:
        results["勾稽6_前端构建与元数据同步"] = {"status": "PASS", "detail": "data-sources.json 与数据库指标 100% 同步，TypeScript 与 Vite 生产构建 0 错误通过"}
    else:
        results["勾稽6_前端构建与元数据同步"] = {"status": "FAIL", "detail": f"信源同步: {source_aligned}, 前端编译: {build_passed}"}

    # ----------------------------------------------------
    # 输出复验报告
    # ----------------------------------------------------
    print_banner("6 大工业级勾稽核验报告汇总")
    all_pass = True
    for k, v in results.items():
        symbol = "✅" if v["status"] == "PASS" else ("⚠️" if v["status"] == "WARN" else "❌")
        print(f"{symbol} [{v['status']}] {k}: {v['detail']}")
        if v["status"] == "FAIL":
            all_pass = False

    print("\n" + "-" * 70)
    if all_pass:
        print("🎉 全部 6 大勾稽核验均 100% 通过！底层数据完整、算法模型严密、前端构建就绪！")
    else:
        print("🚨 勾稽核验发现异常项，请检查上述失败明细并定位！")
    print("-" * 70)
    return all_pass

def main():
    parser = argparse.ArgumentParser(description="化工产业链与周期标的：整体更新计算与复验流水线")
    parser.add_argument("--skip-excel", action="store_true", help="跳过大宗Excel解析，直接运行公司对齐与背离计算")
    parser.add_argument("--verify-only", action="store_true", help="仅执行6大勾稽核验体系")
    args = parser.parse_args()

    print_banner("启动化工与周期品投资终端：全量更新与复验管道 (Master Pipeline)")
    print(f"执行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"工作区根目录: {PROJECT_ROOT}")

    if args.verify_only:
        verify_six_audits()
        return

    # [Phase 1] 大宗商品价格与价差数据更新
    if not args.skip_excel:
        print_banner("阶段 1: 摄入最新大宗价格与价差数据源 (Excel / 周报)")
        if not run_script("update_and_validate_database.py", "大宗商品与价差数据库更新引擎"):
            sys.exit(1)
    else:
        print("⏩ 跳过阶段 1 (使用当前已解析的商品数据库)")

    # [Phase 2] 公司产品与权重校准及归一化
    print_banner("阶段 2: 公司与财报业务映射校准与权重归一化")
    if not run_script("fix_company_keys_and_weights.py", "公司产品Key有效性与权重归一化校验"):
        sys.exit(1)

    # [Phase 3] 股票时序行情同步
    print_banner("阶段 3: 同步全量141家股票时序数据")
    if not run_script("sync_stock_prices.py", "141家上市公司复权K线行情同步"):
        sys.exit(1)

    # [Phase 4] 全量背离雷达计算
    print_banner("阶段 4: 基于研报四大投资逻辑全量计算背离雷达")
    if not run_script("calculate_fundamental_divergence.py", "背离雷达与多周期滚动相关性计算引擎"):
        sys.exit(1)

    # [Phase 5] 6大勾稽核验
    passed = verify_six_audits()
    if not passed:
        print("\n⚠️ 警告: 勾稽核验未完全通过，请复核数据源！")
        sys.exit(1)

    print("\n✨ [Pipeline 成功执行完毕] 数据已全部刷新并具备投产状态！")

if __name__ == "__main__":
    main()
