'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit2, ExternalLink, Plus, Trash2, Upload, X } from 'lucide-react';
import { disciplinarySchema } from '@/lib/validations';
import { uploadFile } from '@/lib/uploadFile';
import { EmployeeTabProps } from './types';

export default function DisciplinaryCaseTab({ employee, hasPermission, updateEmployeeAPI, setPdfPreviewUrl, setDeleteModal }: EmployeeTabProps) {
  const [newDisc, setNewDisc] = useState({ date: '', issue: '', actionTaken: '', severity: 'Low', url: '' });
  const [editingDiscIdx, setEditingDiscIdx] = useState<number | null>(null);
  const [editDiscData, setEditDiscData] = useState({ date: '', issue: '', actionTaken: '', severity: 'Low', url: '' });
  const [editDiscModalOpen, setEditDiscModalOpen] = useState(false);
  const [editDiscUploading, setEditDiscUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (isEdit) setEditDiscUploading(true);
    try {
      const data = await uploadFile(file);
      if (isEdit) setEditDiscData(prev => ({ ...prev, url: data.url }));
      else setNewDisc(prev => ({ ...prev, url: data.url }));
      toast.success('Disciplinary document attached');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'File upload failed');
    } finally {
      if (isEdit) setEditDiscUploading(false);
    }
  };

  const handleOpenEditDisc = (idx: number, d: any) => {
    if (!hasPermission('edit_disciplinary')) {
      toast.error('Permission Denied: Cannot edit disciplinary case.');
      return;
    }
    setEditingDiscIdx(idx);
    setEditDiscData({
      date: d.date || '',
      issue: d.issue || '',
      actionTaken: d.actionTaken || '',
      severity: d.severity || 'Low',
      url: d.url || '',
    });
    setEditDiscModalOpen(true);
  };

  const handleSaveEditDisc = async () => {
    if (!hasPermission('edit_disciplinary')) {
      toast.error('Permission Denied: Cannot edit disciplinary case.');
      return;
    }
    if (editingDiscIdx === null) return;
    const val = disciplinarySchema.safeParse(editDiscData);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }

    const disciplinaryCases = [...(employee?.officeActivities?.disciplinaryCases || [])];
    disciplinaryCases[editingDiscIdx] = editDiscData;

    await updateEmployeeAPI({
      ...employee,
      officeActivities: { ...(employee?.officeActivities || {}), disciplinaryCases }
    }, 'Disciplinary case updated');

    setEditDiscModalOpen(false);
    setEditingDiscIdx(null);
  };

  const handleAddDisc = async () => {
    if (!hasPermission('add_disciplinary')) {
      toast.error('Permission Denied: Cannot record disciplinary case.');
      return;
    }
    const val = disciplinarySchema.safeParse(newDisc);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }
    const disciplinaryCases = [...(employee?.officeActivities?.disciplinaryCases || []), newDisc];
    await updateEmployeeAPI({
      ...employee,
      officeActivities: { ...(employee?.officeActivities || {}), disciplinaryCases }
    }, 'Disciplinary case recorded');
    setNewDisc({ date: '', issue: '', actionTaken: '', severity: 'Low', url: '' });
  };

  return (
    <>
      <div className="space-y-6 text-xs">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Disciplinary Cases</h4>

        {hasPermission('add_disciplinary') && (
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 space-y-4">
            <h5 className="font-semibold text-slate-800 dark:text-slate-200">Record Disciplinary Case</h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Date *</label>
                <input
                  type="date"
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={newDisc.date}
                  onChange={e => setNewDisc({ ...newDisc, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Issue / Incident *</label>
                <input
                  type="text"
                  placeholder="e.g. Unauthorized absence"
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={newDisc.issue}
                  onChange={e => setNewDisc({ ...newDisc, issue: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Action Taken *</label>
                <input
                  type="text"
                  placeholder="e.g. Warning letter issued"
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={newDisc.actionTaken}
                  onChange={e => setNewDisc({ ...newDisc, actionTaken: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Attachment</label>
                <input
                  type="file"
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1.5 w-full text-xs text-slate-700 dark:text-slate-300 rounded-xl"
                  onChange={e => handleFileUpload(e, false)}
                />
              </div>
            </div>
            <button onClick={handleAddDisc} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-1 shrink-0 transition shadow-md">
              <Plus className="w-3.5 h-3.5" /> Record Disciplinary Case
            </button>
          </div>
        )}

        <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                <th className="p-3">Date</th>
                <th className="p-3">Case / Issue</th>
                <th className="p-3">Action Taken</th>
                <th className="p-3">Attachment</th>
                {(hasPermission('edit_disciplinary') || hasPermission('delete_disciplinary')) && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {employee?.officeActivities?.disciplinaryCases?.length ? (
                employee.officeActivities.disciplinaryCases.map((d: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{d?.date || '-'}</td>
                    <td className="p-3 text-slate-900 dark:text-white font-medium">{d?.issue || '-'}</td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">{d?.actionTaken || '-'}</td>
                    <td className="p-3">
                      {d?.url ? (
                        <button onClick={() => setPdfPreviewUrl(d.url)} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
                          View Notice <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : <span className="text-slate-400 dark:text-slate-500">No File</span>}
                    </td>
                    {(hasPermission('edit_disciplinary') || hasPermission('delete_disciplinary')) && (
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {hasPermission('edit_disciplinary') && (
                          <button onClick={() => handleOpenEditDisc(idx, d)} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition" title="Edit Disciplinary Case">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('delete_disciplinary') && (
                          <button onClick={() => setDeleteModal({ isOpen: true, type: 'disc', index: idx, itemName: d.issue })} className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition" title="Delete Disciplinary Case">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-4 text-center text-slate-400 dark:text-slate-500">No recorded disciplinary occurrences.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Disciplinary Case Modal */}
      {editDiscModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setEditDiscModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Disciplinary Case</h3>
              <button onClick={() => setEditDiscModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Occurrence Date *</label>
                <input
                  type="date"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editDiscData.date}
                  onChange={e => setEditDiscData({ ...editDiscData, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Issue / Incident *</label>
                <input
                  type="text"
                  placeholder="e.g. Policy violation"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editDiscData.issue}
                  onChange={e => setEditDiscData({ ...editDiscData, issue: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Action Taken *</label>
                <input
                  type="text"
                  placeholder="e.g. Formal Warning"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editDiscData.actionTaken}
                  onChange={e => setEditDiscData({ ...editDiscData, actionTaken: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Attachment Notice (PDF / Image)</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 w-full">
                    <Upload className="w-3.5 h-3.5" />
                    {editDiscUploading ? 'Uploading...' : 'Choose File'}
                    <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => handleFileUpload(e, true)} disabled={editDiscUploading} />
                  </label>
                </div>
                {editDiscData.url && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Notice document attached</p>}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditDiscModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditDisc}
                  disabled={editDiscUploading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
                >
                  Save Disciplinary Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
