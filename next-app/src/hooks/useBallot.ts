import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

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

export function applyMovieClick(
  prev: Map<number, string>,
  movieId: string,
  maxRankN: number
): { ballot: Map<number, string>; assignedRank: number | null } {
  const entries = Array.from(prev.entries()).sort((a, b) => a[0] - b[0]);
  const existingRank = entries.find(([, selectedMovieId]) => selectedMovieId === movieId)?.[0] ?? null;

  if (existingRank !== null) {
    const compacted = new Map<number, string>();
    entries
      .filter(([, selectedMovieId]) => selectedMovieId !== movieId)
      .forEach(([, selectedMovieId], index) => {
        compacted.set(index + 1, selectedMovieId);
      });

    return { ballot: compacted, assignedRank: null };
  }

  const nextBallot = new Map(prev);
  let targetRank: number | null = null;
  for (let rank = 1; rank <= maxRankN; rank++) {
    if (!nextBallot.has(rank)) {
      targetRank = rank;
      break;
    }
  }

  const assignedRank = targetRank ?? maxRankN;
  nextBallot.set(assignedRank, movieId);
  return { ballot: nextBallot, assignedRank };
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
  const lastChangedRankTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (lastChangedRankTimeoutRef.current) {
        clearTimeout(lastChangedRankTimeoutRef.current);
      }
    };
  }, []);

  const pulseRank = useCallback((rank: number | null) => {
    if (lastChangedRankTimeoutRef.current) {
      clearTimeout(lastChangedRankTimeoutRef.current);
      lastChangedRankTimeoutRef.current = null;
    }

    setLastChangedRank(rank);

    if (rank === null) {
      return;
    }

    lastChangedRankTimeoutRef.current = setTimeout(() => {
      setLastChangedRank(null);
      lastChangedRankTimeoutRef.current = null;
    }, 200);
  }, []);

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
    pulseRank(rank);
  }, [pulseRank]);

  const clearBallot = useCallback(() => {
    setBallot(new Map());
    pulseRank(null);
  }, [pulseRank]);

  const handleMovieClick = useCallback(
    (movieId: string) => {
      if (!isLive) return;

      const result = applyMovieClick(ballot, movieId, maxRankN);
      setBallot(result.ballot);
      pulseRank(result.assignedRank);
    },
    [ballot, isLive, maxRankN, pulseRank]
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
    filledRankItems,
    firstEmptySlot,
    isBallotComplete,
    reorderBallot,
    moveRank,
  };
}
