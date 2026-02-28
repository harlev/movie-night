import type { ReactNode } from 'react';
import MovieTrailerButton from './MovieTrailerButton';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export interface MovieDetailsMetadata {
  posterPath: string | null;
  releaseDate: string | null;
  overview: string | null;
  voteAverage: number | null;
  genres: string[];
  trailerKey?: string | null;
  imdbId?: string | null;
  runtime?: number | null;
}

interface MovieDetailsCardProps {
  title: string;
  metadata: MovieDetailsMetadata | null | undefined;
  primaryAction?: ReactNode;
  footer?: ReactNode;
}

export default function MovieDetailsCard({ title, metadata, primaryAction, footer }: MovieDetailsCardProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl overflow-hidden border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
      <div className="md:flex">
        <div className="md:w-1/3">
          {metadata?.posterPath ? (
            <img
              src={`${TMDB_IMAGE_BASE}${metadata.posterPath}`}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full aspect-[2/3] bg-[var(--color-surface-elevated)] flex items-center justify-center">
              <svg className="w-12 h-12 text-[var(--color-text-muted)]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 8h20M2 16h20" />
                <path d="M6 4v4M6 16v4M18 4v4M18 16v4" />
              </svg>
            </div>
          )}
        </div>
        <div className="p-6 md:flex-1">
          <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">{title}</h1>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
            {metadata?.releaseDate && (
              <span className="text-[var(--color-text-muted)]">
                {metadata.releaseDate.slice(0, 4)}
              </span>
            )}
            {metadata?.runtime ? (
              <span className="text-[var(--color-text-muted)]">
                {Math.floor(metadata.runtime / 60)}h {metadata.runtime % 60}m
              </span>
            ) : null}
            {metadata?.voteAverage ? (
              <span className="inline-flex items-center gap-1 text-[var(--color-warning)] bg-[var(--color-warning)]/10 px-2.5 py-0.5 rounded-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {metadata.voteAverage.toFixed(1)}
              </span>
            ) : null}
          </div>

          {metadata?.genres && metadata.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {metadata.genres.map((genre) => (
                <span
                  key={genre}
                  className="text-xs px-2.5 py-1 rounded-lg bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]/30"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {metadata?.overview && (
            <p className="text-[var(--color-text-muted)] mt-4 leading-relaxed">{metadata.overview}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <MovieTrailerButton
              trailerKey={metadata?.trailerKey || null}
              movieTitle={title}
            />
            {metadata?.imdbId && (
              <a
                href={`https://www.imdb.com/title/${metadata.imdbId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5C518] hover:bg-[#E0B000] text-black text-sm font-medium rounded-xl transition-all duration-150 active:scale-[0.97]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.31 9.588v.005c-.077-.048-.227-.07-.42-.07v4.815c.27 0 .44-.06.5-.165.062-.105.093-.39.093-.855v-2.98c0-.345-.013-.575-.04-.69a.534.534 0 0 0-.133-.26zM22.416 0H1.584C.708 0 0 .708 0 1.584v20.832C0 23.292.708 24 1.584 24h20.832c.876 0 1.584-.708 1.584-1.584V1.584C24 .708 23.292 0 22.416 0zM4.8 18.372H2.4V5.676h2.4v12.696zm6.6 0H9.6l-.024-7.164-.936 7.164H7.32l-.984-6.984-.024 6.984H4.92V5.676h2.52c.104.56.204 1.164.312 1.824l.348 2.016.6-3.84h2.7v12.696zm5.52-3.96c0 .636-.024 1.104-.06 1.404-.04.296-.144.564-.312.804a1.63 1.63 0 0 1-.744.588c-.312.12-.744.18-1.308.18H12.6V5.676h2.04c.496 0 .876.036 1.14.12.264.08.48.216.648.408.168.188.28.396.324.624.048.228.072.612.072 1.152v5.028l-.004.004zm4.68.48c0 .636-.06 1.08-.18 1.332a1.601 1.601 0 0 1-.828.756c-.132.06-.42.096-.54.096-.18 0-.36-.036-.54-.108-.18-.076-.312-.18-.396-.312l-.024.348H18V5.676h1.92v4.356c.168-.22.38-.384.636-.492.252-.108.384-.108.636-.108.3 0 .564.06.792.18.228.12.396.288.504.504.108.22.172.44.2.664.024.22.036.564.036 1.032v3.6l-.004.004z" />
                </svg>
                IMDb
              </a>
            )}
            {primaryAction}
          </div>

          {footer && (
            <div className="mt-6 pt-4 border-t border-[var(--color-border)]/50 flex items-center justify-between">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
