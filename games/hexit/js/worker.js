// Builds the big Hexit boards off the main thread.
import { makeLevel } from './levels.js';

self.onmessage = (e) => {
  const { n, mode } = e.data;
  self.postMessage({ n, mode, level: makeLevel(n, mode) });
};
