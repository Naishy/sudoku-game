# Grid Works

A daily Sudoku for Heidi, where every finished grid becomes a painting. One of Tim's family Christmas games (see the [family games playbook](https://github.com/Naishy/family-games/blob/main/GAMES.md)).

**Live:** https://gridworks.tequinox.net (board id `grid-works` on the [family scoreboard](https://games.tequinox.net)).

## The game

- **Four new puzzles every day**, the same for everyone, at four levels named like the stages of a painting:

  | Level | For | Needs | Points (at par) | Par |
  | --- | --- | --- | --- | --- |
  | Sketch | anyone | only singles: every number can be found by looking (36+ clues) | 100 | 8 min |
  | Study | a little practice | pointing, box/line, pairs | 200 | 12 min |
  | Composition | keen players | triples, X-Wings, quads | 350 | 20 min |
  | Masterpiece | Heidi and Mel | XY-Wings, swordfish, XYZ-Wings | 500 | 30 min |

  Done today's? **Another** at the same level is a tap away.
- **Playing:** tap a square, then a number. Notes (pencil marks) tidy themselves as you go; matching numbers light up; Undo goes all the way back; a number with no square chosen shows where it already is. A finished row, column or box plays a little run. The clock can be hidden (tap it). The menu fills in or clears all notes, or starts again. Settings: show mistakes (off by default), the clock, colours as you go, tidy notes, matching numbers, sound and vibration. A keyboard works too (numbers, arrows, N for notes, Z to undo, H for a hint).
- **Hints from Ziggy** (Ed and Heidi's cat), who sits by the part of the grid to look at. The first tap shows where to look and why, in plain words ("In the centre box, the 7 has just one home", or what an X-Wing does); the second fills it in. If a number doesn't fit, Ziggy paws at it first. Each hint takes 12% off the points (never below half).
- **Every grid becomes a painting.** Each number is a colour from the day's palette (Sumac & Pistachio, Emerald, Canberra Autumn, Persian Tiles, Bondi Morning, Lemon Grove…; Christmas Table on 24–26 December), and each level paints differently: Sketch in watercolour, Study as glazed tiles, Composition as a colour field in oils, Masterpiece as Bauhaus-style gouache shapes. The finished work is framed on a gallery wall with a label (*Study in Emerald*, 2026. Glazed tiles. Solved in 12 min.), then hangs in **Works**, the collection. **Save picture** shares or downloads it with its label.
- **Points:** the level's points, scaled by speed against par (twice as fast doubles them; slow never drops below half), less 12% per hint. The board keeps each player's best. `npm run balance` prints the table.
- **A guided first go:** first time, "Show me how" walks through a nearly finished grid, with Ziggy as the guide (tap a square, pick the missing number, notes, a hint from Ziggy, then fill the rest and watch it become a painting). "I know Sudoku" skips it; How to play can replay it.

## How it's built

No build step: plain ES modules in `public/`, the board in the DOM (crisp numbers at any size), the paintings and people on canvas.

- `public/js/sudoku.js`: the rules, no DOM. A fast backtracking solver (`countSolutions`) proves each puzzle has one answer; the **human solver** (`grade`, `nextPlacement`) solves the way a person does, easiest technique first: hidden and naked singles, pointing, box/line, naked and hidden pairs, triples and quads, X-Wing, XY-Wing, swordfish, XYZ-Wing. The hardest one a puzzle needs is its level, and the same steps give Ziggy's hints.
- `public/js/puzzles.js`: the bank, 500 puzzles at each level, made by `npm run puzzles` (`tools/make-puzzles.mjs`, seeded, so it makes the same bank every time). Clues come out in symmetric pairs while the puzzle keeps one answer and stays within its level; Study and up must use their level's techniques at least twice. Day 0 is 1 November 2026; the bank lasts until March 2028 before it repeats.
- `public/js/days.js`: levels, today's puzzles and scoring (`LEVEL_INFO`, `CFG`). `painting.js`: the palettes and the four ways of painting. `store.js`: progress, works and settings in `localStorage`. `lines.js`: what's said about Ziggy and what Heidi says. `main.js`: the screens.
- `ziggy.js` (Ziggy, a brown tabby with white paws, drawn in the cast's style), `audio.js` (each number plays its own note of a marimba-like scale; no noise), `haptics.js` (Android vibration; the iPhone's hidden-switch tap), `carry.js` (an iPhone install keeps the works), `gift.js` (the Christmas present), `telemetry.js` (pilot stats).
- `src/index.js`: the Worker (static files, `POST /api/log`, `/app.webmanifest`).

```
npm install
npm test          # every puzzle in the bank, the hints, the scoring, saving
npm run balance   # what each level needs, and the points table
npm run dev       # http://localhost:8787
npm run icons     # the app icons (Playwright)
npm run card -- --family CODE   # the Christmas card QR code and insert (card/, git-ignored)
```

`?gift` previews the present; `?card` opens it whatever the date; `?notelemetry` turns off the stats for a visit; `?nofamily` skips the scoreboard.

## Pilot stats

Events go to the shared `family-telemetry` database with `game='grid-works'` (always filter by it). They are batched, one row per batch: `open`, `start` (puzzle, level, daily, resumed), `hint` (technique, or mistakes), `finish` (time, hints, points), `leave` (time, numbers filled), `guide` steps, `setting`, `works`, `save-picture`, `fill-notes`, and the gift and install moments.

```sql
SELECT json_extract(data, '$.level') AS level, COUNT(*) AS solves,
       ROUND(AVG(json_extract(data, '$.secs')) / 60, 1) AS avg_min, ROUND(AVG(json_extract(data, '$.hints')), 1) AS avg_hints
FROM event_rows WHERE game = 'grid-works' AND type = 'finish' GROUP BY level;
```

## Deploying

Cloudflare Workers Builds on push to `main` (`npx wrangler deploy`). The custom domain `gridworks.tequinox.net` is in `wrangler.jsonc`.
