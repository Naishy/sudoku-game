// Makes the puzzle bank (public/js/puzzles.js): COUNT puzzles at each level, each with
// exactly one answer, graded by the human solver. The bank is seeded, so running this
// again makes the same puzzles. Everyone gets the same puzzle each day (see days.js).
//
//   node tools/make-puzzles.mjs [count=500]
//
// The work is split into shards (a level and a seed each), four processes at a time.
import { fork } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { makePuzzle, rng, grade, parse, TECHNIQUES, LEVELS } from '../public/js/sudoku.js';

// a puzzle must use its level's techniques more than once, so it isn't just one trick
const ENOUGH = { sketch: 0, study: 2, composition: 2, masterpiece: 2 };
const SEED = { sketch: 101, study: 202, composition: 303, masterpiece: 404 };

const SHARDS = 4;

if (process.argv[2] === '--level') {
  const level = process.argv[3];
  const count = Number(process.argv[4]);
  const shard = Number(process.argv[5]);
  const lv = LEVELS.indexOf(level) + 1;
  const rnd = rng(SEED[level] * 100 + shard);
  const out = [];
  const seen = new Set();
  while (out.length < count) {
    const p = makePuzzle(level, rnd);
    if (!p || seen.has(p)) continue;
    const g = grade(parse(p));
    const hard = Object.entries(g.uses).filter(([k]) => TECHNIQUES[k].level === lv).reduce((n, [, v]) => n + v, 0);
    if (hard < ENOUGH[level]) continue;
    seen.add(p);
    out.push(p);
    if (out.length % 25 === 0) process.send({ progress: [level, shard, out.length] });
  }
  process.send({ level, shard, out });
} else {
  const count = Number(process.argv[2] || 500);
  const bank = Object.fromEntries(LEVELS.map((l) => [l, []]));
  // the slow level first, so the pool finishes together
  const jobs = [];
  for (const level of ['composition', 'masterpiece', 'study', 'sketch']) {
    for (let shard = 0; shard < SHARDS; shard++) jobs.push({ level, shard, n: Math.ceil(count / SHARDS) });
  }
  const parts = {};
  const run = (job) => new Promise((resolve, reject) => {
    const child = fork(new URL(import.meta.url).pathname, ['--level', job.level, String(job.n), String(job.shard)]);
    child.on('message', (m) => {
      if (m.progress) console.log(...m.progress);
      else { parts[`${m.level}:${m.shard}`] = m.out; child.kill(); resolve(); }
    });
    child.on('error', reject);
  });
  const worker = async () => { while (jobs.length) await run(jobs.shift()); };
  await Promise.all(Array.from({ length: 4 }, worker));
  // shards in turn, so the days alternate between them; no repeats
  for (const level of LEVELS) {
    const seen = new Set();
    for (let k = 0; bank[level].length < count; k++) {
      let any = false;
      for (let shard = 0; shard < SHARDS; shard++) {
        const p = parts[`${level}:${shard}`][k];
        if (p === undefined) continue;
        any = true;
        if (!seen.has(p) && bank[level].length < count) { seen.add(p); bank[level].push(p); }
      }
      if (!any) break;
    }
  }
  const body = LEVELS.map((l) => `  ${l}: [\n${bank[l].map((p) => `    '${p}',`).join('\n')}\n  ],`).join('\n');
  writeFileSync(new URL('../public/js/puzzles.js', import.meta.url), `// The puzzle bank, made by tools/make-puzzles.mjs (don't edit by hand): ${count} at each level,
// each with exactly one answer. A dot is an empty square.
export const PUZZLES = {
${body}
};
`);
  console.log('wrote public/js/puzzles.js');
}
