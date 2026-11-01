import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraForViewport, worldToScreen, screenToWorld, ballTouchRadius, GolfGame, createCourse, makeRound, restoreRound, launchShot, stepRound, terrainAt } from '../docs/golf.js';

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


test('the entire course fits portrait, landscape, and short screens without distortion', () => {
  for (const [width,height] of [[390,844],[320,568],[844,390],[1024,768],[1800,360]]) {
    const camera=cameraForViewport(width,height);
    for(const corner of [{x:0,y:0},{x:900,y:0},{x:0,y:680},{x:900,y:680}]) {
      const p=worldToScreen(corner,camera);
      assert.ok(p.x>=0 && p.x<=width && p.y>=0 && p.y<=height, `${width}×${height} keeps the whole course`);
    }
    const origin=worldToScreen({x:450,y:340},camera);
    const horizontal=worldToScreen({x:550,y:340},camera);
    const vertical=worldToScreen({x:450,y:440},camera);
    assert.ok(Math.abs(Math.hypot(horizontal.x-origin.x,horizontal.y-origin.y)-Math.hypot(vertical.x-origin.x,vertical.y-origin.y))<1e-8,'circles and distances retain their proportions');
    for(let i=0;i<6;i++)for(const point of [createCourse(i).start,...createCourse(i).flags]) {
      const screen=worldToScreen(point,camera), restored=screenToWorld(screen,camera);
      assert.ok(Math.abs(restored.x-point.x)<1e-8 && Math.abs(restored.y-point.y)<1e-8, 'touch lands at the rendered lie');
    }
    assert.ok(ballTouchRadius(camera)*camera.scale*2 >= 44, 'ball touch target is at least 44 CSS pixels');
  }
});

test('orientation changes preserve the saved lie and dragging beyond the screen', () => {
  const round=makeRound(2,3), before=JSON.stringify(round);
  const camera=cameraForViewport(390,844), rotated=cameraForViewport(844,390);
  const lie=round.ball, p=worldToScreen(lie,camera), p2=worldToScreen(lie,rotated);
  assert.notEqual(p.x,p2.x);
  const capture={x:-80,y:880}, world=screenToWorld(capture,camera), screen=worldToScreen(world,camera);
  assert.ok(Math.abs(screen.x-capture.x)<1e-8 && Math.abs(screen.y-capture.y)<1e-8,'captured drags stay accurate outside the canvas');
  assert.equal(JSON.stringify(round),before,'turning the phone cannot change physics or saved position');
});
