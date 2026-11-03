import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clamp, lerp, approach, rotatePoint, angleDiff, mulberry32, hashString, removeDead } from '../src/utils/math.js';

test('clamp limita valores ao intervalo', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-1, 0, 10), 0);
  assert.equal(clamp(11, 0, 10), 10);
});

test('lerp interpola linearmente', () => {
  assert.equal(lerp(0, 10, 0.5), 5);
  assert.equal(lerp(10, 20, 0), 10);
  assert.equal(lerp(10, 20, 1), 20);
});

test('approach não ultrapassa o alvo', () => {
  assert.equal(approach(0, 10, 3), 3);
  assert.equal(approach(9, 10, 3), 10);
  assert.equal(approach(10, 0, 4), 6);
});

test('rotatePoint gira 90 graus corretamente', () => {
  const p = rotatePoint(1, 0, Math.PI / 2);
  assert.ok(Math.abs(p.x) < 1e-9);
  assert.ok(Math.abs(p.y - 1) < 1e-9);
});

test('angleDiff retorna o menor caminho', () => {
  assert.ok(Math.abs(angleDiff(0.1, -0.1) + 0.2) < 1e-9);
  assert.ok(Math.abs(angleDiff(Math.PI - 0.1, -Math.PI + 0.1) - 0.2) < 1e-9);
});

test('mulberry32 é determinístico', () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
  const v = mulberry32(hashString('hull'))();
  assert.ok(v >= 0 && v < 1);
});

test('removeDead compacta o array no lugar', () => {
  const list = [{ dead: false, id: 1 }, { dead: true, id: 2 }, { dead: false, id: 3 }];
  const ref = list;
  removeDead(list);
  assert.equal(list, ref);
  assert.deepEqual(list.map((i) => i.id), [1, 3]);
});
