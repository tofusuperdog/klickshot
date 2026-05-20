'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { backofficeQuery, backofficeUserMutation } from '@/lib/backoffice';

const permissionColumns = [
  { key: 'dashboard', label: 'ภาพรวม', icon: '/dashboard.svg', alwaysOn: true },
  { key: 'perm_series', label: 'ซีรีส์', icon: '/series.svg' },
  { key: 'perm_genres', label: 'แนวเรื่อง', icon: '/genres.svg' },
  { key: 'perm_displays', label: 'การแสดงผล', icon: '/displays.svg' },
  { key: 'perm_sales', label: 'การขาย', icon: '/sales.svg' },
  { key: 'perm_customers', label: 'ลูกค้า', icon: '/customers.svg' },
  { key: 'perm_users', label: 'ผู้ใช้งาน', icon: '/users.svg' },
];

const modalPermissionsLeft = [
  { key: 'perm_series', label: 'ซีรีส์', icon: '/series.svg' },
  { key: 'perm_genres', label: 'แนวเรื่อง', icon: '/genres.svg' },
  { key: 'perm_displays', label: 'การแสดงผล', icon: '/displays.svg' },
];

const modalPermissionsRight = [
  { key: 'perm_sales', label: 'การขาย', icon: '/sales.svg' },
  { key: 'perm_customers', label: 'ลูกค้า', icon: '/customers.svg' },
  { key: 'perm_users', label: 'ผู้ใช้งาน', icon: '/users.svg' },
];

const defaultPermissions = {
  perm_sales: false,
  perm_customers: false,
  perm_users: false,
  perm_series: false,
  perm_genres: false,
  perm_displays: false,
};

