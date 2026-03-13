import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import { Search } from 'lucide-react';
import { api } from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import AppLayout from '../../components/layout/AppLayout';

interface ApiError {
  error: { message: string };
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
}

const ROLES = ['SYSTEM_ADMIN', 'DEPT_ADMIN', 'STAFF', 'STUDENT'] as const;

const ROLE_LABEL: Record<string, string> = {
  SYSTEM_ADMIN: 'System Admin',
  DEPT_ADMIN: 'Dept Admin',
  STAFF: 'Staff',
  STUDENT: 'Student',
};

const ROLE_BADGE: Record<string, string> = {
  SYSTEM_ADMIN: 'bg-purple-100 text-purple-700',
  DEPT_ADMIN: 'bg-blue-100 text-blue-700',
  STAFF: 'bg-teal-100 text-teal-700',
  STUDENT: 'bg-gray-100 text-gray-600',
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user: me } = useAuthStore();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.get<{ success: boolean; items: AdminUser[] }>(`/admin/users${params}`);
      return res.data;
    },
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Role updated');
    },
    onError: (err: AxiosError<ApiError>) =>
      toast.error(err.response?.data?.error?.message ?? 'Failed to update role'),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/deactivate`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deactivated');
    },
    onError: (err: AxiosError<ApiError>) =>
      toast.error(err.response?.data?.error?.message ?? 'Failed to deactivate'),
  });

  const handleRoleChange = (user: AdminUser, newRole: string) => {
    if (newRole === user.role) return;
    if (
      !window.confirm(
        `Change ${user.name}'s role from ${ROLE_LABEL[user.role] ?? user.role} → ${ROLE_LABEL[newRole] ?? newRole}?`
      )
    )
      return;
    changeRole.mutate({ id: user._id, role: newRole });
  };

  const users = data?.items ?? [];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Promote, demote, or deactivate accounts</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading && <div className="p-8 text-center text-gray-400 animate-pulse">Loading…</div>}
          {!isLoading && users.length === 0 && (
            <div className="p-8 text-center text-gray-400">No users found</div>
          )}
          {!isLoading && users.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => {
                  const isSelf = user._id === me?.id;
                  return (
                    <tr
                      key={user._id}
                      className={`hover:bg-gray-50 ${isSelf ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="px-5 py-3 font-medium text-gray-800">
                        {user.name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-primary font-normal">(you)</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{user.email}</td>
                      <td className="px-5 py-3">
                        {isSelf ? (
                          /* Can't change own role — backend also blocks this */
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_BADGE[user.role] ?? ''}`}
                          >
                            {ROLE_LABEL[user.role] ?? user.role}
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            onChange={e => handleRoleChange(user, e.target.value)}
                            disabled={changeRole.isPending}
                            className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${ROLE_BADGE[user.role] ?? ''}`}
                          >
                            {ROLES.map(r => (
                              <option key={r} value={r}>
                                {ROLE_LABEL[r]}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            user.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3">
                        {user.isActive && !isSelf && (
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Deactivate ${user.name}? They will no longer be able to log in.`
                                )
                              )
                                deactivate.mutate(user._id);
                            }}
                            disabled={deactivate.isPending}
                            className="text-xs text-red-500 hover:underline disabled:opacity-40"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
