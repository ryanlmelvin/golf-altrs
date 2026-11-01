import test from 'node:test';
import assert from 'node:assert/strict';
import { DESTINATIONS, LORE_SOURCES } from '../docs/alabama.js';

// Numeric destinations are persisted in saves; reordering them would move a returning player.
const savedOrder = ['Oxmoor Valley', 'Silver Lakes', 'Capitol Hill', 'Cambrian Ridge', 'Magnolia Grove', 'Grand National', 'Hampton Cove', 'The Shoals', 'Highland Oaks', 'Lakewood Club', 'Ross Bridge'];

test('all eleven saved destinations retain their course, local, and map contracts', () => {
  assert.deepEqual(DESTINATIONS.map(d => d.title), savedOrder);
  for (const [index, destination] of DESTINATIONS.entries()) {
    assert.equal(destination.index, index);
    assert.ok(Number.isInteger(destination.baseCourse) && destination.baseCourse >= 0 && destination.baseCourse <= 5);
    assert.ok(destination.region && destination.local.name && destination.local.role);
    assert.ok(destination.tagline.trim().split(/\s+/).length <= 7, destination.title);
    assert.ok(destination.map.x > 0 && destination.map.x < 470 && destination.map.y > 0 && destination.map.y < 560, destination.title);
  }
});

test('every destination has three brief, uniquely saved, source-linked local stories', () => {
  const stories = DESTINATIONS.flatMap(d => d.lore);
  assert.equal(stories.length, 33);
  assert.equal(new Set(stories.map(s => s.id)).size, 33, 'notebook entries must not overwrite each other');
  for (const destination of DESTINATIONS) {
    assert.equal(destination.lore.length, 3, destination.title);
    for (const story of destination.lore) {
      assert.match(story.id, /^[a-z0-9-]{1,80}$/);
      assert.ok(story.title && story.sourceTitle && story.text.trim());
      assert.ok(story.text.trim().split(/\s+/).length <= 40, `${story.id} should fit a short conversation`);
      const url = new URL(story.url);
      assert.equal(url.protocol, 'https:');
      assert.equal(url.username, '');
      assert.equal(url.password, '');
      assert.ok(url.hostname.includes('.'), story.id);
    }
  }
});

test('the source index preserves every reading link without duplicate entries', () => {
  const stories = DESTINATIONS.flatMap(d => d.lore);
  const wanted = new Set(stories.map(s => s.url));
  assert.equal(LORE_SOURCES.length, wanted.size);
  assert.equal(new Set(LORE_SOURCES.map(s => s.url)).size, LORE_SOURCES.length);
  for (const source of LORE_SOURCES) {
    assert.ok(wanted.has(source.url));
    assert.ok(stories.some(story => story.url === source.url && story.sourceTitle === source.title));
  }
});
