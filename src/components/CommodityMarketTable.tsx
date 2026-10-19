import { useState, useEffect, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, ShieldCheck, TrendingUp } from "lucide-react";

export interface CommodityItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  change1W: number | null;
  change1M: number | null;
  change3M: number | null;
  change6M: number | null;
  change1Y: number | null;
  spread: number | null;
  operatingRate: number | null;
  source: string;
  confidence: string;
  updateDate: string;
}

type SortField = "change1M" | "change3M" | "change6M" | "change1Y" | "change1W" | "price";
type SortOrder = "desc" | "asc";

export default function CommodityMarketTable() {
  const [items, setItems] = useState<CommodityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [sortField, setSortField] = useState<SortField>("change1M");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    fetch("/data/commodity-summary.json")
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load commodity summary:", err);
        setLoading(false);
      });
  }, []);

  // 获取所有大类用于分类过滤
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ["全部", ...Array.from(set)];
  }, [items]);

  // 处理排序切换
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // 过滤与排序后的数据
  const filteredAndSorted = useMemo(() => {
    return items
      .filter((item) => {
        const matchesCategory =
          selectedCategory === "全部" || item.category === selectedCategory;
        const matchesSearch =
          !search ||
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.category.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === null && valB === null) return 0;
        if (valA === null) return 1;
        if (valB === null) return -1;
        return sortOrder === "desc" ? valB - valA : valA - valB;
      });
  }, [items, search, selectedCategory, sortField, sortOrder]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} style={{ opacity: 0.3, marginLeft: "4px" }} />;
    }
    return sortOrder === "desc" ? (
      <ArrowDown size={12} style={{ color: "var(--accent, #3b82f6)", marginLeft: "4px" }} />
    ) : (
      <ArrowUp size={12} style={{ color: "var(--accent, #3b82f6)", marginLeft: "4px" }} />
    );
  };

  const formatPercent = (val: number | null) => {
    if (val === null || val === undefined) return <span style={{ color: "var(--text-muted, #666)" }}>-</span>;
    const pct = (val * 100).toFixed(2);
    const isPositive = val > 0;
    const isZero = val === 0;
    const color = isZero
      ? "var(--text-muted, #888)"
      : isPositive
      ? "var(--color-up, #ef4444)"
      : "var(--color-down, #10b981)";
    return (
      <span style={{ color, fontWeight: 600 }}>
        {isPositive ? `+${pct}%` : `${pct}%`}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted, #888)" }}>
        <TrendingUp size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
        <div>正在加载全量化工品最新数据库 (600+品种)...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 顶部工具栏：搜索、分类筛选与信源徽章 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255, 255, 255, 0.02)",
          padding: "12px 16px",
          borderRadius: "8px",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flex: "1 1 300px" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted, #888)" }} />
            <input
              type="text"
              placeholder="搜索化工品名称 (如 PVC, 纯碱, R32...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                background: "var(--bg-input, rgba(0, 0, 0, 0.2))",
                border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
                borderRadius: "6px",
                color: "inherit",
                fontSize: "13px",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} style={{ color: "var(--text-muted, #888)" }} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: "8px 12px",
                background: "var(--bg-input, rgba(0, 0, 0, 0.2))",
                border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
                borderRadius: "6px",
                color: "inherit",
                fontSize: "13px",
              }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 权威信源标签 */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-muted, #888)" }}>
          <ShieldCheck size={14} style={{ color: "#10b981" }} />
          <span>权威研报信源: <b>国泰海通证券 (2026-10-16)</b> · <b>兴业证券 (2026-10-02)</b></span>
          <span style={{ fontSize: "11px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "1px 6px", borderRadius: "3px", fontWeight: 600 }}>高置信度更新</span>
        </div>
      </div>

      {/* 排序快捷切换指示条 - 支持移动端横向平滑滑动，防止换行叠合 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "13px",
          overflowX: "auto",
          whiteSpace: "nowrap",
          paddingBottom: "4px",
          scrollbarWidth: "none",
        }}
      >

        <span style={{ color: "var(--text-muted, #888)", flexShrink: 0 }}>快捷排序:</span>
        <button
          type="button"
          className={`c-btn ${sortField === "change1M" ? "c-btn--primary" : "c-btn--secondary"}`}
          onClick={() => handleSort("change1M")}
          style={{ padding: "4px 10px", fontSize: "12px", flexShrink: 0, whiteSpace: "nowrap" }}
        >
          按 1 个月涨跌 {renderSortIcon("change1M")}
        </button>
        <button
          type="button"
          className={`c-btn ${sortField === "change3M" ? "c-btn--primary" : "c-btn--secondary"}`}
          onClick={() => handleSort("change3M")}
          style={{ padding: "4px 10px", fontSize: "12px", flexShrink: 0, whiteSpace: "nowrap" }}
        >
          按 3 个月涨跌 {renderSortIcon("change3M")}
        </button>
        <button
          type="button"
          className={`c-btn ${sortField === "change6M" ? "c-btn--primary" : "c-btn--secondary"}`}
          onClick={() => handleSort("change6M")}
          style={{ padding: "4px 10px", fontSize: "12px", flexShrink: 0, whiteSpace: "nowrap" }}
        >
          按 6 个月涨跌 {renderSortIcon("change6M")}
        </button>
        <button
          type="button"
          className={`c-btn ${sortField === "change1Y" ? "c-btn--primary" : "c-btn--secondary"}`}
          onClick={() => handleSort("change1Y")}
          style={{ padding: "4px 10px", fontSize: "12px", flexShrink: 0, whiteSpace: "nowrap" }}
        >
          按 1 年涨跌 {renderSortIcon("change1Y")}
        </button>
        <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--text-muted, #888)", flexShrink: 0, paddingLeft: "8px" }}>
          共 <b>{filteredAndSorted.length}</b> 个品种
        </span>
      </div>


      {/* 核心数据表格 */}
      <div className="c-table-container" style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))" }}>
        <table className="c-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))" }}>
              <th style={{ padding: "10px 12px", textAlign: "left" }}>商品名称</th>
              <th style={{ padding: "10px 12px", textAlign: "left" }}>所属大类</th>
              <th style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer" }} onClick={() => handleSort("price")}>
                最新价格 {renderSortIcon("price")}
              </th>
              <th style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer" }} onClick={() => handleSort("change1W")}>
                周涨幅 {renderSortIcon("change1W")}
              </th>
              <th style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer", background: sortField === "change1M" ? "rgba(59, 130, 246, 0.1)" : "transparent" }} onClick={() => handleSort("change1M")}>
                1个月涨跌 {renderSortIcon("change1M")}
              </th>
              <th style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer", background: sortField === "change3M" ? "rgba(59, 130, 246, 0.1)" : "transparent" }} onClick={() => handleSort("change3M")}>
                3个月涨跌 {renderSortIcon("change3M")}
              </th>
              <th style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer", background: sortField === "change6M" ? "rgba(59, 130, 246, 0.1)" : "transparent" }} onClick={() => handleSort("change6M")}>
                6个月涨跌 {renderSortIcon("change6M")}
              </th>
              <th style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer", background: sortField === "change1Y" ? "rgba(59, 130, 246, 0.1)" : "transparent" }} onClick={() => handleSort("change1Y")}>
                1年涨跌 {renderSortIcon("change1Y")}
              </th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>开工率</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>价差(Spread)</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.slice(0, 100).map((item) => (
              <tr
                key={item.id}
                style={{
                  borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.05))",
                  transition: "background 0.15s ease",
                }}
              >
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                  {item.name}
                </td>
                <td style={{ padding: "10px 12px", color: "var(--text-muted, #888)" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      background: "rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    {item.category}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontFamily: "monospace" }}>
                  {item.price.toLocaleString()} <span style={{ fontSize: "11px", color: "var(--text-muted, #888)", fontWeight: 400 }}>{item.unit}</span>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace" }}>
                  {formatPercent(item.change1W)}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", background: sortField === "change1M" ? "rgba(59, 130, 246, 0.05)" : "transparent" }}>
                  {formatPercent(item.change1M)}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", background: sortField === "change3M" ? "rgba(59, 130, 246, 0.05)" : "transparent" }}>
                  {formatPercent(item.change3M)}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", background: sortField === "change6M" ? "rgba(59, 130, 246, 0.05)" : "transparent" }}>
                  {formatPercent(item.change6M)}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", background: sortField === "change1Y" ? "rgba(59, 130, 246, 0.05)" : "transparent" }}>
                  {formatPercent(item.change1Y)}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right" }}>
                  {item.operatingRate !== null ? (
                    <span style={{ fontSize: "12px", color: item.operatingRate >= 80 ? "#10b981" : "#f59e0b" }}>
                      {item.operatingRate}%
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-muted, #666)" }}>-</span>
                  )}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right" }}>
                  {item.spread !== null ? (
                    <span style={{ fontSize: "12px", fontFamily: "monospace", color: item.spread > 0 ? "var(--color-up, #ef4444)" : "var(--color-down, #10b981)" }}>
                      {item.spread.toLocaleString()}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-muted, #666)" }}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredAndSorted.length > 100 && (
        <div style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted, #888)", padding: "8px" }}>
          已显示前 100 项，可通过顶部搜索框快速检索具体品种
        </div>
      )}
    </div>
  );
}
