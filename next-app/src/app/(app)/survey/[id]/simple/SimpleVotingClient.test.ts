import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('SimpleVotingClient gates results behind explicit ballot and results screens', () => {
  const filePath = path.join(
    process.cwd(),
    'src/app/(app)/survey/[id]/simple/SimpleVotingClient.tsx'
  );
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('Back to Dashboard'), true);
  assert.equal(source.includes('Edit My Ballot'), true);
  assert.equal(source.includes('Back to Ballot'), false);
  assert.equal(source.includes("import { useActionState, useEffect, useRef, useState } from 'react';"), false);
  assert.equal(source.includes("import { useRouter } from 'next/navigation';"), true);
  assert.equal(source.includes("view: 'ballot' | 'results';"), true);
  assert.equal(source.includes('resultsPage: 1 | 2;'), true);
  assert.equal(source.includes('showBackToBallot: boolean;'), true);
  assert.equal(source.includes('showSubmittedFlash: boolean;'), true);
  assert.equal(source.includes("viewLabelStyle?: 'pill' | 'eyebrow';"), true);
  assert.equal(source.includes("viewLabelStyle === 'eyebrow'"), true);
  assert.equal(source.includes("if (view === 'ballot')"), true);
  assert.equal(source.includes("if (view === 'results')"), true);
  assert.equal(source.includes('viewLabelStyle="pill"'), false);
  assert.equal(source.includes('viewLabelStyle="eyebrow"'), true);
  assert.equal(source.includes('name="successRedirect"'), true);
  assert.equal(source.includes('value={`/survey/${survey.id}/simple?view=results&submitted=1`}'), true);
  assert.equal(source.includes('?view=results&submitted=1'), true);
  assert.equal(source.includes('router.replace('), true);
  assert.equal(source.includes('?view=results&page=2'), true);
  assert.equal(source.includes('?view=results'), true);
  assert.equal(source.includes('block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]'), true);
  assert.equal(source.includes('Current Standings'), true);
  assert.equal(source.includes('All Ballots'), true);
  assert.equal(source.includes('Ballot submitted successfully. Current standings are now unlocked. You can still edit your ballot until voting closes.'), true);
  assert.equal(source.includes('You already voted. Current standings are visible. You can still edit your ballot until voting closes.'), true);
  assert.equal(source.includes('Submit your ballot to unlock current standings.'), false);
  assert.equal(source.includes('Read-only standings. These rows are informational and do not change your ballot.'), true);
  assert.equal(source.includes('badge: `Ballot`'), false);
  assert.equal(source.includes('variant="full"'), true);
  assert.equal(source.includes('variant="compact"'), true);
  assert.equal(source.includes('onClick={() => handleMovieClick(entry.movie.id)}'), true);
  assert.equal(source.includes('hidden md:block'), true);
  assert.equal(source.includes('md:hidden'), true);
  assert.equal(source.includes('Your Ballot'), false);
  assert.equal(source.includes('SortableBallotList'), false);
  assert.equal(source.includes('Grid view'), false);
  assert.equal(source.includes('List view'), false);
  assert.equal(source.includes('setViewMode('), false);
  assert.equal(source.includes('rounded-[1.5rem] px-4 py-3'), true);
  assert.equal(source.includes('h-16 w-12 rounded-xl'), true);
  assert.equal(source.includes('text-lg leading-tight'), true);
  assert.equal(source.includes("cursor-pointer active:scale-[0.98]'"), true);
  assert.equal(source.includes('aria-label={`Toggle rank for ${entry.movie.title}`}'), true);
  assert.equal(source.includes('desktop'), true);
  assert.equal(source.includes('entries={shuffledEntries}'), true);
  assert.equal(source.includes('handleMovieClick={handleMovieClick}'), true);
  assert.equal(source.includes('isMovieSelected={isMovieSelected}'), true);
  assert.equal(source.includes('moveRank={moveRank}'), true);
  assert.equal(source.includes('showMoveControls'), true);
});

