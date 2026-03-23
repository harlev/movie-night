'use client';

import { useActionState, useEffect, useState } from 'react';

interface FeedbackInlineEditorProps {
  action: (prevState: any, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  hiddenFields: Array<{ name: string; value: string }>;
  initialContent: string;
  submitLabel?: string;
  pendingLabel?: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

export default function FeedbackInlineEditor({
  action,
  hiddenFields,
  initialContent,
  submitLabel = 'Save',
  pendingLabel = 'Saving...',
  onCancel,
  onSuccess,
}: FeedbackInlineEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    if (!state?.success) return;
    onSuccess?.();
  }, [onSuccess, state?.success]);

  return (
    <form action={formAction} className="space-y-3">
      {hiddenFields.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}

      <div className="space-y-2">
        <textarea
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={4}
          maxLength={1000}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/60 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
        />
        <div className="text-right text-xs text-[var(--color-text-muted)]">{content.length}/1000</div>
      </div>

      {state?.error ? (
        <div className="rounded-xl border border-[var(--color-error)]/50 bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">
          {state.error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-background)] transition-colors hover:bg-[var(--color-primary-light)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
