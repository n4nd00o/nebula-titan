/**
 * Chefe do Mundo 4: ARCONTE — o comandante da frota, guardião do Leviatã.
 *
 * O Arconte usa a tecnologia de todos os guardiões que você derrotou:
 *   Fase 1 (Cápsulas) ........ cápsulas orbitais, como a Sentinela
 *   Fase 2 (Asas Gravitacionais) gravidade que puxa a nave, como o Vórtice
 *   Fase 3 (Canhão Tesoura) .. dois raios que se fecham como uma tesoura
 *   Fase 4 (Máscara) ......... BLINDADA e sai de fase, como o Espectro
 *   Fase 5 (Núcleo) .......... gravidade pulsante + tudo junto; regenera
 */
import { GAME_WIDTH } from '../../config.js';
import { TAU, lerp, clamp } from '../../utils/math.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';
import { drawBeamWarning, drawLethalBeam } from '../beams.js';
import { resetGhost, updateGhost, isGhost, ghostAlpha } from '../phasing.js';

const CENTER_X = GAME_WIDTH / 2;
const POD_IDS = ['podA', 'podB', 'podC'];
const ROYAL = ['#8e478c', '#5d275d', '#ffcd75', '#e43b8c'];
const SCISSOR = Object.freeze({ warn: 0.8, close: 1.6, hold: 0.4, off: 1.4, open: 1.0, shut: 0.13, width: 14, length: 800 });

const ORB = { kind: 'orb', color: '#e43b8c', radius: 4 };
const GOLD = { kind: 'orb', color: '#ffcd75', radius: 4 };
const NEEDLE = { kind: 'needle', color: '#f4f4f4', radius: 3 };
const CURVE_A = { kind: 'orb', color: '#e43b8c', radius: 4, spin: 0.6 };
const CURVE_B = { kind: 'orb', color: '#e43b8c', radius: 4, spin: -0.6 };
const SHATTER = { kind: 'shard', color: '#ffcd75', radius: 4 };
const BOMBLET = {
  kind: 'shard', color: '#ffcd75', radius: 7,
  split: { at: 0.9, count: 12, speed: 115, ring: true, style: { kind: 'orb', color: '#ffcd75', radius: 4 } },
};

const podDef = (id, drop) => ({
  id, name: 'Cápsula Real', sprite: 'archonPod', ox: 0, oy: 0, hp: 60, phase: 0,
  look: 'remove', points: 3000, drop, debrisColors: ROYAL,
});

const PARTS = [
  { id: 'body', name: 'Casco do Arconte', sprite: 'archon', ox: 0, oy: 0, look: 'none', solidUntilPhase: 3 },
  {
    id: 'wingL', name: 'Asa Gravitacional E', sprite: 'archonWingL', ox: -68, oy: -6, hp: 110, phase: 1,
    look: 'remove', points: 5000, explosionScale: 2.2, sparksAt: { x: -46, y: -6 }, debrisColors: ROYAL,
  },
  {
    id: 'wingR', name: 'Asa Gravitacional D', sprite: 'archonWingR', ox: 68, oy: -6, hp: 110, phase: 1,
    look: 'remove', points: 5000, explosionScale: 2.2, drop: 'double', sparksAt: { x: 46, y: -6 }, debrisColors: ROYAL,
  },
  {
    id: 'cannon', name: 'Canhão Tesoura', sprite: 'archonCannon', ox: 0, oy: 40, hp: 180, phase: 2,
    look: 'husk', points: 8000, drop: 'life', explosionScale: 2.4, debrisColors: ROYAL,
  },
  {
    id: 'mask', name: 'Máscara do Arconte', sprite: 'archonMask', ox: 0, oy: -4, hp: 170, armor: 0.5, phase: 3,
    look: 'remove', points: 10000, explosionScale: 2.6, debrisColors: ['#ffcd75', '#f4f4f4', '#5d275d'],
  },
  {
    id: 'core', name: 'Núcleo do Arconte', sprite: 'archonCore', ox: 0, oy: -4, hp: 260, regen: 3, regenDelay: 1.5,
    phase: 4, requires: 'mask', look: 'remove', points: 30000, pulse: true, explosionScale: 3.4,
    debrisColors: ['#e43b8c', '#ffcd75', '#8e478c'],
  },
  podDef('podA', null),
  podDef('podB', 'shield'),
  podDef('podC', 'rapid'),
];

const alivePods = (boss) => POD_IDS.filter((id) => !boss.parts[id].destroyed);
const muzzle = (boss) => boss.worldPoint(0, 58);

/** Abertura da tesoura (radianos a partir da vertical) e se está letal agora. */
function scissor(boss) {
  const s = boss.vars.scissor;
  if (!s) return null;
  const { warn, close, hold, off, open, shut } = SCISSOR;
  const t = s.t % (warn + close + hold + off);
  if (t < warn) return { spread: open, lethal: false };
  if (t < warn + close) return { spread: lerp(open, shut, (t - warn) / close), lethal: true };
  if (t < warn + close + hold) return { spread: shut, lethal: true };
  return null;
}

