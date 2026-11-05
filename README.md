# Arcade

Ad-free games for your iPhone that keep working with no signal.

## Play on this PC

Double-click **Play on PC.bat**. Your browser opens the arcade at http://localhost:8080. Keep the black window open while you play, and close it when you're done.

On a computer you click to tap; in Arrow Cube you also drag to spin, right-drag (or Shift-drag) to move the shape around, and scroll to zoom. In Gem Swap drag a gem onto its neighbour (or click one, then the other), and in Car Park drag the cars. On the big boards in Hexit, Nonogram and Minesweeper the scroll wheel zooms. Keyboard shortcuts in every game: **H** shows a hint, **U** undoes a move (except in Gem Swap, where moves are for keeps). In Arrow Cube the arrow keys spin the cube.

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

The giant puzzles (Mega, Giga and Huge) have simple, chunky shapes made of a few big blocks: a box, an L, a T, a plus sign, big steps, a stepped pyramid, a block with a corner cut out, a thick arch, stacked blocks, and a block with a smaller one on top. Every side is a big flat face, with no deep gaps and hardly anywhere two separate parts sit on the same level, so even zoomed right in you can tell what could be in an arrow's way. Huge goes through every shape before any comes round again. What makes them hard is the arrows: they're long (about 12 cells on average), they wind round the edges, two-way arrows are rarer, and only about 3 in 100 can move at the start.

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
- **Huge**: enormous boxes made for chipping away at over many sittings. The first has about 1,100 long arrows, and they grow to about 2,500. Every move is saved along with where you were looking, and there are no stars to lose. A new one takes a few seconds to build. After that it's kept on your phone, and the next one is built in the background while you finish the current one. Hint lights up an arrow that can leave, nearest to where you're looking, and turns and zooms the view to it if it's out of sight.

Levels are generated on the fly, so they never run out, and the same number always gives the same puzzle. You can jump to any number from the ⚙ menu.

**Every level is solvable.** Levels are built backwards from an empty shape, so a solution always exists. Then arrows that touch are joined into long ones that wind round onto other sides, and arrows that could leave straight away are worked into their neighbours, so only a few can move at the start. Each of those changes is kept only if the level can still be finished. Finally each level is searched for any order of taps that could leave you stuck, and rejected if one is found. `node tools/test-levels.mjs 1 150 levels` re-checks levels 1–150 (use `hard`, `super` or `huge` for the other modes) and also plays each one 25 times in random order. Puzzles without purple markers can't have dead ends at all (clearing an arrow only ever opens things up), so for the giant ones the check is simply that they can be finished.

## Hexit

Tap a hexagon and it slides off the honeycomb the way its arrow points, straight across any gaps. If another tile (or a stone) is in the way, it bumps back and you lose one of your three hearts. Clear every tile to win: your stars are the hearts you have left. **Press and hold a tile to see where it would go** without moving it: the trail is green if it gets away, and stops in red at whatever is in the way.

Tiles are coloured by the way they point, so you can see at a glance which ones run the same way.

| Piece | What it does |
|---|---|
| Two-way tile | Has an arrow at each end (and is half in each colour). It leaves from the end you tap nearer. |
| Stack | Leaves one tile at a time; the badge says how many are left. Each tile underneath has its own arrow, and the stack blocks the way until it's all gone. |
| Frozen tile | Can't move until a tile right next to it flies away. |
| Stone | Never moves, and nothing gets past it. |
| Blue pad | Turns anything that slides over it the way the pad points. |

**Modes** (pick from the Arcade menu or the ⚙ menu; each keeps its own progress):
- **Levels**: the main run. New pieces arrive gradually: two-way tiles at level 4, stacks at 7, frozen tiles at 11, stones at 16, pads at 21 and taller stacks at 26. Every 5th level is HARD (red) and every 10th SUPER HARD (dark and gold).
- **Hard** and **Super Hard**: endless big boards with every kind of piece.
- **Huge**: boards of 700 tiles and more, for chipping away at. There are no hearts to lose, and your place is saved as you go, along with where you were looking.

Drag to move around a big board, pinch (or scroll) to zoom, and **Fit** shows the whole thing. Hint lights up a tile that can leave, turning the view to it if it's out of sight, and Undo puts the last tile back.

**You can never get stuck.** Boards are built backwards from empty: each tile is put down pointing a way that's clear of every tile already there, so played forwards there is always a tile that can leave, whatever order you go in. (Taking a tile away only ever opens things up.) Each tile prefers to point across cells that are still to be filled, so the tiles put down after it end up in its way: only about one tile in seven can move at the start of a level, and fewer still on the Hard, Super Hard and Huge boards. `node tools/test-hexit.mjs 1 60` rebuilds boards in every mode and clears each one in several random orders.

## Gem Swap

Swap two neighbouring gems to make a line of three or more of the same colour. Each level has goals at the top (collect so many of a colour, break the crates, crack the ice, free the chained gems or bring the coins down) and a number of moves to do it in.

Bigger matches leave a power-up behind:

