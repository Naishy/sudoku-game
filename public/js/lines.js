// Everything said. Ziggy (Ed and Heidi's cat) gives the guide and the hints, by sitting
// by the part of the grid to look at; the words describe what Ziggy's doing. Friendly and
// matter-of-fact: where to look, never "you got it wrong". Heidi, the gallerist, has the
// last word on each finished work.
import { rowOf, colOf } from './sudoku.js';

const BOX = ['top-left', 'top-middle', 'top-right', 'middle-left', 'centre', 'middle-right', 'bottom-left', 'bottom-middle', 'bottom-right'];
export function unitWords(u) {
  if (u < 9) return `row ${u + 1}`;
  if (u < 18) return `column ${u - 8}`;
  return `the ${BOX[u - 18]} box`;
}
const where = (i) => `row ${rowOf(i) + 1}, column ${colOf(i) + 1}`;
const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];

// what each harder technique means, in a sentence
// how each technique is named in a sentence
const PHRASE = {
  pointing: 'a pointing pair', claiming: 'a box-and-line', nakedPair: 'a pair', hiddenPair: 'a hidden pair',
  nakedTriple: 'a triple', hiddenTriple: 'a hidden triple', xWing: 'an X-Wing', nakedQuad: 'a quad', hiddenQuad: 'a hidden quad',
  xyWing: 'an XY-Wing', swordfish: 'a swordfish', xyzWing: 'an XYZ-Wing',
};
const EXPLAIN = {
  pointing: (s) => `the ${s.digit}s in ${unitWords(s.unit)} sit in one line, so that line has no other ${s.digit}`,
  claiming: (s) => `the ${s.digit}s in ${unitWords(s.unit)} all fall in one box, so the rest of that box can't have one`,
  nakedPair: () => 'two squares share the same two numbers, so their neighbours can\'t have them',
  hiddenPair: () => 'two numbers fit only the same two squares, so those squares are nothing else',
  nakedTriple: () => 'three squares share three numbers, so their neighbours can\'t have them',
  hiddenTriple: () => 'three numbers fit only the same three squares',
  xWing: (s) => `the ${s.digit}s make a rectangle, which rules out other ${s.digit}s in its lines`,
  nakedQuad: () => 'four squares share four numbers between them',
  hiddenQuad: () => 'four numbers fit only the same four squares',
  xyWing: (s) => `three two-number squares make a wing, ruling out the ${s.digit} where both tips can see`,
  swordfish: (s) => `the ${s.digit}s line up across three rows and three columns`,
  xyzWing: (s) => `three squares together rule out the ${s.digit} where all of them can see`,
};

/** Ziggy's first hint: where to look, not the answer. */
export function hintText(h) {
  const [i, d] = h.place;
  if (h.tech === 'hiddenSingle') {
    return pick([
      `Ziggy's curled up by ${unitWords(h.unit)}. There's only one place the ${d} can go in it.`,
      `Ziggy's sitting on ${unitWords(h.unit)}: the ${d} has just one home there.`,
    ]);
  }
  if (h.tech === 'nakedSingle') {
    return pick([
      `Ziggy's sat by the glowing square. Check its row, column and box: only one number fits.`,
      `Ziggy's pawing at the glowing square. Nearly everything's ruled out: just one number left.`,
    ]);
  }
  const via = h.via || h;
  const name = PHRASE[via.tech] || 'a clever trick';
  const why = EXPLAIN[via.tech]?.(via);
  return `Ziggy's found ${name}: ${why}. Then look at the glowing square.`;
}

/** Tap again: she fills it in. */
export function revealText(h) {
  const d = h.place[1];
  const a = d === 8 ? 'an' : 'a';
  return pick([`It's ${a} ${d}. Ziggy purrs: you'd have got there!`, `There: ${a} ${d}. Ziggy purrs.`, `${a === 'an' ? 'An' : 'A'} ${d}. Ziggy purrs: she knew all along.`]);
}

