/**
 * Mini-chefe CRONOS (Mundo 5, 1º círculo) — um relógio que dobra o tempo.
 *
 * Fase 1 (Engrenagens): duas engrenagens disparam agulhas; o mostrador solta
 *   anéis de projéteis CONGELADOS, que quase param e depois disparam de uma vez.
 * Fase 2 (Ponteiros): dois ponteiros-raio giram em sentidos opostos a partir do
 *   centro. Começam devagar e sem machucar (aviso) e depois ficam letais.
 *
 * Tema: ler o tempo das coisas. Recompensa: TEMPO BALA.
 */
import { GAME_WIDTH } from '../../config.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';
import { resetHands, updateHands, handSegments, drawHands } from '../sweepers.js';

const CENTER_X = GAME_WIDTH / 2;
const GOLD = ['#ffcd75', '#f4f4f4', '#ef7d57'];
const FROZEN = { kind: 'orb', color: '#ffcd75', radius: 4, accel: 230, maxSpeed: 210 };
const NEEDLE = { kind: 'needle', color: '#f4f4f4', radius: 3 };
const HAND_LENGTHS = [250, 320];

const PARTS = [
  // O mostrador envolve o núcleo: deixa de bloquear tiros na fase do núcleo.
  { id: 'dial', name: 'Mostrador', sprite: 'chronos', ox: 0, oy: 0, look: 'none', solidUntilPhase: 1 },
  { id: 'gearL', name: 'Engrenagem E', sprite: 'gear', ox: -48, oy: 16, hp: 60, phase: 0, look: 'husk', points: 4000, debrisColors: GOLD },
  { id: 'gearR', name: 'Engrenagem D', sprite: 'gear', ox: 48, oy: 16, hp: 60, phase: 0, look: 'husk', points: 4000, drop: 'shield', debrisColors: GOLD },
  { id: 'core', name: 'Núcleo do Tempo', sprite: 'chronoCore', ox: 0, oy: 0, hp: 120, phase: 1, look: 'remove', pulse: true, points: 12000, explosionScale: 2.6, debrisColors: GOLD },
];

/** Anel "congelado": sai quase parado e acelera de repente. */
const frozenRing = (boss, count) => fireRing(boss.world, boss.x, boss.y, count, 8, boss.time, FROZEN);

const PHASES = [
  {
    id: 'gears',
    title: 'ENGRENAGENS',
    hint: 'Os anéis congelados vão disparar! Saia antes.',
    targets: ['gearL', 'gearR'],
    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.5) * 100;
      boss.y = boss.homeY + Math.sin(boss.time * 1.1) * 10;
    },
    attack(boss, dt) {
      const w = boss.world;
      if (every(boss, 'frozen', 2.4, dt, 1)) frozenRing(boss, 14);
      for (const id of ['gearL', 'gearR']) {
        const part = boss.parts[id];
        if (part.destroyed) continue;
        if (every(boss, id, 1.7, dt, id === 'gearL' ? 0.6 : 1.4)) {
          const p = boss.worldPoint(part.ox, part.oy + 10);
          fireSpread(w, p.x, p.y, aimAtPlayer(w, p.x, p.y), 3, 0.3, 190, NEEDLE);
          w.audio.play('enemyShoot');
        }
      }
    },
  },
  {
    id: 'hands',
    title: 'PONTEIROS',
    hint: 'Os ponteiros giram: fique entre eles!',
    targets: ['core'],
    onStart: resetHands,
    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.35) * 60;
      boss.y = boss.homeY + Math.sin(boss.time * 0.9) * 8;
    },
    attack(boss, dt) {
      const fast = boss.parts.core.healthRatio < 0.5 ? 1.35 : 1;
      updateHands(boss, dt, [0.55 * fast, -0.85 * fast]);
      if (every(boss, 'frozen', 3, dt, 2)) frozenRing(boss, 10);
      if (every(boss, 'aimed', 1.6, dt, 1)) {
        fireSpread(boss.world, boss.x, boss.y, aimAtPlayer(boss.world, boss.x, boss.y), 1, 0, 220, NEEDLE);
      }
    },
  },
];

export const CHRONOS = Object.freeze({
  id: 'chronos',
  name: 'CRONOS',
  intro: { title: 'ALVO DETECTADO', subtitle: 'CRONOS, O RELÓGIO' },
  description: 'Relógio que dobra o tempo. Ponteiros letais.',
  icon: { sprite: 'chronos', scale: 0.8 },
  parTime: 150,
  size: { w: 140, h: 60 },
  timing: { entry: 2.4, transition: 1.8, death: 2.6, homeY: 140 },
  debrisColors: GOLD,
  parts: PARTS,
  phases: PHASES,
  segments: (boss) => (boss.phaseIndex === 1 ? handSegments(boss, HAND_LENGTHS) : []),
  drawWorld(ctx, boss) {
    if (boss.phaseIndex === 1) drawHands(ctx, boss, HAND_LENGTHS);
  },
});
