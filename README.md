# Arcade

Ad-free games for your iPhone that keep working with no signal.

## Play on this PC

Double-click **Play on PC.bat**. Your browser opens the arcade at http://localhost:8080. Keep the black window open while you play, and close it when you're done.

On a computer you click to tap; in Arrow Cube you also drag to spin, right-drag (or Shift-drag) to move the shape around, and scroll to zoom. Keyboard shortcuts in every game: **H** shows a hint, **U** undoes a move. In Arrow Cube the arrow keys spin the cube.

## Put it on your iPhone

The arcade is live at **https://mailforfredclaus.github.io/Arcade/** (the capital A matters).

1. Open that address in Safari on the iPhone.
2. Tap **Share** (in iOS 26, tap **•••** first), then **Add to Home Screen**.
3. Open it once from the Home Screen while you have internet, until it says "Ready to play offline". After that it plays with no signal at all.

Always play from the Home Screen icon: it keeps its own saved progress, separate from Safari's. Deleting the icon deletes that progress.

To publish a change: run `node tools/build-sw.mjs`, then commit and push to GitHub. Phones pick up the new version the next time the arcade is opened with internet.

## Arrow Cube

Tap an arrow and it slides away head first, with its body following. The head always travels in a straight line on its own flat level of the shape. It carries on off the edge and across open gaps, so an arrow lying on that same level on another part of the shape can be in the way. The shape itself blocks it too: an arrow aimed into a concave corner, where a wall rises up in front of it, can't get out that way. If anything is in the way, the arrow bumps back and you lose one of your three stars.

**Press and hold an arrow to see where it would go**, without moving it. A dotted trail runs from its head along the way it would take, still faintly visible where it passes behind the shape. If the way is clear the trail is green and runs off the shape; if not, it stops in red where it would hit, and the arrow in the way lights up red. Slide your finger to check other arrows; letting go does nothing, so it never costs a star.

Shapes are built from cubes. You'll see plain boxes and flat slabs, plus cubes with bumps, stairs, towers, arches, crosses, rings, L and U shapes, pyramids, T shapes and stacks. Arrows only go where you can comfortably see and tap them. The walls deep inside a narrow gap (say between two tall towers) are left empty, because you could only ever see them edge-on.

The giant puzzles (Mega, Giga and Huge) are plain boxes: a cube, a wide block, a tall tower, a flat slab or a long bar. Each side is one flat face with nothing else on its level, so even zoomed right in you can tell what could be in an arrow's way. What makes them hard is the arrows: they're long (about 12 cells on average), they wind round the edges, two-way arrows are rarer, and only about 3 in 100 can move at the start.

