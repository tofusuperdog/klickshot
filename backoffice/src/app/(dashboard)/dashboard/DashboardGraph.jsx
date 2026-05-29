'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { backofficeQuery } from '@/lib/backoffice';
import {
  CartesianGrid,
  Legend,
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
    label: 'สตรีมมิ่ง',
    yLabel: 'ยอดดูตอน',
    series: [
      { key: 'views', label: 'รวม', color: '#7dd3fc' },
      { key: 'free_views', label: 'ฟรี', color: '#34d399' },
      { key: 'paid_views', label: 'จ่ายเงิน', color: '#f59e0b' },
    ],
  },
  users: {
    label: 'จำนวนผู้ใช้งาน',
    yLabel: 'ผู้ใช้งาน',
    series: [
      { key: 'visits', label: 'รวม', color: '#a78bfa' },
      { key: 'non_vip_visits', label: 'ฟรี', color: '#60a5fa' },
      { key: 'vip_visits', label: 'VIP', color: '#f472b6' },
    ],
  },
  beans: {
    label: 'การซื้อ Bean',
    yLabel: 'จำนวน Bean',
    color: '#fbbf24',
  },
  vip: {
    label: 'การซื้อ VIP Package',
    yLabel: 'จำนวนครั้งที่ซื้อ',
    series: [
      { key: 'vip7', label: 'VIP 7 วัน', color: '#34d399' },
      { key: 'vip30', label: 'VIP 30 วัน', color: '#60a5fa' },
    ],
  },
};

function toDateKey(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

function buildDateRows(days) {
  const today = new Date();

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - 1 - index));

    return {
      date: formatDate(date),
      dateKey: toDateKey(date),
    };
  });
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

function buildStreamingData(days, rows = []) {
  const totalsByDate = new Map(rows.map((row) => [row.view_date, row]));

  return buildDateRows(days).map(({ date, dateKey }) => {
    const row = totalsByDate.get(dateKey);

    return {
      date,
      views: Number(row?.views || 0),
      free_views: Number(row?.free_views || 0),
      paid_views: Number(row?.paid_views || 0),
    };
  });
}

function buildVisitData(days, rows = []) {
  const visitsByDate = new Map(rows.map((row) => [row.visit_date, row]));

  return buildDateRows(days).map(({ date, dateKey }) => {
    const row = visitsByDate.get(dateKey);

    return {
      date,
      visits: Number(row?.visits || 0),
      non_vip_visits: Number(row?.non_vip_visits || 0),
      vip_visits: Number(row?.vip_visits || 0),
    };
  });
}

function buildBeanData(days, rows = []) {
  const beansByDate = new Map(rows.map((row) => [row.purchase_date, row]));

  return buildDateRows(days).map(({ date, dateKey }) => {
    const row = beansByDate.get(dateKey);

    return {
      date,
      value: Number(row?.total_bean_amount || 0),
    };
  });
}

