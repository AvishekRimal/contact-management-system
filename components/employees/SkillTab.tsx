'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import { skillSchema } from '@/lib/validations';
import { EmployeeTabProps } from './types';

export default function SkillTab({ employee, hasPermission, updateEmployeeAPI, setDeleteModal }: EmployeeTabProps) {
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: '' });
  const [editingSkillIdx, setEditingSkillIdx] = useState<number | null>(null);
  const [editSkillData, setEditSkillData] = useState({ name: '', proficiency: '' });
  const [editSkillModalOpen, setEditSkillModalOpen] = useState(false);

  const handleOpenEditSkill = (idx: number, s: any) => {
    if (!hasPermission('edit_skill')) {
      toast.error('Permission Denied: Cannot edit skill.');
      return;
    }
    setEditingSkillIdx(idx);
    setEditSkillData({
      name: s.name || '',
      proficiency: s.proficiency || '',
    });
    setEditSkillModalOpen(true);
  };

  const handleSaveEditSkill = async () => {
    if (!hasPermission('edit_skill')) {
      toast.error('Permission Denied: Cannot edit skill.');
      return;
    }
    if (editingSkillIdx === null) return;
    const val = skillSchema.safeParse(editSkillData);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }

    const skills = [...(employee?.skills || [])];
    skills[editingSkillIdx] = editSkillData;

    await updateEmployeeAPI({ ...employee, skills }, 'Skill specification updated');

    setEditSkillModalOpen(false);
    setEditingSkillIdx(null);
  };

  const handleAddSkill = async () => {
    if (!hasPermission('add_skill')) {
      toast.error('Permission Denied: Cannot add skill.');
      return;
    }
    const val = skillSchema.safeParse(newSkill);
    if (!val.success) { toast.error(val.error.issues[0].message); return; }
    const skills = [...(employee?.skills || []), newSkill];
    await updateEmployeeAPI({ ...employee, skills }, 'Skill added');
    setNewSkill({ name: '', proficiency: '' });
  };

  return (
    <>
      <div className="space-y-6 text-xs">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Professional Skills</h4>

        {hasPermission('add_skill') && (
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 space-y-4">
            <h5 className="font-semibold text-slate-800 dark:text-slate-200">Add Skill Specification</h5>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Skill name (e.g. Node.js)"
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newSkill.name}
                onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Proficiency (e.g. Expert)"
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 w-full rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newSkill.proficiency}
                onChange={e => setNewSkill({ ...newSkill, proficiency: e.target.value })}
              />
            </div>
            <button onClick={handleAddSkill} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-1 shrink-0 transition shadow-md">
              <Plus className="w-3.5 h-3.5" /> Append Skill
            </button>
          </div>
        )}

        <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                <th className="p-3">Skill Name</th>
                <th className="p-3">Proficiency</th>
                {(hasPermission('edit_skill') || hasPermission('delete_skill')) && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {employee?.skills?.length ? (
                employee.skills.map((s: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{s?.name}</td>
                    <td className="p-3">
                      <span className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        {s?.proficiency}
                      </span>
                    </td>
                    {(hasPermission('edit_skill') || hasPermission('delete_skill')) && (
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {hasPermission('edit_skill') && (
                          <button onClick={() => handleOpenEditSkill(idx, s)} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition" title="Edit Skill">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('delete_skill') && (
                          <button onClick={() => setDeleteModal({ isOpen: true, type: 'skill', index: idx, itemName: s.name })} className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition" title="Delete Skill">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={3} className="p-4 text-center text-slate-400 dark:text-slate-500">No skills registered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Skill Modal */}
      {editSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setEditSkillModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Skill Specification</h3>
              <button onClick={() => setEditSkillModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Skill Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Node.js"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editSkillData.name}
                  onChange={e => setEditSkillData({ ...editSkillData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Proficiency Level *</label>
                <input
                  type="text"
                  placeholder="e.g. Expert"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editSkillData.proficiency}
                  onChange={e => setEditSkillData({ ...editSkillData, proficiency: e.target.value })}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditSkillModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditSkill}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md cursor-pointer"
                >
                  Save Skill Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
