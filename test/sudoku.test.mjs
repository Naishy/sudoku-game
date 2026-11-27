import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, format, countSolutions, solve, grade, nextPlacement, candidates, conflicts, findStep, rng, randomFull, LEVELS, TECHNIQUES, UNITS } from '../public/js/sudoku.js';
import { PUZZLES } from '../public/js/puzzles.js';

const valid = (g) => UNITS.every((u) => new Set(u.map((i) => g[i])).size === 9 && u.every((i) => g[i] >= 1 && g[i] <= 9));

test('a random full grid is a valid Sudoku', () => {
  const r = rng(7);
  for (let k = 0; k < 20; k++) assert.ok(valid(randomFull(r)));
});

test('the bank: every puzzle has exactly one answer, at its own level', () => {
  for (const [li, level] of LEVELS.entries()) {
    const list = PUZZLES[level];
    assert.ok(list.length >= 365, `${level}: a year of puzzles`);
    assert.equal(new Set(list).size, list.length, `${level}: no repeats`);
    for (const p of list) {
      assert.equal(p.length, 81);
      const g = parse(p);
      assert.equal(countSolutions(g, 2).count, 1, p);
      const r = grade(g);
      assert.ok(r.solved, `${level} solvable by the human solver: ${p}`);
      assert.equal(r.level, li + 1, `${level}: ${p}`);
    }
  }
});

test('gentle puzzles keep plenty of numbers', () => {
  for (const p of PUZZLES.sketch) assert.ok(p.replace(/\./g, '').length >= 36, p);
});

test('hints: from any point on the way, the next number is always right', () => {
  const r = rng(3);
  for (const level of LEVELS) {
    for (const p of PUZZLES[level].slice(0, 12)) {
      const g = parse(p);
      const sol = solve(g);
      // fill in a random part of it, then ask for hints all the way to the end
      for (let i = 0; i < 81; i++) if (!g[i] && r() < 0.3) g[i] = sol[i];
      let n = 0;
      while (g.some((v) => !v)) {
        const h = nextPlacement(g);
        assert.ok(h, `a hint for ${format(g)}`);
        const [i, d] = h.place;
        assert.equal(d, sol[i], `${h.tech} on ${format(g)}`);
        assert.ok(TECHNIQUES[h.tech], h.tech);
        g[i] = d;
        assert.ok(n++ < 81);
      }
    }
  }
});

test('techniques never rule out the answer', () => {
  for (const level of ['composition', 'masterpiece']) {
    for (const p of PUZZLES[level].slice(0, 25)) {
      const g = parse(p);
      const sol = solve(g);
      const cand = candidates(g);
      for (let k = 0; k < 300 && g.some((v) => !v); k++) {
        const s = findStep(g, cand);
        assert.ok(s);
        if (s.place) {
          const [i, d] = s.place; assert.equal(d, sol[i], s.tech);
          g[i] = d; cand[i] = 0;
          for (let j = 0; j < 81; j++) if (j !== i && (Math.floor(j / 9) === Math.floor(i / 9) || j % 9 === i % 9 || (Math.floor(j / 27) === Math.floor(i / 27) && Math.floor((j % 9) / 3) === Math.floor((i % 9) / 3)))) cand[j] &= ~(1 << d);
        } else {
          for (const [i, m] of s.elim) { assert.ok(!(m & (1 << sol[i])), `${s.tech} ruled out the answer`); cand[i] &= ~m; }
        }
      }
    }
  }
});

test('clashes are found', () => {
  const g = parse('11' + '.'.repeat(79));
  assert.deepEqual([...conflicts(g)].sort(), [0, 1]);
});
