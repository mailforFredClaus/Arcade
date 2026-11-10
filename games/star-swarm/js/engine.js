// The rules of Star Swarm: a shooter in the style of the 1981 arcade classic.
//
// Everything here is plain numbers on a 224 x 288 screen, stepped 60 times a
// second, with no drawing and no browser: game.js draws what it finds here,
// and tools/test-star-swarm.mjs plays whole games without a screen.
//
// Enemies fly like the arcade machine's did: each has a heading and a speed,
// and follows a little script of "fly this many frames, turning this much
// each frame". That's what gives the loops and swoops their shape.
//
// Angles are in radians, 0 = up the screen, turning clockwise as they grow.

export const W = 224, H = 288;
export const PLAYER_Y = 258;
export const PLAYER_V = 1.84; // the fighter crosses the screen in a little under two seconds
export const SHOT_V = 6.75; // its shots
const LEAN = 0.27; // how far an enemy's shot can lean: this much sideways for each pixel down
export const BEE = 0, FLY = 1, BOSS = 2, MORPH = 3, ROGUE = 4, GUEST = 5;

const D = Math.PI / 180, PI = Math.PI, TAU = 2 * PI;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
// An angle as the shortest turn, between -PI and PI.
const turnTo = (a) => { a %= TAU; return a > PI ? a - TAU : a < -PI ? a + TAU : a; };

// Points, as on the arcade machine: [sitting in the formation, flying].
export const POINTS = { [BEE]: [50, 100], [FLY]: [80, 160], [BOSS]: [150, 400], [MORPH]: [160, 160], [ROGUE]: [1000, 1000], [GUEST]: [100, 100] };
export const CAPTIVE_POINTS = [500, 1000];
// A boss shot down mid-dive is worth more for each of its escorts shot first.
export const BOSS_DIVE_POINTS = [400, 800, 1600];
// Shooting all three of a bee's transformations: by which trio it was.
export const MORPH_BONUS = [1000, 2000, 3000];
export const MORPH_LOOKS = ['scorpion', 'saucer', 'flagship'];
// Challenging Stages: for clearing a whole group of eight, by which
// Challenging Stage it is (1st and 2nd, 3rd and 4th, ...); 100 a hit at the
// end, or 10,000 for all forty.
export const GROUP_BONUS = [1000, 1000, 1500, 1500, 2000, 2000, 3000, 3000];
export const PERFECT_BONUS = 10000;
export const GUEST_LOOKS = ['bee', 'fly', 'dragonfly', 'satellite', 'starship', 'bee', 'fly', 'dragonfly'];
// A new fighter at 20,000, at 70,000, and every 70,000 after that.
export const extraAt = (k) => (k === 0 ? 20000 : 70000 * k);

export const isChallenge = (stage) => stage >= 3 && (stage - 3) % 4 === 0;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- flight scripts ------------------------------------------------------------
//
// ['F', frames, degrees per frame]  fly, turning
// ['A', degrees]       point at the player, at most this far off straight down
// ['Y', y]             fly straight until this far down the screen
// ['C', degrees, rate] curve round towards the middle of the screen
// ['S']                fire, if there's a shot left
// ['L']                where to pick up again when attacking without a rest
// ['G']                (boss) fly to a spot above the player
// ['B']                (boss) the tractor beam
// ['W']                fly off the bottom, come back in at the top, go home
// ['H']                go home to the formation
// ['X']                fly straight on and off the screen for good
//
// Scripts are written for an enemy on the left; one on the right flies the
// mirror image.

// Ways in, at the start of a stage: where from, heading, then the script.
export const ENTRIES = {
  // From the top, across the middle and round in a J.
  top: { x: 122, y: -10, a: 202, sc: [['F', 34, 0], ['S'], ['F', 40, -5], ['H']] },
  // From low on the left: sweep in, loop the loop, then up.
  side: { x: -10, y: 238, a: 68, sc: [['F', 16, 0], ['F', 22, -3], ['S'], ['F', 45, -8], ['H']] },
  // Down from the top left, round in a U by the wall.
  wall: { x: 66, y: -10, a: 172, sc: [['F', 36, 0], ['S'], ['F', 30, 6], ['H']] },
};
// The tail a straggler flies instead of going home: straight into an attack.
const STRAGGLER = [['F', 15, 12], ['A', 40], ['S'], ['Y', H + 14], ['W']];

