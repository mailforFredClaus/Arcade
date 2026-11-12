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
import flutter from './flutter-ui.js'; // the gambling habit
import careers from './careers-ui.js'; // a story for every career

export const SCREENS = [soul, coast, motor, clubs, market, folk, flutter, careers];
