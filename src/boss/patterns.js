/**
 * Padrões de tiro reutilizáveis ("bullet patterns").
 * As fases do chefe combinam estes blocos para criar ataques variados.
 */
import { TAU } from '../utils/math.js';

/** Leque de `count` tiros centralizado em `angle`, abrindo `spread` radianos. */
export function fireSpread(world, x, y, angle, count, spread, speed, style = {}) {
  for (let i = 0; i < count; i++) {
    const a = count === 1 ? angle : angle - spread / 2 + (spread * i) / (count - 1);
    world.spawnEnemyBullet({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, ...style });
  }
}

/** Anel de `count` tiros em todas as direções. */
export function fireRing(world, x, y, count, speed, offset = 0, style = {}) {
  for (let i = 0; i < count; i++) {
    const a = offset + (i * TAU) / count;
    world.spawnEnemyBullet({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, ...style });
  }
}

/** Ângulo de (x, y) até o jogador. */
export function aimAtPlayer(world, x, y) {
  const p = world.player;
  return Math.atan2(p.y - y, p.x - x);
}

/**
 * Temporizador declarativo: retorna true a cada `interval` segundos.
 * O estado fica em boss.timers[key], que é zerado a cada nova fase.
 */
export function every(boss, key, interval, dt, firstDelay = interval) {
  const timers = boss.timers;
  if (timers[key] === undefined) timers[key] = firstDelay;
  timers[key] -= dt;
  if (timers[key] <= 0) {
    timers[key] += interval;
    if (timers[key] <= 0) timers[key] = interval;
    return true;
  }
  return false;
}
