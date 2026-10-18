# Arcade

Ad-free games for your iPhone that keep working with no signal.

## Play on this PC

Double-click **Play on PC.bat**. Your browser opens the arcade at http://localhost:8080. Keep the black window open while you play, and close it when you're done.

On a computer you drag to spin, scroll to zoom, and click to tap. Keyboard shortcuts: the arrow keys spin the cube, **H** shows a hint, **U** undoes a move.

## Put it on your iPhone

The arcade is live at **https://mailforfredclaus.github.io/Arcade/** (the capital A matters).

1. Open that address in Safari on the iPhone.
2. Tap **Share** (in iOS 26, tap **•••** first), then **Add to Home Screen**.
3. Open it once from the Home Screen while you have internet, until it says "Ready to play offline". After that it plays with no signal at all.

Always play from the Home Screen icon: it keeps its own saved progress, separate from Safari's. Deleting the icon deletes that progress.

To publish a change: run `node tools/build-sw.mjs`, then commit and push to GitHub. Phones pick up the new version the next time the arcade is opened with internet.

## Arrow Cube

Tap an arrow and it slides away head first, with its body following. The head always travels in a straight line on its own flat level of the shape. It carries on off the edge and across open gaps, so an arrow lying on that same level on another part of the shape can be in the way. The shape itself blocks it too: an arrow aimed into a concave corner, where a wall rises up in front of it, can't get out that way. If anything is in the way, the arrow bumps back and you lose one of your three stars.

Shapes are built from cubes. You'll see plain boxes and flat slabs, plus cubes with bumps, stairs, towers, arches, crosses, rings, L and U shapes, pyramids, T shapes, stacks, and, in the biggest puzzles, cities, castles with courtyards, and ziggurats. Arrows only go where you can comfortably see and tap them. The walls deep inside a narrow gap (say between two tall towers) are left empty, because you could only ever see them edge-on.

| Piece | What it does |
|---|---|
| Black arrow | Slides out the way it points. |
| Blue marker | Steers any arrow that slides over it. |
| Purple marker | Steers like blue, then flips around 180°. |
| Green/yellow arrow | Has a head on each end. It leaves from the end you tap nearer. |
| Orange (forked) arrow | Has two heads. Both leave at once and the arrow splits, so both ways out must be clear. |
| Yellow edge | Arrows slide around it onto the next side instead of flying off. |

**Modes** (pick from the Arcade menu or the ⚙ menu; each keeps its own progress):
- **Levels**: the main run. New pieces arrive gradually: blue at level 4, two-way at 6, yellow edges at 8, purple at 12, forks at 14. Every 5th level is HARD (red), every 10th SUPER HARD (dark and gold), every 50th MEGA HARD (orange and pink) and every 100th GIGA HARD (black and neon, with 700+ arrows).
- **Hard**: endless hard puzzles with every piece.
- **Super Hard**: endless super hard puzzles, big and dense.
- **Huge**: enormous shapes made for chipping away at over many sittings. The first has about 2,500 arrows, and they grow to 5,000 or more. Every move is saved along with where you were looking, and there are no stars to lose. A new one takes a few seconds to build. After that it's kept on your phone, and the next one is built in the background while you finish the current one. Hint lights up an arrow that can leave, nearest to where you're looking, and turns and zooms the view to it if it's out of sight.

Levels are generated on the fly, so they never run out, and the same number always gives the same puzzle. You can jump to any number from the ⚙ menu.

**Every level is solvable.** Levels are built backwards from an empty shape, so a solution always exists. Then each one is searched for any order of taps that could leave you stuck, and rejected if one is found. `node tools/test-levels.mjs 1 150 levels` re-checks levels 1–150 (use `hard`, `super` or `huge` for the other modes) and also plays each one 25 times in random order. Puzzles without purple markers can't have dead ends at all (clearing an arrow only ever opens things up), so for the giant ones the check is simply that they can be finished.

## Files

- `index.html`: the arcade menu
- `games/arrow-cube/`: the game (`topology.js` turns a shape into cells and planes, `rules.js` holds the rules, `generator.js` builds the shapes and levels, `render.js` draws them with WebGL)
- `shared/`: sound, haptics, saving and offline support used by every game
- `sw.js`: the offline file list. Regenerate it after any change with `node tools/build-sw.mjs`
- `tools/`: the local server, level tests, and icon maker (`tools/make-icons.ps1`)
