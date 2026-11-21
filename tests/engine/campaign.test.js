import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN, NOTES, SECRETS } from '../../games/frekuensi-0317/src/content.js';

test('Campaign has five chapters with a 125-minute design target', () => {
  assert.equal(CAMPAIGN.length, 5);
  assert.equal(CAMPAIGN.reduce((sum, chapter) => sum + chapter.targetMinutes, 0), 125);
  assert.deepEqual(CAMPAIGN.map(chapter => chapter.id), [1, 2, 3, 4, 5]);
});

test('Story documents and hidden fragments have stable unique identifiers', () => {
  assert.equal(NOTES.length, 20);
  assert.equal(SECRETS.length, 5);
  assert.equal(new Set(NOTES.map(note => note.id)).size, NOTES.length);
  assert.equal(new Set(SECRETS.map(secret => secret.id)).size, SECRETS.length);
  assert.ok(NOTES.every(note => note.body.length > 30));
});
