// Original pocket-golf courses. Everything, including the illustration, runs offline.
export const WORLD = { width: 900, height: 680 };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const ellipseContains = (p, e, padding = 0) => ((p.x - e.x) / (e.rx + padding)) ** 2 + ((p.y - e.y) / (e.ry + padding)) ** 2 < 1;
const finite = (v, fallback) => Number.isFinite(v) ? v : fallback;
const variantNumber = v => Number.isSafeInteger(v) && v >= 0 ? v : 0;

// The simulation stays in one coordinate system while the viewport can turn.
// A uniform transform preserves circles, distances, and touch accuracy.
export function cameraForViewport(width, height) {
  const w = Math.max(1, finite(width, WORLD.width));
  const h = Math.max(1, finite(height, WORLD.height));
  const rotation = h > w * 1.1 ? Math.PI / 2 : 0;
  const rotated = rotation !== 0;
  const boardWidth = rotated ? WORLD.height : WORLD.width;
  const boardHeight = rotated ? WORLD.width : WORLD.height;
  const top = h < 440 ? 16 : 40, bottom = h < 440 ? 52 : 64;
  const scale = Math.max(.01, Math.min(Math.max(1, w - 16) / boardWidth, Math.max(1, h - top - bottom) / boardHeight));
  return { width: w, height: h, rotation, scale, x: (w - boardWidth * scale) / 2, y: top + (Math.max(1, h - top - bottom) - boardHeight * scale) / 2 };
}
export function worldToScreen(point, camera) {
  return camera.rotation ? { x: camera.x + (WORLD.height - point.y) * camera.scale, y: camera.y + point.x * camera.scale } : { x: camera.x + point.x * camera.scale, y: camera.y + point.y * camera.scale };
}
export function screenToWorld(point, camera) {
  return camera.rotation ? { x: (point.y - camera.y) / camera.scale, y: WORLD.height - (point.x - camera.x) / camera.scale } : { x: (point.x - camera.x) / camera.scale, y: (point.y - camera.y) / camera.scale };
}
export function ballTouchRadius(camera) { return Math.max(20, 22 / camera.scale); }


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
function seeded(seed) { let n = seed >>> 0; return () => { n = (1664525 * n + 1013904223) >>> 0; return n / 4294967296; }; }
function oval(ctx, x, y, rx, ry, color, rotation = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }

