# New in Town: where things stand

Updated 15 November 2026. Everything up to PR #36 is merged and live.

## Done since the pause

- **#32:** the fourth playtest's fixes.
  - Crime pays less and remembers (`proceeds.js`).
  - Money matters at every means ("Living well", `comfort.js`, and a yacht).
  - There is a way up without a career.
  - The story and text fixes.
- **#33:** a business worth running (`firm.js`).
- **#34:** Starling Moor, a third map (`moor.js`).
- **#35:** going away (`away.js`).
- **#36:** the house, the garden and the street (`street.js`).

Tests: `node tools/test-new-in-town.mjs 4 30` (quick) and `node tools/test-new-in-town.mjs 12 60` (thorough). Both must print "All checks passed".

## Left over, smallest first

- **The heir.** `chapters.js` passes on only part of each newer part's state.
  - Moor: the Hall's story and the walks are lost at the hand-over.
  - Street: the house's age, garden and neighbours start fresh.
  - Firm: the business is carried by a workaround in `firm.js` (an `obit` hook and a wrap of `chapBegin`). It would be cleaner for chapters to carry the whole of `s.biz`. The will screen still says "the café" rather than the business's name.
  - Engine.js's bailiffs note says "your café".
- **One means helper.** `moor.js` has its own `moorMeans`, and firm costs follow the business's size. Both could use `L.midSpend()`.
- **The business may lean slightly weak.** Most trades end a little below the matching career by 60; the shop is above. The levers are in `firm-lib.js` (`OVER`, `DEMAND`) and the loan terms in `firm.js`.
- **The street's numbers are first guesses:** fault rates, the building-site mood cost, and mood from the garden, finished work and neighbours.
- **Not built:**
  - sailing hire on Fennick Water;
  - a sheet of their own for each of the moor's people;
  - map art for Mrs Pargeter's room (it draws as the chip shop);
  - more in-laws at dinner parties;
  - a Gazette item for holidays.
- **Random practice lives rarely buy a home to let now** (about 2 in 120, against 17 before #32). The random crooks used to buy with burglary money. This is expected, but it means the "Keys to the door" checks see few owners.

## A good next step

A fifth playtest. Live three or four whole lives through the screen (a careful climber, a business owner, someone who lives off the land, and a crook) and note what repeats, what is too easy or too hard, and what reads wrong. The last two playtests found the most useful work. Then fix what it finds, one piece at a time, merging and going live after each.
