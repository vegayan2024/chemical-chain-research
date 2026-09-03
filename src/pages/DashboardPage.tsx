import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AppData, DivergenceSignal, WeightType } from "../types";
import GroupedSignalTable from "../components/GroupedSignalTable";
import CorrelationHeatmap from "../components/CorrelationHeatmap";
import CompanyListTable from "../components/CompanyListTable";
import CommodityMarketTable from "../components/CommodityMarketTable";

interface DashboardPageProps {
  data: AppData;
}

type Tab = "commodities" | "signals" | "all" | "heatmap";

export default function DashboardPage({ data }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("commodities");
  const [weightType, setWeightType] = useState<WeightType>("revenue");
  const navigate = useNavigate();

  const handleSelectSignal = (signal: DivergenceSignal) => {
    navigate(`/divergence/${signal.code}`);
  };

  const handleSelectCompany = (code: string) => {
    navigate(`/divergence/${code}`);
  };

  return (
    <div className="page-dashboard">
      <div className="page-header">
        <h1>价格背离信号与大宗化工数据库</h1>
        <p className="text-muted">全景跟踪 600+ 化工品最新价格、价差、开工率及多周期（1月/3月/6月/1年）走势与股票背离信号</p>
      </div>

      <div className="c-tabs">
        <button
          className={`c-tab ${activeTab === "commodities" ? "c-tab--active" : ""}`}
          onClick={() => setActiveTab("commodities")}
        >
          最新商品市场 (600+品种)
        </button>
        <button
          className={`c-tab ${activeTab === "signals" ? "c-tab--active" : ""}`}
          onClick={() => setActiveTab("signals")}
        >
          背离信号列表 ({data.signals.length})
        </button>
        <button
          className={`c-tab ${activeTab === "all" ? "c-tab--active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          全部股票 ({data.companies.length})
        </button>
        <button
          className={`c-tab ${activeTab === "heatmap" ? "c-tab--active" : ""}`}
          onClick={() => setActiveTab("heatmap")}
        >
          相关性热力图
        </button>
      </div>

      {activeTab === "all" && (
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
      )}

      <div className="tab-content">
        {activeTab === "commodities" && <CommodityMarketTable />}
        {activeTab === "signals" && (
          <GroupedSignalTable
            signals={data.signals}
            valuationData={data.valuationData}
            financialData={data.financialData}
            onSelectSignal={handleSelectSignal}
          />
        )}
        {activeTab === "all" && (
          <CompanyListTable
            companies={data.companies}
            correlations={data.correlations}
            signals={data.signals}
            weightType={weightType}
            onSelectCompany={handleSelectCompany}
          />
        )}
        {activeTab === "heatmap" && (
          <CorrelationHeatmap correlations={data.correlations} />
        )}
      </div>
    </div>
  );
}

