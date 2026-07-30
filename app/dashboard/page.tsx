'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  PlusCircle, Search, Trash2, Phone, Mail, Briefcase, UserX, Eye, Sparkles, MapPin, ChevronRight, Edit2, LayoutGrid, List
} from 'lucide-react';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

export default function Dashboard() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Restore the user's preferred view mode
  useEffect(() => {
    const saved = localStorage.getItem('dashboardViewMode');
    if (saved === 'card' || saved === 'list') setViewMode(saved);
  }, []);

  const updateViewMode = (mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('dashboardViewMode', mode);
  };

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEmpToDelete, setSelectedEmpToDelete] = useState<{ id: string; name: string } | null>(null);

  // Fetch fresh user and permission details from /api/auth/me
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.user) setCurrentUser(d.user); })
        .catch(() => {});
    }
  }, []);

  // Debouncer Effect
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setSearchDebounced(searchInput);
      setPage(1);
    }, 500);

    return () => clearTimeout(delayTimer);
  }, [searchInput]);

  // Fetch 20 employees per page
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const url = `/api/employees?page=${page}&limit=20&search=${searchDebounced}&status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setEmployees(data.employees || []);
      setTotalPages(data.meta?.totalPages || 1);
      setTotalCount(data.meta?.total || 0);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load personnel directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, searchDebounced, statusFilter]);

  const hasPermission = (permission: string) => {
    if (!currentUser) return false;
    if (currentUser.role && typeof currentUser.role === 'object') {
      const roleName = currentUser.role.name || '';
      if (roleName.toLowerCase() === 'admin') return true;
      const perms = currentUser.role.permissions || [];
      return Array.isArray(perms) && perms.includes(permission);
    }
    return false;
  };

  const openDeleteModal = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedEmpToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  // Shared derived fields used by both the card and list layouts
  const getEmployeeMeta = (emp: any) => {
    const emailsList: string[] = emp.contactInfo?.emails?.length
      ? emp.contactInfo.emails
      : (emp.contactInfo?.email ? [emp.contactInfo.email] : []);
    const mobilesList: string[] = emp.contactInfo?.mobiles?.length
      ? emp.contactInfo.mobiles
      : (emp.contactInfo?.mobile ? [emp.contactInfo.mobile] : []);
    const hasResignation = emp.officeActivities?.resignations?.length > 0;
    const isActive = emp.officeInfo?.status === 'Active' && !hasResignation;

    return {
      emailsList,
      mobilesList,
      hasResignation,
      isActive,
      primaryEmail: emailsList[0],
      extraEmails: emailsList.length - 1,
      primaryMobile: mobilesList[0],
      extraMobiles: mobilesList.length - 1,
      avatarUrl: emp.documents?.find((d: any) => d.name === 'Profile Picture')?.url
        || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    };
  };

  const confirmDeleteEmployee = async () => {
    if (!selectedEmpToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/employees/${selectedEmpToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete record');
      }

      toast.success(`Personnel record for "${selectedEmpToDelete.name}" deleted successfully.`);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || 'Could not delete record');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Personnel Directory</h1>
            <span className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage personnel profiles, contracts, qualifications, and office records (20 cards per page).</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:flex-1 sm:min-w-[180px] md:w-72 md:flex-none">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, or department..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              className="flex-1 sm:flex-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-semibold"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
              <option value="">All Statuses</option>
            </select>

            {/* Card / List View Toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl p-1 shrink-0">
              <button
                onClick={() => updateViewMode('card')}
                title="Card View"
                aria-label="Card view"
                aria-pressed={viewMode === 'card'}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'card'
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => updateViewMode('list')}
                title="List View"
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* HIDE ADD BUTTON COMPLETELY IF NO PERMISSION */}
            {hasPermission('add_employee') && (
              <Link
                href="/dashboard/employees/create"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/20 transition duration-150 whitespace-nowrap flex-1 sm:flex-none"
              >
                <PlusCircle className="h-4 w-4" /> <span className="sm:inline">Add Personnel</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-28 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold animate-pulse">Loading personnel cards...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-16 text-center space-y-3 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-slate-500">
            <UserX className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No personnel records found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Try refining your search query or status filter criteria.</p>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
          /* Compact List View */
          <div className="flex flex-col gap-2">
            {employees.map((emp: any) => {
              const { emailsList, mobilesList, hasResignation, isActive, primaryEmail, extraEmails, primaryMobile, extraMobiles, avatarUrl } = getEmployeeMeta(emp);

              return (
                <Link
                  key={emp._id}
                  href={`/dashboard/employees/${emp._id}`}
                  className={`group relative flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 hover:border-blue-500/50 rounded-xl pl-5 pr-3 py-2.5 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
                    hasResignation ? 'opacity-80 bg-slate-50/50 dark:bg-slate-900/60' : ''
                  }`}
                >
                  {/* Status Accent Bar */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b ${
                    hasResignation ? 'from-rose-600 to-amber-600' : isActive ? 'from-emerald-500 to-teal-500' : 'from-amber-500 to-rose-500'
                  }`} />

                  {/* Avatar + Name + Dept */}
                  <div className="flex items-center gap-3 min-w-0 sm:w-56 shrink-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        <img src={avatarUrl} alt="profile" className="object-cover w-full h-full" />
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-800 ${
                        hasResignation ? 'bg-rose-500' : isActive ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate text-sm">
                        {emp.fullName || 'No Name Registered'}
                      </h3>
                      {hasResignation ? (
                        <span className="inline-block text-[10px] font-bold text-rose-600 dark:text-rose-400 truncate max-w-full">
                          Resigned ({emp.officeInfo?.department || 'Dept'})
                        </span>
                      ) : (
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                          {emp.officeInfo?.department || 'General'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300 min-w-0 flex-1 pl-[52px] sm:pl-0">
                    <div className="flex items-center gap-1.5 min-w-0 max-w-full sm:max-w-[220px]">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
                      {primaryEmail ? (
                        <span className="truncate" title={primaryEmail}>{primaryEmail}</span>
                      ) : (
                        <span className="italic text-slate-400 dark:text-slate-500">No Email</span>
                      )}
                      {extraEmails > 0 && (
                        <span
                          className="shrink-0 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-1.5 py-0.5 rounded-md"
                          title={`${extraEmails} more email${extraEmails > 1 ? 's' : ''}: ${emailsList.slice(1).join(', ')}`}
                        >
                          +{extraEmails}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0 max-w-full sm:max-w-[180px]">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
                      {primaryMobile ? (
                        <span className="truncate" title={primaryMobile}>{primaryMobile}</span>
                      ) : (
                        <span className="italic text-slate-400 dark:text-slate-500">No Mobile</span>
                      )}
                      {extraMobiles > 0 && (
                        <span
                          className="shrink-0 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-1.5 py-0.5 rounded-md"
                          title={`${extraMobiles} more number${extraMobiles > 1 ? 's' : ''}: ${mobilesList.slice(1).join(', ')}`}
                        >
                          +{extraMobiles}
                        </span>
                      )}
                    </div>

                    {emp.personalInfo?.bloodGroup && (
                      <span className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0">
                        {emp.personalInfo.bloodGroup}
                      </span>
                    )}
                  </div>

                  {/* Actions + Chevron */}
                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto pl-[52px] sm:pl-0">
                    {hasPermission('edit_employee') && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/dashboard/employees/${emp._id}?edit=true`);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition"
                        title="Edit Personnel Profile & Add Contacts"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}

                    {hasPermission('delete_employee') && (
                      <button
                        onClick={(e) => openDeleteModal(e, emp._id, emp.fullName || 'Employee Record')}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition"
                        title="Delete Personnel Record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>
          ) : (
          /* Unique Sleek Card Grid (20 Cards Max per Page) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5">
            {employees.map((emp: any) => {
              const { emailsList, mobilesList, hasResignation, isActive, primaryEmail, extraEmails, primaryMobile, extraMobiles, avatarUrl } = getEmployeeMeta(emp);

              return (
                <Link
                  key={emp._id}
                  href={`/dashboard/employees/${emp._id}`}
                  className={`group relative bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 hover:border-blue-500/50 rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                    hasResignation ? 'opacity-80 bg-slate-50/50 dark:bg-slate-900/60' : ''
                  }`}
                >
                  {/* Glowing Top Accent Line */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    hasResignation ? 'from-rose-600 to-amber-600' : isActive ? 'from-emerald-500 to-teal-500' : 'from-amber-500 to-rose-500'
                  }`} />

                  {/* Top Right Action Controls (Edit & Delete) — always visible on touch devices, reveal-on-hover on desktop */}
                  <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex items-center gap-1 z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100 transition-opacity">
                    {hasPermission('edit_employee') && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/dashboard/employees/${emp._id}?edit=true`);
                        }}
                        className="p-2 sm:p-1.5 text-slate-400 bg-white/80 dark:bg-slate-900/60 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition backdrop-blur-sm"
                        title="Edit Personnel Profile & Add Contacts"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}

                    {hasPermission('delete_employee') && (
                      <button
                        onClick={(e) => openDeleteModal(e, emp._id, emp.fullName || 'Employee Record')}
                        className="p-2 sm:p-1.5 text-slate-400 bg-white/80 dark:bg-slate-900/60 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition backdrop-blur-sm"
                        title="Delete Personnel Record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col items-center pt-2 text-center space-y-3">
                    {/* Avatar with Status Pulse */}
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-300">
                        <img
                          src={avatarUrl}
                          alt="profile"
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <span className={`absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-slate-800 ${
                        hasResignation ? 'bg-rose-500' : isActive ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                    </div>

                    <div className="w-full space-y-1">
                      <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate text-sm px-1">
                        {emp.fullName || 'No Name Registered'}
                      </h3>
                      {hasResignation ? (
                        <span className="inline-block text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2 py-0.5 rounded-md truncate max-w-full">
                          Resigned ({emp.officeInfo?.department || 'Dept'})
                        </span>
                      ) : (
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                          {emp.officeInfo?.department || 'General'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contact Info Footer — always exactly 2 rows so card height stays uniform regardless of how many emails/numbers an employee has */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-[11px] space-y-2">
                    {/* Primary Email + overflow count */}
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
                      {primaryEmail ? (
                        <span className="truncate" title={primaryEmail}>{primaryEmail}</span>
                      ) : (
                        <span className="truncate italic text-slate-400 dark:text-slate-500">No Email</span>
                      )}
                      {extraEmails > 0 && (
                        <span
                          className="ml-auto shrink-0 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-1.5 py-0.5 rounded-md"
                          title={`${extraEmails} more email${extraEmails > 1 ? 's' : ''}: ${emailsList.slice(1).join(', ')}`}
                        >
                          +{extraEmails}
                        </span>
                      )}
                    </div>

                    {/* Primary Mobile + overflow count + Blood Group */}
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
                      {primaryMobile ? (
                        <span className="truncate" title={primaryMobile}>{primaryMobile}</span>
                      ) : (
                        <span className="truncate italic text-slate-400 dark:text-slate-500">No Mobile</span>
                      )}
                      <div className="ml-auto flex items-center gap-1 shrink-0">
                        {extraMobiles > 0 && (
                          <span
                            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-1.5 py-0.5 rounded-md"
                            title={`${extraMobiles} more number${extraMobiles > 1 ? 's' : ''}: ${mobilesList.slice(1).join(', ')}`}
                          >
                            +{extraMobiles}
                          </span>
                        )}
                        {emp.personalInfo?.bloodGroup && (
                          <span className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                            {emp.personalInfo.bloodGroup}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* View Details Action Indicator */}
                    <div className="pt-2 flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-500">
                      <span>View Profile</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-3 rounded-2xl max-w-md mx-auto shadow-sm">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Page {page} of {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Popup */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteEmployee}
        title="Delete Personnel Record"
        description="Are you sure you want to permanently delete this employee's profile and documents?"
        itemName={selectedEmpToDelete?.name}
      />
    </div>
  );
}