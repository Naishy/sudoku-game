import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seatNear } from '../public/js/walk.js';

test('Ziggy sits in an empty square beside the hint, never on it', () => {
  const values = new Array(81).fill(5);
  const notes = new Int16Array(81);
  for (const i of [10, 11, 40]) values[i] = 0;
  // the hint is about square 40; 10 and 11 are empty but far away, so a nearby empty square wins
  values[41] = 0;
  assert.equal(seatNear(values, notes, [40], new Set([40]), 40), 41);
  // prefers a square without notes
  values[39] = 0; notes[41] = 6;
  assert.equal(seatNear(values, notes, [40], new Set([40]), 40), 39);
});

test('with nothing empty nearby she sits on a filled square outside the target\'s row, column and box', () => {
  const values = new Array(81).fill(5);
  values[2] = 0; values[80] = 0;
  const seat = seatNear(values, new Int16Array(81), [2], new Set([2]), 2);
  assert.notEqual(seat, 2);
  const row = (i) => Math.floor(i / 9), col = (i) => i % 9, box = (i) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3);
  assert.ok(row(seat) !== 0 && col(seat) !== 2 && box(seat) !== 0, `seat ${seat}`);
});
