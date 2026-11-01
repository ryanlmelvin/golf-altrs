import test from 'node:test';
import assert from 'node:assert/strict';
import { GolfGame, createCourse, makeRound, restoreRound, launchShot, stepRound, terrainAt } from '../docs/golf.js';

function settle(round, course) { let event; for (let i = 0; i < 1500 && round.moving; i++) event = stepRound(round, course) || event; assert.equal(round.moving, false, 'shots must settle'); return event; }

test('all 24 outings have five reachable dry flags and a dry tee', () => {
  for (let variant = 0; variant < 4; variant++) for (let i = 0; i < 6; i++) { const c = createCourse(i, variant); assert.equal(c.flags.length, 5); assert.notEqual(terrainAt(c.start, c), 'water'); c.flags.forEach(f => assert.equal(terrainAt(f, c), 'green')); }
});
test('shots count once, cannot be launched in flight, and eventually settle', () => {
  const c = createCourse(), r = makeRound(); assert.equal(launchShot(r, -1, 30), true); assert.equal(launchShot(r), false); settle(r, c); assert.equal(r.strokes, 1); assert.equal(r.ball.vx, 0);
});
test('water costs a penalty and restores the last safe lie', () => {
  const c = createCourse(), r = makeRound(); r.ball.x = c.water[0].x; r.ball.y = c.water[0].y; r.safe = { x: 140, y: 550 }; r.ball.vx = 1; r.moving = true; r.strokes = 1; const e = stepRound(r, c); assert.equal(e.type, 'water'); assert.equal(r.strokes, 2); assert.equal(r.ball.x, 140); assert.equal(r.moving, false);
});
test('airborne chips carry water until landing', () => {
  const c = createCourse(), r = makeRound(); r.ball = { x: c.water[0].x, y: c.water[0].y, vx: 1, vy: 0, air: 10, airTotal: 20 }; r.moving = true; r.strokes = 1; assert.equal(stepRound(r, c), null); assert.equal(r.strokes, 1); assert.equal(r.ball.air, 9);
});
test('slow approaches sink once and fast passes do not', () => {
  const c = createCourse(), r = makeRound(); const f = c.flags[0]; Object.assign(r.ball, { x: f.x - 8, y: f.y, vx: 1, vy: 0 }); r.moving = true; r.strokes = 1; assert.equal(stepRound(r, c).type, 'hole'); assert.equal(r.holes[0], 1); assert.equal(r.finished, false);
  const fast = makeRound(); Object.assign(fast.ball, { x: f.x - 8, y: f.y, vx: 9, vy: 0 }); fast.moving = true; fast.strokes = 1; assert.equal(stepRound(fast, c), null); assert.equal(fast.holes[0], null);
});
test('five flags in any order finish the round with a full scorecard', () => {
  const c = createCourse(), r = makeRound(); for (const id of [3, 1, 4, 0, 2]) { const f = c.flags[id]; Object.assign(r.ball, { x: f.x - 7, y: f.y, vx: 1, vy: 0, air: 0 }); r.moving = true; r.strokes++; stepRound(r, c); } assert.equal(r.finished, true); assert.deepEqual(r.holes, [1, 1, 1, 1, 1]); assert.equal(launchShot(r), false);
});
test('a snapshot resumed mid-flight produces the same exact result', () => {
  const c = createCourse(2), a = makeRound(2); launchShot(a, -1.4, 64); for (let i = 0; i < 20; i++) stepRound(a, c); const b = restoreRound(JSON.parse(JSON.stringify(a)), 2); settle(a, c); settle(b, c); assert.deepEqual(b, a);
});
test('foreign and malformed saves cannot corrupt a round', () => {
  assert.deepEqual(restoreRound({ version: 999 }, 3), makeRound(3)); assert.deepEqual(restoreRound(makeRound(2), 3), makeRound(3)); const r = makeRound(); r.ball.x = NaN; r.ball.vx = Infinity; r.power = -100; const restored = restoreRound(r); assert.ok(Number.isFinite(restored.ball.x)); assert.equal(restored.ball.vx, 0); assert.equal(restored.power, 8);
});

