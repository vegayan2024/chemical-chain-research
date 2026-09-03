/**
 * 化工产业链投研终端 · 行业全景完整数据与结构
 * 移植自原 terminal (site/_chain.js, site/_data.js, site/_company.js)
 */

export interface ChainSubProduct {
  name: string;
  key: string;
}

export interface ChainNodeDef {
  name: string;
  key: string;
  end?: string;
  sub?: ChainSubProduct[];
}

export interface ChainStage {
  stageName: string;
  nodes: ChainNodeDef[];
}

export interface IndustryCompanyNode {
  cat: string;
  lvl: "上游" | "中游" | "下游";
  p1: string;
  p2: string;
  end: string;
  app: string;
  rank: number;
  acode: string;
  aname: string;
  hcode?: string;
  hname?: string;
  ctrl: string;
  cap: string;
  margin: string;
  capex: string;
  desc: string;
  rev: number;
  profit: number;
  profitChg: string;
  roe: string;
  gm: string;
  eps: string;
}

export interface CompanyCapacity {
  product: string;
  cap: string;
  rank: string;
}

export interface CompanyTopProduct {
  name: string;
  rev?: number;
  revPct?: number;
  gm: number;
  profit?: number;
  profitPct?: number;
}

export interface CompanyDetailProfile {
  name: string;
  code: string;
  market: string;
  mktCap: number;
  defaultPE: number;
  currentPrice: number;
  ctrl: string;
  sector: string;
  summary: string;
  profitTrend?: { years: number[]; values: number[] };
  quarterly?: { years: number[]; q1: number[]; q2: number[]; q3: number[]; q4: number[] };
  q1_2026?: { rev: number; profit: number; gm: number };
  financials?: Array<{ year: number; rev: string; profit: string; eps: string; roe: string; gm: string }>;
  topProductsByRev?: CompanyTopProduct[];
  topProductsByProfit?: CompanyTopProduct[];
  capacities?: CompanyCapacity[];
  priceProducts?: string[];
}

// 1. 7大原料路线全景树形结构 (上游 -> 中游各分支 -> 下游应用)
export const INDUSTRY_CHAIN_TREES: Record<string, Record<string, ChainNodeDef[]>> = {
  "氟化工": {
    "上游": [
      { name: "萤石 / AHF", key: "萤石", sub: [] }
    ],
    "中游-氟碳化学品": [
      {
        name: "制冷剂",
        key: "制冷剂",
        sub: [{ name: "R32", key: "R32" }, { name: "R134a", key: "R134a" }]
      }
    ],
    "中游-含氟聚合物": [
      { name: "PTFE", key: "PTFE", sub: [] },
      { name: "PVDF", key: "PVDF", sub: [] }
    ],
    "中游-精细化学品": [
      { name: "六氟磷酸锂", key: "六氟磷酸锂", sub: [] },
      { name: "电子级氢氟酸", key: "电子级氢氟酸", sub: [] },
      { name: "WF6/C4F6", key: "WF6/C4F6", sub: [] }
    ],
    "下游终端": [
      { name: "空调制冷", key: "", end: "空调制冷剂" },
      { name: "汽车空调", key: "", end: "汽车空调制冷剂" },
      { name: "动力电池", key: "", end: "电解液溶质" },
      { name: "半导体", key: "", end: "晶圆清洗" }
    ]
  },
  "磷化工": {
    "上游": [
      { name: "磷矿石", key: "磷矿石", sub: [] }
    ],
    "中游-磷肥": [
      { name: "MAP", key: "MAP", sub: [] },
      { name: "DAP", key: "DAP", sub: [] }
    ],
    "中游-新能源": [
      { name: "磷酸铁锂", key: "磷酸铁锂", sub: [] }
    ],
    "中游-农药": [
      { name: "草甘膦", key: "草甘膦", sub: [] }
    ],
    "下游终端": [
      { name: "农业肥料", key: "", end: "农业肥料" },
      { name: "动力电池", key: "", end: "正极材料" },
      { name: "农业除草", key: "", end: "除草剂" }
    ]
  },
  "硅化工": {
    "上游": [
      { name: "工业硅", key: "工业硅", sub: [] }
    ],
    "中游-多晶硅": [
      { name: "多晶硅", key: "多晶硅", sub: [] }
    ],
    "中游-有机硅": [
      { name: "有机硅", key: "有机硅", sub: [] },
      { name: "硅烷偶联剂", key: "硅烷偶联剂", sub: [] },
      { name: "碳化硅", key: "碳化硅", sub: [] }
    ],
    "下游终端": [
      { name: "光伏密封胶", key: "", end: "光伏组件密封胶/背板" }
    ]
  },
  "盐化工": {
    "上游": [
      { name: "原盐", key: "原盐", sub: [] }
    ],
    "中游-三碱": [
      { name: "纯碱", key: "纯碱", sub: [] },
      { name: "烧碱", key: "烧碱", sub: [] },
      { name: "PVC", key: "PVC", sub: [] }
    ],
    "下游终端": [
      { name: "玻璃", key: "", end: "玻璃" }
    ]
  },
  "油化工": {
    "上游": [
      { name: "原油炼化", key: "原油炼化", sub: [] }
    ],
    "中游-三烯": [
      { name: "乙烯", key: "乙烯", sub: [] },
      { name: "丙烯", key: "丙烯", sub: [] },
      { name: "PX", key: "PX", sub: [] }
    ],
    "下游终端": [
      { name: "涤纶长丝", key: "", end: "涤纶长丝(POY)" },
      { name: "聚乙烯", key: "", end: "聚乙烯(PE)" }
    ]
  },
  "煤化工": {
    "上游": [
      { name: "煤炭", key: "煤炭", sub: [] }
    ],
    "中游-煤化工": [
      { name: "煤制烯烃", key: "煤制烯烃(CTO)", sub: [] },
      { name: "煤制甲醇", key: "煤制甲醇", sub: [] },
      { name: "煤制乙二醇", key: "煤制乙二醇", sub: [] },
      { name: "煤焦油", key: "煤焦油", sub: [] }
    ],
    "下游终端": [
      { name: "聚乙烯(煤制)", key: "", end: "聚乙烯(煤制)" }
    ]
  },
  "天然气化工": {
    "上游": [
      { name: "天然气", key: "天然气", sub: [] }
    ],
    "中游-合成": [
      { name: "合成氨", key: "合成氨", sub: [] },
      { name: "尿素", key: "尿素", sub: [] },
      { name: "甲醇", key: "甲醇(气头)", sub: [] },
      { name: "BDO", key: "BDO", sub: [] }
    ],
    "下游终端": [
      { name: "复合肥", key: "", end: "复合肥" },
      { name: "三聚氰胺", key: "", end: "三聚氰胺" }
    ]
  }
};

