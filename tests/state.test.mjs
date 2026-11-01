import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, unlockedLocations, nextOuting, availableOuting, roundContext, roundOuting, roundFind, startRound, prepareRound, clearRound, collect, respond, solve, finishRound, chooseEnding, validateSave, parseBackup, storageKey, travel, visitDetour, leaveDetour, discoverDetour } from '../docs/state.js';
import { OUTINGS, JOURNEY_EVIDENCE as EVIDENCE, JOURNEY_DEDUCTIONS as DEDUCTIONS } from '../docs/journey.js';
import { makeRound, createCourse, launchShot, stepRound } from '../docs/golf.js';
import { DESTINATIONS } from '../docs/alabama.js';

const scorecard = (strokes = 10) => ({ strokes, holes: [1, 1, 1, 1, strokes - 4], finished: true });
function begin(s, index) {
  assert.equal(travel(s, index), true); clearRound(s, index); startRound(s, index); return roundContext(s, index);
}
function finish(s, index, strokes = 10) {
  const result = scorecard(strokes), meta = roundContext(s, index);
  s.rounds[index] = { ...makeRound(index % 6, meta.variant), ...result, checkpointStroke: strokes };
  return finishRound(s, index, result);
}
function solveReady(s) {
  for (const d of DEDUCTIONS) if (d.required.every(id => s.evidence.includes(id))) assert.equal(solve(s, d.id, d.answer), true);
}
function playMilestone(s, o, { finds = true, dialogue = true, deductions = true } = {}) {
  if (deductions) solveReady(s);
  begin(s, o.location);
  assert.equal(roundOuting(s, o.location)?.id, o.id, `${o.id} must be reachable in order`);
  const paper = roundFind(s, o.location);
  if (finds && paper) assert.equal(collect(s, paper.clue), true);
  if (dialogue) for (const choice of o.person?.choices || []) respond(s, o.location, choice.id);
  assert.equal(finish(s, o.location), true);
  if (deductions) solveReady(s);
}
function campaign(options = {}) {
  const s = newGame(); for (const o of OUTINGS) playMilestone(s, o, options); return s;
}
function beforeOuting(id, options = {}) {
  const s = newGame(); for (const o of OUTINGS) { if (o.id === id) break; playMilestone(s, o, options); } return s;
}

