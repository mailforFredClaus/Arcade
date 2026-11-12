// New in Town: the two driving tests at Dobbs & Daughter, played on screen
// in the same frame as the work games (mini.js). Each reports a score from
// 0 to 1; 0.65 or better is a pass (grade 2 in minilogic.js), and the rules
// in motor.js decide the rest.
//
// motorQuiz: the theory test. Ten questions on the rules of the road.
// motorRoad: the practical. A drive through Starling Bay seen from above:
// hold a finger down to drive and lift it to stop; slide it to the right
// half of the screen to pull out round something, and back to tuck in.
// Parked cars with traffic coming the other way, a zebra crossing, a
// cyclist, a STOP junction with traffic across it, and the test centre to
// pull up at. A crash or a serious fault ends it; minor faults cost a
// little each (five is the most a pass allows).

import { GAMES } from './mini.js';
import { sfx, haptic } from '../../../shared/arcade.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const shuffle = (rnd, list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// The rules of the road, as the room above the garage asks them. The first answer is the right one.
export const QUESTIONS = [
  { q: 'Somebody is waiting at a zebra crossing as you come up to it. What do you do?', a: ['Slow down and stop to let them cross', 'Sound the horn so they know you are coming', 'Speed up to get past before they step out'] },
  { q: 'At a junction marked STOP, you must…', a: ['Stop at the line, even if the road looks clear', 'Stop only if something is coming', 'Slow down, and stop if a policeman is watching'] },
  { q: 'How much room should you leave when you overtake a cyclist?', a: ['At least as much as you would give a car', 'Enough to miss their elbows', 'None: it is up to them to move over'] },
  { q: 'In this country you normally drive…', a: ['On the left, and keep to your own side of the road', 'In the middle, so you can see both ways', 'On whichever side is emptier'] },
  { q: 'In good weather, how far back should you keep from the car in front?', a: ['At least a two-second gap', 'One car’s length', 'Near enough to read its number plate'] },
  { q: 'On a wet road, that gap should be…', a: ['At least doubled', 'Just the same', 'Halved, so you get home sooner'] },
  { q: 'A ball bounces into the road ahead of you. What should you expect?', a: ['A child running out after it', 'Nothing: it is only a ball', 'Its owner waiting politely on the pavement'] },
  { q: 'The traffic lights change from green to amber. You should…', a: ['Stop, unless you are so close that stopping would be dangerous', 'Speed up to get through before the red', 'Get ready to go'] },
  { q: 'You have had a couple of drinks at the pub. When is it safe to drive?', a: ['It is not: walk, or get a lift', 'After a strong cup of tea', 'If you drive slowly with the window down'] },
  { q: 'Your phone rings while you are driving. What do you do?', a: ['Let it ring, and call back once you have stopped somewhere safe', 'Answer it, but keep it short', 'Answer it on loudspeaker, held in your lap'] },
  { q: 'At a roundabout you normally give way to…', a: ['Traffic coming from your right', 'Traffic coming from your left', 'Nobody, once you are moving'] },
  { q: 'Driving past a school at home time, you should…', a: ['Slow right down and watch for children between parked cars', 'Keep your speed up so you are past quickly', 'Sound your horn as a warning'] },
  { q: 'Before you pull out round a parked car, you should…', a: ['Check your mirrors and the road ahead, then signal', 'Pull out, then signal', 'Flash your lights and go'] },
  { q: 'A horse and rider are ahead of you on a narrow lane. You should…', a: ['Slow down, and pass wide and slowly when it is safe', 'Sound the horn so the rider knows you are there', 'Pass quickly, to get it over with'] },
  { q: 'How often should you check your tyres?', a: ['Regularly: their pressure, any damage, and the tread', 'Only at the yearly MOT', 'Only when one goes flat'] },
  { q: 'Once a car is three years old, the yearly MOT checks…', a: ['That it is safe and fit for the road', 'How fast it will go', 'That it has been washed'] },
  { q: 'Fog is down and you can see less than a hundred yards. You should…', a: ['Slow down and use dipped headlights and fog lights', 'Use full beam to see further', 'Follow the car in front closely so you do not lose it'] },
  { q: 'An ambulance comes up behind you with its lights flashing. You should…', a: ['Pull over when it is safe and let it pass', 'Stop dead wherever you are', 'Speed up so that it does not have to wait'] },
  { q: 'You start to feel sleepy on a long drive. The best thing to do is…', a: ['Stop somewhere safe and rest', 'Open the window and turn the radio up', 'Drive faster so you get home sooner'] },
  { q: 'On a single-track lane, a car comes the other way. Who gives way?', a: ['Whoever is nearer a passing place pulls into it', 'Always the smaller car', 'Whoever flashes their lights first'] },
  { q: 'When may you use your horn?', a: ['To warn others you are there, never in anger', 'To say hello to friends', 'Whenever another driver annoys you'] },
  { q: 'You come to a dotted GIVE WAY line at a junction. You should…', a: ['Give way to traffic on the main road, stopping if you need to', 'Always stop for five seconds', 'Carry on: the main road will let you in'] },
  { q: 'On snow and ice, stopping distances can be…', a: ['Up to ten times longer than usual', 'About the same', 'Shorter, because everybody drives more carefully'] },
  { q: 'Who must make sure a child passenger is wearing a seat belt?', a: ['The driver', 'The child', 'Nobody, on a short journey'] },
  { q: 'There is a big puddle beside people walking on the pavement. You should…', a: ['Slow down so you do not soak them', 'Keep going: it is only water', 'Speed up, so they get wet less slowly'] },
  { q: 'You are dazzled by the headlights of a car coming towards you at night. You should…', a: ['Slow down, and stop if you need to', 'Flash your full beam back at them', 'Shut your eyes until it has gone'] },
  { q: 'Sheep are wandering across the road on the moor. You should…', a: ['Stop and wait for them to move on', 'Drive slowly through, sounding the horn', 'Turn round and find another road'] },
  { q: 'Your brakes feel spongy and the car pulls to one side. You should…', a: ['Have them checked by a garage before you drive any further', 'Pump them harder and carry on', 'Wait and see if it gets worse'] },
];

