import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seatNear, napSeat } from '../public/js/walk.js';

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

test('with nothing empty nearby he sits on a filled square outside the target\'s row, column and box', () => {
  const values = new Array(81).fill(5);
  values[2] = 0; values[80] = 0;
  const seat = seatNear(values, new Int16Array(81), [2], new Set([2]), 2);
  assert.notEqual(seat, 2);
  const row = (i) => Math.floor(i / 9), col = (i) => i % 9, box = (i) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3);
  assert.ok(row(seat) !== 0 && col(seat) !== 2 && box(seat) !== 0, `seat ${seat}`);
});

test('napping, he picks a given number in a finished box, clear of the selected square', () => {
  const givens = new Array(81).fill(0), values = new Array(81).fill(0);
  // box 4 (the centre) is finished; a few givens elsewhere
  for (const i of [30, 31, 32, 39, 40, 41, 48, 49, 50]) values[i] = 1;
  for (const i of [31, 40, 49, 0, 80, 60]) { givens[i] = 1; values[i] = 1; }
  const all = new Set();
  for (let n = 0; n < 3; n++) all.add(napSeat(values, givens, -1, () => n));
  assert.deepEqual([...all].sort((a, b) => a - b), [31, 40, 49]);
  // with square 40's row selected, only the givens off that row, column and box are left
  const seat = napSeat(values, givens, 36, () => 0);
  assert.ok(givens[seat] && ![36, 37, 38, 39, 40, 41, 42, 43, 44].includes(seat) && seat % 9 !== 0, `seat ${seat}`);
});

test('groomPose lifts the paw and puts it back down', async () => {
  const { groomPose } = await import('../public/js/ziggy.js');
  for (const kind of ['paw', 'face']) {
    assert.equal(groomPose(kind, 0).lift, 0);
    assert.equal(groomPose(kind, 1).lift, 0);
    assert.equal(groomPose(kind, 0.5).lift, 1);
  }
});
