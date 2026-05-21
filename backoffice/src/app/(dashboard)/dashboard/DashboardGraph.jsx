'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const rangeOptions = [
  { value: 7, label: '7 วัน' },
  { value: 14, label: '14 วัน' },
  { value: 30, label: '30 วัน' },
  { value: 90, label: '90 วัน' },
];

const chartConfigs = {
  streaming: {
    label: 'การสตรีมมิ่ง',
    yLabel: 'จำนวนตอน',
    color: '#7dd3fc',
    base: 180,
    step: 11,
    wave: 46,
  },
  users: {
    label: 'จำนวนผู้ใช้งาน',
    yLabel: 'จำนวนคนเข้า',
    color: '#a78bfa',
    base: 420,
    step: 17,
    wave: 70,
  },
  beans: {
    label: 'การซื้อ Bean',
    yLabel: 'จำนวน Bean',
    color: '#fbbf24',
    base: 11800,
    step: 380,
    wave: 2200,
  },
  vip: {
    label: 'การซื้อ VIP Package',
    yLabel: 'จำนวนครั้งที่ซื้อ',
    series: [
      { key: 'vip7', label: 'VIP 7 วัน', color: '#34d399', base: 18, step: 1.1, wave: 7 },
      { key: 'vip30', label: 'VIP 30 วัน', color: '#60a5fa', base: 9, step: 0.7, wave: 5 },
    ],
  },
};

function formatDate(date) {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

function mockValue(index, config) {
  const trend = config.base + index * config.step;
  const wave = Math.sin(index * 0.72) * config.wave;
  const pulse = (index % 6) * (config.wave * 0.13);
  return Math.max(0, Math.round(trend + wave + pulse));
}

function buildMockData(days, config) {
  const today = new Date();

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - 1 - index));

    return {
      date: formatDate(date),
      value: mockValue(index, config),
    };
  });
}

function buildVipMockData(days, series) {
  const today = new Date();

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    const row = { date: formatDate(date) };
    date.setDate(date.getDate() - (days - 1 - index));
    row.date = formatDate(date);

    series.forEach((item) => {
      row[item.key] = mockValue(index, item);
    });

    return row;
  });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-[#3b2a75] bg-[#131024]/95 p-3 shadow-2xl backdrop-blur-md">
      <p className="mb-2 border-b border-[#2d2252] pb-1 text-[11px] font-medium text-gray-400">
        วันที่ {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs font-light text-gray-300">{item.name}</span>
            </div>
            <span className="text-xs font-semibold text-white">{Number(item.value).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardGraph() {
  const [activeTab, setActiveTab] = useState('streaming');
  const [dateRange, setDateRange] = useState(7);

  const tabs = [
    { id: 'streaming', label: chartConfigs.streaming.label },
    { id: 'users', label: chartConfigs.users.label },
    { id: 'beans', label: chartConfigs.beans.label },
    { id: 'vip', label: chartConfigs.vip.label },
  ];

  const config = chartConfigs[activeTab];
  const data = useMemo(() => {
    if (activeTab === 'vip') {
      return buildVipMockData(dateRange, chartConfigs.vip.series);
    }

    return buildMockData(dateRange, config);
  }, [activeTab, config, dateRange]);

  return (
    <div className="bg-[#131024] border border-[#2d2252] rounded shadow-md p-4 h-full min-h-0 flex flex-col">
      <div className="flex items-end justify-between gap-4 border-b border-[#2d2252] mb-6 shrink-0">
        <div className="flex min-w-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-[15px] font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#6C72FF] text-[#6C72FF]'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="shrink-0 pb-2">
          <select
            value={dateRange}
            onChange={(event) => setDateRange(Number(event.target.value))}
            className="h-9 rounded border border-[#3b2a75] bg-[#181331] px-3 text-sm text-white outline-none transition-colors hover:border-[#6C72FF] focus:border-[#6C72FF]"
          >
            {rangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-full flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2252" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              interval={dateRange > 30 ? 11 : dateRange > 14 ? 4 : 0}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              label={{
                value: config.yLabel,
                angle: -90,
                position: 'insideLeft',
                fill: '#9ca3af',
                fontSize: 12,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            {activeTab === 'vip' ? (
              config.series.map((item) => (
                <Line
                  key={item.key}
                  type="monotone"
                  name={item.label}
                  dataKey={item.key}
                  stroke={item.color}
                  strokeWidth={3}
                  dot={dateRange <= 14 ? { r: 4, strokeWidth: 2, fill: '#131024' } : false}
                  activeDot={{ r: 6 }}
                />
              ))
            ) : (
              <Line
                type="monotone"
                name={config.label}
                dataKey="value"
                stroke={config.color}
                strokeWidth={3}
                dot={dateRange <= 14 ? { r: 4, strokeWidth: 2, fill: '#131024' } : false}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
