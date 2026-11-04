/**
 * Raios reutilizáveis do Mundo 5 (v1.5).
 *
 *  - PONTEIROS: dois raios que giram a partir do centro do chefe, como os
 *    ponteiros de um relógio (Cronos e Ômega). Começam com um AVISO (giram
 *    devagar e não machucam) e depois viram letais.
 *  - CANHÃO DE RAIO: mira no jogador, avisa com uma linha piscando, dispara
 *    um raio letal curto e descansa (Artilheiro e Ômega).
 *
 * O estado fica em boss.vars; a colisão é feita pela cena via def.segments().
 */
import { clamp } from '../utils/math.js';
import { aimAtPlayer } from './patterns.js';
import { drawBeamWarning, drawLethalBeam } from './beams.js';

// ------------------------------------------------------------ ponteiros
export function resetHands(boss) {
  boss.vars.hands = { t: 0, angles: [Math.PI / 2 - 0.9, Math.PI / 2 + 0.9] };
}

/** Gira os ponteiros. `speeds` em rad/s (sinais opostos = giram em sentidos contrários). */
export function updateHands(boss, dt, speeds, warn = 1.5) {
  const h = (boss.vars.hands ??= { t: 0, angles: [Math.PI / 2 - 0.9, Math.PI / 2 + 0.9] });
  h.t += dt;
  const k = h.t < warn ? 0.25 : 1;
  h.angles = h.angles.map((a, i) => a + speeds[i] * dt * k);
}

export function handSegments(boss, lengths, width = 10, warn = 1.5) {
  const h = boss.vars.hands;
  if (!h || h.t < warn) return [];
  return h.angles.map((a, i) => ({
    x1: boss.x, y1: boss.y, x2: boss.x + Math.cos(a) * lengths[i], y2: boss.y + Math.sin(a) * lengths[i], width,
  }));
}

export function drawHands(ctx, boss, lengths, width = 10, warn = 1.5, colors = ['rgba(255, 205, 117, 0.35)', 'rgba(255, 205, 117, 0.9)']) {
  const h = boss.vars.hands;
  if (!h || boss.state !== 'fight') return;
  h.angles.forEach((a, i) => {
    const x2 = boss.x + Math.cos(a) * lengths[i];
    const y2 = boss.y + Math.sin(a) * lengths[i];
    if (h.t < warn) drawBeamWarning(ctx, boss.x, boss.y, x2, y2, h.t, 'rgba(255, 205, 117, 0.85)');
    else drawLethalBeam(ctx, { x1: boss.x, y1: boss.y, x2, y2, width }, colors);
  });
}

// ------------------------------------------------------------ canhões de raio
export const CANNON_BEAM = Object.freeze({ charge: 1.0, fire: 0.55, rest: 1.6, width: 14, length: 760 });

/**
 * Atualiza um canhão de raio (estado em boss.vars[key]).
 * @param {{x:number,y:number}|null} origin boca do canhão (null = canhão destruído)
 */
export function updateCannonBeam(boss, key, origin, dt, opts = {}) {
  if (!origin) {
    delete boss.vars[key];
    return;
  }
  const cfg = { ...CANNON_BEAM, ...opts };
  const s = (boss.vars[key] ??= { stage: 'rest', t: -(opts.delay ?? 0), angle: Math.PI / 2 });
  s.t += dt;
  s.x = origin.x;
  s.y = origin.y;
  const w = boss.world;
  if (s.stage === 'rest' && s.t >= cfg.rest) {
    s.stage = 'charge';
    s.t = 0;
    s.angle = clamp(aimAtPlayer(w, origin.x, origin.y) + (opts.offset ?? 0), 0.2, Math.PI - 0.2);
    w.audio.play('laserCharge');
  } else if (s.stage === 'charge' && s.t >= cfg.charge) {
    s.stage = 'fire';
    s.t = 0;
    w.audio.play('laserFire');
    w.shake(3, cfg.fire);
  } else if (s.stage === 'fire' && s.t >= cfg.fire) {
    s.stage = 'rest';
    s.t = 0;
  }
}

export function cannonSegment(s, opts = {}) {
  if (!s || s.stage !== 'fire') return null;
  const { length, width } = { ...CANNON_BEAM, ...opts };
  return { x1: s.x, y1: s.y, x2: s.x + Math.cos(s.angle) * length, y2: s.y + Math.sin(s.angle) * length, width };
}

export function drawCannonBeam(ctx, s, colors, opts = {}) {
  if (!s || s.stage === 'rest') return;
  const { length, width } = { ...CANNON_BEAM, ...opts };
  const x2 = s.x + Math.cos(s.angle) * length;
  const y2 = s.y + Math.sin(s.angle) * length;
  if (s.stage === 'charge') drawBeamWarning(ctx, s.x, s.y, x2, y2, s.t, 'rgba(167, 240, 112, 0.85)');
  else drawLethalBeam(ctx, { x1: s.x, y1: s.y, x2, y2, width }, colors);
}

/** Chuva de brasas que cai do topo da tela (Fênix e Ômega). */
export function emberRain(world, count, speed, style) {
  for (let i = 0; i < count; i++) {
    const x = 10 + Math.random() * 460;
    world.spawnEnemyBullet({ x, y: -8, vx: (Math.random() - 0.5) * 40, vy: speed * (0.8 + Math.random() * 0.4), ...style });
  }
}
