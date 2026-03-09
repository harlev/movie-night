'use client';

import { useEffect, useRef, useState } from 'react';

type BudgetConsumptionBarProps = {
  budgetRemainingLabel: string;
  remainingWidthPercent: number;
  spentWidthPercent: number;
};

const ANIMATION_DURATION_CLASS = 'duration-[800ms]';
const REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export default function BudgetConsumptionBar({
  budgetRemainingLabel,
  remainingWidthPercent,
  spentWidthPercent,
}: BudgetConsumptionBarProps) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const safeRemainingWidthPercent = clampPercent(remainingWidthPercent);
  const safeSpentWidthPercent = clampPercent(spentWidthPercent);
  const shouldShowFinalWidths = prefersReducedMotion || hasAnimated;
  const renderedRemainingWidthPercent = shouldShowFinalWidths ? safeRemainingWidthPercent : 100;
  const renderedSpentWidthPercent = shouldShowFinalWidths ? safeSpentWidthPercent : 0;

  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_MEDIA_QUERY);
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updatePreference);
      return () => mediaQuery.removeEventListener('change', updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || hasAnimated) return;

    const node = barRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasAnimated, prefersReducedMotion]);

  return (
    <div ref={barRef} className="flex h-full w-full">
      <div
        className={`flex h-full min-w-0 items-center justify-center bg-[linear-gradient(90deg,var(--color-primary),var(--color-primary-light))] px-2.5 transition-[width] ${ANIMATION_DURATION_CLASS} ease-out motion-reduce:transition-none`}
        style={{ width: `${renderedRemainingWidthPercent}%` }}
      >
        <span className="truncate whitespace-nowrap text-center text-[11px] font-semibold text-[#1f1508] sm:text-sm">
          {budgetRemainingLabel}
        </span>
      </div>
      <div
        className={`h-full min-w-0 bg-[linear-gradient(90deg,rgba(62,51,39,0.99),rgba(40,33,26,0.99))] transition-[width] ${ANIMATION_DURATION_CLASS} ease-out motion-reduce:transition-none`}
        style={{ width: `${renderedSpentWidthPercent}%` }}
      />
    </div>
  );
}
