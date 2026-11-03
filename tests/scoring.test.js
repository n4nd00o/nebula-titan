import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeResults, formatTime, SCORE_RULES } from '../src/systems/Scoring.js';

test('vitória perfeita e rápida recebe rank S e todos os bônus', () => {
  const r = computeResults({ score: 10000, time: 200, damageTaken: 0, shots: 100, hits: 80 });
  assert.equal(r.rank, 'S');
  assert.equal(r.noDamageBonus, SCORE_RULES.noDamageBonus);
  assert.equal(r.timeBonus, (SCORE_RULES.parTime - 200) * SCORE_RULES.timeBonusPerSecond);
  assert.equal(r.accuracyBonus, 8000);
  assert.equal(r.total, 10000 + r.timeBonus + r.noDamageBonus + r.accuracyBonus);
});

test('ranks por dano sofrido', () => {
  const base = { score: 0, time: 400, shots: 10, hits: 5 };
  assert.equal(computeResults({ ...base, damageTaken: 0 }).rank, 'A', 'sem dano, mas lento');
  assert.equal(computeResults({ ...base, damageTaken: 1 }).rank, 'A');
  assert.equal(computeResults({ ...base, damageTaken: 3 }).rank, 'B');
  assert.equal(computeResults({ ...base, damageTaken: 5 }).rank, 'C');
});

test('sem tiros não divide por zero e tempo acima do par não dá bônus negativo', () => {
  const r = computeResults({ score: 0, time: 999, damageTaken: 2, shots: 0, hits: 0 });
  assert.equal(r.accuracy, 0);
  assert.equal(r.timeBonus, 0);
});

test('formatTime', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(75.9), '01:15');
});
