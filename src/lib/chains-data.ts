export interface ChainNode {
  name: string;
  key: string;
  sub?: { name: string; key: string }[];
  end?: string;
}

export type ChainCategory =
  | "氟化工"
  | "磷化工"
  | "硅化工"
  | "盐化工"
  | "油化工"
  | "煤化工"
  | "天然气化工";

export const CHAIN_TREES: Record<ChainCategory, Record<string, ChainNode[]>> = {
  氟化工: {
    "上游-核心矿产与基础酸": [{ name: "萤石 / AHF", key: "萤石", sub: [] }],
    "中游-氟碳化学品(制冷剂)": [
      {
        name: "第三代制冷剂 (HFCs)",
        key: "制冷剂",
        sub: [
          { name: "R32", key: "R32" },
          { name: "R134a", key: "R134a" },
          { name: "R125", key: "R125" },
        ],
      },
    ],
    "中游-含氟聚合物": [
      { name: "PTFE", key: "PTFE", sub: [] },
      { name: "PVDF", key: "PVDF", sub: [] },
    ],
    "中游-精细化学品与电子级": [
      { name: "六氟磷酸锂", key: "六氟磷酸锂", sub: [] },
      { name: "电子级氢氟酸", key: "电子级氢氟酸", sub: [] },
      { name: "WF6 / C4F6", key: "WF6/C4F6", sub: [] },
    ],
    下游终端应用: [
      { name: "家用/商用空调制冷", key: "", end: "空调制冷剂" },
      { name: "汽车热管理空调", key: "", end: "汽车空调制冷剂" },
      { name: "动力电池与储能", key: "", end: "电解液溶质/PVDF粘结剂" },
      { name: "半导体制造", key: "", end: "晶圆清洗/刻蚀气体" },
    ],
  },
  磷化工: {
    "上游-磷矿采选": [{ name: "磷矿石", key: "磷矿石", sub: [] }],
    "中游-传统磷肥": [
      { name: "磷酸一铵 (MAP)", key: "MAP", sub: [] },
      { name: "磷酸二铵 (DAP)", key: "DAP", sub: [] },
    ],
    "中游-新能源正极材料": [{ name: "磷酸铁锂 (LFP)", key: "磷酸铁锂", sub: [] }],
    "中游-精细磷化工与农药": [{ name: "草甘膦", key: "草甘膦", sub: [] }],
    下游终端应用: [
      { name: "大田农业种植与化肥", key: "", end: "农业基础化肥" },
      { name: "新能源电动车动力电池", key: "", end: "磷酸铁锂电芯" },
      { name: "农化除草植保", key: "", end: "除草剂" },
    ],
  },
  硅化工: {
    "上游-矿石冶炼": [{ name: "工业硅 (金属硅)", key: "工业硅", sub: [] }],
    "中游-光伏级多晶硅": [{ name: "多晶硅料", key: "多晶硅", sub: [] }],
    "中游-有机硅新材料": [
      { name: "有机硅 DMC", key: "有机硅DMC", sub: [] },
      { name: "硅烷偶联剂", key: "硅烷偶联剂", sub: [] },
      { name: "第三代半导体碳化硅", key: "碳化硅", sub: [] },
    ],
    下游终端应用: [
      { name: "光伏组件及电站", key: "", end: "光伏密封胶/硅片" },
      { name: "建筑幕墙与密封胶", key: "", end: "建筑有机硅" },
      { name: "电子电力器件", key: "", end: "功率半导体衬底" },
    ],
  },
  盐化工: {
    "上游-井矿盐/海盐": [{ name: "原盐", key: "原盐", sub: [] }],
    "中游-三碱与氯碱": [
      { name: "轻质/重质纯碱 (SA)", key: "纯碱", sub: [] },
      { name: "烧碱 (SH / 液碱/片碱)", key: "烧碱", sub: [] },
      { name: "聚氯乙烯 (PVC)", key: "PVC", sub: [] },
    ],
    下游终端应用: [
      { name: "浮法玻璃与光伏玻璃", key: "", end: "平板玻璃与光伏压延玻璃" },
      { name: "造纸与氧化铝", key: "", end: "造纸化学品" },
      { name: "管材与建材塑胶", key: "", end: "PVC管件与型材" },
    ],
  },
  油化工: {
    "上游-大炼化": [{ name: "原油炼化 / 石脑油", key: "原油炼化", sub: [] }],
    "中游-基础化工原料": [
      { name: "乙烯", key: "乙烯", sub: [] },
      { name: "丙烯", key: "丙烯", sub: [] },
      { name: "对二甲苯 (PX)", key: "PX", sub: [] },
    ],
    下游终端应用: [
      { name: "化纤纺织 (PTA/涤纶长丝)", key: "", end: "服装纺织原料" },
      { name: "聚乙烯塑胶制品", key: "", end: "薄膜与注塑容器" },
    ],
  },
  煤化工: {
    "上游-原料煤与动力煤": [{ name: "原料煤 / 焦煤", key: "煤炭", sub: [] }],
    "中游-现代煤化工": [
      { name: "煤制烯烃 (CTO)", key: "煤制烯烃", sub: [] },
      { name: "煤制甲醇 (MA)", key: "甲醇", sub: [] },
      { name: "煤制乙二醇 (MEG)", key: "乙二醇", sub: [] },
    ],
    下游终端应用: [
      { name: "工程塑料制品", key: "", end: "聚丙烯/聚乙烯" },
      { name: "聚酯切片化纤", key: "", end: "聚酯薄膜与瓶级PET" },
    ],
  },
  天然气化工: {
    "上游-天然气气头": [{ name: "工业天然气", key: "天然气", sub: [] }],
    "中游-合成氨与衍生物": [
      { name: "合成氨", key: "合成氨", sub: [] },
      { name: "尿素 (UR)", key: "尿素", sub: [] },
      { name: "BDO (1,4-丁二醇)", key: "BDO", sub: [] },
    ],
    下游终端应用: [
      { name: "现代高效复合肥", key: "", end: "农业高效水溶肥" },
      { name: "降解塑料 (PBAT/PBS)", key: "", end: "环保可降解袋与薄膜" },
    ],
  },
};