// 2. 节点与公司对标数据库 (75条全量映射)
export const INDUSTRY_NODE_DATA: IndustryCompanyNode[] = [
  // 氟化工
  { cat: "氟化工", lvl: "上游", p1: "萤石", p2: "", end: "", app: "", rank: 1, acode: "603505", aname: "金石资源", ctrl: "宋英", cap: "40万吨/年", margin: "25%-40%", capex: "~12亿", desc: "国内最大萤石采选", rev: 18.5, profit: 5.2, profitChg: "+32%", roe: "18%", gm: "35%", eps: "1.24" },
  { cat: "氟化工", lvl: "上游", p1: "萤石", p2: "", end: "", app: "", rank: 2, acode: "605020", aname: "永和股份", ctrl: "童建国", cap: "矿+AHF一体化", margin: "18%-28%", capex: "~8亿", desc: "萤石+氢氟酸一体化", rev: 32.1, profit: 3.8, profitChg: "+156%", roe: "12%", gm: "22%", eps: "1.05" },
  { cat: "氟化工", lvl: "上游", p1: "萤石", p2: "", end: "", app: "", rank: 3, acode: "600160", aname: "巨化股份", ctrl: "浙江省国资委", cap: "AHF 25万吨/年", margin: "15%-25%", capex: "~45亿", desc: "国内最大AHF产能", rev: 269.91, profit: 37.83, profitChg: "+93%", roe: "13.5%", gm: "28.9%", eps: "1.39" },
  { cat: "氟化工", lvl: "中游", p1: "制冷剂", p2: "R32", end: "空调制冷剂", app: "家用空调", rank: 1, acode: "600160", aname: "巨化股份", ctrl: "浙江省国资委", cap: "13万吨/年", margin: "29%-51%", capex: "~45亿", desc: "R32配额第一", rev: 269.91, profit: 37.83, profitChg: "+93%", roe: "13.5%", gm: "50.8%", eps: "1.39" },
  { cat: "氟化工", lvl: "中游", p1: "制冷剂", p2: "R32", end: "空调制冷剂", app: "家用空调", rank: 2, acode: "603379", aname: "三美股份", ctrl: "胡荣达家族", cap: "4万吨/年", margin: "25%-38%", capex: "~5亿", desc: "R32出口占比高", rev: 58.50, profit: 20.61, profitChg: "+131%", roe: "22%", gm: "50.6%", eps: "3.38" },
  { cat: "氟化工", lvl: "中游", p1: "制冷剂", p2: "R32", end: "空调制冷剂", app: "家用空调", rank: 3, acode: "605020", aname: "永和股份", ctrl: "童建国", cap: "布局中", margin: "18%-28%", capex: "~8亿", desc: "四代制冷剂并行", rev: 32.1, profit: 3.8, profitChg: "+156%", roe: "12%", gm: "22%", eps: "1.05" },
  { cat: "氟化工", lvl: "中游", p1: "制冷剂", p2: "R134a", end: "汽车空调制冷剂", app: "汽车空调", rank: 1, acode: "603379", aname: "三美股份", ctrl: "胡荣达家族", cap: "6.5万吨/年", margin: "25%-38%", capex: "~5亿", desc: "R134a产能领先", rev: 58.50, profit: 20.61, profitChg: "+131%", roe: "22%", gm: "50.6%", eps: "3.38" },
  { cat: "氟化工", lvl: "中游", p1: "含氟聚合物", p2: "PTFE", end: "密封件/不粘涂层", app: "化工、半导体", rank: 1, acode: "600160", aname: "巨化股份", ctrl: "浙江省国资委", cap: "2.5万吨/年", margin: "2%-9%", capex: "~45亿", desc: "PTFE产能前列", rev: 269.91, profit: 37.83, profitChg: "+93%", roe: "13.5%", gm: "4.4%", eps: "1.39" },
  { cat: "氟化工", lvl: "中游", p1: "含氟聚合物", p2: "PVDF", end: "锂电粘结剂", app: "锂电池", rank: 1, acode: "600160", aname: "巨化股份", ctrl: "浙江省国资委", cap: "1万吨/年", margin: "2%-9%", capex: "~45亿", desc: "PVDF粉料龙头", rev: 269.91, profit: 37.83, profitChg: "+93%", roe: "13.5%", gm: "4.4%", eps: "1.39" },
  { cat: "氟化工", lvl: "中游", p1: "含氟精细化学品", p2: "六氟磷酸锂", end: "电解液溶质", app: "动力电池", rank: 1, acode: "002407", aname: "多氟多", ctrl: "李世江家族", cap: "6万吨/年", margin: "2%-15%", capex: "~25亿", desc: "全球LiPF6龙头", rev: 105, profit: 8.5, profitChg: "扭亏", roe: "6.5%", gm: "15%", eps: "0.63" },
  { cat: "氟化工", lvl: "中游", p1: "含氟精细化学品", p2: "电子级氢氟酸", end: "晶圆清洗", app: "半导体", rank: 1, acode: "002407", aname: "多氟多", ctrl: "李世江家族", cap: "产线已建", margin: "15%-25%", capex: "~25亿", desc: "突破芯片原料垄断", rev: 105, profit: 8.5, profitChg: "扭亏", roe: "6.5%", gm: "15%", eps: "0.63" },
  { cat: "氟化工", lvl: "中游", p1: "含氟电子特气", p2: "WF6/C4F6", end: "半导体刻蚀", app: "半导体", rank: 1, acode: "688146", aname: "中船特气", ctrl: "中国船舶集团", cap: "WF6 600t+C4F6 1200t", margin: "30%-45%", capex: "~15亿", desc: "电子特气龙头", rev: 25.3, profit: 5.8, profitChg: "+96%", roe: "15%", gm: "38%", eps: "1.52" },

  // 磷化工
  { cat: "磷化工", lvl: "上游", p1: "磷矿石", p2: "", end: "", app: "", rank: 1, acode: "600096", aname: "云天化", ctrl: "云南省国资委", cap: "储量近8亿吨/采选1450万吨/年", margin: "16%-20%", capex: "~30亿", desc: "磷矿储量第一", rev: 484.15, profit: 51.56, profitChg: "-2%", roe: "15.5%", gm: "17.5%", eps: "2.82" },
  { cat: "磷化工", lvl: "上游", p1: "磷矿石", p2: "", end: "", app: "", rank: 2, acode: "600141", aname: "兴发集团", ctrl: "宜昌兴发集团", cap: "储量4.61亿吨/采选约500万吨/年", margin: "16%-20%", capex: "~25亿", desc: "矿电化一体标杆", rev: 305, profit: 19.5, profitChg: "+22%", roe: "9.5%", gm: "18.5%", eps: "1.54" },
  { cat: "磷化工", lvl: "中游", p1: "磷肥", p2: "MAP", end: "农业肥料", app: "农业", rank: 1, acode: "002312", aname: "川发龙蟒", ctrl: "四川省国资委", cap: "工业级MAP龙头", margin: "15%-20%", capex: "~18亿", desc: "储能磷料核心", rev: 110, profit: 8.0, profitChg: "+29%", roe: "10.5%", gm: "18.5%", eps: "0.70" },
  { cat: "磷化工", lvl: "中游", p1: "磷肥", p2: "DAP", end: "农业肥料", app: "农业", rank: 1, acode: "600096", aname: "云天化", ctrl: "云南省国资委", cap: "DAP约300万吨/年", margin: "20%-34%", capex: "~30亿", desc: "DAP产能第一", rev: 484.15, profit: 51.56, profitChg: "-2%", roe: "15.5%", gm: "17.5%", eps: "2.82" },
  { cat: "磷化工", lvl: "中游", p1: "新能源材料", p2: "磷酸铁锂", end: "正极材料", app: "动力电池", rank: 1, acode: "301358", aname: "湖南裕能", ctrl: "湘潭电化集团", cap: "LFP约50万吨/年", margin: "8%-15%", capex: "~40亿", desc: "全球LFP出货龙头", rev: 310, profit: 8.5, profitChg: "+44%", roe: "10%", gm: "14%", eps: "1.12" },
  { cat: "磷化工", lvl: "中游", p1: "农药", p2: "草甘膦", end: "除草剂", app: "农业", rank: 1, acode: "600141", aname: "兴发集团", ctrl: "宜昌兴发集团", cap: "23万吨/年（国内第一）", margin: "16%-20%", capex: "~25亿", desc: "草甘膦国内第一", rev: 305, profit: 19.5, profitChg: "+22%", roe: "9.5%", gm: "18.5%", eps: "1.54" },

  // 硅化工
  { cat: "硅化工", lvl: "上游", p1: "工业硅", p2: "", end: "", app: "", rank: 1, acode: "603260", aname: "合盛硅业", ctrl: "罗立国家族", cap: "122万吨/年", margin: "10%-25%", capex: "~50亿", desc: "全球工业硅+有机硅双龙头", rev: 204.99, profit: -29.91, profitChg: "转亏", roe: "-8%", gm: "12%", eps: "-2.53" },
  { cat: "硅化工", lvl: "上游", p1: "工业硅", p2: "", end: "", app: "", rank: 2, acode: "600596", aname: "新安股份", ctrl: "传化集团", cap: "30万吨/年", margin: "15%-22%", capex: "~15亿", desc: "草甘膦+有机硅双主业", rev: 180, profit: 8.5, profitChg: "+15%", roe: "8%", gm: "18%", eps: "0.68" },
  { cat: "硅化工", lvl: "中游", p1: "多晶硅", p2: "", end: "光伏硅料", app: "光伏", rank: 1, acode: "600438", aname: "通威股份", ctrl: "刘汉元", cap: "约80万吨/年", margin: "5%-25%", capex: "~80亿", desc: "全球多晶硅+电池双龙头", rev: 900, profit: -30, profitChg: "转亏", roe: "-5%", gm: "8%", eps: "-0.67" },
  { cat: "硅化工", lvl: "中游", p1: "多晶硅", p2: "", end: "光伏硅料", app: "光伏", rank: 2, acode: "688303", aname: "大全能源", ctrl: "徐广福家族", cap: "约40万吨/年", margin: "5%-20%", capex: "~40亿", desc: "高纯多晶硅标杆", rev: 120, profit: -15, profitChg: "转亏", roe: "-8%", gm: "10%", eps: "-0.70" },
  { cat: "硅化工", lvl: "中游", p1: "有机硅", p2: "", end: "硅橡胶/硅油/硅树脂", app: "建筑、电子、新能源", rank: 1, acode: "603260", aname: "合盛硅业", ctrl: "罗立国家族", cap: "173万吨/年单体", margin: "10%-25%", capex: "~50亿", desc: "有机硅单体全球第一", rev: 95.75, profit: -5, profitChg: "亏损收窄", roe: "-3%", gm: "12%", eps: "-0.42" },
  { cat: "硅化工", lvl: "中游", p1: "有机硅", p2: "", end: "硅橡胶/硅油", app: "建筑、电子", rank: 2, acode: "600596", aname: "新安股份", ctrl: "传化集团", cap: "49万吨/年单体", margin: "15%-22%", capex: "~15亿", desc: "有机硅+草甘膦双主业", rev: 85, profit: 5, profitChg: "+20%", roe: "8%", gm: "18%", eps: "0.40" },
  { cat: "硅化工", lvl: "中游", p1: "有机硅", p2: "", end: "硅橡胶/硅油", app: "建筑、电子", rank: 3, acode: "300821", aname: "东岳硅材", ctrl: "张建宏", cap: "60万吨/年单体", margin: "10%-20%", capex: "~10亿", desc: "有机硅深加工龙头", rev: 43.33, profit: -0.19, profitChg: "转亏", roe: "-0.5%", gm: "10%", eps: "-0.02" },
  { cat: "硅化工", lvl: "中游", p1: "硅烷偶联剂", p2: "", end: "橡胶助剂/复合材料", app: "轮胎、复合材料", rank: 1, acode: "605399", aname: "晨光新材", ctrl: "曹祥林", cap: "12万吨/年", margin: "20%-30%", capex: "~8亿", desc: "国内氨基硅烷第一", rev: 35, profit: 5, profitChg: "+25%", roe: "12%", gm: "25%", eps: "1.50" },
  { cat: "硅化工", lvl: "下游", p1: "光伏组件", p2: "", end: "光伏组件密封胶/背板", app: "光伏发电", rank: 1, acode: "300019", aname: "硅宝科技", ctrl: "王有治", cap: "密封胶8万吨/年", margin: "20%-30%", capex: "~5亿", desc: "光伏密封胶龙头", rev: 30, profit: 3.5, profitChg: "+15%", roe: "10%", gm: "25%", eps: "0.90" },

  // 盐化工
  { cat: "盐化工", lvl: "上游", p1: "原盐", p2: "", end: "", app: "", rank: 1, acode: "600328", aname: "中盐化工", ctrl: "中国盐业集团", cap: "原盐+纯碱一体化", margin: "5%-15%", capex: "~10亿", desc: "国内第三大纯碱企业", rev: 120, profit: 0.75, profitChg: "-85%", roe: "1%", gm: "10%", eps: "0.05" },
  { cat: "盐化工", lvl: "上游", p1: "原盐", p2: "", end: "", app: "", rank: 2, acode: "600409", aname: "三友化工", ctrl: "唐山三友集团", cap: "原盐+纯碱+氯碱一体化", margin: "10%-20%", capex: "~15亿", desc: "化纤+纯碱+氯碱+有机硅", rev: 188, profit: 0.91, profitChg: "-82%", roe: "1%", gm: "13%", eps: "0.04" },
  { cat: "盐化工", lvl: "中游", p1: "纯碱", p2: "", end: "玻璃/洗涤剂", app: "玻璃、日化", rank: 1, acode: "000830", aname: "远兴能源", ctrl: "戴连荣", cap: "天然碱500万吨/年", margin: "20%-40%", capex: "~30亿", desc: "天然碱成本最低", rev: 120, profit: 15, profitChg: "-30%", roe: "10%", gm: "30%", eps: "0.40" },
  { cat: "盐化工", lvl: "中游", p1: "纯碱", p2: "", end: "玻璃/洗涤剂", app: "玻璃、日化", rank: 2, acode: "600328", aname: "中盐化工", ctrl: "中国盐业集团", cap: "纯碱300万吨/年", margin: "5%-15%", capex: "~10亿", desc: "国内第三大纯碱", rev: 80, profit: 0.5, profitChg: "-88%", roe: "1%", gm: "8%", eps: "0.03" },
  { cat: "盐化工", lvl: "中游", p1: "烧碱", p2: "", end: "造纸/纺织/氧化铝", app: "造纸、纺织、氧化铝", rank: 1, acode: "601678", aname: "滨化股份", ctrl: "张忠正", cap: "烧碱约60万吨/年", margin: "15%-25%", capex: "~10亿", desc: "粒状烧碱国内最大", rev: 102, profit: 2.3, profitChg: "-5%", roe: "5%", gm: "18%", eps: "0.12" },
  { cat: "盐化工", lvl: "中游", p1: "PVC", p2: "", end: "管材/型材/薄膜", app: "建筑、包装", rank: 1, acode: "002092", aname: "中泰化学", ctrl: "新疆国资委", cap: "PVC约260万吨/年", margin: "5%-15%", capex: "~20亿", desc: "国内最大PVC生产商", rev: 300, profit: -2.9, profitChg: "+70%", roe: "-2%", gm: "8%", eps: "-0.11" },

  // 油化工
  { cat: "油化工", lvl: "上游", p1: "原油炼化", p2: "", end: "石脑油/成品油", app: "交通、化工原料", rank: 1, acode: "600028", aname: "中国石化", ctrl: "中国石化集团（央企）", cap: "炼油约3亿吨/年", margin: "3%-8%", capex: "~500亿", desc: "全球最大炼油商之一", rev: 30000, profit: 500, profitChg: "-10%", roe: "8%", gm: "5%", eps: "0.41" },
  { cat: "油化工", lvl: "上游", p1: "原油炼化", p2: "", end: "石脑油/成品油", app: "交通、化工原料", rank: 2, acode: "600346", aname: "恒力石化", ctrl: "陈建华夫妇", cap: "炼油2000万吨/年", margin: "8%-15%", capex: "~100亿", desc: "民营炼化龙头", rev: 2500, profit: 50, profitChg: "-15%", roe: "8%", gm: "10%", eps: "0.71" },
  { cat: "油化工", lvl: "中游", p1: "乙烯", p2: "", end: "聚乙烯/乙二醇", app: "塑料、化纤", rank: 1, acode: "002648", aname: "卫星化学", ctrl: "杨卫东", cap: "乙烷裂解约250万吨/年", margin: "15%-25%", capex: "~60亿", desc: "轻烃一体化龙头", rev: 460.68, profit: 53.11, profitChg: "-13%", roe: "15%", gm: "20%", eps: "1.58" },
  { cat: "油化工", lvl: "中游", p1: "对二甲苯(PX)", p2: "", end: "PTA→聚酯", app: "化纤、瓶片", rank: 1, acode: "600346", aname: "恒力石化", ctrl: "陈建华夫妇", cap: "PX约500万吨/年", margin: "10%-18%", capex: "~10亿", desc: "炼化-PX-PTA-聚酯全链", rev: 300, profit: 25, profitChg: "-15%", roe: "8%", gm: "12%", eps: "0.35" },
  { cat: "油化工", lvl: "下游", p1: "涤纶长丝(POY)", p2: "", end: "服装面料/家纺", app: "纺织", rank: 1, acode: "601233", aname: "桐昆股份", ctrl: "陈士良", cap: "涤纶长丝约1000万吨/年", margin: "5%-12%", capex: "~40亿", desc: "全球最大涤纶长丝生产商", rev: 800, profit: 20.7, profitChg: "+68%", roe: "8%", gm: "8%", eps: "0.86" },

  // 煤化工
  { cat: "煤化工", lvl: "上游", p1: "煤炭", p2: "", end: "", app: "", rank: 1, acode: "601088", aname: "中国神华", ctrl: "国家能源集团（央企）", cap: "煤炭约3亿吨/年", margin: "20%-30%", capex: "~200亿", desc: "煤电化运一体化龙头", rev: 3300, profit: 600, profitChg: "-5%", roe: "15%", gm: "25%", eps: "3.02" },
  { cat: "煤化工", lvl: "中游", p1: "煤制烯烃(CTO)", p2: "", end: "聚乙烯/聚丙烯", app: "塑料", rank: 1, acode: "600989", aname: "宝丰能源", ctrl: "党彦宝", cap: "煤制烯烃约600万吨/年", margin: "25%-35%", capex: "~80亿", desc: "煤制烯烃成本+规模龙头", rev: 300, profit: 55, profitChg: "+10%", roe: "19%", gm: "33%", eps: "0.75" },
  { cat: "煤化工", lvl: "中游", p1: "煤制甲醇", p2: "", end: "甲醇→烯烃/甲醛/醋酸", app: "化工原料", rank: 1, acode: "600426", aname: "华鲁恒升", ctrl: "华鲁控股集团", cap: "甲醇约170万吨/年", margin: "15%-25%", capex: "~30亿", desc: "煤气化多联产柔性龙头", rev: 78, profit: 8, profitChg: "-5%", roe: "7%", gm: "19%", eps: "0.38" },

  // 天然气化工
  { cat: "天然气化工", lvl: "上游", p1: "天然气", p2: "", end: "", app: "", rank: 1, acode: "600803", aname: "新奥股份", ctrl: "王玉锁", cap: "天然气分销约300亿方/年", margin: "8%-15%", capex: "~50亿", desc: "天然气一体化分销龙头", rev: 1400, profit: 70, profitChg: "+15%", roe: "18%", gm: "13%", eps: "2.26" },
  { cat: "天然气化工", lvl: "中游", p1: "尿素", p2: "", end: "农业肥料", app: "农业", rank: 1, acode: "000912", aname: "泸天化", ctrl: "泸州市国资委", cap: "尿素约150万吨/年", margin: "10%-18%", capex: "~5亿", desc: "气头尿素老牌龙头", rev: 60, profit: 2.5, profitChg: "-20%", roe: "4%", gm: "12%", eps: "0.16" },
  { cat: "天然气化工", lvl: "下游", p1: "复合肥", p2: "", end: "农业肥料", app: "农业", rank: 1, acode: "000902", aname: "新洋丰", ctrl: "杨才学家族", cap: "复合肥约800万吨/年", margin: "14%-18%", capex: "~12亿", desc: "复合肥行业龙头", rev: 175, profit: 14, profitChg: "+12%", roe: "13%", gm: "17%", eps: "1.07" }
];

