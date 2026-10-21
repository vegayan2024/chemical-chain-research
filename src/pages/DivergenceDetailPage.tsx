import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { AppData, WeightType } from "../types";
import DivergenceChart from "../components/DivergenceChart";

interface DivergenceDetailPageProps {
  data: AppData;
}

export default function DivergenceDetailPage({ data }: DivergenceDetailPageProps) {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [weightType, setWeightType] = useState<WeightType>("revenue");

  const company = data.companies.find((c) => c.code === code);
  const stockPrices = data.stockPrices[code ?? ""] ?? [];

  if (!company) {
    return (
      <div className="page-error">
        <h2>未找到公司</h2>
        <p>公司代码: {code}</p>
        <button className="c-btn" onClick={() => navigate("/")}>
          返回仪表盘
        </button>
      </div>
    );
  }

  const products = weightType === "revenue" ? company.productsByRevenue : company.productsByProfit;

  const stockRange = stockPrices.length > 0
    ? `${stockPrices[0]?.date} 至 ${stockPrices[stockPrices.length - 1]?.date}`
    : "暂无数据";
  const latestStockPrice = stockPrices.length > 0 ? stockPrices[stockPrices.length - 1]?.value : null;

  // 对应的背离信号统计区间（来自预警库）
  const companySignal = data.signals.find((s) => s.code === code);
  const divergencePeriod = companySignal
    ? `${companySignal.startDate} 至 ${companySignal.endDate}`
    : "52周滚动对齐窗口";

  return (
    <div className="page-detail">
      <div className="page-header">
        <button className="c-btn c-btn--ghost" onClick={() => navigate("/")}>
          ← 返回
        </button>
        <h1>{company.name}</h1>
        <p className="text-muted">{company.code}</p>
      </div>

      {/* 显著位置标注：个股与背离统计区间 */}
      <div className="alert-time-window-banner" style={{ margin: "var(--space-3) 0 var(--space-4)" }}>
        <div className="time-window-item">
          <span className="time-window-icon">📈</span>
          <div className="time-window-content">
            <span className="time-window-label">股票价格统计时序 ({company.name})</span>
            <span className="time-window-val font-mono">{stockRange}</span>
            <span className="time-window-badge">前复权日收盘价 · 最新收盘: {latestStockPrice ?? "-"} 元</span>
          </div>
        </div>
        <div className="time-window-item">
          <span className="time-window-icon">⏱️</span>
          <div className="time-window-content">
            <span className="time-window-label">背离雷达量化统计区间</span>
            <span className="time-window-val font-mono">{divergencePeriod}</span>
            <span className="time-window-badge">周频严格对齐 (52周/1年)</span>
          </div>
        </div>
      </div>

      <div className="weight-selector">
        <span className="weight-label">权重模式:</span>
        <button
          className={`c-btn ${weightType === "revenue" ? "c-btn--primary" : "c-btn--secondary"}`}
          onClick={() => setWeightType("revenue")}
        >
          收入权重
        </button>
        <button
          className={`c-btn ${weightType === "profit" ? "c-btn--primary" : "c-btn--secondary"}`}
          onClick={() => setWeightType("profit")}
        >
          利润权重
        </button>
      </div>

      <div className="detail-sections">
        <section className="detail-section">
          <h2>公司产品与商品价格对比</h2>
          <div className="products-info">
            {products.map((product) => {
              const commodityPrices = data.commodityPrices[product.commodityKey] ?? [];
              const commRange = commodityPrices.length > 0
                ? `${commodityPrices[0]?.date} 至 ${commodityPrices[commodityPrices.length - 1]?.date}`
                : "暂无数据";
              const latestCommPrice = commodityPrices.length > 0 ? commodityPrices[commodityPrices.length - 1]?.value : null;

              return (
                <div key={product.commodityKey} className="chart-card">
                  <div className="chart-card__header" style={{ alignItems: "flex-start" }}>
                    <div>
                      <h3>{product.productName} vs {product.commodityName}</h3>
                      <p className="text-muted font-mono" style={{ fontSize: "var(--fs-caption)", marginTop: "4px" }}>
                        商品统计区间: {commRange} (最新价格/价差: {latestCommPrice ?? "-"})
                      </p>
                    </div>
                    <span className="weight-badge">
                      权重: {(product.weight * 100).toFixed(1)}%
                    </span>
                  </div>
                  <DivergenceChart
                    stockPrices={stockPrices}
                    commodityPrices={commodityPrices}
                    stockName={company.name}
                    commodityName={product.commodityName}
                  />
                </div>
              );
            })}
            {products.length === 0 && (
              <p className="text-muted">暂无产品映射数据</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
