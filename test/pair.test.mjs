import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PairGame, pairKey, pairFromKey, disguise, isCode, newCode, cleanName, encodeHands, decodeHands } from '../public/js/pair.js';
import { LEVELS, parse, countSolutions, grade, format } from '../public/js/sudoku.js';
import { PUZZLES } from '../public/js/puzzles.js';
import { dailyIndex } from '../public/js/days.js';

const LEVEL_NO = { sketch: 1, study: 2, composition: 3, masterpiece: 4 };

test('the pair puzzle is the day\'s puzzle in disguise: one answer, the same level, but not the same grid', () => {
  for (const level of LEVELS) {
    for (const day of [0, 27, 55, 499]) {
      const f = pairFromKey(pairKey(level, day));
      assert.equal(f.level, level);
      assert.equal(f.day, day);
      const daily = PUZZLES[level][dailyIndex(level, day)];
      assert.notEqual(f.puzzle, daily);
      const g = parse(f.puzzle);
      assert.equal(countSolutions(g, 2).count, 1, `${level} ${day}: one answer`);
      assert.equal(g.filter(Boolean).length, parse(daily).filter(Boolean).length, 'same number of clues');
      assert.equal(grade(g).level, grade(parse(daily)).level, `${level} ${day}: same thinking`);
      assert.ok(grade(g).level <= LEVEL_NO[level]);
    }
  }
  assert.equal(disguise(PUZZLES.study[3], 'x'), disguise(PUZZLES.study[3], 'x'), 'the same every time');
  assert.equal(pairFromKey('t12'), null);
  assert.equal(pairFromKey('pq3'), null);
});

test('codes and names', () => {
  for (let i = 0; i < 200; i++) assert.ok(isCode(newCode()));
  assert.ok(!isCode('ABIO'));
  assert.ok(!isCode('abcd'));
  assert.equal(cleanName('  Mel  '), 'Mel');
  assert.equal(cleanName('<b>Ed</b>'), 'bEdb');
  assert.equal(cleanName(''), null);
  assert.equal(cleanName('x'.repeat(40)).length, 20);
  const by = new Int8Array(81); by[3] = 1; by[80] = 2;
  assert.deepEqual(Array.from(decodeHands(encodeHands(by))), Array.from(by));
});

function pair(level = 'study', day = 27) {
  const g = new PairGame({ key: pairKey(level, day) });
  assert.equal(g.join('heidi-phone', 'Heidi').seat, 1);
  assert.equal(g.join('mel-phone-1', 'Mel').seat, 2);
  return g;
}
const empties = (g) => g.givens.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);

test('two seats; a third phone is turned away, and a phone finds its seat again', () => {
  const g = pair();
  assert.equal(g.join('someone-else', 'Ed').why, 'full');
  assert.equal(g.join('mel-phone-1', '').seat, 2);
  assert.equal(g.players[1].name, 'Mel', 'keeps the name');
  assert.equal(g.join('bad id!', 'x').ok, false);
});

test('each number remembers whose hand placed it; notes, erase and shared undo', () => {
  const g = pair();
  const [a, b] = empties(g);
  assert.ok(g.apply(1, { t: 'place', i: a, d: g.solution[a] }).ok);
  assert.ok(g.apply(2, { t: 'place', i: b, d: g.solution[b] }).ok);
  assert.equal(g.by[a], 1);
  assert.equal(g.by[b], 2);
  assert.equal(g.view().by[b], '2');
  assert.equal(g.last.seat, 2);
  // over-writing someone else's number makes it yours
  const other = g.solution[a] % 9 + 1;
  g.apply(2, { t: 'place', i: a, d: other });
  assert.equal(g.by[a], 2);
  // undo is shared: takes back the last move, whoever made it
  g.apply(1, { t: 'undo' });
  assert.equal(g.values[a], g.solution[a]);
  assert.equal(g.by[a], 1);
  // can't touch a given
  const given = g.givens.findIndex(Boolean);
  assert.equal(g.apply(1, { t: 'place', i: given, d: 1 }).ok, false);
  // notes toggle; placing tidies them away round about
  const c = empties(g)[2];
  g.apply(1, { t: 'note', i: c, d: 5 });
  assert.ok(g.notes[c] & (1 << 5));
  g.apply(2, { t: 'erase', i: c });
  assert.equal(g.notes[c], 0);
  assert.equal(g.apply(3, { t: 'undo' }).ok, false, 'no seat 3');
});

test('Ziggy\'s hints are shared: where to look, then fill it in, counted once each', () => {
  const g = pair('composition', 40);
  g.apply(1, { t: 'hint' });
  assert.ok(g.pending?.h, 'a hint to look at');
  assert.equal(g.hints, 1);
  const [i, d] = g.pending.h.place;
  g.apply(2, { t: 'hint' }); // the other player fills it in
  assert.equal(g.values[i], d);
  assert.equal(g.by[i], 2);
  assert.equal(g.last.kind, 'reveal');
  assert.equal(g.pending, null);
  // a wrong number comes first
  const e = empties(g).find((j) => !g.values[j]);
  g.apply(1, { t: 'place', i: e, d: g.solution[e] % 9 + 1 });
  g.apply(1, { t: 'hint' });
  assert.deepEqual(g.pending.wrong, [e]);
  g.apply(1, { t: 'hint' });
  assert.equal(g.values[e], 0);
  assert.equal(g.hints, 2);
  // any other move puts the hint away
  g.apply(1, { t: 'hint' });
  assert.ok(g.pending);
  g.apply(2, { t: 'note', i: empties(g).find((j) => !g.values[j]), d: 1 });
  assert.equal(g.pending, null);
});

test('finishing together, and the room\'s game survives being saved', () => {
  const g = pair('sketch', 3);
  const list = empties(g);
  list.forEach((i, k) => { if (k < list.length - 1) g.apply(k % 2 ? 2 : 1, { t: 'place', i, d: g.solution[i] }); });
  assert.equal(g.done, false);
  const saved = JSON.parse(JSON.stringify(g.toJSON()));
  const h = PairGame.fromJSON(saved);
  assert.equal(format(h.values), format(g.values));
  assert.equal(encodeHands(h.by), encodeHands(g.by));
  assert.equal(h.join('mel-phone-1').seat, 2);
  assert.ok(h.apply(1, { t: 'undo' }).ok, 'undo survives too');
  h.apply(1, { t: 'undo' });
  const last = list[list.length - 1];
  g.apply(2, { t: 'place', i: last, d: g.solution[last] });
  assert.equal(g.done, true);
  assert.equal(g.apply(1, { t: 'undo' }).ok, false, 'finished is finished');
  const hands = g.view().by;
  assert.ok(hands.includes('1') && hands.includes('2'));
});

test('a Together grid is forgotten on the phone once its room would have gone (two days unused)', async () => {
  const { stalePairing, PAIR_KEEP_MS } = await import('../public/js/store.js');
  const now = Date.UTC(2026, 11, 3, 12);
  assert.equal(stalePairing(null, now), false);
  assert.equal(stalePairing({ code: 'ABCD', key: 'ps1', at: now - 3600e3 }, now), false, 'an hour ago: still there');
  assert.equal(stalePairing({ code: 'ABCD', key: 'ps1', at: now - PAIR_KEEP_MS + 60e3 }, now), false, 'just under two days');
  assert.equal(stalePairing({ code: 'ABCD', key: 'ps1', at: now - PAIR_KEEP_MS - 60e3 }, now), true, 'over two days: gone');
  assert.equal(stalePairing({ code: 'ABCD', key: 'ps1' }, now), false, 'no date yet (from before): kept, and dated on the home page');
});
