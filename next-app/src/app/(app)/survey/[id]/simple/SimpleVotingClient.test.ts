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
