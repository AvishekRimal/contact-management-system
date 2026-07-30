'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit2, ExternalLink, Plus, Trash2, Upload, X } from 'lucide-react';
import { qualificationSchema } from '@/lib/validations';
import { uploadFile } from '@/lib/uploadFile';
import { EmployeeTabProps } from './types';

export default function QualificationsTab({ employee, hasPermission, updateEmployeeAPI, setPdfPreviewUrl, setDeleteModal }: EmployeeTabProps) {
  const [newQual, setNewQual] = useState({ level: '', institute: '', year: '', url: '' });
  const [qualUploading, setQualUploading] = useState(false);
  const [editingQualIdx, setEditingQualIdx] = useState<number | null>(null);
  const [editQualData, setEditQualData] = useState({ level: '', institute: '', year: '', url: '' });
  const [editQualModalOpen, setEditQualModalOpen] = useState(false);
  const [editQualUploading, setEditQualUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (isEdit) setEditQualUploading(true); else setQualUploading(true);
    try {
      const data = await uploadFile(file);
      if (isEdit) setEditQualData(prev => ({ ...prev, url: data.url }));
      else setNewQual(prev => ({ ...prev, url: data.url }));
      toast.success('Qualification document attached');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'File upload failed');
    } finally {
      if (isEdit) setEditQualUploading(false); else setQualUploading(false);
    }
  };

  const handleOpenEditQual = (idx: number, q: any) => {
    if (!hasPermission('edit_qualification')) {
      toast.error('Permission Denied: Cannot edit qualification.');
      return;
    }
    setEditingQualIdx(idx);
    setEditQualData({
      level: q.level || '',
      institute: q.institute || '',
      year: q.year || '',
      url: q.url || '',
    });
    setEditQualModalOpen(true);
  };

  const handleSaveEditQual = async () => {
    if (!hasPermission('edit_qualification')) {
      toast.error('Permission Denied: Cannot edit qualification.');
      return;
    }
    if (editingQualIdx === null) return;
    const val = qualificationSchema.safeParse(editQualData);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }

    const qualifications = [...(employee?.qualifications || [])];
    qualifications[editingQualIdx] = editQualData;

    await updateEmployeeAPI({ ...employee, qualifications }, 'Qualification record updated');

    setEditQualModalOpen(false);
    setEditingQualIdx(null);
  };

  const handleAddQual = async () => {
    if (!hasPermission('add_qualification')) {
      toast.error('Permission Denied: Cannot add qualification.');
      return;
    }
    const val = qualificationSchema.safeParse(newQual);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }
    const qualifications = [...(employee?.qualifications || []), newQual];
    await updateEmployeeAPI({ ...employee, qualifications }, 'Qualification added');
    setNewQual({ level: '', institute: '', year: '', url: '' });
  };

  return (
    <>
      <div className="space-y-6 text-xs">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Academic Qualifications</h4>

        {hasPermission('add_qualification') && (
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 space-y-4">
            <h5 className="font-semibold text-slate-800 dark:text-slate-200">Add Academic Credential</h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Degree Level</label>
                <input
                  type="text"
                  placeholder="e.g. Masters"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={newQual.level}
                  onChange={e => setNewQual({ ...newQual, level: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Institute</label>
                <input
                  type="text"
                  placeholder="e.g. TU University"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={newQual.institute}
                  onChange={e => setNewQual({ ...newQual, institute: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Year</label>
                <input
                  type="text"
                  placeholder="e.g. 2024"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={newQual.year}
                  onChange={e => setNewQual({ ...newQual, year: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Certificate</label>
                <input
                  type="file"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-300"
                  onChange={e => handleFileUpload(e, false)}
                  disabled={qualUploading}
                />
              </div>
            </div>
            <button
              onClick={handleAddQual}
              disabled={qualUploading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-1 shrink-0 transition shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> {qualUploading ? 'Uploading...' : 'Append Qualification'}
            </button>
          </div>
        )}

        <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                <th className="p-3">Level</th>
                <th className="p-3">Institute</th>
                <th className="p-3">Year</th>
                <th className="p-3">Attachment</th>
                {(hasPermission('edit_qualification') || hasPermission('delete_qualification')) && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {employee?.qualifications?.length ? (
                employee.qualifications.map((q: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{q?.level}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{q?.institute}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{q?.year}</td>
                    <td className="p-3">
                      {q?.url ? (
                        <button onClick={() => setPdfPreviewUrl(q.url)} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-medium">
                          View Cert <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : <span className="text-slate-400 dark:text-slate-500">No Attachment</span>}
                    </td>
                    {(hasPermission('edit_qualification') || hasPermission('delete_qualification')) && (
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {hasPermission('edit_qualification') && (
                          <button onClick={() => handleOpenEditQual(i, q)} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition" title="Edit Qualification">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('delete_qualification') && (
                          <button onClick={() => setDeleteModal({ isOpen: true, type: 'qual', index: i, itemName: q.level })} className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition" title="Delete Qualification">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-4 text-center text-slate-400 dark:text-slate-500">No academic qualifications registered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Qualification Modal */}
      {editQualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setEditQualModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Qualification Record</h3>
              <button onClick={() => setEditQualModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Degree Level *</label>
                <input
                  type="text"
                  placeholder="e.g. Masters"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editQualData.level}
                  onChange={e => setEditQualData({ ...editQualData, level: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Institute / University *</label>
                <input
                  type="text"
                  placeholder="e.g. TU University"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editQualData.institute}
                  onChange={e => setEditQualData({ ...editQualData, institute: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Graduation Year *</label>
                <input
                  type="text"
                  placeholder="e.g. 2024"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editQualData.year}
                  onChange={e => setEditQualData({ ...editQualData, year: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Certificate Attachment (PDF / Image)</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 w-full">
                    <Upload className="w-3.5 h-3.5" />
                    {editQualUploading ? 'Uploading...' : 'Choose File'}
                    <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => handleFileUpload(e, true)} disabled={editQualUploading} />
                  </label>
                </div>
                {editQualData.url && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Certificate attached</p>}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditQualModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditQual}
                  disabled={editQualUploading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md disabled:opacity-50"
                >
                  Save Qualification Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
