import { GolfScene } from './scene.js';

// Original pocket-golf courses. Everything, including the illustration, runs offline.
export const WORLD = { width: 900, height: 680 };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const ellipseContains = (p, e, padding = 0) => ((p.x - e.x) / (e.rx + padding)) ** 2 + ((p.y - e.y) / (e.ry + padding)) ** 2 < 1;
const finite = (v, fallback) => Number.isFinite(v) ? v : fallback;
const variantNumber = v => Number.isSafeInteger(v) && v >= 0 ? v : 0;

const layouts = [
  { start: [138, 554], flags: [[236, 429], [467, 549], [716, 434], [663, 173], [296, 161]], water: [[473, 329, 103, 75]], sand: [[321, 395, 42, 25], [742, 248, 38, 29], [425, 157, 35, 23]] },
  { start: [130, 553], flags: [[259, 444], [540, 550], [748, 354], [558, 152], [236, 178]], water: [[445, 350, 86, 114], [691, 93, 66, 44]], sand: [[229, 351, 33, 26], [686, 470, 42, 25], [398, 165, 46, 24]] },
  { start: [124, 549], flags: [[274, 493], [572, 552], [739, 319], [548, 132], [250, 205]], water: [[504, 330, 126, 66]], sand: [[331, 411, 42, 24], [732, 221, 34, 39], [291, 126, 39, 21]] },
  { start: [121, 544], flags: [[244, 421], [479, 547], [731, 451], [707, 170], [346, 177]], water: [[475, 331, 101, 77], [156, 228, 48, 81]], sand: [[562, 503, 35, 24], [697, 329, 45, 23], [467, 156, 43, 28]] },
  { start: [140, 566], flags: [[302, 475], [603, 547], [752, 312], [537, 147], [215, 203]], water: [[448, 330, 105, 82], [761, 591, 69, 47]], sand: [[205, 390, 43, 22], [682, 439, 33, 28], [361, 173, 34, 21]] },
  { start: [128, 552], flags: [[258, 451], [515, 551], [752, 382], [627, 144], [291, 171]], water: [[474, 330, 101, 94]], sand: [[364, 463, 30, 27], [709, 259, 40, 28], [438, 159, 38, 24]] },
];

export function createCourse(index = 0, variant = 0) {
  const n = clamp(Math.trunc(finite(index, 0)), 0, layouts.length - 1);
  const v = variantNumber(variant);
  const l = layouts[(n + Math.floor(v / 4)) % layouts.length];
  const trees = [[73, 147, 23], [122, 126, 27], [174, 101, 22], [75, 245, 26], [87, 330, 21], [126, 371, 25], [84, 466, 21], [88, 605, 26], [190, 611, 23], [313, 614, 24], [405, 623, 20], [608, 615, 24], [837, 558, 24], [833, 461, 21], [833, 350, 24], [830, 242, 28], [812, 137, 26], [753, 88, 22], [558, 78, 22], [449, 78, 25], [322, 77, 18], [334, 284, 19], [600, 411, 19]]
    .map(([x, y, r]) => ({ x, y, r }))
    .filter(t => !l.flags.some(([x, y]) => Math.hypot(x - t.x, y - t.y) < 72) && !l.water.some(([x, y, rx, ry]) => ellipseContains(t, { x, y, rx, ry }, 20)));
  const transform = point => ({ ...point, x: v % 2 ? 900 - point.x : point.x, y: Math.floor(v / 2) % 2 ? 680 - point.y : point.y });
  return { index: n, variant: v, start: transform({ x: l.start[0], y: l.start[1] }), flags: l.flags.map(([x, y], i) => transform({ x, y, id: i })), water: l.water.map(([x, y, rx, ry]) => transform({ x, y, rx, ry })), sand: l.sand.map(([x, y, rx, ry]) => transform({ x, y, rx, ry })), trees: trees.map(transform) };
}

