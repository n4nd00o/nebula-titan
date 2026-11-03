/**
 * Mini-chefe SENTINELA — um olho blindado protegido por cápsulas orbitais.
 *
 * Fase 1 (Cápsulas Orbitais): três cápsulas giram ao redor do olho e atiram.
 *   A cada cápsula destruída, as restantes giram MAIS RÁPIDO e atiram mais.
 * Fase 2 (Olho Exposto): o olho vira alvo, mas três barreiras giram ao seu
 *   redor no sentido contrário. É preciso atirar pelas brechas.
 *
 * Tema: precisão contra alvos pequenos e em movimento.
 * Recompensa: TIRO PERFURANTE.
 */
import { GAME_WIDTH } from '../../config.js';
import { TAU } from '../../utils/math.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';

const CENTER_X = GAME_WIDTH / 2;
const POD_IDS = ['podA', 'podB', 'podC'];
const BARRIER_IDS = ['barrierA', 'barrierB', 'barrierC'];
const POD_RADIUS = 50;
const BARRIER_RADIUS = 44;

const ORB = { kind: 'orb', color: '#ef7d57', radius: 4 };
const NEEDLE = { kind: 'needle', color: '#ffcd75', radius: 3 };
const RING = { kind: 'orb', color: '#e43b8c', radius: 4 };

const podDef = (id, drop) => ({
  id, name: 'Cápsula Orbital', sprite: 'pod',
  ox: 0, oy: 0, hp: 16, phase: 0, look: 'remove', points: 1500, drop,
  debrisColors: ['#ef7d57', '#b13e53', '#ffcd75'],
});

const barrierDef = (id) => ({
  id, name: 'Barreira', sprite: 'barrier', ox: 0, oy: 0, visibleFromPhase: 1,
});

const PARTS = [
  {
    id: 'eye', name: 'Olho da Sentinela', sprite: 'sentinel',
    ox: 0, oy: 0, hp: 45, phase: 1, look: 'remove', points: 6000, explosionScale: 2.5,
    debrisColors: ['#566c86', '#94b0c2', '#b13e53'],
  },
  podDef('podA', null),
  podDef('podB', null),
  podDef('podC', 'rapid'),
  barrierDef('barrierA'),
  barrierDef('barrierB'),
  barrierDef('barrierC'),
];

const alivePods = (boss) => POD_IDS.map((id) => boss.parts[id]).filter((p) => !p.destroyed);

const PHASES = [
  {
    id: 'pods',
    title: 'CÁPSULAS ORBITAIS',
    hint: 'Destrua as cápsulas que giram!',
    targets: POD_IDS,

    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.7) * 100;
      boss.y = boss.homeY + Math.sin(boss.time * 1.3) * 12;
    },

    attack(boss, dt) {
      const world = boss.world;
      const pods = alivePods(boss);
      const interval = pods.length === 1 ? 0.9 : pods.length === 2 ? 1.4 : 1.9;
      pods.forEach((pod, i) => {
        if (every(boss, `pod_${pod.id}`, interval, dt, 0.8 + i * 0.6)) {
          const p = boss.worldPoint(pod.ox, pod.oy);
          fireSpread(world, p.x, p.y, aimAtPlayer(world, p.x, p.y), 1, 0, 170, ORB);
          world.audio.play('enemyShoot');
        }
      });
      if (every(boss, 'ring', 2.8, dt, 1.6)) {
        fireRing(world, boss.x, boss.y, 8, 100, boss.time, RING);
      }
    },
  },
  {
    id: 'eye',
    title: 'OLHO EXPOSTO',
    hint: 'Atire pelas brechas das barreiras!',
    targets: ['eye'],

    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.6) * 100;
      boss.y = boss.homeY + Math.sin(boss.time * 1.6) * 16;
    },

    attack(boss, dt) {
      const world = boss.world;
      const ratio = boss.parts.eye.healthRatio;
      if (every(boss, 'aimed', 1.0, dt, 0.8)) {
        fireSpread(world, boss.x, boss.y + 20, aimAtPlayer(world, boss.x, boss.y), 3, 0.3, 210, NEEDLE);
        world.audio.play('enemyShoot');
      }
      if (every(boss, 'ring', 2.4, dt, 1.4)) {
        fireRing(world, boss.x, boss.y, 14, 110, boss.time, RING);
      }
      if (ratio < 0.5 && every(boss, 'spiral', 0.22, dt, 0)) {
        boss.timers.spin = (boss.timers.spin ?? 0) + 0.35;
        fireRing(world, boss.x, boss.y, 2, 120, boss.timers.spin, ORB);
      }
    },
  },
];

export const SENTINEL = Object.freeze({
  id: 'sentinel',
  name: 'SENTINELA',
  intro: { title: 'ALVO DETECTADO', subtitle: 'SENTINELA' },
  description: 'Olho blindado com cápsulas orbitais. Exige precisão.',
  parTime: 120,
  size: { w: 110, h: 110 },
  timing: { entry: 2.4, transition: 1.8, death: 2.4, homeY: 150 },
  debrisColors: ['#566c86', '#94b0c2', '#ef7d57', '#b13e53'],
  parts: PARTS,
  phases: PHASES,

  /** Posiciona as peças que giram ao redor do olho. */
  update(boss, dt) {
    const v = boss.vars;
    // Menos cápsulas = rotação mais rápida (as restantes "compensam").
    const podSpeed = 1.0 + (3 - alivePods(boss).length) * 0.6;
    v.podAngle = (v.podAngle ?? 0) + podSpeed * dt;
    POD_IDS.forEach((id, i) => {
      const a = v.podAngle + (i * TAU) / 3;
      boss.parts[id].ox = Math.cos(a) * POD_RADIUS;
      boss.parts[id].oy = Math.sin(a) * POD_RADIUS * 0.85;
    });
    const barrierSpeed = boss.parts.eye.healthRatio < 0.5 ? 2.2 : 1.4;
    v.barrierAngle = (v.barrierAngle ?? 0) - barrierSpeed * dt;
    BARRIER_IDS.forEach((id, i) => {
      const a = v.barrierAngle + (i * TAU) / 3;
      boss.parts[id].ox = Math.cos(a) * BARRIER_RADIUS;
      boss.parts[id].oy = Math.sin(a) * BARRIER_RADIUS;
    });
  },
});
