// Builds Car Park puzzles off the main thread, so the screen never freezes
// while a hard one is being worked out.

import { makePuzzle } from './logic.js';

self.onmessage = (e) => {
  const { mode, n } = e.data;
  self.postMessage({ mode, n, puzzle: makePuzzle(mode, n) });
};
