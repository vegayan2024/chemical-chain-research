# Chemical-Chain Project (价格背离与化工产业链投研终端) AI 认知与系统架构全景报告

> **文档定位**：本报告为专供 AI Agent、大语言模型（LLM）以及量化投研工程师阅读理解的机器友好型（Machine-Readable & High-Signal）全景系统架构指南。涵盖业务全貌、技术栈、核心数学算法、数据结构字典、产业链拓扑及六大工业级数据勾稽核验规范。

---

## 1. 项目核心概述 (Executive Summary)

### 1.1 系统定位
- **项目全称**：价格背离信号终端 / 化工产业链与周期品投研平台 (`price-divergence-terminal` / `chemical-chain-research`)
- **主仓库路径**：`c:\ai\antigravity\chemical-chain-research`
- **线上部署预览**：`https://chemical-chain-research.vercel.app` (Vercel 自动化静态部署)
- **业务本质**：将**周期品大宗商品（现货价/期货价/加工价差/开工率）**与**A/H股周期板块上市公司（股票价格/主营营收与毛利构成/估值与财务）**进行高频打通，基于学术与券商研报投资逻辑，自动扫描、计算并呈现**基本面与股价的背离套利/预警信号**，并提供**7大化工原料路线产业链全景图谱**。

### 1.2 核心业务双轮驱动
1. **化工产业链图谱全景 (Industry Chain Panorama)**：
   - 覆盖 7 大原料路线：**氟化工、磷化工、硅化工、盐化工、油化工、煤化工、天然气化工**。
   - 穿透 4 层产业节点：**原料 -> 基础中间体 -> 核心产品/聚合物 -> 终端应用形态 (新能源、半导体、光伏、制冷剂等)**。
   - 纳管每个细分产品节点的 **行业 TOP5 上市公司**（按同产品销售额与产能排名）。
2. **多周期价格背离雷达终端 (Price Divergence Terminal)**：
   - 纳管 141 家周期核心上市公司、591 种细分大宗商品/价差指标、547 条清洗后的时间序列。
   - 基于滑动窗口相关性矩阵与加权累积收益率差，计算正向背离（如商品大涨但股价被压制）、负向背离，辅以估值（PB/PE 百分位）与财务健康度指标。

---

## 2. 系统技术架构与运行时 (Architecture & Tech Stack)

