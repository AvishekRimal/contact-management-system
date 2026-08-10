'use client';

import { Eye } from 'lucide-react';

interface RoleOption {
  _id: string;
  name: string;
}

interface RoleVisibilitySelectorProps {
  roles: RoleOption[];
  selectedRoleIds: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
}

export default function RoleVisibilitySelector({
  roles,
  selectedRoleIds,
  onChange,
  loading = false,
}: RoleVisibilitySelectorProps) {
  // Admins already see every record internally, so there's nothing to gain
  // from letting a creator explicitly grant the Admin role access.
  const selectableRoles = roles.filter(r => (r.name || '').toLowerCase() !== 'admin');

  const toggleRole = (roleId: string) => {
    if (selectedRoleIds.includes(roleId)) {
      onChange(selectedRoleIds.filter(id => id !== roleId));
    } else {
      onChange([...selectedRoleIds, roleId]);
    }
  };

  const allSelected = selectableRoles.length > 0 && selectableRoles.every(r => selectedRoleIds.includes(r._id));

  const toggleSelectAll = () => {
    if (allSelected) {
      onChange(selectedRoleIds.filter(id => !selectableRoles.some(r => r._id === id)));
    } else {
      const merged = new Set(selectedRoleIds);
      selectableRoles.forEach(r => merged.add(r._id));
      onChange(Array.from(merged));
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Visibility &amp; Access</h2>
          </div>
          {selectableRoles.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-[11px] bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer shrink-0"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          Choose which roles can see this record. Leave unselected to show to all roles. Admins can always see every record.
        </p>

        {loading ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 animate-pulse">Loading roles...</p>
        ) : selectableRoles.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">No roles configured yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-1.5 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
            {selectableRoles.map(role => (
              <label
                key={role._id}
                className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/40 p-2 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors"
              >
                <input
                  type="checkbox"
                  className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                  checked={selectedRoleIds.includes(role._id)}
                  onChange={() => toggleRole(role._id)}
                />
                <span className="font-medium text-slate-800 dark:text-slate-300 text-[11px] capitalize">{role.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
