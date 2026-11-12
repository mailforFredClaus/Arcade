// New in Town: the newer parts of the town, each in a file of its own.
// Every one exports install({ def, A, Life, clamp, val, hooks, addEvents }),
// which adds its actions (def), its rules (hooks: see HOOKS in engine.js)
// and its cards (addEvents). They must not import engine.js, which imports
// them: everything they need is handed to them. Their screens are listed in
// ui-mods.js.

import { install as hill } from './hill.js';
import { install as soul } from './soul.js';
import { install as coast } from './coast.js'; // Gorse Head, Smugglers’ Cove and the Merrow
import { install as motor } from './motor.js';
import { install as clubs } from './clubs.js';
import { install as market } from './market.js'; // Windle Farm and Market Square
import { install as folk } from './folk.js'; // the people of the town
import { install as chapters } from './chapters.js'; // the chapters of a life, old age, and the will

// (The plain things to do up the hill go last, so that each place's own sections come first.)
export const RULES = [soul, coast, motor, clubs, market, folk, chapters, hill];
