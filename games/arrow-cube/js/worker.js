// Builds levels off the main thread so the game never stutters.
import { generateLevel } from './generator.js';

self.onmessage = (e) => {
  const { n, mode } = e.data;
  try {
    self.postMessage({ n, mode, level: generateLevel(n, mode) });
  } catch {
    self.postMessage({ n, mode, level: null });
  }
};