test('all 24 outings can be beaten through ordinary shots with coarse aim and power', () => {
  // Search legal shots, without inserting balls into cups or overriding terrain.
  // Coarse controls also protect against courses requiring pixel-perfect inputs.
  for (let variant = 0; variant < 4; variant++) for (let index = 0; index < 6; index++) {
    const course = createCourse(index, variant);
    let round = makeRound(index, variant);
    for (let shot = 0; shot < 18 && !round.finished; shot++) {
      let best;
      const unsunk = course.flags.filter(f => round.holes[f.id] === null);
      for (const flag of unsunk) {
        const step = Math.PI / 18;
        const angle = Math.round(Math.atan2(flag.y - round.ball.y, flag.x - round.ball.x) / step) * step;
        for (const club of ['wedge', 'putter']) {
          for (let power = 10; power <= 100; power += 10) {
            const candidate = structuredClone(round);
            candidate.club = club;
            launchShot(candidate, angle, power);
            settle(candidate, course);
            const remaining = course.flags.filter(f => candidate.holes[f.id] === null);
            const nearest = remaining.length ? Math.min(...remaining.map(f => Math.hypot(f.x - candidate.ball.x, f.y - candidate.ball.y))) : 0;
            const sunk = unsunk.length - remaining.length;
            const penalty = candidate.strokes - round.strokes - 1;
            const quality = sunk * 10000 - penalty * 3000 - nearest;
            if (!best || quality > best.quality) best = { quality, round: candidate };
          }
        }
      }
      round = best.round;
    }
    assert.equal(round.finished, true, `course ${index}, variant ${variant} must be completable`);
    assert.ok(round.strokes < (index === 5 ? 18 : 23), `course ${index}, variant ${variant} must have a winning route, got ${round.strokes} strokes`);
  }
});

test('variants mirror the whole layout and saves stay with their own outing', () => {
  const base = createCourse(2), mirror = createCourse(2, 3);
  assert.equal(mirror.start.x, 900 - base.start.x);
  assert.equal(mirror.start.y, 680 - base.start.y);
  assert.equal(mirror.water[0].x, 900 - base.water[0].x);
  assert.equal(mirror.trees[0].y, 680 - base.trees[0].y);
  const r = makeRound(2, 3); launchShot(r, r.angle, 50); stepRound(r, mirror);
  assert.deepEqual(restoreRound(structuredClone(r), 2, 3), r);
  assert.deepEqual(restoreRound(r, 2, 0), makeRound(2, 0));
  const legacy = makeRound(2); delete legacy.variant;
  assert.deepEqual(restoreRound(legacy, 2), makeRound(2));
});

test('a findable appears after enough flags, survives a reload, and can only be collected once', () => {
  const g = Object.create(GolfGame.prototype);
  g.round = makeRound(); g.findable = { id: 'invoice', afterFlags: 2, found: false };
  const found = []; g.options = { onFind: id => found.push(id) }; g.updateUI = () => {};
  assert.equal(g.findableAvailable(), false); g.pickUpFindable(); assert.deepEqual(found, []);
  g.round.strokes = 4; g.round.holes[0] = 2; g.round.holes[3] = 2;
  g.round = restoreRound(structuredClone(g.round));
  assert.equal(g.findableAvailable(), true);
  g.pickUpFindable(); g.pickUpFindable();
  assert.deepEqual(found, ['invoice']); assert.equal(g.findableAvailable(), false);
  g.setFindableFound(false); assert.equal(g.findableAvailable(), true);
  g.setFindableFound(); assert.equal(g.findableAvailable(), false);
});


