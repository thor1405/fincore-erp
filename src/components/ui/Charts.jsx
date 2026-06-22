import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { useTheme } from '../ThemeProvider';

// Utility to get CSS variables for charts
const getThemeColors = (theme) => {
  const isDark = theme === 'dark';
  return {
    text: isDark ? '#94A3B8' : '#6B7280', // text-muted
    grid: isDark ? '#334155' : '#E5E7EB', // border-color
    tooltipBg: isDark ? '#1E293B' : '#FFFFFF',
    tooltipBorder: isDark ? '#334155' : '#E5E7EB',
    tooltipText: isDark ? '#F8FAFC' : '#111827',
    primary: '#4F46E5', // indigo
    emerald: '#10B981', // emerald
    blue: '#3B82F6', // blue
    amber: '#F59E0B', // amber
  };
};

const CustomTooltip = ({ active, payload, label, colors, valueFormatter }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: colors.tooltipBg,
        border: `1px solid ${colors.tooltipBorder}`,
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        color: colors.tooltipText
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '0.85rem' }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }} />
            <span style={{ color: colors.text }}>{entry.name}:</span>
            <span style={{ fontWeight: 600 }}>{valueFormatter ? valueFormatter(entry.value) : entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AreaChart({ data, xKey, series, height = 300, valueFormatter }) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s, idx) => (
              <linearGradient key={idx} id={`color${s.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[s.color] || s.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors[s.color] || s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
          <XAxis 
            dataKey={xKey} 
            stroke={colors.text} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10} 
          />
          <YAxis 
            stroke={colors.text} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={valueFormatter || ((value) => `$${value}`)} 
            width={85}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip colors={colors} valueFormatter={valueFormatter} />} />
          {series.map((s, idx) => (
            <Area
              key={idx}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name}
              stroke={colors[s.color] || s.color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#color${s.dataKey})`}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChart({ data, xKey, series, height = 300, valueFormatter }) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
          <XAxis 
            dataKey={xKey} 
            stroke={colors.text} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10} 
          />
          <YAxis 
            stroke={colors.text} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={valueFormatter || ((value) => `$${value}`)} 
            width={85}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip colors={colors} valueFormatter={valueFormatter} />} cursor={{ fill: 'transparent' }} />
          {series.map((s, idx) => (
            <Bar
              key={idx}
              dataKey={s.dataKey}
              name={s.name}
              fill={colors[s.color] || s.color}
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LineChart({ data, xKey, series, height = 40 }) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RechartsLineChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          {series.map((s, idx) => (
            <Line
              key={idx}
              type="monotone"
              dataKey={s.dataKey}
              stroke={colors[s.color] || s.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