test('the first three outings are an ordinary holiday with no mystery progression', () => {
  const s = newGame(); assert.equal(s.version, 2); assert.deepEqual(unlockedLocations(s), [0]);
  for (const o of OUTINGS.slice(0, 3)) {
    begin(s, o.location); assert.equal(roundFind(s), null);
    for (const c of o.person?.choices || []) respond(s, o.location, c.id);
    assert.equal(finish(s, o.location), true);
    assert.deepEqual(s.evidence, []); assert.deepEqual(s.solved, []); assert.equal(s.chorus, 0); assert.equal(s.ending, null);
  }
  assert.equal(s.totalRounds, 3); assert.equal(nextOuting(s)?.id, OUTINGS[3].id);
});
test('one round opens free travel to all eleven destinations', () => {
  const s = newGame(); assert.equal(travel(s, 10), false); begin(s, 0); finish(s, 0);
  assert.deepEqual(unlockedLocations(s), Array.from({ length: 11 }, (_, i) => i));
  for (let i = 0; i < 11; i++) assert.equal(travel(s, i), true);
  assert.equal(travel(s, 11), false); assert.equal(travel(s, -1), false); assert.equal(s.current, 10);
});
test('the first paper appears on a later course and remains recoverable if missed', () => {
  const o = OUTINGS.find(x => x.find); assert.ok(OUTINGS.indexOf(o) >= 3); assert.notEqual(o.location, OUTINGS[0].location);
  const s = beforeOuting(o.id); begin(s, o.location);
  assert.equal(roundFind(s).clue, o.find.clue); assert.equal(roundFind(s).afterFlags, o.find.afterFlags);
  assert.equal(finish(s, o.location), true);
  assert.ok(!s.evidence.includes(o.find.clue), 'finishing does not pick up the paper'); assert.ok(s.completed.includes(o.id));
  travel(s, 0); travel(s, o.location); clearRound(s, o.location); startRound(s, o.location);
  assert.equal(roundFind(s).clue, o.find.clue); assert.equal(roundFind(s).afterFlags, 0);
  assert.equal(collect(s, o.find.clue), true); assert.equal(collect(s, o.find.clue), false); assert.equal(roundFind(s), null);
});
test('all 24 milestones reach their evidence, deductions, finale, and three endings', () => {
  const s = campaign(); assert.equal(s.totalRounds, 24); assert.deepEqual(s.completed, OUTINGS.map(o => o.id));
  assert.deepEqual(new Set(s.evidence), new Set(EVIDENCE.map(e => e.id))); assert.deepEqual(s.solved, DEDUCTIONS.map(d => d.id));
  assert.equal(nextOuting(s), null); assert.equal(s.finalWin, true); assert.ok(s.trust >= 2);
  for (const ending of ['seal', 'expose', 'accept']) assert.equal(chooseEnding(s, ending), true);
  const restored = parseBackup(JSON.stringify(s));
  assert.deepEqual(restored.completed, s.completed); assert.deepEqual(restored.evidence, s.evidence); assert.deepEqual(restored.solved, s.solved);
  assert.equal(restored.ending, 'accept'); assert.equal(restored.totalRounds, 24);
});
test('the mandatory story finishes without optional dialogue evidence', () => {
  const s = campaign({ dialogue: false }); assert.equal(s.finalWin, true);
  for (const d of DEDUCTIONS) assert.ok(d.required.every(id => s.evidence.includes(id)));
  assert.equal(s.trust, 0); assert.equal(chooseEnding(s, 'expose'), false); assert.equal(chooseEnding(s, 'seal'), true); assert.equal(chooseEnding(s, 'accept'), true);
});
test('wagers need a lower score and retries do not duplicate rewards or rounds', () => {
  const o = OUTINGS.find(x => x.kind === 'wager'), s = beforeOuting(o.id); begin(s, o.location); const before = s.totalRounds;
  assert.equal(finish(s, o.location, o.target), false); assert.equal(s.totalRounds, before + 1);
  assert.ok(!s.completed.includes(o.id)); assert.ok(!s.evidence.includes(o.reward));
  assert.equal(finishRound(s, o.location, scorecard(5)), false); assert.equal(s.totalRounds, before + 1);
  begin(s, o.location); assert.equal(finish(s, o.location, o.target - 1), true);
  assert.equal(s.completed.filter(id => id === o.id).length, 1); assert.equal(s.evidence.filter(id => id === o.reward).length, 1);
});
test('only a started round with a complete consistent five-hole card can settle', () => {
  const s = newGame(); assert.equal(finishRound(s, 0, scorecard()), false); startRound(s, 0);
  for (const result of [null, undefined, true, {}, { ...scorecard(), finished: 'yes' }, { ...scorecard(), finished: false }, { ...scorecard(), strokes: 9 }, { ...scorecard(), strokes: 10.5 }, { ...scorecard(), holes: [1, 1, 1, 7] }, { ...scorecard(), holes: [1, 1, 1, 7, 0] }, { ...scorecard(), holes: [1, 1, 1, 1, null] }, { ...scorecard(), holes: [1, 1, 1, 1, '6'] }]) assert.equal(finishRound(s, 0, result), false);
  assert.equal(finishRound(s, 5, scorecard()), false); assert.equal(s.totalRounds, 0); assert.deepEqual(s.completed, []);
  assert.equal(finishRound(s, 0, scorecard()), true);
});
test('dialogue effects are earned once and imports recompute trust', () => {
  const o = OUTINGS.find(x => x.person?.choices.some(c => c.trust)), s = beforeOuting(o.id); begin(s, o.location);
  const choice = o.person.choices.find(c => c.trust), before = s.trust;
  assert.equal(respond(s, o.location, 'not-a-choice'), null); respond(s, o.location, choice.id); respond(s, o.location, choice.id);
  assert.equal(s.trust, before + choice.trust); assert.equal(validateSave({ ...s, trust: 9999 }).trust, s.trust);
});
test('deductions require evidence and the finale requires every deduction', () => {
  const s = newGame(), d = DEDUCTIONS[0]; assert.equal(solve(s, d.id, d.answer), false);
  d.required.forEach(id => collect(s, id)); assert.equal(solve(s, d.id, 'incorrect'), false);
  assert.equal(solve(s, d.id, d.answer), true); assert.equal(solve(s, d.id, d.answer), true); assert.deepEqual(s.solved, [d.id]);
  const finale = OUTINGS.find(o => o.kind === 'finale'), ready = beforeOuting(finale.id, { deductions: false }); travel(ready, finale.location);
  assert.equal(availableOuting(ready), null); solve(ready, DEDUCTIONS.at(-1).id, DEDUCTIONS.at(-1).answer);
  assert.equal(availableOuting(ready), null); solveReady(ready); assert.equal(availableOuting(ready)?.id, finale.id);
});
test('the chorus grows at the next destination, not on a deduction or reload', () => {
  let s = newGame(); begin(s, 0); finish(s, 0);
  const first = DEDUCTIONS[0]; first.required.forEach(id => collect(s, id)); solve(s, first.id, first.answer); assert.equal(s.chorus, 0);
  s = validateSave(JSON.parse(JSON.stringify(s))); assert.equal(s.chorus, 0); travel(s, 0); assert.equal(s.chorus, 0);
  assert.equal(travel(s, 99), false); assert.equal(s.chorus, 0); travel(s, 4); assert.equal(s.chorus, 1);
  const second = DEDUCTIONS[1]; second.required.forEach(id => collect(s, id)); solve(s, second.id, second.answer); assert.equal(s.chorus, 1);
  s = validateSave(JSON.parse(JSON.stringify(s))); assert.equal(s.chorus, 1); travel(s, 2); assert.equal(s.chorus, 2);
});
test('variants and exact mid-shot motion survive export and import', () => {
  const s = newGame(); for (const o of OUTINGS.slice(0, 3)) playMilestone(s, o);
  const meta = begin(s, 0); assert.equal(meta.variant, 3);
  const round = makeRound(0, meta.variant), course = createCourse(0, meta.variant); launchShot(round, round.angle, 62);
  for (let tick = 0; tick < 20; tick++) stepRound(round, course); assert.equal(round.moving, true);
  s.rounds[0] = round; s.settings = { sound: true, assisted: true };
  const restored = parseBackup(JSON.stringify(s)); assert.deepEqual(restored.rounds[0], round); assert.equal(restored.roundMeta[0].variant, 3);
  assert.equal(restored.roundMeta[0].settled, false); assert.deepEqual(restored.settings, s.settings); assert.equal(restored.totalRounds, 3);
  for (let tick = 0; tick < 1000 && round.moving; tick++) { stepRound(round, course); stepRound(restored.rounds[0], course); }
  assert.deepEqual(restored.rounds[0], round);
  const mismatched = JSON.parse(JSON.stringify(s)); mismatched.rounds[0].variant = 2;
  assert.deepEqual(validateSave(mismatched).rounds[0], makeRound(0, 3));
});
test('ordinary rounds and all destinations remain available after the ending', () => {
  const s = campaign(); chooseEnding(s, 'seal'); const completed = [...s.completed], evidence = [...s.evidence];
  for (let i = 0; i < 22; i++) {
    const index = i % 11, meta = begin(s, index); assert.equal(meta.outingId, null); assert.equal(roundOuting(s, index), null);
    assert.equal(finish(s, index), true); assert.equal(s.ending, 'seal');
  }
  assert.equal(s.totalRounds, 46); assert.equal(nextOuting(s), null); assert.deepEqual(s.completed, completed); assert.deepEqual(s.evidence, evidence);
  assert.equal(unlockedLocations(s).length, 11);
});
test('save validation rejects foreign files and discards invalid fields', () => {
  assert.throws(() => parseBackup('{"version":1}')); assert.throws(() => parseBackup('{"version":99}')); assert.throws(() => parseBackup('x'.repeat(500001)));
  const s = validateSave({ ...newGame(), current: 99, wins: ['0', 99], completed: ['unknown'], evidence: ['unknown'], trust: 100, counts: { 0: -1, 11: 5 }, rounds: { 0: [], 1: { foo: 'bar' } }, ending: 'seal' });
  assert.equal(s.current, 0); assert.equal(s.trust, 0); assert.equal(s.ending, null); assert.equal(s.totalRounds, 0);
  assert.deepEqual(s.wins, []); assert.deepEqual(s.evidence, []); assert.deepEqual(s.rounds, {}); assert.deepEqual(s.completed, []);
  assert.notEqual(storageKey('/golf-altrs/'), storageKey('/debrief-corn-game/')); assert.equal(storageKey('/golf-altrs/index.html'), storageKey('/golf-altrs/'));
});