// The theory test: right answers out of ten become a score; eight is 0.65, a pass.
export const quizScore = (right) => (right >= 8 ? 0.65 + (right - 8) * 0.175 : right / 8 * 0.6);

Object.assign(GAMES, {
  motorQuiz: {
    how: 'Ten questions on the rules of the road. Tap the answer you think is right. Eight right is a pass.', time: 80,
    words: ['A fail', 'Not this time', 'A pass', 'Full marks'],
    play(api) {
      const N = 10, qs = shuffle(api.rnd, QUESTIONS).slice(0, N);
      let i = 0, right = 0, lock = false, order = [];
      const box = el('div', 'mg-quiz');
      api.stage.append(box);
      const draw = () => {
        const q = qs[i];
        order = shuffle(api.rnd, [0, 1, 2]);
        box.innerHTML = `<p class="mg-qn">Question ${i + 1} of ${N}</p><p class="mg-q">${q.q}</p><div class="mg-as">${order.map((k) => `<button data-k="${k}">${q.a[k]}</button>`).join('')}</div><p class="mg-tally">${right} right so far</p>`;
      };
      const answer = (k) => {
        if (lock) return;
        lock = true;
        const ok = k === 0;
        for (const b of box.querySelectorAll('[data-k]')) b.classList.add(b.dataset.k === '0' ? 'yes' : b.dataset.k === String(k) ? 'no' : 'dim');
        if (ok) { right++; sfx('pop'); } else { sfx('nope'); haptic(); }
        api.after(ok ? 550 : 1300, () => { i++; lock = false; if (i >= N) api.finish(quizScore(right)); else draw(); });
      };
      box.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) answer(Number(b.dataset.k)); });
      draw();
      return { score: () => quizScore(right), auto: () => { right += N - i; i = N; api.finish(quizScore(right)); } };
    },
  },

  motorRoad: {
    how: 'Hold a finger down to drive; lift it to stop. Slide it to the right half of the screen to pull out round something, and back to the left to tuck in. Stop at the STOP line, give way to people on the crossing, and give the cyclist room.', time: 90, fixed: true,
    words: ['A fail', 'A fail, narrowly', 'A pass', 'A clean pass'],
    play(api) { return roadTest(api); },
  },
});

