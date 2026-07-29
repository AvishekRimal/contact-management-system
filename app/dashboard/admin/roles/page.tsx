'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ShieldAlert, ShieldCheck, Edit2, Trash2, X } from 'lucide-react';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { roleSchema } from '@/lib/validations';

export default function RolesManagementPage() {
  const [roles, setRoles] = useState([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form states (handles both Create and Edit modes)
  const [form, setForm] = useState({ name: '', permissions: [] as string[] });
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<{ id: string; name: string } | null>(null);

  // Complete list of granular permission keys
  const availablePermissions = [
    'add_employee',
    'edit_employee',
    'delete_employee',
    'view_qualification',
    'add_qualification',
    'edit_qualification',
    'delete_qualification',
    'view_skill',
    'add_skill',
    'edit_skill',
    'delete_skill',
    'view_experience',
    'add_experience',
    'edit_experience',
    'delete_experience',
    'view_reference',
    'add_reference',
    'edit_reference',
    'delete_reference',
    'view_documents',
    'add_documents',
    'delete_documents',
    'view_contracts',
    'add_contracts',
    'edit_contracts',
    'delete_contracts',
    'view_resignation',
    'add_resignation',
    'edit_resignation',
    'delete_resignation',
    'manage_resignation',
    'view_disciplinary',
    'add_disciplinary',
    'edit_disciplinary',
    'delete_disciplinary',
    'view_users',
    'add_users',
    'edit_users',
    'delete_users',
    'view_roles',
    'add_roles',
    'edit_roles',
    'delete_roles'
  ];

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      setRoles(data || []);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load system roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.user) setCurrentUser(d.user); })
        .catch(() => {});
    }
    fetchRoles();
  }, []);

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

  const togglePermission = (perm: string) => {
    if (form.permissions.includes(perm)) {
      setForm({ ...form, permissions: form.permissions.filter(p => p !== perm) });
    } else {
      setForm({ ...form, permissions: [...form.permissions, perm] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const token = localStorage.getItem('token');

    // Zod validation
    const validation = roleSchema.safeParse(form);
    if (!validation.success) {
      const errs: Record<string, string> = {};
      validation.error.issues.forEach(i => { errs[i.path.join('.')] = i.message; });
      setFieldErrors(errs);
      toast.error('Please enter a valid role title.');
      return;
    }

    try {
      if (editingRoleId) {
        if (!hasPermission('edit_roles')) {
          toast.error('Permission Denied: Cannot modify security roles.');
          return;
        }

        const res = await fetch(`/api/roles/${editingRoleId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: form.name, permissions: form.permissions }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update dynamic role.');
        
        toast.success(`Role "${form.name}" updated successfully.`);
        setEditingRoleId(null);

      } else {
        if (!hasPermission('add_roles')) {
          toast.error('Permission Denied: Cannot establish security roles.');
          return;
        }

        const res = await fetch('/api/roles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: form.name, permissions: form.permissions }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to establish security role.');

        toast.success(`Role "${form.name}" created successfully.`);
      }

      setForm({ name: '', permissions: [] });
      fetchRoles();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleEditClick = (role: any) => {
    setFieldErrors({});
    setEditingRoleId(role._id);
    setForm({
      name: role.name,
      permissions: role.permissions || []
    });
  };

  const promptDeleteRole = (roleId: string, roleName: string) => {
    if (!hasPermission('delete_roles')) {
      toast.error('Permission Denied: Cannot delete security roles.');
      return;
    }
    setRoleToDelete({ id: roleId, name: roleName });
    setDeleteModalOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/roles/${roleToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove security role.');

      toast.success(`Role "${roleToDelete.name}" permanently deleted.`);
      fetchRoles();
    } catch (err: any) {
      toast.error(err.message || 'Delete operation failed');
    }
  };

  if (loading) return <div className="py-24 text-center text-xs font-medium text-slate-400 animate-pulse">Loading security parameters...</div>;

  const canManageRoleForm = editingRoleId ? hasPermission('edit_roles') : hasPermission('add_roles');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Security Roles Configuration</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Define dynamic parameters, construct access levels, and assign authorization states</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Role Form Container - HIDE IF USER HAS NO PERMISSION TO ADD/EDIT */}
        {canManageRoleForm ? (
          <div className="lg:col-span-5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  {editingRoleId ? 'Edit Security Role' : 'Establish Security Role'}
                </h2>
              </div>
              {editingRoleId && (
                <button 
                  onClick={() => {
                    setEditingRoleId(null);
                    setForm({ name: '', permissions: [] });
                    setFieldErrors({});
                  }}
                  className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center gap-0.5"
                >
                  <X className="h-3 w-3" /> Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Role Title / Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Accountant, HR Manager"
                  className={`w-full bg-white dark:bg-slate-900 border ${fieldErrors['name'] ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
                {fieldErrors['name'] && <p className="text-[11px] text-red-500 mt-1">{fieldErrors['name']}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Configure Authorized Privileges</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (form.permissions.length === availablePermissions.length) {
                        setForm({ ...form, permissions: [] });
                      } else {
                        setForm({ ...form, permissions: [...availablePermissions] });
                      }
                    }}
                    className="text-[11px] bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer"
                  >
                    {form.permissions.length === availablePermissions.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {availablePermissions.map(perm => (
                    <label key={perm} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/40 p-2 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors">
                      <input
                        type="checkbox"
                        className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                        checked={form.permissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-300 text-[11px]">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl transition shadow-md">
                {editingRoleId ? 'Save Role Changes' : 'Create Security Role'}
              </button>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-xl text-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase">Read-Only Access</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">You do not have permission to add or edit security roles.</p>
          </div>
        )}

        {/* Roles list table */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
            <ShieldCheck className="h-4.5 w-4.5 text-slate-700 dark:text-slate-300" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Existing System Roles</h2>
          </div>

          <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                  <th className="p-3">Role Profile</th>
                  <th className="p-3">Authorized Scope Key Permissions</th>
                  {(hasPermission('edit_roles') || hasPermission('delete_roles')) && (
                    <th className="p-3 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {roles.map((r: any) => (
                  <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{r.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-[10px] leading-relaxed">
                      {r.permissions?.join(', ') || 'No Permissions'}
                    </td>
                    {(hasPermission('edit_roles') || hasPermission('delete_roles')) && (
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {r.name.toLowerCase() !== 'admin' ? (
                          <>
                            {hasPermission('edit_roles') && (
                              <button 
                                onClick={() => handleEditClick(r)}
                                className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 inline-block p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition"
                                title="Edit Role"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {hasPermission('delete_roles') && (
                              <button 
                                onClick={() => promptDeleteRole(r._id, r.name)}
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 inline-block p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                                title="Delete Role"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-700">Protected Admin</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Delete Role Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteRole}
        title="Delete Security Role"
        description="Are you sure you want to permanently delete this system security role?"
        itemName={roleToDelete?.name}
      />
    </div>
  );
}