test('an uncollected final-course souvenir does not restart the resolved case', () => {
  const s=newGame();
  s.completed=OUTINGS.map(o=>o.id);
  s.evidence=EVIDENCE.map(e=>e.id).filter(id=>id!=='architecture');
  s.finalWin=true;
  assert.equal(nextOuting(s),null);
});

test('a new round can be prepared for immediate play without advancing the holiday', () => {
  const s=newGame();
  const meta=prepareRound(s);
  assert.equal(s.started,true);
  assert.equal(meta.outingId,'arrival');
  assert.equal(s.totalRounds,0);
  assert.deepEqual(s.completed,[]);
  assert.equal(s.rounds[0],undefined,'the renderer supplies the initial snapshot');
  s.rounds[0]=makeRound(0,meta.variant);
  const before=JSON.stringify(s);
  prepareRound(s);
  assert.equal(JSON.stringify(s),before,'returning to the same untouched round is idempotent');
});

test('an untouched early visit picks up a newly available outing without moving the ball', () => {
  const s=newGame();
  begin(s,0);finish(s,0);
  travel(s,1);prepareRound(s);
  s.rounds[1]=makeRound(1,roundContext(s).variant);
  s.rounds[1].angle=.37;s.rounds[1].power=42;
  assert.equal(roundOuting(s),null);
  const snapshot=JSON.stringify(s.rounds[1]);
  travel(s,0);
  for(let i=0;i<2;i++){clearRound(s);prepareRound(s);finish(s,0);}
  travel(s,1);
  assert.equal(availableOuting(s).id,'lakeside-morning');
  prepareRound(s);
  assert.equal(roundOuting(s).id,'lakeside-morning');
  assert.equal(JSON.stringify(s.rounds[1]),snapshot);
  assert.equal(s.totalRounds,3);
});

