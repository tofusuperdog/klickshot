'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { backofficeMutation } from '@/lib/backoffice';

function CustomRadio({ checked, onChange }) {
  return (
    <div
      onClick={onChange}
      className={`w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${checked ? 'border-[#3ceb8b]' : 'border-gray-400'}`}
    >
      {checked && (
        <div className="w-2 h-2 rounded-full bg-[#3ceb8b]" />
      )}
    </div>
  );
}

export default function SalesPage() {
  const { user } = useAuth();
  const [isVipActive, setIsVipActive] = useState(true);
  const [vipPackages, setVipPackages] = useState([]);
  const [originalVipPackages, setOriginalVipPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPackages = async () => {
    setLoading(true);

    const { data: settingsData } = await supabase
      .from('app_settings')
      .select('is_vip_active')
      .eq('id', 1)
      .single();

    if (settingsData?.is_vip_active !== undefined) {
      setIsVipActive(settingsData.is_vip_active);
    }

    const { data: vipData, error: vipError } = await supabase
      .from('vip_package')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!vipError && vipData) {
      setVipPackages(vipData);
      setOriginalVipPackages(JSON.parse(JSON.stringify(vipData)));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleVipChange = (id, field, value) => {
    setVipPackages(prev => prev.map(pkg =>
      pkg.id === id ? { ...pkg, [field]: value } : pkg
    ));
  };

  const handleVipRadioChange = (id) => {
    setVipPackages(prev => prev.map(pkg =>
      ({ ...pkg, is_recommended: pkg.id === id })
    ));
  };

  const handleCancelVip = () => {
    setVipPackages(JSON.parse(JSON.stringify(originalVipPackages)));
  };

  const handleVipToggleChange = async (checked) => {
    setIsVipActive(checked);

    await backofficeMutation(user, 'app_settings', 'upsert', { id: 1, is_vip_active: checked }, {}, 'id');
  };

  const handleSaveVip = async () => {
    const invalidPackage = vipPackages.find((pkg) =>
      !pkg.type?.trim() ||
      !Number.isInteger(Number(pkg.bean_amount)) ||
      Number(pkg.bean_amount) < 0 ||
      !Number.isInteger(Number(pkg.duration_days)) ||
      Number(pkg.duration_days) <= 0
    );

    if (invalidPackage) {
      alert('กรุณากรอกประเภท ราคา Beans และจำนวนวันให้ถูกต้อง');
      return;
    }

    setIsSaving(true);
    for (const pkg of vipPackages) {
      await backofficeMutation(
        user,
        'vip_package',
        'update',
        {
          type: pkg.type?.trim() || '',
          bean_amount: pkg.bean_amount === '' ? 0 : parseInt(pkg.bean_amount, 10),
          duration_days: pkg.duration_days === '' ? 0 : parseInt(pkg.duration_days, 10),
          is_recommended: pkg.is_recommended
        },
        { id: pkg.id }
      );
    }
    await fetchPackages();
    setIsSaving(false);
  };

  const isVipDirty = JSON.stringify(vipPackages) !== JSON.stringify(originalVipPackages);

  return (
    <div className="w-full pb-20">
      <div className="flex items-center mb-8 text-white space-x-3">
        <div className="relative w-8 h-8">
          <Image src="/sales.svg" alt="Sales" fill sizes="36px" style={{ objectFit: 'contain' }} />
        </div>
        <h1 className="text-xl text-gray-300 font-semibold tracking-wide">การขาย</h1>
      </div>

      <div className="border border-[#2d2252] rounded-lg overflow-hidden shadow-lg bg-[#12102f]/60">
        <div className="p-8">
          <div className="w-full max-w-[1200px] mx-auto flex flex-col items-center animate-fadeIn">
            <div className="w-full flex justify-end items-center mb-6">
              <span className="text-gray-300 font-medium mr-4">เปิดใช้งานแพ็กเกจ VIP</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isVipActive}
                  onChange={(e) => handleVipToggleChange(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3ceb8b]"></div>
              </label>
            </div>

            <div className={`w-full flex flex-col xl:flex-row items-start justify-center gap-5 transition-all duration-300 ${!isVipActive ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
              <div className="w-[360px] shrink-0 mb-4 p-4 rounded-[18px] bg-[#030303] border border-[#111] shadow-2xl overflow-hidden">
                <div className="flex items-center gap-4 mb-7 px-3 py-3.5 rounded-[16px] bg-[#080808] shadow-[0_14px_34px_rgba(0,0,0,0.55)]">
                  <img src="/popcornicon.svg" alt="Popcorn" className="w-[64px] h-[64px] -ml-1 shrink-0 object-contain drop-shadow-lg" />
                  <div className="min-w-0">
                    <h2 className="text-[25px] leading-[1.05] font-bold text-white tracking-normal">สมัคร VIP</h2>
                    <div className="text-[14px] leading-5 text-white font-medium mt-1">ดูซีรีส์ได้ไม่จำกัด</div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {vipPackages.map(pkg => {
                    const isRecommended = pkg.is_recommended;
                    const cardStyle = isRecommended
                      ? 'border-[#c053ff] bg-[radial-gradient(circle_at_34%_15%,rgba(190,85,255,0.45),transparent_26%),linear-gradient(110deg,#2a063e_0%,#421059_58%,#21052d_100%)] shadow-[0_0_26px_rgba(167,48,255,0.22)]'
                      : 'border-[#2c2c32] bg-[linear-gradient(110deg,#151519_0%,#17151d_55%,#1c1722_100%)] shadow-[0_12px_26px_rgba(0,0,0,0.38)]';
                    const subtitle = `${pkg.type}`.includes('7') ? 'เหมาะสำหรับทดลองใช้งาน' : 'คุ้มกว่าสำหรับดูต่อเนื่อง';

                    return (
                      <div key={`vip-preview-${pkg.id}`} className={`relative min-h-[102px] p-5 rounded-[16px] border overflow-hidden flex justify-between items-center ${cardStyle}`}>
                        {isRecommended && (
                          <div className="absolute top-0 right-0 min-w-[82px] text-center bg-[linear-gradient(180deg,#d33cff_0%,#8d0fe0_100%)] text-white text-[12px] font-bold px-3 py-2 rounded-bl-xl z-10 shadow-[0_8px_18px_rgba(141,15,224,0.35)]">
                            ยอดนิยม
                          </div>
                        )}

                        <div className="flex flex-col z-0 relative">
                          <div className="text-[20px] leading-none font-bold text-white tracking-normal">{pkg.type}</div>
                          <div className="text-[13px] text-white/82 font-medium mt-4">{subtitle}</div>
                        </div>

                        <div className="flex flex-col items-end justify-center pl-4 pr-0.5 relative z-0">
                          <div className="text-[25px] font-bold text-white tracking-normal leading-none select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] whitespace-nowrap">
                            {pkg.bean_amount} <span className="text-[18px] font-medium ml-1">Beans</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 w-full bg-[#12102f]/40 rounded-xl p-4 overflow-x-auto border border-[#2d2252]/50">
                <table className="w-full text-center text-[13px] font-medium text-white border-collapse min-w-[560px]">
                  <thead>
                    <tr className="border-b-[0.5px] border-b-gray-700 bg-[#0c0a1b]/60">
                      <th className="py-3 px-2 font-medium tracking-wide">ประเภท</th>
                      <th className="py-3 px-2 font-medium tracking-wide">จำนวนวัน</th>
                      <th className="py-3 px-2 font-medium tracking-wide">ราคา (Beans)</th>
                      <th className="py-3 px-2 font-medium tracking-wide">แพ็กเกจแนะนำ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-gray-500 font-light text-[14px]">กำลังโหลดแพ็กเกจ...</td>
                      </tr>
                    ) : vipPackages.map((pkg, idx) => (
                      <tr key={pkg.id} className={`${idx % 2 === 0 ? 'bg-[#28214f]/30' : 'bg-[#28214f]/10'} hover:bg-[#3d3278]/20 transition-colors`}>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={pkg.type}
                            readOnly
                            className="w-full max-w-[180px] h-7 bg-[#d1d5db] text-[#374151] text-center focus:outline-none text-[13px] rounded-sm cursor-default"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="1"
                            min="1"
                            value={pkg.duration_days ?? 0}
                            readOnly
                            className="w-full max-w-[90px] h-7 bg-[#d1d5db] text-[#374151] text-center focus:outline-none text-[13px] rounded-sm cursor-default"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={pkg.bean_amount ?? 0}
                            onChange={(e) => handleVipChange(pkg.id, 'bean_amount', e.target.value)}
                            className="w-full max-w-[110px] h-7 bg-[#e5e7eb] text-black text-center focus:outline-none focus:ring-2 focus:ring-[#709bf0] text-[13px] rounded-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex justify-center transform scale-90">
                            <CustomRadio
                              checked={pkg.is_recommended || false}
                              onChange={() => handleVipRadioChange(pkg.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="w-full flex justify-center gap-4 mt-6 mb-2">
              <button
                type="button"
                onClick={handleCancelVip}
                disabled={!isVipDirty || isSaving}
                className="w-40 h-11 bg-transparent border border-[#5c85f1] hover:bg-[#5c85f1]/10 transition-colors rounded text-[#5c85f1] font-medium tracking-widest cursor-pointer disabled:opacity-30 disabled:border-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed text-[15px]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveVip}
                disabled={!isVipDirty || isSaving}
                className="w-40 h-11 bg-[#5c85f1] hover:bg-[#4a72d7] transition-colors rounded text-white font-medium tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-[15px] shadow-md"
              >
                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
