'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import SortableBallotSlot from './SortableBallotSlot';
import { getRankBadgeClasses } from '@/lib/utils/rankStyles';
import type { FilledRankItem } from '@/hooks/useBallot';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

interface MovieData {
  id: string;
  title: string;
  metadata_snapshot: {
    posterPath: string | null;
    releaseDate: string | null;
  } | null;
}

interface SortableBallotListProps {
  filledRankItems: FilledRankItem[];
  maxRankN: number;
  isLive: boolean;
  firstEmptySlot: number | null;
  lastChangedRank: number | null;
  getMovieById: (id: string) => MovieData | undefined;
  onRemove: (rank: number, movieId: string) => void;
  onReorder: (activeMovieId: string, overMovieId: string) => void;
  /** Compact mobile sizing */
  compact?: boolean;
  /** Stable id for DndContext to avoid hydration mismatches */
  dndId?: string;
}

export default function SortableBallotList({
  filledRankItems,
  maxRankN,
  isLive,
  firstEmptySlot,
  lastChangedRank,
  getMovieById,
  onRemove,
  onReorder,
  compact,
  dndId,
}: SortableBallotListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (over && active.id !== over.id) {
        onReorder(active.id as string, over.id as string);
      }
    },
    [onReorder]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // How many empty slots remain after filled ones
  const emptySlotCount = maxRankN - filledRankItems.length;
  const filledCount = filledRankItems.length;

  // If not live, render plain (non-draggable) slots
  if (!isLive) {
    return (
      <div className="space-y-1.5">
        {Array.from({ length: maxRankN }, (_, i) => {
          const rank = i + 1;
          const item = filledRankItems.find((f) => f.rank === rank);
          const movie = item ? getMovieById(item.movieId) : null;

          return (
            <div
              key={rank}
              className={`flex items-center ${compact ? 'gap-2 p-2 rounded-lg' : 'gap-3 p-3 rounded-xl'} border-2 transition-all duration-200 ${
                movie
                  ? 'border-[var(--color-primary)]/40 bg-gradient-to-r from-[var(--color-primary)]/10 to-transparent'
                  : 'border-dashed border-[var(--color-border)]'
              }`}
            >
              <span
                className={`${compact ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'} flex-shrink-0 flex items-center justify-center rounded-full font-bold ${getRankBadgeClasses(rank)}`}
              >
                {rank}
              </span>
              {movie ? (
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
              ) : (
                <span className={`text-[var(--color-text-muted)] italic ${compact ? 'text-xs' : 'text-sm'}`}>
                  Empty
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const sortableIds = filledRankItems.map((item) => item.movieId);
  const activeItem = activeId
    ? filledRankItems.find((item) => item.movieId === activeId)
    : null;
  const activeMovie = activeItem ? getMovieById(activeItem.movieId) : undefined;

  return (
    <div className="space-y-1.5">
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {filledRankItems.map((item) => (
            <SortableBallotSlot
              key={item.movieId}
              rank={item.rank}
              movieId={item.movieId}
              movie={getMovieById(item.movieId)}
              isLive={isLive}
              onRemove={onRemove}
              justChanged={lastChangedRank === item.rank}
              compact={compact}
            />
          ))}
        </SortableContext>

        {/* Drag overlay — elevated floating copy */}
        {activeItem && activeMovie && (
          <DragOverlayPortal
            rank={activeItem.rank}
            movieId={activeItem.movieId}
            movie={activeMovie}
            compact={compact}
          />
        )}
      </DndContext>

      {/* Empty slots below filled ones */}
      {Array.from({ length: emptySlotCount }, (_, i) => {
        const rank = filledCount + i + 1;
        const isFirstEmpty = firstEmptySlot === rank;

        return (
          <div
            key={`empty-${rank}`}
            className={`flex items-center ${compact ? 'gap-2 p-2 rounded-lg' : 'gap-3 p-3 rounded-xl'} border-2 border-dashed transition-all duration-200 ${
              isFirstEmpty
                ? 'border-[var(--color-border)] animate-slot-pulse'
                : 'border-[var(--color-border)]'
            }`}
          >
            <span
              className={`${compact ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'} flex-shrink-0 flex items-center justify-center rounded-full font-bold ${getRankBadgeClasses(rank)}`}
            >
              {rank}
            </span>
            <span className={`text-[var(--color-text-muted)] italic ${compact ? 'text-xs' : 'text-sm'}`}>
              {isFirstEmpty ? (compact ? 'Tap a movie below' : 'Select a movie below') : 'Empty'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Separate component for DragOverlay to avoid importing at top level conditionally
import { DragOverlay } from '@dnd-kit/core';

function DragOverlayPortal({
  rank,
  movieId,
  movie,
  compact,
}: {
  rank: number;
  movieId: string;
  movie: MovieData;
  compact?: boolean;
}) {
  return (
    <DragOverlay>
      <SortableBallotSlot
        rank={rank}
        movieId={movieId}
        movie={movie}
        isLive={true}
        onRemove={() => {}}
        justChanged={false}
        isOverlay={true}
        compact={compact}
      />
    </DragOverlay>
  );
}
