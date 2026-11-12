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

The giant puzzles (Mega, Giga, Huge and Mega Huge) have simple, chunky shapes made of a few big blocks: a box, an L, a T, a plus sign, big steps, a stepped pyramid, a block with a corner cut out, a thick arch, stacked blocks, and a block with a smaller one on top. Every side is a big flat face, with no deep gaps and hardly anywhere two separate parts sit on the same level, so even zoomed right in you can tell what could be in an arrow's way. Huge and Mega Huge go through every shape before any comes round again. What makes them hard is the arrows: they're long (about 12 cells on average), they wind round the edges, two-way arrows are rarer, and only about 3 in 100 can move at the start.

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
- **Huge**: enormous shapes made for chipping away at over many sittings. The first has about 1,100 long arrows, and they grow to about 2,500. Every move is saved along with where you were looking, and there are no stars to lose. A new one takes a few seconds to build. After that it's kept on your phone, and the next one is built in the background while you finish the current one. Hint lights up an arrow that can leave, nearest to where you're looking, and turns and zooms the view to it if it's out of sight.
- **Mega Huge**: like Huge, only several times bigger. The first has about 4,500 long arrows, and they grow to about 7,000. A new one can take up to half a minute to build (the next is built in the background while you finish the one before).

Levels are generated on the fly, so they never run out, and the same number always gives the same puzzle. You can jump to any number from the ⚙ menu.

**Every level is solvable.** Levels are built backwards from an empty shape, so a solution always exists. Then arrows that touch are joined into long ones that wind round onto other sides, and arrows that could leave straight away are worked into their neighbours, so only a few can move at the start. Each of those changes is kept only if the level can still be finished. Finally each level is searched for any order of taps that could leave you stuck, and rejected if one is found. `node tools/test-levels.mjs 1 150 levels` re-checks levels 1–150 (use `hard`, `super`, `huge` or `megahuge` for the other modes) and also plays each one 25 times in random order. Puzzles without purple markers can't have dead ends at all (clearing an arrow only ever opens things up), so for the giant ones the check is simply that they can be finished.

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

You play your way through the castle, ten levels to a chapter, each with its own painted scene behind the board: the Palace Garden, the Great Hall, the Moonlit Courtyard, the Crystal Cavern, the Royal Harbour and the Snowy Keep (then round again). The level card shows how far through the chapter you are.

Bigger matches leave a power-up behind:

| Match | Power-up | What it does |
|---|---|---|
| 4 in a row | Rocket | Blasts a whole row or column, the way it points. |
| L or T shape | Bomb | Clears everything around it. |
| 2×2 square | Butterfly | Clears the gems around it, then flies off to hit something a goal still needs. |
| 5 in a row | Prism | Swap it with a gem to clear every gem of that colour. |

