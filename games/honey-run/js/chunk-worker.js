// Honey Run: builds the countryside off the main thread, a chunk at a
// time, so that laying the line ahead never holds up a frame. Sent a
// chunk's number, it posts back the chunk's meshes as plain numbers.

import { chunkData } from './world.js';

onmessage = (e) => {
  const c = chunkData(e.data);
  postMessage(c, [c.ground.buffer, c.props.buffer, c.metal.buffer]);
};
postMessage('ready');