// Attackers don't come straight down: they swing out to one side and back
// across, which is what leaves room to slip in under them. And they fire on
// the way down, not as they set off.
const SWOOP = [['F', 12, 4.4], ['F', 12, -4.4], ['S'], ['F', 24, -4.4], ['S'], ['F', 24, 4.4]];
const DIVES = {
  bee: [['F', 14, -13], ['L'], ['A', 38], ...SWOOP, ['Y', 236], ['C', 250, 9], ['H']],
  beeLong: [['F', 14, -13], ['L'], ['A', 38], ...SWOOP, ['Y', H + 14], ['W']],
  fly: [['F', 14, -13], ['L'], ['A', 30], ['F', 13, 4.5], ['S'], ['F', 26, -4.5], ['F', 13, 4.5], ['S'], ['F', 13, 4.5], ['F', 26, -4.5], ['F', 13, 4.5], ['Y', H + 14], ['W']],
  boss: [['F', 16, -11.25], ['F', 8, 0], ['F', 45, 8], ['L'], ['A', 40], ...SWOOP, ['Y', H + 14], ['W']],
  beam: [['F', 16, -11.25], ['G'], ['B'], ['A', 30], ['Y', H + 14], ['W']],
  rogue: [['F', 14, -13], ['A', 30], ['S'], ['Y', 120], ['F', 14, 4.5], ['F', 28, -4.5], ['S'], ['F', 28, 4.5], ['F', 14, -4.5], ['X']],
  morph: [['A', 30], ['Y', 110], ['F', 14, 4.5], ['F', 28, -4.5], ['S'], ['F', 28, 4.5], ['F', 14, -4.5], ['X']],
};

// Fly-pasts for the Challenging Stages: nobody stops, nobody shoots.
export const PASSES = {
  // Across the top, a loop, and out over the far shoulder.
  cross: { x: 128, y: -10, a: 200, sc: [['F', 30, 0], ['F', 60, -6], ['F', 14, 0], ['F', 30, 4.5], ['X']] },
  // In low from the side, a loop, and away over the top.
  sweep: { x: -10, y: 230, a: 75, sc: [['F', 26, 0], ['F', 45, -8], ['F', 34, 0], ['F', 30, -3], ['X']] },
  // Down, across, a loop, and out of the bottom.
  hook: { x: 56, y: -10, a: 180, sc: [['F', 26, 0], ['F', 30, -3], ['F', 8, 0], ['F', 60, 6], ['F', 30, 3], ['X']] },
  // A zigzag down the screen.
  zigzag: { x: 36, y: -10, a: 150, sc: [['F', 38, 0], ['F', 20, 6], ['F', 30, 0], ['F', 20, -6], ['F', 36, 0], ['F', 20, 6], ['X']] },
  // Up from the side, over the top, a loop, and down and out.
  arch: { x: -10, y: 184, a: 60, sc: [['F', 26, 0], ['F', 30, -2], ['F', 36, -5], ['F', 16, 0], ['F', 45, 8], ['X']] },
  // Down the middle and one big circle.
  wheel: { x: 96, y: -10, a: 180, sc: [['F', 40, 0], ['F', 90, -4], ['X']] },
};
// The five groups of each of the eight Challenging Stages (then they repeat):
// [path, 'split' for four each side at once, or which side all eight come from].
const CHALLENGES = [
  [['cross', 'split'], ['sweep', 1], ['sweep', -1], ['hook', 1], ['hook', -1]],
  [['wheel', 'split'], ['arch', 1], ['arch', -1], ['zigzag', 1], ['zigzag', -1]],
  [['hook', 'split'], ['cross', 1], ['cross', -1], ['sweep', 1], ['sweep', -1]],
  [['zigzag', 'split'], ['sweep', 1], ['sweep', -1], ['arch', 1], ['arch', -1]],
  [['arch', 'split'], ['wheel', 1], ['wheel', -1], ['cross', 1], ['cross', -1]],
  [['sweep', 'split'], ['hook', 1], ['hook', -1], ['zigzag', 1], ['zigzag', -1]],
  [['cross', 'split'], ['arch', 1], ['arch', -1], ['wheel', 1], ['wheel', -1]],
  [['wheel', 'split'], ['zigzag', 1], ['zigzag', -1], ['hook', 1], ['hook', -1]],
];

// Who flies in with each of a stage's five waves, and where they end up:
// [kind, row, column] in the formation (bosses on top, then two rows of
// butterflies, then two of bees).
const WAVES = [
  [[FLY, 1, 4], [BEE, 3, 4], [FLY, 1, 5], [BEE, 3, 5], [FLY, 2, 4], [BEE, 4, 4], [FLY, 2, 5], [BEE, 4, 5]],
  [[BOSS, 0, 3], [FLY, 1, 3], [BOSS, 0, 4], [FLY, 1, 6], [BOSS, 0, 5], [FLY, 2, 3], [BOSS, 0, 6], [FLY, 2, 6]],
  [[FLY, 1, 1], [FLY, 1, 8], [FLY, 1, 2], [FLY, 1, 7], [FLY, 2, 1], [FLY, 2, 8], [FLY, 2, 2], [FLY, 2, 7]],
  [[BEE, 3, 2], [BEE, 3, 7], [BEE, 3, 3], [BEE, 3, 6], [BEE, 4, 2], [BEE, 4, 7], [BEE, 4, 3], [BEE, 4, 6]],
  [[BEE, 3, 0], [BEE, 3, 9], [BEE, 3, 1], [BEE, 3, 8], [BEE, 4, 0], [BEE, 4, 9], [BEE, 4, 1], [BEE, 4, 8]],
];