function interactiveGame() {
  const g = Object.create(GolfGame.prototype);
  g.round = makeRound(); g.options = {}; g.pointers = new Map(); g.gesture = null; g.pinch = null; g.drag = null;
  const captures = new Set();
  g.canvas = { dataset: {}, focus() {}, getBoundingClientRect: () => ({ left: 0, top: 0 }), setPointerCapture: id => captures.add(id), hasPointerCapture: id => captures.has(id), releasePointerCapture: id => captures.delete(id) };
  const actions = { pans: [], zooms: [], swings: 0 };
  // A fixed projection isolates gesture decisions from the WebGL renderer.
  g.scene = { worldToScreen: p => ({ ...p }), screenToWorld: p => ({ ...p }), pan: (x, y) => actions.pans.push([x, y]), zoom: n => actions.zooms.push(n) };
  g.setShotControls = () => {}; g.updateUI = () => {}; g.persist = () => {};
  g.swing = () => { actions.swings++; launchShot(g.round); };
  const event = (id, x, y) => ({ pointerId: id, clientX: x, clientY: y, button: 0, preventDefault() {} });
  return { g, actions, event };
}

test('dragging the course pans without spending a stroke or changing the aim', () => {
  const { g, actions, event } = interactiveGame();
  const before = structuredClone(g.round);
  g.pointerDown(event(1, 400, 300)); g.pointerMove(event(1, 425, 320)); g.pointerUp(event(1, 425, 320));
  assert.deepEqual(actions.pans, [[25, 20]]);
  assert.equal(actions.swings, 0);
  assert.deepEqual(g.round, before);
});

test('pulling back from the ball releases one shot in the opposite direction', () => {
  const { g, actions, event } = interactiveGame();
  const { x, y } = g.round.ball;
  g.pointerDown(event(1, x + 24, y));
  assert.equal(g.gesture.kind, 'shot', 'a touch within 24 CSS pixels selects the ball');
  g.pointerMove(event(1, x - 18, y + 30));
  const shortPullPower = g.round.power;
  g.pointerMove(event(1, x - 36, y + 60));
  assert.ok(g.round.power > shortPullPower, 'pulling farther gives more power');
  g.pointerUp(event(1, x - 36, y + 60));
  g.pointerUp(event(1, x - 36, y + 60));
  assert.equal(actions.swings, 1);
  assert.equal(g.round.strokes, 1);
  assert.equal(g.round.moving, true);
  assert.ok(g.round.ball.vx > 0 && g.round.ball.vy < 0, 'the ball travels opposite the pull');
  assert.ok(Math.abs(g.round.angle - Math.atan2(-60, 36)) < 1e-8);
  assert.equal(actions.pans.length, 0);
});

test('bringing the pull back onto the ball cancels without spending a stroke', () => {
  const { g, actions, event } = interactiveGame();
  const before = structuredClone(g.round), { x, y } = g.round.ball;
  g.pointerDown(event(1, x, y));
  g.pointerMove(event(1, x + 130, y - 90));
  assert.equal(g.drag.cancelled, false);
  g.pointerMove(event(1, x + 8, y - 5));
  assert.equal(g.drag.cancelled, true, 'the landing marker disappears over the ball');
  g.pointerUp(event(1, x + 8, y - 5));
  assert.equal(actions.swings, 0);
  assert.deepEqual(g.round, before, 'cancelling also restores the original aim and power');
});

test('release over the ball cancels even when the last move event was far away', () => {
  const { g, actions, event } = interactiveGame();
  const { x, y } = g.round.ball;
  g.pointerDown(event(1, x, y)); g.pointerMove(event(1, x + 150, y));
  g.pointerUp(event(1, x, y));
  assert.equal(actions.swings, 0); assert.equal(g.round.strokes, 0);
});

test('a second finger turns a pending shot into a pinch without accidentally firing', () => {
  const { g, actions, event } = interactiveGame();
  const { x, y } = g.round.ball;
  g.pointerDown(event(1, x, y)); g.pointerMove(event(1, x - 20, y + 20));
  g.pointerDown(event(2, x + 80, y + 20));
  assert.equal(g.drag, null);
  g.pointerMove(event(2, x + 100, y + 20));
  g.pointerUp(event(2, x + 100, y + 20)); g.pointerUp(event(1, x - 20, y + 20));
  assert.equal(actions.swings, 0);
  assert.equal(g.round.strokes, 0);
  assert.ok(actions.zooms[0] > 1);
});

