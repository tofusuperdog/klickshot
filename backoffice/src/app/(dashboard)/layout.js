'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }) {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // Not logged in → redirect to login
    if (!user) {
      router.replace('/');
      return;
    }

    // Logged in but no permission for this page → redirect to dashboard
    if (!hasPermission(pathname)) {
      router.replace('/dashboard');
    }
  }, [user, loading, pathname, router, hasPermission]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex h-screen bg-[#110d29] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6C72FF]"></div>
      </div>
    );
  }

  // Not logged in or no permission - show nothing while redirecting
  if (!user || !hasPermission(pathname)) {
    return (
      <div className="flex h-screen bg-[#110d29] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6C72FF]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#110d29] text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-10">
        {children}
      </main>
    </div>
  );
}