export class Game {
  // Start a game, or pick one up at the start of a stage (see snapshot()).
  constructor({ seed = 1, stage = 1, score = 0, reserves = 2, dual = false, shots = 0, hits = 0 } = {}) {
    this.rand = rng(seed);
    this.frame = 0;
    this.stage = stage - 1;
    this.score = score;
    this.reserves = reserves;
    this.shots = shots;
    this.hits = hits;
    this.extras = 0;
    while (score >= extraAt(this.extras)) this.extras++;
    this.player = { x: W / 2, y: PLAYER_Y, st: 'alive', t: 0, dual, cool: 0, spin: 0, captured: false };
    this.enemies = [];
    this.pShots = [];
    this.eShots = [];
    this.booms = [];
    this.popups = [];
    this.events = [];
    this.rescue = null;
    this.capMsg = 0;
    this.volley = 0;
    this.nextId = 1;
    this.first = true;
    this.over = false;
    this.nextStage();
  }

  // Enough to start this stage again later: saved when a stage begins.
  snapshot() {
    return { stage: this.stage, score: this.score, reserves: this.reserves, dual: this.player.dual, shots: this.shots, hits: this.hits };
  }

  emit(name, k = 0) { this.events.push([name, k]); }

  addScore(n) {
    this.score += n;
    while (this.score >= extraAt(this.extras)) {
      this.extras++;
      this.reserves++;
      this.emit('extra');
    }
  }

  // ---- stages ---------------------------------------------------------------------

  nextStage() {
    const s = ++this.stage;
    this.challenge = isChallenge(s);
    // Which Challenging Stage this is, counting from 0.
    this.challengeNo = this.challenge ? (s - 3) / 4 : -1;
    this.phase = 'intro';
    this.t = 0;
    this.introLen = this.first ? 190 : 120;
    this.enemies = [];
    this.eShots = [];
    this.sway = 0;
    this.breath = 0;
    this.spread = 0;
    this.launchT = 60;
    this.rot = 0;
    this.side = 1;
    this.morphs = 0;
    this.groups = [];
    this.stageHits = 0;
    this.stageKills = 0;
    // How hard this stage is.
    this.diveV = Math.min(3.2, 2.1 + 0.06 * s);
    // Shots fall a good deal faster than the attackers come down, so a
    // shot is well clear before whoever fired it arrives.
    this.shotV = Math.min(4.6, 3.2 + 0.07 * s);
    this.maxGroups = Math.min(5, 2 + Math.floor(s / 3));
    this.launchGap = Math.max(34, 100 - 4 * s);
    // Nobody shoots on stage 1. After that more and more of the attackers
    // carry a shot, and later two or three.
    this.ammo = s < 2 ? 0 : s < 5 ? 1 : s < 10 ? 2 : 3;
    this.armed = s < 2 ? 0 : Math.min(1, 0.3 + 0.1 * s);
    this.maxShots = Math.min(10, 3 + s);
    this.frenzyAt = s < 6 ? 3 : s < 14 ? 4 : 5;
    this.waves = this.challenge ? this.challengeWaves() : this.stageWaves();
    this.waveI = -1;
    this.waveT = 0;
    this.gap = 0;
    this.emit('stage', s);
  }

  // The five waves of an ordinary stage.
  stageWaves() {
    const s = this.stage;
    // Ordinary stages, counted from 0: they take turns coming in single file
    // and two abreast, and swap sides every other time.
    const reg = s - 1 - (s >= 3 ? Math.floor((s - 3) / 4) + 1 : 0);
    const paired = reg % 2 === 1, flip = reg % 4 >= 2 ? -1 : 1;
    const stragglers = s < 4 ? 0 : s < 10 ? 1 : 2;
    const v = Math.min(3.6, 2.9 + 0.03 * s);
    return WAVES.map((list, w) => {
      const members = list.map(([kind, row, col], i) => {
        let path, mir, at, off = [0, 0];
        if (w === 0) {
          // Two files of four at once, crossing over at the top.
          path = 'top'; mir = i % 2 ? -1 : 1; at = (i >> 1) * 6;
        } else {
          path = w < 3 ? 'side' : 'wall';
          mir = (w % 2 ? 1 : -1) * flip;
          if (paired) {
            at = (i >> 1) * 8;
            if (i % 2) off = path === 'side' ? [0, 15] : [15, 0];
          } else at = i * 6;
        }
        const m = { kind, row, col, path, mir, at, off, v, tail: null };
        if (w > 0 && i >= list.length - stragglers) m.tail = STRAGGLER;
        return m;
      });
      return { members, lastAt: Math.max(...members.map((m) => m.at)) };
    });
  }

