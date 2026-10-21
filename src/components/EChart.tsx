import { useEffect, useRef } from "react";
import * as echarts from "../lib/echarts";

interface EChartProps {
  option: echarts.EChartsCoreOption;
  height?: number | string;
  className?: string;
  onEvents?: Record<string, (params: any) => void>;
  onChartReady?: (chart: echarts.ECharts) => void;
}

export default function EChart({ option, height = 400, className, onEvents, onChartReady }: EChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = echarts.init(containerRef.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;

    if (onChartReady) {
      onChartReady(chart);
    }

    const observer = new ResizeObserver(() => {
      chart.resize();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.setOption(option, { notMerge: true });
  }, [option]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !onEvents) return;

    for (const [eventName, handler] of Object.entries(onEvents)) {
      chart.on(eventName, handler);
    }

    return () => {
      for (const [eventName, handler] of Object.entries(onEvents)) {
        chart.off(eventName, handler);
      }
    };
  }, [onEvents]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: typeof height === "number" ? `${height}px` : height }}
    />
  );
}
