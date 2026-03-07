'use client';

import { useCallback, useState } from 'react';
import NominateMovieButton from '@/components/movies/NominateMovieButton';
import Toast from '@/components/ui/Toast';

interface NominateMovieActionProps {
  movieId: string;
  nominated: boolean;
  nominationCount: number;
}

export default function NominateMovieAction({
  movieId,
  nominated,
  nominationCount,
}: NominateMovieActionProps) {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const handleWarning = useCallback((message: string) => {
    setWarningMessage(message);
  }, []);

  const clearWarning = useCallback(() => {
    setWarningMessage(null);
  }, []);

  return (
    <>
      <Toast
        message={warningMessage}
        onClose={clearWarning}
        variant="warning"
      />
      <NominateMovieButton
        movieId={movieId}
        nominated={nominated}
        nominationCount={nominationCount}
        onWarning={handleWarning}
      />
    </>
  );
}
