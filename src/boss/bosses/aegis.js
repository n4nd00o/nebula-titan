/**
 * Chefe do Mundo 3: ÉGIDE — a fortaleza-escudo da Forja Estelar.
 *
 * Fase 1 (Baterias): quatro canhões nos cantos atiram em leque.
 * Fase 2 (Anel de Escudo): seis segmentos BLINDADOS giram em volta da
 *   fortaleza; cada segmento destruído faz os outros girarem mais rápido.
 * Fase 3 (Arma Principal): um canhão de raio carrega (aviso), dispara e
 *   VARRE a tela em direção à nave.
 * Fase 4 (Núcleo): o casco abre; o núcleo regenera e a Égide enfurece.
 */
import { GAME_WIDTH } from '../../config.js';
import { clamp, TAU } from '../../utils/math.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';
import { drawBeamWarning, drawLethalBeam } from '../beams.js';

const CENTER_X = GAME_WIDTH / 2;
const CANNON_IDS = ['cannonA', 'cannonB', 'cannonC', 'cannonD'];
const SEGMENT_IDS = ['segA', 'segB', 'segC', 'segD', 'segE', 'segF'];
const RING_RX = 84;
const RING_RY = 58;
const BEAM = Object.freeze({ rest: 1.8, charge: 1.1, fire: 1.8, width: 24, length: 800, sweep: 0.55 });
const STEEL = ['#566c86', '#94b0c2', '#41a6f6', '#333c57'];

const ORB = { kind: 'orb', color: '#41a6f6', radius: 4 };
const NEEDLE = { kind: 'needle', color: '#ffcd75', radius: 3 };
const BIG = { kind: 'orb', color: '#b13e53', radius: 7 };
const CURVE_A = { kind: 'orb', color: '#73eff7', radius: 4, spin: 0.6 };
const CURVE_B = { kind: 'orb', color: '#73eff7', radius: 4, spin: -0.6 };
const BOMBLET = {
  kind: 'shard', color: '#ef7d57', radius: 7,
  split: { at: 0.9, count: 10, speed: 120, ring: true, style: { kind: 'orb', color: '#ef7d57', radius: 4 } },
};

const cannonDef = (id, ox, oy, drop) => ({
  id, name: 'Canhão de Canto', sprite: 'aegisCannon', ox, oy, hp: 55, phase: 0,
  look: 'husk', points: 3000, drop, debrisColors: STEEL,
});
const segmentDef = (id, drop) => ({
  id, name: 'Segmento do Escudo', sprite: 'aegisShield', ox: 0, oy: 0, hp: 45, armor: 0.4, phase: 1, visibleFromPhase: 1,
  look: 'remove', points: 2500, drop, debrisColors: ['#73eff7', '#94b0c2'],
});

const PARTS = [
  { id: 'body', name: 'Fortaleza', sprite: 'aegisBody', ox: 0, oy: 0, look: 'none', solidUntilPhase: 3 },
  {
    id: 'core', name: 'Núcleo da Égide', sprite: 'aegisCore', ox: 0, oy: 0, hp: 210, regen: 2, regenDelay: 1.6,
    phase: 3, visibleFromPhase: 3, look: 'remove', points: 20000, pulse: true, explosionScale: 3.2,
    debrisColors: ['#73eff7', '#f4f4f4', '#e43b8c'],
  },
  {
    id: 'gun', name: 'Arma Principal', sprite: 'aegisGun', ox: 0, oy: 40, hp: 160, phase: 2,
    look: 'husk', points: 8000, drop: 'life', explosionScale: 2.4, debrisColors: STEEL,
  },
  cannonDef('cannonA', -62, 4, null),
  cannonDef('cannonB', 62, 4, 'double'),
  cannonDef('cannonC', -30, 34, 'shield'),
  cannonDef('cannonD', 30, 34, null),
  segmentDef('segA', null),
  segmentDef('segB', 'shield'),
  segmentDef('segC', null),
  segmentDef('segD', 'rapid'),
  segmentDef('segE', null),
  segmentDef('segF', null),
];

const aliveSegments = (boss) => SEGMENT_IDS.filter((id) => !boss.parts[id].destroyed);
const muzzle = (boss) => boss.worldPoint(0, 60);