  // The five fly-pasts of a Challenging Stage.
  challengeWaves() {
    const n = this.challengeNo, look = GUEST_LOOKS[n % 8];
    const paired = n % 8 >= 2 && n % 2 === 0;
    const v = Math.min(4, 3.1 + 0.08 * n);
    return CHALLENGES[n % 8].map(([path, how], g) => {
      this.groups.push({ size: 8, killed: 0 });
      const members = [];
      for (let i = 0; i < 8; i++) {
        let mir, at, off = [0, 0];
        if (how === 'split') { mir = i % 2 ? -1 : 1; at = (i >> 1) * 6; }
        else if (paired) { mir = how; at = (i >> 1) * 8; if (i % 2) off = PASSES[path].y < 0 ? [15, 0] : [0, 15]; }
        else { mir = how; at = i * 6; }
        members.push({ kind: GUEST, look, group: g, path, mir, at, off, v, pass: true });
      }
      return { members, lastAt: Math.max(...members.map((m) => m.at)) };
    });
  }

  spawn(m, wave) {
    const p = (m.pass ? PASSES : ENTRIES)[m.path];
    const sc = m.tail ? p.sc.slice(0, -1).concat(m.tail) : p.sc;
    const e = {
      id: this.nextId++, kind: m.kind, look: m.look || ['bee', 'fly', 'boss'][m.kind], row: m.row ?? -9, col: m.col ?? -9,
      x: m.mir > 0 ? p.x + m.off[0] : W - p.x - m.off[0], y: p.y + m.off[1], a: p.a * D * m.mir, v: m.v,
      st: 'path', sc, pc: 0, n: 0, tr: 0, mir: m.mir, hp: m.kind === BOSS ? 2 : 1,
      dive: !!m.tail, entry: true, wave, group: m.group ?? -1, squad: null, loop: -1,
      ammo: !this.challenge && this.stage >= 2 && this.rand() < (m.tail ? 1 : 0.25) ? 1 : 0,
      captive: false, side: 0, bt: -1, catching: false,
    };
    this.enemies.push(e);
    return e;
  }

  // Where a place in the formation is right now (it sways while the enemies
  // arrive, then breathes in and out).
  slot(row, col) {
    return [W / 2 + this.sway + (col - 4.5) * 16 * (1 + 0.22 * this.spread), 40 + row * (16 + 3 * this.spread)];
  }

  // How many enemies are still to be dealt with this stage.
  remaining() {
    let n = this.enemies.length;
    for (let w = Math.max(0, this.waveI); w < this.waves.length; w++) {
      n += this.waves[w].members.filter((m) => !m.done).length;
    }
    return n;
  }

  // ---- one frame ------------------------------------------------------------------

  // input: { left, right, fire } (fire: true on a frame a shot is asked for)
  step(input = {}) {
    if (this.over) { this.t++; return; }
    this.frame++;
    this.t++;
    this.stepPhase();
    this.stepFormation();
    this.stepPlayer(input);
    for (const e of this.enemies.slice()) this.stepEnemy(e);
    this.director();
    this.stepShots();
    this.stepRescue();
    this.collide();
    for (const b of this.booms) b.t++;
    this.booms = this.booms.filter((b) => b.t < (b.big ? 48 : 20));
    for (const p of this.popups) p.t++;
    this.popups = this.popups.filter((p) => p.t < 70);
    if (this.capMsg > 0) this.capMsg--;
  }

  stepPhase() {
    if (this.phase === 'intro') {
      if (this.t >= this.introLen) { this.phase = 'entry'; this.t = 0; this.first = false; this.waveI = 0; this.waveT = 0; }
      return;
    }
    if (this.phase === 'entry') {
      const wave = this.waves[this.waveI];
      for (const m of wave.members) {
        if (!m.done && m.at <= this.waveT) { m.done = true; this.spawn(m, this.waveI); }
      }
      this.waveT++;
      if (this.waveT > wave.lastAt) {
        // (Stragglers peel off to attack: nobody waits for them.)
        const still = this.enemies.filter((e) => e.wave === this.waveI && (this.challenge || (e.entry && !e.dive && e.st === 'path')));
        const late = this.challenge && this.waveT > wave.lastAt + 190;
        if (!still.length || late) {
          if (this.waveI + 1 < this.waves.length) {
            if (++this.gap >= (this.challenge ? 30 : 22)) { this.waveI++; this.waveT = 0; this.gap = 0; }
          } else if (!this.challenge) { this.phase = 'battle'; this.t = 0; }
          else if (!this.enemies.length) { this.phase = 'results'; this.t = 0; }
        } else this.gap = 0;
      }
    }
    if (this.phase === 'battle' && !this.enemies.length) { this.phase = 'clear'; this.t = 0; }
    else if (this.phase === 'clear') { if (this.t > 100 && this.player.st === 'alive' && !this.rescue) this.nextStage(); }
    else if (this.phase === 'results') {
      if (this.t === 110) {
        const perfect = this.stageHits === 40;
        this.addScore(perfect ? PERFECT_BONUS : this.stageHits * 100);
        this.emit(perfect ? 'perfect' : 'tally');
      }
      if (this.t > 330) this.nextStage();
    }
  }