test('an interrupted touch never fires a stroke', () => {
  const { g, actions, event } = interactiveGame();
  const { x, y } = g.round.ball;
  g.pointerDown(event(1, x, y)); g.pointerMove(event(1, x - 50, y));
  g.pointerCancel(event(1, x - 50, y)); g.pointerUp(event(1, x - 50, y));
  assert.equal(actions.swings, 0); assert.equal(g.pointers.size, 0);
});

// Exercise the actual perspective math without requiring a GPU in the test runner.
// WebGL construction and rendering are covered by the browser play-through.
import * as THREE from '../docs/vendor/three.module.js';
import { GolfScene } from '../docs/scene.js';
function cameraScene(course, round, width, height) {
  const scene = Object.create(GolfScene.prototype);
  Object.assign(scene, {
    course, round, zoomLevel: 1, panned: false,
    renderer: { setSize() {} },
    camera: new THREE.OrthographicCamera(-200, 200, 300, -300, 1, 2400),
    focus: new THREE.Vector3(), desired: new THREE.Vector3(),
    cameraOffset: new THREE.Vector3(-330, 640, 630),
    raycaster: new THREE.Raycaster(), plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    rayPoint: new THREE.Vector3(), scratch: new THREE.Vector3(),
  });
  scene.resize(width, height); scene.recenter(round, true);
  return scene;
}

test('touch projection stays accurate on raised terrain after resizing, panning, and zooming', () => {
  const course = createCourse(2, 3), round = makeRound(2, 3), saved = JSON.stringify(round);
  for (const [width, height] of [[390, 844], [320, 568], [844, 390], [1280, 800]]) {
    const scene = cameraScene(course, round, width, height);
    scene.pan(35, -20); scene.zoom(1.35);
    for (const point of [course.start, ...course.flags, ...course.sand, ...course.water]) {
      const restored = scene.screenToWorld(scene.worldToScreen(point));
      assert.ok(Math.hypot(restored.x - point.x, restored.y - point.y) < .05, `touch must match terrain at ${width}×${height}`);
    }
    assert.equal(JSON.stringify(round), saved, 'looking around cannot move the saved ball');
  }
});

test('the default phone camera frames a shot instead of fitting the whole course', () => {
  for (let index = 0; index < 6; index++) for (let variant = 0; variant < 4; variant++) {
    const course = createCourse(index, variant), round = makeRound(index, variant);
    const scene = cameraScene(course, round, 390, 844);
    const visible = p => { const s = scene.worldToScreen(p); return s.x >= 0 && s.x <= 390 && s.y >= 0 && s.y <= 844; };
    assert.ok(visible(round.ball), 'the current lie is visible');
    assert.ok(course.flags.filter(visible).length < 5, 'the course is explored through the camera');
    scene.pan(100, 100); assert.equal(scene.panned, true);
    scene.recenter(round, true); assert.equal(scene.panned, false);
    assert.ok(visible(round.ball), 'return to ball restores the shot');
  }
});

test('pulling back opposite the opening cup gives a playable shot at phone and desktop zoom levels', () => {
  for (const [width, height, zoom] of [[390, 844, 1], [390, 844, 1.4], [1280, 800, 1]]) {
    const { g, actions, event } = interactiveGame();
    const course = createCourse();
    g.scene = cameraScene(course, g.round, width, height); g.scene.zoom(zoom);
    const lie = g.round.ball, cup = course.flags[0];
    const toCup = Math.hypot(cup.x - lie.x, cup.y - lie.y);
    const pull = g.scene.worldToScreen({ x: lie.x - (cup.x - lie.x) / toCup * 64.5, y: lie.y - (cup.y - lie.y) / toCup * 64.5 });
    const ball = g.scene.worldToScreen(lie);
    g.pointerDown(event(1, ball.x, ball.y)); g.pointerMove(event(1, pull.x, pull.y)); g.pointerUp(event(1, pull.x, pull.y));
    settle(g.round, course);
    assert.equal(actions.swings, 1);
    assert.equal(g.round.holes[0], 1, `pull-back targeting works at ${width}×${height}, zoom ${zoom}`);
  }
});
