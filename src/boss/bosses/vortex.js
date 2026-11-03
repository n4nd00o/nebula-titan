/**
 * Mini-chefe VÓRTICE (Mundo 2) — um furacão de gelo que PUXA a sua nave.
 *
 * Fase 1 (Turbinas): duas turbinas geram a gravidade e disparam correntes de
 *   tiros que fazem CURVA. Cada turbina destruída enfraquece a gravidade, mas
 *   a restante gira mais rápido.
 * Fase 2 (Olho do Furacão): a gravidade pulsa — puxa e EMPURRA a cada ciclo —
 *   enquanto o olho dispara espirais curvas.
 *
 * Tema: controle de posição sob uma força externa. Recompensa: ONDA DE CHOQUE.
 */
import { GAME_WIDTH } from '../../config.js';
import { TAU } from '../../utils/math.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';

const CENTER_X = GAME_WIDTH / 2;
const ICE = ['#73eff7', '#257179', '#f4f4f4'];
const CURVE_L = { kind: 'orb', color: '#73eff7', radius: 4, spin: 0.9 };
const CURVE_R = { kind: 'orb', color: '#73eff7', radius: 4, spin: -0.9 };
const SPIRAL = { kind: 'needle', color: '#41a6f6', radius: 3, spin: 0.55 };
const NEEDLE = { kind: 'needle', color: '#f4f4f4', radius: 3 };

const PARTS = [
  { id: 'ring', name: 'Anel', sprite: 'vortex', ox: 0, oy: 0, look: 'none' },
  {
    id: 'turbineL', name: 'Turbina Esquerda', sprite: 'turbine', ox: -50, oy: 6, hp: 55, phase: 0,
    look: 'husk', points: 2500, debrisColors: ICE, sparksAt: { x: -50, y: 6 },
  },
  {
    id: 'turbineR', name: 'Turbina Direita', sprite: 'turbine', ox: 50, oy: 6, hp: 55, phase: 0,
    look: 'husk', points: 2500, drop: 'shield', debrisColors: ICE, sparksAt: { x: 50, y: 6 },
  },
  {
    id: 'eye', name: 'Olho do Furacão', sprite: 'vortexEye', ox: 0, oy: 0, hp: 120, phase: 1,
    look: 'remove', points: 8000, explosionScale: 2.6, pulse: true, debrisColors: ICE,
  },
];

const turbines = (boss) => [boss.parts.turbineL, boss.parts.turbineR].filter((p) => !p.destroyed);

const PHASES = [
  {
    id: 'turbines',
    title: 'TURBINAS',
    hint: 'A gravidade puxa você! Mova-se contra ela.',
    targets: ['turbineL', 'turbineR'],

    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.5) * 90;
      boss.y = boss.homeY + Math.sin(boss.time * 1.1) * 10;
    },

    attack(boss, dt) {
      const world = boss.world;
      const alive = turbines(boss);
      for (const t of alive) {
        const side = t.id === 'turbineL' ? -1 : 1;
        if (every(boss, `stream_${t.id}`, alive.length === 1 ? 0.22 : 0.34, dt, side < 0 ? 0.6 : 0.8)) {
          const p = boss.worldPoint(t.ox, t.oy + 10);
          fireSpread(world, p.x, p.y, Math.PI / 2 + side * 0.5, 1, 0, 150, side < 0 ? CURVE_L : CURVE_R);
        }
      }
      if (every(boss, 'aimed', 2, dt, 1.2)) {
        fireSpread(world, boss.x, boss.y + 20, aimAtPlayer(world, boss.x, boss.y), 3, 0.4, 200, NEEDLE);
        world.audio.play('enemyShoot');
      }
    },
  },
  {
    id: 'eye',
    title: 'OLHO DO FURACÃO',
    hint: 'A gravidade inverte! Fique atento ao pulso.',
    targets: ['eye'],

    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.7) * 120;
      boss.y = boss.homeY + Math.sin(boss.time * 1.4) * 16;
    },

    attack(boss, dt) {
      const world = boss.world;
      const ratio = boss.parts.eye.healthRatio;
      if (every(boss, 'spiral', ratio < 0.5 ? 0.12 : 0.16, dt, 0.4)) {
        boss.timers.spin = (boss.timers.spin ?? 0) + 0.32;
        fireRing(world, boss.x, boss.y, 3, 120, boss.timers.spin, SPIRAL);
      }
      if (every(boss, 'ring', 2.8, dt, 1.6)) fireRing(world, boss.x, boss.y, 14, 100, boss.time, NEEDLE);
    },
  },
];

export const VORTEX = Object.freeze({
  id: 'vortex',
  name: 'VÓRTICE',
  intro: { title: 'ALVO DETECTADO', subtitle: 'VÓRTICE' },
  description: 'Furacão de gelo. Sua gravidade puxa a nave.',
  icon: { sprite: 'vortex', scale: 0.75 },
  parTime: 130,
  size: { w: 130, h: 50 },
  timing: { entry: 2.4, transition: 1.8, death: 2.4, homeY: 140 },
  debrisColors: ICE,
  parts: PARTS,
  phases: PHASES,

  /** Força que puxa (positiva) ou empurra (negativa) a nave do jogador. */
  pull(boss) {
    if (boss.phaseIndex === 0) {
      const n = turbines(boss).length;
      return n ? { x: boss.x, y: boss.y, strength: 34 + n * 20 } : null;
    }
    // Fase 2: 3 s puxando, 1,5 s empurrando.
    const cycle = boss.time % 4.5;
    return { x: boss.x, y: boss.y, strength: cycle < 3 ? 70 : -90 };
  },

  /** Correntes de vento girando ao redor do Vórtice. */
  drawBehind(ctx, boss) {
    if (boss.state === 'dying') return;
    const force = boss.pullForce();
    const push = force && force.strength < 0;
    ctx.strokeStyle = push ? 'rgba(255, 205, 117, 0.35)' : 'rgba(115, 239, 247, 0.28)';
    ctx.lineWidth = 2;
    const dir = push ? -1 : 1;
    for (let i = 0; i < 4; i++) {
      const r = 40 + ((boss.time * 30 * dir + i * 22) % 88 + 88) % 88;
      const a = boss.time * 2 * dir + i * (TAU / 4);
      ctx.beginPath();
      ctx.arc(0, 0, r, a, a + 1.6);
      ctx.stroke();
    }
  },
});