  stepFormation() {
    if (this.phase === 'battle' || this.phase === 'clear') {
      this.sway *= 0.94;
      this.breath++;
      this.spread = 0.5 - 0.5 * Math.cos((TAU * this.breath) / 170);
    } else {
      this.sway = 11 * Math.sin((TAU * this.frame) / 210);
      this.spread = 0;
    }
  }

  // ---- the player -------------------------------------------------------------------

  ships() {
    const p = this.player;
    return p.dual ? [p.x - 8, p.x + 8] : [p.x];
  }

  stepPlayer(input) {
    const p = this.player;
    if (p.cool > 0) p.cool--;
    if (p.st === 'alive') {
      const edge = p.dual ? 18 : 10;
      p.x = clamp(p.x + ((input.right ? PLAYER_V : 0) - (input.left ? PLAYER_V : 0)), edge, W - edge);
      if (input.fire && p.cool === 0 && this.phase !== 'results') {
        const live = new Set(this.pShots.map((s) => s.v));
        if (live.size < 2) {
          this.volley++;
          for (const x of this.ships()) { this.pShots.push({ x, y: p.y - 10, v: this.volley }); this.shots++; }
          p.cool = 4;
          this.emit('shot');
        }
      }
    } else if (p.st === 'dead') {
      p.t++;
      if (this.rescue) return; // the freed fighter is on its way to take over
      const quiet = !this.enemies.some((e) => e.dive) || p.t > 540;
      if (p.t > 110 && quiet && this.phase !== 'intro') {
        if (this.reserves > 0) { this.reserves--; p.st = 'ready'; p.t = 0; p.x = W / 2; p.dual = false; }
        else this.gameOver();
      }
    } else if (p.st === 'ready') {
      if (++p.t > 85) { p.st = 'alive'; p.captured = false; }
    }
  }

  // One of the player's ships is hit.
  hitShip(x) {
    const p = this.player;
    if (p.dual) {
      // The other one of the pair flies on alone.
      this.booms.push({ x, y: p.y, t: 0, big: true });
      p.dual = false;
      p.x = x < p.x ? p.x + 8 : p.x - 8;
      this.emit('crash');
      return;
    }
    this.booms.push({ x: p.x, y: p.y, t: 0, big: true });
    p.st = 'dead';
    p.t = 0;
    p.captured = false;
    this.emit('crash');
  }

  gameOver() {
    this.player.st = 'gone';
    this.phase = 'over';
    this.over = true;
    this.t = 0;
    this.emit('over');
  }

  // ---- enemies ----------------------------------------------------------------------

  fly(e) {
    e.a += e.tr;
    e.x += Math.sin(e.a) * e.v;
    e.y -= Math.cos(e.a) * e.v;
  }

  stepEnemy(e) {
    if (e.st === 'form') {
      [e.x, e.y] = this.slot(e.row, e.col);
      const d = turnTo(-e.a);
      e.a = Math.abs(d) < 0.25 ? 0 : e.a + Math.sign(d) * 0.25;
      if (e.side > 0) e.side = Math.max(0, e.side - 0.1);
    } else if (e.st === 'home') {
      const [tx, ty] = this.slot(e.row, e.col);
      if (this.steer(e, tx, ty)) {
        e.st = 'form';
        e.dive = false;
        e.entry = false;
        e.squad = null;
        e.x = tx;
        e.y = ty;
      }
    } else if (e.st === 'morph') {
      [e.x, e.y] = this.slot(e.row, e.col);
      if (++e.n > 45) this.morph(e);
    } else this.stepScript(e);
    if (e.kind === BOSS && e.captive && e.st !== 'form' && e.side < 1) e.side = Math.min(1, e.side + 0.05);
  }

  // Fly towards a spot, turning no faster than an enemy can. True on arrival.
  steer(e, tx, ty) {
    const dx = tx - e.x, dy = ty - e.y, dist = Math.hypot(dx, dy);
    if (dist <= Math.max(3, e.v * 1.1)) return true;
    const want = Math.atan2(dx, -dy);
    if (dist < 30) e.a = want;
    else e.a += clamp(turnTo(want - e.a), -10 * D, 10 * D);
    e.x += Math.sin(e.a) * e.v;
    e.y -= Math.cos(e.a) * e.v;
    return false;
  }

