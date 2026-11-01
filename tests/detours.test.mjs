import test from 'node:test';
import assert from 'node:assert/strict';
import { DESTINATIONS } from '../docs/alabama.js';
import { DETOURS, detourById } from '../docs/detours.js';

test('every local recommendation leads to a named, sourced place to explore', () => {
  const lore = DESTINATIONS.flatMap(destination => destination.lore);
  assert.equal(DETOURS.length, 33);
  assert.deepEqual(new Set(DETOURS.map(d => d.id)), new Set(lore.map(n => n.id)));
  for (const destination of DESTINATIONS) for (const note of destination.lore) {
    const detour = detourById(note.id);
    assert.ok(detour.place.length > 3);
    assert.equal(detour.destinationIndex, destination.index);
    assert.equal(detour.url, note.url);
    assert.equal(detour.sourceTitle, note.sourceTitle);
    assert.ok(typeof detour.invitation === 'string');
    assert.ok(detour.invitation.split(/\s+/).length <= 25, note.id);
  }
  assert.equal(detourById('not-a-place'), null);
});

test('each excursion has brief inspections and one distinct physical discovery', () => {
  const themes = new Set(['monument', 'ballpark', 'industrial', 'trail', 'garden', 'tower', 'fountain', 'house', 'crater', 'theatre', 'oak', 'depot', 'rocket', 'bridge', 'studio', 'cabin', 'mural', 'bay', 'boulders', 'birds']);
  const ids = new Set(), finds = new Set();
  for (const detour of DETOURS) {
    assert.ok(themes.has(detour.theme), detour.id);
    assert.equal(detour.spots.length, 3);
    assert.equal(detour.spots.filter(s => s.collectible).length, 1);
    for (const spot of detour.spots) {
      assert.ok(!ids.has(spot.id), spot.id); ids.add(spot.id);
      assert.ok(spot.label.length <= 35, spot.id);
      assert.ok(spot.title && spot.text);
      assert.ok(spot.text.split(/\s+/).length <= 45, `${spot.id} should reward looking without a long passage`);
      assert.ok(Number.isFinite(spot.x) && Math.abs(spot.x) <= 95);
      assert.ok(Number.isFinite(spot.z) && Math.abs(spot.z) <= 95);
      if (spot.collectible) { assert.ok(!finds.has(spot.title)); finds.add(spot.title); }
    }
  }
  assert.equal(finds.size, 33);
});

test('the opening Birmingham excursions remain an ordinary holiday', () => {
  for (const detour of DETOURS.filter(d => d.destinationIndex === 0)) {
    const text = JSON.stringify(detour).toLowerCase();
    assert.doesNotMatch(text, /invoice|cabal|eldritch|ancient one|artificial turf|protest|robert trent jones/);
  }
});

test('discovered leads reach another real excursion without creating a compulsory loop', () => {
  const linked = DETOURS.filter(d => d.leadsTo);
  assert.equal(linked.length, 6);
  for (const detour of linked) {
    assert.ok(detourById(detour.leadsTo), detour.id);
    assert.notEqual(detour.leadsTo, detour.id);
    const seen = new Set([detour.id]);
    let next = detour;
    while (next.leadsTo) {
      assert.ok(!seen.has(next.leadsTo), 'leads must not send the player around a loop');
      seen.add(next.leadsTo);
      next = detourById(next.leadsTo);
    }
  }
  assert.equal(detourById('oxmoor-vulcan').leadsTo, 'oxmoor-sloss');
  assert.equal(detourById('oxmoor-sloss').leadsTo, 'ross-bridge');
});
