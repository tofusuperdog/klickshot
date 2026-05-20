'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

function generateMockData(days = 7) {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const th = Math.floor(Math.random() * 500) + 100;
    const usa = Math.floor(Math.random() * 300) + 50;
    const jp = Math.floor(Math.random() * 200) + 150;
    const cn = Math.floor(Math.random() * 400) + 200;
    const total = th + usa + jp + cn;

    data.push({
      date: dateStr,
      'ยอดรวม': total,
      'ไทย': th,
      'USA': usa,
      'จีน': cn,
      'ญี่ปุ่น': jp,
    });
  }
  return data;
}

const mockDataStreaming = generateMockData(7);
const mockDataUsers = generateMockData(7);
const mockDataBeans = generateMockData(7);
const mockDataVipWeek = generateMockData(7);
const mockDataVipMonth = generateMockData(7);
const mockDataVipAll = mockDataVipWeek.map((item, idx) => ({
  date: item.date,
  'ยอดรวม': item['ยอดรวม'] + mockDataVipMonth[idx]['ยอดรวม'],
  'ไทย': item['ไทย'] + mockDataVipMonth[idx]['ไทย'],
  'USA': item['USA'] + mockDataVipMonth[idx]['USA'],
  'จีน': item['จีน'] + mockDataVipMonth[idx]['จีน'],
  'ญี่ปุ่น': item['ญี่ปุ่น'] + mockDataVipMonth[idx]['ญี่ปุ่น'],
}));

const CustomLegend = ({ payload }) => {
  const order = ['ยอดรวม', 'ไทย', 'USA', 'จีน', 'ญี่ปุ่น'];
  const colors = {
    'ยอดรวม': '#ffffff',
    'ไทย': '#3b82f6',
    'USA': '#ef4444',
    'จีน': '#f59e0b',
    'ญี่ปุ่น': '#10b981'
  };

  return (
    <div className="flex flex-col gap-2 ml-5">
      {order.map((key) => (
        <div key={key} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[key] }} />
          <span className="text-gray-300 text-[11px] font-medium">{key}</span>
        </div>
      ))}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const order = ['ยอดรวม', 'ไทย', 'USA', 'จีน', 'ญี่ปุ่น'];
    const sortedPayload = [...payload].sort((a, b) => 
      order.indexOf(a.name) - order.indexOf(b.name)
    );

    return (
      <div className="bg-[#131024]/95 border border-[#3b2a75] p-3 rounded-lg shadow-2xl backdrop-blur-md">
        <p className="text-gray-400 text-[11px] mb-2 font-medium border-b border-[#2d2252] pb-1">วันที่ {label}</p>
        <div className="space-y-1.5">
          {sortedPayload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-300 text-xs font-light">{entry.name}</span>
              </div>
              <span className="text-white text-xs font-semibold">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardGraph() {
  const [activeTab, setActiveTab] = useState('streaming');
  const [vipFilter, setVipFilter] = useState('week');

  const tabs = [
    { id: 'streaming', label: 'การสตรีมมิ่ง' },
    { id: 'users', label: 'จำนวนผู้ใช้งาน' },
    { id: 'beans', label: 'การซื้อ Bean' },
    { id: 'vip', label: 'การซื้อ VIP Package' },
  ];

  const getChartData = () => {
    switch (activeTab) {
      case 'streaming': return mockDataStreaming;
      case 'users': return mockDataUsers;
      case 'beans': return mockDataBeans;
      case 'vip': 
        return vipFilter === 'week' ? mockDataVipWeek : mockDataVipMonth;
      default: return mockDataStreaming;
    }
  };

  const getChartYLabel = () => {
    switch (activeTab) {
      case 'streaming': return 'จำนวนตอน';
      case 'users': return 'จำนวนคนเข้า';
      case 'beans': return 'จำนวน Bean';
      case 'vip': return 'จำนวนครั้งที่ซื้อ';
      default: return '';
    }
  };

  const data = getChartData();

  return (
    <div className="bg-[#131024] border border-[#2d2252] rounded shadow-md p-4 h-full min-h-0 flex flex-col">
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-[#2d2252] pb-4 mb-4 shrink-0">
        {/* Tabs */}
        <div className="flex space-x-2 sm:space-x-4 w-full sm:w-auto overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm whitespace-nowrap font-medium rounded transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#3b2a75] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#2d2252]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters for VIP */}
        {activeTab === 'vip' && (
          <div className="mt-4 sm:mt-0 flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-sm text-gray-400">ประเภท VIP:</span>
            <select 
              value={vipFilter} 
              onChange={(e) => setVipFilter(e.target.value)}
              className="bg-[#2d2252] border border-[#3b2a75] text-white text-sm rounded outline-none p-1.5 cursor-pointer"
            >
              <option value="week">VIP 1 สัปดาห์</option>
              <option value="month">VIP 1 เดือน</option>
            </select>
          </div>
        )}
      </div>

      <div className="w-full flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2252" />
            <XAxis dataKey="date" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} label={{ value: getChartYLabel(), angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="ยอดรวม" stroke="#ffffff" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="ไทย" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="USA" stroke="#ef4444" strokeWidth={2} />
            <Line type="monotone" dataKey="จีน" stroke="#f59e0b" strokeWidth={2} />
            <Line type="monotone" dataKey="ญี่ปุ่น" stroke="#10b981" strokeWidth={2} />
            <Legend 
              content={<CustomLegend />}
              layout="vertical" 
              align="right" 
              verticalAlign="middle" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