  stepScript(e) {
    const p = this.player;
    for (let guard = 0; guard < 12; guard++) {
      if (e.n > 0) { e.n--; this.fly(e); return; }
      e.tr = 0;
      const c = e.sc[e.pc++];
      if (!c) { e.st = 'home'; return; }
      switch (c[0]) {
        case 'F': e.n = c[1]; e.tr = c[2] * D * e.mir; break;
        case 'L': e.loop = e.pc; break;
        case 'A': {
          // A boss and its escorts all take the boss's line.
          if (e.squad && e.squad.aim !== null) { e.a = e.squad.aim; break; }
          const off = clamp(turnTo(Math.atan2(p.x - e.x, -(p.y - e.y)) - PI), -c[1] * D, c[1] * D);
          e.a = PI + off;
          if (e.squad) e.squad.aim = e.a;
          break;
        }
        case 'S': this.fire(e); break;
        case 'C': e.n = Math.round(c[1] / c[2]); e.tr = (e.x > W / 2 ? 1 : -1) * c[2] * D; break;
        case 'Y':
          if (e.y < c[1]) { e.pc--; this.fly(e); return; }
          break;
        case 'G': {
          if (!this.steer(e, clamp(p.x, 28, W - 28), 160)) { e.pc--; return; }
          break;
        }
        case 'B':
          if (this.beam(e)) { e.pc--; return; }
          break;
        case 'W': {
          if (e.y < H + 12) { e.pc--; this.fly(e); return; }
          e.y = -10;
          e.a = PI;
          // With only a few left they don't go home: straight back to the attack.
          if (e.loop >= 0 && p.st === 'alive' && this.phase === 'battle' && this.enemies.length <= this.frenzyAt) {
            e.x = clamp(p.x + (this.rand() - 0.5) * 80, 16, W - 16);
            e.pc = e.loop;
            e.ammo = this.rand() < this.armed ? this.ammo : 0;
            if (e.squad) e.squad.aim = null;
          } else {
            e.x = clamp(this.slot(e.row, e.col)[0], 8, W - 8);
            e.st = 'home';
          }
          return;
        }
        case 'H': e.st = 'home'; e.entry = false; return;
        case 'X':
          this.fly(e);
          if (e.x < -20 || e.x > W + 20 || e.y < -20 || e.y > H + 20) { this.remove(e); return; }
          e.pc--;
          return;
      }
    }
  }

  fire(e) {
    const p = this.player;
    if (e.ammo <= 0 || this.challenge || p.st !== 'alive' || e.y > 196 || this.eShots.length >= this.maxShots) return;
    e.ammo--;
    const vy = this.shotV, frames = (p.y - e.y) / vy;
    // Aimed at where the player is, but it can only lean so far.
    this.eShots.push({ x: e.x, y: e.y + 6, vx: clamp((p.x - e.x) / frames, -vy * LEAN, vy * LEAN), vy });
  }

  // The boss's tractor beam. True while it's still going.
  beam(e) {
    const p = this.player;
    if (e.bt < 0) { e.bt = 0; e.a = PI; this.emit('beam'); }
    e.bt++;
    if (e.catching) {
      // The fighter spins up the beam to the boss.
      p.spin += 0.5;
      p.x += clamp(e.x - p.x, -1, 1);
      p.y -= 1.1;
      if (p.y <= e.y + 16) {
        e.catching = false;
        e.captive = true;
        e.bt = -1;
        e.st = 'home';
        p.st = 'dead';
        p.t = 0;
        p.captured = true;
        p.y = PLAYER_Y;
        this.capMsg = 170;
        this.emit('captured');
        return true;
      }
      return true;
    }
    const reach = this.beamReach(e);
    if (reach > 0.6 && e.bt <= 150 && p.st === 'alive' && !p.dual && Math.abs(p.x - e.x) < 21 * reach) {
      e.catching = true;
      p.st = 'beamed';
      p.spin = 0;
      this.emit('caught');
      return true;
    }
    if (e.bt > 180) { e.bt = -1; return false; }
    return true;
  }

  // How far out the beam is: 0 to 1.
  beamReach(e) {
    if (e.bt < 0) return 0;
    if (e.catching) return 1;
    return e.bt < 30 ? e.bt / 30 : e.bt > 150 ? Math.max(0, (180 - e.bt) / 30) : 1;
  }

  // Where a boss's captured fighter is: above it in the formation, at its
  // side on the way down.
  captivePos(e) {
    const s = Math.sin(e.a), c = Math.cos(e.a), k = e.side;
    const ox = 16 * k, oy = -16 * (1 - k);
    return [e.x + ox * c - oy * s, e.y + ox * s + oy * c];
  }

