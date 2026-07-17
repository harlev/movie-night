import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateStandings, getPointsBreakdown } from './scoring';

const choices = [
  { id: 'a', title: 'Alpha', imageUrl: null },
  { id: 'b', title: 'Beta', imageUrl: null },
  { id: 'c', title: 'Gamma', imageUrl: null },
];

test('generic survey choices use ranked 3/2/1 scoring', () => {
  const standings = calculateStandings(
    [{ ranks: [{ rank: 1, optionId: 'a' }, { rank: 2, optionId: 'b' }, { rank: 3, optionId: 'c' }] }],
    choices,
    3
  );

  assert.equal(standings[0].optionId, 'a');
  assert.equal(standings[0].totalPoints, 3);
  assert.deepEqual(standings[0].rankCounts, [1, 0, 0]);
  assert.equal(standings[1].totalPoints, 2);
  assert.equal(standings[2].totalPoints, 1);
});

test('single-choice surveys award one point', () => {
  const standings = calculateStandings(
    [{ ranks: [{ rank: 1, optionId: 'b' }] }],
    choices,
    1
  );

  assert.equal(standings[0].optionId, 'b');
  assert.deepEqual(getPointsBreakdown(1), [{ rank: 1, points: 1, label: 'Choice' }]);
});

test('equal score vectors are reported as co-winners', () => {
  const standings = calculateStandings([], choices.slice(0, 2), 1);

  assert.equal(standings[0].position, 1);
  assert.equal(standings[0].tied, true);
  assert.equal(standings[1].position, 1);
  assert.equal(standings[1].tied, true);
});
