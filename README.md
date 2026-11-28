# Grid Works by Heidi

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
- **Playing:** tap a square, then a number. Notes (pencil marks) tidy themselves as you go; matching numbers light up; Undo goes all the way back; a number with no square chosen shows where it already is. A finished row, column or box plays a little run. The clock can be hidden (tap it). The menu fills in or clears all notes, or starts again. Settings: show mistakes (off by default), the clock, colours as you go, tidy notes, matching numbers, sound and vibration. A keyboard works too (numbers, arrows, N for notes, Z to undo, H for a hint).
- **Hints from Ziggy** (Ed and Heidi's cat), who strolls onto the grid (side on, legs going) and sits in an empty square beside the part to look at (never on the hint's squares or where the answer goes), then strolls off when you carry on (`walk.js`). His words show in the bubble below the grid on their own, with no picture of him: he's only ever in one place. He shows you round the guide the same way. The first tap shows where to look and why, in plain words ("In the centre box, the 7 has just one home", or what an X-Wing does); the second fills it in. If a number doesn't fit, Ziggy paws at it first. Each hint takes 12% off the points (never below half).
- **Every grid becomes a painting.** Each number is a colour from the day's palette (Sumac & Pistachio, Emerald, Canberra Autumn, Persian Tiles, Bondi Morning, Lemon Grove…; Christmas Table on 24–26 December), and each level paints differently: Sketch in watercolour, Study as glazed tiles, Composition as a colour field in oils, Masterpiece as Bauhaus-style gouache shapes. The finished work is framed on a gallery wall with a label (*Study in Emerald*, 2026. Glazed tiles. Solved in 12 min.), then hangs in **Works**, the collection. **Share picture** shares it (or downloads it where sharing isn't possible) with its label.
- **Points:** the level's points, scaled by speed against par (twice as fast doubles them; slow never drops below half), less 12% per hint. The board keeps each player's best. `npm run balance` prints the table.
- **Ziggy about the place:** he wanders between two spots on today's page. Tap him and he purrs (a real purr made in code: about 25 soft pulses a second, in breaths out and in; a little buzz on Android; eyes shut). He purrs on the grid too when a hint is filled in, then strolls off and today's note says what he does (`lines.js`, `ziggyPetted`). Now and then he has a wash (licks a paw, or wipes it over his face and ear), and after a while on today's page he curls up for a nap (soon after arriving late at night); tap him and he sits up and purrs. Leave a grid untouched for 90 seconds (`NAP_AFTER_MS` in `main.js`) and he naps on it, on a given number in a finished box if there is one, never in the selected square's row, column or box; anything you do wakes him and he strolls off. Very occasionally he meows, made in code like the purr (`meow` in `audio.js`: a voice sliding from "ee" to "ow", its pitch rising then falling, never two quite alike), with his mouth open: a chirrupy "mrrp" hello now and then when he arrives on today's page, sometimes a sleepy one when you wake him, and at most one proper meow a visit (half the time), when the note says what about. Woken from a nap on the grid, he sometimes grumbles a mrrp before he goes. `Stroll` in `walk.js`; the side-on walk is `drawZiggyWalking` in `ziggy.js`.
- **Together** (two phones, one grid, in the same room): one phone taps **Together** on today's page, picks a level and gets a QR code and a four-letter code. The other phone scans the QR code with its camera (the link, `/?join=CODE`, opens the game and joins the grid, asking for a name only if this phone hasn't given one before), or taps Together and joins with the code. Tap the code in the top bar to see the QR code again; it goes away when the partner arrives. The QR code is drawn by `public/js/vendor/qrcode.js` (qrcode-generator, MIT). Both phones show the same grid live. Each player's numbers are in their own ink (the first player's emerald, the second's rose), and each sees a dashed ring where the other has tapped. Notes, Undo (the last move, whoever made it), the menu and Ziggy's hints are shared. The puzzle is the day's puzzle in disguise (numbers swapped round, rows and columns shuffled), so it needs the same thinking but doesn't give away the solo daily. The finished painting has a small stroke in each player's ink on the squares they filled, and a wall label naming both ("Heidi & Mel"); it hangs in both players' Works. **Pair games never go to the family board** and don't count towards the best. Leave and come back (or lose the wifi) and it rejoins; the room keeps the game for two days.
- **Techniques** (How to play → Techniques): every method Ziggy's hints use, grouped by the level that needs it (Sketch: the two singles; Study: pointing, box and line, pairs; Composition: triples, X-Wings, quads; Masterpiece: XY-Wings, swordfish, XYZ-Wings). Each has what to look for, why it works, and a worked example from a real puzzle: a small grid with the squares that prove it in gold, the notes it rules out crossed through, and a sentence saying what's happening. Every hint has a "How does this work?" link to its method (the clock pauses while you read). **Show me** on each method opens its example as a real grid, and Ziggy walks you through it a step at a time (Next to go on): what to look at (shaded and glowing squares, matching numbers lit up), why it works with the example's own numbers, then your turn to make the move (place the number, or turn on Notes and take out the notes it rules out). A wrong move is undone with a gentle word. It uses the guide's coaching (`coachStep`) with steps made for the technique (`lessonSteps` in `main.js`); nothing is scored or saved, and Back (or "Back to Techniques") returns to the page, and from there to any puzzle you were in the middle of. Not offered from inside a Together game. The examples are made by `npm run examples` (`tools/make-examples.mjs`, into `public/js/examples.js`; don't edit by hand): for each technique, the clearest moment in the bank where it's the easiest next step. A hidden quad never turns up in the bank, so it's explained with the quad. The explanations are `TEACH` in `lines.js`.
- **A guided first go:** first time, "Show me how" walks through a nearly finished grid, with Ziggy as the guide (tap a square, pick the missing number, notes, a hint from Ziggy, then fill the rest and watch it become a painting). "I know Sudoku" skips it; How to play can replay it.

## How it's built

No build step: plain ES modules in `public/`, the board in the DOM (crisp numbers at any size), the paintings and people on canvas.

- `public/js/sudoku.js`: the rules, no DOM. A fast backtracking solver (`countSolutions`) proves each puzzle has one answer; the **human solver** (`grade`, `nextPlacement`) solves the way a person does, easiest technique first: hidden and naked singles, pointing, box/line, naked and hidden pairs, triples and quads, X-Wing, XY-Wing, swordfish, XYZ-Wing. The hardest one a puzzle needs is its level, and the same steps give Ziggy's hints.
- `public/js/puzzles.js`: the bank, 500 puzzles at each level, made by `npm run puzzles` (`tools/make-puzzles.mjs`, seeded, so it makes the same bank every time). Clues come out in symmetric pairs while the puzzle keeps one answer and stays within its level; Study and up must use their level's techniques at least twice. Day 0 is 1 November 2026; the bank lasts until March 2028 before it repeats.
- `public/js/days.js`: levels, today's puzzles and scoring (`LEVEL_INFO`, `CFG`). `painting.js`: the palettes and the four ways of painting. `store.js`: progress, works and settings in `localStorage`. `lines.js`: what's said about Ziggy and what Heidi says. `main.js`: the screens.
- `ziggy.js` (Ziggy, a brown tabby with white paws, drawn in the cast's style: sitting facing you, and walking side on), `audio.js` (each number plays its own note of a marimba-like scale; no noise), `haptics.js` (Android vibration; the iPhone's hidden-switch tap), `carry.js` (an iPhone install keeps the works), `gift.js` (the Christmas present), `telemetry.js` (pilot stats).
- `public/js/pair.js`: Together's rules, no DOM (`PairGame`: seats, moves, shared undo and hints, whose hand placed each square; `pairFromKey`: the disguised puzzle). `together.js`: a phone's live link to its room (reconnects by itself).
- `src/index.js`: the Worker (static files, `POST /api/log`, `/app.webmanifest`, and `/api/pair?code=…`, the Together websocket). `src/pair-room.js`: one Durable Object per Together room (`PAIRS` in `wrangler.jsonc`), holding the game in its own storage (saved every few seconds at most, cleared two days after last use).

```
npm install
npm test          # every puzzle in the bank, the hints, the scoring, saving
npm run balance   # what each level needs, and the points table
npm run examples  # the Techniques page's worked examples (public/js/examples.js)
npm run dev       # http://localhost:8787
npm run icons     # the app icons (Playwright)
npm run card -- --family CODE   # the Christmas card QR code and insert (card/, git-ignored)
```

`?gift` previews the present; `?card` opens it whatever the date; `?notelemetry` turns off the stats for a visit; `?nofamily` skips the scoreboard.

## Pilot stats

Events go to the shared `family-telemetry` database with `game='grid-works'` (always filter by it). They are batched, one row per batch: `open`, `start` (puzzle, level, daily, resumed), `hint` (technique, or mistakes), `finish` (time, hints, points), `leave` (time, numbers filled), Together's `pair-create`, `pair-join`, `pair-qr` (the QR code shown), `pair-join-link` (arrived from it), `pair-start`, `pair-finish` (time, hints, how many squares each player filled) and `pair-leave`, `guide` steps, `learn` (the Techniques page: from where, and which method) and `lesson` (Show me: which method, and the step if left early), `setting`, `works`, `save-picture` (the Share picture button), `ziggy-pet` (with `woke` if he was asleep), `ziggy-nap`, `fill-notes`, and the gift and install moments.

```sql
SELECT json_extract(data, '$.level') AS level, COUNT(*) AS solves,
       ROUND(AVG(json_extract(data, '$.secs')) / 60, 1) AS avg_min, ROUND(AVG(json_extract(data, '$.hints')), 1) AS avg_hints
FROM event_rows WHERE game = 'grid-works' AND type = 'finish' GROUP BY level;
```

## Deploying

Cloudflare Workers Builds on push to `main` (`npx wrangler deploy`). The custom domain `gridworks.tequinox.net` is in `wrangler.jsonc`.