  // Send enemies out of the formation to attack.
  director() {
    const p = this.player;
    if (this.phase !== 'battle' || p.st !== 'alive' || this.rescue) return;
    if (--this.launchT > 0) return;
    const out = new Set();
    for (const e of this.enemies) if (e.dive) out.add(e.squad || e);
    const frenzy = this.enemies.length <= this.frenzyAt;
    if (out.size >= (frenzy ? 9 : this.maxGroups)) return;
    const home = this.enemies.filter((e) => e.st === 'form');
    if (!home.length) return;
    let pick = null;
    for (let k = 0; k < 3 && !pick; k++) {
      const kind = [BEE, FLY, BOSS][(this.rot + k) % 3];
      const of = home.filter((e) => e.kind === kind);
      if (!of.length) continue;
      if (kind === BOSS) pick = of[(this.rand() * of.length) | 0];
      else {
        // From the outside in, one side then the other.
        const mine = of.filter((e) => (e.col < 5 ? 1 : -1) === this.side);
        const list = (mine.length ? mine : of).sort((a, b) => Math.abs(b.col - 4.5) - Math.abs(a.col - 4.5) || b.row - a.row);
        pick = list[(this.rand() * Math.min(3, list.length)) | 0];
      }
    }
    this.rot++;
    this.side = -this.side;
    this.launchT = frenzy ? 20 : this.launchGap + ((this.rand() * 30) | 0);
    if (!pick) return;
    if (pick.kind === BEE && this.stage >= 4 && this.morphs < (this.stage < 8 ? 1 : 2) && home.length > 8 && this.rand() < 0.4) {
      this.morphs++;
      pick.st = 'morph';
      pick.n = 0;
      pick.dive = true;
      return;
    }
    this.emit('dive');
    if (pick.kind === BOSS) {
      const taken = this.rescue || this.enemies.some((e) => e.captive || e.kind === ROGUE || e.bt >= 0);
      if (!taken && !p.dual && !pick.captive && this.rand() < 0.7) return this.launch(pick, DIVES.beam);
      const squad = { aim: null, killed: 0, boss: pick.id };
      const escorts = home.filter((e) => e.kind === FLY && Math.abs(e.col - pick.col) <= 1).sort((a, b) => a.row - b.row).slice(0, 2);
      for (const e of [pick, ...escorts]) { this.launch(e, DIVES.boss, pick.col < 5 ? 1 : -1); e.squad = squad; }
      return;
    }
    this.launch(pick, pick.kind === FLY ? DIVES.fly : this.stage >= 6 && this.rand() < 0.5 ? DIVES.beeLong : DIVES.bee);
  }

  launch(e, sc, mir = e.col < 5 ? 1 : -1) {
    e.st = 'path';
    e.dive = true;
    e.sc = sc;
    e.pc = 0;
    e.n = 0;
    e.mir = mir;
    e.v = this.diveV;
    e.loop = -1;
    e.ammo = this.rand() < this.armed ? this.ammo : 0;
  }

  // A bee turns into three of something else, which dive together.
  morph(e) {
    const idx = Math.floor((this.stage - 4) / 4) % 3, group = { size: 3, killed: 0, bonus: MORPH_BONUS[idx] }, squad = { aim: null };
    this.remove(e);
    this.emit('dive');
    for (const [ox, oy] of [[0, 0], [-11, -8], [11, -8]]) {
      this.enemies.push({
        id: this.nextId++, kind: MORPH, look: MORPH_LOOKS[idx], row: -9, col: -9, x: e.x + ox, y: e.y + oy, a: PI, v: this.diveV,
        st: 'path', sc: DIVES.morph, pc: 0, n: 0, tr: 0, mir: e.col < 5 ? 1 : -1, hp: 1, dive: true, entry: false, wave: -1,
        group: -1, trio: group, squad, loop: -1, ammo: 1, captive: false, side: 0, bt: -1, catching: false,
      });
    }
  }

  remove(e) {
    const i = this.enemies.indexOf(e);
    if (i >= 0) this.enemies.splice(i, 1);
  }

  // An enemy is shot (or flies into the player).
  destroy(e) {
    const p = this.player, home = e.st === 'form';
    this.remove(e);
    this.booms.push({ x: e.x, y: e.y, t: 0, big: false });
    this.stageKills++;
    let pts = POINTS[e.kind][home ? 0 : 1];
    if (e.kind === BOSS) {
      if (!home) {
        pts = BOSS_DIVE_POINTS[Math.min(2, e.squad ? e.squad.killed : 0)];
        this.popups.push({ x: e.x, y: e.y, n: pts, t: 0 });
      }
      if (e.catching) { p.st = 'alive'; p.y = PLAYER_Y; }
      if (e.captive) {
        const [x, y] = this.captivePos(e);
        if (home) {
          // Shot in the formation: the fighter stays theirs, and attacks.
          this.enemies.push({
            id: this.nextId++, kind: ROGUE, look: 'captive', row: -9, col: -9, x, y, a: 0, v: this.diveV, st: 'path', sc: DIVES.rogue,
            pc: 0, n: 0, tr: 0, mir: e.col < 5 ? 1 : -1, hp: 1, dive: true, entry: false, wave: -1, group: -1, squad: null, loop: -1,
            ammo: this.ammo, captive: false, side: 0, bt: -1, catching: false,
          });
        } else {
          // Shot on the way down: the fighter is free.
          this.rescue = { x, y, t: 0, a: 0 };
          this.emit('rescue');
        }
      }
      if (e.bt >= 0) this.emit('beamOff');
    } else if (e.squad && e.squad.boss) e.squad.killed++;
    if (e.trio && ++e.trio.killed === e.trio.size) {
      pts += e.trio.bonus;
      this.popups.push({ x: e.x, y: e.y, n: e.trio.bonus, t: 0 });
    }
    if (e.kind === GUEST) {
      this.stageHits++;
      const g = this.groups[e.group];
      if (++g.killed === g.size) {
        const bonus = GROUP_BONUS[Math.min(7, this.challengeNo)];
        pts += bonus;
        this.popups.push({ x: e.x, y: e.y, n: bonus, t: 0 });
      }
    }
    this.addScore(pts);
    this.emit('boom', e.kind);
  }

