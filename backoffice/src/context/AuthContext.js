'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const res = await fetch('/api/backoffice/session', {
          cache: 'no-store',
          credentials: 'include',
        });
        const data = await res.json().catch(() => ({}));

        if (!cancelled && res.ok && data.user) {
          setUser(data.user);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    await fetch('/api/backoffice/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    setUser(null);
  };

  // Permission check helper
  const hasPermission = (path) => {
    if (!user) return false;
    // Dashboard is always accessible
    if (path === '/dashboard') return true;

    const permMap = {
      '/series': 'perm_series',
      '/genres': 'perm_genres',
      '/displays': 'perm_displays',
      '/sales': 'perm_sales',
      '/customers': 'perm_customers',
      '/users': 'perm_users',
    };

    const permKey = permMap[path];
    if (!permKey) return true; // Unknown path, allow
    return !!user[permKey];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
