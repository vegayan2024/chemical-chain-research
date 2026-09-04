/**
 * 周期品投研顶层框架数据：能源、金属与化工周期特性全景
 * 数据源自：《周期品研究框架_能源_金属_化工汇总.md》
 */

export interface CycleCommodityItem {
  id: string;
  name: string;
  category: "energy" | "metals" | "chemicals";
  categoryName: string;
  essence: string; // 周期本质
  profitElasticity: "极强" | "很强" | "强" | "较强" | "中等"; // 利润弹性
  elasticityScore: number; // 5=极强, 4=很强, 3=强, 2=较强, 1=中等
  supplyResponse: string; // 供给响应
  supplySpeed: "极慢" | "慢" | "中等偏慢" | "分化" | "中等偏快" | "较快";
  keyVariables: string[]; // 核心变量
  kingTitle: string; // 市场画像 (xx之王)
  kingColor?: string; // 徽章主色
  note?: string; // 逻辑辨析或特色说明
  linkedChemicalCategory?: string; // 关联本系统下游7大原料路线（如 "氟化工", "磷化工", "盐化工", "油化工" 等）
}

export interface CycleAuditPrinciple {
  id: string;
  title: string;
  subtitle: string;
  items: {
    label: string;
    description: string;
    examples?: string[];
  }[];
}