// ---- the practical --------------------------------------------------------------------

// Distances are in lane widths; the road runs from x = -1 (the left kerb) to
// x = 1, and y is how far along it. Your side is the left.
const VMAX = 2.6, ACC = 2.4, BRAKE = 7.5, STEER = 2.6, CAR_W = 0.56, CAR_L = 1, ONCOMING = 2.2, ACROSS = 2.6;
const PARK = [10, 11.3], ZEBRA = 24, CYCLE = 35, CYCLE_OFF = 52, LINE = 57.6, CROSS = [58, 60], BAY = [71, 73.4], END = 75;
const PAINT = ['#e2493d', '#2a7fb8', '#f3c64a', '#1f9d62', '#7a3fb8', '#e9e5d8', '#3d4a6b', '#f08a3c'];

function roadTest(api) {
  const ease = api.ease;
  const wrap = el('div', 'mg-road', '<div class="mg-road-hud"><b class="say"></b><span class="minors"></span></div><div class="mg-road-box"><canvas></canvas></div>');
  api.stage.append(wrap);
  const cv = wrap.querySelector('canvas'), cx = cv.getContext('2d'), sayEl = wrap.querySelector('.say'), minEl = wrap.querySelector('.minors');
  // You.
  let y = 0, x = -0.5, v = 0, holding = false, lane = -0.5, pointer = null;
  let minors = 0, over = false, done = false, pilot = false, wrongT = 0, wrongN = 0, tick = 0;
  const said = { at: 0, text: 'Pull away when you are ready.', bad: false };
  const say = (text, bad = false) => { said.text = text; said.bad = bad; said.at = tick; };
  const minor = (text) => { minors++; sfx('nope'); haptic(); say(`Minor fault: ${text}.`, true); };
  // Everything else on the road.
  const parked = PARK.map((py, i) => ({ y: py + 0.5, x: -0.58, col: PAINT[(i * 3 + 1) % PAINT.length] }));
  const oncoming = [];
  let spawnIn = 0.6, longGap = false;
  const ped = { x: -1.45, state: 'wait', speed: 0.72 + ease * 0.12 };
  const bike = { y: CYCLE, x: -0.62, state: 'wait', speed: 1.1 + ease * 0.15, close: false, passed: false };
  const cross = [];
  let crossIn = 0, stopT = 0, stopped = false, pulledOutAt = null, hinted = {};

  // ---- the finger ----
  const laneAt = (e) => { const b = cv.getBoundingClientRect(); return e.clientX - b.left < b.width / 2 ? -0.5 : 0.5; };
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    pointer = e.pointerId; holding = true; lane = laneAt(e);
    if (cv.setPointerCapture) try { cv.setPointerCapture(e.pointerId); } catch { /* not every browser will */ }
  });
  cv.addEventListener('pointermove', (e) => { if (e.pointerId !== pointer) return; e.preventDefault(); const l = laneAt(e); if (l !== lane) { lane = l; sfx('tap'); } });
  const up = (e) => { if (e.pointerId === pointer) { holding = false; pointer = null; } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

  // ---- the end ----
  const progress = () => clamp(y / END, 0, 1);
  const finish = (q, wait = 900) => { if (over) return; over = true; api.after(wait, () => api.finish(q)); };
  const serious = (text) => { if (over) return; sfx('bump'); haptic(); say(`Serious fault: ${text}.`, true); finish(0.08 + 0.2 * progress(), 1300); };
  const passMark = () => clamp(1 - 0.07 * minors, 0.2, 1);

  // ---- what is where ----
  const hit = (ax, ay, aw, al, bx, by, bw, bl) => Math.abs(ax - bx) * 2 < aw + bw && Math.abs(ay - by) * 2 < al + bl;
  // Something in your lane ahead that you would have to go round: parked cars, or the cyclist.
  const blockers = () => [...parked.map((p) => ({ y: p.y, l: CAR_L })), ...(bike.state === 'ride' ? [{ y: bike.y, l: 0.7 }] : [])];
  const nearBlock = () => blockers().some((b) => b.y + b.l / 2 > y - 2.4 && b.y - b.l / 2 < y + 3.4);
  const zebraBusy = () => ped.state === 'cross' && ped.x > -1.2 && ped.x < 1.2;

  // ---- the examiner's own driving, for testing: perfect, and a little cautious ----
  const steer = { hold: true, lane: -0.5 };
  const stopBy = (at) => y + CAR_L / 2 + (v * v) / (2 * BRAKE) + 0.12 >= at;
  function drivePilot() {
    let hold = true, want = -0.5;
    const front = y + CAR_L / 2;
    // Going round something: only with nothing coming for a good while.
    const ahead = blockers().filter((b) => b.y + b.l / 2 > y - CAR_L / 2 - 0.7).sort((a, b) => a.y - b.y)[0];
    // (Nothing coming at all on the road ahead, and nothing about to be.)
    const clear = (spawnIn > 1.8 || y >= 42) && !oncoming.some((o) => o.y > y - 1.5);
    if (ahead) {
      const gap = ahead.y - ahead.l / 2 - front;
      if (x > 0.05 || (gap < 3 && clear)) want = 0.5;
      if (want < 0 && stopBy(ahead.y - ahead.l / 2 - 1)) hold = false;
      if (gap < 0.2 && x < 0) hold = false;
    }
    // The crossing: wait until whoever is on it has gone.
    if (front < ZEBRA && ped.state !== 'gone' && stopBy(ZEBRA - 0.15)) hold = false;
    // The junction: stop at the line, then wait for a proper gap.
    if (!stopped && stopBy(LINE - 0.25)) hold = false;
    if (stopped && front < CROSS[1] + 0.5) {
      const gap = crossIn > 0.6 && cross.every((c) => {
        const t0 = c.vx > 0 ? (-1.7 - c.x) / c.vx : (c.x - 1.7) / -c.vx, t1 = c.vx > 0 ? (1.7 - c.x) / c.vx : (c.x + 1.7) / -c.vx;
        return t1 < 0 || t0 > 2.5;
      });
      if (front < CROSS[0] && !gap) hold = false;
    }
    // And pull up in the box at the test centre.
    if (y > CROSS[1] && stopBy((BAY[0] + BAY[1]) / 2 + 0.3)) hold = false;
    steer.hold = hold; steer.lane = want;
  }

  // ---- a frame ----
  api.frame((dt) => {
    tick += dt;
    if (!over) {
      if (pilot) drivePilot();
      const go = pilot ? steer.hold : holding, want = pilot ? steer.lane : lane;
      v = go ? Math.min(VMAX, v + ACC * dt) : Math.max(0, v - BRAKE * dt);
      y += v * dt;
      // (You can only steer while you are moving.)
      const room = STEER * dt * Math.min(1, v / 1.1 + 0.05);
      const was = x;
      x = clamp(x + clamp(want - x, -room, room), -0.5, 0.5);
      // Pulling out with something coming.
      if (was <= 0 && x > 0 && pulledOutAt === null) {
        pulledOutAt = y;
        if (oncoming.some((o) => o.y > y && o.y - y < 6 - ease * 2)) minor('pulled out with traffic coming');
      }
      if (x <= 0) pulledOutAt = null;
      // Over the line with nothing to go round.
      if (x > 0.1 && !nearBlock()) { wrongT += dt; if (wrongT > 1.3 + ease * 0.7 && wrongN < 3) { wrongN++; wrongT = 0; minor('drifting over to the wrong side of the road'); } } else wrongT = Math.max(0, wrongT - dt);

      // Parked cars.
      for (const p of parked) if (hit(x, y, CAR_W, CAR_L, p.x, p.y, CAR_W, CAR_L)) serious('you drove into a parked car');
      // Traffic coming the other way, until the junction.
      if (y < 44) {
        spawnIn -= dt;
        if (spawnIn <= 0) {
          oncoming.push({ y: y + 15, x: 0.55, v: ONCOMING, col: PAINT[Math.floor(api.rnd() * PAINT.length)] });
          // (Cars come in ones and twos and threes, with good long gaps between.)
          longGap = !longGap && api.rnd() < 0.6;
          spawnIn = longGap ? 9 + ease * 2 + api.rnd() * 3 : 1.1 + api.rnd() * 0.6;
        }
      }
      oncoming.forEach((o, i) => {
        // (They give way at the zebra too, and do not drive into each other.)
        let into = o.y - o.v * dt;
        if (zebraBusy() && o.y > ZEBRA + 0.8 && into - CAR_L / 2 < ZEBRA + 1) into = o.y;
        if (i > 0) into = Math.max(into, oncoming[i - 1].y + 1.4);
        o.y = into;
        if (hit(x, y, CAR_W, CAR_L, o.x, o.y, CAR_W, CAR_L)) serious('you met a car coming the other way, head on');
      });
      while (oncoming.length && oncoming[0].y < y - 12) oncoming.shift();

      // The zebra crossing.
      if (!hinted.park && y > 1.5) { hinted.park = 1; say('Parked cars ahead: wait for a gap in the traffic to go round them.'); }
      if (ped.state === 'wait' && y + CAR_L / 2 > ZEBRA - 7) { ped.state = 'cross'; if (!hinted.ped) { hinted.ped = 1; say('Somebody is waiting at the zebra crossing.'); } }
      if (ped.state === 'cross') { ped.x += ped.speed * dt; if (ped.x > 1.5) ped.state = 'gone'; }
      if (zebraBusy() && y + CAR_L / 2 > ZEBRA + 0.05 && y - CAR_L / 2 < ZEBRA + 0.8) serious(hit(x, y, CAR_W, CAR_L, ped.x, ZEBRA + 0.4, 0.3, 0.3) ? 'you hit somebody on the crossing' : 'you drove on to the crossing while somebody was on it');

      // The cyclist.
      if (bike.state === 'wait' && y + 9 > CYCLE) { bike.state = 'ride'; if (!hinted.bike) { hinted.bike = 1; say('A cyclist ahead: give them room.'); } }
      if (bike.state === 'ride') {
        bike.y += bike.speed * dt;
        if (bike.y > CYCLE_OFF) bike.state = 'gone';
        if (hit(x, y, CAR_W, CAR_L, bike.x, bike.y, 0.26, 0.7)) serious('you clipped the cyclist');
        else if (Math.abs(bike.y - y) < 0.85 && x - CAR_W / 2 - (bike.x + 0.13) < 0.5 && !bike.close) { bike.close = true; minor('passing the cyclist too close'); }
        if (!bike.passed && y - CAR_L / 2 > bike.y + 0.35) { bike.passed = true; if (!bike.close) say('Plenty of room. Good.'); }
      }

      // The STOP junction.
      if (!hinted.stop && y > LINE - 11) { hinted.stop = 1; say('A STOP junction ahead.'); }
      const front = y + CAR_L / 2;
      if (!stopped && front > LINE - 2 && front <= LINE + 0.05 && v < 0.06) { stopT += dt; if (stopT > 0.25) { stopped = true; say('Wait for a gap, then go.'); } } else if (!stopped) stopT = 0;
      if (!stopped && front > LINE + 0.15) serious('you did not stop at the STOP line');
      if (y > LINE - 14 && y < CROSS[1] + 3) {
        crossIn -= dt;
        if (crossIn <= 0) {
          const right = api.rnd() < 0.5;
          cross.push({ x: right ? 7 : -7, y: right ? CROSS[0] + 0.5 : CROSS[1] - 0.5, vx: right ? -ACROSS : ACROSS, col: PAINT[Math.floor(api.rnd() * PAINT.length)] });
          crossIn = api.rnd() < 0.4 ? 3.2 + ease + api.rnd() * 1.5 : 0.9 + api.rnd() * 0.8;
        }
      }
      for (const c of cross) { c.x += c.vx * dt; if (hit(x, y, CAR_W, CAR_L, c.x, c.y, CAR_L, CAR_W)) serious('you pulled out in front of a car'); }
      while (cross.length && Math.abs(cross[0].x) > 8) cross.shift();

      // The test centre.
      if (!hinted.bay && y > CROSS[1] + 1) { hinted.bay = 1; say('Pull up on the left at the test centre.'); }
      if (y > BAY[0] + 0.2 && y < BAY[1] - 0.2 && v === 0 && !holding && x < -0.3 && !over) { done = true; sfx('pop'); say(minors ? `${minors} minor fault${minors > 1 ? 's' : ''}.` : 'Not a single fault.'); finish(passMark(), 700); }
      if (y > END && !over) { minor('you drove straight past the test centre'); done = true; finish(passMark(), 700); }
    }
    draw();
  });

  // ---- the picture ----
  let S = 50, W = 0, H = 0;
  function fit() {
    const box = cv.parentNode, w = box.clientWidth, h = box.clientHeight, r = window.devicePixelRatio || 1;
    if (w === W && h === H) return;
    W = w; H = h;
    cv.width = Math.round(w * r); cv.height = Math.round(h * r);
    cv.style.width = `${w}px`; cv.style.height = `${h}px`;
    cx.setTransform(r, 0, 0, r, 0, 0);
    S = clamp(Math.min(w * 0.16, h / 10.5), 30, 62);
  }
  const SY = () => H * 0.78;
  const sx = (wx) => W / 2 + wx * S;
  const sy = (wy) => SY() - (wy - y) * S;
  const rr = (px, py, w, h, r, fill) => { cx.fillStyle = fill; cx.beginPath(); cx.roundRect ? cx.roundRect(px, py, w, h, r) : cx.rect(px, py, w, h); cx.fill(); };
  // A car seen from above, its nose pointing up (up) or down.
  function carAt(wx, wy, col, upward = true, lights = false) {
    const w = CAR_W * S, l = CAR_L * S, px = sx(wx) - w / 2, py = sy(wy) - l / 2;
    rr(px + 2, py + 3, w, l, w * 0.28, 'rgba(0,0,0,.18)');
    rr(px, py, w, l, w * 0.28, col);
    const glass = 'rgba(31,42,68,.72)';
    rr(px + w * 0.14, py + (upward ? l * 0.2 : l * 0.56), w * 0.72, l * 0.22, 3, glass);
    rr(px + w * 0.18, py + (upward ? l * 0.66 : l * 0.14), w * 0.64, l * 0.14, 3, glass);
    if (lights) { rr(px + 1, py + l - 4, w * 0.24, 3, 1, '#ff2d2d'); rr(px + w * 0.76 - 1, py + l - 4, w * 0.24, 3, 1, '#ff2d2d'); }
  }
  // Across the junction: a car side on.
  function crossCar(c) {
    const w = CAR_L * S, h = CAR_W * S, px = sx(c.x) - w / 2, py = sy(c.y) - h / 2;
    rr(px + 2, py + 3, w, h, h * 0.28, 'rgba(0,0,0,.18)');
    rr(px, py, w, h, h * 0.28, c.col);
    rr(px + (c.vx > 0 ? w * 0.56 : w * 0.22), py + h * 0.14, w * 0.22, h * 0.72, 3, 'rgba(31,42,68,.72)');
  }
  function draw() {
    fit();
    if (!W) return;
    const top = y + SY() / S + 1, bottom = y - (H - SY()) / S - 1;
    // Verges, pavements and the road.
    cx.fillStyle = '#9fd17a'; cx.fillRect(0, 0, W, H);
    const kerb = 1.42;
    cx.fillStyle = '#e8e1cf'; cx.fillRect(sx(-kerb), 0, (kerb * 2) * S, H);
    cx.fillStyle = '#545a69'; cx.fillRect(sx(-1), 0, 2 * S, H);
    // Houses and gardens along both sides, the same every time.
    for (let k = Math.floor(bottom / 3) - 1; k <= top / 3 + 1; k++) {
      for (const side of [-1, 1]) {
        const wy = k * 3 + (side > 0 ? 1.4 : 0), seed = Math.abs((k * 7919 + (side > 0 ? 31 : 0)) % 97);
        if ((wy > CROSS[0] - 1.6 && wy < CROSS[1] + 1.6) || (side < 0 && wy > BAY[0] - 2 && wy < BAY[1] + 1)) continue;
        const hw = 1.4 * S, hx = side < 0 ? sx(-kerb) - hw - 0.25 * S : sx(kerb) + 0.25 * S, hy = sy(wy) - 1.1 * S;
        if (seed % 5 === 0) { cx.fillStyle = '#5fa85a'; cx.beginPath(); cx.arc(hx + hw / 2, hy + 1.1 * S, 0.55 * S, 0, 7); cx.fill(); continue; }
        rr(hx, hy, hw, 2.2 * S, 4, ['#f6d7a7', '#f2b8a2', '#cfe3ee', '#f4ecd8', '#d8e8c4'][seed % 5]);
        rr(hx + 4, hy + 4, hw - 8, 2.2 * S - 8, 3, ['#c4573f', '#7a5a46', '#4b6e8a', '#a8473b'][seed % 4]);
      }
    }
    // The road across at the junction.
    const jy1 = sy(CROSS[1]), jy0 = sy(CROSS[0]);
    cx.fillStyle = '#e8e1cf'; cx.fillRect(0, jy1 - 0.42 * S, W, jy0 - jy1 + 0.84 * S);
    cx.fillStyle = '#545a69'; cx.fillRect(0, jy1, W, jy0 - jy1);
    cx.fillStyle = '#fffaf0';
    for (let k = -8; k < 8; k++) { const px = sx(k + 0.25); if (px < sx(-1.1) || px > sx(1.1)) cx.fillRect(px, sy((CROSS[0] + CROSS[1]) / 2) - 1.5, 0.5 * S, 3); }
    // The centre line, broken.
    for (let k = Math.floor(bottom); k <= top; k++) {
      if ((k >= CROSS[0] - 1 && k <= CROSS[1]) || (k >= ZEBRA - 1 && k <= ZEBRA + 1)) continue;
      cx.fillRect(sx(0) - 1.5, sy(k + 0.55), 3, 0.55 * S);
    }
    // Edge lines.
    for (const [a, b] of [[0, sy(CROSS[1] + 0.42)], [sy(CROSS[0] - 0.42), H]]) if (b > a) { cx.fillRect(sx(-1) + 3, a, 2, b - a); cx.fillRect(sx(1) - 5, a, 2, b - a); }
    // The STOP line, and the word.
    cx.fillRect(sx(-1), sy(LINE) - 2, S, 5);
    cx.save(); cx.fillStyle = '#fffaf0'; cx.font = `900 ${Math.round(S * 0.32)}px system-ui, sans-serif`; cx.textAlign = 'center'; cx.fillText('STOP', sx(-0.5), sy(LINE - 2.1)); cx.restore();
    // The zebra crossing and its beacons.
    for (let k = 0; k < 8; k++) cx.fillRect(sx(-1 + k * 0.25) + 2, sy(ZEBRA + 0.8), 0.25 * S - 4, 0.8 * S);
    for (const bx of [-1.22, 1.22]) { cx.fillStyle = '#ffb02e'; cx.beginPath(); cx.arc(sx(bx), sy(ZEBRA + 0.4), 0.11 * S, 0, 7); cx.fill(); }
    // The test centre.
    cx.strokeStyle = '#fffaf0'; cx.lineWidth = 2; cx.setLineDash([6, 5]); cx.strokeRect(sx(-1) + 4, sy(BAY[1]), S - 8, (BAY[1] - BAY[0]) * S); cx.setLineDash([]);
    cx.save(); cx.font = `${Math.round(S * 0.5)}px system-ui, sans-serif`; cx.textAlign = 'center'; cx.fillText('🏁', sx(-1.75), sy((BAY[0] + BAY[1]) / 2) + S * 0.18); cx.restore();
    // Everybody else.
    for (const p of parked) carAt(p.x, p.y, p.col, true);
    for (const o of oncoming) carAt(o.x, o.y, o.col, false);
    for (const c of cross) crossCar(c);
    if (bike.state === 'ride' || bike.state === 'wait') {
      const bx = sx(bike.x), by = sy(bike.y);
      rr(bx - 0.06 * S, by - 0.35 * S, 0.12 * S, 0.7 * S, 3, '#2b3552');
      cx.fillStyle = '#ffc93c'; cx.beginPath(); cx.ellipse(bx, by, 0.15 * S, 0.11 * S, 0, 0, 7); cx.fill();
      cx.fillStyle = '#e2493d'; cx.beginPath(); cx.arc(bx, by + 0.03 * S, 0.08 * S, 0, 7); cx.fill();
    }
    if (ped.state !== 'gone') {
      const px = sx(ped.x), py = sy(ZEBRA + 0.4);
      cx.fillStyle = '#2a7fb8'; cx.beginPath(); cx.ellipse(px, py, 0.17 * S, 0.12 * S, 0, 0, 7); cx.fill();
      cx.fillStyle = '#7a4a2e'; cx.beginPath(); cx.arc(px, py, 0.085 * S, 0, 7); cx.fill();
    }
    // Headlights coming that are not on the screen yet: a glow at the edge, brighter as they near.
    cx.save();
    for (const o of oncoming) if (o.y - CAR_L / 2 > top - 1) { const a = clamp(1 - (o.y - top + 1) / 7, 0.15, 1); cx.globalAlpha = a; cx.fillStyle = '#ffd34d'; cx.beginPath(); cx.moveTo(sx(0.55) - 0.32 * S, 2); cx.lineTo(sx(0.55) + 0.32 * S, 2); cx.lineTo(sx(0.55), 2 + 0.36 * S); cx.fill(); }
    for (const c of cross) {
      const off = c.vx > 0 ? sx(c.x + 0.5) < 0 : sx(c.x - 0.5) > W;
      if (!off) continue;
      const far = c.vx > 0 ? -sx(c.x) / S : (sx(c.x) - W) / S;
      cx.globalAlpha = clamp(1 - far / 4, 0.15, 1); cx.fillStyle = '#ffd34d'; cx.beginPath();
      if (c.vx > 0) { cx.moveTo(2, sy(c.y) - 0.3 * S); cx.lineTo(2, sy(c.y) + 0.3 * S); cx.lineTo(2 + 0.34 * S, sy(c.y)); } else { cx.moveTo(W - 2, sy(c.y) - 0.3 * S); cx.lineTo(W - 2, sy(c.y) + 0.3 * S); cx.lineTo(W - 2 - 0.34 * S, sy(c.y)); }
      cx.fill();
    }
    cx.restore();
    // You.
    carAt(x, y, '#2aa7b8', true, !(pilot ? steer.hold : holding));
    // Help along the bottom: which side of the screen does what.
    cx.save();
    cx.font = `800 ${Math.round(clamp(S * 0.26, 11, 15))}px system-ui, sans-serif`; cx.textAlign = 'center';
    cx.fillStyle = 'rgba(31,42,68,.55)';
    cx.fillText('◀ keep left', W * 0.18, H - 12); cx.fillText('pull out ▶', W * 0.82, H - 12);
    if (!holding && !pilot && !over && tick < 4 && v === 0) { cx.fillStyle = 'rgba(31,42,68,.8)'; cx.font = `900 ${Math.round(clamp(S * 0.36, 14, 20))}px system-ui, sans-serif`; cx.fillText('Hold a finger down to drive', W / 2, H * 0.45); }
    cx.restore();
    // What the examiner last said.
    if (sayEl.textContent !== said.text) sayEl.textContent = said.text;
    sayEl.classList.toggle('bad', said.bad && tick - said.at < 3);
    const m = `${minors} minor${minors === 1 ? '' : 's'}`;
    if (minEl.textContent !== m) minEl.textContent = m;
  }

  return {
    score: () => (done ? passMark() : 0.3 * progress()),
    // (The examiner drives it himself: carefully, and without a fault.)
    auto: () => { pilot = true; },
  };
}
