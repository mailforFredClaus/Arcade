// Up the hill: the old town's map, and the plain things there are to do in it.
import { PLACES } from '../../games/new-in-town/js/data.js';

export default function ({ check, fresh }) {
  const hill = Object.keys(PLACES).filter((id) => PLACES[id].area === 'hill');
  check(hill.length >= 9, 'the old town up the hill has its places');
  for (const id of Object.keys(PLACES)) {
    const p = PLACES[id];
    check(p.x > 20 && p.x < 380 && p.y > 60 && p.y < 560, `${id}: sits on its map`);
    for (const q of Object.keys(PLACES)) if (q !== id && (PLACES[q].area || 'bay') === (p.area || 'bay')) check(Math.hypot(PLACES[q].x - p.x, PLACES[q].y - p.y) > 90, `${id} and ${q} do not overlap`);
  }
  const L = fresh();
  for (const id of hill) check(L.placeActions(id).length > 0, `${id}: has something to do`);
  // A swim in winter is cold; in summer it is not.
  L.s.t = 1; L.s.time = 6;
  const h = L.s.health, r = L.act('seaSwim');
  check(r.ok && L.s.health >= h, 'a summer swim does you good');
  check(!L.act('seaSwim').ok, 'and once a season is enough');
}
