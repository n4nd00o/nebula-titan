import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aabbOverlap, circleOverlap, circleRectOverlap, pointSegmentDistance } from '../src/systems/Collision.js';

test('aabbOverlap detecta sobreposição e separação', () => {
  const a = { x: 0, y: 0, w: 10, h: 10 };
  assert.ok(aabbOverlap(a, { x: 5, y: 5, w: 10, h: 10 }));
  assert.ok(!aabbOverlap(a, { x: 10, y: 0, w: 5, h: 5 }), 'bordas encostando não contam');
  assert.ok(!aabbOverlap(a, { x: 20, y: 20, w: 5, h: 5 }));
});

test('circleOverlap', () => {
  assert.ok(circleOverlap(0, 0, 5, 8, 0, 4));
  assert.ok(!circleOverlap(0, 0, 5, 10, 0, 4));
});

test('circleRectOverlap considera o ponto mais próximo do retângulo', () => {
  const rect = { x: 0, y: 0, w: 10, h: 10 };
  assert.ok(circleRectOverlap(5, 5, 1, rect), 'centro dentro');
  assert.ok(circleRectOverlap(12, 5, 3, rect), 'encosta na lateral');
  assert.ok(!circleRectOverlap(13, 13, 3, rect), 'perto do canto, mas fora');
});

test('pointSegmentDistance', () => {
  assert.equal(pointSegmentDistance(5, 3, 0, 0, 10, 0), 3);
  assert.equal(pointSegmentDistance(-4, 3, 0, 0, 10, 0), 5, 'antes do início do segmento');
  assert.equal(pointSegmentDistance(2, 2, 2, 2, 2, 2), 0, 'segmento degenerado');
});
