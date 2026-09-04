import { useState, useMemo } from "react";
import {
  Flame,
  Coins,
  FlaskConical,
  Compass,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Table as TableIcon,
  Search,
  ArrowRight,
  ShieldAlert,
  Zap,
  Layers
} from "lucide-react";
import {
  CYCLE_COMMODITIES,
  CYCLE_AUDIT_PRINCIPLES
} from "../lib/cycle-framework-data";

interface CycleFrameworkBannerProps {
  onSelectChemicalCategory?: (category: string) => void;
}

type TabType = "all" | "energy" | "metals" | "chemicals" | "principles";
type ViewMode = "grid" | "table";

export default function CycleFrameworkBanner({
  onSelectChemicalCategory
}: CycleFrameworkBannerProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [elasticityFilter, setElasticityFilter] = useState<string>("all");
  const [keyword, setKeyword] = useState<string>("");

  // 过滤商品列表
  const filteredList = useMemo(() => {
    return CYCLE_COMMODITIES.filter((item) => {
      // 板块分类筛选
      const matchCategory =
        activeTab === "all" ||
        activeTab === "principles" ||
        item.category === activeTab;

      // 弹性筛选
      const matchElasticity =
        elasticityFilter === "all" || item.profitElasticity === elasticityFilter;

      // 关键词筛选
      const q = keyword.trim().toLowerCase();
      const matchKeyword =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.kingTitle.toLowerCase().includes(q) ||
        item.essence.toLowerCase().includes(q) ||
        item.keyVariables.some((v) => v.toLowerCase().includes(q)) ||
        (item.note && item.note.toLowerCase().includes(q));

      return matchCategory && matchElasticity && matchKeyword;
    });
  }, [activeTab, elasticityFilter, keyword]);

  // 弹性徽章色彩
  const getElasticityStyle = (elasticity: string) => {
    switch (elasticity) {
      case "极强":
        return { bg: "rgba(239, 77, 77, 0.15)", text: "#ef4d4d", border: "rgba(239, 77, 77, 0.3)" };
      case "很强":
        return { bg: "rgba(245, 165, 36, 0.15)", text: "#f5a524", border: "rgba(245, 165, 36, 0.3)" };
      case "强":
        return { bg: "rgba(61, 169, 252, 0.15)", text: "#3da9fc", border: "rgba(61, 169, 252, 0.3)" };
      case "较强":
        return { bg: "rgba(0, 200, 150, 0.15)", text: "#00c896", border: "rgba(0, 200, 150, 0.3)" };
      default:
        return { bg: "rgba(107, 115, 128, 0.15)", text: "#9ca3af", border: "rgba(107, 115, 128, 0.3)" };
    }
  };

  // 供给响应色彩
  const getSupplyStyle = (speed: string) => {
    if (speed === "极慢" || speed.includes("极慢")) {
      return { bg: "rgba(239, 77, 77, 0.1)", text: "#ef4d4d" };
    }
    if (speed === "慢" || speed.includes("偏慢")) {
      return { bg: "rgba(245, 165, 36, 0.1)", text: "#f5a524" };
    }
    if (speed === "分化") {
      return { bg: "rgba(168, 114, 245, 0.1)", text: "#a872f5" };
    }
    return { bg: "rgba(61, 169, 252, 0.1)", text: "#3da9fc" };
  };

  return (
    <section
      className="c-card cycle-framework-card"
      style={{
        background: "var(--bg-panel, #181c23)",
        border: "1px solid var(--border-strong, #303840)",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
        transition: "all 0.25s ease"
      }}
    >
      {/* 顶部标题与折叠栏 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          background: "linear-gradient(90deg, rgba(245, 165, 36, 0.08) 0%, rgba(61, 169, 252, 0.04) 100%)",
          borderBottom: isExpanded ? "1px solid var(--border, #242a33)" : "none",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              background: "rgba(245, 165, 36, 0.15)",
              color: "var(--brand, #f5a524)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Compass size={18} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-strong, #e6e8eb)", letterSpacing: "0.2px" }}>
                周期品投研顶层框架
              </span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  background: "rgba(245, 165, 36, 0.15)",
                  color: "var(--brand, #f5a524)",
                  fontWeight: 600,
                  border: "1px solid rgba(245, 165, 36, 0.3)"
                }}
              >
                能源 × 金属 × 化工特性全景汇总
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted, #6b7380)", marginTop: "2px" }}>
              基于底层周期逻辑，系统剖析 19 大大宗商品周期本质、利润弹性、供给响应、核心变量与市场画像
            </div>
          </div>
        </div>

        {/* 顶部右侧快捷开关与折叠按钮 */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isExpanded && (
            <div
              style={{
                display: "flex",
                background: "var(--bg-base, #12151a)",
                borderRadius: "6px",
                padding: "2px",
                border: "1px solid var(--border, #242a33)"
              }}
            >
              <button
                type="button"
                className={`c-btn-icon ${viewMode === "grid" ? "active" : ""}`}
                style={{
                  padding: "4px 8px",
                  fontSize: "12px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: viewMode === "grid" ? "var(--bg-raised, #1f242d)" : "transparent",
                  color: viewMode === "grid" ? "var(--text-strong, #e6e8eb)" : "var(--text-muted, #6b7380)",
                  border: "none",
                  cursor: "pointer"
                }}
                onClick={() => setViewMode("grid")}
                title="网格卡片视图"
              >
                <LayoutGrid size={13} />
                <span>卡片</span>
              </button>
              <button
                type="button"
                className={`c-btn-icon ${viewMode === "table" ? "active" : ""}`}
                style={{
                  padding: "4px 8px",
                  fontSize: "12px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: viewMode === "table" ? "var(--bg-raised, #1f242d)" : "transparent",
                  color: viewMode === "table" ? "var(--text-strong, #e6e8eb)" : "var(--text-muted, #6b7380)",
                  border: "none",
                  cursor: "pointer"
                }}
                onClick={() => setViewMode("table")}
                title="数据矩阵表格"
              >
                <TableIcon size={13} />
                <span>矩阵</span>
              </button>
            </div>
          )}

          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 10px",
              background: "var(--bg-raised, #1f242d)",
              border: "1px solid var(--border, #242a33)",
              borderRadius: "6px",
              color: "var(--text, #a8b0bc)",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 500
            }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span>{isExpanded ? "收起框架" : "展开框架"}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* 快捷指标条 (展开和折叠均展示精炼指标) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "1px",
          background: "var(--border, #242a33)",
          borderBottom: isExpanded ? "1px solid var(--border, #242a33)" : "none"
        }}
      >
        <div style={{ background: "var(--bg-base, #12151a)", padding: "8px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <Flame size={18} style={{ color: "#ef4d4d" }} />
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>能源及运力</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-strong)" }}>
              3 <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)" }}>大品类 (石油/煤炭/航运)</span>
            </div>
          </div>
        </div>

        <div style={{ background: "var(--bg-base, #12151a)", padding: "8px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <Coins size={18} style={{ color: "#ffc857" }} />
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>金属矿产</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-strong)" }}>
              9 <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)" }}>大品种 (工业/贵金/小金属)</span>
            </div>
          </div>
        </div>

        <div style={{ background: "var(--bg-base, #12151a)", padding: "8px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <FlaskConical size={18} style={{ color: "#3da9fc" }} />
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>化工产业链</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-strong)" }}>
              7 <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)" }}>大主线 (原料/精细/农化)</span>
            </div>
          </div>
        </div>

        <div style={{ background: "var(--bg-base, #12151a)", padding: "8px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <Zap size={18} style={{ color: "#ef4d4d" }} />
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>极强弹性品种</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#ef4d4d" }}>
              5 <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)" }}>种 (航运/锂/锑/氟/纯碱)</span>
            </div>
          </div>
        </div>

        <div style={{ background: "var(--bg-base, #12151a)", padding: "8px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <ShieldAlert size={18} style={{ color: "#a872f5" }} />
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>硬供给刚性</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#a872f5" }}>
              6 <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)" }}>种 (配额锁死/矿端衰竭)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 展开主体内容 */}
      {isExpanded && (
        <div style={{ padding: "16px 18px" }}>
          {/* 控制条：板块分类 Tab + 弹性筛选 + 搜索框 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "16px",
              paddingBottom: "12px",
              borderBottom: "1px solid var(--border, #242a33)"
            }}
          >
            {/* 主分类标签 */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`c-tab ${activeTab === "all" ? "c-tab--active" : ""}`}
                style={{
                  fontSize: "12px",
                  padding: "5px 12px",
                  borderRadius: "5px",
                  border: activeTab === "all" ? "1px solid var(--brand)" : "1px solid var(--border)",
                  background: activeTab === "all" ? "var(--brand-soft)" : "var(--bg-raised)",
                  color: activeTab === "all" ? "var(--brand)" : "var(--text)",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
                onClick={() => setActiveTab("all")}
              >
                全部大宗 (19)
              </button>
              <button
                type="button"
                className={`c-tab ${activeTab === "energy" ? "c-tab--active" : ""}`}
                style={{
                  fontSize: "12px",
                  padding: "5px 12px",
                  borderRadius: "5px",
                  border: activeTab === "energy" ? "1px solid #ef4d4d" : "1px solid var(--border)",
                  background: activeTab === "energy" ? "rgba(239, 77, 77, 0.15)" : "var(--bg-raised)",
                  color: activeTab === "energy" ? "#ef4d4d" : "var(--text)",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
                onClick={() => setActiveTab("energy")}
              >
                <Flame size={13} />
                <span>能源及运力 (3)</span>
              </button>
              <button
                type="button"
                className={`c-tab ${activeTab === "metals" ? "c-tab--active" : ""}`}
                style={{
                  fontSize: "12px",
                  padding: "5px 12px",
                  borderRadius: "5px",
                  border: activeTab === "metals" ? "1px solid #ffc857" : "1px solid var(--border)",
                  background: activeTab === "metals" ? "rgba(255, 200, 87, 0.15)" : "var(--bg-raised)",
                  color: activeTab === "metals" ? "#ffc857" : "var(--text)",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
                onClick={() => setActiveTab("metals")}
              >
                <Coins size={13} />
                <span>金属板块 (9)</span>
              </button>
              <button
                type="button"
                className={`c-tab ${activeTab === "chemicals" ? "c-tab--active" : ""}`}
                style={{
                  fontSize: "12px",
                  padding: "5px 12px",
                  borderRadius: "5px",
                  border: activeTab === "chemicals" ? "1px solid #3da9fc" : "1px solid var(--border)",
                  background: activeTab === "chemicals" ? "rgba(61, 169, 252, 0.15)" : "var(--bg-raised)",
                  color: activeTab === "chemicals" ? "#3da9fc" : "var(--text)",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
                onClick={() => setActiveTab("chemicals")}
              >
                <FlaskConical size={13} />
                <span>化工板块 (7)</span>
              </button>
              <button
                type="button"
                className={`c-tab ${activeTab === "principles" ? "c-tab--active" : ""}`}
                style={{
                  fontSize: "12px",
                  padding: "5px 12px",
                  borderRadius: "5px",
                  border: activeTab === "principles" ? "1px solid #a872f5" : "1px solid var(--border)",
                  background: activeTab === "principles" ? "rgba(168, 114, 245, 0.15)" : "var(--bg-raised)",
                  color: activeTab === "principles" ? "#a872f5" : "var(--text)",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
                onClick={() => setActiveTab("principles")}
              >
                <Compass size={13} />
                <span>🧭 底层审查逻辑</span>
              </button>
            </div>

            {/* 弹性与搜索控制 */}
            {activeTab !== "principles" && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>弹性:</span>
                  <select
                    value={elasticityFilter}
                    onChange={(e) => setElasticityFilter(e.target.value)}
                    style={{
                      fontSize: "12px",
                      background: "var(--bg-raised, #1f242d)",
                      color: "var(--text-strong, #e6e8eb)",
                      border: "1px solid var(--border, #242a33)",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      outline: "none"
                    }}
                  >
                    <option value="all">全部弹性</option>
                    <option value="极强">极强 (短期错配倍增)</option>
                    <option value="很强">很强</option>
                    <option value="强">强</option>
                    <option value="较强">较强</option>
                    <option value="中等">中等 (传导平滑)</option>
                  </select>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--bg-raised, #1f242d)",
                    border: "1px solid var(--border, #242a33)",
                    borderRadius: "4px",
                    padding: "3px 8px"
                  }}
                >
                  <Search size={13} style={{ color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    placeholder="搜索品类/XX之王/变量..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-strong)",
                      fontSize: "12px",
                      outline: "none",
                      width: "150px"
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 模式 1：底层审查逻辑视图 */}
          {activeTab === "principles" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px" }}>
              {CYCLE_AUDIT_PRINCIPLES.map((principle) => (
                <div
                  key={principle.id}
                  style={{
                    background: "var(--bg-base, #12151a)",
                    border: "1px solid var(--border, #242a33)",
                    borderRadius: "8px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--brand, #f5a524)" }}>
                      {principle.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {principle.subtitle}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {principle.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "var(--bg-panel, #181c23)",
                          border: "1px solid var(--border, #242a33)",
                          borderRadius: "6px",
                          padding: "10px 12px"
                        }}
                      >
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-strong)", marginBottom: "4px" }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text, #a8b0bc)", lineHeight: 1.5 }}>
                          {item.description}
                        </div>
                        {item.examples && item.examples.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                            {item.examples.map((ex, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: "10px",
                                  padding: "1px 6px",
                                  borderRadius: "3px",
                                  background: "rgba(245, 165, 36, 0.1)",
                                  color: "var(--brand)",
                                  border: "1px solid rgba(245, 165, 36, 0.2)"
                                }}
                              >
                                {ex}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === "grid" ? (
            /* 模式 2：卡片矩阵视图 */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
                gap: "14px"
              }}
            >
              {filteredList.map((item) => {
                const elastStyle = getElasticityStyle(item.profitElasticity);
                const supplyStyle = getSupplyStyle(item.supplySpeed);

                return (
                  <div
                    key={item.id}
                    style={{
                      background: "var(--bg-base, #12151a)",
                      border: "1px solid var(--border, #242a33)",
                      borderRadius: "8px",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "10px",
                      transition: "transform 0.15s ease, border-color 0.15s ease",
                      position: "relative"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-strong, #303840)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border, #242a33)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {/* 卡片头部 */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-strong)" }}>
                            {item.name}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              padding: "1px 6px",
                              borderRadius: "3px",
                              background: "var(--bg-raised)",
                              color: "var(--text-muted)"
                            }}
                          >
                            {item.categoryName}
                          </span>
                        </div>

                        {/* 市场画像徽章 */}
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: item.kingColor ? `${item.kingColor}20` : "rgba(245, 165, 36, 0.15)",
                            color: item.kingColor || "var(--brand)",
                            border: `1px solid ${item.kingColor ? `${item.kingColor}50` : "rgba(245, 165, 36, 0.3)"}`,
                            whiteSpace: "nowrap"
                          }}
                        >
                          👑 {item.kingTitle}
                        </div>
                      </div>

                      {/* 周期本质 */}
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text)",
                          marginTop: "8px",
                          lineHeight: 1.4,
                          background: "var(--bg-panel)",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          borderLeft: "3px solid var(--brand)"
                        }}
                      >
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>
                          周期本质
                        </span>
                        {item.essence}
                      </div>
                    </div>

                    {/* 弹性与供给响应指标 */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "2px" }}>
                      <div
                        style={{
                          background: "var(--bg-panel)",
                          padding: "6px 8px",
                          borderRadius: "4px",
                          border: "1px solid var(--border)"
                        }}
                      >
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>利润弹性</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "3px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: "3px",
                              background: elastStyle.bg,
                              color: elastStyle.text,
                              border: `1px solid ${elastStyle.border}`
                            }}
                          >
                            {item.profitElasticity}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          background: "var(--bg-panel)",
                          padding: "6px 8px",
                          borderRadius: "4px",
                          border: "1px solid var(--border)"
                        }}
                      >
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>供给响应</div>
                        <div style={{ marginTop: "3px" }}>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 600,
                              padding: "1px 6px",
                              borderRadius: "3px",
                              background: supplyStyle.bg,
                              color: supplyStyle.text
                            }}
                          >
                            {item.supplyResponse}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 核心变量 */}
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>
                        核心驱动变量
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {item.keyVariables.map((v, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "3px",
                              background: "var(--bg-raised)",
                              color: "var(--text)",
                              border: "1px solid var(--border)"
                            }}
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 底部备注与产业链直达 */}
                    <div style={{ borderTop: "1px dashed var(--border, #242a33)", paddingTop: "8px", marginTop: "4px" }}>
                      {item.note && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.4, marginBottom: "6px" }}>
                          {item.note}
                        </div>
                      )}

                      {item.linkedChemicalCategory && (
                        <button
                          type="button"
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "5px 10px",
                            borderRadius: "4px",
                            background: "rgba(59, 130, 246, 0.1)",
                            color: "#3da9fc",
                            border: "1px solid rgba(59, 130, 246, 0.25)",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                          onClick={() => {
                            if (onSelectChemicalCategory && item.linkedChemicalCategory) {
                              onSelectChemicalCategory(item.linkedChemicalCategory);
                            }
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Layers size={12} />
                            <span>直达下方【{item.linkedChemicalCategory}】产业链流向图谱</span>
                          </span>
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* 模式 3：全景矩阵表格视图 */
            <div
              style={{
                overflowX: "auto",
                background: "var(--bg-base, #12151a)",
                borderRadius: "8px",
                border: "1px solid var(--border, #242a33)"
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "var(--bg-panel, #181c23)", borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "10px 14px", color: "var(--text-muted)", fontWeight: 600, width: "110px" }}>板块品类</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-muted)", fontWeight: 600, width: "160px" }}>市场画像 (xx之王)</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-muted)", fontWeight: 600, minWidth: "180px" }}>周期本质</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-muted)", fontWeight: 600, width: "90px" }}>利润弹性</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-muted)", fontWeight: 600, width: "170px" }}>供给响应</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-muted)", fontWeight: 600, minWidth: "220px" }}>核心驱动变量</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-muted)", fontWeight: 600, width: "120px" }}>产业链联动</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item) => {
                    const elastStyle = getElasticityStyle(item.profitElasticity);
                    const supplyStyle = getSupplyStyle(item.supplySpeed);

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: "1px solid var(--border, #242a33)",
                          transition: "background 0.1s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--bg-raised, #1f242d)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--text-strong)" }}>
                          <div>{item.name}</div>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>{item.categoryName}</span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "12px",
                              background: item.kingColor ? `${item.kingColor}20` : "rgba(245, 165, 36, 0.15)",
                              color: item.kingColor || "var(--brand)",
                              border: `1px solid ${item.kingColor ? `${item.kingColor}40` : "rgba(245, 165, 36, 0.3)"}`,
                              whiteSpace: "nowrap"
                            }}
                          >
                            👑 {item.kingTitle}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "var(--text)", lineHeight: 1.4 }}>
                          {item.essence}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "3px",
                              background: elastStyle.bg,
                              color: elastStyle.text,
                              border: `1px solid ${elastStyle.border}`
                            }}
                          >
                            {item.profitElasticity}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "2px 6px",
                              borderRadius: "3px",
                              background: supplyStyle.bg,
                              color: supplyStyle.text
                            }}
                          >
                            {item.supplyResponse}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {item.keyVariables.map((v, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: "10px",
                                  padding: "1px 5px",
                                  borderRadius: "3px",
                                  background: "var(--bg-panel)",
                                  color: "var(--text)",
                                  border: "1px solid var(--border)"
                                }}
                              >
                                {v}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          {item.linkedChemicalCategory ? (
                            <button
                              type="button"
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                background: "rgba(59, 130, 246, 0.1)",
                                color: "#3da9fc",
                                border: "1px solid rgba(59, 130, 246, 0.25)",
                                fontSize: "11px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "3px"
                              }}
                              onClick={() => {
                                if (onSelectChemicalCategory && item.linkedChemicalCategory) {
                                  onSelectChemicalCategory(item.linkedChemicalCategory);
                                }
                              }}
                            >
                              <span>{item.linkedChemicalCategory}</span>
                              <ArrowRight size={10} />
                            </button>
                          ) : (
                            <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
