import { useState, useCallback, useMemo } from 'react';

interface RankEntry {
  rank: number;
  movieId: string;
}

interface UseBallotOptions {
  maxRankN: number;
  initialRanks: RankEntry[] | null;
  isLive: boolean;
}

export interface FilledRankItem {
  rank: number;
  movieId: string;
}

export function useBallot({ maxRankN, initialRanks, isLive }: UseBallotOptions) {
  const initialBallot = useMemo(() => {
    const map = new Map<number, string>();
    if (initialRanks) {
      for (const { rank, movieId } of initialRanks) {
        map.set(rank, movieId);
      }
    }
    return map;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [ballot, setBallot] = useState<Map<number, string>>(initialBallot);
  const [lastChangedRank, setLastChangedRank] = useState<number | null>(null);

  const setRank = useCallback((rank: number, movieId: string) => {
    setBallot((prev) => {
      const newBallot = new Map(prev);

      // Remove movie from any existing rank
      for (const [r, m] of newBallot) {
        if (m === movieId) {
          newBallot.delete(r);
        }
      }

      // If clicking on already-selected rank, just remove it
      if (prev.get(rank) === movieId) {
        return newBallot;
      }

      // Set new rank
      newBallot.set(rank, movieId);
      return newBallot;
    });
    setLastChangedRank(rank);
    setTimeout(() => setLastChangedRank(null), 200);
  }, []);

  const clearBallot = useCallback(() => {
    setBallot(new Map());
  }, []);

  const handleMovieClick = useCallback(
    (movieId: string) => {
      if (!isLive) return;

      // Use a single setState to atomically find slot and update
      let assignedRank = maxRankN;
      setBallot((prev) => {
        const newBallot = new Map(prev);

        // Remove movie from any existing rank
        for (const [r, m] of newBallot) {
          if (m === movieId) newBallot.delete(r);
        }

        // Find first empty slot
        let targetRank: number | null = null;
        for (let r = 1; r <= maxRankN; r++) {
          if (!newBallot.has(r)) {
            targetRank = r;
            break;
          }
        }

        // Use first empty slot or replace last
        assignedRank = targetRank ?? maxRankN;
        newBallot.set(assignedRank, movieId);
        return newBallot;
      });
      setLastChangedRank(assignedRank);
      setTimeout(() => setLastChangedRank(null), 200);
    },
    [isLive, maxRankN]
  );

  const getBallotAsArray = useCallback((): RankEntry[] => {
    return Array.from(ballot.entries()).map(([rank, movieId]) => ({ rank, movieId }));
  }, [ballot]);

  const isMovieSelected = useCallback(
    (movieId: string): number | null => {
      for (const [rank, mid] of ballot) {
        if (mid === movieId) return rank;
      }
      return null;
    },
    [ballot]
  );

  const getMovieForRank = useCallback(
    (rank: number): string | undefined => ballot.get(rank),
    [ballot]
  );

  // Compute filled rank items (sorted by rank) for DnD
  const filledRankItems: FilledRankItem[] = useMemo(() => {
    return Array.from(ballot.entries())
      .map(([rank, movieId]) => ({ rank, movieId }))
      .sort((a, b) => a.rank - b.rank);
  }, [ballot]);

  // First empty slot for pulse animation
  const firstEmptySlot: number | null = useMemo(() => {
    if (!isLive) return null;
    for (let r = 1; r <= maxRankN; r++) {
      if (!ballot.has(r)) return r;
    }
    return null;
  }, [isLive, maxRankN, ballot]);

  const isBallotComplete = ballot.size === maxRankN;

  // Toggle a movie: if selected, remove and compact ranks; if not, add at first empty slot
  const toggleMovie = useCallback(
    (movieId: string) => {
      if (!isLive) return;

      setBallot((prev) => {
        const newBallot = new Map(prev);

        // Check if movie is already selected
        let existingRank: number | null = null;
        for (const [r, m] of newBallot) {
          if (m === movieId) {
            existingRank = r;
            break;
          }
        }

        if (existingRank !== null) {
          // Remove and compact: shift higher ranks down
          newBallot.delete(existingRank);
          const compacted = new Map<number, string>();
          const sorted = Array.from(newBallot.entries()).sort((a, b) => a[0] - b[0]);
          sorted.forEach(([, mid], i) => {
            compacted.set(i + 1, mid);
          });
          return compacted;
        }

        // Not selected — add at first empty slot if not full
        if (newBallot.size >= maxRankN) return prev; // ballot full, do nothing
        const nextRank = newBallot.size + 1;
        newBallot.set(nextRank, movieId);
        return newBallot;
      });
    },
    [isLive, maxRankN]
  );

  // Move a selected movie up or down in rank order
  const moveRank = useCallback(
    (movieId: string, direction: 'up' | 'down') => {
      setBallot((prev) => {
        const items = Array.from(prev.entries())
          .map(([rank, mid]) => ({ rank, movieId: mid }))
          .sort((a, b) => a.rank - b.rank);

        const idx = items.findIndex((item) => item.movieId === movieId);
        if (idx === -1) return prev;

        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= items.length) return prev;

        // Swap the two movies' ranks
        const newBallot = new Map(prev);
        newBallot.set(items[idx].rank, items[swapIdx].movieId);
        newBallot.set(items[swapIdx].rank, movieId);
        return newBallot;
      });
    },
    []
  );

  // Reorder ballot by moving the active movie to the position of the over movie
  const reorderBallot = useCallback(
    (activeMovieId: string, overMovieId: string) => {
      if (activeMovieId === overMovieId) return;

      setBallot((prev) => {
        // Get current items sorted by rank
        const items = Array.from(prev.entries())
          .map(([rank, movieId]) => ({ rank, movieId }))
          .sort((a, b) => a.rank - b.rank);

        const movieIds = items.map((item) => item.movieId);
        const oldIndex = movieIds.indexOf(activeMovieId);
        const newIndex = movieIds.indexOf(overMovieId);

        if (oldIndex === -1 || newIndex === -1) return prev;

        // arrayMove: remove from oldIndex, insert at newIndex
        const reordered = [...movieIds];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);

        // Rebuild sequential ranks starting from 1
        const newBallot = new Map<number, string>();
        reordered.forEach((movieId, i) => {
          newBallot.set(i + 1, movieId);
        });

        return newBallot;
      });
    },
    []
  );

  return {
    ballot,
    lastChangedRank,
    setRank,
    clearBallot,
    handleMovieClick,
    getBallotAsArray,
    isMovieSelected,
    getMovieForRank,
    filledRankItems,
    firstEmptySlot,
    isBallotComplete,
    reorderBallot,
    toggleMovie,
    moveRank,
  };
}
