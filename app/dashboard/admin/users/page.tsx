'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UserPlus, UserCheck, Edit2, Trash2, X, Upload, ShieldAlert } from 'lucide-react';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { userCreateSchema, userEditSchema } from '@/lib/validations';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form states (handles both Create and Edit modes)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', roleId: '', image: '' });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

  const fetchUsersAndRoles = async () => {
    try {
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      setUsers(usersData || []);

      const rolesRes = await fetch('/api/roles');
      const rolesData = await rolesRes.json();
      setRoles(rolesData || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load user configuration');
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
    fetchUsersAndRoles();
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

  // Direct Avatar Image Upload Handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Avatar upload failed');

      setForm(prev => ({ ...prev, image: data.url }));
      toast.success('Avatar image uploaded!');
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const token = localStorage.getItem('token');
    
    try {
      if (editingUserId) {
        if (!hasPermission('edit_users')) {
          toast.error('Permission Denied: Cannot edit user profiles.');
          return;
        }

        const val = userEditSchema.safeParse(form);
        if (!val.success) {
          const errs: Record<string, string> = {};
          val.error.issues.forEach(i => { errs[i.path.join('.')] = i.message; });
          setFieldErrors(errs);
          toast.error('Please check user profile fields.');
          return;
        }

        const res = await fetch(`/api/users/${editingUserId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            fullName: form.fullName,
            email: form.email,
            password: form.password,
            role: form.roleId,
            image: form.image
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update user profile.');
        
        toast.success(`User "${form.fullName}" profile updated successfully.`);
        setEditingUserId(null);

      } else {
        if (!hasPermission('add_users')) {
          toast.error('Permission Denied: Cannot create user accounts.');
          return;
        }

        const val = userCreateSchema.safeParse(form);
        if (!val.success) {
          const errs: Record<string, string> = {};
          val.error.issues.forEach(i => { errs[i.path.join('.')] = i.message; });
          setFieldErrors(errs);
          toast.error('Please fix form validation errors.');
          return;
        }

        const res = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            fullName: form.fullName,
            email: form.email,
            password: form.password,
            role: form.roleId,
            image: form.image
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to establish user account.');

        toast.success(`User account "${form.fullName}" created successfully.`);
      }

      setForm({ fullName: '', email: '', password: '', roleId: '', image: '' });
      fetchUsersAndRoles();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleEditClick = (user: any) => {
    setEditingUserId(user._id);
    setFieldErrors({});
    setForm({
      fullName: user.fullName,
      email: user.email,
      password: '',
      roleId: user.role?._id || '',
      image: user.image || ''
    });
  };

  const promptDeleteUser = (userId: string, userName: string) => {
    if (!hasPermission('delete_users')) {
      toast.error('Permission Denied: Cannot delete user accounts.');
      return;
    }
    setUserToDelete({ id: userId, name: userName });
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user account.');

      toast.success(`User account "${userToDelete.name}" removed.`);
      fetchUsersAndRoles();
    } catch (err: any) {
      toast.error(err.message || 'Delete operation failed');
    }
  };

  if (loading) return <div className="py-24 text-center text-xs font-medium text-slate-400 animate-pulse">Loading user management directory...</div>;

  const canManageForm = editingUserId ? hasPermission('edit_users') : hasPermission('add_users');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">User Management Directory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Create, edit, and manage dynamic system access accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* User Form Container - HIDE FORM COMPLETELY IF USER HAS NO PERMISSION TO ADD/EDIT */}
        {canManageForm ? (
          <div className="lg:col-span-5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  {editingUserId ? 'Edit Account Details' : 'Register System Account'}
                </h2>
              </div>
              {editingUserId && (
                <button 
                  onClick={() => {
                    setEditingUserId(null);
                    setForm({ fullName: '', email: '', password: '', roleId: '', image: '' });
                    setFieldErrors({});
                  }}
                  className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center gap-0.5"
                >
                  <X className="h-3 w-3" /> Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  className={`w-full bg-white dark:bg-slate-900 border ${fieldErrors['fullName'] ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                />
                {fieldErrors['fullName'] && <p className="text-[11px] text-red-500 mt-1">{fieldErrors['fullName']}</p>}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  className={`w-full bg-white dark:bg-slate-900 border ${fieldErrors['email'] ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
                {fieldErrors['email'] && <p className="text-[11px] text-red-500 mt-1">{fieldErrors['email']}</p>}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  System Password {editingUserId ? '(Leave blank to keep unchanged)' : '*'}
                </label>
                <input
                  type="password"
                  className={`w-full bg-white dark:bg-slate-900 border ${fieldErrors['password'] ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                {fieldErrors['password'] && <p className="text-[11px] text-red-500 mt-1">{fieldErrors['password']}</p>}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Assign Security Role *</label>
                <select
                  className={`w-full bg-white dark:bg-slate-900 border ${fieldErrors['roleId'] ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} p-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-xs`}
                  value={form.roleId}
                  onChange={e => setForm({ ...form, roleId: e.target.value })}
                >
                  <option value="">Select security role...</option>
                  {roles.map((r: any) => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
                {fieldErrors['roleId'] && <p className="text-[11px] text-red-500 mt-1">{fieldErrors['roleId']}</p>}
              </div>
              
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Profile Image Avatar</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 overflow-hidden relative flex items-center justify-center shrink-0 shadow-md">
                    {form.image ? (
                      <img src={form.image} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    )}
                  </div>
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-semibold px-4 py-2 rounded-xl transition border border-slate-300 dark:border-slate-600">
                    {uploading ? 'Uploading...' : 'Choose Photo File'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarUpload} 
                      disabled={uploading} 
                    />
                  </label>
                </div>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl transition shadow-md">
                {editingUserId ? 'Save Profile Changes' : 'Create System Account'}
              </button>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-xl text-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase">Read-Only Mode</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">You do not have permission to add or edit user accounts.</p>
          </div>
        )}

        {/* Users list */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
            <UserCheck className="h-4.5 w-4.5 text-slate-700 dark:text-slate-300" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Active Operators</h2>
          </div>

          <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                  <th className="p-3">User</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Role</th>
                  {(hasPermission('edit_users') || hasPermission('delete_users')) && (
                    <th className="p-3 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {users.map((u: any) => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      {u.image ? (
                        <img src={u.image} alt="avatar" className="w-6 h-6 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
                          {u.fullName ? u.fullName[0] : 'U'}
                        </div>
                      )}
                      {u.fullName}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">{u.email}</td>
                    <td className="p-3">
                      <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                        {u.role?.name || 'Null'}
                      </span>
                    </td>

                    {/* DONT SHOW BUTTONS IF USER DONT HAVE PERMISSION */}
                    {(hasPermission('edit_users') || hasPermission('delete_users')) && (
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {hasPermission('edit_users') && (
                          <button 
                            onClick={() => handleEditClick(u)}
                            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 inline-block p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition"
                            title="Edit User"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {hasPermission('delete_users') && (
                          <button 
                            onClick={() => promptDeleteUser(u._id, u.fullName)}
                            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 inline-block p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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

      {/* Delete User Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteUser}
        title="Delete User Account"
        description="Are you sure you want to permanently delete this user account? They will lose access to the dashboard immediately."
        itemName={userToDelete?.name}
      />
    </div>
  );
}