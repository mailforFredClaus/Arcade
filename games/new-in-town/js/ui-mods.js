// New in Town: the screens for the newer parts of the town (their rules are
// listed in mods.js). Each exports a default function that is handed the
// screen's kit and gives back what it adds: see "the newer parts of town" in
// game.js.

import soul from './soul-ui.js';
import coast from './coast-ui.js'; // Gorse Head, Smugglers’ Cove and the Merrow
import motor from './motor-ui.js';
import clubs from './clubs-ui.js';
import market from './market-ui.js'; // Windle Farm and Market Square
import folk from './folk-ui.js'; // the people of the town
import heists from './heists-ui.js'; // planned jobs, the detective, and the Low road box

export const SCREENS = [soul, coast, motor, clubs, market, folk, heists];
