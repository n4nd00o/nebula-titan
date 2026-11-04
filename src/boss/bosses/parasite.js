/**
 * Mini-chefe PARASITA (Mundo 5, 1º círculo) — uma criatura que se regenera.
 *
 * Fase 1 (Bolsas de Esporos): três bolsas REGENERAM quando param de levar dano
 *   e soltam esporos que perseguem a nave. Foque uma de cada vez.
 * Fase 2 (Núcleo Voraz): o núcleo SUGA a nave para perto (gravidade) enquanto
 *   solta esporos e espirais.
 *
 * Tema: pressão constante e foco. Recompensa: VAMPIRISMO.
 */
import { GAME_WIDTH } from '../../config.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';

const CENTER_X = GAME_WIDTH / 2;
const FLESH = ['#b13e53', '#8e478c', '#a7f070'];
const SPORE = { kind: 'mine', color: '#a7f070', radius: 5, homing: 1.6, turnRate: 1.5, life: 6 };
const ORB = { kind: 'orb', color: '#e43b8c', radius: 4 };
const SAC_IDS = ['sacL', 'sacC', 'sacR'];

const sacDef = (id, ox, oy, drop) => ({
  id, name: 'Bolsa de Esporos', sprite: 'sac', ox, oy, hp: 45, regen: 6, regenDelay: 1.2, phase: 0,
  look: 'remove', points: 3500, drop, debrisColors: FLESH,
});

const PARTS = [
  // A carapaça envolve o núcleo: deixa de bloquear tiros na fase do núcleo.
  { id: 'shell', name: 'Carapaça', sprite: 'parasite', ox: 0, oy: 0, look: 'none', solidUntilPhase: 1 },
  sacDef('sacL', -40, 24, null),
  sacDef('sacC', 0, 30, 'shield'),
  sacDef('sacR', 40, 24, null),
  { id: 'core', name: 'Núcleo Voraz', sprite: 'parasiteCore', ox: 0, oy: 0, hp: 130, phase: 1, look: 'remove', pulse: true, points: 12000, explosionScale: 2.6, debrisColors: FLESH },
];

const PHASES = [
  {
    id: 'sacs',
    title: 'BOLSAS DE ESPOROS',
    hint: 'Elas regeneram! Destrua uma de cada vez.',
    targets: SAC_IDS,
    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.45) * 90;
      boss.y = boss.homeY + Math.sin(boss.time * 1.0) * 10;
    },
    attack(boss, dt) {
      const w = boss.world;
      SAC_IDS.forEach((id, i) => {
        const part = boss.parts[id];
        if (part.destroyed) return;
        if (every(boss, id, 2.2, dt, 0.6 + i * 0.6)) {
          const p = boss.worldPoint(part.ox, part.oy);
          fireSpread(w, p.x, p.y + 8, Math.PI / 2, 1, 0, 110, SPORE);
        }
      });
      if (every(boss, 'ring', 2.8, dt, 1.4)) fireRing(w, boss.x, boss.y, 10, 105, boss.time, ORB);
    },
  },
  {
    id: 'core',
    title: 'NÚCLEO VORAZ',
    hint: 'Ele te puxa! Use o DASH para escapar.',
    targets: ['core'],
    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.55) * 100;
      boss.y = boss.homeY + Math.sin(boss.time * 1.1) * 12;
    },
    attack(boss, dt) {
      const w = boss.world;
      if (every(boss, 'spores', 1.6, dt, 0.8)) {
        fireSpread(w, boss.x, boss.y + 10, aimAtPlayer(w, boss.x, boss.y), 3, 1.2, 120, SPORE);
      }
      if (every(boss, 'spiral', 0.2, dt, 0.5)) {
        boss.timers.spin = (boss.timers.spin ?? 0) + 0.4;
        fireRing(w, boss.x, boss.y, 2, 115, boss.timers.spin, ORB);
      }
    },
  },
];

export const PARASITE = Object.freeze({
  id: 'parasite',
  name: 'PARASITA',
  intro: { title: 'ALVO DETECTADO', subtitle: 'PARASITA' },
  description: 'Criatura que regenera e suga a nave.',
  icon: { sprite: 'parasiteCore', scale: 1.3 },
  parTime: 150,
  size: { w: 130, h: 60 },
  timing: { entry: 2.4, transition: 1.8, death: 2.6, homeY: 140 },
  debrisColors: FLESH,
  parts: PARTS,
  phases: PHASES,
  /** Fase 2: o núcleo suga a nave. */
  pull: (boss) => (boss.phaseIndex === 1 ? { x: boss.x, y: boss.y, strength: 48 } : null),
});
