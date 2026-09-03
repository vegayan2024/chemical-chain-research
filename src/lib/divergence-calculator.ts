import type { DivergenceSignal, AdvancedDivergenceSignal, FuturesBasisData } from "../types";

/**
 * 计算两个价格序列的 Pearson 相关系数
 * @param x 第一个价格序列
 * @param y 第二个价格序列
 * @returns 相关系数，范围 [-1, 1]
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  const xSlice = x.slice(0, n);
  const ySlice = y.slice(0, n);

  const xMean = xSlice.reduce((a, b) => a + b, 0) / n;
  const yMean = ySlice.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = xSlice[i]! - xMean;
    const yDiff = ySlice[i]! - yMean;
    numerator += xDiff * yDiff;
    denominatorX += xDiff * xDiff;
    denominatorY += yDiff * yDiff;
  }

  const denominator = Math.sqrt(denominatorX * denominatorY);
  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * 计算价格变化率
 * @param prices 价格序列
 * @param period 计算周期（天数）
 * @returns 变化率数组
 */
export function calculateReturns(prices: number[], period: number = 1): number[] {
  const returns: number[] = [];
  for (let i = period; i < prices.length; i++) {
    const prev = prices[i - period]!;
    if (prev === 0) {
      returns.push(0);
    } else {
      returns.push((prices[i]! - prev) / prev);
    }
  }
  return returns;
}

/**
 * 计算滑动窗口相关性
 * @param x 第一个价格序列
 * @param y 第二个价格序列
 * @param windowSize 窗口大小
 * @returns 相关系数时序
 */
export function calculateSlidingCorrelation(
  x: number[],
  y: number[],
  windowSize: number,
): number[] {
  const correlations: number[] = [];
  const n = Math.min(x.length, y.length);

  for (let i = windowSize; i <= n; i++) {
    const xWindow = x.slice(i - windowSize, i);
    const yWindow = y.slice(i - windowSize, i);
    correlations.push(calculateCorrelation(xWindow, yWindow));
  }

  return correlations;
}

/**
 * 检测背离信号（只取最近一年数据）
 *
 * 背离条件使用动态百分位阈值代替固定阈值：
 * 基于 Gorton & Rouwenhorst (2006) 和 Engle (2002) 的研究，商品-股票相关性
 * 具有时变特征，在不同市场体制下差异显著。使用历史滑动相关性的百分位作为阈值，
 * 能自适应低相关性时期（正常）和高相关性时期（危机）。
 *
 * @param stockPrices 股票价格序列
 * @param commodityPrices 商品价格序列
 * @param dates 日期序列
 * @param windowSize 检测窗口大小（默认52周=1年）
 * @param historicalCorrelations 可选：历史滑动相关性序列，用于动态计算阈值百分位。
 *        若不提供则回退到固定阈值 0.3（兼容旧行为）。
 * @param percentileThreshold 百分位阈值（默认0.2，即20%分位）
 * @returns 背离信号数组
 */
