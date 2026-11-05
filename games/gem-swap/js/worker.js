// Builds Gem Swap levels off the main thread, so the game never stutters
// while the practice player tries out the next level.
import { makeLevel } from './levels.js';

self.onmessage = (e) => {
  const { n } = e.data;
  self.postMessage({ n, level: makeLevel(n) });
};
