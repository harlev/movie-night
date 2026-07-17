import assert from 'node:assert/strict';
import test from 'node:test';
import { reconcileSurveyEntries } from './surveyChoices';

test('reconcileSurveyEntries keeps the existing order, refreshes content, and appends new options', () => {
  const previous = [
    { optionId: 'b', title: 'Old B' },
    { optionId: 'a', title: 'Old A' },
  ];
  const incoming = [
    { optionId: 'a', title: 'New A' },
    { optionId: 'b', title: 'New B' },
    { optionId: 'c', title: 'New C' },
    { optionId: 'd', title: 'New D' },
  ];

  assert.deepEqual(
    reconcileSurveyEntries(previous, incoming, (entries) => [...entries].reverse()),
    [
      { optionId: 'b', title: 'New B' },
      { optionId: 'a', title: 'New A' },
      { optionId: 'd', title: 'New D' },
      { optionId: 'c', title: 'New C' },
    ]
  );
});

test('reconcileSurveyEntries removes choices no longer present', () => {
  assert.deepEqual(
    reconcileSurveyEntries(
      [{ optionId: 'removed' }, { optionId: 'kept' }],
      [{ optionId: 'kept' }]
    ),
    [{ optionId: 'kept' }]
  );
});
