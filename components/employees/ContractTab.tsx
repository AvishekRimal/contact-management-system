'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit2, Eye, Plus, Trash2, Upload, X } from 'lucide-react';
import { contractSchema } from '@/lib/validations';
import { uploadFile } from '@/lib/uploadFile';
import { EmployeeTabProps } from './types';

export default function ContractTab({ employee, hasPermission, updateEmployeeAPI, setPdfPreviewUrl, setDeleteModal }: EmployeeTabProps) {
  const [newContract, setNewContract] = useState({ title: '', startDate: '', endDate: '', url: '' });
  const [contractUploading, setContractUploading] = useState(false);
  const [editingContractIdx, setEditingContractIdx] = useState<number | null>(null);
  const [editContractData, setEditContractData] = useState({ title: '', startDate: '', endDate: '', url: '' });
  const [editContractModalOpen, setEditContractModalOpen] = useState(false);
  const [editContractUploading, setEditContractUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (isEdit) setEditContractUploading(true); else setContractUploading(true);
    try {
      const data = await uploadFile(file);
      if (isEdit) setEditContractData(prev => ({ ...prev, url: data.url }));
      else setNewContract(prev => ({ ...prev, url: data.url }));
      toast.success('Contract document attached');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'File upload failed');
    } finally {
      if (isEdit) setEditContractUploading(false); else setContractUploading(false);
    }
  };

  const handleOpenEditContract = (idx: number, c: any) => {
    if (!hasPermission('edit_contracts')) {
      toast.error('Permission Denied: Cannot edit contract.');
      return;
    }
    setEditingContractIdx(idx);
    setEditContractData({
      title: c.title || '',
      startDate: c.startDate || '',
      endDate: c.endDate || '',
      url: c.url || '',
    });
    setEditContractModalOpen(true);
  };

  const handleSaveEditContract = async () => {
    if (!hasPermission('edit_contracts')) {
      toast.error('Permission Denied: Cannot edit contract.');
      return;
    }
    if (editingContractIdx === null) return;
    const val = contractSchema.safeParse(editContractData);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }

    const contracts = [...(employee?.officeActivities?.contracts || [])];
    contracts[editingContractIdx] = editContractData;

    await updateEmployeeAPI({
      ...employee,
      officeActivities: { ...(employee?.officeActivities || {}), contracts }
    }, 'Contract record updated');

    setEditContractModalOpen(false);
    setEditingContractIdx(null);
  };

  const handleAddContract = async () => {
    if (!hasPermission('add_contracts')) {
      toast.error('Permission Denied: Cannot add contract.');
      return;
    }
    const val = contractSchema.safeParse(newContract);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }
    const contracts = [...(employee?.officeActivities?.contracts || []), newContract];
    await updateEmployeeAPI({
      ...employee,
      officeActivities: { ...(employee?.officeActivities || {}), contracts }
    }, 'Contract recorded');
    setNewContract({ title: '', startDate: '', endDate: '', url: '' });
  };

  return (
    <>
      <div className="space-y-6 text-xs">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Employment Contracts</h4>

        {hasPermission('add_contracts') && (
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/60 space-y-4">
            <h5 className="font-semibold text-slate-800 dark:text-slate-200">Create New Contract Record</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Contract Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Full-time Employment Contract"
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full text-xs rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newContract.title}
                  onChange={e => setNewContract({ ...newContract, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Contract Document (PDF / Image)</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 w-full">
                    <Upload className="w-3.5 h-3.5" />
                    {contractUploading ? 'Uploading...' : 'Choose File'}
                    <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => handleFileUpload(e, false)} disabled={contractUploading} />
                  </label>
                  {newContract.url && <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">Attached</span>}
                </div>
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">Start Date *</label>
                <input
                  type="date"
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full text-xs rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newContract.startDate}
                  onChange={e => setNewContract({ ...newContract, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">End Date (Optional)</label>
                <input
                  type="date"
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full text-xs rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newContract.endDate}
                  onChange={e => setNewContract({ ...newContract, endDate: e.target.value })}
                />
              </div>
            </div>
            <button onClick={handleAddContract} disabled={contractUploading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-md cursor-pointer">
              {contractUploading ? 'Uploading...' : 'Record Contract'}
            </button>
          </div>
        )}

        <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                <th className="p-3">Title</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">End Date</th>
                <th className="p-3">Attachment</th>
                {(hasPermission('edit_contracts') || hasPermission('delete_contracts')) && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {employee?.officeActivities?.contracts?.length ? (
                employee.officeActivities.contracts.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{c?.title || '-'}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{c?.startDate || '-'}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{c?.endDate || 'Ongoing'}</td>
                    <td className="p-3">
                      {c?.url ? (
                        <button onClick={() => setPdfPreviewUrl(c.url)} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold">
                          <Eye className="w-3.5 h-3.5" /> View Contract
                        </button>
                      ) : <span className="text-slate-400 dark:text-slate-500">No Attachment</span>}
                    </td>
                    {(hasPermission('edit_contracts') || hasPermission('delete_contracts')) && (
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {hasPermission('edit_contracts') && (
                          <button onClick={() => handleOpenEditContract(idx, c)} className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition" title="Edit Contract">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('delete_contracts') && (
                          <button onClick={() => setDeleteModal({ isOpen: true, type: 'contract', index: idx, itemName: c.title })} className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition" title="Delete Contract">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-4 text-center text-slate-400 dark:text-slate-500">No active contracts recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Contract Modal */}
      {editContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setEditContractModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Contract Record</h3>
              <button onClick={() => setEditContractModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Contract Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Full-time Employment Contract"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editContractData.title}
                  onChange={e => setEditContractData({ ...editContractData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Start Date *</label>
                <input
                  type="date"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editContractData.startDate}
                  onChange={e => setEditContractData({ ...editContractData, startDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">End Date (Optional)</label>
                <input
                  type="date"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editContractData.endDate}
                  onChange={e => setEditContractData({ ...editContractData, endDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Contract Document (PDF / Image)</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 w-full">
                    <Upload className="w-3.5 h-3.5" />
                    {editContractUploading ? 'Uploading...' : 'Choose File'}
                    <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => handleFileUpload(e, true)} disabled={editContractUploading} />
                  </label>
                </div>
                {editContractData.url && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Contract attached</p>}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditContractModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditContract}
                  disabled={editContractUploading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
                >
                  Save Contract Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
