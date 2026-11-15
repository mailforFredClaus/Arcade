# New in Town: work in progress, paused

Written on 13 November 2026, when work was paused to save usage. Everything up to PR #31 is merged and live. Nothing below has been built yet. Six agents had started on it and were stopped part-way; their unfinished code was not kept. Each item has enough here to start again from scratch.

## What is live

- PRs #24 to #29 (the big expansion), #30 (notices that keep clear; tap the time pips to see where the season's time goes), and #31 (the Journal's town news no longer drawn on top of itself, plus this note).
- Tests: `node tools/test-new-in-town.mjs 4 30` (quick) and `node tools/test-new-in-town.mjs 12 60` (thorough). Both must print "All checks passed".

## 1. Fixes from the fourth playtest (not done)

A playtester lived four lives through the screen, about 700 seasons. They played Maud (a surgeon and councillor), her son Will as heir, Fen (who lives off the land) and Vic (a gambler and crook). In order of importance:

1. **The trust's accounts** (`midlife.js`) nag. The card fired at 53, 54, 55, 57 and 58 with the same text. "You pay back what went" took all her cash each time. It promised "you chair every meeting from now on", which never happened.
   - Fire it once per lapse.
   - Scale the loss to the fund.
   - Warn on the Me tab when chairing is due.
   - Make "from now on" true, or drop it.
2. **Both parents died in the same season**, in two different lives, both with the deathbed line "they met at a bus stop, in the snow". Space the deaths a few years apart unless something causes it, and vary the lines.
3. **Three mid-life crisis cards collide:** "Is this it?" (`events.js`), "Fifty", and "The same week again" (`midlife.js`).
   - Pool them under one shared cooldown.
   - Word them for the life lived: "you go to work, you come home" was said to someone with no job.
   - Make the rut gauge actually rise when a life is flat (it never went above 2 of 8).
4. **The rival crew** (`heists.js`) reaches respectable people. Nan Carne recruited a surgeon with no crimes, and her obituary said "She ran the pier for years". Keep it to people on the low road.
5. **Crime pays better than medicine.**
   - Burgling a villa paid $16–17k at a 28% risk.
   - Enforcer pay was $8,400 a shift.
   - "It was all Sal" got Vic off seven arrests in a row at no real cost, and Sal promoted him anyway.

   Make crime rarer and costlier, and make Sal's distrust matter.
6. **Money stops mattering for the comfortable from about 55.** Maud's mood sat at 100 from 68 to 81 with $1.6M idle. Prices are not scaled to means: a $650 gift was suggested to a man with $606k. Scale care, gifts, children's weddings and university fees, and give the rich things worth wanting (see the wave below).
7. **The restless life is a poverty trap.**
   - The hostel blocks jam and hens.
   - A bedsit costs $700 a season more and still has no room for hens.
   - Fen was overdrawn at 21, 37 and 52.

   Give a way out: jam in the allotment shed, hens in Tom's paddock, a cheap room with a kitchen. Also give a proper header label instead of "Between jobs" for someone living off the land, and drop "Earn a promotion" from the to-do list when there is no job.
8. **Names repeat:**
   - three partners in three lives opened a café called "Steam & Strings";
   - a dog called Scraps in two lives, both buried "under the apple tree".

   Make names unique within a family's lives. Also:
   - Keep surnames for heirs (Will had none, so his trust was "The Will Trust").
   - Keep the town calendar running across generations (the heir's header said "year 1").
9. **Role events repeat word for word:** lifeboat shouts (dog on the ledge ×10), "Your property bag is waiting…" ×9, Kitto's "I did wonder when" ×12, and every anniversary ending "the last of the pudding". Each needs two or three wordings.
10. **Club leaders never warm to members.** After 28 years in the choir, the Reverend Hollis is still "A stranger".

Smaller faults:
- The drift list includes a spouse who lives with you, and a 7-year-old grandchild.
- A councillor was re-elected until death at 81, though standing is barred after 72.
- The Me tab shows Sal "wants nothing to do with you" while you work in his crew.
- Stale to-dos:
  - "Buy a bicycle" at $219k;
  - "Put $2,000 into savings" at $606k;
  - "Earn a promotion" with no job.
- Text slips:
  - "the year you were -9";
  - a man cast as "Woman With Basket";
  - "the children fed" said to someone with no children;
  - "There is not that much in the bank" with $65k;
  - "Wants children" at 59 with three;
  - "Stand for the council" shown to a Deputy Mayor;
  - "counts towards promotion" offered at the top rung.
- `midlife-ui.js`: the trust's top-up row is labelled "undefined", and the fund amount is clipped ("$39,50").

## 2. The next wave of new content (not started in earnest)

Four new parts, each in its own files (`js/<name>.js`, `js/<name>-ui.js`, `js/<name>-games.js`, `tools/new-in-town-tests/<name>.mjs`). Each is added to `js/mods.js` and `js/ui-mods.js` with hill kept last, and plugs in through hooks, `def()` and `addEvents()` as the existing parts do (`hill.js` is the simplest example).

- **Starling Moor, a third map** beyond Windle Farm (`area: 'moor'` in PLACES, its own backdrop in `art.js`, and a three-way map switch in `game.js`). Places:
  - a gentry house and estate (not "Starling Manor", which is already a home);
  - a quarry;
  - a reservoir with a drowned village;
  - standing stones;
  - an old wood;
  - a moor village with a pub;
  - an observatory;
  - a campsite;
  - a railway halt.

  Getting there costs time unless you drive (an action's `time` can be a function), and the weather bites. Also: things to collect, minigames (foraging, stargazing, dry-stone walling), and a tie-in to Tom Windle's footpath war.
- **Going away:** holidays booked at the station.
  - Trips range from a borrowed tent to a cruise, priced by who comes, and take most of a season.
  - Each trip plays as two to four cards with choices, and brings home memories, bonds and postcards.
  - Over the years: honeymoons, a family caravan tradition, a gap year, cruises in retirement.
  - A place of your own away (caravan, cottage, villa) for those with money.
- **The house, the garden and the street:**
  - Houses age (damp, roof, boiler), with a cast of builders; renters get a landlord instead.
  - Bigger projects, and a garden that grows over years.
  - Three or four neighbours with their own stories, a new set each time you move.
  - Dinner parties with a seating-plan minigame.
  - Builds on the existing UPGRADES and lodger; it does not replace them.
- **A business worth running**, built on the existing `s.biz` (most lives start a business, but it is only start, work, grow, manager, sell):
  - a name you choose;
  - named staff with natures and stories;
  - price, quality and hours decisions;
  - seasonal trade;
  - named rivals;
  - a second premises;
  - year-end accounts;
  - the family business passing to the heir.

  It must stay a fair path, not a money printer.

Rules every part followed:
- All state goes under one key of `life.s`, set up in a `load` hook so old saves still work.
- Randomness comes only from `L.rnd()` and its helpers.
- Plain British English with curly apostrophes, short dry sentences, no brand names.
- Minigames are original and work with a finger at 320×568.
- Cards prefer chains with `when`, `ok`, `cd` and `once` over new buttons, so the practice players are not diluted.
- Check every screen on a phone size, and rebuild `sw.js` with `node tools/build-sw.mjs` before committing.

## A cheaper way to carry on

Doing one item at a time costs far less than running six agents at once. A good order:
1. The playtest fixes in section 1.
2. One new part, starting with the business, since most lives meet it.
3. Merge and go live before starting the next.