test('SimpleVotingClient keeps mobile-only accessibility affordances for the hidden heading and footer progress', () => {
  const filePath = path.join(
    process.cwd(),
    'src/app/(app)/survey/[id]/simple/SimpleVotingClient.tsx'
  );
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('<h1 className="sr-only">{survey.title}</h1>'), true);
  assert.equal(source.includes('Closes'), true);
  assert.equal(source.includes('aria-live="polite"'), true);
  assert.equal(source.includes('{ballotSize} of {survey.maxRankN} ranks selected.'), true);
  assert.equal(source.includes('aria-hidden="true"'), true);
  assert.equal(source.includes('aria-label={`Rank ${i + 1}`}'), false);
  assert.equal(source.includes('fixed bottom-0 left-0 right-0 z-20'), false);
  assert.equal(source.includes('fixed bottom-0 inset-x-0 z-20'), true);
  assert.equal(source.includes('max-w-2xl mx-auto flex items-center gap-2'), true);
  assert.equal(source.includes('form action={formAction} className="flex-1"'), true);
  assert.equal(source.includes('function CompactBallotActions({'), true);
  assert.equal(source.includes('<CompactBallotActions'), true);
});

test('SimpleVotingClient renders standings as a unified read-only ranking list instead of separate cards', () => {
  const filePath = path.join(
    process.cwd(),
    'src/app/(app)/survey/[id]/simple/SimpleVotingClient.tsx'
  );
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('divide-y divide-[var(--color-border)]/35'), true);
  assert.equal(source.includes('grid grid-cols-[auto_auto_1fr_auto] items-center gap-2.5 px-4 py-2.5'), true);
  assert.equal(
    source.includes(
      'cursor-default flex items-center gap-3 rounded-xl border-l-4 bg-[var(--color-surface-elevated)] p-3'
    ),
    false
  );
  assert.equal(source.includes('w-10 h-15 object-cover rounded-lg'), false);
  assert.equal(source.includes('text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]'), false);
  assert.equal(source.includes('whitespace-nowrap text-sm font-display font-semibold'), true);
  assert.equal(source.includes('truncate text-sm font-medium'), false);
  assert.equal(source.includes('text-sm font-medium leading-tight text-[var(--color-text)] sm:text-base'), true);
});

test('SimpleVotingClient keeps standings rows aligned when a movie has no poster', () => {
  const filePath = path.join(
    process.cwd(),
    'src/app/(app)/survey/[id]/simple/SimpleVotingClient.tsx'
  );
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('function StandingsPoster({'), true);
  assert.equal(source.includes('const [hasImageError, setHasImageError] = useState(false);'), true);
  assert.equal(source.includes('onError={() => setHasImageError(true)}'), true);
  assert.equal(
    source.includes('shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'),
    true
  );
  assert.equal(
    source.includes('absolute inset-[1px] rounded-[5px] border border-white/5'),
    true
  );
  assert.equal(
    source.includes('className="h-4 w-4 text-[var(--color-primary)]/22"'),
    true
  );
  assert.equal(
    source.includes('d="M8 8.25h8M8 10.75h5.5"'),
    true
  );
  assert.equal(source.includes('<StandingsPoster'), true);
  assert.equal(source.includes('posterPath={standing.posterPath}'), true);
  assert.equal(source.includes('title={standing.title}'), true);
});

test('SimpleVotingClient makes lower ranks and tie labels quieter in the standings list', () => {
  const filePath = path.join(
    process.cwd(),
    'src/app/(app)/survey/[id]/simple/SimpleVotingClient.tsx'
  );
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('standing.position <= 3'), true);
  assert.equal(
    source.includes(
      "border border-[var(--color-border)]/30 bg-[var(--color-surface-elevated)]/30 text-[var(--color-text-muted)]/60"
    ),
    true
  );
  assert.equal(
    source.includes('ml-1 whitespace-nowrap align-middle text-[11px] text-[var(--color-text-muted)]/65'),
    true
  );
  assert.equal(source.includes('text-xs text-[var(--color-text-muted)]'), false);
  assert.equal(source.includes("const pointLabel = standing.totalPoints === 1 ? 'pt' : 'pts';"), true);
});