Power-ups look nothing like gems: each sits in a glow with rays of light turning behind it, and they twinkle. They have no colour of their own, so they never join a line. Swap one with any gem to set it off, or tap it to set it off where it is (that's a move too). Swap two power-ups together for a combo: two rockets clear a row and a column, a rocket and a bomb clear three of each, two bombs make one enormous blast, a butterfly carries the other power-up off to its target, a prism turns every gem of a colour into the other power-up, and two prisms clear the whole board.

- **In the way:** crates break when you make a match next to them or blast them, and the tougher ones take two or three hits. Some crates are treasure chests: break one open and the power-up inside is yours. Chained gems can't be moved, but they can be matched. Ice breaks when the gem sitting on it is cleared (thick ice takes two goes). Coins have to be brought down and out through the bottom of the board.
- **Levels** bring in one new thing at a time, with a card explaining it. Some start with power-ups already lying on the board. Every 5th level from 10 is HARD (crimson) and every 20th SUPER HARD (midnight); the level after a hard one is a TREASURE level (gold): four colours, chests to crack open, power-ups to start you off and moves to spare. Finish with moves to spare for more stars; each level's card says how many you need for three. Any moves left over at the end go off as rockets.
- **Help:** each level gives you one Hammer (smash any square), one Rocket (clears a row) and one Shuffle, and none of them costs a move. Hint points out a good move, and the game shows you one by itself if you stop for a few seconds. Run out of moves and you can take 5 more to finish the level, for one star.
- **Win streak:** win levels in a row and the next one starts with power-ups already on the board: a rocket after one win, a bomb as well after two, and a prism too after three or more. Taking extra moves, or giving up on a level part way through, ends the streak.
- Levels are made from their number, so the same number is always the same level. The gems are dealt differently each time you try, and a level in progress is saved move by move.

**Every level is tried out before you play it.** A practice player has a dozen goes at each level. A level it finishes in a handful of moves is given more to do, and one that swings between quick and endless (so it would come down to luck) is thrown away for another. Then the number of moves is set so that it wins nearly every time on a normal level, about half the time on a hard one and less on a super hard one. `node tools/test-gem-swap.mjs 1 60` rebuilds levels 1–60, plays random moves on each to check the board always settles properly (nothing left floating, nothing left matched), checks that a saved game replays exactly, and lets the practice player have a go at each.

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
- **Help:** Undo as much as you like, and Restart puts everything back for a fresh go. Hint works out the best next move from wherever you are, counting moves the way the game does (carrying on with the car you just moved is still the same move), and shows it; tap Hint again and it makes that move for you.
- **Four modes**, each an endless numbered run with your stars for every puzzle: **Easy** (5 to 9 moves), **Medium** (10 to 17), **Hard** (18 to 28) and **Expert** (29 or more, sometimes with a concrete bollard in the way). Later numbers in each mode creep towards the hard end. The next puzzle is worked out in the background while you play, and the ones in play are kept on the phone.

**The fewest moves are worked out exactly.** Puzzles are built backwards: the computer lays out a car park with the red car already at the exit, finds every arrangement the vehicles can reach from there, and measures how far each one is from the nearest way out. The farthest one becomes the puzzle, so its minimum is exact, never a guess. Hard and Expert car parks take a long time to find from scratch, so the first 200 of each come from a bank found ahead of time by the same search (`games/car-park/js/seeds.js`, remade with `node tools/test-car-park.mjs --seeds`): one car park per puzzle, easiest first. After that they're built from scratch while you play the one before. No two puzzles are ever the same car park. `node tools/test-car-park.mjs 30` re-checks 30 puzzles of each mode with a separate search, plays each answer out, checks that no puzzle repeats another, and that following the hints after a part-way move still finishes in the fewest moves.

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

## Star Swarm

A shooter in the style of the 1981 arcade classic, played on a 224 × 288 screen like the machine's, with its own pixel art, sounds and name. Slide your thumb on the left pad to move, and tap **FIRE** (or the screen itself) to shoot; only two shots can be in the air at once, so aim. On a computer: arrow keys (or A and D) and Space, and P to pause.

Attackers swing out to one side and back across as they come down, and fire on the way, not as they set off. Their shots fall about twice as fast as they do and can only lean a little towards you, so a shot is well clear before whoever fired it arrives: dodge the shot, then slip back under and shoot. Nobody shoots on stage 1; after that more and more of the attackers carry a shot. (These speeds and timings were measured from a home-console version of the arcade game and matched to it.)

Each stage, forty enemies fly in in five waves and line up: four bosses on top, two rows of butterflies, two rows of bees. Then they peel off and dive at you, shooting. Clear them all to go on to the next stage; they get faster, more of them dive at once, and they fire more.

| | In line | Diving |
|---|---|---|
| Bee | 50 | 100 |
| Butterfly | 80 | 160 |
| Boss (takes two hits) | 150 | 400 alone, 800 after shooting one of its escorts, 1,600 after both |
| A bee's three transformations (stage 4 on) | | 160 each, and 1,000, 2,000 or 3,000 for all three |

- **Tractor beam:** a boss can stop above you and send down a beam. Get caught and that fighter is captured: it sits above the boss, in red. Shoot that boss *while it dives* and the fighter comes back to fly beside your next one, a dual fighter with twice the shots (and twice the width). Shoot the boss in the line-up instead and the fighter turns on you (1,000 if you shoot it; shooting your own captured fighter above its boss scores 500 and loses it).
- **Challenging Stages** are stage 3 and every fourth stage after (7, 11, 15, …): forty enemies fly past in five groups, nothing shoots and nothing can hurt you. Each hit is 100, each whole group 1,000 to 3,000, and at the end you get 100 a hit, or a special bonus of 10,000 for all forty.
- **Fighters:** you start with three. A new one comes at 20,000, at 70,000, and every 70,000 after that. When only a few enemies are left they stop going home and attack without a rest.
- The flags at the bottom right count the stages, and at the end you get your shots fired, hits and hit-miss ratio. The high score starts at 20,000, as the machine's did.
- **Coming back:** leave part way through and you can carry on from the start of the stage you had reached. In ⚙ you can make Fire keep firing while it's held (the arcade made you tap).

**The rules are checked against the arcade's.** `node tools/test-star-swarm.mjs` checks that every stage brings in the right forty in the right places, the points for everything, the two-hit bosses, the Challenging Stage bonuses, capture and rescue, and when extra fighters come; then a simple robot player plays a dozen whole games, twice each, to check that nothing ever jams and that the same game always plays out the same way.

## Snake

The classic: the snake never stops, you steer it, and every apple makes it one longer. Swipe anywhere to turn (one long drag can make several turns); on a computer use the arrow keys or W A S D, and Space or P to pause.

- **Apples** score 10 and the snake speeds up a little as it grows.
- **Gold stars** turn up every fifth apple and only stay a short while: up to 50 points, more the sooner you reach one, and they don't make you longer.
- **Edges:** with Walls, running into the edge ends the game; with No walls you come back in on the other side.
- **Speed:** Slow, Normal or Fast. Each mix of edges and speed keeps its own best score.
- Running into yourself ends the game, but following your own tail round is safe: it moves out of the way first.

`node tools/test-snake.mjs` checks the rules one by one (turning, growing, walls and wrapping, stars and scoring), then a simple robot plays thirty whole games, checking after every step that the snake is still in one piece and that the same game always plays out the same way.

## Honey Run

An endless runner in 3D. A bear cub has made off with a pot of honey and is dashing down a three-lane country railway with the bees after it. Swipe left or right to change lane, up to jump and down to roll (in the air, down drops you fast). On a computer: the arrow keys or W A S D, Space to jump, P to pause.

- **In the way:** jump the fences and hay carts, roll under the striped barriers, and go round the wagons, or run up a ramp and along their roofs, where the best coins are. Some trains roll towards you: their lamps are lit.
- **Bees:** run into something head-on and the run is over. Swipe sideways into a wagon and you only stumble, but the bees close in, and a second stumble while they're near ends the run.
- **Power-ups:** a magnet pulls in coins from every lane, balloons float you over everything along a trail of coins, boots make a jump high enough to land on the roofs, double doubles the score, and a bubble shrugs off one crash.
- **Coins** buy longer-lasting power-ups and new cubs in the shop, and after a crash you can pay to carry on from where you were.
- **Goals:** there are always three in hand. Finish all three and your score multiplier goes up by one for good.
- The line runs through the seasons, 520 metres each: meadow, blossom, autumn, sunset and snow, then round again, getting faster and busier as it goes.
- **Scale:** a wagon stands about twice as tall as the cub and a lane is about twice as wide as the cub is tall. On a phone the camera sits close behind, so the lane you are in nearly fills the screen and the lanes beside it run off the edges; it glides across after the cub when you change lane.
- **A busy line:** the lanes beside you are often a wall of wagons, two to six long, so much of the run is down corridors between trains, with plenty of ramps up onto the roofs, and trains start rolling towards you early on. Signals stand close beside the line and a stone road bridge crosses it every so often, high enough to float under on balloons.
- **Beside the line:** it comes in stretches of 80 metres: open country, a cutting between stone walls with the fields up on top, or a station with a platform and a canopy on each side. Many stretches are electrified, with a lattice gantry over all three tracks every 40 metres and the wires running on overhead (well above the balloons). Everything close to the line streams past at the edges of the screen, so the run feels fast.
- **The look:** bright and glossy. The track bed is dark ballast with chunky sleepers and steel rails, so the cub, the coins and the trains stand out against it. Round things (the cub, wheels, the wagons' rounded roofs, balloons) are shaded smooth; each pixel is lit by the sun from behind the camera and the sky, with a rim of light round the edges and a glint on shiny things. The coins are thick gold honeycomb hexagons that glint as they turn and glow. The cub has a soft shadow right under it that shows where it will land.
- **The feel:** a lane change is quick off the mark and eases into the new lane. The cub sprints with long strides and pumping arms, leans and turns into a lane change, stretches as it jumps and squashes as it lands, kicking up dust. The camera keeps to the height of what the cub last stood on, so a jump is seen to rise, and only climbs when it lands on a roof.

**There is always a way through.** The line is laid a beat at a time, and one lane is always passable on foot: clear, or with a fence to jump, a barrier to roll under or a cart to hop. A train never starts in a lane with no way out to the side. `node tools/test-honey-run.mjs` checks the rules one by one, then a practice player that keeps to that promised lane runs forty different lines for six kilometres each without being stopped.

## Prism Break

A brick breaker. Slide your finger to move the paddle and lift it to launch the ball; break every brick to clear the level. On a computer the paddle follows the mouse (or the arrow keys), and a click or Space launches.

- **Aiming:** where the ball lands on the paddle decides where it goes: the middle sends it straight up, the ends out to the side. A served ball leans in towards the middle of the field, and dots show the way it will go.
- **Bricks:** plain ones break in one hit, tough ones (silver frame) in two, armoured ones (gold studs) in three. Steel never breaks, and doesn't have to. A bomb takes its neighbours with it. A gift always drops a power-up. A hidden brick can't be seen until it's hit.
- **Power-ups** fall as capsules to catch: multi-ball, a wide paddle, a laser, fireballs that burn straight through, slow, a shield along the bottom that saves one ball, and an extra life. Two are worth dodging: shrink and fast.
- **Combos:** each brick broken before the ball touches the paddle again is worth more than the last.
- **Levels:** fifty laid out by hand in five worlds of ten (Daybreak, Ironworks, Treasure Cove, Labyrinth, Supernova), each bringing something new; after that, Deep Space goes on for ever. Three lives a level; three stars for losing none.
- If only a few bricks are left and the ball keeps missing them, the paddle quietly helps by leaning the next bounce towards one.

`node tools/test-prism-break.mjs` checks every level's map, the bounces, each kind of brick and power-up, and then a practice player clears all fifty levels and twenty more, which proves no brick is out of reach and no ball can get stuck for ever.

## New in Town

A whole life in a small seaside town. You step off the train at Starling Bay at 18 with one suitcase, $1,500 and a bunk in the hostel, and live it a season at a time until the end.

- **Seasons and time:** each season gives you a few blocks of time. Tap a place on the map and spend them: work a shift, study, train, see people. Tap **Next** when you're done (on a computer, **N**); time left over counts as rest. Four seasons make a year, and the town changes with them. A bicycle or a car gives you more time every season. At the start of a season, **Same again** on the map plays last season's routine for you until a card comes up (anything played by hand comes out middling, and buying, selling and moving are never repeated).
- **Four skills** open the doors: Smarts, Fitness, Charm and Craft. They grow by doing things, more slowly the higher they get, and faster when you're happy.
- **Work:** now and then somebody you work with becomes a friend, and a drink after a shift keeps you in with them. There are thirteen careers, each a ladder of five or six jobs: kitchens, retail, building, tech, medicine, police, law, music, sport, teaching, the sea, banking and politics. A step up needs skills and shifts worked. There are three ways to do a shift: steadily, going the extra mile (counts for more and the boss notices, but it's tiring), or coasting (easy, counts for less, and the boss notices that too). Stand well with the boss and you can ask for a pay rise and may get a bonus; stand badly enough and you're out. **Me** shows what the next step still needs.
- **Work by hand:** every career has a game of its own, and any shift can be played instead of left to look after itself. A chef taps four pans as each comes ready; a shop assistant counts out change; a builder turns pipes until the water runs through; a programmer clears a board of bugs; a doctor follows a line with a steady finger; a constable picks a face from a witness's description; a lawyer finds the clause that has been changed; a musician plays notes as they reach the line; an athlete sprints, left foot and right; a teacher marks sums; a skipper steers between rocks; a trader buys low and sells high; a politician shakes hands and avoids tomatoes; and Sal's crew feel for the numbers on a safe. Each lasts under a minute and gets harder as you rise, and the skill the career runs on makes its game kinder. Played well, a shift pays up to half as much again and counts for more towards promotion; played badly, it pays and counts for less. After five shifts left to themselves the boss wants to watch, and the next has to be played. Backing out before a game begins costs nothing; giving one up part-way is asked twice and scores only a share of what had been earned.
- **College:** seventeen courses. A qualification lets you start a career partway up: a medical degree makes you a junior doctor, not a porter, and stands in for the nursing diploma and first aid below it. Each course is a run of classes and then an exam; revising lifts your mark, and a merit or distinction earns you more pay for good. Pay class by class, or put it on a student loan that a tenth of your wages then pays off.
- **A business of your own:** start a food stall, market stall, odd-job van, freelance desk, day boat or market pitch. Work in it to bring in money and build its name; with a good name, the skill and the money it grows, three times, into something like a restaurant group. From the second size it earns a little without you, and with a manager, most of what it would with you.
- **Health and mood:** health falls with age, overwork and illness, and when it runs out the life is over. Mood follows how life is going: a better home, friends, love, children, a pet. A good afternoon lifts you less the happier you already are, so it is how life is going, not a run of treats, that keeps a mood up. How you eat (cheaply, plainly or well) shows in your bills, your health and your mood. Being miserable slows everything down.
- **Homes and property:** seven homes, from the hostel bunk to Starling Manor, to rent or to buy with a loan. Buy a better home and the old one stays yours: let it out for rent, sell it, move back in, or trade it in when you buy. There are also places that can only be let (a lock-up, a shop, a guesthouse, an arcade). A home you own and live in can be improved, by builders or with your own hands if you have the Craft: a garden, a kitchen, solar panels, an extra bedroom.
- **The bank:** savings earn interest. There are shares in five local companies and an index fund that holds a little of each. Prices jump about from season to season and climb over the years, but each company's price wanders about what it is really worth and is pulled back towards it, so no lucky run goes on for ever; the miner strikes it rich or runs dry now and then, and a company that sinks far enough goes bust and takes your shares with it. Some pay a dividend every season, and now and then a company makes the news, for better or worse. A company you hold may be bid for (take the money, or hold out for more), and a friend in banking may whisper what Friday's news will be, which is a crime to act on. You can borrow, and insure your health and your home. Owe the bank more than it will stand and it starts selling your things.
- **People:** everyone in town is a man or a woman, with a job and two things they love doing; find those out and time together counts for more. Make friends at the pub, the park or hack night, and keep in touch or they drift away (or let a friendship go yourself). A close friend in the right job does you favours: a doctor gets you money off at the hospital, a banker a better rate on your savings, and so on through all thirteen careers.
- **Family:** you may arrive with a brother or sister back home (an heir's are the other children of the life before). They can be telephoned and seen like anyone else, they marry, turn up on your doorstep with a holdall, share what your parents leave, and do you the same favours as a close friend in their line of work. Grandchildren are people too: take them out for the day, once a season, and watch them grow up.
- **Love:** you say at the start whether you fall for men, women or both. Chat someone up at the pub, try the dating app, or ask out a friend who is single: no need to be friends first. A first date is a card with three ways to go about it, and one of them suits the person: a profile says what they are like, and a stranger at the bar gives it away by how they look. Read them right and your chances are a good deal better. From there: move in together, a ring, a wedding, children. Children have skills of their own that grow with what you do together and where they go to school.
- **The low road:** nobody has to be good. Pick pockets at the station, lift from the shops, drink until closing, start a fight, stray from your other half, lean on your mother for money, cheat in an exam, bend the rules at work (every career has its own way), knock up an antique and sell it to Mr Pym. Sal's back room at the harbour has worse: errands, selling mermaid dust, burglary, cars stolen to order, bare-knuckle fights, a loan with no forms, an insurance fire, night runs out to a trawler if you have a boat, a place in his crew (a career of its own, where every shift is a crime) and, for those he trusts, the bank. Every crime blackens your name and draws the law's eye, and the more it is watching, the likelier the next one goes wrong. Get caught and you can go quietly, run, try a bribe, send for a lawyer or blame Sal. Small things are a fine and a record, which closes some careers; big ones are seasons in Starling Gaol.
- **Starling Gaol:** a sentence is not skipped; you live it. Inside there are four blocks of time a season and nowhere to spend them but the yard, the library, the laundry, the education wing (which gives a real certificate) and the landing. Two things matter: your record with the governor, which is what the parole board reads once half your time is done, and your standing with the other prisoners, which is what keeps you from being fair game. Most things that raise one lower the other. You can fight for your place (and risk a season in the block), run tobacco, inform, appeal, or spend seasons on a way out and go over the wall: free, hunted, and with the rest of the sentence still owing if they find you. Parole means two years on licence. Prison has its own cards: a new cellmate, visiting day, a riot, old Wilf's letter.
- **Old flames and bad blood:** a sweetheart you part from badly is an ex for a few years, to win back, to see once more for old times' sake, or to forget. And now and then somebody takes against you: a man you hit in the pub, a colleague you crossed. An enemy does you small harms (your tyres, your boss, your good name) until the grudge cools, you bury the hatchet, or you see them off with dirty tricks, rumours, your fists, or a word from Sal.
- **Chirper:** with a phone you can post: your dinner, a joke, a strong opinion, a picture from the gym. Each leans on a different skill, and the bigger the crowd, the faster it grows. A following brings fame, and from 5,000 followers companies pay for sponsored posts (the slimming tea pays best and costs your good name). Go quiet and people drift off.
- **Good years and bad:** the Bay has booms and slumps. They move share prices, house prices, what a business takes, bonuses, pay rises, and whether people are laid off. The **Gazette** (at home, at the station, or from the Me tab) reports it every season, with the markets, what is biting, what to sow, what is in Mr Pym's window, the lotto jackpot, the police notebook and the small ads.
- **Weather:** every season has its weather, and the Gazette reports it. Rain waters the allotment for you; a heatwave dries out a bed you did not water and makes for perfect surf; gales keep the boats in harbour and leave far more on the beach; snow makes a bicycle useless; fog suits a thief.
- **A festival every season:** the Spring Fair, Regatta Day, the Harvest Show and the Winter Lights, each marked on the map when it is on, each with three contests for three different skills. One entry a year, and a reigning champion is given a harder time of it.
- **The allotment:** rent a plot at Pebble Park. What can be sown depends on the season (tomatoes in spring, pumpkins in summer, garlic in autumn or winter), each crop takes one or two seasons, and weeding and watering makes for a bigger harvest. A crop left too long is lost. A show marrow sown in spring can be entered in the Harvest Show in autumn, against Mrs Pargeter.
- **Curios:** Mr Pym on the High Street buys and sells twenty old things in five sets of four. His prices wander above and below what a thing is worth, so there is money in buying well and waiting. A complete set sells for twice its parts, or can be given to the museum. He will also buy anything else you own, for well under half what it cost. Curios also turn up on the beach, at car boot sales and in other people's houses.
- **The mayor's appeal:** money is for something. The Town Hall keeps a list of what the town needs and cannot afford, from a bench by the pond to a new lifeboat, a wing for the hospital and a rebuilt pier. Pay for one and your name goes on it. Each does the giver some good too (cheaper courses, cheaper care, better fishing), and an heir who carries on the family finds it still standing and still working for them.
- **The notice board:** three small jobs are pinned up outside the Town Hall every season (a fence to mend, a cat to find, a piano to carry upstairs). Each leans on a skill, pays a little, and is a way to earn and learn before you have a career.
- **A sideline:** every career has one piece of work on the side for those who have got somewhere in it: a chef caters a wedding, a lawyer takes a case for nothing, a skipper takes anglers out for the day.
- **Things happen:** some five hundred and fifty cards with choices (about two hundred of them turn up by chance, the rest follow from what you do), some of them gambles on a skill (the card shows your chance). There are seven longer stories to find: old Marlow on the pier, a bottle on the tideline, a busker with a saxophone, Mrs Pargeter of plot 9, a stray dog from the quay, a school-leaver put in your charge at work, and the mayor's drains. Shady Sal at the harbour pays well for errands, until the constable turns up.
- **Also:** fishing from the harbour wall or out in the bay, with a fish book of twelve kinds that run in different seasons. Fishing is done by hand: watch the float and tap when it dips; a clean strike rarely comes up empty and a fluffed one usually does (the menu can switch this off, and then every strike is a fair one); busking, painting and selling the paintings, writing a novel, holidays from the station, making a record (a hit, like a bestseller, pays royalties for years), slots, Higher or Lower, blackjack and the gull races on the pier, the Bay Lotto, combing the beach, a new cut and colour at Curl Up & Dye, standing for mayor.
- **Up the hill:** a button at the top of the map goes up to the old town, on a map of its own: St Brigid's, the library, the Pavilion theatre, the Rovers' ground, Market Square, Windle Farm, Gorse Head, Smugglers' Cove and Dobbs & Daughter's garage.
- **The townsfolk:** thirteen people of the town (the vicar, the librarian, the farmer, the mechanic and her dad, the harbourmaster, Old Marlow, Betty, Mr Pym, Mrs Pargeter, the Rovers' manager, the director of the Players, the cheese woman and the mayor), each with a friendship that grows by calling and by presents they like, a story of five chapters, and favours to do across the town. A friend in town is worth having: a discount, a perk, a keepsake, a field, a café.
- **Clubs and reading:** six clubs (the choir, the Pavilion Players, the Rovers' Sunday XI, the book club, the sailing club and the pub quiz team). Turn up, rise through the ranks, and play your part by hand on the big day of the club's year: a penalty shoot-out, holding a note, learning your lines, tacking round Gorse Head, a quiz of a hundred questions. The library has a reading list of thirty-one books.
- **The coast:** birds on Gorse Head, by season and weather, with a bird book; caves to feel your way through by lantern before the tide comes in; beachcombing, rock pools and a sandcastle cup at the cove; and the lifeboat, with training, call-outs in bad weather and medals for gallantry. And the mystery of the *Merrow*, a brig lost off the Head two hundred years ago: clues in the archives, the burial register, Old Marlow's stories, an old chart, the tide tables and the caves point to where her treasure lies, which is different in every life.
- **Driving:** lessons with Jess at the garage, a theory test and a driving test played by hand, then a car from the forecourt (with the odd bargain and the odd lemon), MOTs, breakdowns, day trips, lifts, evening driving for money, a classic to restore over several seasons, and penalty points, bans and worse for driving home from the pub.
- **Farm and market:** seasonal work at Windle Farm (stack Tom's trailer by hand), hens, bees, a goat or a pig at home if there is room, and a Saturday stall on Market Square: what you grow, make and keep, priced cheap, fair or dear, and sold by reading each customer in the queue. The Windle Show gives rosettes.
- **Who you become:** sixteen traits grow out of how you actually live (Bookish, Grafter, Night owl, Romantic, Hothead...), at most three at a time, each with a small effect and options of their own on some cards. St Brigid's has Sunday service, volunteering, the bells (played by hand), and life's big days: a church wedding, a christening, a funeral with a eulogy you choose, and a grave to visit. A long low spell or years of overwork can bring a season of the blues or burnout, lifted by people, the vicar, exercise and time.
- **A working life:** every career has a story of its own over twenty years, with a mentor and a rival who remember you, real dilemmas (a death on the operating table and the inquiry after it, a planted bag, a startup in a net loft) and a send-off when you retire.
- **The chapters of a life:** at thirty, forty-five and sixty a card looks back at the chapter just gone and offers new dreams for those done or out of reach. Old age has its own play: an operation, downsizing, the grandchildren to mind, a memoir, a last adventure, and a last illness you can see coming and meet as you choose.
- **Your people want things:** a partner has dreams of their own (a band's tour, a job in the city, a degree, a shop, a boat round the world, a garden), each a chain of cards over the years where supporting, paying for or holding them back has lasting effects; rough patches mend with time together, and anniversaries can be remembered or forgotten. Children grow up through a card at every stage, and the choices decide their skills and what becomes of them. Ageing parents need looking after (your time, a carer, a care home or a room in your house), and friends ask for loans, stakes in their ventures, a speech at their wedding, and you at three in the morning.
- **The low road has a plot:** proper jobs are planned in Sal's back room over seasons: a target (a judge's villa, a security van, the Lucky Gull's counting room, the bank's vault, the Merrow Room), three things to find out about it without being noticed, a crew asked from the people you know (one of whom may be a grass), a way in, a getaway and the night itself as a run of cards. The haul is hot and has to be washed. Detective Sergeant Edie Kitto keeps a file on you across the years, who can be befriended, bought or misled; a rival crew from Kettleby moves in on Sal's patch; a lawyer is a gamble for anyone with a record, and prison remembers you between sentences.
- **A town that grows old:** an election every four years, with candidates whose promises (a lido, a bypass, a tidal barrier, lower rates, the pier rebuilt) are kept or quietly dropped; you can vote, campaign, bet or, as Deputy Mayor, stand. Every few years something big: a storm that wrecks the pier, a supermarket on the edge of town, a film crew, a new estate, the railway threatened, a flood, a royal visit. The High Street's shops come and go and the regulars at the Gull grow old. "Years in the Bay" keeps a headline for every year you lived there.
- **The flutter:** big bets every season and chasing losses become a habit, which makes a season without one miserable and the people at home find the statements. The Tuesday group at St Brigid's helps, and the Lucky Gull will bar you if you ask.
- **Dreams, a to-do list and trophies:** each life picks three dreams to chase (the start screen can offer others), and new ones come with each chapter. A to-do list walks you through the first few years. Some hundred and seventy trophies are kept across every life.
- **The end, and what comes after:** the Gazette prints an obituary made from what you actually did. Each life ends with one of twenty ribbons (The Tycoon, The Benefactor, The Founder, The Healer, The Kingpin, The Sensation, The Old Lag, Heart of the Family, A Quiet Life...). Every ribbon unlocks an heirloom that a later life can bring along. A will, made during the life, says who carries on and who gets the house, the business and the money; death duty takes its share of a big estate (the Me tab shows what would be left), and the family home and a business handed on pass free. The heir carries on as themselves: a grown child or grandchild at their own age, at home in the Bay, with their job, their family and a letter from the life before; a child under eighteen comes back at eighteen.

A life begun in the first version of the game carries on in this one: it is asked, once, who it is.

`node tools/test-new-in-town.mjs` checks the rules one at a time, then practice players live whole lives: one sets out to climb each career, which proves every ladder can be climbed, and one does things at random, which proves nothing it can do breaks the game. It also runs the share prices forward twenty years, three hundred times over, to check that they mostly end up higher. One random player in three takes the low road as well, and most of those end up living through a prison sentence. The house's edge at blackjack, the gull races and the lotto is measured over thousands of goes. Every puzzle the work games can deal (pipes, bug boards, change to count, line-ups, altered clauses, sums, tunes, share prices) is checked to have exactly the answer it should. A saved life, loaded again, must carry on exactly the same. Each of the newer parts has its own checks in `tools/new-in-town-tests/`, run along with the rest: every club's occasion, every townsperson's whole story, a Merrow that can always be solved and never given away by one clue, a car that is never both had and not had, a stall that cannot be farmed, a life saved before each part existed opening cleanly.

## Files

- `index.html`: the arcade menu
- `games/arrow-cube/`: Arrow Cube (`topology.js` turns a shape into cells and planes, `rules.js` holds the rules, `generator.js` builds the shapes and levels, `render.js` draws them with WebGL)
- `games/hexit/`: Hexit (`hex.js` is the honeycomb geometry and board shapes, `rules.js` holds the rules, `levels.js` builds the boards backwards, `draw.js` draws the tiles, `game.js` is the screen)
- `games/gem-swap/`: Gem Swap (`engine.js` has the rules: matches, power-ups, combos, falling gems and everything in the way; `levels.js` builds the levels and `bot.js` is the practice player that sets their moves; `art.js` draws the gems and power-ups and `scenes.js` the places behind the board; `game.js` plays it all out on screen)
- `games/water-sort/`: Water Sort (`logic.js` has the rules, level generator and solver; `game.js` draws and animates the tubes)
- `games/car-park/`: Car Park (`logic.js` has the rules, the exact solver and the puzzle maker, `seeds.js` the bank of hard and expert car parks, `worker.js` builds puzzles off the main thread, `game.js` draws the car park and handles dragging)
- `games/sudoku/`: Sudoku (`logic.js` makes and grades puzzles; `game.js` is the board)
- `games/nonogram/`: Nonogram (`logic.js` has the rules, the line-by-line solver, the hints and the puzzle maker; `pictures.js` draws the pictures, including the hand-drawn 10×10 icons; `game.js` is the board)
- `games/minesweeper/`: Minesweeper (`logic.js` makes no-guess boards and solves them; `game.js` draws the board and handles touch)
- `games/star-swarm/`: Star Swarm (`engine.js` is the whole game as plain numbers, stepped 60 times a second: flight scripts, the formation, attacks, the tractor beam, scoring; `sprites.js` is the pixel art and the arcade font; `game.js` draws it and handles the controls)
- `games/snake/`: Snake (`engine.js` has the rules: steps, turns, apples, stars, walls and wrapping; `game.js` draws the snake sliding from cell to cell and handles swipes and keys)
- `games/honey-run/`: Honey Run (`engine.js` has the rules and lays the line; `gl.js` is a small WebGL renderer: flat and smooth shading, light worked out for each pixel with a rim and a glint, fog, a world that bends away, shadows, soft glows; `models.js` builds the cub, wagons, coins and power-ups, `world.js` the countryside, its seasons and the stretches beside the line; `game.js` is the camera, controls, shop and goals)
- `games/prism-break/`: Prism Break (`engine.js` is the physics and the rules; `levels.js` the fifty maps and the ones built after; `bot.js` the practice player, which also plays behind the title; `art.js` paints the bricks, capsules and backdrops; `game.js` is the screen)
- `games/new-in-town/`: New in Town (`data.js` lists everything in the town: places, careers, courses, homes, shops, shares, businesses, fish, dreams, trophies and ribbons; `events.js` is the cards that turn up; `engine.js` has the rules of a life, with no screen: time, money, skills, work, study and the turn of the seasons; `living.js` adds the bigger parts: people and love and children, property, a business, fishing; `vice.js` adds the low road: crime, vice, Sal's crew and the law; `inside.js` is prison; `feuds.js` exes and enemies; `pier.js` blackjack, the gull races and the lotto; `fame.js` followers and royalties; `town.js` the economy, the Gazette, the allotment and the curio shop; `legacy.js` gifts to the town, sidelines and the obituary; `kin.js` brothers, sisters and grandchildren; the newer parts each live in a file of their own, listed in `mods.js` (their rules) and `ui-mods.js` (their screens), and plug into the rules through the hooks described at the top of `engine.js`: `hill.js` the plain things to do up the hill, `folk.js` (with `folk-cast.js` and `folk-tales.js`) the townsfolk, `clubs.js` clubs and reading, `coast.js` the coast and the Merrow, `motor.js` driving and the garage, `market.js` the farm and the market, `soul.js` traits, church and the mind, `careers.js` (with `careers-tales.js`) the story of each career, `chapters.js` chapters, old age and the will, `flutter.js` the gambling habit, `wants.js` (with `wants-lib.js`, `wants-partner.js` and `wants-family.js`) what your people want, `heists.js` the low road's plans, the detective and the rival crew, `annals.js` the town's elections and history; `mini.js` is the fourteen games played at work, and `minilogic.js` makes their puzzles and marks them, and the newer parts' games are in their own `-games.js` files; `art.js` draws the map and the faces; `game.js` is the screen)
- `shared/`: sound, haptics, saving and offline support used by every game (`arcade.js`), plus the screen frame, pop-up cards and confetti used by the newer games (`screen.css`, `ui.js`)
- `sw.js`: the offline file list. Regenerate it after any change with `node tools/build-sw.mjs`
- `tools/`: the local server, the tests for each game, and the icon maker (`tools/make-icons.ps1`)