const scissorSegments = (boss, spread) => {
  const m = muzzle(boss);
  const center = Math.PI / 2 + clamp(boss.vars.scissorAim ?? 0, -0.35, 0.35);
  return [-1, 1].map((side) => {
    const a = center + side * spread;
    return { x1: m.x, y1: m.y, x2: m.x + Math.cos(a) * SCISSOR.length, y2: m.y + Math.sin(a) * SCISSOR.length, width: SCISSOR.width };
  });
};

const PHASES = [
  {
    id: 'pods',
    title: 'CÁPSULAS REAIS',
    hint: 'A tecnologia da Sentinela. Destrua as cápsulas!',
    targets: POD_IDS,

    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.5) * 90;
      boss.y = boss.homeY + Math.sin(boss.time) * 10;
    },

    attack(boss, dt) {
      const world = boss.world;
      const pods = alivePods(boss);
      pods.forEach((id, i) => {
        if (every(boss, id, 0.6 + pods.length * 0.35, dt, 0.5 + i * 0.4)) {
          const p = boss.worldPoint(boss.parts[id].ox, boss.parts[id].oy);
          fireSpread(world, p.x, p.y, aimAtPlayer(world, p.x, p.y), 2, 0.3, 190, GOLD);
        }
      });
      if (every(boss, 'ring', 2.6, dt, 1.5)) fireRing(world, boss.x, boss.y, 14, 100, boss.time, ORB);
    },
  },
  {
    id: 'wings',
    title: 'ASAS GRAVITACIONAIS',
    hint: 'A gravidade do Vórtice! Lute contra a corrente.',
    targets: ['wingL', 'wingR'],

    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.4) * 70;
      boss.y = boss.homeY + Math.sin(boss.time * 0.8) * 8;
    },

    attack(boss, dt) {
      const world = boss.world;
      for (const [id, side] of [['wingL', -1], ['wingR', 1]]) {
        if (boss.parts[id].destroyed) continue;
        if (every(boss, id, 0.3, dt, side < 0 ? 0.3 : 0.45)) {
          const p = boss.worldPoint(boss.parts[id].ox + side * 10, boss.parts[id].oy + 14);
          fireSpread(world, p.x, p.y, Math.PI / 2 + side * 0.4, 1, 0, 140, side < 0 ? CURVE_A : CURVE_B);
        }
      }
      if (every(boss, 'aimed', 1.6, dt, 0.8)) {
        fireSpread(world, boss.x, boss.y + 30, aimAtPlayer(world, boss.x, boss.y), 5, 0.6, 200, NEEDLE);
        world.audio.play('enemyShoot');
      }
    },
  },
  {
    id: 'scissor',
    title: 'CANHÃO TESOURA',
    hint: 'Os raios se fecham: fique no meio ou bem nas bordas!',
    targets: ['cannon'],
    bombRefill: true,
    onStart(boss) {
      boss.vars.scissor = { t: 0 };
      boss.vars.scissorAim = 0;
    },

    move(boss, dt) {
      boss.vars.scissor.t += dt;
      const s = scissor(boss);
      // Entre um corte e outro, o Arconte reposiciona a tesoura na direção do jogador.
      if (!s || !s.lethal) {
        const m = muzzle(boss);
        const aim = Math.atan2(boss.world.player.y - m.y, boss.world.player.x - m.x) - Math.PI / 2;
        boss.vars.scissorAim += (aim - boss.vars.scissorAim) * Math.min(1, dt * 3);
        boss.x += (CENTER_X + Math.sin(boss.time * 0.5) * 60 - boss.x) * Math.min(1, dt);
      }
      boss.y = boss.homeY + Math.sin(boss.time) * 6;
    },

    attack(boss, dt) {
      const world = boss.world;
      const s = scissor(boss);
      if ((!s || !s.lethal) && every(boss, 'aimed', 0.7, dt, 0.4)) {
        fireSpread(world, boss.x, boss.y + 20, aimAtPlayer(world, boss.x, boss.y), 3, 0.3, 200, NEEDLE);
      }
      if (every(boss, 'wave', 8, dt, 3)) world.spawnMinionWave(3, { type: 'red' });
    },
  },
  {
    id: 'mask',
    title: 'MÁSCARA',
    hint: 'Blindada e espectral! Atire quando ela estiver sólida.',
    targets: ['mask'],
    onStart: resetGhost,

    move(boss, dt) {
      updateGhost(boss, dt, {
        solid: 3,
        gone: 1.2,
        onAppear: (b) => fireRing(b.world, b.x, b.y, 18, 110, b.time, ORB),
      });
      const v = boss.vars;
      v.homeX ??= CENTER_X;
      boss.x += (v.homeX - boss.x) * Math.min(1, dt * 3);
      boss.y = boss.homeY + Math.sin(boss.time * 1.3) * 14;
    },

    attack(boss, dt) {
      const world = boss.world;
      if (every(boss, 'curves', 0.4, dt, 0.3)) {
        const a = aimAtPlayer(world, boss.x, boss.y);
        fireSpread(world, boss.x, boss.y, a - 0.7, 1, 0, 140, CURVE_A);
        fireSpread(world, boss.x, boss.y, a + 0.7, 1, 0, 140, CURVE_B);
      }
      if (!isGhost(boss) && every(boss, 'bomblet', 2, dt, 1)) {
        fireSpread(world, boss.x, boss.y + 20, aimAtPlayer(world, boss.x, boss.y), 1, 0, 150, BOMBLET);
      }
    },
  },
  {
    id: 'core',
    title: 'NÚCLEO DO ARCONTE',
    hint: 'Tudo o que você enfrentou, de uma vez só!',
    targets: ['core'],
    enrage: true,
    bombRefill: true,
    onStart(boss) {
      boss.vars.ghost = null;
    },

    move(boss) {
      const t = boss.time * 0.75;
      boss.x = CENTER_X + Math.sin(t) * 120;
      boss.y = boss.homeY + Math.sin(t * 2) * 24;
    },

    attack(boss, dt) {
      const world = boss.world;
      const ratio = boss.parts.core.healthRatio;
      if (every(boss, 'spiral', ratio < 0.5 ? 0.11 : 0.15, dt, 0.5)) {
        boss.timers.spin = (boss.timers.spin ?? 0) + 0.31;
        fireRing(world, boss.x, boss.y, 3, 125, boss.timers.spin, ORB);
      }
      if (every(boss, 'bomblet', 2.4, dt, 1.2)) {
        fireSpread(world, boss.x, boss.y, aimAtPlayer(world, boss.x, boss.y), 2, 1, 150, BOMBLET);
      }
      if (every(boss, 'wave', 7, dt, 3)) world.spawnMinionWave(4, { orange: 1, type: 'red' });
    },
  },
];

