'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit2, ExternalLink, Plus, Trash2, Upload, X } from 'lucide-react';
import { experienceSchema } from '@/lib/validations';
import { uploadFile } from '@/lib/uploadFile';
import { EmployeeTabProps } from './types';

export default function ExperienceTab({ employee, hasPermission, updateEmployeeAPI, setPdfPreviewUrl, setDeleteModal }: EmployeeTabProps) {
  const [newExp, setNewExp] = useState({ company: '', role: '', duration: '', url: '' });
  const [expUploading, setExpUploading] = useState(false);
  const [editingExpIdx, setEditingExpIdx] = useState<number | null>(null);
  const [editExpData, setEditExpData] = useState({ company: '', role: '', duration: '', url: '' });
  const [editExpModalOpen, setEditExpModalOpen] = useState(false);
  const [editExpUploading, setEditExpUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (isEdit) setEditExpUploading(true); else setExpUploading(true);
    try {
      const data = await uploadFile(file);
      if (isEdit) setEditExpData(prev => ({ ...prev, url: data.url }));
      else setNewExp(prev => ({ ...prev, url: data.url }));
      toast.success('Experience document attached');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'File upload failed');
    } finally {
      if (isEdit) setEditExpUploading(false); else setExpUploading(false);
    }
  };

  const handleOpenEditExp = (idx: number, ex: any) => {
    if (!hasPermission('edit_experience')) {
      toast.error('Permission Denied: Cannot edit experience.');
      return;
    }
    setEditingExpIdx(idx);
    setEditExpData({
      company: ex.company || '',
      role: ex.role || '',
      duration: ex.duration || '',
      url: ex.url || '',
    });
    setEditExpModalOpen(true);
  };

  const handleSaveEditExp = async () => {
    if (!hasPermission('edit_experience')) {
      toast.error('Permission Denied: Cannot edit experience.');
      return;
    }
    if (editingExpIdx === null) return;
    const val = experienceSchema.safeParse(editExpData);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }

    const experience = [...(employee?.experience || [])];
    experience[editingExpIdx] = editExpData;

    await updateEmployeeAPI({ ...employee, experience }, 'Experience record updated');

    setEditExpModalOpen(false);
    setEditingExpIdx(null);
  };

  const handleAddExp = async () => {
    if (!hasPermission('add_experience')) {
      toast.error('Permission Denied: Cannot add experience.');
      return;
    }
    const val = experienceSchema.safeParse(newExp);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }
    const experience = [...(employee?.experience || []), newExp];
    await updateEmployeeAPI({ ...employee, experience }, 'Experience added');
    setNewExp({ company: '', role: '', duration: '', url: '' });
  };

  return (
    <>
      <div className="space-y-6 text-xs">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Job Experience</h4>

        {hasPermission('add_experience') && (
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 space-y-4">
            <h5 className="font-semibold text-slate-800 dark:text-slate-200">Add Experience Record</h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Company</label>
                <input
                  type="text"
                  placeholder="Company Name"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={newExp.company}
                  onChange={e => setNewExp({ ...newExp, company: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Role</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Lead"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={newExp.role}
                  onChange={e => setNewExp({ ...newExp, role: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 2 Years"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={newExp.duration}
                  onChange={e => setNewExp({ ...newExp, duration: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Letter</label>
                <input
                  type="file"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-300"
                  onChange={e => handleFileUpload(e, false)}
                  disabled={expUploading}
                />
              </div>
            </div>
            <button onClick={handleAddExp} disabled={expUploading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-1 shrink-0 transition shadow-md cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> {expUploading ? 'Uploading...' : 'Append Experience'}
            </button>
          </div>
        )}

        <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                <th className="p-3">Company</th>
                <th className="p-3">Role</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Attachment</th>
                {(hasPermission('edit_experience') || hasPermission('delete_experience')) && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {employee?.experience?.length ? (
                employee.experience.map((ex: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{ex?.company}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{ex?.role}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{ex?.duration}</td>
                    <td className="p-3">
                      {ex?.url ? (
                        <button onClick={() => setPdfPreviewUrl(ex.url)} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-medium">
                          View Doc <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : <span className="text-slate-400 dark:text-slate-500">No Attachment</span>}
                    </td>
                    {(hasPermission('edit_experience') || hasPermission('delete_experience')) && (
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {hasPermission('edit_experience') && (
                          <button onClick={() => handleOpenEditExp(idx, ex)} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition" title="Edit Experience">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('delete_experience') && (
                          <button onClick={() => setDeleteModal({ isOpen: true, type: 'exp', index: idx, itemName: ex.company })} className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition" title="Delete Experience">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-4 text-center text-slate-400 dark:text-slate-500">No experience records registered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Experience Modal */}
      {editExpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setEditExpModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Experience Record</h3>
              <button onClick={() => setEditExpModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Company Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editExpData.company}
                  onChange={e => setEditExpData({ ...editExpData, company: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Role / Designation *</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Lead"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editExpData.role}
                  onChange={e => setEditExpData({ ...editExpData, role: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Duration *</label>
                <input
                  type="text"
                  placeholder="e.g. 2 Years"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editExpData.duration}
                  onChange={e => setEditExpData({ ...editExpData, duration: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Experience Letter (PDF / Image)</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 w-full">
                    <Upload className="w-3.5 h-3.5" />
                    {editExpUploading ? 'Uploading...' : 'Choose File'}
                    <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => handleFileUpload(e, true)} disabled={editExpUploading} />
                  </label>
                </div>
                {editExpData.url && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Attachment attached</p>}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditExpModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditExp}
                  disabled={editExpUploading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
                >
                  Save Experience Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
