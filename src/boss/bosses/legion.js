/**
 * Mini-chefe LEGIÃO (Mundo 5, 2º círculo) — um porta-naves.
 *
 * Fase 1 (Hangares): dois hangares lançam alienígenas vermelhos (kamikazes) e
 *   roxos (divisores) sem parar.
 * Fase 2 (Comando): o núcleo de comando ergue PAREDES DE LASER (o dash
 *   atravessa) e chama esquadrões.
 *
 * Tema: controle de multidão. Recompensa: ORBITAIS.
 */
import { GAME_WIDTH } from '../../config.js';
import { rand } from '../../utils/math.js';
import { fireSpread, aimAtPlayer, every } from '../patterns.js';

const CENTER_X = GAME_WIDTH / 2;
const STEEL = ['#566c86', '#94b0c2', '#b13e53'];
const NEEDLE = { kind: 'needle', color: '#ef7d57', radius: 3 };

const PARTS = [
  // O casco envolve o núcleo: deixa de bloquear tiros na fase do núcleo.
  { id: 'hull', name: 'Casco', sprite: 'legion', ox: 0, oy: 0, look: 'none', solidUntilPhase: 1 },
  { id: 'bayL', name: 'Hangar E', sprite: 'bay', ox: -46, oy: 20, hp: 70, phase: 0, look: 'husk', points: 4000, debrisColors: STEEL },
  { id: 'bayR', name: 'Hangar D', sprite: 'bay', ox: 46, oy: 20, hp: 70, phase: 0, look: 'husk', points: 4000, drop: 'double', debrisColors: STEEL },
  { id: 'core', name: 'Núcleo de Comando', sprite: 'legionCore', ox: 0, oy: 0, hp: 150, phase: 1, look: 'remove', pulse: true, points: 12000, explosionScale: 2.6, debrisColors: STEEL },
];

const PHASES = [
  {
    id: 'bays',
    title: 'HANGARES',
    hint: 'Kamikazes! Atire nos hangares entre as ondas.',
    targets: ['bayL', 'bayR'],
    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.4) * 80;
      boss.y = boss.homeY + Math.sin(boss.time * 0.9) * 8;
    },
    attack(boss, dt) {
      const w = boss.world;
      const open = ['bayL', 'bayR'].filter((id) => !boss.parts[id].destroyed);
      open.forEach((id) => {
        if (every(boss, id, open.length === 1 ? 1.1 : 1.6, dt, id === 'bayL' ? 0.8 : 1.6)) {
          const p = boss.worldPoint(boss.parts[id].ox, boss.parts[id].oy + 10);
          w.spawnMinion(p.x, p.y, { entryTime: 0.5, dir: id === 'bayL' ? -1 : 1, type: Math.random() < 0.5 ? 'red' : 'purple' });
        }
      });
      if (every(boss, 'aimed', 1.8, dt, 1)) {
        fireSpread(w, boss.x, boss.y + 14, aimAtPlayer(w, boss.x, boss.y), 3, 0.35, 190, NEEDLE);
      }
    },
  },
  {
    id: 'command',
    title: 'COMANDO',
    hint: 'Paredes de laser: use o DASH para atravessar!',
    targets: ['core'],
    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.5) * 100;
      boss.y = boss.homeY + Math.sin(boss.time * 1.0) * 10;
    },
    attack(boss, dt) {
      const w = boss.world;
      const angry = boss.parts.core.healthRatio < 0.5;
      if (every(boss, 'wall', angry ? 2.4 : 3, dt, 1.5)) w.spawnLaserWall({ gapX: rand(70, GAME_WIDTH - 70), gap: 90, speed: 175 });
      if (every(boss, 'wave', 6, dt, 3)) w.spawnMinionWave(3, { type: 'red' });
      if (every(boss, 'aimed', 1.2, dt, 0.6)) {
        fireSpread(w, boss.x, boss.y + 10, aimAtPlayer(w, boss.x, boss.y), 5, 0.6, 200, NEEDLE);
      }
    },
  },
];

export const LEGION = Object.freeze({
  id: 'legion',
  name: 'LEGIÃO',
  intro: { title: 'ALVO DETECTADO', subtitle: 'LEGIÃO, O PORTA-NAVES' },
  description: 'Porta-naves. Kamikazes e paredes de laser.',
  icon: { sprite: 'legion', scale: 0.7 },
  parTime: 160,
  size: { w: 150, h: 50 },
  timing: { entry: 2.4, transition: 1.8, death: 2.6, homeY: 130 },
  debrisColors: STEEL,
  parts: PARTS,
  phases: PHASES,
});
