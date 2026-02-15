'use client';

import { useState, useEffect, useCallback } from 'react';

interface MovieDetailClientProps {
  trailerKey: string | null | undefined;
  movieTitle: string;
}

export default function MovieDetailClient({ trailerKey, movieTitle }: MovieDetailClientProps) {
  const [showTrailer, setShowTrailer] = useState(false);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowTrailer(false);
    },
    []
  );

  useEffect(() => {
    if (showTrailer) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showTrailer, handleEscape]);

  if (!trailerKey) return null;

  return (
    <>
      <button
        onClick={() => setShowTrailer(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all duration-150 active:scale-[0.97]"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
            clipRule="evenodd"
          />
        </svg>
        Watch Trailer
      </button>

      {/* Trailer Modal */}
      {showTrailer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in"
          onClick={() => setShowTrailer(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Movie trailer"
        >
          <div
            className="relative w-full max-w-4xl mx-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label="Close trailer"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                title={`${movieTitle} trailer`}
                className="absolute inset-0 w-full h-full rounded-xl"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
