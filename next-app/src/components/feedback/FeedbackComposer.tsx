'use client';

import { useActionState, useEffect, useEffectEvent, useRef, useState } from 'react';
import Card from '@/components/ui/Card';
import { getNextFeedbackComposerContent } from '@/lib/utils/feedback';

interface FeedbackComposerProps {
  action: (prevState: any, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  mode: 'thread' | 'reply';
  threadId?: string;
  userRole?: 'admin' | 'member' | 'viewer';
  initialContent?: string;
  replyTargetLabel?: string | null;
  onClearReplyTarget?: () => void;
  autoFocusKey?: string;
}

export default function FeedbackComposer({
  action,
  mode,
  threadId,
  userRole,
  initialContent = '',
  replyTargetLabel,
  onClearReplyTarget,
  autoFocusKey,
}: FeedbackComposerProps) {
  const isViewer = userRole === 'viewer';
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previousInitialContentRef = useRef(initialContent);
  const [content, setContent] = useState(initialContent);
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [state, formAction, isPending] = useActionState(action, null);
  const clearReplyTarget = useEffectEvent(() => {
    onClearReplyTarget?.();
  });

  useEffect(() => {
    if (!state?.success) return;

    setContent('');
    setPostAnonymously(false);
    clearReplyTarget();
  }, [state?.success]);

  useEffect(() => {
    setContent((currentContent) =>
      getNextFeedbackComposerContent({
        currentContent,
        previousInitialContent: previousInitialContentRef.current,
        nextInitialContent: initialContent,
      })
    );
    previousInitialContentRef.current = initialContent;
  }, [initialContent]);

  useEffect(() => {
    if (!autoFocusKey) return;

    textareaRef.current?.focus();
    textareaRef.current?.setSelectionRange(
      textareaRef.current.value.length,
      textareaRef.current.value.length
    );
  }, [autoFocusKey]);

  const heading = mode === 'reply' ? 'Add a reply' : 'Share a thought';
  const placeholder =
    mode === 'reply'
      ? 'Add to the conversation...'
      : 'What would make movie night better?';
  const submitLabel = mode === 'reply' ? 'Post Reply' : 'Post Feedback';

  return (
    <Card padding="md" className="space-y-4">
      <div>
        <h2 className="text-lg font-display font-semibold text-[var(--color-text)]">{heading}</h2>
        {isViewer ? (
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Viewers can read feedback but cannot post.
          </p>
        ) : null}
      </div>

      {isViewer ? (
        <div className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface-elevated)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
          {mode === 'reply' ? 'Viewers cannot post replies.' : 'Viewers cannot post feedback.'}
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          {threadId ? <input type="hidden" name="threadId" value={threadId} /> : null}
          <input
            type="hidden"
            name="postingIdentity"
            value={postAnonymously ? 'anonymous' : 'named'}
          />

          {replyTargetLabel ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface-elevated)] px-4 py-3">
              <p className="text-sm text-[var(--color-text-muted)]">
                Replying to{' '}
                <span className="font-medium text-[var(--color-text)]">{replyTargetLabel}</span>
              </p>
              {onClearReplyTarget ? (
                <button
                  type="button"
                  onClick={onClearReplyTarget}
                  className="text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-light)]"
                >
                  Clear
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              id={`${mode}-content`}
              name="content"
              aria-label={mode === 'reply' ? 'Reply' : 'Share a thought'}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={placeholder}
              rows={mode === 'reply' ? 4 : 5}
              maxLength={1000}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
            />
            <div className="text-right text-xs text-[var(--color-text-muted)]">
              <span>{content.length}/1000</span>
            </div>
          </div>

          <div className="max-w-sm space-y-1.5">
            <label className="inline-flex w-fit cursor-pointer items-center gap-3">
              <span className="text-sm font-medium text-[var(--color-text)]">Post anonymously</span>
              <span
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  postAnonymously ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-border)]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={postAnonymously}
                  onChange={(event) => setPostAnonymously(event.target.checked)}
                  className="sr-only"
                  aria-label="Post anonymously"
                />
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    postAnonymously ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </span>
            </label>
            <p className="text-xs leading-5 text-[var(--color-text-muted)]">
              Your identity will remain private - including from site admins.
            </p>
          </div>

          {state?.error ? (
            <div className="rounded-xl border border-[var(--color-error)]/50 bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">
              {state.error}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending || !content.trim()}
              className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-background)] transition-colors hover:bg-[var(--color-primary-light)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? 'Posting...' : submitLabel}
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}
