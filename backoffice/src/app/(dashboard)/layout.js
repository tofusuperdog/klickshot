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
      <div className="flex h-screen bg-[#171a3d] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6C72FF]"></div>
      </div>
    );
  }

  // Not logged in or no permission - show nothing while redirecting
  if (!user || !hasPermission(pathname)) {
    return (
      <div className="flex h-screen bg-[#171a3d] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6C72FF]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#171a3d] text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-10 bg-[radial-gradient(circle_at_18%_14%,rgba(108,114,255,0.22),transparent_28%),radial-gradient(circle_at_82%_4%,rgba(34,211,238,0.13),transparent_24%),linear-gradient(135deg,#171a3d_0%,#101436_48%,#16123a_100%)]">
        {children}
      </main>
    </div>
  );
}
