'use client';

import { useActionState, useState } from 'react';
import { addCommentAction } from '@/lib/actions/movies';
import type { MovieComment } from '@/lib/types';

interface MovieCommentSectionProps {
  movieId: string;
  comments: (MovieComment & { userName: string })[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function MovieCommentSection({
  movieId,
  comments: initialComments,
}: MovieCommentSectionProps) {
  const [commentContent, setCommentContent] = useState('');
  const [comments, setComments] = useState(initialComments);

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await addCommentAction(prevState, formData);
      if (result?.success) {
        setCommentContent('');
        // Optimistically add comment - it will be confirmed on next page load
        // For now we just clear the form; the page will refresh data on revalidation
      }
      return result;
    },
    null
  );

  return (
    <div className="bg-[var(--color-surface)] rounded-lg p-6">
      <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
        Comments ({comments.length})
      </h2>

      {/* Comment Form */}
      <form action={formAction} className="mb-6">
        <input type="hidden" name="movieId" value={movieId} />
        {state?.error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mb-3">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)] rounded-lg p-3 mb-3">
            Comment posted!
          </div>
        )}
        <textarea
          name="content"
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          placeholder="Share your thoughts about this movie..."
          rows={3}
          maxLength={1000}
          className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[var(--color-text-muted)]">
            {commentContent.length}/1000
          </span>
          <button
            type="submit"
            disabled={isPending || !commentContent.trim()}
            className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 bg-[var(--color-surface-elevated)] rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[var(--color-text)]">
                  {comment.userName}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {formatDate(comment.created_at)}
                </span>
              </div>
              <p className="text-[var(--color-text-muted)] whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-[var(--color-text-muted)] py-8">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </div>
  );
}