export function detectDivergence(
  stockPrices: number[],
  commodityPrices: number[],
  dates: string[],
  windowSize: number = 52,
  historicalCorrelations?: number[],
  percentileThreshold: number = 0.2,
): DivergenceSignal[] {
  const signals: DivergenceSignal[] = [];
  const n = Math.min(stockPrices.length, commodityPrices.length);

  if (n < windowSize) return signals;

  // 只取最近一年的数据
  const recentStockPrices = stockPrices.slice(-windowSize);
  const recentCommodityPrices = commodityPrices.slice(-windowSize);
  const recentDates = dates.slice(-windowSize);

  // 计算收益率
  const stockReturns = calculateReturns(recentStockPrices);
  const commodityReturns = calculateReturns(recentCommodityPrices);

  // 计算累计收益（最近一年）
  const stockCumReturn = stockReturns.reduce((a, b) => a + b, 0);
  const commodityCumReturn = commodityReturns.reduce((a, b) => a + b, 0);

  // 计算相关性
  const correlation = calculateCorrelation(stockReturns, commodityReturns);

  // 背离条件：相关性较低且方向相反
  // 动态阈值：若提供历史相关性序列，使用百分位；否则回退到固定阈值
  let divergenceThreshold: number;
  if (historicalCorrelations && historicalCorrelations.length > 0) {
    const sorted = [...historicalCorrelations].sort((a, b) => a - b);
    // 取绝对值：百分位可能为负（相关性可正可负），而比较时用的是 |correlation|
    divergenceThreshold = Math.abs(percentile(sorted, percentileThreshold));
  } else {
    divergenceThreshold = 0.3;
  }
  const returnThreshold = 0.10;
  const isDecoupled = correlation < divergenceThreshold;
  const isOppositeReturns = stockCumReturn * commodityCumReturn < 0;
  const isReturnSignificant = Math.abs(stockCumReturn) > returnThreshold && Math.abs(commodityCumReturn) > returnThreshold;

  if (isDecoupled && isOppositeReturns && isReturnSignificant) {
    const divergenceType = stockCumReturn > 0 ? "negative" : "positive";
    const divergenceScore = Math.abs(stockCumReturn - commodityCumReturn);

    signals.push({
      code: "",
      name: "",
      productName: "",
      commodityName: "",
      divergenceType,
      divergenceScore,
      correlation,
      stockChange: stockCumReturn,
      commodityChange: commodityCumReturn,
      startDate: recentDates[0] ?? "",
      endDate: recentDates[recentDates.length - 1] ?? "",
      signalStrength: divergenceScore > 0.3 ? "strong" : divergenceScore > 0.2 ? "medium" : "weak",
    });
  }

  return signals;
}

/**
 * 计算百分位阈值
 * 基于学术研究 (Gorton & Rouwenhorst 2006, Engle 2002)，商品-股票相关性具有时变特征，
 * 使用历史分布的百分位比固定阈值更能适应不同市场体制。
 * @param sortedValues 已排序的数值数组
 * @param p 百分位 (0-1)
 * @returns 对应百分位的值
 */
export function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  if (p <= 0) return sortedValues[0]!;
  if (p >= 1) return sortedValues[sortedValues.length - 1]!;

  const idx = (sortedValues.length - 1) * p;
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sortedValues[lower]!;

  const weight = idx - lower;
  return sortedValues[lower]! * (1 - weight) + sortedValues[upper]! * weight;
}

/**
 * 计算 Z-Score
 * @param values 数值数组
 * @returns Z-Score 数组
 */
export function calculateZScore(values: number[]): number[] {
  const n = values.length;
  if (n < 2) return values.map(() => 0);

  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);

  if (std === 0) return values.map(() => 0);

  return values.map((v) => (v - mean) / std);
}

/**
 * 简单 OLS 回归: y = alpha + beta * x
 * @returns { alpha, beta, residuals, rSquared }
 */
export function calculateOLS(
  x: number[],
  y: number[],
): { alpha: number; beta: number; residuals: number[]; rSquared: number } {
  const n = Math.min(x.length, y.length);
  if (n < 2) return { alpha: 0, beta: 0, residuals: [], rSquared: 0 };

  const xSlice = x.slice(0, n);
  const ySlice = y.slice(0, n);

  const xMean = xSlice.reduce((a, b) => a + b, 0) / n;
  const yMean = ySlice.reduce((a, b) => a + b, 0) / n;

  let sxx = 0;
  let sxy = 0;
  let syy = 0;

  for (let i = 0; i < n; i++) {
    const xd = xSlice[i]! - xMean;
    const yd = ySlice[i]! - yMean;
    sxx += xd * xd;
    sxy += xd * yd;
    syy += yd * yd;
  }

  const beta = sxx === 0 ? 0 : sxy / sxx;
  const alpha = yMean - beta * xMean;

  const residuals: number[] = [];
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const pred = alpha + beta * xSlice[i]!;
    const res = ySlice[i]! - pred;
    residuals.push(res);
    ssRes += res * res;
  }

  const rSquared = syy === 0 ? 0 : Math.max(0, 1 - ssRes / syy);

  return { alpha, beta, residuals, rSquared };
}

/**
 * 协整残差 Z-Score 偏离度检测 (Engle-Granger 长期均衡定价误差模型)
 * ln(Stock) = alpha + beta * ln(Spread or Commodity) + e_t
 * 若最新残差偏离均值超过 2.0 倍标准差，说明当前存在强均值回归背离压力。
 */