export function mistakeText(n) {
  return n > 1
    ? 'Ziggy\'s pawing at a couple of numbers that don\'t fit yet (glowing). Tap Hint again to take them out.'
    : 'Ziggy\'s pawing at a number that doesn\'t fit yet (glowing). Tap Hint again to take it out.';
}
export const FULL_BUT_WRONG = 'Every square\'s full, but Ziggy isn\'t settled: a number or two doesn\'t fit yet. Tap Hint to find them.';
export const STUCK = 'Ziggy\'s stumped too! Try a guess with notes and see where it leads.';

/** Heidi's line on a finished work. `who` is the player's name, if known. */
export function finishLine(level, { who = null, hints = 0, christmas = false } = {}) {
  if (christmas) return pick(['Happy Christmas! That\'s going on the wall.', 'A Christmas one. Thanks heaps, darl.']);
  const lines = {
    sketch: ['Thanks heaps. That\'s going on the wall.', 'Gorgeous. Time for a coffee.', 'Lovely. A nice gentle one.'],
    study: ['Lovely work, darl.', 'That\'s a good one. Hang it next to the last.', 'Thanks heaps. Very clever.'],
    composition: ['Look at that! You\'re my favourite.', 'Beautiful. That one took some thinking.', 'Gorgeous. Ed, come and look at this!'],
    masterpiece: ['A Masterpiece. Ed, come and look at this!', 'Now that belongs in a gallery.', 'Fiendish, and done. You\'re my favourite.'],
  }[level].slice();
  if (who !== 'Mel') lines.push(level === 'sketch' || level === 'study' ? 'Mel will want to see this one.' : 'Mel\'s going to be jealous of this one.');
  if (hints >= 3) lines.push('Ziggy helped a bit, but it\'s all yours. Lovely.');
  return pick(lines);
}

export function homeNote(doneToday, total) {
  if (doneToday === total) return 'All four hung today. Thanks heaps!';
  if (doneToday === 0) return 'Four new puzzles today. Start wherever you like.';
  return `${doneToday} of ${total} hung today.`;
}

/** What Ziggy does when you tap her on today's page. */
const PETTED = [
  'Ziggy purrs.',
  'Ziggy slow-blinks at you. In cat, that\'s "I love you".',
  'Ziggy headbutts your hand, purring.',
  'Ziggy purrs, then pretends she didn\'t.',
  'Ziggy stretches, one paw at a time.',
  'Ziggy wonders if it\'s dinner time yet.',
  'Ziggy purrs. She likes a good grid.',
];
/** Tapping her on today's page when she's asleep. */
const WOKEN = [
  'Ziggy opens one eye, stretches, and purrs.',
  'Ziggy wakes up, yawns, and purrs anyway.',
  'Ziggy stretches out every claw, then purrs.',
  'Ziggy was only resting her eyes. She purrs.',
];
/** When she comes and naps on a grid that's been left alone. */
const NAPPING = [
  'Ziggy\'s curled up on your grid for a nap. Tap anywhere and she\'ll move.',
  'Ziggy thinks a quiet grid is a good place for a sleep. Tap anywhere to wake her.',
  'Ziggy has settled on the grid, as cats do. She\'ll move when you carry on.',
];
/** When she meows at nothing in particular on today's page. */
const MEOWED = [
  'Ziggy meows. Probably about dinner.',
  'Ziggy meows at the door. Then doesn\'t go out.',
  'Ziggy meows, just to check you\'re still there.',
  'Ziggy meows. She has opinions about the colours today.',
  'Ziggy meows at something only she can see.',
];
export const ziggyMeowed = () => MEOWED[Math.floor(Math.random() * MEOWED.length)];
export const ziggyWoken = () => WOKEN[Math.floor(Math.random() * WOKEN.length)];
export const ziggyNapping = () => NAPPING[Math.floor(Math.random() * NAPPING.length)];
let lastPet = -1;
export function ziggyPetted() {
  let i;
  do i = Math.floor(Math.random() * PETTED.length); while (i === lastPet);
  lastPet = i;
  return PETTED[i];
}
