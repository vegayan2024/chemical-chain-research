/** 信源置信度等级 */
export type SourceConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

/** 数据信源元数据 */
export interface DataSourceInfo {
  id: "tushare" | "akshare" | "broker_excel";
  name: string;
  category: "stock" | "commodity" | "futures" | "financial";
  confidence: SourceConfidenceLevel;
  confidenceScore: number; // 1-100
  description: string;
  status: "active" | "standby";
  refreshRate: string;
}

/** 价格数据点 */
export interface PricePoint {
  date: string;
  value: number;
  source?: string;
  confidence?: SourceConfidenceLevel;
}

/** 公司基本信息 */
export interface Company {
  code: string;
  name: string;
  group: "chemical" | "mining" | "explosive";
  productsByRevenue: ProductMapping[];
  productsByProfit: ProductMapping[];
}

/** 权重类型 */
export type WeightType = "revenue" | "profit";

/** 公司产品映射 */
export interface ProductMapping {
  productName: string;
  commodityKey: string;
  commodityName: string;
  weight: number;
}

/** 背离信号 */
export interface DivergenceSignal {
  code: string;
  name: string;
  productName: string;
  commodityName: string;
  divergenceType: "positive" | "negative";
  divergenceScore: number;
  correlation: number;
  stockChange: number;
  commodityChange: number;
  startDate: string;
  endDate: string;
  signalStrength: "strong" | "medium" | "weak";
}

/** 相关性数据 */
export interface CorrelationData {
  code: string;
  name: string;
  productName: string;
  commodityName: string;
  correlation60d: number;
  correlation120d: number;
  correlation250d: number;
  lastUpdated: string;
}

/** 估值数据 */
export interface ValuationData {
  code: string;
  name: string;
  close: number | null;
  pb: number | null;
  pe: number | null;
  pbPercentile: number | null;
  pePercentile: number | null;
  priceHistory: number[];
  low20DurationYears: number;
}

/** 财务数据 */
export interface FinancialData {
  code: string;
  name: string;
  year: string | null;
  deductedProfitYoY: number | null;
  debtToAssets: number | null;
}

/** 应用数据 */
export interface AppData {
  companies: Company[];
  signals: DivergenceSignal[];
  correlations: CorrelationData[];
  commodityPrices: Record<string, PricePoint[]>;
  stockPrices: Record<string, PricePoint[]>;
  valuationData: Record<string, ValuationData>;
  financialData: Record<string, FinancialData>;
  spreadData?: Record<string, ProductSpread>;
  futuresData?: Record<string, FuturesBasisData>;
}

/** 期货与基差数据 */
export interface FuturesBasisData {
  commodityKey: string;
  spotPrice: number;
  futuresPrice: number;
  basis: number; // spot - futures
  basisRate: number; // (spot - futures) / futures
  structure: "backwardation" | "contango" | "flat"; // 现货溢价 (供需偏紧) vs 期货升水 (远期乐观/贴水炒作)
}

/** 产品理论价差 (Crack / Product Spread 剪刀差) */
export interface ProductSpread {
  productKey: string;
  productName: string;
  spreadHistory: PricePoint[];
  currentSpread: number;
  spreadPercentile: number; // 历史价差分位数
  spreadStatus: "expanding" | "contracting" | "neutral";
}

/** 高级协整与背离确认结果 (学术前沿增强) */
export interface AdvancedDivergenceSignal extends DivergenceSignal {
  spreadChange?: number; // 理论价差变动
  basisStructure?: "backwardation" | "contango" | "flat"; // 基差期限结构
  cointegrationZScore?: number; // 协整残差 Z-Score 偏离度
  leadLagDays?: number; // 互相关测算得到的领先/滞后天数
  confirmedByFutures: boolean; // 是否通过期货基差共振确认 (过滤假突破)
  confidenceGrade: "AAA" | "AA" | "A" | "B"; // 综合胜率置信度评级
}

/** 主题模式 */
export type ThemeMode = "dark" | "light";
