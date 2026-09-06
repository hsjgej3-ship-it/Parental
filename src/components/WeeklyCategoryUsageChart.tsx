import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { DailyCategoryUsage, AppCategory } from '../types';
import { BarChart3, TrendingUp, Calendar, Clock, Sparkles, Filter } from 'lucide-react';

interface WeeklyCategoryUsageChartProps {
  data: DailyCategoryUsage[];
  dailyLimitMinutes?: number;
  childName?: string;
}

const CATEGORY_CONFIG: Record<
  AppCategory,
  { label: string; color: string; hoverColor: string }
> = {
  Games: { label: 'Games', color: '#8b5cf6', hoverColor: '#7c3aed' }, // Purple
  Entertainment: { label: 'Entertainment', color: '#f43f5e', hoverColor: '#e11d48' }, // Rose
  Education: { label: 'Education', color: '#10b981', hoverColor: '#059669' }, // Emerald
  Social: { label: 'Social', color: '#f59e0b', hoverColor: '#d97706' }, // Amber
  Utility: { label: 'Utility', color: '#3b82f6', hoverColor: '#2563eb' }, // Blue
};

export const WeeklyCategoryUsageChart: React.FC<WeeklyCategoryUsageChartProps> = ({
  data,
  dailyLimitMinutes = 150,
  childName = 'Leo',
}) => {
  const [chartMode, setChartMode] = useState<'stacked' | 'grouped'>('stacked');
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | 'All'>('All');

  // Format minutes into clean human-readable text
  const formatMins = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  // Analytics
  const totalWeeklyMinutes = data.reduce((acc, d) => acc + d.totalMinutes, 0);
  const avgDailyMinutes = Math.round(totalWeeklyMinutes / (data.length || 1));
  const peakDay = data.reduce(
    (max, d) => (d.totalMinutes > max.totalMinutes ? d : max),
    data[0] || { dayLabel: '-', totalMinutes: 0 }
  );

  // Category totals across 7 days
  const categoryTotals: Record<AppCategory, number> = {
    Games: data.reduce((acc, d) => acc + d.Games, 0),
    Entertainment: data.reduce((acc, d) => acc + d.Entertainment, 0),
    Education: data.reduce((acc, d) => acc + d.Education, 0),
    Social: data.reduce((acc, d) => acc + d.Social, 0),
    Utility: data.reduce((acc, d) => acc + d.Utility, 0),
  };

  const topCategory = (Object.keys(categoryTotals) as AppCategory[]).reduce(
    (top, cat) => (categoryTotals[cat] > categoryTotals[top] ? cat : top),
    'Games'
  );

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayData = payload[0]?.payload as DailyCategoryUsage;
      const total = dayData.totalMinutes;
      const isOverLimit = total > dailyLimitMinutes;

      return (
        <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[200px] z-50">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <div>
              <p className="font-bold text-slate-100">{dayData.dayLabel}</p>
              <p className="text-[10px] text-slate-400">{dayData.date}</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-sm block">{formatMins(total)}</span>
              {isOverLimit ? (
                <span className="text-[10px] font-semibold text-rose-400">
                  +{formatMins(total - dailyLimitMinutes)} over limit
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-400">Within limit</span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            {(Object.keys(CATEGORY_CONFIG) as AppCategory[])
              .filter((cat) => selectedCategory === 'All' || selectedCategory === cat)
              .map((cat) => {
                const val = dayData[cat];
                const cfg = CATEGORY_CONFIG[cat];
                return (
                  <div key={cat} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span className="text-slate-300">{cfg.label}</span>
                    </div>
                    <span className="font-semibold text-slate-100">
                      {formatMins(val)} ({total > 0 ? Math.round((val / total) * 100) : 0}%)
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            7-Day Screen Time by App Category
          </h4>
          <p className="text-xs text-slate-500">
            Daily usage trends broken down across entertainment, games, learning, and utilities for{' '}
            {childName}.
          </p>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-white text-slate-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Categories
            </button>
            {(Object.keys(CATEGORY_CONFIG) as AppCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`hidden sm:inline-block px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-800 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Stacked vs Grouped Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setChartMode('stacked')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                chartMode === 'stacked'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stacked
            </button>
            <button
              onClick={() => setChartMode('grouped')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                chartMode === 'grouped'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grouped
            </button>
          </div>
        </div>
      </div>

      {/* 4 Micro Analytics Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[10px] font-semibold text-slate-500 uppercase block">
            7-Day Total
          </span>
          <span className="text-base font-bold text-slate-800 block mt-0.5">
            {formatMins(totalWeeklyMinutes)}
          </span>
          <span className="text-[10px] text-slate-400">across 7 days</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[10px] font-semibold text-slate-500 uppercase block">
            Daily Average
          </span>
          <span className="text-base font-bold text-slate-800 block mt-0.5">
            {formatMins(avgDailyMinutes)} / day
          </span>
          <span className="text-[10px] text-slate-400">
            Target: {formatMins(dailyLimitMinutes)}
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[10px] font-semibold text-slate-500 uppercase block">
            Peak Day
          </span>
          <span className="text-base font-bold text-purple-700 block mt-0.5">
            {peakDay.dayLabel.split(' ')[0]} ({formatMins(peakDay.totalMinutes)})
          </span>
          <span className="text-[10px] text-slate-400">Weekend peak</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[10px] font-semibold text-slate-500 uppercase block">
            Top Category
          </span>
          <span className="text-base font-bold text-slate-800 block mt-0.5 flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: CATEGORY_CONFIG[topCategory].color }}
            />
            {topCategory} ({formatMins(categoryTotals[topCategory])})
          </span>
          <span className="text-[10px] text-slate-400">
            {Math.round((categoryTotals[topCategory] / totalWeeklyMinutes) * 100)}% of total screen time
          </span>
        </div>
      </div>

      {/* Main Recharts Bar Chart */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
            barCategoryGap={chartMode === 'stacked' ? '30%' : '15%'}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="dayLabel"
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(val) => `${Math.floor(val / 60)}h`}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.7)' }} />

            {/* Reference Line for Daily Screen-Time Limit */}
            <ReferenceLine
              y={dailyLimitMinutes}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Limit: ${formatMins(dailyLimitMinutes)}`,
                position: 'top',
                fill: '#ef4444',
                fontSize: 10,
                fontWeight: 600,
              }}
            />

            {/* Render Bars based on active category selection */}
            {(Object.keys(CATEGORY_CONFIG) as AppCategory[])
              .filter((cat) => selectedCategory === 'All' || selectedCategory === cat)
              .map((cat, index, arr) => {
                const cfg = CATEGORY_CONFIG[cat];
                const isTop = chartMode === 'stacked' ? index === arr.length - 1 : true;

                return (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    name={cfg.label}
                    stackId={chartMode === 'stacked' ? 'categoryStack' : undefined}
                    fill={cfg.color}
                    radius={isTop ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    animationDuration={600}
                  />
                );
              })}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Category Legend */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {(Object.keys(CATEGORY_CONFIG) as AppCategory[]).map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const isSelected = selectedCategory === 'All' || selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat ? 'All' : cat)
                }
                className={`flex items-center gap-1.5 transition-opacity ${
                  isSelected ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="font-semibold text-slate-700">{cfg.label}</span>
                <span className="text-slate-400 font-normal">
                  ({formatMins(categoryTotals[cat])})
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 text-rose-600 font-medium text-[11px]">
          <span className="w-3 h-0.5 bg-rose-500 inline-block border-t border-dashed border-rose-500" />
          <span>Daily Limit Reference ({formatMins(dailyLimitMinutes)})</span>
        </div>
      </div>
    </div>
  );
};