function CheckIcon({ active }) {
  if (active) {
    return (
      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
      <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

function UserModal({ isOpen, title, formData, setFormData, onClose, onSave, isAdminEdit, isSaving }) {
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (key) => {
    if (isAdminEdit) return;
    setFormData(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] backdrop-grayscale transition-all duration-300">
      <div className="bg-[#12102f] border border-[#504481] rounded-xl w-full max-w-[480px] shadow-2xl p-8 py-10">
        <h2 className="text-2xl font-semibold text-gray-300 text-center mb-8 tracking-wide">
          {title}
        </h2>

        <div className="px-4">
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="w-[100px] text-[15px] font-light text-gray-300 shrink-0">ชื่อผู้ใช้งาน</span>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={isAdminEdit}
                className={`flex-1 h-10 px-3 bg-[#e0e0e0] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#709bf0] ${isAdminEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center">
                <span className="w-[100px] text-[15px] font-light text-gray-300 shrink-0">รหัสผ่าน</span>
                <div className="flex-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full h-10 px-3 pr-10 bg-[#e0e0e0] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#709bf0]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
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
                <div className="w-[100px] shrink-0"></div>
                <p className="text-gray-400 text-[13px] font-light">
                  รหัสผ่านต้องมีความยาวไม่น้อยกว่า 6 ตัวอักษร
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-500/50 my-6 w-full"></div>

          <div className="mb-4">
            <span className="block text-[15px] font-light text-gray-300 mb-5">สิทธิ์การเข้าถึง</span>
            <div className="flex px-4 gap-x-12">
              <div className="flex-1 space-y-4">
                {modalPermissionsLeft.map((item) => (
                  <div key={item.key} className={`flex items-center space-x-3 group ${isAdminEdit ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`} onClick={() => handleToggle(item.key)}>
                    <div className="relative flex items-center justify-center">
                      <div className={`w-[18px] h-[18px] border rounded-sm transition-all ${formData[item.key] ? 'border-green-500' : 'border-gray-400'}`}></div>
                      {formData[item.key] && (
                        <svg className="w-3.5 h-3.5 text-green-500 absolute pointer-events-none" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="text-gray-300 font-light text-sm group-hover:text-white transition-colors">
                      <span>{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex-1 space-y-4">
                {modalPermissionsRight.map((item) => (
                  <div key={item.key} className={`flex items-center space-x-3 group ${isAdminEdit ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`} onClick={() => handleToggle(item.key)}>
                    <div className="relative flex items-center justify-center">
                      <div className={`w-[18px] h-[18px] border rounded-sm transition-all ${formData[item.key] ? 'border-green-500' : 'border-gray-400'}`}></div>
                      {formData[item.key] && (
                        <svg className="w-3.5 h-3.5 text-green-500 absolute pointer-events-none" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="text-gray-300 font-light text-sm group-hover:text-white transition-colors">
                      <span>{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4 pt-4 px-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-36 h-10 border border-gray-500 hover:bg-white/5 transition-colors rounded text-gray-300 font-light disabled:opacity-50 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="w-36 h-10 bg-[#5c85f1] hover:bg-[#4a72d7] transition-colors rounded text-white font-light disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editingUser, setEditingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    ...defaultPermissions,
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const errorTimeoutRef = useRef(null);

  const showError = (msg) => {
    setErrorMsg(msg);
    setErrorVisible(true);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setErrorVisible(false);
    }, 4000);
  };

  // Fetch users from Supabase
  const fetchUsers = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    const { data, error } = await backofficeQuery(user, 'users');

    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openAdd = () => {
    setFormData({
      username: '',
      password: '',
      ...defaultPermissions,
    });
    setEditingUser(null);
    setModalMode('add');
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      perm_sales: user.perm_sales,
      perm_customers: user.perm_customers,
      perm_users: user.perm_users,
      perm_series: user.perm_series,
      perm_genres: user.perm_genres,
      perm_displays: user.perm_displays,
    });
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingUser(null);
  };

  const handleSave = async () => {
    const rawUsername = formData.username;
    const rawPassword = formData.password;

    if (/\s/.test(rawUsername)) {
      showError('ชื่อผู้ใช้งานไม่สามารถมีช่องว่างได้');
      return;
    }

    const trimmedUsername = rawUsername.trim();

    if (!trimmedUsername) {
      showError('กรุณากรอกชื่อผู้ใช้งาน');
      return;
    }

    if (trimmedUsername.length < 3) {
      showError('ชื่อผู้ใช้งานต้องมีความยาวไม่น้อยกว่า 3 ตัวอักษร');
      return;
    }

    // Check for duplicate username
    const isDuplicate = users.some(u => 
      u.username.toLowerCase() === trimmedUsername.toLowerCase() && 
      (modalMode === 'add' || u.id !== editingUser?.id)
    );

    if (isDuplicate) {
      showError('ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว');
      return;
    }

    if (modalMode === 'add') {
      if (!rawPassword.trim()) {
        showError('กรุณากรอกรหัสผ่าน');
        return;
      }
    }

    if (rawPassword) {
      if (/\s/.test(rawPassword)) {
        showError('รหัสผ่านไม่สามารถมีช่องว่างได้');
        return;
      }
      if (rawPassword.trim().length < 6) {
        showError('รหัสผ่านต้องมีความยาวไม่น้อยกว่า 6 ตัวอักษร');
        return;
      }
    }

    setIsSaving(true);

    if (modalMode === 'add') {
      const { error } = await backofficeUserMutation(user, 'create', {
        username: trimmedUsername,
        password: rawPassword,
        perm_series: formData.perm_series,
        perm_genres: formData.perm_genres,
        perm_displays: formData.perm_displays,
        perm_sales: formData.perm_sales,
        perm_customers: formData.perm_customers,
        perm_users: formData.perm_users,
      });

      if (error) {
        console.error('Error adding user:', error);
        showError('เกิดข้อผิดพลาด: ' + (error.message || 'ไม่สามารถเพิ่มผู้ใช้งานได้'));
        setIsSaving(false);
        return;
      }
    } else if (modalMode === 'edit' && editingUser) {
      const { error } = await backofficeUserMutation(user, 'update', {
        user_id: editingUser.id,
        username: trimmedUsername,
        password: rawPassword,
        perm_series: formData.perm_series,
        perm_genres: formData.perm_genres,
        perm_displays: formData.perm_displays,
        perm_sales: formData.perm_sales,
        perm_customers: formData.perm_customers,
        perm_users: formData.perm_users,
      });

      if (error) {
        console.error('Error updating user:', error);
        showError('เกิดข้อผิดพลาด: ' + (error.message || 'ไม่สามารถแก้ไขผู้ใช้งานได้'));
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    closeModal();
    fetchUsers();
  };

  const handleDelete = (user) => {
    if (user.is_admin) return;
    setDeleteTarget(user);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const { error } = await backofficeUserMutation(user, 'delete', {
      user_id: deleteTarget.id,
    });

    if (error) {
      console.error('Error deleting user:', error);
      showError('เกิดข้อผิดพลาด: ' + (error.message || 'ไม่สามารถลบผู้ใช้งานได้'));
    } else {
      fetchUsers();
    }

    setDeleteTarget(null);
  };

  return (
    <div className="w-full relative">
      {/* Error Notification */}
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${errorVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className="bg-[#D24949] text-white px-6 py-3.5 rounded shadow-2xl flex items-center space-x-4 w-max min-w-[300px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z"/>
          </svg>
          <span className="font-medium tracking-wide">{errorMsg}</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3 text-white">
          <div className="relative w-9 h-9">
            <Image src="/users.svg" alt="Users" fill sizes="36px" style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="text-xl text-gray-300 font-semibold tracking-wide">ผู้ใช้งาน</h1>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="bg-[#5c85f1] hover:bg-[#4a72d7] transition-colors text-white px-5 py-2 rounded font-medium text-sm cursor-pointer"
        >
          เพิ่มผู้ใช้งาน
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C72FF]"></div>
          <span className="ml-3 text-gray-300">กำลังโหลด...</span>
        </div>
      ) : (
        /* User List */
        <div className="bg-[#181236] border border-[#2d2252] rounded-lg">
          {/* Header Row */}
          <div className="grid grid-cols-[1.5fr_repeat(7,1fr)_0.5fr_0.5fr] items-center border-b border-[#2d2252] text-base text-gray-300 font-light bg-[#181236] rounded-t-lg">
            <div className="px-6 py-4 font-medium">ชื่อผู้ใช้งาน</div>
            {permissionColumns.map((col) => (
              <div key={col.key} className="px-4 py-4 flex justify-center items-center">
                <div className="relative w-7 h-7 group flex justify-center">
                  <Image src={col.icon} alt={col.label} fill sizes="20px" style={{ objectFit: 'contain' }} />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2.5 bg-[#2d2252] text-gray-200 text-xs px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-[#504481] translate-y-1 group-hover:translate-y-0">
                    {col.label}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2d2252] border-b border-r border-[#504481] rotate-45"></div>
                  </div>
                </div>
              </div>
            ))}
            <div className="px-4 py-4 flex justify-center items-center">
              <div className="relative group flex justify-center">
                <svg className="w-7 h-7 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 bg-[#2d2252] text-gray-200 text-xs px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-[#504481] translate-y-1 group-hover:translate-y-0">
                  ลบ
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2d2252] border-b border-r border-[#504481] rotate-45"></div>
                </div>
              </div>
            </div>
            <div className="px-4 py-4 flex justify-center items-center">
              <div className="relative group flex justify-center">
                <svg className="w-7 h-7 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 bg-[#2d2252] text-gray-200 text-xs px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-[#504481] translate-y-1 group-hover:translate-y-0">
                  แก้ไข
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2d2252] border-b border-r border-[#504481] rotate-45"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Rows */}
          {users.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">ยังไม่มีผู้ใช้งาน</div>
          ) : (
            users.map((user, index) => {
              const rowBg = index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-[#181236]';

              return (
                <div key={user.id} className={`grid grid-cols-[1.5fr_repeat(7,1fr)_0.5fr_0.5fr] items-center ${rowBg} hover:bg-white/[0.06] transition-colors border-b border-[#2d2252]/50 text-base`}>
                  <div className="px-6 py-4 text-gray-300">{user.username}</div>
                  {permissionColumns.map((col) => (
                    <div key={col.key} className="px-4 py-4 flex justify-center items-center">
                      <CheckIcon active={col.alwaysOn ? true : !!user[col.key]} />
                    </div>
                  ))}
                  <div className="px-4 py-4 flex justify-center items-center">
                    <div className="relative group flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(user)}
                        disabled={user.is_admin}
                        className={user.is_admin ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:text-red-400 transition-colors cursor-pointer'}
                      >
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      {!user.is_admin && (
                        <div className="absolute bottom-full mb-2 bg-[#2d2252] text-gray-200 text-xs px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-[#504481] translate-y-1 group-hover:translate-y-0">
                          ลบ
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2d2252] border-b border-r border-[#504481] rotate-45"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-4 flex justify-center items-center">
                    <div className="relative group flex justify-center">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="text-gray-300 hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <div className="absolute bottom-full mb-2 bg-[#2d2252] text-gray-200 text-xs px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-[#504481] translate-y-1 group-hover:translate-y-0">
                        แก้ไข
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2d2252] border-b border-r border-[#504481] rotate-45"></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal */}
      <UserModal
        isOpen={modalMode !== null}
        title={modalMode === 'add' ? 'เพิ่มผู้ใช้งาน' : 'แก้ไขผู้ใช้งาน'}
        formData={formData}
        setFormData={setFormData}
        onClose={closeModal}
        onSave={handleSave}
        isAdminEdit={modalMode === 'edit' && editingUser?.is_admin}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] backdrop-grayscale transition-all duration-300">
          <div className="bg-[#12102f] border border-[#504481] rounded-xl w-full max-w-[380px] shadow-2xl p-8 py-10">

            <h2 className="text-xl font-semibold text-white text-center mb-2 tracking-wide">
              ยืนยันการลบ
            </h2>
            <p className="text-gray-300 text-center text-base mb-8">
              ต้องการลบผู้ใช้ <span className="text-white font-medium">{deleteTarget.username}</span> ใช่หรือไม่?<br />การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={confirmDelete}
                className="w-32 h-10 bg-[#D24949] hover:bg-red-500 transition-colors rounded text-white font-light cursor-pointer"
              >
                ลบ
              </button>
              <button
                type="button"
                onClick={cancelDelete}
                className="w-32 h-10 border border-gray-500 hover:bg-white/5 transition-colors rounded text-gray-300 font-light cursor-pointer"
              >
                ยกเลิก
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