  // ---- shots, the freed fighter, and things running into each other -------------------

  stepShots() {
    for (const s of this.pShots) s.y -= SHOT_V;
    this.pShots = this.pShots.filter((s) => s.y > 8);
    for (const s of this.eShots) { s.x += s.vx; s.y += s.vy; }
    this.eShots = this.eShots.filter((s) => s.y < H);
  }

  stepRescue() {
    const r = this.rescue, p = this.player;
    if (!r) return;
    r.t++;
    if (r.t < 70) { r.a += 0.45; return; }
    r.a = 0;
    // Down to the bottom row, alongside the player's ship if there is one.
    const alone = p.st !== 'alive';
    const tx = alone ? clamp(r.x, 10, W - 10) : clamp(p.x + 16, 26, W - 10);
    r.x += clamp(tx - r.x, -3, 3);
    r.y = Math.min(PLAYER_Y, r.y + 1.6);
    if (r.y < PLAYER_Y || Math.abs(tx - r.x) > 0.5) return;
    this.rescue = null;
    if (alone) {
      // Nobody to join: it takes over.
      if (p.st === 'beamed') return;
      Object.assign(p, { st: 'alive', x: r.x, y: PLAYER_Y, dual: false, captured: false });
    } else {
      p.dual = true;
      p.x = r.x - 8;
    }
    this.emit('docked');
  }

  collide() {
    const p = this.player;
    // The player's shots.
    for (const s of this.pShots) {
      for (const e of this.enemies) {
        if (e.kind === BOSS && e.captive) {
          const [cx, cy] = this.captivePos(e);
          if (Math.abs(s.x - cx) < 7 && Math.abs(s.y - cy) < 9) {
            // Shot your own captured fighter.
            s.y = -99;
            this.hits++;
            e.captive = false;
            this.booms.push({ x: cx, y: cy, t: 0, big: false });
            this.addScore(CAPTIVE_POINTS[e.st === 'form' ? 0 : 1]);
            this.emit('boom', ROGUE);
            break;
          }
        }
        if (Math.abs(s.x - e.x) < (e.kind === BOSS ? 8 : 7) && Math.abs(s.y - e.y) < 9) {
          s.y = -99;
          this.hits++;
          if (e.hp > 1) { e.hp--; e.look = 'bossHurt'; this.emit('clank'); }
          else this.destroy(e);
          break;
        }
      }
    }
    this.pShots = this.pShots.filter((s) => s.y > 8);
    if (p.st !== 'alive' || this.challenge) return;
    // Enemies and their shots against the player's ships.
    for (const x of this.ships()) {
      const e = this.enemies.find((q) => q.st !== 'form' && Math.abs(q.x - x) < 10 && Math.abs(q.y - p.y) < 10);
      const s = this.eShots.find((q) => Math.abs(q.x - x) < 6 && Math.abs(q.y - p.y) < 8);
      if (!e && !s) continue;
      if (e) this.destroy(e);
      if (s) s.y = H + 99;
      this.hitShip(x);
      if (p.st !== 'alive') break;
    }
    this.eShots = this.eShots.filter((s) => s.y < H);
  }

  // ---- words on the screen -----------------------------------------------------------

  // The lines of text to show right now: [text, colour, y].
  texts() {
    const out = [], p = this.player, mid = 136;
    if (this.phase === 'intro') {
      if (this.first && this.t < 80) out.push(['PLAYER 1', 'cyan', mid]);
      else out.push([this.challenge ? 'CHALLENGING STAGE' : `STAGE ${this.stage}`, 'cyan', mid]);
    }
    if (this.capMsg > 0) out.push(['FIGHTER CAPTURED', 'red', mid + 16]);
    else if (p.st === 'ready') out.push(['READY', 'red', mid + 16]);
    if (this.phase === 'results') {
      const perfect = this.stageHits === 40;
      if (this.t > 40) out.push([`NUMBER OF HITS ${this.stageHits}`, 'cyan', mid - 16]);
      if (this.t > 110) {
        if (perfect) {
          out.push(['PERFECT !', 'red', mid + 8]);
          if (this.t > 150) out.push([`SPECIAL BONUS ${PERFECT_BONUS} PTS`, 'yellow', mid + 32]);
        } else out.push([`BONUS ${this.stageHits * 100}`, 'yellow', mid + 8]);
      }
    }
    if (this.phase === 'over') {
      if (this.t < 150) out.push(['GAME OVER', 'red', mid]);
      else {
        const ratio = this.shots ? ((100 * this.hits) / this.shots).toFixed(1) : '0.0';
        out.push(['- RESULTS -', 'red', mid - 40], [`SHOTS FIRED ${this.shots}`, 'yellow', mid - 16], [`NUMBER OF HITS ${this.hits}`, 'yellow', mid + 8],
          [`HIT-MISS RATIO ${ratio} %`, 'white', mid + 32]);
      }
    }
    return out;
  }
}
