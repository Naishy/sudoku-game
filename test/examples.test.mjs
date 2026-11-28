import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXAMPLES } from '../public/js/examples.js';
import { TECHNIQUES, parse, findStep, solve, PEERS, digitsOf } from '../public/js/sudoku.js';
import { decodeNotes } from '../public/js/store.js';
import { TEACH, exampleText } from '../public/js/lines.js';

test('every technique is explained, and all but the rare hidden quad have a worked example', () => {
  assert.deepEqual(Object.keys(TEACH).sort(), Object.keys(TECHNIQUES).filter((t) => t !== 'hiddenQuad').sort());
  for (const t of Object.keys(TEACH)) assert.ok(EXAMPLES[t], `${t} has an example`);
});

test('each worked example is real: its technique is the easiest next step, and it\'s right', () => {
  for (const [t, ex] of Object.entries(EXAMPLES)) {
    const g = parse(ex.grid);
    const cand = decodeNotes(ex.notes);
    const s = findStep(g, cand, 4);
    assert.equal(s.tech, t, `${t}: the solver finds the same step`);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), ex.step);
    // the notes never rule out the true answer, and what the step does agrees with it
    const sol = solve(g);
    assert.ok(sol, `${t}: the grid still has an answer`);
    for (let i = 0; i < 81; i++) if (!g[i]) assert.ok(cand[i] & (1 << sol[i]), `${t}: square ${i} keeps its answer in the notes`);
    if (s.place) assert.equal(sol[s.place[0]], s.place[1]);
    else for (const [i, m] of s.elim) assert.equal(m & (1 << sol[i]), 0, `${t}: never rules out the answer`);
    for (const i of s.cells || []) for (const p of PEERS[i]) assert.ok(p !== i);
    const text = exampleText(t, { ...s, masks: cand, keep: 0, lines: 'rows' }, digitsOf);
    assert.ok(text.startsWith('Here:'), `${t} has a caption`);
  }
});
