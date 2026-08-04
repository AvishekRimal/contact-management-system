'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { 
  FileText, Plus, Edit2, Trash2, X, Upload, ShieldAlert, Search, Eye, ExternalLink, Calendar, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { resignationSchema } from '@/lib/validations';
import { getCookie } from '@/lib/cookies';

export default function ResignationsManagementPage() {
  const [resignations, setResignations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Search and filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form modal state (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResignationId, setEditingResignationId] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'Completed',
    url: '',
  });

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resignationToDelete, setResignationToDelete] = useState<{ id: string; name: string } | null>(null);

  // Preview document state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchResignations = async () => {
    try {
      const token = getCookie('token');
      const res = await fetch('/api/resignations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setResignations(data || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load resignations');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = getCookie('token');
      const res = await fetch('/api/employees?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setEmployees(data.employees || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const token = getCookie('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.user) setCurrentUser(d.user); })
        .catch(() => {});
    }
    fetchResignations();
    fetchEmployees();
  }, []);

  const hasPermission = (permission: string) => {
    if (!currentUser) return false;
    if (currentUser.role && typeof currentUser.role === 'object') {
      const roleName = currentUser.role.name || '';
      if (roleName.toLowerCase() === 'admin') return true;
      const perms = currentUser.role.permissions || [];
      return Array.isArray(perms) && (perms.includes(permission) || perms.includes('manage_resignation'));
    }
    return false;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Attachment upload failed');

      setForm(prev => ({ ...prev, url: data.url }));
      toast.success('Resignation document attached!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingResignationId(null);
    setFieldErrors({});
    setForm({
      employeeId: employees[0]?._id || '',
      date: new Date().toISOString().split('T')[0],
      reason: '',
      status: 'Completed',
      url: '',
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (item: any) => {
    setEditingResignationId(item._id);
    setFieldErrors({});
    setForm({
      employeeId: item.employeeId,
      date: item.date || new Date().toISOString().split('T')[0],
      reason: item.reason || '',
      status: item.status || 'Completed',
      url: item.url || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const token = getCookie('token');

    const val = resignationSchema.safeParse(form);
    if (!val.success) {
      const errs: Record<string, string> = {};
      val.error.issues.forEach(i => { errs[i.path.join('.')] = i.message; });
      setFieldErrors(errs);
      toast.error('Please check form fields.');
      return;
    }

    try {
      if (editingResignationId) {
        if (!hasPermission('edit_resignation')) {
          toast.error('Permission Denied: Cannot edit resignation entries.');
          return;
        }

        const res = await fetch(`/api/resignations/${editingResignationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(form)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update resignation record.');

        toast.success('Resignation record updated successfully.');
      } else {
        if (!hasPermission('add_resignation')) {
          toast.error('Permission Denied: Cannot register resignation entries.');
          return;
        }

        const res = await fetch('/api/resignations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(form)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add resignation entry.');

        toast.success('Resignation record saved successfully.');
      }

      setIsModalOpen(false);
      fetchResignations();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const promptDeleteResignation = (id: string, empName: string) => {
    if (!hasPermission('delete_resignation')) {
      toast.error('Permission Denied: Cannot delete resignation entries.');
      return;
    }
    setResignationToDelete({ id, name: `Resignation for ${empName}` });
    setDeleteModalOpen(true);
  };

  const confirmDeleteResignation = async () => {
    if (!resignationToDelete) return;
    try {
      const token = getCookie('token');
      const res = await fetch(`/api/resignations/${resignationToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete resignation.');

      toast.success('Resignation record deleted permanently.');
      fetchResignations();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const filteredResignations = resignations.filter(r => {
    const matchesSearch = (r.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
                          (r.reason || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="py-24 text-center text-xs font-medium text-slate-500 dark:text-slate-400 animate-pulse">Loading resignation database...</div>;

  const canView = hasPermission('view_resignation') || hasPermission('manage_resignation');
  if (!canView) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          You do not have permission to view resignation records.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Resignations Directory</h1>
            <span className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {filteredResignations.length} Entries
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage employee resignations, notice documents, and departure approvals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search personnel or reason..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 pl-9 pr-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>

          {hasPermission('add_resignation') && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs px-4 py-2 rounded-xl font-semibold shadow-md transition"
            >
              <Plus className="h-4 w-4" /> Record Resignation
            </button>
          )}
        </div>
      </div>

      {/* Resignation Table */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
          <FileText className="h-4.5 w-4.5 text-blue-500 dark:text-blue-400" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Resignation Registry</h2>
        </div>

        <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                <th className="p-3">Personnel</th>
                <th className="p-3">Department</th>
                <th className="p-3">Resignation Date</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3">Attachment</th>
                {(hasPermission('edit_resignation') || hasPermission('delete_resignation')) && (
                  <th className="p-3 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {filteredResignations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No resignation records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredResignations.map((r: any) => (
                  <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      <div>{r.employeeName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{r.employeeEmail}</div>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{r.department || 'N/A'}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 font-mono">{r.date}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                        r.status === 'Completed' || r.status === 'Approved'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                          : r.status === 'Pending'
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                      }`}>
                        {r.status || 'Completed'}
                      </span>
                    </td>
                    <td className="p-3">
                      {r.url ? (
                        <button
                          onClick={() => setPreviewUrl(r.url)}
                          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Notice
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">No Attachment</span>
                      )}
                    </td>
                    {(hasPermission('edit_resignation') || hasPermission('delete_resignation')) && (
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {hasPermission('edit_resignation') && (
                          <button
                            onClick={() => handleEditClick(r)}
                            className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition"
                            title="Edit Resignation"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('delete_resignation') && (
                          <button
                            onClick={() => promptDeleteResignation(r._id, r.employeeName)}
                            className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                            title="Delete Resignation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Resignation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingResignationId ? 'Edit Resignation Record' : 'Register New Resignation'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Select Employee *</label>
                <select
                  disabled={!!editingResignationId}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.employeeId}
                  onChange={e => setForm({ ...form, employeeId: e.target.value })}
                >
                  <option value="">Choose personnel...</option>
                  {employees.map((e: any) => (
                    <option key={e._id} value={e._id}>
                      {e.fullName} ({e.officeInfo?.department || 'Staff'})
                    </option>
                  ))}
                </select>
                {fieldErrors['employeeId'] && <p className="text-[11px] text-red-500 mt-1">{fieldErrors['employeeId']}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Resignation Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                  {fieldErrors['date'] && <p className="text-[11px] text-red-500 mt-1">{fieldErrors['date']}</p>}
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Reason for Resignation *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter specific reasons or notes regarding departure..."
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                />
                {fieldErrors['reason'] && <p className="text-[11px] text-red-500 mt-1">{fieldErrors['reason']}</p>}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Resignation Document / Notice (PDF or Image)</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition border border-slate-300 dark:border-slate-700 flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Uploading...' : 'Upload File (PDF/Image)'}
                    <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                  {form.url && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Attached
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md disabled:opacity-50"
                >
                  {editingResignationId ? 'Save Changes' : 'Create Resignation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setPreviewUrl(null)} />
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl p-5 z-10 space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Resignation Document Preview</h3>
              <div className="flex items-center gap-3">
                <a href={previewUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" /> Open Direct Link
                </a>
                <button onClick={() => setPreviewUrl(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-auto flex justify-center bg-slate-100 dark:bg-slate-950 p-4 rounded-xl">
              {previewUrl.toLowerCase().includes('.pdf') || previewUrl.includes('raw') ? (
                <iframe src={previewUrl} className="w-full h-[450px] rounded-lg" />
              ) : (
                <img src={previewUrl} alt="Resignation Attachment" className="max-h-[450px] object-contain rounded-lg shadow-md" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteResignation}
        title="Delete Resignation Record"
        description="Are you sure you want to permanently remove this resignation record?"
        itemName={resignationToDelete?.name}
      />
    </div>
  );
}
