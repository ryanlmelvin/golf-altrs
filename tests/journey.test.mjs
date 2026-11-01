import test from 'node:test';
import assert from 'node:assert/strict';
import { OUTINGS, JOURNEY_EVIDENCE as EVIDENCE, JOURNEY_DEDUCTIONS as DEDUCTIONS } from '../docs/journey.js';

test('24 uniquely identified outings span six main locations', () => {
  assert.equal(OUTINGS.length, 24); assert.equal(new Set(OUTINGS.map(o => o.id)).size, OUTINGS.length);
  assert.equal(new Set(OUTINGS.map(o => o.variant)).size, OUTINGS.length);
  assert.deepEqual([...new Set(OUTINGS.map(o => o.location))].sort(), [0, 1, 2, 3, 4, 5]);
  for (const o of OUTINGS) {
    assert.match(o.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/); assert.ok(Number.isInteger(o.variant) && o.variant >= 0);
    assert.ok(['holiday', 'social', 'wager', 'finale'].includes(o.kind)); if (o.target) assert.ok(Number.isInteger(o.target) && o.target > 5);
    const choices = o.person?.choices || []; assert.equal(new Set(choices.map(c => c.id)).size, choices.length);
  }
});
test('three normal outings precede the first incidental paper on a later course', () => {
  for (const o of OUTINGS.slice(0, 3)) {
    assert.equal(o.find, undefined); assert.equal(o.reward, undefined); assert.equal(o.requiresDeduction, undefined);
    assert.ok((o.person?.choices || []).every(c => !c.evidence));
    assert.doesNotMatch(JSON.stringify(o), /eldritch|cabal|conspiracy|military|invoice|disappear|ancient|ritual|haunt/i);
  }
  const first = OUTINGS.find(o => o.find); assert.ok(OUTINGS.indexOf(first) >= 3); assert.notEqual(first.location, OUTINGS[0].location);
  assert.equal(first.find.clue, 'brass-sign'); assert.ok(first.find.afterFlags > 0 && first.find.afterFlags < 5);
});
test('the first notebook note remains an ordinary invoice on first reading', () => {
  const note = EVIDENCE[0];
  assert.equal(note.id, 'brass-sign');
  assert.equal(note.title, 'A folded invoice');
  assert.match(note.body, /Artificial turf/);
  assert.match(note.body, /Why so much/);
  assert.doesNotMatch(note.body, /1,108,108|cabal|eldritch|ritual|alarming|conspiracy/i);
  assert.match(note.detail, /routine supplier invoice/i);
});
test('every clue reference resolves and every evidence item has an acquisition path', () => {
  const ids = EVIDENCE.map(e => e.id); assert.equal(new Set(ids).size, ids.length); const awarded = new Set();
  for (const o of OUTINGS) {
    if (o.find) { assert.ok(Number.isInteger(o.find.afterFlags) && o.find.afterFlags >= 1 && o.find.afterFlags <= 5); assert.ok(o.find.text && o.find.glimpse); }
    for (const id of [o.find?.clue, o.reward, ...(o.person?.choices || []).map(c => c.evidence)].filter(Boolean)) {
      assert.ok(ids.includes(id), `${o.id} references ${id}`); awarded.add(id);
    }
  }
  assert.deepEqual(awarded, new Set(ids));
});
test('all deductions are solvable from finds and wins before the finale', () => {
  assert.equal(DEDUCTIONS.length, 3); assert.equal(new Set(DEDUCTIONS.map(d => d.id)).size, DEDUCTIONS.length);
  const guaranteed = new Set(); let finaleCount = 0;
  for (const o of OUTINGS) {
    if (o.requiresDeduction) {
      const d = DEDUCTIONS.find(d => d.id === o.requiresDeduction); assert.ok(d);
      assert.ok(d.required.every(id => guaranteed.has(id)), `${o.id} cannot gate the evidence needed to unlock itself`);
    }
    if (o.kind === 'finale') {
      finaleCount++; for (const d of DEDUCTIONS) assert.ok(d.required.every(id => guaranteed.has(id)), `${d.id} is solvable before the final match`);
      assert.equal(o, OUTINGS.at(-1)); assert.equal(o.target, 18); assert.equal(o.person.name, 'Robert Trent Jones');
    }
    if (o.find) guaranteed.add(o.find.clue); if (o.reward) guaranteed.add(o.reward);
  }
  assert.equal(finaleCount, 1);
  for (const d of DEDUCTIONS) {
    assert.ok(d.required.length >= 2); assert.ok(d.required.every(id => EVIDENCE.some(e => e.id === id)));
    assert.equal(d.options.filter(o => o.id === d.answer).length, 1); assert.equal(new Set(d.options.map(o => o.id)).size, d.options.length);
  }
});
