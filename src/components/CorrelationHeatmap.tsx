import { useState, useMemo, useRef, useEffect } from "react";
import type { CorrelationData } from "../types";
import EChart from "./EChart";
import { useThemeMode } from "../context/ThemeModeContext";

interface CorrelationHeatmapProps {
  correlations: CorrelationData[];
}

export default function CorrelationHeatmap({ correlations }: CorrelationHeatmapProps) {
  const { mode } = useThemeMode();
  const isDark = mode === "dark";

  const [hoveredInfo, setHoveredInfo] = useState<{ company: string; commodity: string; value: number } | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);
  const chipRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // 按公司分组
  const companyMap = useMemo(() => {
    const map = new Map<string, CorrelationData[]>();
    for (const c of correlations) {
      const existing = map.get(c.code) ?? [];
      existing.push(c);
      map.set(c.code, existing);
    }
    return map;
  }, [correlations]);

  const companies = useMemo(() => Array.from(companyMap.entries()), [companyMap]);
  const allCommodities = useMemo(() => Array.from(new Set(correlations.map((c) => c.commodityName))), [correlations]);
  const companyNames = useMemo(() => companies.map(([, items]) => items[0]?.name ?? ""), [companies]);

  // 构建热力图数据
  const heatmapData = useMemo(() => {
    const data: [number, number, number][] = [];
    companies.forEach(([_code, items], companyIndex) => {
      allCommodities.forEach((commodity, commodityIndex) => {
        const item = items.find((i) => i.commodityName === commodity);
        if (item) {
          data.push([commodityIndex, companyIndex, item.correlation60d]);
        }
      });
    });
    return data;
  }, [companies, allCommodities]);

  const activeCommodity = hoveredInfo?.commodity ?? selectedCommodity;

  // 悬停公司名下的全部关联业务商品集合
  const companyRelatedCommodities = useMemo(() => {
    if (!hoveredInfo) return new Set<string>();
    const targetComp = companies.find(([, items]) => items[0]?.name === hoveredInfo.company);
    if (!targetComp) return new Set<string>();
    return new Set(targetComp[1].map((i) => i.commodityName));
  }, [hoveredInfo, companies]);

  // 当激活商品变化时，底栏横向滚动居中对齐
  useEffect(() => {
    if (activeCommodity) {
      const el = chipRefs.current.get(activeCommodity);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [activeCommodity]);

  // 配色：负相关(蓝) → 零(灰白) → 正相关(红)
  const inRangeColor = isDark
    ? ["#1e5fbf", "#2a2e35", "#c93535"]
    : ["#3b82f6", "#f3f4f6", "#dc2626"];

  const option = useMemo(() => {
    return {
      backgroundColor: "transparent",
      tooltip: {
        position: "top" as const,
        backgroundColor: isDark ? "#181c23" : "#ffffff",
        borderColor: isDark ? "#242a33" : "#e5e7eb",
        textStyle: {
          color: isDark ? "#a8b0bc" : "#374151",
          fontSize: 12,
        },
        axisPointer: {
          type: "cross" as const,
          lineStyle: {
            color: isDark ? "#f5a524" : "#d97706",
            width: 1,
            type: "dashed" as const,
          },
          label: {
            show: true,
            backgroundColor: isDark ? "#f5a524" : "#d97706",
            color: "#0a0d12",
            fontWeight: 600,
          },
        },
        formatter: (params: { data: [number, number, number] }) => {
          const [x, y, value] = params.data;
          const company = companyNames[y] ?? "";
          const commodity = allCommodities[x] ?? "";
          const label = value >= 0.5 ? "强正相关" : value >= 0.2 ? "弱正相关" : value >= -0.2 ? "不相关" : value >= -0.5 ? "弱负相关" : "强负相关";
          return `<b>${company}</b> × <b>${commodity}</b><br/>60日滑动相关性: <b>${value.toFixed(2)}</b>（${label}）`;
        },
      },
      grid: {
        left: 100,
        right: 100,
        top: 10,
        bottom: 80,
      },
      xAxis: {
        type: "category" as const,
        data: allCommodities,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: (value: string) => (value === activeCommodity ? (isDark ? "#f5a524" : "#d97706") : (isDark ? "#6b7380" : "#9ca3af")),
          fontWeight: (value: string) => (value === activeCommodity ? ("bold" as const) : ("normal" as const)),
          rotate: 45,
          fontSize: 11,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "category" as const,
        data: companyNames,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: (value: string) => (hoveredInfo?.company === value ? (isDark ? "#f5a524" : "#d97706") : (isDark ? "#a8b0bc" : "#374151")),
          fontWeight: (value: string) => (hoveredInfo?.company === value ? ("bold" as const) : ("normal" as const)),
          fontSize: 11,
        },
        splitLine: { show: false },
      },
      visualMap: {
        min: -1,
        max: 1,
        calculable: false,
        orient: "vertical" as const,
        right: 10,
        top: "center" as const,
        itemWidth: 14,
        itemHeight: 180,
        inRange: {
          color: inRangeColor,
        },
        text: ["+1.0", "−1.0"],
        textStyle: {
          color: isDark ? "#6b7380" : "#9ca3af",
          fontSize: 11,
        },
      },
      series: [
        {
          name: "相关性",
          type: "heatmap",
          data: heatmapData,
          label: {
            show: true,
            fontSize: 10,
            fontWeight: 500,
            color: isDark ? "#e6e8eb" : "#111827",
            formatter: (params: { data: [number, number, number] }) => {
              return params.data[2].toFixed(2);
            },
          },
          itemStyle: {
            borderColor: isDark ? "#181c23" : "#ffffff",
            borderWidth: 1,
            borderRadius: 2,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 8,
              shadowColor: "rgba(0, 0, 0, 0.6)",
              borderColor: isDark ? "#f5a524" : "#d97706",
              borderWidth: 2,
            },
          },
        },
      ],
    };
  }, [allCommodities, companyNames, heatmapData, inRangeColor, isDark, activeCommodity, hoveredInfo]);

  // ECharts 事件监听
  const onEvents = useMemo(() => ({
    mouseover: (params: any) => {
      if (params.componentType === "series" && Array.isArray(params.data)) {
        const [x, y, value] = params.data;
        const company = companyNames[y] ?? "";
        const commodity = allCommodities[x] ?? "";
        setHoveredInfo({ company, commodity, value });
      }
    },
    mouseout: () => {
      setHoveredInfo(null);
    },
    globalout: () => {
      setHoveredInfo(null);
    },
  }), [companyNames, allCommodities]);

  const getLabelDescription = (val: number) => {
    if (val >= 0.5) return "强正相关 (强共振)";
    if (val >= 0.2) return "弱正相关";
    if (val >= -0.2) return "基本不相关";
    if (val >= -0.5) return "弱负相关";
    return "强负相关 (强反向)";
  };

  return (
    <div className="correlation-heatmap-wrapper">
      {/* 热力图主体 */}
      <EChart
        option={option}
        height={Math.max(400, companyNames.length * 40 + 80)}
        onEvents={onEvents}
      />

      {/* 最下侧商品名称吸附固定栏 (Sticky Bottom Bar) */}
      <div className="heatmap-sticky-commodity-bar">
        <div className="sticky-bar__header">
          <div className="sticky-bar__title">
            <span>📌 底侧商品名称固定栏 (共 {allCommodities.length} 种大宗商品/价差)</span>
            <span className="sticky-bar__badge">鼠标悬停热力柱自动高亮锁定</span>
          </div>

          <div className="sticky-bar__focus-info">
            {hoveredInfo ? (
              <div>
                <span>聚焦公司: <b style={{ color: isDark ? "#f5a524" : "#d97706" }}>{hoveredInfo.company}</b></span>
                <span style={{ margin: "0 8px", color: "var(--border-strong)" }}>|</span>
                <span>对应商品: <b style={{ color: isDark ? "#f5a524" : "#d97706" }}>{hoveredInfo.commodity}</b></span>
                <span style={{ margin: "0 8px", color: "var(--border-strong)" }}>|</span>
                <span>相关性: <b className="font-mono">{hoveredInfo.value.toFixed(2)}</b> ({getLabelDescription(hoveredInfo.value)})</span>
              </div>
            ) : selectedCommodity ? (
              <div>
                <span>已锁定筛选商品: <b style={{ color: isDark ? "#f5a524" : "#d97706" }}>{selectedCommodity}</b></span>
                <button
                  className="c-btn c-btn--ghost c-btn--sm"
                  style={{ marginLeft: "8px", padding: "1px 6px", fontSize: "11px" }}
                  onClick={() => setSelectedCommodity(null)}
                >
                  清除锁定
                </button>
              </div>
            ) : (
              <span className="text-muted">悬停上方任意单元格，此处将实时高亮对应的商品名称与关联业务</span>
            )}
          </div>
        </div>

        {/* 商品名称横向滚动高亮条 */}
        <div className="sticky-bar__chips-container">
          {allCommodities.map((comm) => {
            const isCurrentActive = comm === activeCommodity;
            const isRelated = !isCurrentActive && companyRelatedCommodities.has(comm);

            return (
              <button
                key={comm}
                ref={(el) => {
                  if (el) chipRefs.current.set(comm, el);
                  else chipRefs.current.delete(comm);
                }}
                className={`commodity-chip ${isCurrentActive ? "commodity-chip--active" : ""} ${isRelated ? "commodity-chip--related" : ""}`}
                onClick={() => setSelectedCommodity(selectedCommodity === comm ? null : comm)}
                title={isCurrentActive ? `当前选中: ${comm}` : isRelated ? `${hoveredInfo?.company} 的关联业务商品: ${comm}` : comm}
              >
                {isCurrentActive && "⚡ "}
                {comm}
              </button>
            );
          })}
        </div>
      </div>

      {/* 说明文案 */}
      <div style={{
        padding: "12px 16px",
        fontSize: 12,
        color: isDark ? "#6b7380" : "#6b7280",
        lineHeight: 1.6,
        borderTop: `1px solid ${isDark ? "#242a33" : "#e5e7eb"}`,
      }}>
        <b style={{ color: isDark ? "#a8b0bc" : "#374151" }}>如何阅读此图：</b>
        每个格子表示一家公司股价与对应商品价格的<b>60日滑动相关系数</b>（Pearson r）。
        <b style={{ color: isDark ? "#1e5fbf" : "#3b82f6" }}>蓝色</b>代表负相关（股价涨、商品跌，或反之），
        <b style={{ color: isDark ? "#c93535" : "#dc2626" }}>红色</b>代表正相关（同涨同跌），
        灰白色代表不相关。
        数值越接近 ±1 相关性越强；接近 0 则两者走势独立。
        当格子颜色与数值<b>不符</b>（如正相关但股价反向运动），即为<b>背离信号</b>。
      </div>
    </div>
  );
}
