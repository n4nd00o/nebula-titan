/**
 * Mini-chefe FÊNIX (Mundo 5, 2º círculo) — um pássaro de fogo que renasce.
 *
 * Fase 1 (Asas Flamejantes): as asas atiram leques e uma CHUVA DE BRASAS cai
 *   do topo da tela.
 * Fase 2 (Coração de Fogo): espirais de fogo e chuva mais leve.
 * Fase 3 (Renascida): quando o coração cai, a Fênix RENASCE das cinzas com um
 *   coração novo que regenera, e tudo fica mais rápido.
 *
 * Tema: a luta que não acaba quando parece acabar. Recompensa: RENASCER.
 */
import { GAME_WIDTH } from '../../config.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';
import { emberRain } from '../sweepers.js';

const CENTER_X = GAME_WIDTH / 2;
const FIRE = ['#ef7d57', '#ffcd75', '#b13e53'];
const EMBER = { kind: 'orb', color: '#ef7d57', radius: 3 };
const FLAME = { kind: 'orb', color: '#ffcd75', radius: 4 };
const ASH = { kind: 'orb', color: '#e43b8c', radius: 4 };

const PARTS = [
  // O corpo envolve o coração: deixa de bloquear tiros a partir da fase do coração.
  { id: 'body', name: 'Corpo', sprite: 'phoenix', ox: 0, oy: 0, look: 'none', solidUntilPhase: 1 },
  { id: 'wingL', name: 'Asa de Fogo E', sprite: 'flameWingL', ox: -42, oy: 2, hp: 60, phase: 0, look: 'remove', points: 4000, debrisColors: FIRE },
  { id: 'wingR', name: 'Asa de Fogo D', sprite: 'flameWingR', ox: 42, oy: 2, hp: 60, phase: 0, look: 'remove', points: 4000, drop: 'life', debrisColors: FIRE },
  { id: 'heart', name: 'Coração de Fogo', sprite: 'phoenixCore', ox: 0, oy: 0, hp: 110, phase: 1, look: 'remove', pulse: true, points: 8000, explosionScale: 2.4, debrisColors: FIRE },
  {
    id: 'ash', name: 'Coração Renascido', sprite: 'ashCore', ox: 0, oy: 0, hp: 120, regen: 3, regenDelay: 1.5, phase: 2,
    visibleFromPhase: 2, look: 'remove', pulse: true, points: 12000, explosionScale: 3, debrisColors: ['#e43b8c', '#8e478c', '#ffcd75'],
  },
];

const spiral = (boss, dt, interval, arms, style) => {
  if (every(boss, 'spiral', interval, dt, 0.5)) {
    boss.timers.spin = (boss.timers.spin ?? 0) + 0.35;
    fireRing(boss.world, boss.x, boss.y, arms, 120, boss.timers.spin, style);
  }
};

const PHASES = [
  {
    id: 'wings',
    title: 'ASAS FLAMEJANTES',
    hint: 'Brasas caem do céu! Olhe para cima também.',
    targets: ['wingL', 'wingR'],
    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.7) * 110;
      boss.y = boss.homeY + Math.sin(boss.time * 1.4) * 14;
    },
    attack(boss, dt) {
      const w = boss.world;
      if (every(boss, 'rain', 0.25, dt, 1)) emberRain(w, 1, 160, EMBER);
      for (const [id, side] of [['wingL', -1], ['wingR', 1]]) {
        const part = boss.parts[id];
        if (part.destroyed) continue;
        if (every(boss, id, 1.6, dt, side < 0 ? 0.6 : 1.4)) {
          const p = boss.worldPoint(part.ox, part.oy);
          fireSpread(w, p.x, p.y, aimAtPlayer(w, p.x, p.y), 4, 0.6, 170, FLAME);
          w.audio.play('enemyShoot');
        }
      }
    },
  },
  {
    id: 'heart',
    title: 'CORAÇÃO DE FOGO',
    hint: 'Destrua o coração... se puder.',
    targets: ['heart'],
    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.6) * 100;
      boss.y = boss.homeY + Math.sin(boss.time * 1.2) * 12;
    },
    attack(boss, dt) {
      if (every(boss, 'rain', 0.4, dt, 1)) emberRain(boss.world, 1, 150, EMBER);
      spiral(boss, dt, 0.18, 3, FLAME);
    },
  },
  {
    id: 'rebirth',
    title: 'RENASCIDA',
    hint: 'A Fênix renasceu! O coração novo regenera.',
    targets: ['ash'],
    enrage: true,
    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.9) * 120;
      boss.y = boss.homeY + Math.sin(boss.time * 1.8) * 18;
    },
    attack(boss, dt) {
      const w = boss.world;
      if (every(boss, 'rain', 0.2, dt, 0.6)) emberRain(w, 1, 180, EMBER);
      spiral(boss, dt, 0.14, 3, ASH);
      if (every(boss, 'aimed', 1.5, dt, 1)) fireSpread(w, boss.x, boss.y, aimAtPlayer(w, boss.x, boss.y), 5, 0.8, 190, FLAME);
    },
  },
];

export const PHOENIX = Object.freeze({
  id: 'phoenix',
  name: 'FÊNIX',
  intro: { title: 'ALVO DETECTADO', subtitle: 'FÊNIX' },
  description: 'Pássaro de fogo. Renasce uma vez.',
  icon: { sprite: 'phoenixCore', scale: 1.3 },
  parTime: 180,
  size: { w: 130, h: 40 },
  timing: { entry: 2.4, transition: 2, death: 2.8, homeY: 140 },
  debrisColors: FIRE,
  parts: PARTS,
  phases: PHASES,
});