export function calculateCointegrationZScore(
  stockPrices: number[],
  commodityPrices: number[],
  windowSize: number = 120,
): { currentZScore: number; beta: number; rSquared: number; residuals: number[] } {
  const n = Math.min(stockPrices.length, commodityPrices.length);
  if (n < windowSize || windowSize < 10) {
    return { currentZScore: 0, beta: 0, rSquared: 0, residuals: [] };
  }

  const recentStock = stockPrices.slice(-windowSize);
  const recentComm = commodityPrices.slice(-windowSize);

  // 对数化以稳定方差并拟合弹性
  const logStock = recentStock.map((p) => Math.log(Math.max(p, 0.0001)));
  const logComm = recentComm.map((p) => Math.log(Math.max(p, 0.0001)));

  const { beta, residuals, rSquared } = calculateOLS(logComm, logStock);
  const zScores = calculateZScore(residuals);
  const currentZScore = zScores[zScores.length - 1] ?? 0;

  return { currentZScore, beta, rSquared, residuals };
}

/**
 * 领先滞后互相关分析 (Lead-Lag Cross-Correlation)
 * 计算商品变化对股票收益率的最优时滞阶数
 * @param commodityReturns 商品日度变化率
 * @param stockReturns 股票日度收益率
 * @param maxLag 最大时滞搜索范围 (天)
 * @returns { optimalLag, maxCorrelation }
 *   optimalLag > 0 表示商品领先股票该天数；optimalLag < 0 表示股票先行反应
 */
export function calculateLeadLag(
  commodityReturns: number[],
  stockReturns: number[],
  maxLag: number = 15,
): { optimalLag: number; maxCorrelation: number; lagCorrelations: Record<number, number> } {
  const n = Math.min(commodityReturns.length, stockReturns.length);
  if (n < maxLag * 2 + 5) {
    return { optimalLag: 0, maxCorrelation: 0, lagCorrelations: {} };
  }

  let bestLag = 0;
  let maxAbsCorr = -1;
  let signedCorr = 0;
  const lagCorrelations: Record<number, number> = {};

  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let commSlice: number[];
    let stockSlice: number[];

    if (lag >= 0) {
      // comm[t - lag] vs stock[t]: 商品先发生
      commSlice = commodityReturns.slice(0, n - lag);
      stockSlice = stockReturns.slice(lag, n);
    } else {
      // comm[t] vs stock[t - |lag|]: 股票先发生
      const absLag = Math.abs(lag);
      commSlice = commodityReturns.slice(absLag, n);
      stockSlice = stockReturns.slice(0, n - absLag);
    }

    const corr = calculateCorrelation(commSlice, stockSlice);
    lagCorrelations[lag] = corr;

    if (Math.abs(corr) > maxAbsCorr) {
      maxAbsCorr = Math.abs(corr);
      bestLag = lag;
      signedCorr = corr;
    }
  }

  return { optimalLag: bestLag, maxCorrelation: signedCorr, lagCorrelations };
}

/**
 * 分析期货基差结构 (Basis Analysis & Convenience Yield)
 * @param spotPrice 现货价格
 * @param futuresPrice 主力期货合约价格
 */
export function analyzeFuturesBasis(
  spotPrice: number,
  futuresPrice: number,
): FuturesBasisData & { isBackwardation: boolean; isContango: boolean } {
  const basis = spotPrice - futuresPrice;
  const basisRate = futuresPrice === 0 ? 0 : basis / futuresPrice;

  let structure: "backwardation" | "contango" | "flat" = "flat";
  if (basisRate > 0.015) {
    structure = "backwardation"; // 现货溢价 / 极度紧缺
  } else if (basisRate < -0.015) {
    structure = "contango"; // 期货升水 / 供给过剩或投机溢价
  }

  return {
    commodityKey: "",
    spotPrice,
    futuresPrice,
    basis,
    basisRate,
    structure,
    isBackwardation: structure === "backwardation",
    isContango: structure === "contango",
  };
}

/**
 * 高级背离信号确认器 (结合协整残差、基差验证与置信度打分)
 */
