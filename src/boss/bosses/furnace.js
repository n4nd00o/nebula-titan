/**
 * Mini-chefe FORNALHA (Mundo 3) — um alto-forno voador que despeja fogo.
 *
 * Fase 1 (Chaminés): três chaminés na parte de baixo marcam o chão com uma
 *   faixa de aviso e despejam COLUNAS DE FOGO letais. Menos chaminés = ciclo
 *   mais rápido. Brasas caem acelerando.
 * Fase 2 (Núcleo Derretido): o casco abre e o núcleo gira dois RAIOS DE FOGO
 *   como ponteiros de relógio (alcance limitado: fique longe ou dê a volta).
 *
 * Recompensa: MÍSSEIS TELEGUIADOS.
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../../config.js';
import { rand } from '../../utils/math.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';
import { drawLethalBeam } from '../beams.js';

const CENTER_X = GAME_WIDTH / 2;
const VENT_IDS = ['ventL', 'ventC', 'ventR'];
const COLUMN = Object.freeze({ warn: 0.9, fire: 0.9, width: 30 });
const ARM_LENGTH = 270;
const FIRE = ['#ef7d57', '#ffcd75', '#b13e53'];
const EMBER = { kind: 'orb', color: '#ef7d57', radius: 3, accel: 120, maxSpeed: 260 };
const NEEDLE = { kind: 'needle', color: '#ffcd75', radius: 3 };
const ORB = { kind: 'orb', color: '#b13e53', radius: 4 };

const ventDef = (id, ox, drop) => ({
  id, name: 'Chaminé', sprite: 'vent', ox, oy: 32, hp: 50, phase: 0,
  look: 'remove', points: 3000, drop, debrisColors: FIRE, sparksAt: { x: ox, y: 24 },
});

const PARTS = [
  { id: 'body', name: 'Casco da Fornalha', sprite: 'furnace', ox: 0, oy: 0, look: 'none', solidUntilPhase: 1 },
  {
    id: 'core', name: 'Núcleo Derretido', sprite: 'furnaceCore', ox: 0, oy: 3, hp: 170, phase: 1,
    look: 'remove', points: 9000, pulse: true, explosionScale: 2.8, debrisColors: FIRE,
  },
  ventDef('ventL', -54, null),
  ventDef('ventC', 0, 'shield'),
  ventDef('ventR', 54, null),
];

const aliveVents = (boss) => VENT_IDS.filter((id) => !boss.parts[id].destroyed);

/** Colunas de fogo: cada chaminé alterna entre espera, aviso e fogo. */
function updateColumns(boss, dt) {
  const cols = (boss.vars.columns ??= {});
  const vents = aliveVents(boss);
  const interval = 1.6 + vents.length * 0.7;
  vents.forEach((id, i) => {
    const c = (cols[id] ??= { stage: 'wait', t: -i * (interval / vents.length), x: 0 });
    c.t += dt;
    if (c.stage === 'wait' && c.t >= interval - COLUMN.warn - COLUMN.fire) {
      c.stage = 'warn';
      c.t = 0;
      c.x = boss.worldPoint(boss.parts[id].ox, 0).x;
      boss.world.audio.play('dashWarn');
    } else if (c.stage === 'warn' && c.t >= COLUMN.warn) {
      c.stage = 'fire';
      c.t = 0;
      boss.world.audio.play('laserFire');
      boss.world.shake(3, COLUMN.fire);
    } else if (c.stage === 'fire' && c.t >= COLUMN.fire) {
      c.stage = 'wait';
      c.t = 0;
    }
  });
  for (const id of Object.keys(cols)) if (boss.parts[id].destroyed) delete cols[id];
}

const columnTop = (boss) => boss.y + 44;

