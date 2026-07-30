'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, Edit2, Eye, Plus, Trash2, Upload, X } from 'lucide-react';
import { resignationSchema } from '@/lib/validations';
import { uploadFile } from '@/lib/uploadFile';
import { EmployeeTabProps } from './types';

export default function ResignationTab({ employee, hasPermission, updateEmployeeAPI, setPdfPreviewUrl, setDeleteModal }: EmployeeTabProps) {
  const [newResignation, setNewResignation] = useState({ date: new Date().toISOString().split('T')[0], reason: '', status: 'Completed', url: '' });
  const [resignationUploading, setResignationUploading] = useState(false);
  const [editingResignationIdx, setEditingResignationIdx] = useState<number | null>(null);
  const [editResignationData, setEditResignationData] = useState({ date: '', reason: '', status: 'Completed', url: '' });
  const [editResignationModalOpen, setEditResignationModalOpen] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setResignationUploading(true);
    try {
      const data = await uploadFile(file);
      if (isEdit) setEditResignationData(prev => ({ ...prev, url: data.url }));
      else setNewResignation(prev => ({ ...prev, url: data.url }));
      toast.success('Resignation document attached');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'File upload failed');
    } finally {
      setResignationUploading(false);
    }
  };

  const handleAddResignation = async () => {
    if (!hasPermission('add_resignation') && !hasPermission('manage_resignation')) {
      toast.error('Permission Denied: Cannot record resignation.');
      return;
    }
    if ((employee?.officeActivities?.resignations?.length || 0) >= 1) {
      toast.error('Only one resignation record can be added.');
      return;
    }
    const val = resignationSchema.safeParse(newResignation);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }

    const resignations = [...(employee?.officeActivities?.resignations || []), newResignation];
    await updateEmployeeAPI({
      ...employee,
      officeInfo: {
        ...(employee.officeInfo || {}),
        status: 'Inactive',
      },
      officeActivities: { ...(employee?.officeActivities || {}), resignations }
    }, 'Resignation record added and personnel marked as Inactive');
    setNewResignation({ date: new Date().toISOString().split('T')[0], reason: '', status: 'Completed', url: '' });
  };

  const handleOpenEditResignation = (idx: number, r: any) => {
    if (!hasPermission('edit_resignation') && !hasPermission('manage_resignation')) {
      toast.error('Permission Denied: Cannot edit resignation.');
      return;
    }
    setEditingResignationIdx(idx);
    setEditResignationData({
      date: r.date || new Date().toISOString().split('T')[0],
      reason: r.reason || '',
      status: r.status || 'Completed',
      url: r.url || '',
    });
    setEditResignationModalOpen(true);
  };

  const handleSaveEditResignation = async () => {
    if (!hasPermission('edit_resignation') && !hasPermission('manage_resignation')) {
      toast.error('Permission Denied: Cannot edit resignation.');
      return;
    }
    if (editingResignationIdx === null) return;
    const val = resignationSchema.safeParse(editResignationData);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }

    const resignations = [...(employee?.officeActivities?.resignations || [])];
    resignations[editingResignationIdx] = editResignationData;

    await updateEmployeeAPI({
      ...employee,
      officeActivities: { ...(employee?.officeActivities || {}), resignations }
    }, 'Resignation record updated');

    setEditResignationModalOpen(false);
    setEditingResignationIdx(null);
  };

  return (
    <>
      <div className="space-y-6 text-xs">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Resignation & Departure History</h4>

        {(hasPermission('add_resignation') || hasPermission('manage_resignation')) && (
          (employee?.officeActivities?.resignations?.length || 0) >= 1 ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>A resignation entry has already been recorded for this employee. Only one resignation record can be added per employee.</span>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/60 space-y-4">
            <h5 className="font-semibold text-slate-800 dark:text-slate-200">Record Resignation Entry</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Effective Date *</label>
                <input
                  type="date"
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newResignation.date}
                  onChange={e => setNewResignation({ ...newResignation, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Status</label>
                <select
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newResignation.status}
                  onChange={e => setNewResignation({ ...newResignation, status: e.target.value })}
                >
                  <option value="Completed">Completed</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Document Notice (PDF / Image)</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 w-full">
                    <Upload className="w-3.5 h-3.5" /> Attach File
                    <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => handleFileUpload(e, false)} disabled={resignationUploading} />
                  </label>
                </div>
                {newResignation.url && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Document attached</p>}
              </div>
              <div className="md:col-span-3">
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Reason / Notes *</label>
                <textarea
                  rows={2}
                  placeholder="Details regarding departure reason or resignation notice..."
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 w-full rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newResignation.reason}
                  onChange={e => setNewResignation({ ...newResignation, reason: e.target.value })}
                />
              </div>
            </div>
            <button onClick={handleAddResignation} disabled={resignationUploading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-1 shrink-0 transition shadow-md cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> {resignationUploading ? 'Uploading...' : 'Save Resignation Record'}
            </button>
          </div>
          )
        )}

        <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                <th className="p-3">Effective Date</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3">Document Notice</th>
                {(hasPermission('edit_resignation') || hasPermission('delete_resignation') || hasPermission('manage_resignation')) && (
                  <th className="p-3 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {employee?.officeActivities?.resignations?.length ? (
                employee.officeActivities.resignations.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white font-mono">{r?.date || '-'}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{r?.reason || '-'}</td>
                    <td className="p-3">
                      <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                        {r?.status || 'Completed'}
                      </span>
                    </td>
                    <td className="p-3">
                      {r?.url ? (
                        <button onClick={() => setPdfPreviewUrl(r.url)} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
                          View Document <Eye className="w-3 h-3" />
                        </button>
                      ) : <span className="text-slate-400 dark:text-slate-500">No Attachment</span>}
                    </td>
                    {(hasPermission('edit_resignation') || hasPermission('delete_resignation') || hasPermission('manage_resignation')) && (
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {(hasPermission('edit_resignation') || hasPermission('manage_resignation')) && (
                          <button onClick={() => handleOpenEditResignation(idx, r)} className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(hasPermission('delete_resignation') || hasPermission('manage_resignation')) && (
                          <button onClick={() => setDeleteModal({ isOpen: true, type: 'resignation', index: idx, itemName: `Resignation on ${r.date}` })} className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-4 text-center text-slate-400 dark:text-slate-500">No resignation records registered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Resignation Modal */}
      {editResignationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setEditResignationModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Resignation Entry</h3>
              <button onClick={() => setEditResignationModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Effective Date</label>
                <input
                  type="date"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editResignationData.date}
                  onChange={e => setEditResignationData({ ...editResignationData, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Status</label>
                <select
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editResignationData.status}
                  onChange={e => setEditResignationData({ ...editResignationData, status: e.target.value })}
                >
                  <option value="Completed">Completed</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Reason / Details</label>
                <textarea
                  rows={3}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editResignationData.reason}
                  onChange={e => setEditResignationData({ ...editResignationData, reason: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Update Document Notice (PDF / Image)</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 w-full">
                    <Upload className="w-3.5 h-3.5" />
                    {resignationUploading ? 'Uploading...' : 'Choose File'}
                    <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => handleFileUpload(e, true)} disabled={resignationUploading} />
                  </label>
                </div>
                {editResignationData.url && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Document attached</p>}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditResignationModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditResignation}
                  disabled={resignationUploading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md disabled:opacity-50"
                >
                  Save Resignation Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