function updateBeam(boss, dt) {
  const b = (boss.vars.beam ??= { stage: 'rest', t: 0, angle: Math.PI / 2 });
  b.t += dt;
  const world = boss.world;
  const m = muzzle(boss);
  const toPlayer = clamp(Math.atan2(world.player.y - m.y, world.player.x - m.x), 0.35, Math.PI - 0.35);
  if (b.stage === 'rest' && b.t >= BEAM.rest) {
    b.stage = 'charge';
    b.t = 0;
    // Mira um pouco ao lado do jogador e varre por cima dele.
    b.angle = clamp(toPlayer + (Math.random() < 0.5 ? -0.5 : 0.5), 0.35, Math.PI - 0.35);
    world.audio.play('laserCharge');
  } else if (b.stage === 'charge') {
    world.particles.charge(m.x, m.y, '#41a6f6');
    if (b.t >= BEAM.charge) {
      b.stage = 'fire';
      b.t = 0;
      b.dir = Math.sign(toPlayer - b.angle) || 1;
      world.audio.play('laserFire');
      world.shake(3, BEAM.fire);
    }
  } else if (b.stage === 'fire') {
    b.angle = clamp(b.angle + b.dir * BEAM.sweep * dt, 0.3, Math.PI - 0.3);
    if (b.t >= BEAM.fire) {
      b.stage = 'rest';
      b.t = 0;
    }
  }
}

const PHASES = [
  {
    id: 'cannons',
    title: 'BATERIAS',
    hint: 'Destrua os quatro canhões!',
    targets: CANNON_IDS,

    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.5) * 100;
      boss.y = boss.homeY + Math.sin(boss.time * 1) * 10;
    },

    attack(boss, dt) {
      const world = boss.world;
      CANNON_IDS.filter((id) => !boss.parts[id].destroyed).forEach((id, i) => {
        if (every(boss, id, 1.9, dt, 0.5 + i * 0.45)) {
          const part = boss.parts[id];
          const p = boss.worldPoint(part.ox, part.oy + 14);
          fireSpread(world, p.x, p.y, aimAtPlayer(world, p.x, p.y), 3, 0.4, 185, NEEDLE);
          world.audio.play('enemyShoot');
        }
      });
      if (every(boss, 'ring', 3.4, dt, 2)) fireRing(world, boss.x, boss.y, 14, 95, boss.time, ORB);
    },
  },
  {
    id: 'ring',
    title: 'ANEL DE ESCUDO',
    hint: 'Segmentos blindados giram: acerte quando passarem embaixo.',
    targets: SEGMENT_IDS,
    bombRefill: true,

    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.4) * 80;
      boss.y = boss.homeY + Math.sin(boss.time * 0.8) * 8;
    },

    attack(boss, dt) {
      const world = boss.world;
      for (const id of aliveSegments(boss)) {
        if (every(boss, id, 2.6, dt, 0.4 + SEGMENT_IDS.indexOf(id) * 0.4)) {
          const p = boss.worldPoint(boss.parts[id].ox, boss.parts[id].oy);
          fireSpread(world, p.x, p.y, aimAtPlayer(world, p.x, p.y), 1, 0, 200, NEEDLE);
        }
      }
      if (every(boss, 'curve', 0.35, dt, 0.6)) {
        fireSpread(world, boss.x - 40, boss.y + 20, Math.PI / 2 + 0.6, 1, 0, 130, CURVE_B);
        fireSpread(world, boss.x + 40, boss.y + 20, Math.PI / 2 - 0.6, 1, 0, 130, CURVE_A);
      }
    },
  },
  {
    id: 'gun',
    title: 'ARMA PRINCIPAL',
    hint: 'O raio varre a tela: passe por trás dele!',
    targets: ['gun'],
    onStart(boss) {
      boss.vars.beam = { stage: 'rest', t: 0.6, angle: Math.PI / 2 };
    },

    move(boss, dt) {
      updateBeam(boss, dt);
      if (boss.vars.beam.stage === 'rest') boss.x += (CENTER_X + Math.sin(boss.time * 0.6) * 100 - boss.x) * Math.min(1, dt * 1.5);
      boss.y = boss.homeY + Math.sin(boss.time) * 6;
    },

    attack(boss, dt) {
      const world = boss.world;
      if (every(boss, 'side', 1.3, dt, 0.6)) {
        for (const side of [-1, 1]) {
          const p = boss.worldPoint(side * 60, 4);
          fireSpread(world, p.x, p.y, aimAtPlayer(world, p.x, p.y), 2, 0.25, 190, ORB);
        }
      }
      if (every(boss, 'wave', 9, dt, 4)) world.spawnMinionWave(3, { type: 'purple' });
    },
  },
  {
    id: 'core',
    title: 'NÚCLEO DA ÉGIDE',
    hint: 'Ele regenera! Mantenha a pressão.',
    targets: ['core'],
    enrage: true,
    bombRefill: true,

    move(boss) {
      const t = boss.time * 0.8;
      boss.x = CENTER_X + Math.sin(t) * 130;
      boss.y = boss.homeY + Math.sin(t * 2) * 26;
    },

    attack(boss, dt) {
      const world = boss.world;
      const ratio = boss.parts.core.healthRatio;
      if (every(boss, 'spiral', ratio < 0.5 ? 0.11 : 0.15, dt, 0.5)) {
        boss.timers.spin = (boss.timers.spin ?? 0) + 0.29;
        fireRing(world, boss.x, boss.y, 2, 130, boss.timers.spin, CURVE_A);
        fireRing(world, boss.x, boss.y, 2, 130, -boss.timers.spin, CURVE_B);
      }
      if (every(boss, 'bomblet', 2.2, dt, 1.2)) {
        fireSpread(world, boss.x, boss.y, aimAtPlayer(world, boss.x, boss.y), 1, 0, 150, BOMBLET);
      }
      if (every(boss, 'big', 1.7, dt, 0.8)) {
        fireSpread(world, boss.x, boss.y, aimAtPlayer(world, boss.x, boss.y), 1, 0, 230, BIG);
      }
    },
  },
];

