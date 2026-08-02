'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ChevronDown, ChevronRight, LayoutDashboard, UserCog, LogOut, Menu, X,
  ChevronLeft, PanelLeftClose, PanelLeftOpen, ShieldCheck, UserCheck, ShieldAlert,
  Sun, Moon, FileText
} from 'lucide-react';
import Image from 'next/image';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuExpanded, setUserMenuExpanded] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Initialize theme from localStorage or document
  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  // Fetch fresh user and permission details from /api/auth/me
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const savedSidebarState = localStorage.getItem('sidebar_expanded');
    if (savedSidebarState !== null) {
      setSidebarExpanded(savedSidebarState === 'true');
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        else router.push('/login');
      });
  }, [router]);

  const toggleSidebar = () => {
    const nextState = !sidebarExpanded;
    setSidebarExpanded(nextState);
    localStorage.setItem('sidebar_expanded', String(nextState));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role && typeof user.role === 'object') {
      const roleName = user.role.name || '';
      if (roleName.toLowerCase() === 'admin') return true;
      const perms = user.role.permissions || [];
      return Array.isArray(perms) && perms.includes(permission);
    }
    return false;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold space-y-3">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="animate-pulse">Authenticating system session...</p>
      </div>
    );
  }

  const canSeeUsersDirectory = hasPermission('view_users') || hasPermission('add_users') || hasPermission('edit_users') || hasPermission('delete_users');
  const canSeeRoleSecurity = hasPermission('view_roles') || hasPermission('add_roles') || hasPermission('edit_roles') || hasPermission('delete_roles');
  const showUserManagement = canSeeUsersDirectory || canSeeRoleSecurity;
  const showResignations = hasPermission('view_resignation') || hasPermission('manage_resignation');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans selection:bg-blue-500 selection:text-white transition-colors duration-200">
      
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex justify-between items-center z-40 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">
            RC
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">RMS Directory</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-500 bg-slate-100 dark:bg-slate-800 rounded-xl transition"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 h-4 text-amber-400" /> : <Moon className="h-4 h-4 text-indigo-600" />}
          </button>
          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 rounded-xl"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Desktop / Mobile Sidebar Overlay Container */}
      <aside 
        className={`fixed md:sticky top-0 left-0 h-screen bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800/80 transition-all duration-300 z-30 flex flex-col justify-between ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${sidebarExpanded ? 'md:w-64' : 'md:w-20'}`}
      >
        <div>
          {/* Sidebar Brand Header */}
          <div className="h-16 border-b border-slate-200 dark:border-slate-800/80 px-4 flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-3">
              {!sidebarExpanded && <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
              <Image src="/smlogo.ico" alt="Company Logo" width={100} height={32} className="mx-auto" />
              </span>
              }
              {sidebarExpanded && (
                <div className="min-w-0 transition-opacity duration-200">
                  {/* <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight block truncate">Personnel Hub</span>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 block tracking-widest uppercase">Admin System</span> */}
                  <Image src="/logo.svg" alt="Company Logo" width={140} height={80} className="mx-auto" />
                </div>
              )}
            </div>

            {/* Desktop Expand / Collapse Button */}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
              title={sidebarExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              {sidebarExpanded ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Menu Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                pathname === '/dashboard' 
                  ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
              title="Personnel Cards"
            >
              <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />
              {(sidebarExpanded || mobileOpen) && <span className="truncate">Personnel Directory</span>}
            </Link>

            {showUserManagement && (
              <div className="space-y-1 pt-1">
                <button
                  onClick={() => setUserMenuExpanded(!userMenuExpanded)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    pathname.startsWith('/dashboard/admin') 
                      ? 'text-blue-600 dark:text-blue-400 bg-slate-100 dark:bg-slate-800/40' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                  title="User Management"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserCog className="h-4.5 w-4.5 shrink-0" />
                    {(sidebarExpanded || mobileOpen) && <span className="truncate">User Access</span>}
                  </div>
                  {(sidebarExpanded || mobileOpen) && (
                    userMenuExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  )}
                </button>

                {userMenuExpanded && (sidebarExpanded || mobileOpen) && (
                  <div className="pl-9 space-y-1">
                    {canSeeUsersDirectory && (
                      <Link
                        href="/dashboard/admin/users"
                        onClick={() => setMobileOpen(false)}
                        className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          pathname === '/dashboard/admin/users' 
                            ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-500/10' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        Users Directory
                      </Link>
                    )}
                    {canSeeRoleSecurity && (
                      <Link
                        href="/dashboard/admin/roles"
                        onClick={() => setMobileOpen(false)}
                        className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          pathname === '/dashboard/admin/roles' 
                            ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-500/10' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        Role Security Config
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* User Account Panel & Theme Toggle Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800/80 p-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {user.image ? (
              <img src={user.image} alt="avatar" className="w-8 h-8 rounded-xl object-cover shrink-0 border border-slate-300 dark:border-slate-700" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                {user.fullName ? user.fullName[0] : 'U'}
              </div>
            )}
            {(sidebarExpanded || mobileOpen) && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.fullName}</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium truncate capitalize">
                  {typeof user.role === 'object' ? user.role?.name : 'User'}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
            </button>
            <button 
              onClick={handleLogout} 
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}