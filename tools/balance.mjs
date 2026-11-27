// The balance check: what each level's puzzles need (from the human solver), and the
// points for typical times, so the scoring can be checked against real play.
//   npm run balance
import { PUZZLES } from '../public/js/puzzles.js';
import { grade, parse, TECHNIQUES, LEVELS } from '../public/js/sudoku.js';
import { LEVEL_INFO, scoreFor } from '../public/js/days.js';

for (const level of LEVELS) {
  const list = PUZZLES[level];
  const uses = {};
  let clues = 0, steps = 0;
  for (const p of list) {
    clues += p.replace(/\./g, '').length;
    const g = grade(parse(p));
    steps += g.steps;
    for (const [k, v] of Object.entries(g.uses)) if (TECHNIQUES[k].level > 1) uses[k] = (uses[k] || 0) + v;
  }
  const n = list.length;
  const tech = Object.entries(uses).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${TECHNIQUES[k].name} ${(v / n).toFixed(1)}`).join(', ');
  console.log(`\n${LEVEL_INFO[level].name}: ${n} puzzles, ${(clues / n).toFixed(1)} clues on average. Per puzzle: ${tech || 'singles only'}`);
  const par = LEVEL_INFO[level].par;
  const times = [0.5, 0.75, 1, 1.5, 2, 3].map((k) => Math.round(par * k));
  console.log(`  minutes   ${times.map((t) => String(t).padStart(5)).join('')}`);
  for (const h of [0, 1, 3]) console.log(`  ${h} hint${h === 1 ? ' ' : 's'}   ${times.map((t) => String(scoreFor(level, t * 60, h)).padStart(5)).join('')}`);
}
