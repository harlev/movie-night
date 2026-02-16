'use client';

import { useActionState, useState, useTransition } from 'react';
import { updateUserStatusAction, updateUserRoleAction, updateUserNameAction } from '@/lib/actions/users';
import type { Profile } from '@/lib/types';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function RoleForm({ user }: { user: Profile }) {
  const [role, setRole] = useState(user.role);
  const [isPending, startTransition] = useTransition();

  function handleChange(newRole: string) {
    setRole(newRole as Profile['role']);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('userId', user.id);
      formData.set('role', newRole);
      await updateUserRoleAction(null, formData);
    });
  }

  return (
    <select
      value={role}
      onChange={(e) => handleChange(e.target.value)}
      disabled={isPending}
      className={`text-xs px-2 py-1 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)] ${
        role === 'admin' ? 'text-[var(--color-warning)]' : role === 'viewer' ? 'text-[var(--color-secondary)]' : ''
      }`}
    >
      <option value="member">Member</option>
      <option value="viewer">Viewer</option>
      <option value="admin">Admin</option>
    </select>
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

function EditableName({ user }: { user: Profile }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.display_name);
  const [state, formAction, pending] = useActionState(updateUserNameAction, null);

  if (!editing) {
    return (
      <div className="group flex items-center gap-1">
        <p className="font-medium text-[var(--color-text)]">{user.display_name}</p>
        <button
          type="button"
          onClick={() => { setName(user.display_name); setEditing(true); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all"
          title="Edit name"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        setEditing(false);
      }}
      className="flex items-center gap-1.5"
    >
      <input type="hidden" name="userId" value={user.id} />
      <input
        type="text"
        name="displayName"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }}
        className="px-2 py-1 text-sm bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] w-36"
      />
      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="px-2 py-1 text-xs bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
      >
        {pending ? '...' : 'Save'}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="px-2 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        Cancel
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
                  <EditableName user={user} />
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