test('preparing an active or completed round preserves the exact imported state', () => {
  const s=newGame();prepareRound(s);
  s.rounds[0]=makeRound(0,0);
  launchShot(s.rounds[0],-.8,50);
  stepRound(s.rounds[0],createCourse(0));
  const resumed=validateSave(JSON.parse(JSON.stringify(s)));
  const movingBefore=JSON.stringify(resumed);
  prepareRound(resumed);
  assert.equal(JSON.stringify(resumed),movingBefore);
  const done=newGame();prepareRound(done);finish(done,0);
  const restored=validateSave(JSON.parse(JSON.stringify(done)));
  const finishedBefore=JSON.stringify(restored);
  prepareRound(restored);
  assert.equal(JSON.stringify(restored),finishedBefore);
  assert.equal(restored.roundMeta[0].settled,true);
  assert.equal(restored.totalRounds,1);
});

test('an untouched recovered clue updates its encounter after the paper is collected', () => {
  const firstFind=OUTINGS.find(o=>o.find),s=beforeOuting(firstFind.id);
  begin(s,firstFind.location);finish(s,firstFind.location);
  clearRound(s);prepareRound(s);s.rounds[s.current]=makeRound(s.current,roundContext(s).variant);
  assert.equal(roundFind(s).afterFlags,0);
  collect(s,firstFind.find.clue);
  const snapshot=JSON.stringify(s.rounds[s.current]);
  prepareRound(s);
  assert.equal(roundContext(s).findId,null);
  assert.equal(roundOuting(s).id,'back-porch');
  assert.equal(JSON.stringify(s.rounds[s.current]),snapshot);
});


test('detours require an unlocked destination and a visit before a discovery', () => {
  const s=newGame(), local=DESTINATIONS[0].lore[0].id, away=DESTINATIONS[1].lore[0].id;
  assert.deepEqual(s.detourFound,[]);assert.equal(s.activeDetour,null);
  assert.equal(discoverDetour(s,local),false);
  assert.equal(visitDetour(s,away),false);
  assert.equal(visitDetour(s,'not-a-place'),false);
  assert.equal(s.activeDetour,null);
  assert.equal(visitDetour(s,local),true);
  assert.equal(s.activeDetour,local);
  assert.deepEqual(s.detourFound,[],'arriving does not collect the find');
  assert.equal(discoverDetour(s,away),false);
  assert.equal(discoverDetour(s,local),true);
  assert.deepEqual(s.detourFound,[local]);assert.deepEqual(s.loreSeen,[local]);
  begin(s,0);finish(s,0);
  assert.equal(visitDetour(s,away),true);
  assert.equal(discoverDetour(s,away),true);
});