**Seeing the shape.** Sides facing the light are brighter, inside corners are shaded and the outside edges are outlined, so you can tell the sides apart. The little cube in the top corner turns with the shape and is labelled Front, Back, Left, Right, Top and Bottom. Tap one of its sides to look straight at that side of the shape (the side you're facing lights up): it turns the shortest way, keeping the shape as near the way up it already was as it can. Its arrows turn the shape a quarter turn that way, so tapping one again and again takes you all the way round. Zoomed in, you stay looking at the same spot.

| Piece | What it does |
|---|---|
| Black arrow | Slides out the way it points. |
| Blue marker | Steers any arrow that slides over it. |
| Purple marker | Steers like blue, then flips around 180°. |
| Green/yellow arrow | Has a head on each end. It leaves from the end you tap nearer. |
| Orange (forked) arrow | Has two heads. Both leave at once and the arrow splits, so both ways out must be clear. |
| Yellow edge | Arrows slide around it onto the next side instead of flying off. |

**Modes** (pick from the Arcade menu or the ⚙ menu; each keeps its own progress):
- **Levels**: the main run. New pieces arrive gradually: blue at level 4, two-way at 6, yellow edges at 8, purple at 12, forks at 14. Every 5th level is HARD (red), every 10th SUPER HARD (dark and gold), every 50th MEGA HARD (orange and pink) and every 100th GIGA HARD (black and neon, with around 400 long arrows).
- **Hard**: endless hard puzzles with every piece.
- **Super Hard**: endless super hard puzzles, big and dense.
- **Huge**: enormous boxes made for chipping away at over many sittings. The first has about 1,200 long arrows, and they grow to about 2,500. Every move is saved along with where you were looking, and there are no stars to lose. A new one takes a few seconds to build. After that it's kept on your phone, and the next one is built in the background while you finish the current one. Hint lights up an arrow that can leave, nearest to where you're looking, and turns and zooms the view to it if it's out of sight.

Levels are generated on the fly, so they never run out, and the same number always gives the same puzzle. You can jump to any number from the ⚙ menu.

**Every level is solvable.** Levels are built backwards from an empty shape, so a solution always exists. Then arrows that touch are joined into long ones that wind round onto other sides, and arrows that could leave straight away are worked into their neighbours, so only a few can move at the start. Each of those changes is kept only if the level can still be finished. Finally each level is searched for any order of taps that could leave you stuck, and rejected if one is found. `node tools/test-levels.mjs 1 150 levels` re-checks levels 1–150 (use `hard`, `super` or `huge` for the other modes) and also plays each one 25 times in random order. Puzzles without purple markers can't have dead ends at all (clearing an arrow only ever opens things up), so for the giant ones the check is simply that they can be finished.

## Water Sort

Tap a tube to pick it up, then tap another to pour. The colour on top pours across, as much as fits, but only onto the same colour or into an empty tube. Fill every tube with a single colour to win.

- **Endless levels.** They start with 3 colours and grow to 12. Later levels are chosen from several random deals, keeping the one with the most dead ends to fall into, so they keep getting trickier.
- **Hard levels** come every 10th level, with two extra colours (up to 14) and the trickiest deal out of ten.
- **Mystery levels** hide every colour except the top one until you uncover it.
- **Help:** Undo as much as you like. Hint shows a pour that leads to a finish, and each level gives you one extra empty tube. If you pour yourself into a corner the game tells you, so you're never stuck without knowing.

Every level is solved by the computer before you see it. `node tools/test-water-sort.mjs 1 500` re-checks levels 1–500.

## Sudoku

Fill the grid so every row, column and 3×3 box has 1 to 9 exactly once. Tap a square, then a number. Notes pencil in possibilities, wrong numbers turn red (this can be switched off in ⚙), and notes clear themselves as you place numbers. On a computer you can type numbers, use the arrow keys, and press **N** for notes.

Four difficulties, each an endless numbered run with its own best time:
- **Easy**: solvable using only the two basic moves: a square where just one number fits, or a number with just one place to go.
- **Medium**: also needs locked candidates (a number stuck in one row or column of a box).
- **Hard**: needs pairs or triples.
- **Expert**: needs X-Wings, Swordfish or XY-Wings.

Every puzzle has exactly one solution and can be solved by logic alone, with no guessing. Hint fills in the next square you could work out and says why. `node tools/test-sudoku.mjs 60` re-checks 60 puzzles of each difficulty.

## Minesweeper

Dig out every square that isn't a mine. Each number says how many of the 8 squares around it hide one. The game opens a starting patch for you, and **every board can be cleared from there by logic alone**, so there's never a 50/50 guess. Boards are made by a solver that only uses deductions a person can make; when it gets stuck, it moves a mine out of the way and tries again.

- **Controls:** tap to dig; long-press (or turn Flag on) to flag. Tapping a number whose mines are all flagged digs the rest around it. Drag to move and pinch to zoom; **Fit** switches between the whole board and a close-up. On a computer, right-click flags and the scroll wheel zooms.
- **Forgiving:** hit a mine and you can undo that tap. Hint digs a square the numbers prove is safe, and points out any wrong flag first.
- **Sizes:** Easy 9×9 (10 mines), Medium 12×16 (32), Hard 16×30 (90) and Huge 30×50 (300) for chipping away at. Each has an endless numbered run and a best time.

`node tools/test-minesweeper.mjs 100` re-checks 100 boards of each size.

## Files

- `index.html`: the arcade menu
- `games/arrow-cube/`: Arrow Cube (`topology.js` turns a shape into cells and planes, `rules.js` holds the rules, `generator.js` builds the shapes and levels, `render.js` draws them with WebGL)
- `games/water-sort/`: Water Sort (`logic.js` has the rules, level generator and solver; `game.js` draws and animates the tubes)
- `games/sudoku/`: Sudoku (`logic.js` makes and grades puzzles; `game.js` is the board)
- `games/minesweeper/`: Minesweeper (`logic.js` makes no-guess boards and solves them; `game.js` draws the board and handles touch)
- `shared/`: sound, haptics, saving and offline support used by every game (`arcade.js`), plus the screen frame, pop-up cards and confetti used by the newer games (`screen.css`, `ui.js`)
- `sw.js`: the offline file list. Regenerate it after any change with `node tools/build-sw.mjs`
- `tools/`: the local server, the tests for each game, and the icon maker (`tools/make-icons.ps1`)