export function detectAdvancedDivergence(
  stockPrices: number[],
  commodityPrices: number[],
  dates: string[],
  futuresPrices?: number[],
  spreadPrices?: number[],
  windowSize: number = 52,
): AdvancedDivergenceSignal[] {
  // 1. 获取基础背离信号
  let baseSignals = detectDivergence(stockPrices, commodityPrices, dates, windowSize);

  // 2. 协整残差 Z-Score 检验 (长期均衡定价误差模型)
  const targetCommoditySeries = spreadPrices && spreadPrices.length === commodityPrices.length
    ? spreadPrices
    : commodityPrices;
  const { currentZScore } = calculateCointegrationZScore(stockPrices, targetCommoditySeries, Math.min(windowSize, 120));

  const recentStockPrices = stockPrices.slice(-windowSize);
  const recentCommodityPrices = commodityPrices.slice(-windowSize);
  const stockReturns = calculateReturns(recentStockPrices);
  const commodityReturns = calculateReturns(recentCommodityPrices);
  const stockCumReturn = stockReturns.reduce((a, b) => a + b, 0);
  const commodityCumReturn = commodityReturns.reduce((a, b) => a + b, 0);

  // 若基础短线相关性未检出，但长期协整残差发生统计显著偏离且累计走势异号，补充协整强背离信号
  if (baseSignals.length === 0 && stockCumReturn * commodityCumReturn < 0 && Math.abs(currentZScore) >= 1.5) {
    const divergenceType = stockCumReturn > 0 ? "negative" : "positive";
    const divergenceScore = Math.abs(stockCumReturn - commodityCumReturn);
    baseSignals = [{
      code: "",
      name: "",
      productName: "",
      commodityName: "",
      divergenceType,
      divergenceScore,
      correlation: calculateCorrelation(stockReturns, commodityReturns),
      stockChange: stockCumReturn,
      commodityChange: commodityCumReturn,
      startDate: dates[dates.length - windowSize] ?? "",
      endDate: dates[dates.length - 1] ?? "",
      signalStrength: divergenceScore > 0.3 ? "strong" : "medium",
    }];
  }

  if (baseSignals.length === 0) return [];

  // 3. 期货基差验证
  let confirmedByFutures = false;
  let basisStructure: "backwardation" | "contango" | "flat" = "flat";
  if (futuresPrices && futuresPrices.length > 0) {
    const latestSpot = commodityPrices[commodityPrices.length - 1] ?? 0;
    const latestFutures = futuresPrices[futuresPrices.length - 1] ?? latestSpot;
    const basisInfo = analyzeFuturesBasis(latestSpot, latestFutures);
    basisStructure = basisInfo.structure;

    // 若为正向背离（商品/价差强，股价弱），若基差呈现货溢价(Backwardation)，则属于最真实的供需偏紧驱动，验证通过！
    confirmedByFutures = basisInfo.isBackwardation || Math.abs(basisInfo.basisRate) < 0.05;
  } else {
    // 无期货合约标的时默认依据价差残差
    confirmedByFutures = Math.abs(currentZScore) >= 1.5;
  }

  // 4. 计算前瞻领先天数
  const stockRet = calculateReturns(stockPrices.slice(-windowSize));
  const commRet = calculateReturns(commodityPrices.slice(-windowSize));
  const { optimalLag } = calculateLeadLag(commRet, stockRet, 15);

  // 5. 置信度评级 (AAA: 协整残差>2.0且期货现货溢价共振; AA: 残差>1.5; A: 基础背离且非Contango; B: 普通)
  return baseSignals.map((sig) => {
    let confidenceGrade: "AAA" | "AA" | "A" | "B" = "B";

    const isExtremeCointegration = Math.abs(currentZScore) >= 2.0;
    const isModerateCointegration = Math.abs(currentZScore) >= 1.4;

    if (isExtremeCointegration && confirmedByFutures && basisStructure === "backwardation") {
      confidenceGrade = "AAA";
    } else if (isModerateCointegration && confirmedByFutures) {
      confidenceGrade = "AA";
    } else if (confirmedByFutures || isModerateCointegration) {
      confidenceGrade = "A";
    }

    return {
      ...sig,
      spreadChange: spreadPrices ? calculateReturns(spreadPrices.slice(-windowSize)).reduce((a, b) => a + b, 0) : undefined,
      basisStructure,
      cointegrationZScore: Number(currentZScore.toFixed(2)),
      leadLagDays: optimalLag,
      confirmedByFutures,
      confidenceGrade,
    };
  });
}

