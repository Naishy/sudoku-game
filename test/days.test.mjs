import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, LEVEL_INFO, dayNumber, dateOfDay, dailyIndex, extraIndex, keyOf, fromKey, scoreFor, clock } from '../public/js/days.js';
import { PALETTES, paletteFor, titleOf } from '../public/js/painting.js';
import { encodeWork, decodeWork, mergeWorks, encodeNotes, decodeNotes } from '../public/js/store.js';
import { merge, encode, decode } from '../public/js/carry.js';

test('days: the same puzzle all day, a new one tomorrow, and dates round-trip', () => {
  const a = dayNumber(new Date(2026, 11, 25, 0, 5));
  assert.equal(a, dayNumber(new Date(2026, 11, 25, 23, 55)));
  assert.equal(dayNumber(new Date(2026, 11, 26, 0, 1)), a + 1);
  assert.equal(dateOfDay(a).getDate(), 25);
  assert.notEqual(dailyIndex('study', a), dailyIndex('study', a + 1));
});

test('keys and extra puzzles', () => {
  const k = keyOf('masterpiece', 42);
  assert.equal(k, 'm42');
  assert.equal(fromKey(k).level, 'masterpiece');
  assert.equal(fromKey('q1'), null);
  assert.equal(new Set(LEVELS.map((l) => keyOf(l, 3))).size, 4, 'every level has its own key');
  for (const l of LEVELS) assert.equal(fromKey(keyOf(l, 3)).level, l);
  const day = 30;
  const e = extraIndex('sketch', day, new Set());
  assert.notEqual(e, dailyIndex('sketch', day));
  assert.notEqual(extraIndex('sketch', day, new Set([keyOf('sketch', e)])), e);
});

test('scoring: harder and faster score more, hints a little less, slow still counts', () => {
  for (const l of LEVELS) {
    const par = LEVEL_INFO[l].par * 60;
    assert.equal(scoreFor(l, par), LEVEL_INFO[l].base);
    assert.ok(scoreFor(l, par / 2) > scoreFor(l, par));
    assert.ok(scoreFor(l, par, 1) < scoreFor(l, par));
    assert.equal(scoreFor(l, par * 10), LEVEL_INFO[l].base / 2);
  }
  assert.ok(scoreFor('masterpiece', 40 * 60) > scoreFor('sketch', 3 * 60), 'a slow Masterpiece beats a quick Sketch');
  assert.equal(clock(75), '1:15');
  assert.equal(clock(3725), '1:02:05');
});

test('palettes: nine different colours each', () => {
  for (const p of PALETTES) {
    assert.equal(p.colours.length, 9, p.name);
    assert.equal(new Set(p.colours).size, 9, p.name);
    for (const c of p.colours) assert.match(c, /^#[0-9a-f]{6}$/);
  }
  assert.equal(PALETTES[paletteFor(54, new Date(2026, 11, 25))].name, 'Christmas Table');
  assert.equal(titleOf('study', 1), 'Study in Emerald');
});

test('saving: works and notes round-trip; merging keeps every work and the better score', () => {
  const w = { key: 'c12', day: 54, secs: 812, hints: 1, score: 301, palette: 3 };
  assert.deepEqual(decodeWork(encodeWork(w)), w);
  const notes = new Int16Array(81); notes[5] = 0b1010000110; notes[80] = 0b1111111110;
  assert.deepEqual(Array.from(decodeNotes(encodeNotes(notes))), Array.from(notes));
  const m = mergeWorks([w, { ...w, key: 's1', score: 90 }], [{ ...w, score: 350 }, { ...w, key: 'm2' }]);
  assert.equal(m.length, 3);
  assert.equal(m.find((x) => x.key === 'c12').score, 350);
});

test('installing on an iPhone carries the works across', () => {
  const have = { 'gw.works': encodeWork({ key: 's1', day: 40, secs: 100, hints: 0, score: 120, palette: 0 }), 'gw.best': '120' };
  const carried = decode(encode({ 'gw.works': encodeWork({ key: 'm3', day: 41, secs: 1500, hints: 0, score: 600, palette: 1 }), 'gw.best': '600', 'gw.inducted': '1' }));
  const out = merge(have, carried);
  assert.equal(out['gw.best'], '600');
  assert.equal(out['gw.inducted'], '1');
  assert.equal(out['gw.works'].split(',').length, 2);
  assert.deepEqual(merge(carried, have)['gw.best'], undefined, 'a lower best never replaces a higher one');
});
