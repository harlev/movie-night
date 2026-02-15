'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getRankBadgeClasses } from '@/lib/utils/rankStyles';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

interface MovieData {
  id: string;
  title: string;
  metadata_snapshot: {
    posterPath: string | null;
    releaseDate: string | null;
  } | null;
}

interface SortableBallotSlotProps {
  rank: number;
  movieId: string;
  movie: MovieData | undefined;
  isLive: boolean;
  onRemove: (rank: number, movieId: string) => void;
  justChanged: boolean;
  /** Whether this is rendered inside the drag overlay (floating copy) */
  isOverlay?: boolean;
  /** Compact mobile sizing */
  compact?: boolean;
}

export default function SortableBallotSlot({
  rank,
  movieId,
  movie,
  isLive,
  onRemove,
  justChanged,
  isOverlay,
  compact,
}: SortableBallotSlotProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: movieId, disabled: !isLive });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // When dragging, show a dashed placeholder in the original position
  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center border-2 border-dashed border-[var(--color-border)] transition-all duration-200 ${compact ? 'gap-2 p-2 rounded-lg' : 'gap-3 p-3 rounded-xl'}`}
      >
        <span
          className={`${compact ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'} flex-shrink-0 flex items-center justify-center rounded-full font-bold ${getRankBadgeClasses(rank)} opacity-40`}
        >
          {rank}
        </span>
        <span className={`text-[var(--color-text-muted)] italic ${compact ? 'text-xs' : 'text-sm'}`}>
          Drop here
        </span>
      </div>
    );
  }

  const baseClasses = `flex items-center ${compact ? 'gap-2 p-2 rounded-lg' : 'gap-3 p-3 rounded-xl'} border-2 transition-all duration-200`;
  const filledClasses = 'border-[var(--color-primary)]/40 bg-gradient-to-r from-[var(--color-primary)]/10 to-transparent';
  const overlayClasses = isOverlay
    ? 'ring-2 ring-[var(--color-primary)]/40 shadow-[0_8px_32px_rgba(212,160,83,0.2)] scale-[1.04] bg-[var(--color-surface)]'
    : '';

  return (
    <div
      ref={!isOverlay ? setNodeRef : undefined}
      style={!isOverlay ? style : undefined}
      className={`${baseClasses} ${filledClasses} ${overlayClasses} ${justChanged && !isOverlay ? 'animate-ballot-pop' : ''}`}
    >
      {/* Drag handle */}
      {isLive && (
        <button
          type="button"
          className="touch-none flex-shrink-0 p-0.5 cursor-grab active:cursor-grabbing text-[var(--color-text-muted)] opacity-30 hover:opacity-60 transition-opacity"
          aria-label={`Drag to reorder rank ${rank}`}
          {...attributes}
          {...listeners}
        >
          <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="5" r="1.5" />
            <circle cx="15" cy="5" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="19" r="1.5" />
            <circle cx="15" cy="19" r="1.5" />
          </svg>
        </button>
      )}

      <span
        className={`${compact ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'} flex-shrink-0 flex items-center justify-center rounded-full font-bold ${getRankBadgeClasses(rank)}`}
      >
        {rank}
      </span>

      {movie ? (
        <>
          <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'} flex-1 min-w-0`}>
            {movie.metadata_snapshot?.posterPath && (
              <img
                src={`${TMDB_IMAGE_BASE}${movie.metadata_snapshot.posterPath}`}
                alt={movie.title}
                className={`${compact ? 'w-8 h-12' : 'w-10 h-15'} object-cover rounded flex-shrink-0`}
              />
            )}
            <span className={`font-medium ${compact ? 'text-sm' : 'text-base'} text-[var(--color-text)] truncate`}>
              {movie.title}
            </span>
          </div>
          {isLive && (
            <button
              type="button"
              onClick={() => onRemove(rank, movieId)}
              className="p-1 flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
              aria-label={`Remove from rank ${rank}`}
            >
              <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </>
      ) : (
        <span className={`text-[var(--color-text-muted)] italic ${compact ? 'text-xs' : 'text-sm'}`}>
          Unknown movie
        </span>
      )}
    </div>
  );
}
