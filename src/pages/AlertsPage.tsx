import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { AppData, SubProductSignal } from "../types";
import { formatPercent } from "../lib/format";

interface AlertsPageProps {
  data: AppData;
}

type DirectionFilter = "all" | "positive" | "negative";
type StrengthFilter = "all" | "strong" | "medium";

interface CompanyAggregatedAlert {
  code: string;
  name: string;
  formulaType?: string;
  focusRationale?: string;
  productName: string;
  commodityName: string;
  divergenceType: "positive" | "negative";
  divergenceScore: number;
  correlation: number;
  stockChange: number;
  commodityChange: number;
  profitWeight: number;
  profitImpact: number;
  probability: number;
  startDate: string;
  endDate: string;
  signalStrength: "strong" | "medium" | "weak";
  items: SubProductSignal[];
}

export default function AlertsPage({ data }: AlertsPageProps) {
  const navigate = useNavigate();
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all");
  const [strengthFilter, setStrengthFilter] = useState<StrengthFilter>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());

  // 1. 同一公司信号聚合总结逻辑
  const companyAggregatedAlerts = useMemo(() => {
    const map = new Map<string, CompanyAggregatedAlert>();

    for (const signal of data.signals) {
      const code = signal.code;
      if (!map.has(code)) {
        // 如果后端已提供 items 数组则直接使用，否则根据平铺项构建
        const initialItems: SubProductSignal[] = signal.items && signal.items.length > 0 
          ? [...signal.items] 
          : [{
              productName: signal.productName,
              commodityName: signal.commodityName,
              profitWeight: signal.profitWeight ?? 1.0,
              commodityChange: signal.commodityChange,
              stockChange: signal.stockChange,
              divergenceType: signal.divergenceType,
              divergenceScore: signal.divergenceScore,
              correlation: signal.correlation,
              profitImpact: signal.profitImpact ?? (signal.profitWeight ?? 1.0) * signal.commodityChange,
              probability: signal.probability ?? 70.0,
              signalStrength: signal.signalStrength
            }];

        map.set(code, {
          code: signal.code,
          name: signal.name,
          formulaType: signal.formulaType,
          focusRationale: signal.focusRationale,
          productName: signal.productName,
          commodityName: signal.commodityName,
          divergenceType: signal.divergenceType,
          divergenceScore: signal.divergenceScore,
          correlation: signal.correlation,
          stockChange: signal.stockChange,
          commodityChange: signal.commodityChange,
          profitWeight: signal.profitWeight ?? 1.0,
          profitImpact: signal.profitImpact ?? (signal.profitWeight ?? 1.0) * signal.commodityChange,
          probability: signal.probability ?? 70.0,
          startDate: signal.startDate,
          endDate: signal.endDate,
          signalStrength: signal.signalStrength,
          items: initialItems
        });
      } else {
        const existing = map.get(code)!;
        // 如果后端是平铺格式，追加细分子项
        const alreadyHasItem = existing.items.some(it => it.productName === signal.productName);
        if (!alreadyHasItem) {
          const newItem: SubProductSignal = {
            productName: signal.productName,
            commodityName: signal.commodityName,
            profitWeight: signal.profitWeight ?? 1.0,
            commodityChange: signal.commodityChange,
            stockChange: signal.stockChange,
            divergenceType: signal.divergenceType,
            divergenceScore: signal.divergenceScore,
            correlation: signal.correlation,
            profitImpact: signal.profitImpact ?? (signal.profitWeight ?? 1.0) * signal.commodityChange,
            probability: signal.probability ?? 70.0,
            signalStrength: signal.signalStrength
          };
          existing.items.push(newItem);
          
          // 重新汇总公司级指标
          existing.divergenceScore = Math.max(existing.divergenceScore, signal.divergenceScore);
          if (signal.signalStrength === "strong") existing.signalStrength = "strong";
          existing.profitImpact = Number((existing.profitImpact + newItem.profitImpact).toFixed(4));
          const totalWeight = existing.items.reduce((acc, it) => acc + (it.profitWeight || 1.0), 0);
          existing.probability = Math.round(existing.items.reduce((acc, it) => acc + it.probability * (it.profitWeight || 1.0), 0) / Math.max(0.01, totalWeight));
          existing.productName = `${existing.items[0]?.productName ?? "核心产品"} 等 ${existing.items.length} 个产品`;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const strengthOrder = { strong: 0, medium: 1, weak: 2 };
      const sDiff = strengthOrder[a.signalStrength] - strengthOrder[b.signalStrength];
      if (sDiff !== 0) return sDiff;
      return b.divergenceScore - a.divergenceScore;
    });
  }, [data.signals]);

  // 2. 正负方向及强度筛选统计
  const totalCount = companyAggregatedAlerts.length;
  const positiveCount = companyAggregatedAlerts.filter(s => s.divergenceType === "positive").length;
  const negativeCount = companyAggregatedAlerts.filter(s => s.divergenceType === "negative").length;
  const strongCount = companyAggregatedAlerts.filter(s => s.signalStrength === "strong").length;
  const mediumCount = companyAggregatedAlerts.filter(s => s.signalStrength === "medium").length;

  const filteredAlerts = useMemo(() => {
    return companyAggregatedAlerts.filter(item => {
      // 方向筛选
      if (directionFilter !== "all" && item.divergenceType !== directionFilter) {
        return false;
      }
      // 强度筛选
      if (strengthFilter !== "all" && item.signalStrength !== strengthFilter) {
        return false;
      }
      // 关键字检索
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const matchName = item.name.toLowerCase().includes(kw);
        const matchCode = item.code.toLowerCase().includes(kw);
        const matchProduct = item.items.some(it => it.productName.toLowerCase().includes(kw) || it.commodityName.toLowerCase().includes(kw));
        if (!matchName && !matchCode && !matchProduct) return false;
      }
      return true;
    });
  }, [companyAggregatedAlerts, directionFilter, strengthFilter, searchKeyword]);

  const toggleExpand = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleCompanyClick = (code: string) => {
    navigate(`/divergence/${code}`);
  };

  const getFormulaLabel = (type?: string) => {
    switch (type) {
      case "spread": return "产业链价差驱动";
      case "processing_fee": return "加工费利差驱动";
      case "byproduct_composite": return "副产品剪刀差驱动";
      case "price": return "终端绝对价格驱动";
      default: return "综合基本面驱动";
    }
  };

  return (
    <div className="page-alerts">
      <div className="page-header">
        <div className="page-header__main">
          <h1>背离信号预警雷达</h1>
          <p className="text-muted">
            按公司整合呈现全部产品背离信号，分类透视正向（低估重估）与负向（承压风险）预期
          </p>
        </div>
      </div>

      {/* 核心控制栏：正负方向分类与强度过滤 */}
      <div className="alert-controls-card">
        <div className="alert-filter-tabs">
          <button
            className={`alert-tab ${directionFilter === "all" ? "alert-tab--active" : ""}`}
            onClick={() => setDirectionFilter("all")}
          >
            全部信号预警 ({totalCount})
          </button>
          <button
            className={`alert-tab alert-tab--positive ${directionFilter === "positive" ? "alert-tab--active-positive" : ""}`}
            onClick={() => setDirectionFilter("positive")}
          >
            <span className="c-dot c-dot--rise" />
            正向背离 (潜在低估/基本面走强) ({positiveCount})
          </button>
          <button
            className={`alert-tab alert-tab--negative ${directionFilter === "negative" ? "alert-tab--active-negative" : ""}`}
            onClick={() => setDirectionFilter("negative")}
          >
            <span className="c-dot c-dot--fall" />
            负向背离 (潜在透支/基本面承压) ({negativeCount})
          </button>
        </div>

        <div className="alert-secondary-filters">
          <div className="alert-strength-toggles">
            <span className="filter-hint">信号强度:</span>
            <button
              className={`pill-btn ${strengthFilter === "all" ? "pill-btn--active" : ""}`}
              onClick={() => setStrengthFilter("all")}
            >
              全部 ({totalCount})
            </button>
            <button
              className={`pill-btn pill-btn--strong ${strengthFilter === "strong" ? "pill-btn--active" : ""}`}
              onClick={() => setStrengthFilter("strong")}
            >
              强信号 ({strongCount})
            </button>
            <button
              className={`pill-btn ${strengthFilter === "medium" ? "pill-btn--active" : ""}`}
              onClick={() => setStrengthFilter("medium")}
            >
              中等 ({mediumCount})
            </button>
          </div>

          <div className="alert-search-box">
            <input
              type="text"
              placeholder="搜索公司名称 / 代码 / 细分产品..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="c-input alert-search-input"
            />
          </div>
        </div>
      </div>

      {/* 预警列表（同一公司聚合） */}
      <div className="alert-company-list">
        {filteredAlerts.map((companyAlert) => {
          const isExpanded = expandedCodes.has(companyAlert.code);

          return (
            <div
              key={companyAlert.code}
              className={`alert-company-card ${
                companyAlert.divergenceType === "positive" ? "alert-company-card--positive" : "alert-company-card--negative"
              } ${companyAlert.signalStrength === "strong" ? "alert-company-card--strong" : ""}`}
            >
              {/* 卡片主视图 (总结头部) */}
              <div 
                className="alert-company-card__header"
                onClick={() => toggleExpand(companyAlert.code)}
              >
                <div className="company-info-block">
                  <div className="company-title-row">
                    <span className="company-name">{companyAlert.name}</span>
                    <span className="company-code">{companyAlert.code}</span>
                    <span className="formula-type-tag">
                      {getFormulaLabel(companyAlert.formulaType)}
                    </span>
                    <span className={`signal-badge ${
                      companyAlert.signalStrength === "strong" ? "signal-badge--strong" : "signal-badge--medium"
                    }`}>
                      {companyAlert.signalStrength === "strong" ? "⚡ 强背离" : "中等背离"}
                    </span>
                    <span className={`direction-badge ${
                      companyAlert.divergenceType === "positive" ? "direction-badge--pos" : "direction-badge--neg"
                    }`}>
                      {companyAlert.divergenceType === "positive" ? "正背离 (看多修复)" : "负背离 (防范回调)"}
                    </span>
                  </div>

                  {companyAlert.focusRationale && (
                    <div className="company-rationale-row">
                      <span className="rationale-prefix">研报逻辑:</span> {companyAlert.focusRationale}
                    </div>
                  )}
                </div>

                <div className="expand-trigger">
                  <span className="expand-text">
                    {isExpanded ? "收起细分产品" : `展开 ${companyAlert.items.length} 个细分产品`}
                  </span>
                  <span className={`expand-chevron ${isExpanded ? "expand-chevron--open" : ""}`}>
                    ▾
                  </span>
                </div>
              </div>

              {/* 核心指标看板总结 */}
              <div className="alert-company-card__summary-grid">
                <div className="summary-metric-card">
                  <span className="metric-label">股票区间涨跌</span>
                  <span className={`metric-val num ${companyAlert.stockChange >= 0 ? "t-rise" : "t-fall"}`}>
                    {formatPercent(companyAlert.stockChange)}
                  </span>
                  <span className="metric-subtext">52周滚动窗口</span>
                </div>

                <div className="summary-metric-card">
                  <span className="metric-label">大宗基本面变动</span>
                  <span className={`metric-val num ${companyAlert.commodityChange >= 0 ? "t-rise" : "t-fall"}`}>
                    {formatPercent(companyAlert.commodityChange)}
                  </span>
                  <span className="metric-subtext">{companyAlert.commodityName}</span>
                </div>

                <div className="summary-metric-card summary-metric-card--highlight">
                  <span className="metric-label">对利润预期综合影响</span>
                  <span className={`metric-val num ${companyAlert.profitImpact >= 0 ? "t-rise" : "t-fall"}`}>
                    {companyAlert.profitImpact >= 0 ? "+" : ""}{(companyAlert.profitImpact * 100).toFixed(1)}%
                  </span>
                  <span className="metric-subtext">按细分业务毛利权重加权</span>
                </div>

                <div className="summary-metric-card summary-metric-card--prob">
                  <span className="metric-label">背离修复/发生概率</span>
                  <span className="metric-val num t-brand">
                    {companyAlert.probability.toFixed(1)}%
                  </span>
                  <span className="metric-subtext">基于历史相关性与剪刀差推算</span>
                </div>
              </div>

              {/* 点击后细分项单独呈现 (折叠展开区域) */}
              {isExpanded && (
                <div className="subproduct-drilldown-panel">
                  <div className="drilldown-header">
                    <h4>
                      细分产品线对公司利润的影响与发生概率明细 ({companyAlert.items.length}项)
                    </h4>
                    <span className="drilldown-hint">
                      各业务权重乘算该商品价格变化率，得出对总利润预期的直接弹性贡献
                    </span>
                  </div>

                  <div className="drilldown-table-wrapper">
                    <table className="drilldown-table">
                      <thead>
                        <tr>
                          <th>细分主营业务</th>
                          <th>对应大宗商品 / 价差</th>
                          <th>利润权重</th>
                          <th>商品涨跌</th>
                          <th>对利润预期影响</th>
                          <th>修复概率</th>
                          <th>滚动相关性</th>
                          <th>背离方向</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyAlert.items.map((subItem, sIdx) => {
                          const impactPct = (subItem.profitImpact * 100).toFixed(1);
                          return (
                            <tr key={`${companyAlert.code}-sub-${sIdx}`}>
                              <td className="font-semibold text-white">
                                {subItem.productName}
                              </td>
                              <td className="text-muted">
                                {subItem.commodityName}
                              </td>
                              <td className="num">
                                {(subItem.profitWeight * 100).toFixed(0)}%
                              </td>
                              <td className={`num ${subItem.commodityChange >= 0 ? "t-rise" : "t-fall"}`}>
                                {formatPercent(subItem.commodityChange)}
                              </td>
                              <td className="num">
                                <span className={`impact-badge ${subItem.profitImpact >= 0 ? "impact-badge--pos" : "impact-badge--neg"}`}>
                                  {subItem.profitImpact >= 0 ? `拉动 +${impactPct}%` : `拖累 ${impactPct}%`}
                                </span>
                              </td>
                              <td className="num font-bold text-white">
                                {subItem.probability.toFixed(1)}%
                              </td>
                              <td className="num">
                                {subItem.correlation.toFixed(2)}
                              </td>
                              <td>
                                <span className={`micro-badge ${subItem.divergenceType === "positive" ? "micro-badge--pos" : "micro-badge--neg"}`}>
                                  {subItem.divergenceType === "positive" ? "正向背离" : "负向背离"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="drilldown-footer">
                    <button
                      className="c-btn c-btn--primary c-btn--sm"
                      onClick={() => handleCompanyClick(companyAlert.code)}
                    >
                      进入 {companyAlert.name} 完整52周量化回测与产品图表 →
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="c-empty">
            <p>未发现符合筛选条件的背离预警标的</p>
          </div>
        )}
      </div>
    </div>
  );
}
