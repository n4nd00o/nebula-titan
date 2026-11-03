/**
 * Mini-chefe PRISMA (Mundo 2) — um cristal que refrata tudo o que dispara.
 *
 * Fase 1 (Fragmentos): quatro fragmentos orbitam o núcleo e lançam cristais
 *   que se DIVIDEM em leque no meio do caminho. Cada fragmento destruído
 *   "estilhaça" num anel de cristais, e os restantes giram mais rápido.
 * Fase 2 (Núcleo Refrator): o núcleo dispara orbes que explodem em anéis;
 *   abaixo de 50% de vida, os anéis ficam duplos.
 *
 * Tema: ler projéteis que mudam de forma. Recompensa: TIRO TRIPLO.
 */
import { GAME_WIDTH } from '../../config.js';
import { TAU } from '../../utils/math.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';

const CENTER_X = GAME_WIDTH / 2;
const SHARD_IDS = ['shardA', 'shardB', 'shardC', 'shardD'];
const ORBIT = 62;

const ICE = ['#73eff7', '#41a6f6', '#f4f4f4'];
const SPLITTER = {
  kind: 'shard', color: '#73eff7', radius: 5,
  split: { at: 0.75, count: 3, spread: 0.7, speed: 170, style: { kind: 'needle', color: '#73eff7', radius: 3 } },
};
const BOMBLET = {
  kind: 'shard', color: '#41a6f6', radius: 7,
  split: { at: 0.9, count: 10, speed: 115, ring: true, style: { kind: 'orb', color: '#41a6f6', radius: 4 } },
};
const NEEDLE = { kind: 'needle', color: '#f4f4f4', radius: 3 };
const SHATTER = { kind: 'shard', color: '#73eff7', radius: 4 };

const shardDef = (id, drop) => ({
  id, name: 'Fragmento', sprite: 'shard', ox: 0, oy: 0, hp: 30, phase: 0,
  look: 'remove', points: 2000, drop, debrisColors: ICE,
});

const PARTS = [
  {
    id: 'core', name: 'Núcleo Refrator', sprite: 'prism', ox: 0, oy: 0, hp: 110, phase: 1,
    look: 'remove', points: 8000, explosionScale: 2.6, debrisColors: ICE,
  },
  shardDef('shardA', null),
  shardDef('shardB', 'shield'),
  shardDef('shardC', null),
  shardDef('shardD', 'rapid'),
];

const aliveShards = (boss) => SHARD_IDS.map((id) => boss.parts[id]).filter((p) => !p.destroyed);

const PHASES = [
  {
    id: 'shards',
    title: 'FRAGMENTOS',
    hint: 'Cristais se dividem no ar: desvie cedo!',
    targets: SHARD_IDS,

    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.6) * 110;
      boss.y = boss.homeY + Math.sin(boss.time * 1.2) * 14;
    },

    attack(boss, dt) {
      const world = boss.world;
      const shards = aliveShards(boss);
      const interval = 1.4 + shards.length * 0.35;
      shards.forEach((shard, i) => {
        if (every(boss, `s_${shard.id}`, interval, dt, 0.7 + i * 0.5)) {
          const p = boss.worldPoint(shard.ox, shard.oy);
          fireSpread(world, p.x, p.y, aimAtPlayer(world, p.x, p.y), 1, 0, 150, SPLITTER);
          world.audio.play('enemyShoot');
        }
      });
      if (every(boss, 'ring', 3.2, dt, 2)) fireRing(world, boss.x, boss.y, 10, 95, boss.time, NEEDLE);
    },
  },
  {
    id: 'core',
    title: 'NÚCLEO REFRATOR',
    hint: 'Os orbes explodem em anéis!',
    targets: ['core'],

    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.75) * 130;
      boss.y = boss.homeY + Math.sin(boss.time * 1.5) * 20;
    },

    attack(boss, dt) {
      const world = boss.world;
      const ratio = boss.parts.core.healthRatio;
      if (every(boss, 'bomblet', ratio < 0.5 ? 1.25 : 1.7, dt, 0.8)) {
        fireSpread(world, boss.x, boss.y + 20, aimAtPlayer(world, boss.x, boss.y), ratio < 0.5 ? 2 : 1, 0.9, 140, BOMBLET);
        world.audio.play('enemyShoot');
      }
      if (every(boss, 'needles', 1.1, dt, 0.5)) {
        fireSpread(world, boss.x, boss.y + 20, aimAtPlayer(world, boss.x, boss.y), 3, 0.35, 220, NEEDLE);
      }
    },
  },
];

export const PRISM = Object.freeze({
  id: 'prism',
  name: 'PRISMA',
  intro: { title: 'ALVO DETECTADO', subtitle: 'PRISMA' },
  description: 'Cristal vivo. Seus tiros se dividem no ar.',
  icon: { sprite: 'prism', scale: 0.9 },
  parTime: 130,
  size: { w: 120, h: 120 },
  timing: { entry: 2.4, transition: 1.8, death: 2.4, homeY: 150 },
  debrisColors: ICE,
  parts: PARTS,
  phases: PHASES,

  update(boss, dt) {
    const v = boss.vars;
    const speed = 0.9 + (4 - aliveShards(boss).length) * 0.45;
    v.angle = (v.angle ?? 0) + speed * dt;
    SHARD_IDS.forEach((id, i) => {
      const a = v.angle + (i * TAU) / 4;
      boss.parts[id].ox = Math.cos(a) * ORBIT;
      boss.parts[id].oy = Math.sin(a) * ORBIT * 0.8;
    });
  },

  /** Fragmento destruído estilhaça num anel de cristais. */
  onPartDestroyed(boss, part) {
    if (!part.id.startsWith('shard')) return;
    const p = boss.worldPoint(part.ox, part.oy);
    fireRing(boss.world, p.x, p.y, 8, 90, boss.time, SHATTER);
  },
});
