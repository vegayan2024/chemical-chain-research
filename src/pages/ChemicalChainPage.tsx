import { useState } from "react";
import { Link } from "react-router-dom";
import { Network, ArrowRight, Layers, Building2, Flame } from "lucide-react";
import { CHAIN_TREES, type ChainCategory } from "../lib/chains-data";
import type { AppData } from "../types";

interface ChemicalChainPageProps {
  data: AppData;
}

const CATEGORIES: ChainCategory[] = [
  "氟化工",
  "磷化工",
  "硅化工",
  "盐化工",
  "油化工",
  "煤化工",
  "天然气化工",
];

export default function ChemicalChainPage({ data }: ChemicalChainPageProps) {
  const [activeCategory, setActiveCategory] = useState<ChainCategory>("氟化工");
  const chainTree = CHAIN_TREES[activeCategory];

  // 统计当前链条关联的公司
  const getCompaniesForNode = (keyword: string) => {
    if (!keyword) return [];
    return data.companies.filter((c) =>
      c.productsByRevenue.some((p) =>
        p.productName.includes(keyword) || p.commodityName.includes(keyword)
      ) ||
      c.productsByProfit.some((p) =>
        p.productName.includes(keyword) || p.commodityName.includes(keyword)
      )
    );
  };

  // 检查该关键词是否在当前背离信号中有触发
  const hasDivergence = (keyword: string) => {
    if (!keyword) return false;
    return data.signals.some((s) =>
      s.productName.includes(keyword) || s.commodityName.includes(keyword)
    );
  };

  return (
    <div className="c-page">
      {/* 顶部标题区 */}
      <div className="c-page-header">
        <div className="c-page-header__title">
          <Network size={20} className="text-accent" />
          <h1>化工产业链全景图谱</h1>
        </div>
        <p className="c-page-header__desc">
          覆盖 7 大基础原料路线，从上游矿产能源、中游高附加值中间体到下游终端需求，全链条穿透映射至 A 股对标龙头与背离量化信号。
        </p>
      </div>

      {/* 7大分类选择标签 */}
      <div className="c-segment" style={{ overflowX: "auto", marginBottom: "20px" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`c-segment__item ${activeCategory === cat ? "c-segment__item--active" : ""}`}
            onClick={() => setActiveCategory(cat)}
            style={{ padding: "8px 16px", fontSize: "14px", fontWeight: 600 }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 产业链拓扑结构与对应公司 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {Object.entries(chainTree).map(([stageName, nodes]) => (
          <div
            key={stageName}
            className="c-card"
            style={{
              padding: "16px 20px",
              borderLeft: "4px solid var(--accent, #3b82f6)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Layers size={16} style={{ color: "var(--accent, #3b82f6)" }} />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>{stageName}</h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {nodes.map((node) => {
                const nodeKey = node.key || node.name;
                const relatedCompanies = getCompaniesForNode(nodeKey);
                const isAlerting = hasDivergence(nodeKey);

                return (
                  <div
                    key={node.name}
                    style={{
                      padding: "12px",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
                      borderRadius: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 600, fontSize: "14px" }}>{node.name}</span>
                      {isAlerting && (
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(239, 68, 68, 0.2)",
                            color: "#ef4444",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <Flame size={12} />
                          背离预警
                        </span>
                      )}
                    </div>

                    {/* 子型号展示 */}
                    {node.sub && node.sub.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                        {node.sub.map((sub) => (
                          <span
                            key={sub.name}
                            style={{
                              fontSize: "11px",
                              padding: "2px 6px",
                              borderRadius: "3px",
                              background: "rgba(255, 255, 255, 0.08)",
                            }}
                          >
                            {sub.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 终端应用描述 */}
                    {node.end && (
                      <div style={{ fontSize: "12px", color: "var(--text-muted, #888)", marginBottom: "8px" }}>
                        终端方向: {node.end}
                      </div>
                    )}

                    {/* 关联上市公司列表 */}
                    {relatedCompanies.length > 0 ? (
                      <div style={{ borderTop: "1px dashed var(--border-color, rgba(255, 255, 255, 0.1))", paddingTop: "8px" }}>
                        <div style={{ fontSize: "11px", color: "var(--text-muted, #888)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Building2 size={11} />
                          对标标的:
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {relatedCompanies.map((c) => (
                            <Link
                              key={c.code}
                              to={`/divergence/${c.code}`}
                              style={{
                                fontSize: "12px",
                                color: "var(--accent, #3b82f6)",
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "2px",
                                background: "rgba(59, 130, 246, 0.1)",
                                padding: "2px 6px",
                                borderRadius: "3px",
                              }}
                            >
                              {c.name}
                              <ArrowRight size={10} />
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: "11px", color: "var(--text-muted, #666)" }}>
                        主要为非上市产能或海外进口
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
