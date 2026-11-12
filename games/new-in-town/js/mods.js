// New in Town: the newer parts of the town, each in a file of its own.
// Every one exports install({ def, A, Life, clamp, val, hooks, addEvents }),
// which adds its actions (def), its rules (hooks: see HOOKS in engine.js)
// and its cards (addEvents). They must not import engine.js, which imports
// them: everything they need is handed to them. Their screens are listed in
// ui-mods.js.

import { install as hill } from './hill.js';
import { install as coast } from './coast.js'; // Gorse Head, Smugglers’ Cove and the Merrow

export const RULES = [hill, coast];
