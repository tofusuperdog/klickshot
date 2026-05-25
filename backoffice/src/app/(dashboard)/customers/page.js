'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { backofficeQuery } from '@/lib/backoffice';

const statusLabels = {
  active: 'ใช้งานอยู่',
  expired: 'หมดอายุ',
  cancelled: 'ยกเลิก',
  refunded: 'คืนเงินแล้ว',
};

const tabs = [
  { id: 'latest', label: 'ลูกค้าล่าสุด' },
  { id: 'search', label: 'ค้นหาลูกค้า' },
];

function formatDateTime(value) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded border border-[#2d2252]/70 bg-[#181236]/50 px-3 py-2.5">
      <div className="mb-1 text-[12px] font-light text-gray-400">{label}</div>
      <div className="break-words text-[14px] font-medium text-gray-100">{formatValue(value)}</div>
    </div>
  );
}

export default function CustomersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('latest');
  const [customerId, setCustomerId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [latestCustomers, setLatestCustomers] = useState([]);
  const [latestLoading, setLatestLoading] = useState(true);

  const customer = result?.customer || null;
  const vipSubscriptions = result?.vip_subscriptions || [];

  useEffect(() => {
    let isCurrent = true;

    async function fetchLatestCustomers() {
      if (!user) return;

      setLatestLoading(true);
      const { data, error: queryError } = await backofficeQuery(user, 'customers');

      if (!isCurrent) return;

      if (queryError) {
        setLatestCustomers([]);
        setLatestLoading(false);
        return;
      }

      const latest = (data || [])
        .filter((item) => item.last_login_at)
        .sort((a, b) => new Date(b.last_login_at).getTime() - new Date(a.last_login_at).getTime())
        .slice(0, 20);

      setLatestCustomers(latest);
      setLatestLoading(false);
    }

    fetchLatestCustomers();

    return () => {
      isCurrent = false;
    };
  }, [user]);

  const searchCustomer = async (id) => {
    const cleanedId = String(id || '').trim();
    if (!/^\d+$/.test(cleanedId)) {
      setError('กรุณากรอกรหัสลูกค้าเป็นตัวเลข');
      setResult(null);
      return;
    }

    setActiveTab('search');
    setLoading(true);
    setError('');

    const { data, error: queryError } = await backofficeQuery(user, 'customer_detail', {
      customer_id: cleanedId,
    });

    setLoading(false);

    if (queryError) {
      setError(queryError.message || 'ไม่สามารถค้นหาข้อมูลลูกค้าได้');
      setResult(null);
      return;
    }

    if (!data?.customer) {
      setError(`ไม่พบลูกค้ารหัส ${cleanedId}`);
      setResult(null);
      return;
    }

    setResult(data);
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    await searchCustomer(customerId);
  };

  const handleSelectLatestCustomer = async (id) => {
    setCustomerId(String(id));
    await searchCustomer(id);
  };

  return (
    <div className="w-full pb-20">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-white">
          <div className="relative h-9 w-9">
            <Image src="/customers.svg" alt="Customers" fill sizes="36px" style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="text-xl font-semibold tracking-wide text-gray-300">ลูกค้า</h1>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-[#2d2252] bg-[#12102f]/70 shadow-lg">
        <div className="flex min-w-0 overflow-x-auto border-b border-[#2d2252]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-[15px] font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                ? 'border-[#6C72FF] text-[#6C72FF]'
                  : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'latest' && (
        <section className="rounded-lg border border-[#2d2252] bg-[#12102f]/70 p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">ลูกค้าล่าสุดที่เข้าใช้งาน</h2>
              <p className="mt-1 text-[12px] text-gray-400">แสดง 20 คนล่าสุดจากเวลา login</p>
            </div>
            <div className="rounded bg-[#181331] px-3 py-1.5 text-[12px] text-gray-300">
              {latestCustomers.length.toLocaleString()} คน
            </div>
          </div>

          {latestLoading ? (
            <div className="rounded border border-[#2d2252]/70 bg-[#181236]/40 px-4 py-10 text-center text-[14px] text-gray-400">
              กำลังโหลดลูกค้าล่าสุด...
            </div>
          ) : latestCustomers.length === 0 ? (
            <div className="rounded border border-[#2d2252]/70 bg-[#181236]/40 px-4 py-10 text-center text-[14px] text-gray-400">
              ยังไม่มีข้อมูลการเข้าใช้งานล่าสุด
            </div>
          ) : (
            <div className="max-h-[520px] overflow-auto rounded border border-[#2d2252]/70">
              <table className="w-full min-w-[680px] border-collapse text-left text-[13px] text-gray-200">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-[#2d2252] bg-[#0c0a1b]/60 text-gray-300">
                    <th className="px-3 py-2.5 font-medium">รหัสลูกค้า</th>
                    <th className="px-3 py-2.5 font-medium">TikTok Open ID</th>
                    <th className="px-3 py-2.5 font-medium">เข้าใช้งานล่าสุด</th>
                    <th className="px-3 py-2.5 text-right font-medium">ดูข้อมูล</th>
                  </tr>
                </thead>
                <tbody>
                  {latestCustomers.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`border-b border-[#2d2252]/50 ${
                        index % 2 === 0 ? 'bg-[#28214f]/25' : 'bg-[#28214f]/10'
                      }`}
                    >
                      <td className="px-3 py-2.5 font-medium text-white">#{item.id}</td>
                      <td className="max-w-[360px] truncate px-3 py-2.5">{item.tiktok_open_id || '-'}</td>
                      <td className="px-3 py-2.5">{formatDateTime(item.last_login_at)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectLatestCustomer(item.id)}
                          className="cursor-pointer rounded border border-[#5c85f1] px-2.5 py-1 text-[12px] font-medium text-[#9db7ff] transition-colors hover:bg-[#5c85f1]/10"
                        >
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'search' && (
        <>
          <section className="rounded-lg border border-[#2d2252] bg-[#12102f]/70 p-4 shadow-lg">
            <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row md:items-end">
              <label className="flex-1">
                <span className="mb-2 block text-[13px] font-medium text-gray-300">ค้นหารหัสลูกค้า</span>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  placeholder="เช่น 123"
                  className="h-11 w-full rounded border border-[#3b2a75] bg-[#181331] px-4 text-white outline-none transition-colors placeholder:text-gray-500 hover:border-[#6C72FF] focus:border-[#6C72FF]"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="h-11 cursor-pointer rounded bg-[#5c85f1] px-8 text-[15px] font-medium tracking-wide text-white shadow-md transition-colors hover:bg-[#4a72d7] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
              </button>
            </form>

            {error && (
              <div className="mt-4 rounded border border-[#6d2f3c] bg-[#2c1018] px-4 py-3 text-[14px] text-[#ffb4c2]">
                {error}
              </div>
            )}
          </section>

          {customer && (
            <div className="mt-4 flex flex-col gap-4">
              <section className="rounded-lg border border-[#2d2252] bg-[#12102f]/70 p-4 shadow-lg">
                <div className="mb-3">
                  <h2 className="text-base font-semibold text-white">ข้อมูลลูกค้า</h2>
                  <p className="mt-1 text-[13px] text-gray-400">รหัสลูกค้า #{customer.id}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <DetailItem label="TikTok Open ID" value={customer.tiktok_open_id} />
                  <DetailItem label="เข้าใช้งานล่าสุด" value={formatDateTime(customer.last_login_at)} />
                  <DetailItem label="วันที่สมัคร" value={formatDateTime(customer.created_at)} />
                </div>
              </section>

              <section className="rounded-lg border border-[#2d2252] bg-[#12102f]/70 shadow-lg">
                <div className="flex items-center justify-between border-b border-[#2d2252] px-4 py-3">
                  <div>
                    <h2 className="text-base font-semibold text-white">ประวัติการซื้อ VIP</h2>
                  </div>
                  <div className="rounded bg-[#181331] px-3 py-1.5 text-[12px] text-gray-300">
                    {vipSubscriptions.length.toLocaleString()} รายการ
                  </div>
                </div>

                {vipSubscriptions.length === 0 ? (
                  <div className="px-6 py-12 text-center text-[14px] text-gray-400">
                    ยังไม่มีประวัติการซื้อ VIP
                  </div>
                ) : (
                  <div className="max-h-[420px] overflow-auto">
                    <table className="w-full min-w-[860px] border-collapse text-left text-[13px] text-gray-200">
                      <thead className="sticky top-0 z-10">
                        <tr className="border-b border-[#2d2252] bg-[#0c0a1b]/60 text-gray-300">
                          <th className="px-3 py-2.5 font-medium">วันที่ซื้อ</th>
                          <th className="px-3 py-2.5 font-medium">แพ็กเกจ</th>
                          <th className="px-3 py-2.5 font-medium">จำนวนวัน</th>
                          <th className="px-3 py-2.5 font-medium">Beans</th>
                          <th className="px-3 py-2.5 font-medium">สถานะ</th>
                          <th className="px-3 py-2.5 font-medium">เริ่มใช้งาน</th>
                          <th className="px-3 py-2.5 font-medium">หมดอายุ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vipSubscriptions.map((subscription, index) => (
                          <tr
                            key={subscription.id}
                            className={`border-b border-[#2d2252]/50 ${
                              index % 2 === 0 ? 'bg-[#28214f]/25' : 'bg-[#28214f]/10'
                            }`}
                          >
                            <td className="px-3 py-2.5">{formatDateTime(subscription.created_at)}</td>
                            <td className="px-3 py-2.5 font-medium text-white">{subscription.package_type}</td>
                            <td className="px-3 py-2.5">{subscription.duration_days?.toLocaleString()} วัน</td>
                            <td className="px-3 py-2.5">{subscription.bean_amount?.toLocaleString()}</td>
                            <td className="px-3 py-2.5">
                              <span className="rounded bg-[#181331] px-2 py-1 text-[12px] text-gray-200">
                                {statusLabels[subscription.status] || subscription.status || '-'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">{formatDateTime(subscription.starts_at)}</td>
                            <td className="px-3 py-2.5">{formatDateTime(subscription.expires_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
