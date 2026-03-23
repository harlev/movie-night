'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface FeedbackOwnerMenuProps {
  canEdit: boolean;
  canDelete: boolean;
  onEdit?: () => void;
  deleteAction?: (prevState: any, formData: FormData) => Promise<{
    error?: string;
    success?: boolean;
    redirectTo?: string;
  }>;
  deleteHiddenFields?: Array<{ name: string; value: string }>;
  deletePrompt?: string;
}

async function unavailableDeleteAction() {
  return { error: 'Delete is unavailable' };
}

export default function FeedbackOwnerMenu({
  canEdit,
  canDelete,
  onEdit,
  deleteAction,
  deleteHiddenFields = [],
  deletePrompt = 'Delete this feedback?',
}: FeedbackOwnerMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteState, formAction, deletePending] = useActionState(
    deleteAction || unavailableDeleteAction,
    null
  );

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!deleteState?.success) return;

    setMenuOpen(false);
    setConfirmDelete(false);

    if (deleteState.redirectTo) {
      router.push(deleteState.redirectTo);
    }
  }, [deleteState?.redirectTo, deleteState?.success, router]);

  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setMenuOpen((current) => !current);
          setConfirmDelete(false);
        }}
        aria-label="Open feedback actions"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)]/60 bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="5" cy="12" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="19" cy="12" r="1.75" />
        </svg>
      </button>

      {menuOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-2 shadow-xl shadow-black/30"
        >
          {confirmDelete ? (
            <div className="space-y-2 px-2 py-1">
              <p className="text-sm text-[var(--color-text-muted)]">{deletePrompt}</p>
              {deleteState?.error ? (
                <div className="rounded-lg border border-[var(--color-error)]/50 bg-[var(--color-error)]/10 px-3 py-2 text-xs text-[var(--color-error)]">
                  {deleteState.error}
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <form action={formAction}>
                  {deleteHiddenFields.map((field) => (
                    <input key={field.name} type="hidden" name={field.name} value={field.value} />
                  ))}
                  <button
                    type="submit"
                    disabled={deletePending}
                    className="rounded-lg bg-[var(--color-error)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-error)]/80 disabled:opacity-50"
                  >
                    {deletePending ? 'Deleting...' : 'Confirm'}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {canEdit ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onEdit?.();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]"
                >
                  Edit
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setConfirmDelete(true)}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10"
                >
                  Delete
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