function buildVipData(days, rows = []) {
  const purchasesByDate = new Map();

  rows.forEach((row) => {
    const current = purchasesByDate.get(row.purchase_date) || { vip7: 0, vip30: 0 };

    if (Number(row.duration_days) === 7 || row.package_type === 'VIP 7 วัน') {
      current.vip7 += Number(row.purchases || 0);
    }

    if (Number(row.duration_days) === 30 || row.package_type === 'VIP 30 วัน') {
      current.vip30 += Number(row.purchases || 0);
    }

    purchasesByDate.set(row.purchase_date, current);
  });

  return buildDateRows(days).map(({ date, dateKey }) => {
    const row = purchasesByDate.get(dateKey);

    return {
      date,
      vip7: Number(row?.vip7 || 0),
      vip30: Number(row?.vip30 || 0),
    };
  });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-[#3b2a75] bg-[#151a3f]/95 p-3 shadow-2xl backdrop-blur-md">
      <p className="mb-2 border-b border-[#34407a] pb-1 text-[11px] font-medium text-gray-400">
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('streaming');
  const [dateRange, setDateRange] = useState(7);
  const [streamingRows, setStreamingRows] = useState([]);
  const [visitRows, setVisitRows] = useState([]);
  const [beanRows, setBeanRows] = useState([]);
  const [vipRows, setVipRows] = useState([]);

  const tabs = [
    { id: 'streaming', label: chartConfigs.streaming.label },
    { id: 'users', label: chartConfigs.users.label },
    { id: 'beans', label: chartConfigs.beans.label },
    { id: 'vip', label: chartConfigs.vip.label },
  ];

  const config = chartConfigs[activeTab];

  useEffect(() => {
    if (!['streaming', 'users', 'beans', 'vip'].includes(activeTab) || !user) return;

    let isCurrent = true;
    const dateRows = buildDateRows(dateRange);
    const startDate = dateRows[0]?.dateKey;
    const endDate = dateRows[dateRows.length - 1]?.dateKey;

    async function fetchChartRows() {
      const resourceByTab = {
        streaming: 'episode_daily_totals',
        users: 'tiktokapp_daily_visits',
        beans: 'bean_daily_purchases',
        vip: 'vip_daily_purchases',
      };
      const resource = resourceByTab[activeTab];
      const { data, error } = await backofficeQuery(user, resource, {
        start_date: startDate,
        end_date: endDate,
      });

      if (!isCurrent) return;

      if (error) {
        console.error(`Failed to load ${resource}`, error);
        if (activeTab === 'streaming') {
          setStreamingRows([]);
        } else if (activeTab === 'users') {
          setVisitRows([]);
        } else if (activeTab === 'beans') {
          setBeanRows([]);
        } else {
          setVipRows([]);
        }
        return;
      }

      if (activeTab === 'streaming') {
        setStreamingRows(data || []);
      } else if (activeTab === 'users') {
        setVisitRows(data || []);
      } else if (activeTab === 'beans') {
        setBeanRows(data || []);
      } else {
        setVipRows(data || []);
      }
    }

    fetchChartRows();

    return () => {
      isCurrent = false;
    };
  }, [activeTab, dateRange, user]);

  const data = useMemo(() => {
    if (activeTab === 'streaming') {
      return buildStreamingData(dateRange, streamingRows);
    }

    if (activeTab === 'users') {
      return buildVisitData(dateRange, visitRows);
    }

    if (activeTab === 'beans') {
      return buildBeanData(dateRange, beanRows);
    }

    if (activeTab === 'vip') {
      return buildVipData(dateRange, vipRows);
    }

    return buildMockData(dateRange, config);
  }, [activeTab, config, dateRange, streamingRows, visitRows, beanRows, vipRows]);

  return (
    <div className="bg-[#151a3f]/95 border border-[#34407a] rounded shadow-[0_18px_40px_rgba(10,14,42,0.24)] p-4 h-full min-h-0 flex flex-col">
      <div className="flex items-end justify-between gap-4 border-b border-[#34407a] mb-6 shrink-0">
        <div className="flex min-w-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-[15px] font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#7f83ff] text-[#aeb1ff]'
                  : 'border-transparent text-[#aab4d6] hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="shrink-0 pb-2">
          <div className="flex h-10 overflow-hidden rounded-lg border border-[#2f3a72] bg-[#111735]/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="flex items-center gap-2 border-r border-[#2f3a72] px-3 text-[13px] font-medium text-[#aab4d6]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              ช่วงเวลา
            </div>
            <div className="relative">
              <select
                value={dateRange}
                onChange={(event) => setDateRange(Number(event.target.value))}
                className="h-full min-w-[108px] cursor-pointer appearance-none bg-[#151a3f] pl-5 pr-10 text-[14px] font-semibold text-white outline-none transition-colors hover:bg-[#1b2250] focus:bg-[#1b2250]"
              >
                {rangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#aab4d6]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#34407a" />
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
            {(activeTab === 'streaming' || activeTab === 'users' || activeTab === 'vip') && (
              <Legend
                iconType="plainline"
                wrapperStyle={{ color: '#d1d5db', fontSize: 12, paddingTop: 8 }}
              />
            )}
            {activeTab === 'streaming' || activeTab === 'users' || activeTab === 'vip' ? (
              config.series.map((item) => (
                <Line
                  key={item.key}
                  type="monotone"
                  name={item.label}
                  dataKey={item.key}
                  stroke={item.color}
                  strokeWidth={3}
                  dot={dateRange <= 14 ? { r: 4, strokeWidth: 2, fill: '#151a3f' } : false}
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
                dot={dateRange <= 14 ? { r: 4, strokeWidth: 2, fill: '#151a3f' } : false}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
