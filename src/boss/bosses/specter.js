/**
 * Mini-chefe ESPECTRO (Mundo 4) — uma nave-fantasma que sai de fase.
 *
 * Ciclo espectral: sólido por alguns segundos, depois desvanece e fica
 * INTANGÍVEL (os tiros atravessam), teletransporta e reaparece soltando um
 * anel de projéteis. Os colchetes de ponto fraco somem enquanto ele está
 * fora de fase.
 *
 * Fase 1 (Lanternas): três lanternas orbitam o corpo e lançam orbes curvos.
 * Fase 2 (Aparição): o corpo vira alvo; o ciclo fica mais curto.
 *
 * Recompensa: FANTASMA (dash recarrega em 1 s e dá mais invencibilidade).
 */
import { GAME_WIDTH } from '../../config.js';
import { TAU } from '../../utils/math.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';
import { resetGhost, updateGhost, isGhost, ghostAlpha } from '../phasing.js';

const CENTER_X = GAME_WIDTH / 2;
const LANTERN_IDS = ['lanternA', 'lanternB', 'lanternC'];
const VOID = ['#8e478c', '#e43b8c', '#f4f4f4'];
const CURVE_A = { kind: 'orb', color: '#e43b8c', radius: 4, spin: 0.7 };
const CURVE_B = { kind: 'orb', color: '#e43b8c', radius: 4, spin: -0.7 };
const RING = { kind: 'orb', color: '#8e478c', radius: 4 };
const NEEDLE = { kind: 'needle', color: '#f4f4f4', radius: 3 };

const lanternDef = (id, drop) => ({
  id, name: 'Lanterna', sprite: 'lantern', ox: 0, oy: 0, hp: 60, phase: 0,
  look: 'remove', points: 3500, drop, debrisColors: VOID,
});

const PARTS = [
  {
    id: 'body', name: 'Espectro', sprite: 'specter', ox: 0, oy: 0, hp: 220, phase: 1,
    look: 'remove', points: 10000, explosionScale: 2.8, debrisColors: VOID,
  },
  lanternDef('lanternA', null),
  lanternDef('lanternB', 'shield'),
  lanternDef('lanternC', null),
];

const appearRing = (boss) => {
  fireRing(boss.world, boss.x, boss.y, 16, 105, boss.time, RING);
  boss.world.audio.play('enemyShoot');
};

function drift(boss, dt) {
  const v = boss.vars;
  v.homeX ??= CENTER_X;
  boss.x += (v.homeX + Math.sin(boss.time * 0.9) * 30 - boss.x) * Math.min(1, dt * 3);
  boss.y = boss.homeY + Math.sin(boss.time * 1.4) * 16;
}

const PHASES = [
  {
    id: 'lanterns',
    title: 'LANTERNAS',
    hint: 'Quando ele some, seus tiros atravessam. Espere ele voltar!',
    targets: LANTERN_IDS,
    onStart: resetGhost,

    move(boss, dt) {
      updateGhost(boss, dt, { solid: 3.4, gone: 1.4, onAppear: appearRing });
      drift(boss, dt);
    },

    attack(boss, dt) {
      if (isGhost(boss)) return;
      const world = boss.world;
      LANTERN_IDS.filter((id) => !boss.parts[id].destroyed).forEach((id, i) => {
        if (every(boss, id, 1.7, dt, 0.5 + i * 0.5)) {
          const p = boss.worldPoint(boss.parts[id].ox, boss.parts[id].oy);
          fireSpread(world, p.x, p.y, aimAtPlayer(world, p.x, p.y), 2, 0.6, 150, i % 2 ? CURVE_A : CURVE_B);
        }
      });
    },
  },
  {
    id: 'apparition',
    title: 'APARIÇÃO',
    hint: 'Atire enquanto ele estiver sólido!',
    targets: ['body'],
    enrage: true,
    onStart: resetGhost,

    move(boss, dt) {
      updateGhost(boss, dt, { solid: 2.6, gone: 1.1, onAppear: appearRing });
      drift(boss, dt);
    },

    attack(boss, dt) {
      if (isGhost(boss)) return;
      const world = boss.world;
      if (every(boss, 'curves', 0.5, dt, 0.3)) {
        const a = aimAtPlayer(world, boss.x, boss.y);
        fireSpread(world, boss.x, boss.y + 20, a - 0.6, 1, 0, 140, CURVE_A);
        fireSpread(world, boss.x, boss.y + 20, a + 0.6, 1, 0, 140, CURVE_B);
      }
      if (every(boss, 'aimed', 1.3, dt, 0.8)) {
        fireSpread(world, boss.x, boss.y + 20, aimAtPlayer(world, boss.x, boss.y), 3, 0.3, 220, NEEDLE);
      }
    },
  },
];

export const SPECTER = Object.freeze({
  id: 'specter',
  name: 'ESPECTRO',
  intro: { title: 'ALVO DETECTADO', subtitle: 'ESPECTRO' },
  description: 'Nave-fantasma. Some e seus tiros atravessam.',
  icon: { sprite: 'specter', scale: 0.85 },
  parTime: 150,
  size: { w: 100, h: 90 },
  timing: { entry: 2.4, transition: 1.8, death: 2.6, homeY: 150 },
  debrisColors: VOID,
  rageSprite: 'specter',
  parts: PARTS,
  phases: PHASES,

  intangible: isGhost,
  alpha: ghostAlpha,

  update(boss, dt) {
    const v = boss.vars;
    v.lanternAngle = (v.lanternAngle ?? 0) + 0.9 * dt;
    LANTERN_IDS.forEach((id, i) => {
      const a = v.lanternAngle + (i * TAU) / 3;
      boss.parts[id].ox = Math.cos(a) * 58;
      boss.parts[id].oy = Math.sin(a) * 48;
    });
  },
});