export const CYCLE_COMMODITIES: CycleCommodityItem[] = [
  // ================= 一、能源及运力板块 =================
  {
    id: "oil",
    name: "石油",
    category: "energy",
    categoryName: "能源及运力",
    essence: "宏观、地缘博弈与供给协同",
    profitElasticity: "很强",
    elasticityScore: 4,
    supplyResponse: "分化（OPEC+弹性高，页岩油/深海慢）",
    supplySpeed: "分化",
    keyVariables: ["OPEC+配额", "美国页岩油开销", "地缘冲突", "全球宏观经济"],
    kingTitle: "地缘与宏观之王",
    kingColor: "#ef4d4d",
    note: "大宗商品总阀门与通胀母体，兼具主权地缘政治与OPEC+联合产量调节特征。",
    linkedChemicalCategory: "油化工"
  },
  {
    id: "coal",
    name: "煤炭",
    category: "energy",
    categoryName: "能源及运力",
    essence: "资本开支收缩与供给核准约束",
    profitElasticity: "较强",
    elasticityScore: 2,
    supplyResponse: "中等偏慢",
    supplySpeed: "中等偏慢",
    keyVariables: ["产能核准", "安监合规", "进口煤价差", "长协比例", "电厂日耗"],
    kingTitle: "现金流之王",
    kingColor: "#f5a524",
    note: "火电与现代煤化工压舱石，供给端受安全与环保刚性审核，高股息与充沛经营现金流底色坚固。",
    linkedChemicalCategory: "煤化工"
  },
  {
    id: "shipping",
    name: "航运（油运/干散/集装）",
    category: "energy",
    categoryName: "能源及运力",
    essence: "有效运力波动周期",
    profitElasticity: "极强",
    elasticityScore: 5,
    supplyResponse: "慢（新船交付慢，突发绕航/拥堵导致即时运力骤变）",
    supplySpeed: "慢",
    keyVariables: ["新造船订单", "运力交付", "地缘绕航", "港口周转效率", "全球贸易量"],
    kingTitle: "有效运力弹性之王",
    kingColor: "#ef4d4d",
    note: "逻辑辨析：航运虽属交运，但直接承载原油、干散煤炭矿石全球流动，周期传导深度绑定能源供需与全球宏观体系。"
  },

  // ================= 二、金属板块 =================
  {
    id: "copper",
    name: "铜",
    category: "metals",
    categoryName: "金属板块",
    essence: "全球宏观工业需求与长资本开支周期",
    profitElasticity: "较强",
    elasticityScore: 2,
    supplyResponse: "慢（新矿建设耗时5-7年）",
    supplySpeed: "慢",
    keyVariables: ["矿端扰动率", "全球PMI", "新能源与电网投资", "冶炼加工费（TC/RC）"],
    kingTitle: "宏观长周期之王",
    kingColor: "#3da9fc",
    note: "正式归属反映全球实体工业与电网景气的核心风向标，资本开支周期极长。"
  },
  {
    id: "gold",
    name: "黄金",
    category: "metals",
    categoryName: "金属板块",
    essence: "全球货币信用体系与避险金融周期",
    profitElasticity: "较强",
    elasticityScore: 2,
    supplyResponse: "极慢（存量巨大，每年矿产增量占比极低）",
    supplySpeed: "极慢",
    keyVariables: ["美元信用", "美债实际利率", "全球央行净购金", "地缘避险需求"],
    kingTitle: "货币信用之王",
    kingColor: "#ffc857",
    note: "剥离无边际定价权的矿山经营周期，聚焦主权货币信用、实际利率中枢与去美元化央行购金。"
  },
  {
    id: "aluminum",
    name: "电解铝",
    category: "metals",
    categoryName: "金属板块",
    essence: "政策产能天花板与能源成本约束",
    profitElasticity: "较强",
    elasticityScore: 2,
    supplyResponse: "偏慢（受国内4500万吨刚性红线锁定）",
    supplySpeed: "中等偏慢",
    keyVariables: ["产能天花板", "绿电/火电价格", "氧化铝供需", "新能源车/光伏用铝"],
    kingTitle: "供给硬约束之王",
    kingColor: "#3da9fc",
    note: "受制于国家高能耗管控与4500万吨刚性产能天花板，供给响应天花板坚不可摧。"
  },
  {
    id: "lithium",
    name: "碳酸锂",
    category: "metals",
    categoryName: "金属板块",
    essence: "新兴产业快速渗透与高扩产周期",
    profitElasticity: "极强",
    elasticityScore: 5,
    supplyResponse: "中等偏快（盐湖慢，云母/锂辉石矿释放快）",
    supplySpeed: "中等偏快",
    keyVariables: ["动力与储能排产", "高成本矿山减产出清", "海外项目并网进度"],
    kingTitle: "周期过山车之王",
    kingColor: "#a872f5",
    note: "典型的高爆发、高扩产、深度错配暴利与剧烈去库出清相交织的新兴周期品种。"
  },
  {
    id: "rare-earth",
    name: "稀土",
    category: "metals",
    categoryName: "金属板块",
    essence: "战略资源配额管制与高端制造需求",
    profitElasticity: "较强",
    elasticityScore: 2,
    supplyResponse: "慢（受国家下发开采与冶炼指标严格管控）",
    supplySpeed: "慢",
    keyVariables: ["工信部配额指标", "人形机器人/风电/新能源车磁材", "缅甸矿进口"],
    kingTitle: "政策配额之王",
    kingColor: "#00c896",
    note: "行政开采指标与环保指标双控，高端钕铁硼与机器人电机拉动结构性需求。"
  },
  {
    id: "tin",
    name: "锡",
    category: "metals",
    categoryName: "金属板块",
    essence: "全球存量矿枯竭与半导体/AI算力周期",
    profitElasticity: "强",
    elasticityScore: 3,
    supplyResponse: "极慢（无新增大型高品位矿，传统矿山衰减）",
    supplySpeed: "极慢",
    keyVariables: ["缅甸佤邦复工政策", "印尼出口限制", "AI服务器/芯片焊料需求"],
    kingTitle: "矿端枯竭之王",
    kingColor: "#ef4d4d",
    note: "全球成熟矿山品位持续衰退，电子焊料与AI芯片高算力硬件需求刚性。"
  },
  {
    id: "antimony",
    name: "锑",
    category: "metals",
    categoryName: "金属板块",
    essence: "战略资源极低储采比与光伏/军工新兴需求",
    profitElasticity: "极强",
    elasticityScore: 5,
    supplyResponse: "极慢（矿山寿命短，环保与采矿权审批严格）",
    supplySpeed: "极慢",
    keyVariables: ["光伏焦锑酸钠澄清剂需求", "阻燃剂", "军工储备", "出口管制政策"],
    kingTitle: "战略稀缺之王",
    kingColor: "#ef4d4d",
    note: "极低储采比资源，光伏组件澄清剂刚性消耗，供给弹性几近于零。"
  },
  {
    id: "molybdenum",
    name: "钼",
    category: "metals",
    categoryName: "金属板块",
    essence: "特种钢材需求与伴生矿产出约束",
    profitElasticity: "强",
    elasticityScore: 3,
    supplyResponse: "慢（多为铜伴生矿，独立钼矿扩产意愿低）",
    supplySpeed: "慢",
    keyVariables: ["特钢/军工/核电/油气管线需求", "海外铜矿排产伴生量"],
    kingTitle: "特钢工业味精之王",
    kingColor: "#3da9fc",
    note: "特种合金钢必备微量元素，供给高度依附铜矿副产伴生释放节奏。"
  },
  {
    id: "cobalt",
    name: "钴",
    category: "metals",
    categoryName: "金属板块",
    essence: "铜镍副产属性与动力电池技术路线博弈",
    profitElasticity: "中等",
    elasticityScore: 1,
    supplyResponse: "较快（主受刚果金铜矿与印尼湿法镍放量牵制）",
    supplySpeed: "较快",
    keyVariables: ["印尼MHP放量速度", "三元高镍渗透率", "磷酸铁锂替代节奏"],
    kingTitle: "副产受制之王",
    kingColor: "#6b7380",
    note: "强副产属性，受海外铜镍湿法冶炼放量与动力电池低钴化路线双向挤压。"
  },

  // ================= 三、化工板块 =================
  {
    id: "phosphate",
    name: "磷矿 / 磷化工",
    category: "chemicals",
    categoryName: "化工板块",
    essence: "资源禀赋枯竭与精细化需求转型",
    profitElasticity: "较强",
    elasticityScore: 2,
    supplyResponse: "偏慢（采矿权批复极难，环保与尾矿约束严格）",
    supplySpeed: "中等偏慢",
    keyVariables: ["磷矿石品位", "磷肥淡旺季", "新能源铁锂前驱体需求", "出口配额"],
    kingTitle: "资源壁垒之王",
    kingColor: "#00c896",
    note: "长江大保护与三磷整治筑牢供给红线，高品位磷矿日趋稀缺，兼具粮食与铁锂双重驱动。",
    linkedChemicalCategory: "磷化工"
  },
  {
    id: "refining-polyester",
    name: "大炼化 / 聚酯（PX-PTA）",
    category: "chemicals",
    categoryName: "化工板块",
    essence: "极大规模一体化与存量格局竞争",
    profitElasticity: "中等",
    elasticityScore: 1,
    supplyResponse: "慢（单套大装置投资数百亿，建设周期3-4年）",
    supplySpeed: "慢",
    keyVariables: ["原油价格中枢", "炼化裂解价差", "纺织服装出口", "下游开工率"],
    kingTitle: "规模壁垒之王",
    kingColor: "#6b7380",
    note: "百亿级单套体量构筑资金与工程高墙，盈利波动深度锚定原油-聚酯裂解价差。",
    linkedChemicalCategory: "油化工"
  },
  {
    id: "polyurethane",
    name: "聚氨酯（MDI / TDI）",
    category: "chemicals",
    categoryName: "化工板块",
    essence: "全球寡头技术壁垒与跨国供应链协同",
    profitElasticity: "强",
    elasticityScore: 3,
    supplyResponse: "极慢（技术门槛高，全球有效玩家仅个位数）",
    supplySpeed: "极慢",
    keyVariables: ["巨头装置检修", "万华扩产节奏", "白电/汽车制造/建筑保温需求"],
    kingTitle: "技术寡头之王",
    kingColor: "#3da9fc",
    note: "全球寡头协同格局稳固，光气化反应技术壁垒极深，抗周期能力强。",
    linkedChemicalCategory: "煤化工"
  },
  {
    id: "fluorochemical",
    name: "氟化工（三代制冷剂）",
    category: "chemicals",
    categoryName: "化工板块",
    essence: "环保公约配额锁定与上游萤石资源",
    profitElasticity: "极强",
    elasticityScore: 5,
    supplyResponse: "极慢（基加利修正案锁定生产与消费基线）",
    supplySpeed: "极慢",
    keyVariables: ["生产配额分配", "萤石选矿环保整治", "家用/汽车空调冷媒置换"],
    kingTitle: "政策控盘之王",
    kingColor: "#ef4d4d",
    note: "基加利修正案配额锁定生产基线，供给刚性锁死，龙头企业享受寡头联合挺价红利。",
    linkedChemicalCategory: "氟化工"
  },
  {
    id: "soda-ash",
    name: "纯碱 / 氯碱",
    category: "chemicals",
    categoryName: "化工板块",
    essence: "新低成本工艺冲击与传统能耗管控",
    profitElasticity: "极强",
    elasticityScore: 5,
    supplyResponse: "分化（天然碱极具成本优势，传统氨碱/联碱受限）",
    supplySpeed: "分化",
    keyVariables: ["远兴天然碱释放进度", "光伏玻璃/浮法玻璃点火与冷修", "煤炭价格"],
    kingTitle: "工艺降维之王",
    kingColor: "#ef4d4d",
    note: "天然碱颠覆性成本冲击传统氨碱联碱，光伏玻璃排产高频扰动需求端。",
    linkedChemicalCategory: "盐化工"
  },
  {
    id: "potash",
    name: "钾肥",
    category: "chemicals",
    categoryName: "化工板块",
    essence: "全球寡头垄断与国家粮食安全刚需",
    profitElasticity: "较强",
    elasticityScore: 2,
    supplyResponse: "极慢（大型钾盐矿建设周期普遍超5年）",
    supplySpeed: "极慢",
    keyVariables: ["国际大合同定价", "加拿大/俄/白俄发运通畅度", "全球农作物种植收益"],
    kingTitle: "粮食安全之王",
    kingColor: "#00c896",
    note: "全球供给寡头BPC与Canpotex深度控盘，我国战略储备与大合同联合谈判压舱。"
  },
  {
    id: "pesticide",
    name: "农药原药",
    category: "chemicals",
    categoryName: "化工板块",
    essence: "渠道去库存周期与专利更替驱动",
    profitElasticity: "较强",
    elasticityScore: 2,
    supplyResponse: "中等偏快（国内原药合成易同质化扩产）",
    supplySpeed: "中等偏快",
    keyVariables: ["跨国农资巨头库存节奏", "海外极端气候", "原药专利到期与注册申报"],
    kingTitle: "渠道周期之王",
    kingColor: "#f5a524",
    note: "跨国巨头渠道去库周期牵引国内代工排产，专利到期品种带动非专利原药合成放量。"
  }
];