const PHASES = [
  {
    id: 'vents',
    title: 'CHAMINÉS',
    hint: 'Saia das faixas antes do fogo descer!',
    targets: VENT_IDS,
    onStart(boss) {
      boss.vars.columns = {};
    },

    move(boss, dt) {
      updateColumns(boss, dt);
      const busy = Object.values(boss.vars.columns).some((c) => c.stage !== 'wait');
      if (!busy) boss.x += (CENTER_X + Math.sin(boss.time * 0.5) * 120 - boss.x) * Math.min(1, dt * 1.5);
      boss.y = boss.homeY + Math.sin(boss.time * 1.1) * 6;
    },

    attack(boss, dt) {
      const world = boss.world;
      if (every(boss, 'embers', 0.5, dt, 0.5)) {
        fireSpread(world, rand(30, GAME_WIDTH - 30), boss.y + 30, Math.PI / 2, 1, 0, 60, EMBER);
      }
      if (every(boss, 'aimed', 1.8, dt, 1)) {
        fireSpread(world, boss.x, boss.y + 30, aimAtPlayer(world, boss.x, boss.y), 3, 0.35, 190, NEEDLE);
        world.audio.play('enemyShoot');
      }
    },
  },
  {
    id: 'core',
    title: 'NÚCLEO DERRETIDO',
    hint: 'Raios giratórios! Fique fora do alcance ou dê a volta.',
    targets: ['core'],
    enrage: true,
    onStart(boss) {
      boss.vars.armAngle = 0;
      boss.vars.armWarm = 0;
    },

    move(boss, dt) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.5) * 70;
      boss.y = boss.homeY + Math.sin(boss.time * 1.2) * 10;
      const ratio = boss.parts.core.healthRatio;
      boss.vars.armWarm += dt;
      boss.vars.armAngle += (ratio < 0.5 ? 1.15 : 0.85) * dt;
    },

    attack(boss, dt) {
      const world = boss.world;
      if (every(boss, 'embers', 0.32, dt, 0.4)) {
        fireSpread(world, rand(20, GAME_WIDTH - 20), 70, Math.PI / 2, 1, 0, 50, EMBER);
      }
      if (every(boss, 'ring', 2.6, dt, 1.4)) fireRing(world, boss.x, boss.y, 14, 100, boss.time, ORB);
    },
  },
];

export const FURNACE = Object.freeze({
  id: 'furnace',
  name: 'FORNALHA',
  intro: { title: 'ALVO DETECTADO', subtitle: 'FORNALHA' },
  description: 'Alto-forno voador. Despeja colunas de fogo.',
  icon: { sprite: 'furnace', scale: 0.7 },
  parTime: 140,
  size: { w: 110, h: 60 },
  timing: { entry: 2.4, transition: 1.8, death: 2.4, homeY: 120 },
  debrisColors: FIRE,
  rageSprite: 'furnace',
  parts: PARTS,
  phases: PHASES,

  segments(boss) {
    if (boss.state !== 'fight') return [];
    if (boss.phaseIndex === 0) {
      return Object.values(boss.vars.columns ?? {})
        .filter((c) => c.stage === 'fire')
        .map((c) => ({ x1: c.x, y1: columnTop(boss), x2: c.x, y2: GAME_HEIGHT + 10, width: COLUMN.width }));
    }
    // Os raios só ficam letais depois de 1 s (aviso no começo da fase).
    if ((boss.vars.armWarm ?? 0) < 1) return [];
    return [0, Math.PI].map((offset) => {
      const a = boss.vars.armAngle + offset;
      return { x1: boss.x, y1: boss.y, x2: boss.x + Math.cos(a) * ARM_LENGTH, y2: boss.y + Math.sin(a) * ARM_LENGTH, width: 16 };
    });
  },

  drawWorld(ctx, boss) {
    if (boss.state !== 'fight') return;
    const colors = ['rgba(239, 125, 87, 0.35)', 'rgba(255, 205, 117, 0.9)'];
    if (boss.phaseIndex === 0) {
      for (const c of Object.values(boss.vars.columns ?? {})) {
        if (c.stage === 'warn') {
          const blink = Math.floor(c.t * 12) % 2 === 0;
          ctx.fillStyle = blink ? 'rgba(239, 125, 87, 0.28)' : 'rgba(239, 125, 87, 0.1)';
          ctx.fillRect(c.x - COLUMN.width / 2, columnTop(boss), COLUMN.width, GAME_HEIGHT);
        } else if (c.stage === 'fire') {
          drawLethalBeam(ctx, { x1: c.x, y1: columnTop(boss), x2: c.x, y2: GAME_HEIGHT + 10, width: COLUMN.width }, colors);
        }
      }
      return;
    }
    const warm = (boss.vars.armWarm ?? 0) < 1;
    for (const offset of [0, Math.PI]) {
      const a = boss.vars.armAngle + offset;
      const seg = { x1: boss.x, y1: boss.y, x2: boss.x + Math.cos(a) * ARM_LENGTH, y2: boss.y + Math.sin(a) * ARM_LENGTH, width: 16 };
      if (warm) {
        if (Math.floor(boss.time * 14) % 2 === 0) {
          ctx.strokeStyle = 'rgba(255, 205, 117, 0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        }
      } else {
        drawLethalBeam(ctx, seg, colors);
      }
    }
    // Círculo do alcance máximo dos raios.
    ctx.strokeStyle = 'rgba(239, 125, 87, 0.25)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, ARM_LENGTH, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
});
