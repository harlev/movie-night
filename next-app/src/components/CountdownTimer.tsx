'use client';

import { useState, useEffect, useRef } from 'react';

interface CountdownTimerProps {
  closesAt: string | null;
  variant?: 'full' | 'compact';
  refreshOnExpired?: boolean;
  onExpired?: () => void;
  className?: string;
}

function getTimeRemaining(closesAt: string) {
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

function getUrgencyClasses(totalMs: number) {
  if (totalMs <= 0) return { digit: 'text-[var(--color-text-muted)]', border: '' };
  if (totalMs < 5 * 60 * 1000) return { digit: 'text-[var(--color-error)] animate-pulse', border: 'border-[var(--color-error)]/30' };
  if (totalMs < 60 * 60 * 1000) return { digit: 'text-[var(--color-warning)]', border: 'border-[var(--color-warning)]/30' };
  return { digit: 'text-[var(--color-primary)]', border: 'border-[var(--color-border)]/30' };
}

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" d="M12 6v6l4 2" />
  </svg>
);

function FullVariant({ closesAt }: { closesAt: string }) {
  const [time, setTime] = useState(() => getTimeRemaining(closesAt));

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeRemaining(closesAt)), 1000);
    return () => clearInterval(interval);
  }, [closesAt]);

  const urgency = getUrgencyClasses(time.total);

  if (time.total <= 0) return null;

  const segments = [
    { value: time.days, label: 'days' },
    { value: time.hours, label: 'hrs' },
    { value: time.minutes, label: 'min' },
    { value: time.seconds, label: 'sec' },
  ];

  return (
    <div className="inline-flex items-center gap-1.5">
      <ClockIcon className={`w-4 h-4 text-[var(--color-primary)]/60 shrink-0`} />
      {segments.map((seg, i) => (
        <div key={seg.label} className="flex items-center gap-1.5">
          {i > 0 && (
            <span className="text-[var(--color-primary)]/40 font-bold animate-countdown-blink">:</span>
          )}
          <div className={`bg-[var(--color-surface-elevated)] rounded-lg px-3 py-1.5 border ${urgency.border || 'border-[var(--color-border)]/30'} text-center`}>
            <div className={`font-mono text-lg font-bold tabular-nums leading-tight ${urgency.digit}`}>
              {String(seg.value).padStart(2, '0')}
            </div>
            <div className="text-[9px] uppercase tracking-widest text-[var(--color-text-muted)] leading-tight">
              {seg.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CompactVariant({ closesAt }: { closesAt: string }) {
  const [time, setTime] = useState(() => getTimeRemaining(closesAt));

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeRemaining(closesAt)), 1000);
    return () => clearInterval(interval);
  }, [closesAt]);

  const urgency = getUrgencyClasses(time.total);

  if (time.total <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5">
      <ClockIcon className="w-3.5 h-3.5 text-[var(--color-primary)]/60 shrink-0" />
      <span className={`font-mono text-sm tabular-nums ${urgency.digit}`}>
        {time.days > 0 && `${String(time.days).padStart(2, '0')}d `}
        {String(time.hours).padStart(2, '0')}h{' '}
        {String(time.minutes).padStart(2, '0')}m{' '}
        {String(time.seconds).padStart(2, '0')}s
      </span>
    </span>
  );
}

export default function CountdownTimer({
  closesAt,
  variant = 'full',
  refreshOnExpired,
  onExpired,
  className,
}: CountdownTimerProps) {
  const expiredHandled = useRef(false);

  useEffect(() => {
    if (!closesAt) return;

    const check = () => {
      const diff = new Date(closesAt).getTime() - Date.now();
      if (diff <= 0 && !expiredHandled.current) {
        expiredHandled.current = true;
        setTimeout(() => {
          if (refreshOnExpired) {
            window.location.reload();
          } else {
            onExpired?.();
          }
        }, 1000);
      }
    };

    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [closesAt, refreshOnExpired, onExpired]);

  if (!closesAt) return null;

  const remaining = getTimeRemaining(closesAt);
  if (remaining.total <= 0) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[var(--color-text-muted)] ${className || ''}`}>
        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Closing...</span>
      </span>
    );
  }

  return (
    <div className={className}>
      {variant === 'full' ? (
        <FullVariant closesAt={closesAt} />
      ) : (
        <CompactVariant closesAt={closesAt} />
      )}
    </div>
  );
}