```
┌─────────────────────────────────────────────────────────────────┐
│                     前端交互展示层 (SPA Client)                   │
│   React 19 + TypeScript 5.7 + Vite 6 + React Router 7 + ECharts 6│
│   ├── / (DashboardPage)          : 商品行情总览 + 背离信号 + 热力图 │
│   ├── /chains (ChemicalChainPage): 7大产业链树图 + TOP5公司详情    │
│   ├── /alerts (AlertsPage)       : 公司级背离信号聚合 + 投研逻辑    │
│   └── /divergence/:code          : 双轴走势对照 + 滑动相关性图表    │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ HTTP fetch (静态 JSON 协议)
┌─────────────────────────────────▼───────────────────────────────┐
│                    数据层 (Static Data Store)                    │
│   public/data/*.json (纯静态无状态存储，零后端依赖，支持秒级CDN缓存) │
│   ├── companies.json             : 141家标的映射与营收/利润权重     │
│   ├── commodity-prices.json      : 547条大宗/价差/开工率时序       │
│   ├── stock-prices.json          : 141家A/H股复权日K线时序        │
│   ├── divergence-signals.json    : 93条公式化背离雷达信号          │
│   └── correlations.json          : 60/120/250日滑动相关性矩阵      │
└─────────────────────────────────▲───────────────────────────────┘
                                  │ 离线/定时流水线生成
┌─────────────────────────────────┴───────────────────────────────┐
│                 数据生产与清洗调度引擎 (Python Engine)             │
│   scripts/master_update_pipeline.py (6大工业级勾稽核验总调度)      │
│   ├── update_and_validate_database.py: 解析券商大宗价格/价差 Excel │
│   ├── calculate_fundamental_divergence.py: 四大研报公式化背离引擎  │
│   └── align_terminal_sources.py      : 主终端与子项目元数据同步   │
└─────────────────────────────────▲───────────────────────────────┘
                                  │ 数据采集
┌─────────────────────────────────┴───────────────────────────────┐
│                        底层金融数据源 (Sources)                   │
│   - Tushare Pro API              : A股/H股行情、分红复权、财务报表 │
│   - 兴业证券全品类化工数据库      : 591种细分无机/有机/聚氨酯/农药  │
│   - 国泰海通石化高频周报数据库    : 原油/天然气/石化 33项价差模型   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 核心投研量化模型与数学定义 (Quantitative Models)

### 3.1 四大研报公式化基本面指标引擎 (`calculate_fundamental_divergence.py`)
针对不同化工品及周期细分行业的盈利本质，系统将投资逻辑提炼为四大公式类型（`formulaType`），并采用区间单品变动率直接加权（消除全局定基指数基准日 $t_0$ 的权重漂移偏差）：

1. **绝对价格型 (`price`)**：
   - 适用：大宗同质化商品、上游资源品及涨价弹性核心标的。
   - 单品区间变动率与公司合成基本面收益率：
     $$R_{C,i}(t_{\text{start}} \to t_{\text{end}}) = \frac{P_i(t_{\text{end}}) - P_i(t_{\text{start}})}{P_i(t_{\text{start}})}, \quad R_C = \sum_{i=1}^n w_i \cdot R_{C,i}$$
     其中 $w_i \ge 0$ 为该产品占公司主营的稳态利润权重（或营收权重），$\sum w_i = 1.0$。
2. **产业链价差型 (`spread`)**：
   - 适用：赚取加工裂解毛利的企业（如炼化、PTA、氯碱、MDI、煤头/油头/气头烯烃）。必须按公司实际工艺路线绑定专属价差 Key。
   - 原始价差定义：
     $$\text{Spread}_i(t) = P_{\text{product}, i}(t) - \sum_{k} \alpha_{i,k} \cdot P_{\text{raw}, i, k}(t)$$
   - **跨零/负值抗毁型变动率公式（严禁以 $\text{Spread}(t_{\text{start}})$ 直接做分母）**：
     - 当存在对应主产品基准价 $P_{\text{product}, i}(t_{\text{start}}) > 0$ 时，计算边际毛利率变动（Margin Expansion）：
       $$R_{C,i} = \frac{\text{Spread}_i(t_{\text{end}}) - \text{Spread}_i(t_{\text{start}})}{P_{\text{product}, i}(t_{\text{start}})}$$
     - 当无单一主产品基准价或价差为负时，采用历史滚动标准差 $\sigma_{\text{spread}, i}$ 进行波动率归一化映射：
       $$R_{C,i} = \frac{\text{Spread}_i(t_{\text{end}}) - \text{Spread}_i(t_{\text{start}})}{\sigma_{\text{spread}, i}} \times \lambda_{\text{vol}} \quad (\text{默认经验量纲系数 } \lambda_{\text{vol}} = 0.15)$$
3. **加工费/处理费型 (`processing_fee`)**：
   - 适用：代工与冶炼企业（如铜冶炼 TC/RC、锂电材料代工）。
   - 采用与 spread 相同的标准化变动率公式，规避原材料价格暴涨引起的营收虚假繁荣与分母极端值。
4. **副产品综合弹性型 (`byproduct_composite`)**：
   - 适用：主产品保本或微利，但副产品（如铜冶炼副产硫酸、氯碱副产液氯/双氧水、钛白粉副产硫酸亚铁）暴涨带来的利润弹性模型。
   - 按单吨主产品伴生副产品配比系数合成综合弹性变动率（副产品乘数加成）。

### 3.2 背离信号判定算法 (`divergence-calculator.ts` & Python 引擎同步)
对于股票价格序列 $S = \{s_1, \dots, s_N\}$ 与大宗指标序列 $C = \{c_1, \dots, c_N\}$：

1. **混频重采样与收益率相关性计算 (Weekly Return Pearson Correlation)**：
   鉴于大宗商品含周频序列而股票为日频序列，先将两者按自然周（周五收盘/最新周度值）对齐，并转换为一阶对数/差分收益率序列 $\Delta r_{S,\tau}, \Delta r_{C,\tau}$，消除一阶单整 $I(1)$ 水平价格序列的伪回归：
   $$r(\Delta r_S, \Delta r_C) = \frac{\sum (\Delta r_{S,\tau} - \overline{\Delta r}_S)(\Delta r_{C,\tau} - \overline{\Delta r}_C)}{\sqrt{\sum (\Delta r_{S,\tau} - \overline{\Delta r}_S)^2 \sum (\Delta r_{C,\tau} - \overline{\Delta r}_C)^2}}$$
2. **区间累积变动率与核心背离差值**：
   - 股票区间收益率：$R_S = \frac{s_{\text{end}} - s_{\text{start}}}{s_{\text{start}}}$
   - 原始背离差值：$\text{Diff} = R_C - R_S$
3. **无断层背离触发器与连续分级（消除集合漏斗死锁）**：
   - **前置有效门槛**：$\max(|R_S|, |R_C|) \ge 10\%$ 且 $|\text{Diff}| \ge 10\%$（过滤股商横盘微幅震荡噪音）。
   - **反向共振加成系数**：若股商方向完全相反（$R_S \times R_C < 0$），赋予加成系数 $\gamma = 1.15$；若同向但幅度严重脱节（如商品涨 45%、股价仅涨 5%），赋予系数 $\gamma = 1.0$。
   - **有效背离得分**：$\text{Score} = |\text{Diff}| \times \gamma \times 100$
   - **背离强度连续分级**：
     - **强背离 (`strong`)**：$\text{Score} \ge 30$
     - **中背离 (`medium`)**：$18 \le \text{Score} < 30$
     - **弱背离 (`weak`)**：$10 \le \text{Score} < 18$
4. **背离类型定义**：
   - **正向背离 (`positive`)**：$\text{Diff} > 0$（商品/价差走势显著强于股价，潜在基本面拐点与低估机会）。
   - **负向背离 (`negative`)**：$\text{Diff} < 0$（股价走势显著强于商品/价差，潜在估值透支或股价泡沫预警）。

### 3.3 估值与财务安全边界辅助筛选 (`valuation-data.json`, `financial-data.json`)
遵循周期股反身性规律（**周期底部盈利极低导致 PE 极高或亏损，周期顶部利润暴增导致 PE 极低**）：
- **PB（市净率）历史百分位（核心底部锚）**：判断股价 PB 是否处于 5 年历史 20% 分位以内（**严禁在周期底部使用低 PE 过滤**）。
- **低位横盘时间探测**：标记股价与 PB 处于历史 20% 低位区间持续超过 2 年的筑底标的。
- **现金流与偿债安全边界**：剔除资产负债率过高且经营性现金流持续失血（如经营活动现金流量净额 $< 0$ 且 货币资金 / 短期有息负债 $< 0.8$）的伪弹性高危标的。
- **季报拐点右侧印证（可选辅助）**：利用扣非净利润环比改善或毛利率环比抬升作为高频价差传导至财务报表的右侧确认信号。

---

## 4. 数据资产目录与 Schema 定义 (Data Assets & Schema)

所有运行时数据集中存放于 `public/data/` 目录下，前端通过 `fetch` 直接加载：

| 文件名 | 大小规模 | 关键字段/结构 | 核心用途 |
|---|---|---|---|
| `companies.json` | 141 家公司 | `code`, `name`, `group`, `productsByRevenue[]`, `productsByProfit[]`, `weight` | 公司与大宗产品映射字典，权重归一化 |
| `commodity-prices.json` | 547 个序列 | `{ [commodityKey: string]: Array<{date: string, value: number}> }` | 全量大宗商品/价差日频与周频历史时序 |
| `stock-prices.json` | 141 个序列 | `{ [stockCode: string]: Array<{date: string, value: number}> }` | 全量上市公司前复权日收盘价时序 |
| `divergence-signals.json`| 93 条信号 | `code`, `name`, `divergenceScore`, `divergenceType`, `signalStrength`, `formulaType`, `focusRationale`, `items[]` | 背离雷达信号库，包含子产品拆解 |
| `correlations.json` | 141 条 | `code`, `productName`, `commodityName`, `corr60d`, `corr120d`, `corr250d` | 多周期滑动相关系数矩阵 |
| `commodity-summary.json` | 591 种品类 | `key`, `name`, `category`, `latestPrice`, `unit`, `chg1m`, `chg3m`, `chg1y`, `percentile` | 商品指标池总览，供速查表展示 |
| `price-table.json` | 宽表结构 | 全品类最新价格与历史分位数映射 | 前端大宗商品市场快速过滤表 |
| `company-latest-prices.json`| 映射表 | 上市公司代码 $\to$ 最新对应产品现货价格快照 | 详情页即时展示 |
| `data-sources.json` | 元数据 | `sources[]`, `databaseCoverage`, `lastFullUpdate` | 数据源置信度（96~98%）与全量覆盖度统计 |

### 关键键名规范 (Naming Conventions)
- **大宗商品 Key**：统一采用前缀隔离命名，如：
  - `xyzq:price:轻质纯碱`（兴业证券价格）
  - `xyzq:spread:丙烯酸及酯价差`（兴业证券加工价差）
  - `gtht:price:布伦特原油`（国泰海通现货）
  - `gtht:spread:PDH制丙烯价差`（国泰海通周报价差模型）
- **股票代码**：A 股使用 6 位纯数字代码（如 `600160`, `002493`），港股使用 5 位代码（如 `00386`）。

---

## 5. 产业链知识拓扑 (Industry Chain Knowledge Base)

系统在 `src/lib/industry-chain-data.ts` 与 `src/lib/cycle-framework-data.ts` 内置了完整的化工与周期顶层知识库：

### 5.1 7 大化工原料路线及核心节点
1. **氟化工**：萤石 / 氢氟酸 $\to$ 二代制冷剂 (R22) / 三代制冷剂 (R32, R125, R134a) / 含氟聚合物 (PTFE, PVDF, FEP) / 电子级氢氟酸 $\to$ 终端（变频空调、储能动力锂电、半导体清洗）。
2. **磷化工**：磷矿石 $\to$ 黄磷 / 湿法磷酸 / 热法磷酸 $\to$ 磷酸一铵/二铵 / 磷酸铁锂 / 草甘膦 $\to$ 终端（现代农业、新能源动力电池）。
3. **硅化工**：硅石 $\to$ 工业硅 / 金属硅 $\to$ 三氯氢硅 / 多晶硅 / 有机硅单体 (DMC) $\to$ 终端（光伏组件、建筑密封、电力绝缘）。
4. **盐化工**：原盐 $\to$ 烧碱 (液碱/片碱) / 纯碱 (轻碱/重碱) / 氯气 $\to$ PVC / 环氧氯丙烷 / 氧化铝 / 浮法玻璃。
5. **油化工**：原油 $\to$ 石脑油 / 催化重整 $\to$ 乙烯 / 丙烯 / PX $\to$ 聚乙烯 / 聚丙烯 / PTA $\to$ 涤纶长丝 / 工程塑料。
6. **煤化工**：原料煤 / 燃料煤 $\to$ 煤制甲醇 / 煤制合成氨 / 煤制烯烃 (CTO/MTO) / 煤制乙二醇 $\to$ 现代煤化工高端材料。
7. **天然气化工**：天然气 $\to$ 合成氨 / 尿素 / 甲醇 / 乙炔 $\to$ BDO (1,4-丁二醇) / PBAT 可降解塑料。

### 5.2 周期品三维投研评级属性
每个周期品种均定义了统一的属性字典：
- **市场画像**：如原油被称为“地缘与宏观之王”，草甘膦为“农化景气周期”，三代制冷剂为“配额供给刚性之王”。
- **利润弹性评分**：1（中等）到 5（极强）。
- **供给响应速度**：极慢（如铜矿开采 5-7 年）、慢、分化、较快（如精细化工扩产 6-12 个月）。
- **核心观测变量**：如开工率、社会库存天数、进口窗口利润、新增核准配额。

---

## 6. 八大工业级数据勾稽核验体系 (Eight-Point Verification Protocol)

运行命令：`python scripts/master_update_pipeline.py --verify-only`（或 `npm run verify`）

任何 AI 或开发者在修改代码、调整权重、导入新数据后，**必须 100% 通过以下八项自动化勾稽检验**：

1. **勾稽 1：商品 Key 完整性（零悬空引用）**
   - 规则：`companies.json` 中 141 家公司配置的所有 `commodityKey`，必须 100% 存在于 `commodity-prices.json` 中，悬空数量必须为 0。
2. **勾稽 2：公司权重严格归一化 ($\sum w = 1.00$)**
   - 规则：每家公司的 `productsByRevenue` 与 `productsByProfit` 权重之和，必须严格处于 $[0.995, 1.005]$ 之间（保留误差容限 $\le 0.005$）。
3. **勾稽 3：时间序列单调递增性与新鲜度**
   - 规则：所有股票与商品价格时序，日期必须单调严格递增，无逆序乱序，最新日期必须推移至最新券商数据周。
4. **勾稽 4：股票与商品对齐覆盖率**
   - 规则：纳入背离雷达计算的 141 家标的，必须在 `stock-prices.json` 中拥有连续有效交易数据，覆盖率达 100%。
5. **勾稽 5：背离信号与相关性数学自洽**
   - 规则：`divergenceScore` 必须为非零正浮点数，相关性系数必须落在 $[-1.0, 1.0]$，强背离与中背离分类逻辑闭环。
6. **勾稽 6：信源元数据同步与前端生产编译验证**
   - 规则：`data-sources.json` 覆盖指标与实际生成数据完全一致；且 `tsc -b && vite build` 生产打包编译零报错、类型完全校验通过。
7. **勾稽 7：股票行情时效与滞后预警 (Stock Freshness & Lag Alert)**
   - 规则：对比商品最新日期与个股日K最新日期，计算全市场及个股滞后天数（$\le 7$ 天 PASS；超过则提示同步主终端 K 线）。
8. **勾稽 8：公司级信号内部自洽与前端口径统一 (Signal Consistency & Frontend Alignment)**
   - 规则：同一公司下所有产品子项的股价涨跌幅区间 $R_S$ 必须绝对一致；子项背离方向与得分严格符合定义；前端 `src/lib/data.ts` 直接消费流水线产出的 signals 与 correlations 文件，彻底杜绝“前台算一套、后台算一套”的双重标准。


---

## 7. AI Agent 维护与协作指南 (Agent Instructions & Playbook)

当未来有新的 AI 助手接入此项目时，请遵循以下 SOP：

### 7.1 日常任务执行指南
- **场景 A：更新最新行情或券商研报数据**
  1. 将新的券商周报 Excel 放置于 `data/sources/` 目录。
  2. 运行全量管线：`python scripts/master_update_pipeline.py`。
  3. 观察阶段 5 的 6 大勾稽核验输出，确保全部为 `PASS`。
- **场景 B：为某家上市公司调整业务产品或加入新标的**
  1. 打开 `scripts/update_and_validate_database.py` 或 `scripts/build_complete_companies.py`。
  2. 为公司添加产品映射时，其 `commodityKey` 必须从 `commodity-prices.json` 的既有合法 Key 中选取。
  3. 确保分配的 `weight` 重新归一化为 1.00。
  4. 运行 `npm run verify` 执行无损核查。
- **场景 C：前端界面功能拓展与维护**
  1. 前端页面路由在 `src/App.tsx`，核心模块位于 `src/pages/` 与 `src/components/`。
  2. 严格遵循现有视觉设计规范（纯黑色深色极客主题、CSS 变量、ECharts 6 高清自适应渲染）。
  3. 每次前端改动后，执行 `npm run typecheck` 与 `npm run build` 确保无 TypeScript 类型错误。

### 7.2 关键文件路径一览
- 主入口配置：[package.json](file:///c:/ai/antigravity/chemical-chain-research/package.json)
- 数据总调度管线：[master_update_pipeline.py](file:///c:/ai/antigravity/chemical-chain-research/scripts/master_update_pipeline.py)
- 背离量化引擎：[calculate_fundamental_divergence.py](file:///c:/ai/antigravity/chemical-chain-research/scripts/calculate_fundamental_divergence.py)
- Excel 解析与清洗：[update_and_validate_database.py](file:///c:/ai/antigravity/chemical-chain-research/scripts/update_and_validate_database.py)
- 产业链图谱数据：[industry-chain-data.ts](file:///c:/ai/antigravity/chemical-chain-research/src/lib/industry-chain-data.ts)
- 周期品顶层框架：[cycle-framework-data.ts](file:///c:/ai/antigravity/chemical-chain-research/src/lib/cycle-framework-data.ts)
- 前端核心背离算法：[divergence-calculator.ts](file:///c:/ai/antigravity/chemical-chain-research/src/lib/divergence-calculator.ts)
- 数据源元数据快照：[data-sources.json](file:///c:/ai/antigravity/chemical-chain-research/public/data/data-sources.json)

---
*报告生成时间：2026-10-21 | 状态：系统稳定运行，生产编译与六大勾稽 100% PASS*
