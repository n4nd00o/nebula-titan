/**
 * Mini-chefe ESCARAVELHO (Mundo 2) — um besouro blindado que só se abre às vezes.
 *
 * Fase 1 (Mandíbulas): investidas laterais rápidas; as mandíbulas atiram leques.
 * Fase 2 (Carapaça): o núcleo fica protegido por duas metades de carapaça
 *   INDESTRUTÍVEIS. Elas se ABREM por alguns segundos (janela de ataque) e
 *   fecham de novo; ao abrir, o besouro solta um anel de projéteis.
 *
 * Tema: paciência e janela de ataque. Recompensa: CARAPAÇA (escudo que regenera).
 */
import { GAME_WIDTH } from '../../config.js';
import { approach } from '../../utils/math.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';

const CENTER_X = GAME_WIDTH / 2;
const BUG = ['#38b764', '#a7f070', '#257179'];
const SHELL_CLOSED = 12;
const SHELL_OPEN = 44;
const OPEN_TIME = 2.4;
const CLOSED_TIME = 2.6;

const NEEDLE = { kind: 'needle', color: '#a7f070', radius: 3 };
const ORB = { kind: 'orb', color: '#38b764', radius: 4 };
const MINE = { kind: 'mine', color: '#a7f070', radius: 5, homing: 1.8, turnRate: 1.6, life: 6 };

const PARTS = [
  {
    id: 'core', name: 'Núcleo do Escaravelho', sprite: 'scarabCore', ox: 0, oy: 0, hp: 130, phase: 1,
    look: 'remove', points: 8000, explosionScale: 2.6, debrisColors: BUG,
  },
  { id: 'shellL', name: 'Carapaça E', sprite: 'shellL', ox: -SHELL_CLOSED, oy: 0, look: 'none' },
  { id: 'shellR', name: 'Carapaça D', sprite: 'shellR', ox: SHELL_CLOSED, oy: 0, look: 'none' },
  {
    id: 'mandibleL', name: 'Mandíbula E', sprite: 'mandibleL', ox: -16, oy: 30, hp: 45, phase: 0,
    look: 'remove', points: 2500, debrisColors: BUG,
  },
  {
    id: 'mandibleR', name: 'Mandíbula D', sprite: 'mandibleR', ox: 16, oy: 30, hp: 45, phase: 0,
    look: 'remove', points: 2500, drop: 'shield', debrisColors: BUG,
  },
];

/** Ciclo da carapaça: aberta -> fechando -> fechada -> abrindo. */
function updateShell(boss, dt) {
  const s = (boss.vars.shell ??= { open: true, t: 0 });
  s.t += dt;
  if (s.open && s.t >= OPEN_TIME) {
    s.open = false;
    s.t = 0;
  } else if (!s.open && s.t >= CLOSED_TIME) {
    s.open = true;
    s.t = 0;
    fireRing(boss.world, boss.x, boss.y, 16, 110, boss.time, ORB);
    boss.world.audio.play('enemyShoot');
  }
}

const PHASES = [
  {
    id: 'mandibles',
    title: 'MANDÍBULAS',
    hint: 'Ele investe para os lados. Mire nas mandíbulas!',
    targets: ['mandibleL', 'mandibleR'],

    move(boss, dt) {
      // Investidas laterais: escolhe um ponto e corre até ele.
      const v = boss.vars;
      v.targetX ??= CENTER_X;
      v.wait = (v.wait ?? 0) - dt;
      if (v.wait <= 0 && Math.abs(boss.x - v.targetX) < 2) {
        v.targetX = boss.x < CENTER_X ? CENTER_X + 140 : CENTER_X - 140;
        v.wait = 1.6;
      }
      boss.x = approach(boss.x, v.targetX, 260 * dt);
      boss.y = boss.homeY + Math.sin(boss.time * 3) * 6;
    },

    attack(boss, dt) {
      const world = boss.world;
      for (const [id, side] of [['mandibleL', -1], ['mandibleR', 1]]) {
        if (boss.parts[id].destroyed) continue;
        if (every(boss, id, 1.5, dt, side < 0 ? 0.6 : 1.3)) {
          const p = boss.worldPoint(boss.parts[id].ox, boss.parts[id].oy + 12);
          fireSpread(world, p.x, p.y, aimAtPlayer(world, p.x, p.y), 4, 0.6, 180, NEEDLE);
          world.audio.play('enemyShoot');
        }
      }
    },
  },
  {
    id: 'shell',
    title: 'CARAPAÇA',
    hint: 'Ataque quando a carapaça abrir!',
    targets: ['core'],
    onStart(boss) {
      boss.vars.shell = { open: true, t: 0 };
      boss.parts.shellL.ox = -SHELL_OPEN;
      boss.parts.shellR.ox = SHELL_OPEN;
    },

    move(boss, dt) {
      updateShell(boss, dt);
      boss.x = CENTER_X + Math.sin(boss.time * 0.6) * 120;
      boss.y = boss.homeY + Math.sin(boss.time * 1.3) * 14;
    },

    attack(boss, dt) {
      const world = boss.world;
      const open = boss.vars.shell?.open;
      if (!open && every(boss, 'mines', 1.4, dt, 0.4)) {
        fireSpread(world, boss.x, boss.y + 24, Math.PI / 2, 2, 1.2, 100, MINE);
      }
      if (open && every(boss, 'aimed', 0.7, dt, 0.3)) {
        fireSpread(world, boss.x, boss.y + 20, aimAtPlayer(world, boss.x, boss.y), 3, 0.3, 210, NEEDLE);
      }
    },
  },
];

export const SCARAB = Object.freeze({
  id: 'scarab',
  name: 'ESCARAVELHO',
  intro: { title: 'ALVO DETECTADO', subtitle: 'ESCARAVELHO' },
  description: 'Besouro blindado. Só abre a carapaça às vezes.',
  icon: { sprite: 'scarabCore', scale: 1.1 },
  parTime: 130,
  size: { w: 90, h: 60 },
  timing: { entry: 2.4, transition: 1.8, death: 2.4, homeY: 140 },
  debrisColors: BUG,
  parts: PARTS,
  phases: PHASES,

  /** Abre e fecha as metades da carapaça suavemente. */
  update(boss, dt) {
    const open = boss.phaseIndex === 1 && boss.vars.shell?.open && boss.state === 'fight';
    const target = open ? SHELL_OPEN : SHELL_CLOSED;
    boss.parts.shellL.ox = approach(boss.parts.shellL.ox, -target, 140 * dt);
    boss.parts.shellR.ox = approach(boss.parts.shellR.ox, target, 140 * dt);
  },

  tilt(boss) {
    const L = boss.parts.mandibleL.destroyed;
    const R = boss.parts.mandibleR.destroyed;
    if (L && !R) return -0.12;
    if (R && !L) return 0.12;
    return 0;
  },
});