export const CYCLE_AUDIT_PRINCIPLES: CycleAuditPrinciple[] = [
  {
    id: "macro-geopolitics",
    title: "1. 宏观与地缘驱动边界厘清",
    subtitle: "铜回归宏观工业长周期，石油回归地缘博弈，黄金聚焦货币避险",
    items: [
      {
        label: "铜（宏观之王）",
        description: "正式归属全球实体工业与电网景气风向标，反映全球PMI与长期资本开支。",
        examples: ["矿端扰动率", "全球PMI", "特高压与新能源电网"]
      },
      {
        label: "石油（地缘与博弈之王）",
        description: "兼具宏观属性但更受OPEC+协同限产与地缘黑天鹅主导，具备突发弹性。",
        examples: ["OPEC+配额执行", "海峡航道通航风险", "页岩油资本开支约束"]
      },
      {
        label: "黄金（货币信用之王）",
        description: "彻底剥离无边际定价权的矿山经营周期，聚焦主权货币信用危机与央行购金去美元化。",
        examples: ["美债实际利率", "美元指数", "全球央行净储备购金"]
      }
    ]
  },
  {
    id: "supply-constraints",
    title: "2. 供给约束维度的本质区分",
    subtitle: "行政配额刚性、资源天然匮乏、工艺迭代颠覆与副产物依附性",
    items: [
      {
        label: "行政配额刚性",
        description: "由国际环保公约或国家发改委/工信部刚性锁死总产能，违规扩张即受严厉法律追责。",
        examples: ["氟化工（基加利修正案锁定HFCs）", "电解铝（4500万吨红线）", "稀土（开采总量指标）"]
      },
      {
        label: "资源天然匮乏与枯竭",
        description: "全球优质富矿已开采数十年，储采比极低且无新增高品位矿发现，矿山自然衰退加速。",
        examples: ["锡（缅甸佤邦/印尼衰竭）", "锑（超低储采比）", "高品位磷矿石"]
      },
      {
        label: "工艺迭代颠覆",
        description: "出现革命性、低成本工艺路径，对存量高边际成本工艺实施降维打击。",
        examples: ["纯碱（低成本天然碱挤压传统氨碱/联碱法）"]
      },
      {
        label: "副产物依附性约束",
        description: "自身没有独立扩产主导权，开工与产出完全依附于主产品（如铜矿、镍矿）的排产。",
        examples: ["钼（铜伴生矿）", "钴（铜镍副产湿法MHP）"]
      }
    ]
  },
  {
    id: "profit-elasticity",
    title: "3. 利润弹性评级标准",
    subtitle: "短期单向供需错配程度 vs 一体化综合平滑机制",
    items: [
      {
        label: "极强弹性（错配倍增）",
        description: "短期供需出现单向硬错配时，价格暴涨且原材料跟涨滞后，吨净利成倍暴增。",
        examples: ["航运绕航即时断崖", "碳酸锂供需狂飙", "氟化工三代制冷剂挺价", "纯碱阶段性供求短缺"]
      },
      {
        label: "中等 / 较强弹性（成本传导平滑）",
        description: "企业多具备全产业链一体化或下游存在较强替代品，成本与价格波动相互抵消吸收。",
        examples: ["大炼化一体化裂解", "钴动力电池路线替代", "复合肥及长协煤炭"]
      }
    ]
  }
];
