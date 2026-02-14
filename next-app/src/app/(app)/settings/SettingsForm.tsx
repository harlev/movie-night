'use client';

import { useActionState, useState } from 'react';
import { updateProfileAction } from '@/lib/actions/users';

interface SettingsFormProps {
  displayName: string;
  email: string;
}

export default function SettingsForm({ displayName, email }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, null);
  const [name, setName] = useState(displayName);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
          Display Name
        </label>
        <input
          type="text"
          id="displayName"
          name="displayName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          required
          className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]/50 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)]/50 transition-colors"
        />
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {name.trim().length}/50 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]/50 text-[var(--color-text-muted)] cursor-not-allowed opacity-60"
        />
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Email cannot be changed
        </p>
      </div>

      {state?.error && (
        <p className="text-sm text-[var(--color-error)]">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-[var(--color-success)]">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={isPending || name.trim() === displayName}
        className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-background)] font-medium text-sm hover:bg-[var(--color-primary-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
