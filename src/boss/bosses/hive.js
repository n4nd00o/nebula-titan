/**
 * Mini-chefe COLMEIA — nave-mãe orgânica que fabrica drones.
 *
 * Fase 1 (Ninhos): dois ninhos lançam drones sem parar. Destruir um ninho
 *   faz o outro produzir MAIS RÁPIDO e a Colmeia inclina para o lado perdido.
 * Fase 2 (Rainha): o núcleo vira alvo e dispara minas teleguiadas.
 *
 * Narrativa: a Colmeia mantinha uma nave aliada capturada (homenagem à nave
 * dupla do Galaga). Derrotá-la liberta a ALA COMPANHEIRA.
 */
import { GAME_WIDTH } from '../../config.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';

const CENTER_X = GAME_WIDTH / 2;
const NEEDLE = { kind: 'needle', color: '#a7f070', radius: 3 };
const MINE = { kind: 'mine', color: '#a7f070', radius: 5, homing: 2.0, turnRate: 1.6, life: 7 };
const ORB = { kind: 'orb', color: '#e43b8c', radius: 4 };

const PARTS = [
  {
    id: 'shell', name: 'Carapaça', sprite: 'hive', ox: 0, oy: 0, look: 'none',
  },
  {
    id: 'nestL', name: 'Ninho Esquerdo', sprite: 'nest',
    ox: -33, oy: 14, hp: 30, phase: 0, look: 'husk', points: 1500,
    debrisColors: ['#38b764', '#a7f070', '#257179'],
  },
  {
    id: 'nestR', name: 'Ninho Direito', sprite: 'nest',
    ox: 33, oy: 14, hp: 30, phase: 0, look: 'husk', points: 1500, drop: 'shield',
    debrisColors: ['#38b764', '#a7f070', '#257179'],
  },
  {
    id: 'queen', name: 'Rainha', sprite: 'hiveCore',
    ox: 0, oy: 14, hp: 55, phase: 1, look: 'remove', points: 6000, explosionScale: 2.5, pulse: true,
    debrisColors: ['#e43b8c', '#ffcd75', '#8e478c'],
  },
];

const PHASES = [
  {
    id: 'nests',
    title: 'NINHOS',
    hint: 'Destrua os ninhos de drones!',
    targets: ['nestL', 'nestR'],

    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.45) * 90;
      boss.y = boss.homeY + Math.sin(boss.time * 0.9) * 8;
    },

    attack(boss, dt) {
      const world = boss.world;
      const nests = [boss.parts.nestL, boss.parts.nestR].filter((p) => !p.destroyed);
      const interval = nests.length === 1 ? 1.6 : 2.8;
      for (const nest of nests) {
        const side = nest.id === 'nestL' ? -1 : 1;
        if (every(boss, `spawn_${nest.id}`, interval, dt, side < 0 ? 1 : 2.2)) {
          const p = boss.worldPoint(nest.ox, nest.oy + 12);
          world.spawnMinion(p.x, p.y, { entryTime: 0.7, dir: side });
        }
      }
      if (every(boss, 'fan', 2.4, dt, 1.2)) {
        const p = boss.worldPoint(0, 26);
        fireSpread(world, p.x, p.y, aimAtPlayer(world, p.x, p.y), 3, 0.4, 180, NEEDLE);
        world.audio.play('enemyShoot');
      }
    },
  },
  {
    id: 'queen',
    title: 'RAINHA',
    hint: 'Destrua a rainha!',
    targets: ['queen'],

    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.8) * 120;
      boss.y = boss.homeY + Math.sin(boss.time * 1.4) * 14;
    },

    attack(boss, dt) {
      const world = boss.world;
      const ratio = boss.parts.queen.healthRatio;
      if (every(boss, 'mines', 2.6, dt, 1)) {
        for (const side of [-1, 1]) {
          const p = boss.worldPoint(20 * side, 24);
          fireSpread(world, p.x, p.y, Math.PI / 2 + side * 0.4, 1, 0, 90, MINE);
        }
        world.audio.play('enemyShoot');
      }
      if (every(boss, 'ring', 2.2, dt, 1.8)) {
        fireRing(world, boss.x, boss.y + 14, 12, 105, boss.time, ORB);
      }
      if (every(boss, 'wave', ratio < 0.5 ? 3.5 : 5.5, dt, 2.5)) world.spawnMinionWave(3);
    },
  },
];

export const HIVE = Object.freeze({
  id: 'hive',
  name: 'COLMEIA',
  intro: { title: 'ALVO DETECTADO', subtitle: 'COLMEIA' },
  description: 'Nave-mãe que fabrica drones. Mantém uma nave aliada presa.',
  parTime: 120,
  size: { w: 100, h: 50 },
  timing: { entry: 2.4, transition: 1.8, death: 2.4, homeY: 130 },
  debrisColors: ['#38b764', '#a7f070', '#257179', '#ffcd75'],
  rageSprite: 'hive',
  parts: PARTS,
  phases: PHASES,

  /** Sem um ninho, a Colmeia "pende" para o lado danificado. */
  tilt(boss) {
    const L = boss.parts.nestL.destroyed;
    const R = boss.parts.nestR.destroyed;
    if (L && !R) return -0.1;
    if (R && !L) return 0.1;
    return 0;
  },
});