export const ARCHON = Object.freeze({
  id: 'archon',
  name: 'ARCONTE',
  intro: { title: 'ALERTA!', subtitle: 'O ARCONTE BLOQUEIA O CAMINHO' },
  description: 'O comandante da frota. Usa a tecnologia de todos os guardiões.',
  icon: { sprite: 'archon', scale: 0.7 },
  parTime: 360,
  size: { w: 200, h: 100 },
  rageSprite: 'archon',
  music: 'boss',
  timing: { entry: 3.4, transition: 2.4, death: 3.6, homeY: 140 },
  debrisColors: ROYAL,
  parts: PARTS,
  phases: PHASES,

  intangible: (boss) => boss.phaseIndex === 3 && isGhost(boss),
  alpha: (boss) => (boss.phaseIndex === 3 ? ghostAlpha(boss) : 1),

  update(boss, dt) {
    const v = boss.vars;
    v.podAngle = (v.podAngle ?? 0) + (1 + (3 - alivePods(boss).length) * 0.5) * dt;
    POD_IDS.forEach((id, i) => {
      const a = v.podAngle + (i * TAU) / 3;
      boss.parts[id].ox = Math.cos(a) * 84;
      boss.parts[id].oy = Math.sin(a) * 62;
    });
  },

  onPartDestroyed(boss, part) {
    if (!part.id.startsWith('pod')) return;
    const p = boss.worldPoint(part.ox, part.oy);
    fireRing(boss.world, p.x, p.y, 8, 90, boss.time, SHATTER);
  },

  /** Gravidade: puxa enquanto as asas existem (fase 2) e pulsa no núcleo (fase 5). */
  pull(boss) {
    if (boss.phaseIndex === 1) {
      const wings = ['wingL', 'wingR'].filter((id) => !boss.parts[id].destroyed).length;
      return wings ? { x: boss.x, y: boss.y, strength: 30 + wings * 22 } : null;
    }
    if (boss.phaseIndex === 4) {
      const cycle = boss.time % 5;
      return { x: boss.x, y: boss.y, strength: cycle < 3.4 ? 55 : -80 };
    }
    return null;
  },

  segments(boss) {
    if (boss.phaseIndex !== 2) return [];
    const s = scissor(boss);
    return s?.lethal ? scissorSegments(boss, s.spread) : [];
  },

  drawWorld(ctx, boss) {
    if (boss.phaseIndex !== 2 || boss.state !== 'fight') return;
    const s = scissor(boss);
    if (!s) return;
    for (const seg of scissorSegments(boss, s.spread)) {
      if (s.lethal) drawLethalBeam(ctx, seg, ['rgba(228, 59, 140, 0.35)', 'rgba(255, 205, 117, 0.9)']);
      else drawBeamWarning(ctx, seg.x1, seg.y1, seg.x2, seg.y2, boss.time);
    }
  },
});
