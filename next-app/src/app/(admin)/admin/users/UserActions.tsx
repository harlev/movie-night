'use client';

import { useActionState } from 'react';
import { updateUserStatusAction, updateUserRoleAction } from '@/lib/actions/users';
import type { Profile } from '@/lib/types';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function RoleForm({ user }: { user: Profile }) {
  const [state, formAction, pending] = useActionState(updateUserRoleAction, null);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="userId" value={user.id} />
      <select
        name="role"
        defaultValue={user.role}
        onChange={(e) => {
          const form = e.currentTarget.form;
          if (form) form.requestSubmit();
        }}
        disabled={pending}
        className={`text-xs px-2 py-1 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)] ${
          user.role === 'admin' ? 'text-[var(--color-warning)]' : ''
        }`}
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
    </form>
  );
}

function StatusToggle({ user }: { user: Profile }) {
  const [state, formAction, pending] = useActionState(updateUserStatusAction, null);
  const newStatus = user.status === 'active' ? 'disabled' : 'active';

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="userId" value={user.id} />
      <input type="hidden" name="status" value={newStatus} />
      <button
        type="submit"
        disabled={pending}
        className={`text-sm ${
          user.status === 'active'
            ? 'text-[var(--color-error)]'
            : 'text-[var(--color-success)]'
        } hover:underline disabled:opacity-50`}
      >
        {pending ? '...' : user.status === 'active' ? 'Disable' : 'Enable'}
      </button>
    </form>
  );
}

export default function UserActions({ users }: { users: Profile[] }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-[var(--color-surface-elevated)]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              User
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Joined
            </th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-[var(--color-surface-elevated)]/50">
              <td className="px-4 py-4">
                <div>
                  <p className="font-medium text-[var(--color-text)]">{user.display_name}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">{user.email}</p>
                </div>
              </td>
              <td className="px-4 py-4">
                <RoleForm user={user} />
              </td>
              <td className="px-4 py-4">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    user.status === 'active'
                      ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                      : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'
                  }`}
                >
                  {user.status}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-[var(--color-text-muted)]">
                {formatDate(user.created_at)}
              </td>
              <td className="px-4 py-4 text-right">
                <StatusToggle user={user} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