// 3. 重点上市公司详尽深度研报数据库 (覆盖核心龙头)
export const INDUSTRY_COMPANY_PROFILES: Record<string, CompanyDetailProfile> = {
  "巨化股份": {
    name: "巨化股份",
    code: "600160",
    market: "A",
    mktCap: 1012,
    defaultPE: 17,
    currentPrice: 37.49,
    ctrl: "浙江省国资委（巨化集团）",
    sector: "氟化工全产业链龙头",
    summary: "国内氟化工绝对龙头，拥有从萤石→AHF→制冷剂→含氟聚合物→电子化学品的完整产业链。2025年制冷剂配额制驱动利润翻倍，毛利率飙升至50.81%。2026Q1延续高景气，毛利率34.39%。",
    profitTrend: { years: [2020, 2021, 2022, 2023, 2024, 2025], values: [10.5, 22.3, 18.6, 9.4, 19.6, 37.8] },
    q1_2026: { rev: 60.18, profit: 13.0, gm: 34.39 },
    topProductsByRev: [
      { name: "制冷剂", rev: 128.71, revPct: 47.69, gm: 50.81, profit: 65.4, profitPct: 62.5 },
      { name: "石化材料", rev: 37.52, revPct: 13.90, gm: 7.2, profit: 2.7, profitPct: 2.6 },
      { name: "基础化工产品", rev: 28.90, revPct: 10.71, gm: 23.9, profit: 6.9, profitPct: 6.6 },
      { name: "含氟聚合物材料", rev: 18.62, revPct: 6.90, gm: 4.4, profit: 0.8, profitPct: 0.8 },
      { name: "氟化工原料(AHF)", rev: 12.29, revPct: 4.55, gm: 15.0, profit: 1.8, profitPct: 1.7 }
    ],
    capacities: [
      { product: "无水氢氟酸(AHF)", cap: "25万吨/年", rank: "国内前列" },
      { product: "R22", cap: "17.8万吨/年", rank: "国内第一" },
      { product: "R32", cap: "13万吨/年", rank: "配额第一" },
      { product: "R134a", cap: "6万吨/年", rank: "行业前列" },
      { product: "PTFE", cap: "2.5万吨/年", rank: "国内前列" },
      { product: "PVDF", cap: "1万吨/年", rank: "行业前列" },
      { product: "FKM(氟橡胶)", cap: "1.3万吨/年", rank: "行业前列" },
      { product: "HFOs(四代制冷剂)", cap: "0.85万吨/年", rank: "前瞻布局" }
    ],
    priceProducts: ["R32", "R134a", "PTFE", "PVDF"]
  },
  "三美股份": {
    name: "三美股份",
    code: "603379",
    market: "A",
    mktCap: 349,
    defaultPE: 12,
    currentPrice: 57.19,
    ctrl: "胡荣达家族",
    sector: "制冷剂细分龙头",
    summary: "氟碳化学品细分龙头，R134a产能行业领先，出口占比高。2025年制冷剂价格恢复性上涨驱动利润断层增长，毛利率飙升至50.60%。2026Q1延续高增。",
    profitTrend: { years: [2020, 2021, 2022, 2023, 2024, 2025], values: [2.8, 8.5, 6.2, 3.0, 8.9, 20.6] },
    q1_2026: { rev: 18.5, profit: 8.2, gm: 52.0 },
    topProductsByRev: [
      { name: "R32", rev: 18.5, revPct: 31.6, gm: 54.6, profit: 10.1, profitPct: 49.0 },
      { name: "R134a", rev: 16.2, revPct: 27.7, gm: 48.0, profit: 7.8, profitPct: 37.9 },
      { name: "R125", rev: 8.5, revPct: 14.5, gm: 45.0, profit: 3.8, profitPct: 18.4 },
      { name: "AHF(外售)", rev: 6.8, revPct: 11.6, gm: 30.0, profit: 2.0, profitPct: 9.7 }
    ],
    capacities: [
      { product: "R32", cap: "4万吨/年", rank: "行业前列" },
      { product: "R134a", cap: "6.5万吨/年", rank: "行业领先" },
      { product: "R125", cap: "5.2万吨/年", rank: "行业前列" },
      { product: "AHF", cap: "13.1万吨/年", rank: "自给率高" }
    ],
    priceProducts: ["R32", "R134a", "R125"]
  },
  "云天化": {
    name: "云天化",
    code: "600096",
    market: "A",
    mktCap: 458,
    defaultPE: 9,
    currentPrice: 24.88,
    ctrl: "云南省国资委",
    sector: "磷肥一体化超级龙头",
    summary: "磷矿储量近8亿吨，化肥产能超千万吨，磷肥全球领先。拥有矿化一体核心成本壁垒，分红慷慨。",
    profitTrend: { years: [2020, 2021, 2022, 2023, 2024, 2025], values: [2.7, 36.4, 60.2, 45.2, 52.6, 51.56] },
    q1_2026: { rev: 125.0, profit: 14.2, gm: 18.5 },
    capacities: [
      { product: "磷矿石", cap: "采选1450万吨/年", rank: "国内第一" },
      { product: "DAP", cap: "约300万吨/年", rank: "全球第一" },
      { product: "MAP", cap: "约200万吨/年", rank: "行业前列" },
      { product: "尿素", cap: "约200万吨/年", rank: "行业前列" }
    ],
    priceProducts: ["磷矿石", "MAP", "DAP", "尿素"]
  },
  "合盛硅业": {
    name: "合盛硅业",
    code: "603260",
    market: "A",
    mktCap: 620,
    defaultPE: 25,
    currentPrice: 52.3,
    ctrl: "罗立国家族",
    sector: "工业硅+有机硅全球双龙头",
    summary: "新疆煤电硅一体化极低成本龙头，工业硅与有机硅单体产能均位列全球第一。积极拓展光伏组件与第三代半导体碳化硅。",
    capacities: [
      { product: "工业硅", cap: "122万吨/年", rank: "全球第一" },
      { product: "有机硅单体", cap: "173万吨/年", rank: "全球第一" },
      { product: "碳化硅衬底", cap: "研发量产中", rank: "前瞻布局" }
    ],
    priceProducts: ["工业硅", "有机硅DMC"]
  },
  "华鲁恒升": {
    name: "华鲁恒升",
    code: "600426",
    market: "A",
    mktCap: 560,
    defaultPE: 14,
    currentPrice: 26.4,
    ctrl: "华鲁控股集团（山东国资）",
    sector: "煤化工柔性多联产标杆",
    summary: "国内煤化工行业柔性生产标杆，产品涵盖尿素、醋酸、有机胺、己二酸等。成本控制与平台化扩张能力极其突出。",
    capacities: [
      { product: "尿素", cap: "约200万吨/年", rank: "行业前列" },
      { product: "DMF", cap: "约33万吨/年", rank: "全球领先" },
      { product: "醋酸", cap: "约60万吨/年", rank: "行业前列" },
      { product: "甲醇", cap: "约170万吨/年", rank: "自给与外售" }
    ],
    priceProducts: ["尿素", "醋酸", "甲醇"]
  },
  "宝丰能源": {
    name: "宝丰能源",
    code: "600989",
    market: "A",
    mktCap: 1250,
    defaultPE: 16,
    currentPrice: 17.1,
    ctrl: "党彦宝",
    sector: "煤制烯烃成本与规模绝对龙头",
    summary: "依托宁东与内蒙极低成本煤炭坑口资源，打造世界级煤制烯烃产业基地。内蒙一期投产后烯烃总产能达600万吨/年。",
    capacities: [
      { product: "煤制烯烃(PE/PP)", cap: "约600万吨/年", rank: "国内第一" },
      { product: "甲醇", cap: "约600万吨/年", rank: "A股最大" },
      { product: "焦炭", cap: "约700万吨/年", rank: "大型基地" }
    ],
    priceProducts: ["聚乙烯", "聚丙烯", "甲醇", "焦炭"]
  }
};
