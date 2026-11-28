// Makes the worked examples for the Techniques page (public/js/examples.js): for each
// technique, a real moment from a puzzle in the bank where it's the easiest next step,
// with the grid and the pencil marks as a careful solver would have them. Clear ones are
// preferred: few squares involved and few marks ruled out.
//
//   node tools/make-examples.mjs
import { writeFileSync } from 'node:fs';
import { PUZZLES } from '../public/js/puzzles.js';
import { LEVELS, TECHNIQUES, parse, format, candidates, findStep, PEERS, bit, popcount } from '../public/js/sudoku.js';
import { encodeNotes } from '../public/js/store.js';

const SCAN = 500; // puzzles per level to look through (all of them)

function apply(g, cand, s) {
  if (s.place) {
    const [i, d] = s.place;
    g[i] = d;
    cand[i] = 0;
    for (const p of PEERS[i]) cand[p] &= ~bit(d);
  } else for (const [i, m] of s.elim) cand[i] &= ~m;
}

// smaller is clearer
function clarity(s, g) {
  const elims = s.elim ? s.elim.reduce((n, [, m]) => n + popcount(m), 0) : 0;
  const filled = g.filter(Boolean).length; // a fuller grid is easier to read
  return (s.cells?.length || 1) * 3 + elims * 2 + (s.elim && elims > 4 ? 10 : 0) - filled / 20;
}

const best = {};
for (const level of LEVELS) {
  for (const puzzle of PUZZLES[level].slice(0, SCAN)) {
    const g = parse(puzzle);
    const cand = candidates(g);
    for (let n = 0; n < 200 && !g.every(Boolean); n++) {
      const s = findStep(g, cand, 4);
      if (!s) break;
      const score = clarity(s, g);
      if (!best[s.tech] || score < best[s.tech].score) {
        best[s.tech] = { score, grid: format(g), notes: encodeNotes(cand), step: JSON.parse(JSON.stringify(s)) };
      }
      apply(g, cand, s);
    }
  }
}

// A hidden quad never turns up as the easiest step in the bank (it's very rare): the
// Techniques page explains it alongside the quad instead.
const RARE = ['hiddenQuad'];
const missing = Object.keys(TECHNIQUES).filter((t) => !best[t] && !RARE.includes(t));
if (missing.length) throw new Error(`no example for ${missing.join(', ')}`);

const out = Object.fromEntries(Object.keys(TECHNIQUES).filter((t) => best[t]).map((t) => [t, { grid: best[t].grid, notes: best[t].notes, step: best[t].step }]));
writeFileSync(new URL('../public/js/examples.js', import.meta.url), `// Worked examples for the Techniques page, made by tools/make-examples.mjs (don't edit by
// hand): for each technique, a moment from a real puzzle where it's the easiest next step.
// grid: the numbers so far (. for empty); notes: the pencil marks (store.js's encoding);
// step: what the human solver found (sudoku.js).
export const EXAMPLES = ${JSON.stringify(out, null, 1).replace(/\n\s*/g, ' ')};
`);
for (const t of Object.keys(out)) console.log(t.padEnd(13), 'cells', best[t].step.cells?.length, 'elims', best[t].step.elim?.length ?? '-', 'score', best[t].score.toFixed(1));
