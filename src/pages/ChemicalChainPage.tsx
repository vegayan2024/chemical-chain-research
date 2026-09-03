import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Network,
  Layers,
  Building2,
  Factory,
  ExternalLink,
  ChevronRight,
  BarChart2,
  Search
} from "lucide-react";

import {
  INDUSTRY_CHAIN_TREES,
  INDUSTRY_NODE_DATA,
  INDUSTRY_COMPANY_PROFILES,
  type IndustryCompanyNode,
  type CompanyDetailProfile
} from "../lib/industry-chain-data";
import type { AppData } from "../types";

interface ChemicalChainPageProps {
  data: AppData;
}

const CATEGORIES = [
  "氟化工",
  "磷化工",
  "硅化工",
  "盐化工",
  "油化工",
  "煤化工",
  "天然气化工"
];

export default function ChemicalChainPage({ data }: ChemicalChainPageProps) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>("氟化工");
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);
  const [selectedCompanyCode, setSelectedCompanyCode] = useState<string>("600160");
  const [searchQuery, setSearchQuery] = useState("");

  const chainTree = INDUSTRY_CHAIN_TREES[activeCategory] || {};

  // 当前板块关联的所有公司节点
  const categoryNodes = useMemo(() => {
    return INDUSTRY_NODE_DATA.filter((n) => n.cat === activeCategory);
  }, [activeCategory]);

  // 去重公司列表
  const uniqueCompanies = useMemo(() => {
    const map = new Map<string, IndustryCompanyNode>();
    categoryNodes.forEach((node) => {
      if (!map.has(node.acode)) {
        map.set(node.acode, node);
      }
    });
    return Array.from(map.values());
  }, [categoryNodes]);

  // 搜索过滤后的公司池
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return uniqueCompanies;
    const q = searchQuery.toLowerCase();
    return uniqueCompanies.filter(
      (c) =>
        c.aname.toLowerCase().includes(q) ||
        c.acode.includes(q) ||
        c.p1.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q)
    );
  }, [uniqueCompanies, searchQuery]);

  // 当前选中的公司画像
  const activeCompanyNode = useMemo(() => {
    return (
      categoryNodes.find((n) => n.acode === selectedCompanyCode) ||
      categoryNodes[0] ||
      null
    );
  }, [categoryNodes, selectedCompanyCode]);

  // 当前选中的重点深度研报画像（若有预置）
  const activeCompanyProfile: CompanyDetailProfile | null = useMemo(() => {
    if (!activeCompanyNode) return null;
    return INDUSTRY_COMPANY_PROFILES[activeCompanyNode.aname] || null;
  }, [activeCompanyNode]);

  // 检查该公司是否在背离监控中有触发
  const getCompanySignal = (code: string) => {
    return data.signals.find((s) => s.code === code);
  };

  const handleSelectCompany = (code: string) => {
    setSelectedCompanyCode(code);
  };

  const handleNodeClick = (nodeKey: string) => {
    setSelectedNodeKey(nodeKey);
    // 自动定位并选中该节点下的龙头第一名
    const match = categoryNodes.find(
      (n) => n.p1 === nodeKey || n.p2 === nodeKey || nodeKey.includes(n.p1)
    );
    if (match) {
      setSelectedCompanyCode(match.acode);
    }
  };

  return (
    <div className="c-page page-dashboard" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 顶部标题与态势概览条 */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <Network size={22} style={{ color: "var(--brand, #3b82f6)" }} />
          <h1>化工产业链全景 · 行业投研终端</h1>
          <span
            style={{
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "4px",
              background: "rgba(59, 130, 246, 0.15)",
              color: "var(--brand, #3b82f6)",
              fontWeight: 600,
            }}
          >
            原 Terminal 行业架构 100% 完整平移
          </span>
        </div>
        <p className="text-muted" style={{ marginTop: "6px" }}>
          全景覆盖 7 大原料路线，从上游矿产/基础能源、中游核心化学品到下游终端应用，打通上市公司产能规模、行业地位、财务估值与价格背离量化。
        </p>
      </div>

      {/* 核心态势指标栏 (Stats Bar) */}
      <div
        className="c-card"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
          padding: "12px 16px",
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
        }}
      >
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>板块覆盖公司</div>
          <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "2px" }}>
            {uniqueCompanies.length} <span style={{ fontSize: "11px", fontWeight: 400 }}>家核心龙头</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>全景细分节点</div>
          <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "2px" }}>
            {categoryNodes.length} <span style={{ fontSize: "11px", fontWeight: 400 }}>个产品映射</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>基础原料路线</div>
          <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "2px" }}>
            7 <span style={{ fontSize: "11px", fontWeight: 400 }}>大产业板块</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>当前聚焦板块</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--brand)", marginTop: "4px" }}>
            {activeCategory}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>财务基准与信源</div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#10b981", marginTop: "6px" }}>
            2025年报 + 2026Q1
          </div>
        </div>
      </div>

      {/* 7 大分类选择标签条 (支持横向平滑滚动) */}
      <div
        className="c-tabs"
        style={{
          borderBottom: "1px solid var(--border)",
          paddingBottom: "2px",
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`c-tab ${activeCategory === cat ? "c-tab--active" : ""}`}
            onClick={() => {
              setActiveCategory(cat);
              setSelectedNodeKey(null);
            }}
            style={{ fontSize: "13px", fontWeight: 600 }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 产业链双栏工作台：左侧流向全景图谱 + 右侧上市公司深度投研面板 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* 左栏：三级/四级产业链流向图谱 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "14px" }}>
              <Layers size={16} style={{ color: "var(--brand)" }} />
              <span>{activeCategory} · 产业链流向图谱</span>
            </div>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              点击节点高亮对标公司
            </span>
          </div>

          {Object.entries(chainTree).map(([stageName, nodes]) => (
            <div
              key={stageName}
              className="c-card"
              style={{
                padding: "14px 16px",
                background: "var(--bg-panel)",
                border: "1px solid var(--border)",
                borderLeft: stageName.includes("上游")
                  ? "4px solid #3b82f6"
                  : stageName.includes("中游")
                  ? "4px solid #8b5cf6"
                  : "4px solid #10b981",
                borderRadius: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    letterSpacing: "0.5px",
                  }}
                >
                  {stageName}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {nodes.map((node) => {
                  const nodeKey = node.key || node.name;
                  const isSelected = selectedNodeKey === nodeKey;
                  const relatedNodes = categoryNodes.filter(
                    (n) => n.p1 === nodeKey || n.p2 === nodeKey || nodeKey.includes(n.p1)
                  );

                  return (
                    <div
                      key={node.name}
                      onClick={() => handleNodeClick(nodeKey)}
                      style={{
                        padding: "10px 12px",
                        background: isSelected ? "rgba(59, 130, 246, 0.12)" : "rgba(255, 255, 255, 0.02)",
                        border: isSelected
                          ? "1px solid var(--brand, #3b82f6)"
                          : "1px solid var(--border)",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 600, fontSize: "13px" }}>{node.name}</span>
                          {node.end && (
                            <span
                              style={{
                                fontSize: "10px",
                                background: "rgba(16, 185, 129, 0.12)",
                                color: "#10b981",
                                padding: "1px 6px",
                                borderRadius: "3px",
                              }}
                            >
                              {node.end}
                            </span>
                          )}
                        </div>
                        <ChevronRight size={14} style={{ color: "var(--text-muted)", opacity: isSelected ? 1 : 0.4 }} />
                      </div>

                      {/* 子产品展开 */}
                      {node.sub && node.sub.length > 0 && (
                        <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                          {node.sub.map((s) => (
                            <span
                              key={s.name}
                              style={{
                                fontSize: "10px",
                                padding: "1px 6px",
                                background: "rgba(255, 255, 255, 0.05)",
                                borderRadius: "3px",
                                color: "var(--text-muted)",
                              }}
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 对标龙头公司列表 */}
                      {relatedNodes.length > 0 && (
                        <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>对标龙头:</span>
                          {relatedNodes.map((rn) => (
                            <span
                              key={rn.acode}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectCompany(rn.acode);
                              }}
                              style={{
                                fontSize: "11px",
                                padding: "2px 6px",
                                borderRadius: "3px",
                                background:
                                  selectedCompanyCode === rn.acode
                                    ? "var(--brand, #3b82f6)"
                                    : "rgba(255, 255, 255, 0.06)",
                                color: selectedCompanyCode === rn.acode ? "#fff" : "var(--text)",
                                fontWeight: rn.rank === 1 ? 600 : 400,
                                cursor: "pointer",
                                border: rn.rank === 1 ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid transparent",
                              }}
                            >
                              {rn.rank === 1 && "🥇 "}
                              {rn.aname}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 右栏：重点上市公司池与投研深度面板 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* 公司检索与公司池标签 */}
          <div
            className="c-card"
            style={{
              padding: "14px 16px",
              background: "var(--bg-panel)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "14px" }}>
                <Building2 size={16} style={{ color: "var(--brand)" }} />
                <span>{activeCategory} · 龙头公司池 ({filteredCompanies.length})</span>
              </div>
              <div style={{ position: "relative", width: "160px" }}>
                <Search size={12} style={{ position: "absolute", left: "8px", top: "8px", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="搜索公司/代码..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "4px 8px 4px 26px",
                    background: "rgba(0, 0, 0, 0.2)",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    fontSize: "11px",
                    color: "inherit",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", maxHeight: "150px", overflowY: "auto" }}>
              {filteredCompanies.map((c) => {
                const isSelected = selectedCompanyCode === c.acode;
                const sig = getCompanySignal(c.acode);
                return (
                  <button
                    key={c.acode}
                    type="button"
                    onClick={() => handleSelectCompany(c.acode)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      background: isSelected ? "var(--brand, #3b82f6)" : "rgba(255, 255, 255, 0.04)",
                      color: isSelected ? "#fff" : "var(--text)",
                      border: "1px solid",
                      borderColor: isSelected ? "var(--brand)" : "var(--border)",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    <span>{c.aname}</span>
                    <span style={{ fontSize: "10px", opacity: 0.7 }}>({c.acode})</span>
                    {sig && (
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: sig.signalStrength === "strong" ? "#ef4444" : "#f59e0b",
                        }}
                        title="有背离信号监控"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 深度基本面看板 (选中的公司完整档案) */}
          {activeCompanyNode && (
            <div
              className="c-card"
              style={{
                padding: "16px 20px",
                background: "var(--bg-panel)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {/* 公司头部信息 */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                      {activeCompanyNode.aname}
                    </h2>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                      {activeCompanyNode.acode}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        background: "rgba(59, 130, 246, 0.15)",
                        color: "var(--brand, #3b82f6)",
                        fontWeight: 600,
                      }}
                    >
                      {activeCompanyProfile?.sector || `${activeCategory}核心标的`}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                    实际控制人/归属: <b>{activeCompanyNode.ctrl}</b> · 核心产品: <b>{activeCompanyNode.p1} {activeCompanyNode.p2}</b>
                  </div>
                </div>

                <button
                  type="button"
                  className="c-btn c-btn--primary"
                  onClick={() => navigate(`/divergence/${activeCompanyNode.acode}`)}
                  style={{ padding: "6px 12px", fontSize: "12px", gap: "6px" }}
                >
                  <span>价格背离监控</span>
                  <ExternalLink size={12} />
                </button>
              </div>

              {/* 核心业务摘要 */}
              <div
                style={{
                  fontSize: "12px",
                  lineHeight: "1.6",
                  padding: "10px 12px",
                  background: "rgba(255, 255, 255, 0.02)",
                  borderRadius: "6px",
                  borderLeft: "3px solid var(--brand, #3b82f6)",
                }}
              >
                <b>行业投研核心看点：</b>
                {activeCompanyProfile?.summary || activeCompanyNode.desc || "国内细分化工领域核心龙头，具备较强的成本护城河与装置规模优势。"}
              </div>

              {/* 核心产能网格 (Capacities Grid) */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontWeight: 600, fontSize: "13px" }}>
                  <Factory size={14} style={{ color: "var(--brand)" }} />
                  <span>核心产品产能规模与行业地位</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
                  {activeCompanyProfile?.capacities && activeCompanyProfile.capacities.length > 0 ? (
                    activeCompanyProfile.capacities.map((cap, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "8px 10px",
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid var(--border)",
                          borderRadius: "4px",
                        }}
                      >
                        <div style={{ fontSize: "12px", fontWeight: 600 }}>{cap.product}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                          产能: <b style={{ color: "var(--text)" }}>{cap.cap}</b>
                        </div>
                        <div style={{ fontSize: "10px", color: "#f59e0b", marginTop: "2px", fontWeight: 600 }}>
                          🏆 {cap.rank}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: "8px 10px",
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid var(--border)",
                        borderRadius: "4px",
                      }}
                    >
                      <div style={{ fontSize: "12px", fontWeight: 600 }}>{activeCompanyNode.p1}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        产能: <b style={{ color: "var(--text)" }}>{activeCompanyNode.cap}</b>
                      </div>
                      <div style={{ fontSize: "10px", color: "#f59e0b", marginTop: "2px", fontWeight: 600 }}>
                        🏆 {activeCompanyNode.desc}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 核心财务与估值指标看板 (2025年报 + 2026Q1) */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontWeight: 600, fontSize: "13px" }}>
                  <BarChart2 size={14} style={{ color: "var(--brand)" }} />
                  <span>财务经营透视 (2025/2026最新)</span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: "8px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ padding: "8px 6px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "4px", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>营业收入 (亿)</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, marginTop: "2px", fontFamily: "monospace" }}>
                      ¥{activeCompanyNode.rev}
                    </div>
                  </div>
                  <div style={{ padding: "8px 6px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "4px", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>归母净利润 (亿)</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, marginTop: "2px", fontFamily: "monospace", color: activeCompanyNode.profit >= 0 ? "var(--color-up, #ef4444)" : "var(--color-down, #10b981)" }}>
                      ¥{activeCompanyNode.profit}
                    </div>
                  </div>
                  <div style={{ padding: "8px 6px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "4px", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>净利增速 / ROE</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "3px" }}>
                      {activeCompanyNode.profitChg} / {activeCompanyNode.roe}
                    </div>
                  </div>
                  <div style={{ padding: "8px 6px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "4px", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>综合毛利率</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "2px", color: "#10b981" }}>
                      {activeCompanyNode.gm}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
