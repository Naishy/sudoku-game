// The Christmas gift message. It shows:
//  - straight away when the game is opened from the card's QR code (?card), whatever the date
//  - otherwise once per phone, the first time the game is opened on or after GIFT.showFrom
// Preview any time with ?gift (doesn't use it up).

export const GIFT = {
  showFrom: '2026-12-25', // local date
  heading: 'Happy Christmas, Heidi! 🎄',
  message: [
    'A new Sudoku every morning, at four levels from a gentle Sketch to a fiendish Masterpiece. Take your time: the kettle can wait.',
    'Every grid you finish becomes a painting, in the day\'s colours. Ziggy\'s on hand if you get stuck. By next Christmas you\'ll have a whole exhibition.',
    'Mel\'s doing them too, so the family board will show who\'s quickest. No pressure, darl. ❤️',
  ],
  signature: 'Love from Tim & Mel',
};

const SEEN_KEY = 'gw.giftSeen';
// Read once at load: the address is tidied up afterwards (see main.js).
const PARAMS = new URLSearchParams(location.search);

export const giftPreview = () => PARAMS.has('gift');
export const fromCard = () => PARAMS.has('card');

export function shouldShowGift(now = new Date()) {
  if (giftPreview() || fromCard()) return true;
  try { if (localStorage.getItem(SEEN_KEY) === '1') return false; } catch { /* ignore */ }
  const [y, m, d] = GIFT.showFrom.split('-').map(Number);
  return now >= new Date(y, m - 1, d);
}

export function markGiftSeen() {
  if (giftPreview()) return;
  try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
}