test('a detour can be resumed and revisited without duplicating its discovery', () => {
  const s=newGame(), id=DESTINATIONS[0].lore[1].id;
  visitDetour(s,id);
  const arrived=parseBackup(JSON.stringify(s));
  assert.equal(arrived.activeDetour,id);assert.deepEqual(arrived.detourFound,[]);
  assert.equal(discoverDetour(arrived,id),true);
  const found=parseBackup(JSON.stringify(arrived));
  assert.equal(found.activeDetour,id);assert.deepEqual(found.detourFound,[id]);assert.deepEqual(found.loreSeen,[id]);
  assert.equal(discoverDetour(found,id),false);
  assert.equal(leaveDetour(found),true);assert.equal(leaveDetour(found),false);
  assert.equal(found.activeDetour,null);
  assert.equal(discoverDetour(found,id),false);
  assert.equal(visitDetour(found,id),true);assert.equal(discoverDetour(found,id),false);
  assert.deepEqual(found.detourFound,[id]);assert.deepEqual(found.loreSeen,[id]);
});

test('exploring preserves the exact golf save and does not advance the mystery', () => {
  const s=newGame();prepareRound(s);s.rounds[0]=makeRound();
  launchShot(s.rounds[0],-.8,50);stepRound(s.rounds[0],createCourse());
  const before=structuredClone(s);
  const id=DESTINATIONS[0].lore[2].id;
  assert.equal(visitDetour(s,id),true);assert.equal(discoverDetour(s,id),true);leaveDetour(s);
  const {detourFound,loreSeen,...unchanged}=s;
  const {detourFound:oldFinds,loreSeen:oldNotes,...expected}=before;
  assert.deepEqual(unchanged,expected,'a side trip cannot move the ball, spend strokes, or advance the story');
  assert.deepEqual(detourFound,[id]);assert.deepEqual(loreSeen,[id]);
  assert.equal(s.totalRounds,0);assert.deepEqual(s.evidence,[]);assert.deepEqual(s.solved,[]);assert.equal(s.chorus,0);
});

test('detour save validation rejects unknown and locked places without losing legacy notes', () => {
  const local=DESTINATIONS[0].lore[0].id, away=DESTINATIONS[7].lore[0].id;
  const imported=validateSave({...newGame(),totalRounds:100,activeDetour:away,detourFound:[local,local,away,'unknown',99],loreSeen:['legacy-note',away]});
  assert.equal(imported.totalRounds,0,'unlocking is derived from completed round counts');
  assert.equal(imported.activeDetour,null);assert.deepEqual(imported.detourFound,[local]);
  assert.deepEqual(imported.loreSeen,['legacy-note',away,local],'existing notebook entries remain readable');
  for(const activeDetour of ['unknown',{},17]) assert.equal(validateSave({...newGame(),activeDetour}).activeDetour,null);
  const unlocked=validateSave({...newGame(),counts:{0:1},activeDetour:away,detourFound:[away,away]});
  assert.equal(unlocked.activeDetour,away);assert.deepEqual(unlocked.detourFound,[away]);
});

test('old version-two backups gain empty exploration state and retain their read notes', () => {
  const old=newGame(), id=DESTINATIONS[0].lore[0].id;
  delete old.detourFound;delete old.activeDetour;old.loreSeen=[id];
  const restored=parseBackup(JSON.stringify(old));
  assert.equal(restored.version,2);assert.equal(restored.activeDetour,null);assert.deepEqual(restored.detourFound,[]);assert.deepEqual(restored.loreSeen,[id]);
  visitDetour(restored,id);assert.equal(discoverDetour(restored,id),true);
  assert.deepEqual(restored.detourFound,[id]);assert.deepEqual(restored.loreSeen,[id],'finding an already-read note does not duplicate it');
});