export const AEGIS = Object.freeze({
  id: 'aegis',
  name: 'ÉGIDE',
  intro: { title: 'ALERTA!', subtitle: 'FORTALEZA ÉGIDE SE APROXIMANDO' },
  description: 'Fortaleza-escudo. Anel giratório e um canhão de raio.',
  icon: { sprite: 'aegisBody', scale: 0.7 },
  parTime: 320,
  size: { w: 180, h: 100 },
  rageSprite: 'aegisBody',
  music: 'boss',
  timing: { entry: 3.2, transition: 2.4, death: 3.4, homeY: 140 },
  debrisColors: STEEL,
  parts: PARTS,
  phases: PHASES,

  /** Os segmentos do escudo giram em elipse; menos segmentos = mais rápido. */
  update(boss, dt) {
    const v = boss.vars;
    const left = aliveSegments(boss).length;
    v.ringAngle = (v.ringAngle ?? 0) + (0.6 + (6 - left) * 0.18) * dt;
    SEGMENT_IDS.forEach((id, i) => {
      const a = v.ringAngle + (i * TAU) / SEGMENT_IDS.length;
      boss.parts[id].ox = Math.cos(a) * RING_RX;
      boss.parts[id].oy = Math.sin(a) * RING_RY;
    });
  },

  segments(boss) {
    const b = boss.vars.beam;
    if (boss.phaseIndex !== 2 || !b || b.stage !== 'fire') return [];
    const m = muzzle(boss);
    return [{ x1: m.x, y1: m.y, x2: m.x + Math.cos(b.angle) * BEAM.length, y2: m.y + Math.sin(b.angle) * BEAM.length, width: BEAM.width }];
  },

  drawWorld(ctx, boss) {
    const b = boss.vars.beam;
    if (boss.phaseIndex !== 2 || !b || boss.state !== 'fight' || b.stage === 'rest') return;
    const m = muzzle(boss);
    const x2 = m.x + Math.cos(b.angle) * BEAM.length;
    const y2 = m.y + Math.sin(b.angle) * BEAM.length;
    if (b.stage === 'charge') drawBeamWarning(ctx, m.x, m.y, x2, y2, b.t, 'rgba(65, 166, 246, 0.85)');
    else drawLethalBeam(ctx, { x1: m.x, y1: m.y, x2, y2, width: BEAM.width }, ['rgba(65, 166, 246, 0.35)', 'rgba(115, 239, 247, 0.9)']);
  },
});
