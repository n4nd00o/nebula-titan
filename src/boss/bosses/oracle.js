/**
 * Mini-chefe ORÁCULO (Mundo 4) — uma mandala que desenha flores de projéteis.
 *
 * O "bullet hell" do jogo: padrões densos, lentos e bonitos, feitos para
 * serem atravessados com o MODO FOCO (Shift).
 *
 * Fase 1 (Pétalas): quatro pétalas giram ao redor da mandala, cada uma
 *   soltando correntes que fazem curva.
 * Fase 2 (Olho do Oráculo): flores de anéis alternados (giram para lados
 *   opostos) e agulhas miradas.
 *
 * Recompensa: FOCO AMPLIFICADO (no modo foco, o tiro causa +60% de dano).
 */
import { GAME_WIDTH } from '../../config.js';
import { TAU } from '../../utils/math.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';

const CENTER_X = GAME_WIDTH / 2;
const PETAL_IDS = ['petalA', 'petalB', 'petalC', 'petalD'];
const VOID = ['#e43b8c', '#8e478c', '#ffcd75'];
const STREAM_A = { kind: 'orb', color: '#e43b8c', radius: 4, spin: 0.45 };
const STREAM_B = { kind: 'orb', color: '#ffcd75', radius: 4, spin: -0.45 };
const FLOWER_A = { kind: 'orb', color: '#e43b8c', radius: 4, spin: 0.25 };
const FLOWER_B = { kind: 'orb', color: '#8e478c', radius: 4, spin: -0.25 };
const NEEDLE = { kind: 'needle', color: '#f4f4f4', radius: 3 };

const petalDef = (id, drop) => ({
  id, name: 'Pétala', sprite: 'petal', ox: 0, oy: 0, hp: 70, phase: 0,
  look: 'remove', points: 3500, drop, debrisColors: VOID,
});

const PARTS = [
  // A mandala envolve o Olho: deixa de bloquear tiros na fase 2 (senão o Olho fica imortal).
  { id: 'mandala', name: 'Mandala', sprite: 'oracle', ox: 0, oy: 0, look: 'none', solidUntilPhase: 1 },
  {
    id: 'eye', name: 'Olho do Oráculo', sprite: 'oracleEye', ox: 0, oy: 0, hp: 230, phase: 1,
    look: 'remove', points: 10000, pulse: true, explosionScale: 2.8, debrisColors: VOID,
  },
  petalDef('petalA', null),
  petalDef('petalB', 'shield'),
  petalDef('petalC', null),
  petalDef('petalD', 'rapid'),
];

const alivePetals = (boss) => PETAL_IDS.filter((id) => !boss.parts[id].destroyed);

const PHASES = [
  {
    id: 'petals',
    title: 'PÉTALAS',
    hint: 'Use o MODO FOCO (Shift) para passar entre os tiros.',
    targets: PETAL_IDS,

    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.35) * 70;
      boss.y = boss.homeY + Math.sin(boss.time * 0.7) * 10;
    },

    attack(boss, dt) {
      const world = boss.world;
      const petals = alivePetals(boss);
      petals.forEach((id, i) => {
        if (every(boss, id, petals.length <= 2 ? 0.2 : 0.3, dt, 0.4 + i * 0.1)) {
          const part = boss.parts[id];
          const p = boss.worldPoint(part.ox, part.oy);
          const outward = Math.atan2(part.oy, part.ox);
          fireSpread(world, p.x, p.y, outward, 1, 0, 120, i % 2 ? STREAM_A : STREAM_B);
        }
      });
      if (every(boss, 'aimed', 2.2, dt, 1.4)) {
        fireSpread(world, boss.x, boss.y, aimAtPlayer(world, boss.x, boss.y), 3, 0.25, 210, NEEDLE);
      }
    },
  },
  {
    id: 'eye',
    title: 'OLHO DO ORÁCULO',
    hint: 'Flores de projéteis! Movimentos curtos e precisos.',
    targets: ['eye'],
    enrage: true,

    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.45) * 90;
      boss.y = boss.homeY + Math.sin(boss.time * 0.9) * 14;
    },

    attack(boss, dt) {
      const world = boss.world;
      const ratio = boss.parts.eye.healthRatio;
      if (every(boss, 'flower', ratio < 0.5 ? 0.6 : 0.8, dt, 0.4)) {
        boss.timers.flip = !boss.timers.flip;
        fireRing(world, boss.x, boss.y, 18, 95, boss.time * 0.7, boss.timers.flip ? FLOWER_A : FLOWER_B);
      }
      if (every(boss, 'aimed', 1.4, dt, 0.9)) {
        fireSpread(world, boss.x, boss.y, aimAtPlayer(world, boss.x, boss.y), 5, 0.5, 200, NEEDLE);
      }
    },
  },
];

export const ORACLE = Object.freeze({
  id: 'oracle',
  name: 'ORÁCULO',
  intro: { title: 'ALVO DETECTADO', subtitle: 'ORÁCULO' },
  description: 'Mandala viva. Desenha flores de projéteis.',
  icon: { sprite: 'oracle', scale: 0.8 },
  parTime: 150,
  size: { w: 120, h: 90 },
  timing: { entry: 2.4, transition: 1.8, death: 2.6, homeY: 150 },
  debrisColors: VOID,
  rageSprite: 'oracle',
  parts: PARTS,
  phases: PHASES,

  /** As pétalas giram ao redor da mandala (cada uma passa por baixo dela). */
  update(boss, dt) {
    const v = boss.vars;
    v.petalAngle = (v.petalAngle ?? 0) + (0.5 + (4 - alivePetals(boss).length) * 0.2) * dt;
    PETAL_IDS.forEach((id, i) => {
      const a = v.petalAngle + (i * TAU) / 4;
      boss.parts[id].ox = Math.cos(a) * 62;
      boss.parts[id].oy = Math.sin(a) * 46;
    });
  },
});