| Match | Power-up | What it does |
|---|---|---|
| 4 in a row | Line blaster | Clears a whole row or column, the way its arrows point. |
| L or T shape | Bomb | Clears everything around it. |
| 2×2 square | Butterfly | Clears the gems around it, then flies off to hit something a goal still needs. |
| 5 in a row | Prism | Swap it with a gem to clear every gem of that colour. |

Swap a power-up with any gem to set it off, or tap it to set it off where it is (that's a move too). Swap two power-ups together for a combo: two line blasters clear a row and a column, a line blaster and a bomb clear three of each, two bombs make one enormous blast, a butterfly carries the other power-up off to its target, a prism turns every gem of a colour into the other power-up, and two prisms clear the whole board.

- **In the way:** crates break when you make a match next to them or blast them, and the tougher ones take two or three hits. Chained gems can't be moved, but they can be matched. Ice breaks when the gem sitting on it is cleared (thick ice takes two goes). Coins have to be brought down and out through the bottom of the board.
- **Levels** bring in one new thing at a time, with a card explaining it. Every 5th level from 10 is HARD (red) and every 20th SUPER HARD (dark). Finish with moves to spare for more stars; each level's card says how many you need for three. Any moves left over at the end go off as line blasters.
- **Help:** each level gives you one Hammer (smash any square), one Row blast and one Shuffle, and none of them costs a move. Hint points out a good move, and the game shows you one by itself if you stop for a few seconds. Run out of moves and you can take 5 more to finish the level, for one star.
- **Win streak:** win levels in a row and the next one starts with power-ups already on the board: a line blaster after one win, a bomb as well after two, and a prism too after three or more. Taking extra moves, or giving up on a level part way through, ends the streak.
- Levels are made from their number, so the same number is always the same level. The gems are dealt differently each time you try, and a level in progress is saved move by move.

**Every level is tried out before you play it.** A practice player has a dozen goes at each level, and the number of moves is set so that it wins nearly every time on a normal level, about half the time on a hard one and less on a super hard one. `node tools/test-gem-swap.mjs 1 60` rebuilds levels 1–60, plays random moves on each to check the board always settles properly (nothing left floating, nothing left matched), checks that a saved game replays exactly, and lets the practice player have a go at each.

## Water Sort

Tap a tube to pick it up, then tap another to pour. The colour on top pours across, as much as fits, but only onto the same colour or into an empty tube. Fill every tube with a single colour to win.

- **Endless levels.** They start with 3 colours and grow to 12. Later levels are chosen from several random deals, keeping the one with the most dead ends to fall into, so they keep getting trickier.
- **Hard levels** come every 10th level, with two extra colours (up to 14) and the trickiest deal out of ten.
- **Mystery levels** hide every colour except the top one until you uncover it.
- **Help:** Undo as much as you like. Hint shows a pour that leads to a finish, and each level gives you one extra empty tube. If you pour yourself into a corner the game tells you, so you're never stuck without knowing.

Every level is solved by the computer before you see it. `node tools/test-water-sort.mjs 1 500` re-checks levels 1–500.

## Car Park

Slide the cars and trucks out of the way and drive the red car out through the gap on the right. Drag a vehicle to drive it: it only goes forwards or backwards along its length, never round a corner. One move is one vehicle driven any distance, and driving the same one again straight away still counts as the same move.

- **Stars:** the fewest moves each puzzle can be done in is shown at the top (MIN). Match it for 3 stars; a few more than that gets 2.
- **Help:** Undo as much as you like, and Restart puts everything back. Hint works out the best next move from wherever you are and shows it; tap Hint again and it makes that move for you.
- **Four modes**, each an endless numbered run with your stars for every puzzle: **Easy** (5 to 9 moves), **Medium** (10 to 17), **Hard** (18 to 28) and **Expert** (29 or more, sometimes with a concrete bollard in the way). Later numbers in each mode creep towards the hard end. The next puzzle is worked out in the background while you play, and the ones in play are kept on the phone.

**The fewest moves are worked out exactly.** Puzzles are built backwards: the computer lays out a car park with the red car already at the exit, finds every arrangement the vehicles can reach from there, and measures how far each one is from the nearest way out. The farthest one becomes the puzzle, so its minimum is exact, never a guess. Hard and Expert car parks take a long time to find from scratch, so they start from a bank of very hard layouts found ahead of time by the same search (`games/car-park/js/seeds.js`, remade with `node tools/test-car-park.mjs --seeds`), and each puzzle rearranges one of them without ever letting it get easier. `node tools/test-car-park.mjs 30` re-checks 30 puzzles of each mode with a separate search and plays each answer out.

## Sudoku

Fill the grid so every row, column and 3×3 box has 1 to 9 exactly once. Tap a square, then a number. Notes pencil in possibilities, wrong numbers turn red (this can be switched off in ⚙), and notes clear themselves as you place numbers. On a computer you can type numbers, use the arrow keys, and press **N** for notes.

Four difficulties, each an endless numbered run with its own best time:
- **Easy**: solvable using only the two basic moves: a square where just one number fits, or a number with just one place to go.
- **Medium**: also needs locked candidates (a number stuck in one row or column of a box).
- **Hard**: needs pairs or triples.
- **Expert**: needs X-Wings, Swordfish or XY-Wings.

Every puzzle has exactly one solution and can be solved by logic alone, with no guessing. Hint fills in the next square you could work out and says why. `node tools/test-sudoku.mjs 60` re-checks 60 puzzles of each difficulty.

## Nonogram

Fill in squares so each row and column matches its clue, and a picture appears. The numbers are the runs of filled squares in that line, in order, with at least one gap between them: "3 1" means three in a row, then a gap, then one more.

- **Controls:** tap a square to fill it, or drag along a row or column to fill a run in one go (a bubble counts the squares as you go). Long-press, or switch **Fill** to **Cross**, to cross out squares you know are empty. Tapping a marked square clears it. On a computer, right-click (or right-drag) crosses out, the scroll wheel zooms, and **F** switches between Fill and Cross.
- **Help as you go:** the row and column under your finger light up, clue numbers turn grey once their run is done, and finished lines cross off their leftover squares (that can be switched off in ⚙). Wrong squares show up straight away and count as mistakes; switch that off and a clue turns red instead when its line can't be right as marked. Hint fills in (or crosses out) the next square you can work out and says why, like "Row 4: the 6 has to cover this square, wherever it goes." Undo takes back a whole drag at once.
- **Sizes:** Easy 10×10 (mostly little hand-drawn pictures), Medium 15×15, Hard 20×20 and Huge 25×25, each an endless numbered run with a best time. Pinch to zoom on the bigger grids. Huge starts zoomed in at the top left, the clues stay stuck to the edges as you move around, and the corner shows a little map of the picture so far. Each size keeps the last few puzzles you've started, so you can go back to one later.
- Finish one and the picture colours itself in: critters, badges, landscapes, islands, quilts and more.

**Every puzzle has exactly one answer and can be solved line by line, with no guessing.** Each one starts as a picture, which is then solved by a solver that only ever looks at one line at a time, the way a person does. If it gets stuck, a square in the part it couldn't work out is changed and it tries again. `node tools/test-nonogram.mjs 30` re-checks 30 puzzles of each size, counts the answers a second, separate way on the smaller ones, and walks the hints all the way through some of them.

## Minesweeper

Dig out every square that isn't a mine. Each number says how many of the 8 squares around it hide one. The game opens a starting patch for you, and **every board can be cleared from there by logic alone**, so there's never a 50/50 guess. Boards are made by a solver that only uses deductions a person can make; when it gets stuck, it moves a mine out of the way and tries again.

- **Controls:** tap to dig; long-press (or turn Flag on) to flag. Tapping a number whose mines are all flagged digs the rest around it. Drag to move and pinch to zoom; **Fit** switches between the whole board and a close-up. On a computer, right-click flags and the scroll wheel zooms.
- **Forgiving:** hit a mine and you can undo that tap. Hint digs a square the numbers prove is safe, and points out any wrong flag first.
- **Sizes:** Easy 9×9 (10 mines), Medium 12×16 (32), Hard 16×30 (90) and Huge 30×50 (300) for chipping away at. Each has an endless numbered run and a best time.

`node tools/test-minesweeper.mjs 100` re-checks 100 boards of each size.

## Files

- `index.html`: the arcade menu
- `games/arrow-cube/`: Arrow Cube (`topology.js` turns a shape into cells and planes, `rules.js` holds the rules, `generator.js` builds the shapes and levels, `render.js` draws them with WebGL)
- `games/hexit/`: Hexit (`hex.js` is the honeycomb geometry and board shapes, `rules.js` holds the rules, `levels.js` builds the boards backwards, `draw.js` draws the tiles, `game.js` is the screen)
- `games/gem-swap/`: Gem Swap (`engine.js` has the rules: matches, power-ups, combos, falling gems and everything in the way; `levels.js` builds the levels and `bot.js` is the practice player that sets their moves; `art.js` draws the gems; `game.js` plays it all out on screen)
- `games/water-sort/`: Water Sort (`logic.js` has the rules, level generator and solver; `game.js` draws and animates the tubes)
- `games/car-park/`: Car Park (`logic.js` has the rules, the exact solver and the puzzle maker, `seeds.js` the hard car parks it starts from, `worker.js` builds puzzles off the main thread, `game.js` draws the car park and handles dragging)
- `games/sudoku/`: Sudoku (`logic.js` makes and grades puzzles; `game.js` is the board)
- `games/nonogram/`: Nonogram (`logic.js` has the rules, the line-by-line solver, the hints and the puzzle maker; `pictures.js` draws the pictures, including the hand-drawn 10×10 icons; `game.js` is the board)
- `games/minesweeper/`: Minesweeper (`logic.js` makes no-guess boards and solves them; `game.js` draws the board and handles touch)
- `shared/`: sound, haptics, saving and offline support used by every game (`arcade.js`), plus the screen frame, pop-up cards and confetti used by the newer games (`screen.css`, `ui.js`)
- `sw.js`: the offline file list. Regenerate it after any change with `node tools/build-sw.mjs`
- `tools/`: the local server, the tests for each game, and the icon maker (`tools/make-icons.ps1`)