function segmentDistance(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

export function terrainAt(point, course) {
  if (course.water.some(e => ellipseContains(point, e))) return 'water';
  if (course.sand.some(e => ellipseContains(point, e))) return 'sand';
  if (course.flags.some(f => ellipseContains(point, { ...f, rx: 72, ry: 53 }))) return 'green';
  const points = [course.start, ...course.flags];
  if (points.slice(1).some((p, i) => segmentDistance(point, points[i], p) < 53)) return 'fairway';
  return 'rough';
}

export function makeRound(courseIndex = 0, variant = 0) {
  const c = createCourse(courseIndex, variant);
  const angle = Math.atan2(c.flags[0].y - c.start.y, c.flags[0].x - c.start.x);
  return { version: 1, courseIndex: c.index, variant: c.variant, strokes: 0, holes: [null, null, null, null, null], ball: { ...c.start, vx: 0, vy: 0, air: 0, airTotal: 0 }, safe: { ...c.start }, club: 'wedge', angle, power: 55, checkpointStroke: 0, finished: false, moving: false };
}

export function restoreRound(saved, courseIndex = 0, variant = 0) {
  const fresh = makeRound(courseIndex, variant);
  if (!saved || saved.version !== 1 || saved.courseIndex !== fresh.courseIndex || variantNumber(saved.variant) !== fresh.variant || !Array.isArray(saved.holes) || saved.holes.length !== 5 || !saved.ball) return fresh;
  const strokes = clamp(Math.trunc(finite(saved.strokes, 0)), 0, 9999);
  const holes = saved.holes.map(n => Number.isInteger(n) && n > 0 && n <= strokes ? n : null);
  if (holes.reduce((a, n) => a + (n || 0), 0) > strokes) return fresh;
  const b = saved.ball;
  const ball = { x: clamp(finite(b.x, fresh.ball.x), 15, 885), y: clamp(finite(b.y, fresh.ball.y), 15, 665), vx: clamp(finite(b.vx, 0), -15, 15), vy: clamp(finite(b.vy, 0), -15, 15), air: clamp(finite(b.air, 0), 0, 38), airTotal: clamp(finite(b.airTotal, 0), 0, 38) };
  const safe = { x: clamp(finite(saved.safe?.x, fresh.safe.x), 20, 880), y: clamp(finite(saved.safe?.y, fresh.safe.y), 20, 660) };
  const finished = holes.every(n => n !== null);
  return { ...fresh, strokes, holes, ball, safe, club: saved.club === 'putter' ? 'putter' : 'wedge', angle: finite(saved.angle, fresh.angle), power: clamp(finite(saved.power, 55), 8, 100), checkpointStroke: clamp(Math.trunc(finite(saved.checkpointStroke, 0)), 0, strokes), finished, moving: !finished && Math.hypot(ball.vx, ball.vy) >= .075 };
}

export function launchShot(round, angle = round.angle, power = round.power) {
  if (round.moving || round.finished) return false;
  round.angle = finite(angle, round.angle);
  round.power = clamp(finite(power, 55), 8, 100);
  const speed = round.power * (round.club === 'wedge' ? .112 : .100);
  round.safe = { x: round.ball.x, y: round.ball.y };
  round.ball.vx = Math.cos(round.angle) * speed;
  round.ball.vy = Math.sin(round.angle) * speed;
  round.ball.airTotal = round.club === 'wedge' ? 12 + round.power * .22 : 0;
  round.ball.air = round.ball.airTotal;
  round.strokes += 1;
  round.moving = true;
  return true;
}

// One deterministic 1/60 second step. The rendered frame rate never changes the rules.
export function stepRound(round, course, assisted = false) {
  if (!round.moving || round.finished) return null;
  const b = round.ball, old = { x: b.x, y: b.y };
  b.x += b.vx; b.y += b.vy;
  b.air = Math.max(0, b.air - 1);
  if (b.x < 20 || b.x > 880) { b.x = clamp(b.x, 20, 880); b.vx *= -.48; }
  if (b.y < 20 || b.y > 660) { b.y = clamp(b.y, 20, 660); b.vy *= -.48; }
  const terrain = terrainAt(b, course);
  if (b.air <= 0) {
    if (terrain === 'water') {
      round.strokes += 1;
      Object.assign(b, round.safe, { vx: 0, vy: 0, air: 0, airTotal: 0 });
      round.moving = false;
      return { type: 'water', penalty: 1 };
    }
    for (const tree of course.trees) {
      const d = Math.hypot(b.x - tree.x, b.y - tree.y);
      if (d < 10) {
        const nx = (b.x - tree.x) / (d || 1), ny = (b.y - tree.y) / (d || 1);
        const dot = b.vx * nx + b.vy * ny;
        b.vx = (b.vx - 2 * dot * nx) * .6;
        b.vy = (b.vy - 2 * dot * ny) * .6;
        b.x = tree.x + nx * 11; b.y = tree.y + ny * 11;
      }
    }
    const speed = Math.hypot(b.vx, b.vy);
    const radius = assisted ? 16 : 10;
    const flag = course.flags.find(f => round.holes[f.id] === null && segmentDistance(f, old, b) < radius && speed < (assisted ? 5.3 : 3.8));
    if (flag) {
      round.holes[flag.id] = round.strokes - round.checkpointStroke;
      round.checkpointStroke = round.strokes;
      const remaining = course.flags.filter(f => round.holes[f.id] === null);
      const nearest = remaining.sort((a, c) => distance(flag, a) - distance(flag, c))[0];
      const a = nearest ? Math.atan2(nearest.y - flag.y, nearest.x - flag.x) : 0;
      Object.assign(b, { x: flag.x + Math.cos(a) * 21, y: flag.y + Math.sin(a) * 21, vx: 0, vy: 0, air: 0, airTotal: 0 });
      round.safe = { x: b.x, y: b.y };
      round.angle = a;
      round.power = 58;
      round.moving = false;
      round.finished = remaining.length === 0;
      return { type: round.finished ? 'complete' : 'hole', flag: flag.id, score: round.holes[flag.id] };
    }
    const friction = terrain === 'sand' ? .84 : terrain === 'rough' ? .947 : round.club === 'wedge' ? .935 : .972;
    b.vx *= friction; b.vy *= friction;
  } else { b.vx *= .992; b.vy *= .992; }
  if (Math.hypot(b.vx, b.vy) < .075) {
    b.vx = 0; b.vy = 0; b.air = 0;
    round.moving = false;
    return { type: 'rest', terrain };
  }
  return null;
}

function rangeForPower(power, club) {
  if (club === 'putter') return power * .1 / (1 - .972);
  const frames = 12 + power * .22, speed = power * .112;
  return speed * (1 - .992 ** frames) / (1 - .992) + speed * .992 ** frames / (1 - .935);
}
function powerForRange(range, club) {
  let low = 8, high = 100;
  for (let i = 0; i < 14; i++) { const mid = (low + high) / 2; if (rangeForPower(mid, club) < range) low = mid; else high = mid; }
  return (low + high) / 2;
}
const STYLE = `
.golf-view{position:relative;width:100%;height:100%;overflow:hidden;isolation:isolate;color:#173e33;font:12px/1.4 system-ui,sans-serif;background:#90b95d}.golf-surface{position:absolute;inset:0}.golf-canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab;outline-offset:-4px}.golf-canvas:focus-visible:not([data-pointer-focus]){outline:2px solid #f1c264}.golf-view button{font:inherit;cursor:pointer;border:0;transition:background .15s}.golf-view button:focus-visible,.golf-view input:focus-visible{outline:2px solid #ba893c;outline-offset:3px}.golf-view button:disabled{opacity:.45;cursor:default}.golf-hud{position:absolute;top:max(12px,env(safe-area-inset-top));left:max(12px,env(safe-area-inset-left));display:flex;align-items:center;gap:12px;height:44px;padding:0 14px;background:#fffdf4ed;border:1px solid #fff8;border-radius:24px;box-shadow:0 3px 16px #173e2314;pointer-events:none}.golf-stat{font-variant-numeric:tabular-nums;line-height:1}.golf-target{font:10px/1.2 system-ui,sans-serif;color:#61755c;margin-left:5px}.golf-stat strong{font:24px/1 Georgia,serif;font-weight:400}.golf-flags{display:flex;gap:6px}.golf-flags span{width:7px;height:7px;border:1px solid #6a7f5f;border-radius:50%;background:transparent}.golf-flags span.done{background:#345c42;border-color:#345c42}.golf-note{pointer-events:none;position:absolute;bottom:max(76px,calc(env(safe-area-inset-bottom) + 76px));left:50%;transform:translateX(-50%);white-space:nowrap;font-size:11px;background:#fffdf0e8;border:1px solid #fff9;color:#375541;padding:8px 14px;border-radius:20px;opacity:1;transition:opacity .4s}.golf-note:empty{opacity:0}.golf-dock{position:absolute;bottom:max(12px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);display:flex;gap:7px;align-items:center}.golf-view .golf-club-toggle,.golf-view .golf-shot-toggle{height:44px;background:#fffdf4ed;color:#214432;border:1px solid #fff8;box-shadow:0 3px 16px #173e2314;border-radius:24px}.golf-view .golf-club-toggle{min-width:78px;padding:0 17px}.golf-view .golf-shot-toggle{width:44px;padding:0;display:grid;place-items:center}.golf-view .golf-recenter{position:absolute;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));width:44px;height:44px;display:grid;place-items:center;border:1px solid #fff8;border-radius:50%;background:#fffdf4ed;color:#234638;box-shadow:0 3px 16px #173e2314}.golf-view .golf-recenter[hidden]{display:none}.golf-recenter svg{width:19px;height:19px}.golf-canvas:active{cursor:grabbing}.golf-graphics-unavailable{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:20px 26px;background:#fffdf4ed;border-radius:20px;text-align:center;white-space:nowrap}.golf-graphics-unavailable p{margin:0 0 12px}.golf-graphics-unavailable button{min-height:44px;padding:0 18px;border-radius:24px;color:#fffdf4;background:#234638}.golf-shot-toggle svg{width:18px;height:18px}.golf-shot-toggle[aria-expanded=true]{background:#244a38;color:#fff9e9}.golf-shot-panel{position:absolute;bottom:max(66px,calc(env(safe-area-inset-bottom) + 66px));left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;width:min(330px,calc(100% - 32px));padding:13px 14px;background:#f8f5e7f5;border:1px solid #fff9;border-radius:18px;box-shadow:0 5px 24px #1c412426}.golf-shot-panel[hidden]{display:none}.golf-power{display:flex;align-items:center;gap:8px;flex:1;min-width:0}.golf-power input{accent-color:#345d45;width:100%;min-width:55px;height:30px;cursor:pointer}.golf-power span{font:10px/1.2 system-ui,sans-serif;min-width:30px;text-align:right;color:#62745e}.golf-view .golf-swing{height:44px;background:#234b39;color:#fffdf4;padding:0 17px;border-radius:24px}.golf-swing:hover{background:#345f45}.golf-a11y{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.golf-view[data-finale=true] .golf-flags span.done{background:#623d42;border-color:#623d42}.golf-view .golf-findable{position:absolute;transform:translate(-50%,-50%);width:44px;height:44px;background:transparent;padding:0;display:grid;place-items:center;z-index:1}.golf-view .golf-findable[hidden]{display:none}.golf-findable>span{display:block;width:14px;height:19px;background:#fffbed;box-shadow:2px 3px 2px #263d312a;transform:rotate(-17deg);position:relative}.golf-findable>span:before{content:'';position:absolute;right:0;top:0;border-top:5px solid #d1d5b8;border-left:5px solid transparent}.golf-findable>span:after{content:'';position:absolute;left:3px;top:8px;width:7px;height:1px;background:#8d90704d;box-shadow:0 3px 0 #8d90704d,0 6px 0 #8d90704d}.golf-findable:is(:hover,:focus-visible):after{content:attr(aria-label);position:absolute;bottom:42px;left:50%;transform:translateX(-50%);white-space:nowrap;font:10px/1.4 system-ui,sans-serif;color:#294734;background:#fffbee;padding:5px 8px;border:1px solid #e5e6d1;box-shadow:0 2px 5px #29473418;pointer-events:none}@media(max-height:440px){.golf-hud{top:max(8px,env(safe-area-inset-top));height:40px}.golf-dock{bottom:max(8px,env(safe-area-inset-bottom))}}@media(prefers-reduced-motion:reduce){.golf-view *{transition:none!important}}`;

export class GolfGame {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.course = createCourse(options.courseIndex || 0, options.variant || 0);
    this.finale = options.finale === true;
    this.findable = options.findable ? { id: String(options.findable.id), afterFlags: clamp(Math.trunc(finite(options.findable.afterFlags, 1)), 0, 5), found: Boolean(options.findable.found) } : null;
    this.protestLevel = clamp(Math.trunc(finite(options.protestLevel, 0)), 0, 3);
    this.round = restoreRound(options.saved, this.course.index, this.course.variant);
    this.sound = Boolean(options.sound);
    this.target = Number.isFinite(options.target) && options.target > 0 ? Math.round(options.target) : null;
    this.destroyed = false;
    this.drag = null;
    this.hover = false;
    this.trail = [];
    this.tick = 0;
    this.lastTime = 0;
    this.accumulator = 0;
    this.noteUntil = 0;
    this.noteText = '';
    this.pointers = new Map();
    this.gesture = null;
    this.pinch = null;
    this.aimUntil = 0;
    this.reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.mount();
    try {
      this.scene = new GolfScene(this.canvas, { course: this.course, round: this.round, finale: this.finale, protestLevel: this.protestLevel });
    } catch (error) {
      console.error('Course graphics could not start.', error);
      this.showGraphicsUnavailable();
      return;
    }
    this.resize();
    this.updateUI();
    this.frame = requestAnimationFrame(t => this.animate(t));
  }

  mount() {
    if (!document.getElementById('pension-golf-style')) { const style = document.createElement('style'); style.id = 'pension-golf-style'; style.textContent = STYLE; document.head.append(style); }
    this.container.innerHTML = `<div class="golf-view" data-finale="${this.finale}"><div class="golf-surface"><canvas class="golf-canvas" tabindex="0" role="application" aria-label="Golf course. Drag the landing spot out from the ball, then release to swing. Drag it back to the ball to cancel. Drag the course to look around; pinch to zoom. Arrow keys aim and adjust power; Space swings; C changes club."></canvas><button type="button" class="golf-findable" aria-label="Pick up the paper" title="Pick up the paper" hidden><span aria-hidden="true"></span></button></div><div class="golf-hud"><div class="golf-stat" aria-label="Stroke count"><strong data-strokes>0</strong>${this.target ? `<small class="golf-target">/ &lt;${this.target}</small>` : ''}</div><div class="golf-flags" aria-hidden="true">${this.course.flags.map(f => `<span data-flag="${f.id}"></span>`).join('')}</div></div><div class="golf-note"></div><div class="golf-dock"><button type="button" class="golf-club-toggle" title="Change club">Chip ↗</button><button type="button" class="golf-shot-toggle" aria-label="Shot controls" aria-expanded="false" aria-controls="golf-shot-panel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.5" fill="currentColor"/><circle cx="15" cy="17" r="2.5" fill="currentColor"/></svg></button></div><button type="button" class="golf-recenter" aria-label="Return to ball" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg></button><div class="golf-shot-panel" id="golf-shot-panel" hidden><label class="golf-power"><span>55%</span><input type="range" min="8" max="100" value="55" aria-label="Shot power"></label><button type="button" class="golf-swing">Swing ↗</button></div><div class="golf-a11y" role="status" aria-live="polite"></div></div>`;
    this.view = this.container.querySelector('.golf-view');
    this.canvas = this.view.querySelector('canvas');
    this.powerInput = this.view.querySelector('input');
    this.noteEl = this.view.querySelector('.golf-note');
    this.statusEl = this.view.querySelector('[role=status]');
    this.findableButton = this.view.querySelector('.golf-findable');
    this.shotPanel = this.view.querySelector('.golf-shot-panel');
    this.shotToggle = this.view.querySelector('.golf-shot-toggle');
    this.clubToggle = this.view.querySelector('.golf-club-toggle');
    this.recenterButton = this.view.querySelector('.golf-recenter');
    this.controller = new AbortController();
    const opts = { signal: this.controller.signal };
    this.canvas.addEventListener('pointerdown', e => this.pointerDown(e), opts);
    this.canvas.addEventListener('pointermove', e => this.pointerMove(e), opts);
    this.canvas.addEventListener('pointerup', e => this.pointerUp(e), opts);
    this.canvas.addEventListener('pointercancel', e => this.pointerCancel(e), opts);
    this.canvas.addEventListener('wheel', e => { e.preventDefault(); this.scene?.zoom(Math.exp(-e.deltaY * .0015)); }, { ...opts, passive: false });
    this.recenterButton.addEventListener('click', () => this.scene?.recenter(this.round), opts);
    this.canvas.addEventListener('keydown', e => this.keyDown(e), opts);
    this.canvas.addEventListener('blur', () => { delete this.canvas.dataset.pointerFocus; }, opts);
    this.view.querySelector('.golf-swing').addEventListener('click', () => this.swing(), opts);
    this.findableButton.addEventListener('click', () => this.pickUpFindable(), opts);
    this.clubToggle.addEventListener('click', () => this.setClub(this.round.club === 'wedge' ? 'putter' : 'wedge'), opts);
    this.shotToggle.addEventListener('click', () => this.setShotControls(this.shotPanel.hidden), opts);
    this.powerInput.addEventListener('input', () => { this.round.power = Number(this.powerInput.value); this.updateUI(); this.persist(); }, opts);
    document.addEventListener('visibilitychange', () => { this.lastTime = 0; if (document.hidden) this.persist(); }, opts);
    window.addEventListener('pagehide', () => this.persist(), opts);
    window.addEventListener('resize', () => this.resize(), opts);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
  }

  showGraphicsUnavailable() {
    this.canvas.hidden = true;
    this.canvas.style.display = 'none';
    this.view.querySelector('.golf-dock').style.display = 'none';
    this.view.querySelector('.golf-hud').style.display = 'none';
    const message = document.createElement('div');
    message.className = 'golf-graphics-unavailable';
    message.setAttribute('role', 'status');
    message.innerHTML = '<p>3D graphics unavailable.</p><button type="button">Try again</button>';
    message.querySelector('button').addEventListener('click', () => window.location.reload(), { signal: this.controller.signal });
    this.view.append(message);
  }
  getSnapshot() { return JSON.parse(JSON.stringify(this.round)); }
  persist() { this.options.onChange?.(this.getSnapshot()); }
  setSound(enabled) { this.sound = Boolean(enabled); }
  setProtestLevel(level) { this.protestLevel = clamp(Math.trunc(finite(level, 0)), 0, 3); this.scene?.setProtestLevel(this.protestLevel); this.updateUI(); }
  setFindableFound(found = true) { if (this.findable) this.findable.found = Boolean(found); this.updateUI(); }
  findableAvailable() { return Boolean(this.findable && !this.findable.found && this.round.holes.filter(n => n !== null).length >= this.findable.afterFlags); }
  pickUpFindable() { if (!this.findableAvailable()) return; this.findable.found = true; this.updateUI(); this.options.onFind?.(this.findable.id); }
  setClub(club) { if (this.round.moving || this.round.finished) return; this.round.club = club === 'putter' ? 'putter' : 'wedge'; this.updateUI(); this.persist(); }
  reset() { this.round = makeRound(this.course.index, this.course.variant); this.trail = []; this.scene?.recenter(this.round, true); this.note('', 0); this.updateUI(); this.persist(); }
  destroy() { this.persist(); this.destroyed = true; cancelAnimationFrame(this.frame); this.controller.abort(); this.resizeObserver?.disconnect(); this.scene?.destroy(); this.audio?.close().catch(() => {}); this.container.innerHTML = ''; }

  resize() {
    if (this.destroyed || !this.scene) return;
    const rect = this.container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.scene.resize(rect.width, rect.height);
    this.positionFindable();
  }
  positionFindable() {
    if (!this.findable || !this.scene) return;
    const flag = this.course.flags[clamp(this.findable.afterFlags - 1, 0, 4)];
    const p = this.scene.worldToScreen({ x: flag.x + 25, y: flag.y + 22 });
    this.findableButton.hidden = !this.findableAvailable() || p.x < -22 || p.y < -22 || p.x > this.scene.width + 22 || p.y > this.scene.height + 22;
    this.findableButton.style.left = `${p.x}px`;
    this.findableButton.style.top = `${p.y}px`;
  }
  setShotControls(open) {
    this.shotPanel.hidden = !open;
    this.shotToggle.setAttribute('aria-expanded', String(open));
    this.note('', 0);
  }
  screenPoint(e) { const r = this.canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  point(e) { return this.scene.screenToWorld(this.screenPoint(e)); }
  pointerDown(e) {
    if (e.button > 0 || !this.scene) return;
    e.preventDefault(); this.canvas.dataset.pointerFocus = ''; this.canvas.focus({ preventScroll: true });
    const screen = this.screenPoint(e);
    this.pointers.set(e.pointerId, screen);
    this.canvas.setPointerCapture(e.pointerId);
    if (this.pointers.size > 1) {
      this.restoreDragAim(this.drag);
      this.drag = null; this.gesture = null;
      const [a, b] = [...this.pointers.values()];
      this.pinch = { distance: distance(a, b), center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
      return;
    }
    const ball = this.scene.worldToScreen(this.round.ball);
    const isShot = !this.round.moving && !this.round.finished && distance(screen, ball) <= 27;
    this.gesture = { kind: isShot ? 'shot' : 'pan', pointer: e.pointerId, startScreen: screen, lastScreen: screen, moved: false, cancelled: true, initialAngle: this.round.angle, initialPower: this.round.power };
    if (isShot) { this.drag = this.gesture; this.aimUntil = 0; this.setShotControls(false); }
  }
  pointerMove(e) {
    if (!this.pointers.has(e.pointerId)) return;
    const screen = this.screenPoint(e);
    this.pointers.set(e.pointerId, screen);
    if (this.pointers.size > 1) {
      const [a, b] = [...this.pointers.values()];
      const next = { distance: distance(a, b), center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
      if (this.pinch) {
        if (this.pinch.distance > 0) this.scene.zoom(next.distance / this.pinch.distance);
        this.scene.pan(next.center.x - this.pinch.center.x, next.center.y - this.pinch.center.y);
      }
      this.pinch = next;
      return;
    }
    const gesture = this.gesture;
    if (!gesture || gesture.pointer !== e.pointerId) return;
    if (distance(screen, gesture.startScreen) > 4) gesture.moved = true;
    if (!gesture.moved) return;
    if (gesture.kind === 'pan') {
      this.scene.pan(screen.x - gesture.lastScreen.x, screen.y - gesture.lastScreen.y);
      gesture.lastScreen = screen;
      return;
    }
    this.aimDragAt(gesture, screen);
  }
  aimDragAt(gesture, screen) {
    const ball = this.round.ball;
    gesture.cancelled = distance(screen, this.scene.worldToScreen(ball)) <= 24;
    gesture.target = this.scene.screenToWorld(screen);
    if (!gesture.cancelled) {
      this.round.angle = Math.atan2(gesture.target.y - ball.y, gesture.target.x - ball.x);
      this.round.power = powerForRange(distance(gesture.target, ball), this.round.club);
    }
    this.updateUI();
  }
  restoreDragAim(gesture) {
    if (!gesture || gesture.kind !== 'shot') return;
    this.round.angle = gesture.initialAngle;
    this.round.power = gesture.initialPower;
    this.aimUntil = 0;
    this.updateUI();
  }
  releasePointer(e) {
    this.pointers.delete(e.pointerId);
    if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
  }
  pointerCancel() {
    this.restoreDragAim(this.drag);
    for (const id of this.pointers.keys()) if (this.canvas.hasPointerCapture(id)) this.canvas.releasePointerCapture(id);
    this.pointers.clear();
    this.drag = null; this.gesture = null; this.pinch = null;
  }
  pointerUp(e) {
    this.releasePointer(e);
    if (this.pinch) {
      this.drag = null; this.gesture = null;
      if (!this.pointers.size) this.pinch = null;
      return;
    }
    const gesture = this.gesture;
    if (!gesture || gesture.pointer !== e.pointerId) return;
    if (gesture.kind === 'shot') this.aimDragAt(gesture, this.screenPoint(e));
    this.gesture = null; this.drag = null;
    if (gesture.kind === 'shot') {
      if (gesture.moved && !gesture.cancelled) this.swing();
      else this.restoreDragAim(gesture);
    } else if (!gesture.moved && !this.round.moving && !this.round.finished) {
      const p = this.point(e);
      this.round.angle = Math.atan2(p.y - this.round.ball.y, p.x - this.round.ball.x);
      if (this.options.assisted) this.round.power = powerForRange(distance(p, this.round.ball), this.round.club);
      this.aimUntil = performance.now() + 3000;
      this.updateUI(); this.persist();
    }
  }
  keyDown(e) {
    if (!this.scene) return;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter', 'c', 'C'].includes(e.key)) return;
    e.preventDefault();
    delete this.canvas.dataset.pointerFocus;
    if (this.round.moving || this.round.finished) return;
    this.aimUntil = performance.now() + 4000;
    if (e.key === 'ArrowLeft') this.round.angle -= .045;
    if (e.key === 'ArrowRight') this.round.angle += .045;
    if (e.key === 'ArrowUp') this.round.power = clamp(this.round.power + 3, 8, 100);
    if (e.key === 'ArrowDown') this.round.power = clamp(this.round.power - 3, 8, 100);
    if (e.key.toLowerCase() === 'c') this.setClub(this.round.club === 'putter' ? 'wedge' : 'putter');
    if (e.key === ' ' || e.key === 'Enter') this.swing();
    this.updateUI(); this.persist();
  }
  swing() {
    if (!launchShot(this.round)) return;
    this.trail = [];
    this.aimUntil = 0;
    this.scene?.recenter(this.round);
    this.setShotControls(false);
    this.note('', 0);
    this.playSound('swing');
    this.updateUI(); this.persist();
  }
  note(text, duration = 2800) { this.noteText = text; this.noteUntil = duration === Infinity ? Infinity : performance.now() + duration; this.noteEl.textContent = text; this.statusEl.textContent = text; }
  playSound(type) {
    if (!this.sound) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.audio ||= new AC();
      this.audio.resume();
      const o = this.audio.createOscillator(), g = this.audio.createGain(), now = this.audio.currentTime;
      o.type = type === 'water' ? 'sine' : 'triangle';
      o.frequency.setValueAtTime(type === 'swing' ? 380 : type === 'water' ? 160 : 590, now);
      o.frequency.exponentialRampToValueAtTime(type === 'swing' ? 120 : type === 'water' ? 50 : 880, now + .15);
      g.gain.setValueAtTime(.035, now); g.gain.exponentialRampToValueAtTime(.0001, now + .23);
      o.connect(g); g.connect(this.audio.destination); o.start(); o.stop(now + .25);
    } catch { /* Audio is optional. */ }
  }
  updateUI() {
    const r = this.round;
    this.findableButton.hidden = !this.findableAvailable();
    this.positionFindable();
    this.view.querySelector('[data-strokes]').textContent = r.strokes;
    this.view.querySelectorAll('[data-flag]').forEach(el => { const done = r.holes[Number(el.dataset.flag)] !== null; el.classList.toggle('done', done); el.setAttribute('title', `Flag ${Number(el.dataset.flag) + 1}${done ? ' complete' : ''}`); });
    this.clubToggle.textContent = r.club === 'putter' ? 'Roll —' : 'Chip ↗';
    this.clubToggle.setAttribute('aria-label', `${r.club === 'putter' ? 'Roll' : 'Chip'} selected. Change club.`);
    this.clubToggle.disabled = r.moving || r.finished;
    this.shotToggle.disabled = r.moving || r.finished;
    this.powerInput.value = Math.round(r.power);
    this.view.querySelector('.golf-power span').textContent = `${Math.round(r.power)}%`;
    this.powerInput.disabled = r.moving || r.finished;
    this.view.querySelector('.golf-swing').disabled = r.moving || r.finished;
    this.view.querySelector('.golf-swing').textContent = r.finished ? 'Complete ✓' : 'Swing ↗';
    this.noteEl.textContent = this.noteText;
    this.canvas.setAttribute('aria-label', `Golf: ${r.strokes} strokes${this.target ? `, beat ${this.target}` : ''}, ${r.holes.filter(n => n !== null).length} of 5 flags. ${r.club === 'wedge' ? 'Chip' : 'Roll'}, ${Math.round(r.power)} percent power. ${this.findableAvailable() ? 'A paper lies on the green. ' : ''}${this.protestLevel ? `${[0, 12, 36, 108][this.protestLevel]} protesters gather beyond the course.${this.protestLevel > 1 ? ' They chant Robert Trent Jones.' : ''} ` : ''}Drag the landing spot out from the ball, then release to swing. Drag it back to the ball to cancel. Drag the course to look around; pinch or scroll to zoom. Shot controls are also available below. Arrows aim and adjust power; Space swings; C changes club.`);
  }
  animate(time) {
    if (this.destroyed) return;
    const elapsed = this.lastTime ? Math.min(100, time - this.lastTime) : 0;
    this.lastTime = time;
    if (!document.hidden) {
      this.accumulator += elapsed;
      while (this.accumulator >= 1000 / 60) {
        this.accumulator -= 1000 / 60;
        this.tick++;
        if (this.round.moving) {
          const event = stepRound(this.round, this.course, Boolean(this.options.assisted));
          if (this.tick % 3 === 0) { this.trail.push({ x: this.round.ball.x, y: this.round.ball.y }); if (this.trail.length > 13) this.trail.shift(); }
          if (event) {
            this.updateUI(); this.persist();
            if (event.type === 'water') { this.note('Water +1'); this.playSound('water'); }
            if (event.type === 'hole') { this.statusEl.textContent = `Flag ${event.flag + 1}, ${event.score} strokes.`; this.playSound('hole'); }
            if (event.type === 'complete') { this.statusEl.textContent = `${this.round.strokes} strokes. Round complete.`; this.playSound('hole'); this.options.onComplete?.({ strokes: this.round.strokes, holes: [...this.round.holes], finished: true }); if (this.destroyed) return; }
          } else if (this.tick % 15 === 0) this.persist();
        }
      }
      if (time > this.noteUntil && this.noteText) { this.noteText = ''; this.noteEl.textContent = ''; }
      this.draw(time);
    }
    this.frame = requestAnimationFrame(t => this.animate(t));
  }

  draw(time) {
    if (!this.scene) return;
    this.scene.render(this.round, { time, drag: this.drag, aimVisible: !this.drag && (!this.shotPanel.hidden || time < this.aimUntil), trail: this.trail });
    this.positionFindable();
    this.recenterButton.hidden = !this.scene.panned;
  }
}
