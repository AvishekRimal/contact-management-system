'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import { referenceSchema } from '@/lib/validations';
import { EmployeeTabProps } from './types';

export default function ReferenceTab({ employee, hasPermission, updateEmployeeAPI, setDeleteModal }: EmployeeTabProps) {
  const [newRef, setNewRef] = useState({ name: '', designation: '', contact: '', email: '', company: '' });
  const [editingRefIdx, setEditingRefIdx] = useState<number | null>(null);
  const [editRefData, setEditRefData] = useState({ name: '', designation: '', contact: '', email: '', company: '' });
  const [editRefModalOpen, setEditRefModalOpen] = useState(false);

  const handleOpenEditRef = (idx: number, r: any) => {
    if (!hasPermission('edit_reference')) {
      toast.error('Permission Denied: Cannot edit reference.');
      return;
    }
    setEditingRefIdx(idx);
    setEditRefData({
      name: r.name || '',
      designation: r.designation || '',
      contact: r.contact || '',
      email: r.email || '',
      company: r.company || '',
    });
    setEditRefModalOpen(true);
  };

  const handleSaveEditRef = async () => {
    if (!hasPermission('edit_reference')) {
      toast.error('Permission Denied: Cannot edit reference.');
      return;
    }
    if (editingRefIdx === null) return;
    const val = referenceSchema.safeParse(editRefData);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }

    const references = [...(employee?.references || [])];
    references[editingRefIdx] = editRefData;

    await updateEmployeeAPI({ ...employee, references }, 'Reference record updated');

    setEditRefModalOpen(false);
    setEditingRefIdx(null);
  };

  const handleAddRef = async () => {
    if (!hasPermission('add_reference')) {
      toast.error('Permission Denied: Cannot add reference.');
      return;
    }
    const val = referenceSchema.safeParse(newRef);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }
    const references = [...(employee?.references || []), newRef];
    await updateEmployeeAPI({ ...employee, references }, 'Reference added');
    setNewRef({ name: '', designation: '', contact: '', email: '', company: '' });
  };

  return (
    <>
      <div className="space-y-6 text-xs">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">References</h4>

        {hasPermission('add_reference') && (
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 space-y-4">
            <h5 className="font-semibold text-slate-800 dark:text-slate-200">Add Professional Reference</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Reference Name *"
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newRef.name}
                onChange={e => setNewRef({ ...newRef, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Designation *"
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newRef.designation}
                onChange={e => setNewRef({ ...newRef, designation: e.target.value })}
              />
              <input
                type="text"
                placeholder="Contact Phone *"
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newRef.contact}
                onChange={e => setNewRef({ ...newRef, contact: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email Address"
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newRef.email}
                onChange={e => setNewRef({ ...newRef, email: e.target.value })}
              />
              <input
                type="text"
                placeholder="Company / Organization"
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newRef.company}
                onChange={e => setNewRef({ ...newRef, company: e.target.value })}
              />
            </div>
            <button onClick={handleAddRef} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-1 shrink-0 transition shadow-md">
              <Plus className="w-3.5 h-3.5" /> Append Reference
            </button>
          </div>
        )}

        <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                <th className="p-3">Name</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Company</th>
                <th className="p-3">Contact</th>
                {(hasPermission('edit_reference') || hasPermission('delete_reference')) && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {employee?.references?.length ? (
                employee.references.map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{r?.name || '-'}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{r?.designation || '-'}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{r?.company || '-'}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{r?.contact || r?.email || '-'}</td>
                    {(hasPermission('edit_reference') || hasPermission('delete_reference')) && (
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {hasPermission('edit_reference') && (
                          <button onClick={() => handleOpenEditRef(i, r)} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition" title="Edit Reference">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('delete_reference') && (
                          <button onClick={() => setDeleteModal({ isOpen: true, type: 'ref', index: i, itemName: r.name })} className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition" title="Delete Reference">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-4 text-center text-slate-400 dark:text-slate-500">No references listed.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Reference Modal */}
      {editRefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setEditRefModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Reference Record</h3>
              <button onClick={() => setEditRefModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Reference Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editRefData.name}
                  onChange={e => setEditRefData({ ...editRefData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Designation *</label>
                <input
                  type="text"
                  placeholder="e.g. Director"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editRefData.designation}
                  onChange={e => setEditRefData({ ...editRefData, designation: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Contact Phone *</label>
                <input
                  type="text"
                  placeholder="e.g. +977 9800000000"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editRefData.contact}
                  onChange={e => setEditRefData({ ...editRefData, contact: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. ref@example.com"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editRefData.email}
                  onChange={e => setEditRefData({ ...editRefData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Company / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Tech Corp"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editRefData.company}
                  onChange={e => setEditRefData({ ...editRefData, company: e.target.value })}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditRefModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditRef}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md cursor-pointer"
                >
                  Save Reference Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