const STYLE = `
.golf-view{position:relative;width:100%;height:100%;overflow:hidden;isolation:isolate;color:#173e33;font:12px/1.4 system-ui,sans-serif;background:#95ab79}.golf-surface{position:absolute;inset:0}.golf-canvas{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair;outline-offset:-4px}.golf-canvas:focus-visible{outline:2px solid #f1c264}.golf-view button{font:inherit;cursor:pointer;border:0;transition:background .15s}.golf-view button:focus-visible,.golf-view input:focus-visible{outline:2px solid #ba893c;outline-offset:3px}.golf-view button:disabled{opacity:.45;cursor:default}.golf-hud{position:absolute;top:max(12px,env(safe-area-inset-top));left:max(12px,env(safe-area-inset-left));display:flex;align-items:center;gap:12px;height:44px;padding:0 14px;background:#f8f5e7e0;border:1px solid #fff8;border-radius:24px;box-shadow:0 2px 10px #24422b0d;pointer-events:none}.golf-stat{font-variant-numeric:tabular-nums;line-height:1}.golf-target{font:10px/1.2 system-ui,sans-serif;color:#61755c;margin-left:5px}.golf-stat strong{font:24px/1 Georgia,serif;font-weight:400}.golf-flags{display:flex;gap:6px}.golf-flags span{width:7px;height:7px;border:1px solid #6a7f5f;border-radius:50%;background:transparent}.golf-flags span.done{background:#345c42;border-color:#345c42}.golf-note{pointer-events:none;position:absolute;bottom:max(76px,calc(env(safe-area-inset-bottom) + 76px));left:50%;transform:translateX(-50%);white-space:nowrap;font-size:11px;background:#fffdf0e8;border:1px solid #fff9;color:#375541;padding:8px 14px;border-radius:20px;opacity:1;transition:opacity .4s}.golf-note:empty{opacity:0}.golf-dock{position:absolute;bottom:max(12px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);display:flex;gap:7px;align-items:center}.golf-view .golf-club-toggle,.golf-view .golf-shot-toggle{height:44px;background:#f8f5e7e8;color:#214432;border:1px solid #fff8;box-shadow:0 2px 10px #24422b18;border-radius:24px}.golf-view .golf-club-toggle{min-width:78px;padding:0 17px}.golf-view .golf-shot-toggle{width:44px;padding:0;display:grid;place-items:center}.golf-shot-toggle svg{width:18px;height:18px}.golf-shot-toggle[aria-expanded=true]{background:#244a38;color:#fff9e9}.golf-shot-panel{position:absolute;bottom:max(66px,calc(env(safe-area-inset-bottom) + 66px));left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;width:min(330px,calc(100% - 32px));padding:13px 14px;background:#f8f5e7f5;border:1px solid #fff9;border-radius:18px;box-shadow:0 5px 24px #1c412426}.golf-shot-panel[hidden]{display:none}.golf-power{display:flex;align-items:center;gap:8px;flex:1;min-width:0}.golf-power input{accent-color:#345d45;width:100%;min-width:55px;height:30px;cursor:pointer}.golf-power span{font:10px/1.2 system-ui,sans-serif;min-width:30px;text-align:right;color:#62745e}.golf-view .golf-swing{height:44px;background:#234b39;color:#fffdf4;padding:0 17px;border-radius:24px}.golf-swing:hover{background:#345f45}.golf-a11y{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.golf-view[data-finale=true] .golf-flags span.done{background:#623d42;border-color:#623d42}.golf-view .golf-findable{position:absolute;transform:translate(-50%,-50%);width:44px;height:44px;background:transparent;padding:0;display:grid;place-items:center;z-index:1}.golf-view .golf-findable[hidden]{display:none}.golf-findable>span{display:block;width:14px;height:19px;background:#fffbed;box-shadow:2px 3px 2px #263d312a;transform:rotate(-17deg);position:relative}.golf-findable>span:before{content:'';position:absolute;right:0;top:0;border-top:5px solid #d1d5b8;border-left:5px solid transparent}.golf-findable>span:after{content:'';position:absolute;left:3px;top:8px;width:7px;height:1px;background:#8d90704d;box-shadow:0 3px 0 #8d90704d,0 6px 0 #8d90704d}.golf-findable:is(:hover,:focus-visible):after{content:attr(aria-label);position:absolute;bottom:42px;left:50%;transform:translateX(-50%);white-space:nowrap;font:10px/1.4 system-ui,sans-serif;color:#294734;background:#fffbee;padding:5px 8px;border:1px solid #e5e6d1;box-shadow:0 2px 5px #29473418;pointer-events:none}@media(max-height:440px){.golf-hud{top:max(8px,env(safe-area-inset-top));height:40px}.golf-dock{bottom:max(8px,env(safe-area-inset-bottom))}}@media(prefers-reduced-motion:reduce){.golf-view *{transition:none!important}}`;

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
    this.camera = cameraForViewport(window.innerWidth, window.innerHeight);
    this.reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.mount();
    this.makeBackground();
    this.resize();
    this.updateUI();
    this.frame = requestAnimationFrame(t => this.animate(t));
  }

  mount() {
    if (!document.getElementById('pension-golf-style')) { const style = document.createElement('style'); style.id = 'pension-golf-style'; style.textContent = STYLE; document.head.append(style); }
    this.container.innerHTML = `<div class="golf-view" data-finale="${this.finale}"><div class="golf-surface"><canvas class="golf-canvas" tabindex="0" role="application" aria-label="Five-flag golf course. Drag back from the ball and release. Arrow keys aim and adjust power; Space swings; C changes club."></canvas><button type="button" class="golf-findable" aria-label="Pick up the paper" title="Pick up the paper" hidden><span aria-hidden="true"></span></button></div><div class="golf-hud"><div class="golf-stat" aria-label="Stroke count"><strong data-strokes>0</strong>${this.target ? `<small class="golf-target">/ &lt;${this.target}</small>` : ''}</div><div class="golf-flags" aria-hidden="true">${this.course.flags.map(f => `<span data-flag="${f.id}"></span>`).join('')}</div></div><div class="golf-note"></div><div class="golf-dock"><button type="button" class="golf-club-toggle" title="Change club">Chip ↗</button><button type="button" class="golf-shot-toggle" aria-label="Shot controls" aria-expanded="false" aria-controls="golf-shot-panel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.5" fill="currentColor"/><circle cx="15" cy="17" r="2.5" fill="currentColor"/></svg></button></div><div class="golf-shot-panel" id="golf-shot-panel" hidden><label class="golf-power"><span>55%</span><input type="range" min="8" max="100" value="55" aria-label="Shot power"></label><button type="button" class="golf-swing">Swing ↗</button></div><div class="golf-a11y" role="status" aria-live="polite"></div></div>`;
    this.view = this.container.querySelector('.golf-view');
    this.canvas = this.view.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.powerInput = this.view.querySelector('input');
    this.noteEl = this.view.querySelector('.golf-note');
    this.statusEl = this.view.querySelector('[role=status]');
    this.findableButton = this.view.querySelector('.golf-findable');
    this.shotPanel = this.view.querySelector('.golf-shot-panel');
    this.shotToggle = this.view.querySelector('.golf-shot-toggle');
    this.clubToggle = this.view.querySelector('.golf-club-toggle');
    this.controller = new AbortController();
    const opts = { signal: this.controller.signal };
    this.canvas.addEventListener('pointerdown', e => this.pointerDown(e), opts);
    this.canvas.addEventListener('pointermove', e => this.pointerMove(e), opts);
    this.canvas.addEventListener('pointerup', e => this.pointerUp(e), opts);
    this.canvas.addEventListener('pointercancel', () => { this.drag = null; }, opts);
    this.canvas.addEventListener('keydown', e => this.keyDown(e), opts);
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

  getSnapshot() { return JSON.parse(JSON.stringify(this.round)); }
  persist() { this.options.onChange?.(this.getSnapshot()); }
  setSound(enabled) { this.sound = Boolean(enabled); }
  setProtestLevel(level) { this.protestLevel = clamp(Math.trunc(finite(level, 0)), 0, 3); this.makeBackground(); this.resize(); this.updateUI(); }
  setFindableFound(found = true) { if (this.findable) this.findable.found = Boolean(found); this.updateUI(); }
  findableAvailable() { return Boolean(this.findable && !this.findable.found && this.round.holes.filter(n => n !== null).length >= this.findable.afterFlags); }
  pickUpFindable() { if (!this.findableAvailable()) return; this.findable.found = true; this.updateUI(); this.options.onFind?.(this.findable.id); }
  setClub(club) { if (this.round.moving || this.round.finished) return; this.round.club = club === 'putter' ? 'putter' : 'wedge'; this.updateUI(); this.persist(); }
  reset() { this.round = makeRound(this.course.index, this.course.variant); this.trail = []; this.note('', 0); this.updateUI(); this.persist(); }
  destroy() { this.persist(); this.destroyed = true; cancelAnimationFrame(this.frame); this.controller.abort(); this.resizeObserver?.disconnect(); this.audio?.close().catch(() => {}); this.container.innerHTML = ''; }

  resize() {
    if (this.destroyed || !this.canvas) return;
    const rect = this.container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.camera = cameraForViewport(rect.width, rect.height);
    this.dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    this.positionFindable();
    if (this.background) { this.makeViewportBackground(); this.draw(performance.now()); }
  }
  applyCamera(ctx) {
    ctx.translate(this.camera.x, this.camera.y);
    ctx.scale(this.camera.scale, this.camera.scale);
    if (this.camera.rotation) { ctx.translate(WORLD.height, 0); ctx.rotate(this.camera.rotation); }
  }
  makeViewportBackground() {
    const layer = document.createElement('canvas');
    layer.width = this.canvas.width; layer.height = this.canvas.height;
    const ctx = layer.getContext('2d'), cam = this.camera;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); this.applyCamera(ctx);
    const corners = [[0,0],[cam.width,0],[0,cam.height],[cam.width,cam.height]].map(([x,y]) => screenToWorld({x,y},cam));
    const minX = Math.min(...corners.map(p=>p.x)), minY = Math.min(...corners.map(p=>p.y));
    const w = Math.max(...corners.map(p=>p.x)) - minX, h = Math.max(...corners.map(p=>p.y)) - minY;
    const season = this.course.variant % 4;
    const gradient = ctx.createLinearGradient(0,0,900,680);
    gradient.addColorStop(0,['#a2b785','#aab989','#9eb58f','#b1b587'][season]);
    gradient.addColorStop(1,['#7f9b69','#8c9d6a','#7e9b75','#949b6a'][season]);
    ctx.fillStyle = gradient; ctx.fillRect(minX-2,minY-2,w+4,h+4);
    const random = seeded(1741 + this.course.index);
    for(let i=0;i<2200;i++) { const x=minX+random()*w,y=minY+random()*h;ctx.fillStyle=random()>.6?'#d4dcab35':'#54744320';ctx.fillRect(x,y,.8,2.5); }
    ctx.drawImage(this.background,0,0);
    this.viewportBackground = layer;
  }
  positionFindable() {
    if (!this.findable || !this.camera) return;
    const flag = this.course.flags[clamp(this.findable.afterFlags - 1, 0, 4)];
    const p = worldToScreen({ x: flag.x + 25, y: flag.y + 22 }, this.camera);
    this.findableButton.style.left = `${p.x}px`;
    this.findableButton.style.top = `${p.y}px`;
  }
  setShotControls(open) {
    this.shotPanel.hidden = !open;
    this.shotToggle.setAttribute('aria-expanded', String(open));
    this.note('', 0);
  }
  point(e) { const r = this.canvas.getBoundingClientRect(); return screenToWorld({ x: e.clientX - r.left, y: e.clientY - r.top }, this.camera); }
  pointerDown(e) {
    if (this.round.moving || this.round.finished || e.button > 0) return;
    e.preventDefault(); this.canvas.focus({ preventScroll: true });
    const p = this.point(e);
    const touchRadius = ballTouchRadius(this.camera);
    if (distance(p, this.round.ball) < touchRadius) {
      this.setShotControls(false);
      this.drag = { pointer: e.pointerId, start: p, moved: false };
      this.canvas.setPointerCapture(e.pointerId);
    } else {
      this.round.angle = Math.atan2(p.y - this.round.ball.y, p.x - this.round.ball.x);
      // Ordinary play leaves power in the golfer's hands. Optional assistance
      // estimates a flat-lie distance when a target is tapped.
      if (this.options.assisted) this.round.power = powerForRange(distance(p, this.round.ball), this.round.club);
      this.setShotControls(true); this.updateUI(); this.persist();
    }
  }
  pointerMove(e) {
    if (!this.drag || this.drag.pointer !== e.pointerId) return;
    const p = this.point(e), d = distance(p, this.drag.start);
    if (d > 5) this.drag.moved = true;
    if (!this.drag.moved) return;
    this.round.angle = Math.atan2(this.drag.start.y - p.y, this.drag.start.x - p.x);
    this.round.power = clamp(d / 1.5, 8, 100);
    this.updateUI();
  }
  pointerUp(e) {
    if (!this.drag || this.drag.pointer !== e.pointerId) return;
    const moved = this.drag.moved;
    this.drag = null;
    if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
    if (moved) this.swing();
    else this.setShotControls(true);
  }
  keyDown(e) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter', 'c', 'C'].includes(e.key)) return;
    e.preventDefault();
    if (this.round.moving || this.round.finished) return;
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
    this.canvas.setAttribute('aria-label', `Golf: ${r.strokes} strokes${this.target ? `, beat ${this.target}` : ''}, ${r.holes.filter(n => n !== null).length} of 5 flags. ${r.club === 'wedge' ? 'Chip' : 'Roll'}, ${Math.round(r.power)} percent power. ${this.findableAvailable() ? 'A paper lies on the green. ' : ''}${this.protestLevel ? `${[0, 12, 36, 108][this.protestLevel]} protesters gather beyond the course.${this.protestLevel > 1 ? ' They chant Robert Trent Jones.' : ''} ` : ''}Drag back and release, or tap a target and Swing. Arrows aim and adjust power; space swings; C changes club.`);
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
            if (event.type === 'complete') { this.statusEl.textContent = `${this.round.strokes} strokes. Round complete.`; this.playSound('hole'); this.options.onComplete?.({ strokes: this.round.strokes, holes: [...this.round.holes], finished: true }); }
          } else if (this.tick % 15 === 0) this.persist();
        }
      }
      if (time > this.noteUntil && this.noteText) { this.noteText = ''; this.noteEl.textContent = ''; }
      this.draw(time);
    }
    this.frame = requestAnimationFrame(t => this.animate(t));
  }

  makeBackground() {
    this.background = document.createElement('canvas'); this.background.width = 900; this.background.height = 680;
    const ctx = this.background.getContext('2d'), c = this.course;
    const random = seeded(2071 + c.index * 24);
    const season = c.variant % 4;
    const bg = ctx.createLinearGradient(0, 0, 900, 680); bg.addColorStop(0, ['#a2b785', '#aab989', '#9eb58f', '#b1b587'][season]); bg.addColorStop(1, ['#7f9b69', '#8c9d6a', '#7e9b75', '#949b6a'][season]); ctx.fillStyle = bg; ctx.fillRect(0, 0, 900, 680);
    // A cool perimeter and long late-afternoon shadows anchor the little world.
    ctx.strokeStyle = '#6e885b'; ctx.lineWidth = 3; ctx.strokeRect(26, 24, 848, 631);
    ctx.strokeStyle = '#c6c4a0'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-20, 556); ctx.bezierCurveTo(137, 642, 322, 652, 561, 631); ctx.bezierCurveTo(844, 639, 815, 475, 870, 317); ctx.stroke();
    ctx.strokeStyle = '#dbd4b3'; ctx.lineWidth = 10; ctx.stroke();
    const points = [c.start, ...c.flags];
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); points.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.strokeStyle = '#85a469'; ctx.lineWidth = 123; ctx.stroke(); ctx.strokeStyle = '#a9bf80'; ctx.lineWidth = 103; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); points.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.lineWidth = 102;
    const stripe = document.createElement('canvas'); stripe.width = 50; stripe.height = 50; const s = stripe.getContext('2d'); s.fillStyle = '#b1c587'; s.fillRect(0, 0, 25, 50); s.fillStyle = '#a8bd7f'; s.fillRect(25, 0, 25, 50); const pat = ctx.createPattern(stripe, 'repeat'); if (pat?.setTransform && typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix().rotate(28)); ctx.strokeStyle = pat || '#b1c587'; ctx.stroke(); ctx.restore();
    for (const f of c.flags) { oval(ctx, f.x + 2, f.y + 4, 76, 56, '#759b61', -.15); oval(ctx, f.x, f.y, 72, 52, '#bacd8a', -.15); oval(ctx, f.x - 5, f.y - 2, 56, 38, '#c2d394', -.15); ctx.strokeStyle = '#aec581'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(f.x - 5, f.y - 2, 62, 44, -.15, 0, Math.PI * 2); ctx.stroke(); }
    for (const w of c.water) {
      oval(ctx, w.x + 2, w.y + 5, w.rx + 8, w.ry + 6, '#78925c'); oval(ctx, w.x, w.y, w.rx + 5, w.ry + 4, '#d0caa0');
      const g = ctx.createLinearGradient(w.x, w.y - w.ry, w.x, w.y + w.ry); g.addColorStop(0, '#578f8c'); g.addColorStop(1, '#88b7a3'); oval(ctx, w.x, w.y, w.rx, w.ry, g);
      ctx.save(); ctx.beginPath(); ctx.ellipse(w.x, w.y, w.rx - 3, w.ry - 3, 0, 0, Math.PI * 2); ctx.clip(); ctx.strokeStyle = '#d0e3c842'; ctx.lineWidth = 1; for (let i = 0; i < 25; i++) { const y = w.y - w.ry + random() * w.ry * 2, x = w.x - w.rx + random() * w.rx * 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 12 + random() * 27, y); ctx.stroke(); } ctx.restore();
      for (let i = 0; i < 17; i++) { const a = random() * Math.PI * 2, x = w.x + Math.cos(a) * (w.rx + 4), y = w.y + Math.sin(a) * (w.ry + 4); ctx.strokeStyle = '#587752'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y - 7); ctx.moveTo(x, y); ctx.lineTo(x + 3, y - 5); ctx.stroke(); }
      if (this.finale && this.protestLevel === 3) {
        // A reflection without anything above it. Still the same beautiful day.
        ctx.save(); ctx.beginPath(); ctx.ellipse(w.x, w.y, w.rx - 5, w.ry - 5, 0, 0, Math.PI * 2); ctx.clip();
        const shadow = ctx.createRadialGradient(w.x, w.y + 7, 3, w.x, w.y, w.rx * .85); shadow.addColorStop(0, '#223f443b'); shadow.addColorStop(1, '#223f4400'); oval(ctx, w.x, w.y + 4, w.rx * .8, w.ry * .9, shadow);
        ctx.strokeStyle = '#28464c25'; ctx.lineCap = 'round';
        for (let arm = 0; arm < 5; arm++) { const a = arm * Math.PI * .48 - .6, dx = Math.cos(a), dy = Math.sin(a); ctx.lineWidth = 10 - arm; ctx.beginPath(); ctx.moveTo(w.x, w.y + 7); ctx.bezierCurveTo(w.x + dx * 32 - dy * 22, w.y + dy * 28 + dx * 22, w.x + dx * 75 + dy * 18, w.y + dy * 49 - dx * 15, w.x + dx * 99, w.y + dy * 72); ctx.stroke(); }
        oval(ctx, w.x - 10, w.y - 3, 4, 2, '#dccd8c43'); oval(ctx, w.x + 9, w.y - 3, 4, 2, '#dccd8c43');
        ctx.restore();
      }
    }
    for (const s of c.sand) { oval(ctx, s.x, s.y + 2, s.rx + 5, s.ry + 4, '#8d9e6b', -.24); oval(ctx, s.x, s.y, s.rx, s.ry, '#e5d6ab', -.24); oval(ctx, s.x + 3, s.y + 2, s.rx - 5, s.ry - 4, '#efdfb7', -.24); ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(-.24); ctx.strokeStyle = '#cfbc8b70'; ctx.lineWidth = .7; for (let y = -s.ry + 7; y < s.ry - 5; y += 5) { const w = s.rx * Math.sqrt(1 - y * y / s.ry ** 2) - 8; ctx.beginPath(); ctx.moveTo(-w, y); ctx.lineTo(w, y); ctx.stroke(); } ctx.restore(); }
    // Fine grass, flowers, and restrained paper grain (deterministic, no image assets).
    for (let i = 0; i < 2100; i++) { const x = random() * 900, y = random() * 680; if (terrainAt({ x, y }, c) !== 'rough') continue; ctx.fillStyle = random() > .6 ? '#d4dcab35' : '#54744320'; ctx.fillRect(x, y, .8, 2.5); }
    for (let i = 0; i < 130; i++) { const x = random() * 900, y = random() * 680; if ((x > 160 && x < 790 && y > 85 && y < 585) || terrainAt({ x, y }, c) !== 'rough') continue; oval(ctx, x, y, 1.5, 1, '#e8dfb5aa'); }
    // Tee markers, a quiet stone sign, and a little clubhouse porch.
    oval(ctx, c.start.x, c.start.y, 21, 13, '#b7c58a'); ctx.fillStyle = '#fcf8e5'; ctx.fillRect(c.start.x - 21, c.start.y - 4, 4, 7); ctx.fillRect(c.start.x + 17, c.start.y - 4, 4, 7);
    ctx.save(); ctx.translate(119, 47); ctx.transform(1, .14, -.22, 1, 0, 0); ctx.fillStyle = '#2b493530'; ctx.fillRect(8, 12, 109, 42); ctx.fillStyle = '#e4d7b5'; ctx.fillRect(0, 0, 104, 37); ctx.fillStyle = '#56705e'; ctx.fillRect(-5, -5, 114, 23); ctx.fillStyle = '#476450'; ctx.fillRect(-5, 18, 114, 6); ctx.fillStyle = '#b7a987'; for (let x = 8; x < 104; x += 24) ctx.fillRect(x, 25, 3, 12); ctx.restore();
    ctx.fillStyle = '#dfdbbb'; ctx.fillRect(169, 574, 32, 13); ctx.fillStyle = '#62745b'; ctx.fillRect(172, 587, 3, 8); ctx.fillRect(195, 587, 3, 8); ctx.font = 'bold 7px Georgia'; ctx.textAlign = 'center'; ctx.fillStyle = '#4e644b'; ctx.fillText(this.finale ? 'WELCOME BACK' : 'RSA', 185, 583);
    // Shadows are painted before canopies so neighbouring pines feel like a grove.
    c.trees.forEach(t => oval(ctx, t.x + 15, t.y + 12, t.r * 1.13, t.r * .51, '#2e50362e', .65));
    for (const t of c.trees) {
      ctx.fillStyle = '#6d7350'; ctx.fillRect(t.x - 2, t.y - 1, 4, 10);
      oval(ctx, t.x, t.y - 4, t.r, t.r * .82, '#426b46');
      oval(ctx, t.x - t.r * .28, t.y - t.r * .3, t.r * .72, t.r * .6, '#5a8050');
      oval(ctx, t.x + t.r * .23, t.y - t.r * .49, t.r * .58, t.r * .48, '#6c8c56');
      oval(ctx, t.x - t.r * .17, t.y - t.r * .64, t.r * .40, t.r * .31, '#7d9a61');
      ctx.strokeStyle = '#93a56b45'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(t.x - t.r * .3, t.y - t.r * .3); ctx.lineTo(t.x + t.r * .16, t.y - t.r * .1); ctx.stroke();
    }
    if (this.protestLevel) {
      const people = [0, 12, 36, 108][this.protestLevel];
      const columns = this.protestLevel === 3 ? 36 : this.protestLevel === 2 ? 18 : 12;
      const palette = ['#536d59', '#a39d73', '#718479', '#b8af8c', '#6d7060', '#9c7963'];
      for (let i = 0; i < people; i++) {
        const row = Math.floor(i / columns), col = i % columns;
        const x = this.protestLevel === 3 ? 264 + col * 15.2 + (row % 2) * 4 : 425 + col * 19;
        const y = 629 + row * 14 + (col % 3) * 1.4;
        oval(ctx, x + 4, y + 5, 5, 2, '#29493630', .4);
        ctx.fillStyle = palette[(i * 7 + row) % palette.length]; ctx.beginPath(); ctx.moveTo(x - 3, y + 5); ctx.lineTo(x - 2.7, y - 1); ctx.quadraticCurveTo(x, y - 4, x + 2.7, y - 1); ctx.lineTo(x + 3, y + 5); ctx.closePath(); ctx.fill();
        oval(ctx, x, y - 4.5, 2.4, 2.7, ['#c4ac83', '#957b5b', '#d8bea0', '#a58e6b'][i % 4]);
        if (i % 3 === 0) { ctx.fillStyle = '#e5d9b6'; ctx.fillRect(x - 3, y - 7, 6, 1.8); }
        if (i % 6 === 1 && row === 0) {
          ctx.strokeStyle = '#7a7358'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 3, y + 1); ctx.lineTo(x + 5, y - 16); ctx.stroke();
          ctx.fillStyle = '#efead0'; ctx.fillRect(x - 6, y - 23, 23, 11);
          ctx.fillStyle = '#5a6752'; ctx.font = 'bold 5px system-ui'; ctx.textAlign = 'center'; ctx.fillText('JONES', x + 5, y - 15);
        }
      }
    }
    if (this.finale) { ctx.save(); ctx.globalAlpha = .13; ctx.strokeStyle = '#59364e'; ctx.lineWidth = 1; ctx.beginPath(); c.flags.forEach((f, i) => { const p = c.flags[(i * 2) % 5]; if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }); ctx.closePath(); ctx.stroke(); ctx.restore(); }
    const vignette = ctx.createRadialGradient(440, 325, 220, 440, 325, 620); vignette.addColorStop(0, '#f7e7a900'); vignette.addColorStop(1, '#345e3624'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, 900, 680);
  }

  draw(time) {
    const ctx = this.ctx, r = this.round, b = r.ball;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.viewportBackground) ctx.drawImage(this.viewportBackground, 0, 0);
    ctx.setTransform(this.dpr || 1, 0, 0, this.dpr || 1, 0, 0); this.applyCamera(ctx);
    if (this.protestLevel >= 2) {
      const chant = (x,y,alpha) => { ctx.save();ctx.translate(x,y);ctx.rotate(-this.camera.rotation);ctx.globalAlpha=alpha;ctx.font='9px Georgia';ctx.textAlign='center';ctx.fillStyle='#385140';ctx.fillText('JONES.',0,0);ctx.restore(); };
      const alpha = this.reduceMotion ? .68 : .5 + Math.sin(time / 2600) * .18;
      chant(569,598,alpha);
      if (this.protestLevel === 3) { chant(375,606,alpha*.8);chant(747,601,alpha*.8); }
    }
    for (const f of this.course.flags) {
      const done = r.holes[f.id] !== null;
      oval(ctx, f.x + 12, f.y + 4, 16, 2, '#37542c30', .22);
      oval(ctx, f.x, f.y, 6, 4, '#476345'); oval(ctx, f.x, f.y - .5, 4, 2.7, '#263e31');
      ctx.save();ctx.translate(f.x,f.y);ctx.rotate(-this.camera.rotation);
      if (done) { ctx.strokeStyle = '#f3eed6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4,-13); ctx.lineTo(-1,-10); ctx.lineTo(5,-17); ctx.stroke();ctx.restore();continue; }
      ctx.strokeStyle = '#f9f2d7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0,-1); ctx.lineTo(0,-40); ctx.stroke();
      const wave = this.reduceMotion ? 0 : Math.sin(time / 850 + f.id) * 1.6;
      ctx.fillStyle = this.finale ? '#685061' : '#b8654b'; ctx.beginPath(); ctx.moveTo(1,-40); ctx.quadraticCurveTo(10,-42+wave,22,-34); ctx.lineTo(1,-27); ctx.closePath(); ctx.fill();
      ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#fff8df'; ctx.textAlign = 'center'; ctx.fillText(String(f.id + 1),8,-31);ctx.restore();
    }
    if (!r.moving && !r.finished) {
      const range = rangeForPower(r.power, r.club), maxPreview = this.options.assisted ? range : Math.min(range, 115);
      ctx.save(); ctx.strokeStyle = '#fff8e0a8'; ctx.lineWidth = 1.6; ctx.setLineDash([3, 7]); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(r.angle) * maxPreview, b.y + Math.sin(r.angle) * maxPreview); ctx.stroke(); ctx.setLineDash([]);
      if (this.options.assisted) { const x = b.x + Math.cos(r.angle) * range, y = b.y + Math.sin(r.angle) * range; ctx.strokeStyle = '#fff9dfae'; ctx.beginPath(); ctx.ellipse(x, y, 10, 7, 0, 0, Math.PI * 2); ctx.stroke(); }
      if (this.drag) { const x = b.x - Math.cos(r.angle) * r.power * 1.5, y = b.y - Math.sin(r.angle) * r.power * 1.5; ctx.strokeStyle = '#fff4d8aa'; ctx.lineWidth = 2.8; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(x, y); ctx.stroke(); oval(ctx, x, y, 6, 6, '#f4d28a'); }
      ctx.restore();
      const pulse = this.reduceMotion ? 0 : Math.sin(time / 400) * 2;
      ctx.strokeStyle = '#fff9dd72'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(b.x, b.y, 14 + pulse, 11 + pulse, 0, 0, Math.PI * 2); ctx.stroke();
    }
    if (r.moving && !this.reduceMotion) { this.trail.forEach((p, i) => oval(ctx, p.x, p.y, 1.5 + i / 15, 1 + i / 18, `rgba(255,248,223,${i / this.trail.length * .4})`)); }
    if (!r.finished) {
      const height = b.airTotal > 0 ? Math.sin(Math.PI * b.air / b.airTotal) * (18 + r.power * .4) : 0;
      oval(ctx, b.x + 3 + height * .13, b.y + 3, 5 + height * .035, 3 + height * .015, '#1b423a60');
      const liftX = -Math.sin(this.camera.rotation) * height, liftY = -Math.cos(this.camera.rotation) * height;
      const ballX = b.x + liftX, ballY = b.y + liftY, radius = Math.max(4.8, 3.5 / this.camera.scale);
      const glow = ctx.createRadialGradient(ballX - 1, ballY - 2, .3, ballX, ballY, radius); glow.addColorStop(0, '#fffef5'); glow.addColorStop(1, '#dedfca'); oval(ctx, ballX, ballY, radius, radius, glow);
      oval(ctx, ballX - 1.1, ballY - 1.5, 1.4, 1.1, '#fff');
    }
  }
}
