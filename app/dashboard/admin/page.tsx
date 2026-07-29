'use client';
import { useState, useEffect } from 'react';
import { ShieldAlert, UserPlus, Users, Key } from 'lucide-react';

export default function AdminControlPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] as string[] });
  
  // User Form states
  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    roleId: '',
    image: ''
  });

  const availablePermissions = [
    'add_employee',
    'edit_employee',
    'delete_employee',
    'manage_contracts',
    'view_all'
  ];

  const fetchUsersAndRoles = async () => {
    try {
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      setUsers(usersData);

      const rolesRes = await fetch('/api/roles');
      const rolesData = await rolesRes.json();
      setRoles(rolesData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: roleForm.name, permissions: roleForm.permissions }),
    });

    if (res.ok) {
      setRoleForm({ name: '', permissions: [] });
      fetchUsersAndRoles();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fullName: userForm.fullName,
        email: userForm.email,
        password: userForm.password,
        role: userForm.roleId,
        image: userForm.image
      }),
    });

    if (res.ok) {
      setUserForm({ fullName: '', email: '', password: '', roleId: '', image: '' });
      fetchUsersAndRoles();
    }
  };

  const togglePermission = (perm: string) => {
    if (roleForm.permissions.includes(perm)) {
      setRoleForm({ ...roleForm, permissions: roleForm.permissions.filter(p => p !== perm) });
    } else {
      setRoleForm({ ...roleForm, permissions: [...roleForm.permissions, perm] });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Access Management & System Roles</h1>
        <p className="text-xs text-gray-500">Design dynamic system roles, define system parameters, and construct user logins.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Dynamic Roles Creation Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <ShieldAlert className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Configure New System Role</h2>
          </div>
          <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-600 font-semibold mb-1">Role Title/Name</label>
              <input
                type="text"
                placeholder="e.g., HR Specialist, Senior Auditor"
                className="w-full border border-gray-200 p-2 rounded focus:outline-none"
                value={roleForm.name}
                onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-2">Check Granular Permissions</label>
              <div className="grid grid-cols-2 gap-2">
                {availablePermissions.map(perm => (
                  <label key={perm} className="flex items-center gap-2 bg-slate-50 p-2 rounded cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={roleForm.permissions.includes(perm)}
                      onChange={() => togglePermission(perm)}
                    />
                    <span>{perm.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded w-full">
              Establish Role
            </button>
          </form>
        </div>

        {/* User Account Registry Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Register Account Credentials</h2>
          </div>
          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 p-2 rounded focus:outline-none"
                  value={userForm.fullName}
                  onChange={e => setUserForm({ ...userForm, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Email Identifier</label>
                <input
                  type="email"
                  className="w-full border border-gray-200 p-2 rounded focus:outline-none"
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Secure Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-200 p-2 rounded focus:outline-none"
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Select System Role</label>
                <select
                  className="w-full border border-gray-200 p-2 rounded focus:outline-none bg-white"
                  value={userForm.roleId}
                  onChange={e => setUserForm({ ...userForm, roleId: e.target.value })}
                >
                  <option value="">Choose Role...</option>
                  {roles.map((r: any) => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-1">Avatar Image URL (Optional)</label>
              <input
                type="text"
                placeholder="https://..."
                className="w-full border border-gray-200 p-2 rounded focus:outline-none"
                value={userForm.image}
                onChange={e => setUserForm({ ...userForm, image: e.target.value })}
              />
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded w-full">
              Create User Account
            </button>
          </form>
        </div>

      </div>

      {/* System Active Logins Directory */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Users className="h-5 w-5 text-gray-700" />
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Registered Accounts</h2>
        </div>
        <div className="border border-gray-100 rounded overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 font-semibold uppercase">
                <th className="p-3">User</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Designated Role</th>
                <th className="p-3">Key Permissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u: any) => (
                <tr key={u._id}>
                  <td className="p-3 font-semibold text-gray-800 flex items-center gap-2">
                    {u.image && <img src={u.image} alt={u.fullName} className="w-6 h-6 rounded-full object-cover" />}
                    {u.fullName}
                  </td>
                  <td className="p-3 text-gray-600 font-mono">{u.email}</td>
                  <td className="p-3"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{u.role?.name}</span></td>
                  <td className="p-3 text-gray-500 font-mono text-[10px]">{u.role?.permissions?.join(', ') || 'No Permissions'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}