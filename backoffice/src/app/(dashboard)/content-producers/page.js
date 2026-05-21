'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  backofficeContentProducerMutation,
  backofficeQuery,
} from '@/lib/backoffice';

const defaultFormData = {
  name: '',
  username: '',
  password: '',
};

function ContentProducerModal({
  isOpen,
  title,
  isEdit,
  formData,
  setFormData,
  onClose,
  onSave,
  isSaving,
}) {
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] backdrop-grayscale">
      <div className="bg-[#12102f] border border-[#504481] rounded-xl w-full max-w-[480px] shadow-2xl p-8 py-10">
        <h2 className="text-2xl font-semibold text-white text-center mb-10 tracking-wide">
          {title}
        </h2>

        <form onSubmit={handleSubmit} className="px-4">
          <div className="space-y-4 mb-10">
            <div className="flex items-center">
              <span className="w-[110px] text-[15px] font-light text-gray-300 shrink-0">
                ชื่อผู้ผลิต
              </span>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="flex-1 h-10 px-3 bg-white rounded text-black focus:outline-none focus:ring-2 focus:ring-[#709bf0]"
                autoComplete="organization"
              />
            </div>

            <div className="flex items-center">
              <span className="w-[110px] text-[15px] font-light text-gray-300 shrink-0">
                ชื่อผู้ใช้งาน
              </span>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="flex-1 h-10 px-3 bg-white rounded text-black focus:outline-none focus:ring-2 focus:ring-[#709bf0]"
                autoComplete="username"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center">
                <span className="w-[110px] text-[15px] font-light text-gray-300 shrink-0">
                  รหัสผ่าน
                </span>
                <div className="flex-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full h-10 px-3 pr-10 bg-white rounded text-black focus:outline-none focus:ring-2 focus:ring-[#709bf0]"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.5 6.5m3.378 3.378a3 3 0 004.243 4.243m0 0L17.5 17.5m-3.379-3.379L6.5 6.5m0 0L3 3m3.5 3.5L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex">
                <div className="w-[110px] shrink-0"></div>
                <p className="text-gray-400 text-[13px] font-light">
                  {isEdit
                    ? 'เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน'
                    : 'รหัสผ่านต้องมีความยาวไม่น้อยกว่า 6 ตัวอักษร'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-36 h-10 border border-gray-500 hover:bg-white/5 transition-colors rounded text-gray-300 font-light disabled:opacity-50 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-36 h-10 bg-[#5c85f1] hover:bg-[#4a72d7] transition-colors rounded text-white font-light disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ isOpen, producer, onClose, onConfirm, isDeleting }) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNum1(Math.floor(Math.random() * 10) + 1);
      setNum2(Math.floor(Math.random() * 10) + 1);
      setAnswer('');
      setIsValid(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setIsValid(parseInt(answer, 10) === num1 + num2);
  }, [answer, num1, num2]);

  if (!isOpen || !producer) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
      <div className="bg-[#12102f] border border-[#2d2252] rounded-xl w-full max-w-[480px] shadow-2xl p-8 py-10 flex flex-col items-center">
        <h2 className="text-[20px] font-semibold text-white mb-4">ยืนยันการลบผู้ผลิต</h2>

        <p className="text-gray-300 font-light mb-3 text-[15px] text-center">
          คุณต้องการลบผู้ผลิต <span className="font-semibold text-white">{producer.name}</span> ใช่หรือไม่?
        </p>

        <p className="text-[#FF9999] text-[14px] font-light mb-8 text-center">
          การดำเนินการนี้ไม่สามารถย้อนกลับได้!
        </p>

        <div className="w-full flex flex-col items-center mb-10">
          <p className="text-gray-300 text-[14px] font-light mb-4 text-center">
            เพื่อยืนยันการลบ กรุณาบวกเลขด้านล่างนี้
          </p>
          <div className="flex items-center space-x-3">
            <div className="bg-[#24213a] text-white font-semibold text-xl px-4 py-2 rounded-md min-w-[100px] text-center tracking-wider">
              {num1} + {num2} =
            </div>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-16 h-[44px] bg-white text-black text-xl font-medium text-center rounded-md focus:outline-none focus:ring-2 focus:ring-[#D24949]"
              placeholder="?"
              maxLength={2}
            />
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isValid || isDeleting}
            className={`w-32 h-10 rounded text-white font-light transition-colors ${!isValid ? 'bg-[#8c353b]/50 cursor-not-allowed text-white/50' : 'bg-[#8c353b] hover:bg-[#a53c45] cursor-pointer'}`}
          >
            {isDeleting ? 'กำลังลบ...' : 'ลบผู้ผลิต'}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-32 h-10 border border-[#443868] hover:bg-white/5 transition-colors rounded text-gray-300 font-light disabled:opacity-50 cursor-pointer"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

function ProducerSeriesListModal({ isOpen, producer, seriesList, title, message, onClose }) {
  if (!isOpen || !producer) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
      <div className="relative bg-[#12102f] border border-[#2d2252] rounded-xl w-full max-w-[560px] shadow-2xl p-8 py-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="ปิดหน้าต่าง"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-[20px] font-semibold text-white mb-4 text-center">{title}</h2>

        {message && (
          <p className="text-gray-300 font-light mb-6 text-[15px] text-center leading-relaxed">
            {message}
          </p>
        )}

        <div className="mb-3 text-sm font-medium text-gray-300">
          ซีรีส์ที่เกี่ยวข้อง {seriesList.length} เรื่อง
        </div>

        <div className="max-h-[280px] overflow-y-auto rounded-lg border border-[#2d2252] bg-[#181236]/70">
          <div className="divide-y divide-[#2d2252]/70">
            {seriesList.map((series, index) => (
              <Link
                key={series.id}
                href={`/series/${series.id}`}
                className={`group grid grid-cols-[48px_1fr_28px] items-center px-4 py-3 text-sm text-gray-200 transition-all duration-150 hover:bg-[#3d3278]/40 hover:text-white hover:pl-5 ${index % 2 === 0 ? 'bg-[#28214f]/25' : 'bg-[#181236]/20'}`}
              >
                <span className="text-center text-gray-500 group-hover:text-gray-300">
                  {index + 1}
                </span>
                <span className="truncate">
                  {series.title_th || series.title_en || `Series #${series.id}`}
                </span>
                <span className="text-right text-gray-500 transition-transform group-hover:translate-x-1 group-hover:text-white">
                  &gt;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContentProducersPage() {
  const { user } = useAuth();
  const [contentProducers, setContentProducers] = useState([]);
  const [allSeries, setAllSeries] = useState([]);
  const [seriesCountsByProducerId, setSeriesCountsByProducerId] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null);
  const [editingProducer, setEditingProducer] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [blockedDeleteTarget, setBlockedDeleteTarget] = useState(null);
  const [seriesListTarget, setSeriesListTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const errorTimeoutRef = useRef(null);
  const itemsPerPage = 25;

  const showError = (message) => {
    setErrorMsg(message);
    setErrorVisible(true);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setErrorVisible(false);
    }, 4000);
  };

  const fetchContentProducers = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    const { data, error } = await backofficeQuery(user, 'content_producers');
    const { data: seriesData, error: seriesError } = await backofficeQuery(user, 'series');

    if (error) {
      console.error('Error fetching content producers:', error);
      showError('เกิดข้อผิดพลาด: ไม่สามารถโหลดรายชื่อผู้ผลิตได้');
    } else {
      setContentProducers(data || []);
    }

    if (seriesError) {
      console.error('Error fetching series counts:', seriesError);
    } else {
      const counts = {};
      (seriesData || []).forEach((series) => {
        if (!series.content_producer_id) return;
        const key = String(series.content_producer_id);
        counts[key] = (counts[key] || 0) + 1;
      });
      setAllSeries(seriesData || []);
      setSeriesCountsByProducerId(counts);
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchContentProducers();
  }, [fetchContentProducers]);

  const filteredContentProducers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const filtered = keyword
      ? contentProducers.filter((producer) =>
          producer.name?.toLowerCase().includes(keyword)
        )
      : contentProducers;

    return [...filtered].sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB, 'th');
    });
  }, [contentProducers, searchTerm]);

  const totalPages = Math.ceil(filteredContentProducers.length / itemsPerPage);
  const paginatedContentProducers = filteredContentProducers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openAdd = () => {
    setFormData(defaultFormData);
    setEditingProducer(null);
    setModalMode('add');
  };

  const openEdit = (producer) => {
    setEditingProducer(producer);
    setFormData({
      name: producer.name || '',
      username: producer.username || '',
      password: '',
    });
    setModalMode('edit');
  };

  const closeModal = () => {
    if (isSaving) return;
    setModalMode(null);
    setEditingProducer(null);
  };

  const handleSave = async () => {
    const name = formData.name.trim();
    const username = formData.username.trim();
    const password = formData.password;

    if (!name) {
      showError('กรุณากรอกชื่อผู้ผลิต');
      return;
    }

    if (/\s/.test(formData.username)) {
      showError('ชื่อผู้ใช้งานไม่สามารถมีช่องว่างได้');
      return;
    }

    if (!username) {
      showError('กรุณากรอกชื่อผู้ใช้งาน');
      return;
    }

    if (username.length < 3) {
      showError('ชื่อผู้ใช้งานต้องมีความยาวไม่น้อยกว่า 3 ตัวอักษร');
      return;
    }

    const isDuplicate = contentProducers.some(
      (producer) =>
        producer.username.toLowerCase() === username.toLowerCase() &&
        (modalMode === 'add' || producer.id !== editingProducer?.id)
    );

    if (isDuplicate) {
      showError('ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว');
      return;
    }

    if (modalMode === 'add' && !password.trim()) {
      showError('กรุณากรอกรหัสผ่าน');
      return;
    }

    if (password && /\s/.test(password)) {
      showError('รหัสผ่านไม่สามารถมีช่องว่างได้');
      return;
    }

    if (password && password.length < 6) {
      showError('รหัสผ่านต้องมีความยาวไม่น้อยกว่า 6 ตัวอักษร');
      return;
    }

    setIsSaving(true);
    const { error } = modalMode === 'edit' && editingProducer
      ? await backofficeContentProducerMutation(user, 'update', {
          content_producer_id: editingProducer.id,
          name,
          username,
          password,
        })
      : await backofficeContentProducerMutation(user, 'create', {
          name,
          username,
          password,
        });

    setIsSaving(false);

    if (error) {
      console.error('Error adding content producer:', error);
      showError('เกิดข้อผิดพลาด: ' + (error.message || 'ไม่สามารถเพิ่มผู้ผลิตได้'));
      return;
    }

    setModalMode(null);
    setEditingProducer(null);
    setFormData(defaultFormData);
    fetchContentProducers();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    const { error } = await backofficeContentProducerMutation(user, 'delete', {
      content_producer_id: deleteTarget.id,
    });
    setIsDeleting(false);

    if (error) {
      console.error('Error deleting content producer:', error);
      showError('เกิดข้อผิดพลาด: ' + (error.message || 'ไม่สามารถลบผู้ผลิตได้'));
      return;
    }

    setDeleteTarget(null);
    fetchContentProducers();
  };

  const getProducerSeries = (producerId) => (
    allSeries.filter((series) => String(series.content_producer_id) === String(producerId))
  );

  const handleDeleteClick = (producer) => {
    const producerSeries = getProducerSeries(producer.id);

    if (producerSeries.length > 0) {
      setBlockedDeleteTarget(producer);
      return;
    }

    setDeleteTarget(producer);
  };

  return (
    <div className="w-full pb-20 relative">
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${errorVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className="bg-[#D24949] text-white px-6 py-3.5 rounded shadow-2xl flex items-center space-x-4 w-max min-w-[300px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z" />
          </svg>
          <span className="font-medium tracking-wide">{errorMsg}</span>
        </div>
      </div>

      <div className="sticky top-0 z-40 bg-[#110d29] pb-3 mb-3 -mx-10 px-10 before:content-[''] before:absolute before:inset-x-0 before:bottom-full before:h-[40px] before:bg-[#110d29]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3 text-white">
            <div className="relative w-9 h-9">
              <Image
                src="/film.svg"
                alt="Content producers"
                fill
                sizes="36px"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <h1 className="text-xl font-semibold text-gray-300 tracking-wide">
              ผู้ผลิตคอนเทนต์
            </h1>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="bg-[#5c85f1] hover:bg-[#4a72d7] transition-colors text-white px-5 py-2.5 rounded font-medium text-[15px] cursor-pointer shadow-lg"
          >
            เพิ่มผู้ผลิต
          </button>
        </div>

        <div className="bg-[#181236]/90 border border-[#2d2252] rounded-md px-5 py-3 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="text-gray-300 font-light text-[15px]">
            ทั้งหมด {filteredContentProducers.length} ผู้ผลิต
          </div>

          <div className="relative w-[240px]">
            <input
              type="text"
              placeholder="ค้นหาผู้ผลิต"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-4 pr-10 bg-[#3a305d] border border-[#2d2252] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#709bf0] placeholder-gray-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C72FF]"></div>
          <span className="ml-3 text-gray-300">กำลังโหลด...</span>
        </div>
      ) : (
        <div className="bg-[#181236] border border-[#2d2252] rounded-lg overflow-hidden">
          <div className="grid grid-cols-[80px_1.4fr_130px_180px_180px_120px] items-center border-b border-[#2d2252] text-base text-gray-300 font-light bg-[#181236]">
            <div className="px-6 py-4 font-medium text-center">ลำดับ</div>
            <div className="px-6 py-4 font-medium">ชื่อผู้ผลิต</div>
            <div className="px-6 py-4 font-medium text-center">จำนวนซีรีส์</div>
            <div className="px-6 py-4 font-medium">ชื่อผู้ใช้งาน</div>
            <div className="px-6 py-4 font-medium text-center">วันที่เพิ่ม</div>
            <div className="px-6 py-4 font-medium text-center">จัดการ</div>
          </div>

          {filteredContentProducers.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              {contentProducers.length === 0 ? 'ยังไม่มีข้อมูลผู้ผลิต' : 'ไม่พบผู้ผลิตที่ค้นหา'}
            </div>
          ) : (
            paginatedContentProducers.map((producer, index) => (
              <div
                key={producer.id}
                className="grid grid-cols-[80px_1.4fr_130px_180px_180px_120px] items-center border-b border-[#2d2252]/80 last:border-b-0 text-gray-300 hover:bg-white/[0.03] transition-colors"
              >
                <div className="px-6 py-4 font-light text-center text-gray-400">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </div>
                <div className="px-6 py-4 font-light text-white">{producer.name}</div>
                <div className="px-6 py-4 font-light text-center text-gray-300">
                  <button
                    type="button"
                    onClick={() => setSeriesListTarget(producer)}
                    className={`inline-flex min-w-10 items-center justify-center rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                      (seriesCountsByProducerId[String(producer.id)] || 0) > 0
                        ? 'border-[#5c85f1]/70 bg-[#5c85f1]/12 text-[#9bb8ff] hover:bg-[#5c85f1]/25 hover:text-white cursor-pointer'
                        : 'border-gray-600 bg-white/[0.03] text-gray-400 hover:bg-white/[0.07] hover:text-gray-200 cursor-pointer'
                    }`}
                    title="ดูรายชื่อซีรีส์"
                  >
                    {seriesCountsByProducerId[String(producer.id)] || 0}
                  </button>
                </div>
                <div className="px-6 py-4 font-light">{producer.username}</div>
                <div className="px-6 py-4 font-light text-center text-sm text-gray-400">
                  {new Date(producer.created_at).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="px-6 py-4 flex items-center justify-center space-x-2">
                  <button
                    type="button"
                    onClick={() => openEdit(producer)}
                    className="p-2 cursor-pointer hover:bg-white/10 rounded transition-colors text-gray-300 hover:text-white"
                    title="แก้ไข"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteClick(producer)}
                    className="p-2 cursor-pointer hover:bg-red-500/20 rounded transition-colors text-gray-300 hover:text-[#eb6161]"
                    title="ลบ"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && filteredContentProducers.length > itemsPerPage && (
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center bg-[#181236]/60 border border-[#2d2252] rounded-lg p-4 gap-4">
          <div className="text-gray-400 text-sm">
            แสดง {(currentPage - 1) * itemsPerPage + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredContentProducers.length)} จากทั้งหมด {filteredContentProducers.length} รายการ
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-[#2d2252] text-gray-300 rounded hover:bg-[#3a305d] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors text-sm"
            >
              ก่อนหน้า
            </button>
            <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  type="button"
                  onClick={() => setCurrentPage(index + 1)}
                  className={`w-8 h-8 shrink-0 flex items-center justify-center rounded text-sm transition-colors cursor-pointer ${currentPage === index + 1 ? 'bg-[#709bf0] text-white cursor-default' : 'bg-[#2d2252] text-gray-300 hover:bg-[#3a305d]'}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-[#2d2252] text-gray-300 rounded hover:bg-[#3a305d] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors text-sm"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}

      <ContentProducerModal
        isOpen={modalMode !== null}
        title={modalMode === 'edit' ? 'แก้ไขผู้ผลิต' : 'เพิ่มผู้ผลิต'}
        isEdit={modalMode === 'edit'}
        formData={formData}
        setFormData={setFormData}
        onClose={closeModal}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        producer={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />

      <ProducerSeriesListModal
        isOpen={blockedDeleteTarget !== null}
        producer={blockedDeleteTarget}
        title="ไม่สามารถลบผู้ผลิตได้"
        message={
          blockedDeleteTarget
            ? <>จะลบผู้ผลิต <span className="font-semibold text-white">{blockedDeleteTarget.name}</span> ได้ต่อเมื่อไม่มีซีรีส์ของผู้ผลิตนี้อยู่ในระบบ</>
            : null
        }
        seriesList={blockedDeleteTarget ? getProducerSeries(blockedDeleteTarget.id) : []}
        onClose={() => setBlockedDeleteTarget(null)}
      />

      <ProducerSeriesListModal
        isOpen={seriesListTarget !== null}
        producer={seriesListTarget}
        title={seriesListTarget ? `ซีรีส์ของ ${seriesListTarget.name}` : ''}
        message={null}
        seriesList={seriesListTarget ? getProducerSeries(seriesListTarget.id) : []}
        onClose={() => setSeriesListTarget(null)}
      />
    </div>
  );
}
