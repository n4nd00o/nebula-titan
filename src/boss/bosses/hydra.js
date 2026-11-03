/**
 * Chefe do Mundo 2: HIDRA GLACIAL — um dragão de gelo de três cabeças.
 *
 * Fase 1 (Cabeças Gêmeas): as cabeças laterais atiram cristais. Se você cortar
 *   só uma, ela RENASCE depois de 9 s: é preciso derrubar as duas em sequência.
 * Fase 2 (Cabeça Central): a cabeça do meio carrega um SOPRO CONGELANTE
 *   (raio letal com aviso) que varre a tela em direção à nave.
 * Fase 3 (Escamas de Gelo): quatro escamas BLINDADAS protegem o peito.
 * Fase 4 (Coração): o coração fica exposto e regenera; a Hidra enfurece.
 */
import { GAME_WIDTH } from '../../config.js';
import { clamp } from '../../utils/math.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';
import { drawBeamWarning, drawLethalBeam } from '../beams.js';

const CENTER_X = GAME_WIDTH / 2;
const REGROW_TIME = 9;
const ICE = ['#73eff7', '#41a6f6', '#257179', '#f4f4f4'];
const SCALE_IDS = ['scaleA', 'scaleB', 'scaleC', 'scaleD'];

const SPLITTER = {
  kind: 'shard', color: '#73eff7', radius: 5,
  split: { at: 0.8, count: 4, spread: 0.9, speed: 160, style: { kind: 'needle', color: '#73eff7', radius: 3 } },
};
const BOMBLET = {
  kind: 'shard', color: '#41a6f6', radius: 7,
  split: { at: 1, count: 12, speed: 110, ring: true, style: { kind: 'orb', color: '#41a6f6', radius: 4 } },
};
const ORB = { kind: 'orb', color: '#73eff7', radius: 4 };
const NEEDLE = { kind: 'needle', color: '#f4f4f4', radius: 3 };
const CURVE = { kind: 'orb', color: '#41a6f6', radius: 4, spin: 0.5 };

const BREATH = Object.freeze({ charge: 1.0, fire: 1.4, rest: 2.0, width: 22, length: 760 });

const scaleDef = (id, ox, oy, drop) => ({
  id, name: 'Escama de Gelo', sprite: 'iceScale', ox, oy, hp: 40, armor: 0.5, phase: 2,
  look: 'remove', points: 3000, drop, debrisColors: ICE,
});

const PARTS = [
  { id: 'body', name: 'Corpo da Hidra', sprite: 'hydraBody', ox: 0, oy: 0, look: 'none', solidUntilPhase: 3 },
  {
    id: 'heart', name: 'Coração Glacial', sprite: 'hydraHeart', ox: 0, oy: -2, hp: 150, regen: 3, regenDelay: 1.5,
    phase: 3, visibleFromPhase: 3, look: 'remove', points: 15000, pulse: true, explosionScale: 3,
    debrisColors: ['#e43b8c', '#b13e53', '#ffcd75'],
  },
  scaleDef('scaleA', -26, -12, null),
  scaleDef('scaleB', 26, -12, 'shield'),
  scaleDef('scaleC', -26, 12, null),
  scaleDef('scaleD', 26, 12, 'life'),
  {
    id: 'headL', name: 'Cabeça Esquerda', sprite: 'hydraHeadL', ox: -64, oy: 18, hp: 70, phase: 0,
    look: 'remove', points: 3000, explosionScale: 2, debrisColors: ICE, sparksAt: { x: -44, y: 14 },
  },
  {
    id: 'headR', name: 'Cabeça Direita', sprite: 'hydraHeadR', ox: 64, oy: 18, hp: 70, phase: 0,
    look: 'remove', points: 3000, explosionScale: 2, drop: 'double', debrisColors: ICE, sparksAt: { x: 44, y: 14 },
  },
  {
    id: 'headC', name: 'Cabeça Central', sprite: 'hydraHeadC', ox: 0, oy: 40, hp: 110, phase: 1,
    look: 'remove', points: 5000, explosionScale: 2.4, drop: 'rapid', debrisColors: ICE,
  },
];

const mouth = (boss) => boss.worldPoint(0, 58);

/** Sopro: idle -> charge (linha de aviso) -> fire (raio letal que varre) -> idle. */
function updateBreath(boss, dt) {
  const b = (boss.vars.breath ??= { stage: 'rest', t: 0, angle: Math.PI / 2 });
  b.t += dt;
  const world = boss.world;
  const m = mouth(boss);
  const toPlayer = Math.atan2(world.player.y - m.y, world.player.x - m.x);
  if (b.stage === 'rest' && b.t >= BREATH.rest) {
    b.stage = 'charge';
    b.t = 0;
    b.angle = clamp(toPlayer, 0.5, Math.PI - 0.5);
    world.audio.play('laserCharge');
  } else if (b.stage === 'charge') {
    world.particles.charge(m.x, m.y, '#73eff7');
    if (b.t >= BREATH.charge) {
      b.stage = 'fire';
      b.t = 0;
      world.audio.play('laserFire');
      world.shake(3, BREATH.fire);
    }
  } else if (b.stage === 'fire') {
    // Varre devagar em direção ao jogador.
    const diff = clamp(toPlayer - b.angle, -1, 1);
    b.angle = clamp(b.angle + Math.sign(diff) * Math.min(Math.abs(diff), 0.45 * dt), 0.4, Math.PI - 0.4);
    if (b.t >= BREATH.fire) {
      b.stage = 'rest';
      b.t = 0;
    }
  }
}

const PHASES = [
  {
    id: 'heads',
    title: 'CABEÇAS GÊMEAS',
    hint: 'Corte as duas! Uma cabeça sozinha renasce.',
    targets: ['headL', 'headR'],

    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.45) * 80;
      boss.y = boss.homeY + Math.sin(boss.time * 0.9) * 10;
    },

    attack(boss, dt) {
      const world = boss.world;
      for (const [id, side] of [['headL', -1], ['headR', 1]]) {
        if (boss.parts[id].destroyed) continue;
        if (every(boss, id, 1.5, dt, side < 0 ? 0.7 : 1.4)) {
          const p = boss.worldPoint(boss.parts[id].ox + side * 4, boss.parts[id].oy + 14);
          fireSpread(world, p.x, p.y, aimAtPlayer(world, p.x, p.y), 1, 0, 150, SPLITTER);
          world.audio.play('enemyShoot');
        }
      }
      if (every(boss, 'ring', 3, dt, 1.8)) fireRing(world, boss.x, boss.y, 12, 95, boss.time, ORB);
    },
  },
  {
    id: 'breath',
    title: 'SOPRO CONGELANTE',
    hint: 'Saia da linha do sopro!',
    targets: ['headC'],
    onStart(boss) {
      boss.vars.breath = { stage: 'rest', t: 1, angle: Math.PI / 2 };
    },

    move(boss, dt) {
      updateBreath(boss, dt);
      const firing = boss.vars.breath.stage !== 'rest';
      if (!firing) boss.x += (CENTER_X + Math.sin(boss.time * 0.5) * 90 - boss.x) * Math.min(1, dt * 2);
      boss.y = boss.homeY + Math.sin(boss.time * 0.9) * 8;
    },

    attack(boss, dt) {
      const world = boss.world;
      if (boss.vars.breath?.stage === 'rest' && every(boss, 'aimed', 0.9, dt, 0.4)) {
        const m = mouth(boss);
        fireSpread(world, m.x, m.y, aimAtPlayer(world, m.x, m.y), 5, 0.6, 190, NEEDLE);
      }
      if (every(boss, 'wave', 9, dt, 5)) world.spawnMinionWave(3, { type: 'blue' });
    },
  },
  {
    id: 'scales',
    title: 'ESCAMAS DE GELO',
    hint: 'Escamas blindadas! O Perfurante ignora a blindagem.',
    targets: SCALE_IDS,
    bombRefill: true,

    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.6) * 110;
      boss.y = boss.homeY + Math.sin(boss.time * 1.2) * 14;
    },

    attack(boss, dt) {
      const world = boss.world;
      const left = SCALE_IDS.filter((id) => !boss.parts[id].destroyed).length;
      if (every(boss, 'curve', 0.2, dt, 0.5)) {
        boss.timers.spin = (boss.timers.spin ?? 0) + 0.4;
        fireRing(world, boss.x, boss.y, 2, 115, boss.timers.spin, CURVE);
      }
      if (every(boss, 'bomblet', 1.2 + left * 0.25, dt, 1)) {
        fireSpread(world, boss.x, boss.y + 30, aimAtPlayer(world, boss.x, boss.y), 1, 0, 140, BOMBLET);
      }
    },
  },
  {
    id: 'heart',
    title: 'CORAÇÃO GLACIAL',
    hint: 'O coração regenera: não pare de atirar!',
    targets: ['heart'],
    enrage: true,

    move(boss) {
      const t = boss.time * 0.8;
      boss.x = CENTER_X + Math.sin(t) * 130;
      boss.y = boss.homeY + Math.sin(t * 2) * 28;
    },

    attack(boss, dt) {
      const world = boss.world;
      const ratio = boss.parts.heart.healthRatio;
      if (every(boss, 'spiral', ratio < 0.5 ? 0.12 : 0.16, dt, 0.5)) {
        boss.timers.spin = (boss.timers.spin ?? 0) + 0.3;
        fireRing(world, boss.x, boss.y, 3, 125, boss.timers.spin, ORB);
      }
      if (every(boss, 'split', 1.8, dt, 1)) {
        fireSpread(world, boss.x, boss.y, aimAtPlayer(world, boss.x, boss.y), 3, 0.8, 150, SPLITTER);
      }
      if (every(boss, 'wave', 8, dt, 4)) world.spawnMinionWave(4, { orange: 1, type: 'blue' });
    },
  },
];

export const HYDRA = Object.freeze({
  id: 'hydra',
  name: 'HIDRA GLACIAL',
  intro: { title: 'ALERTA!', subtitle: 'HIDRA GLACIAL SE APROXIMANDO' },
  description: 'Dragão de gelo de três cabeças. As cabeças renascem.',
  icon: { sprite: 'hydraHeadC', scale: 1.1 },
  parTime: 300,
  size: { w: 180, h: 100 },
  rageSprite: 'hydraBody',
  music: 'boss',
  timing: { entry: 3.2, transition: 2.4, death: 3.4, homeY: 140 },
  debrisColors: ICE,
  parts: PARTS,
  phases: PHASES,

  /** Uma cabeça cortada sozinha renasce depois de alguns segundos. */
  update(boss, dt) {
    if (boss.phaseIndex !== 0 || boss.state !== 'fight') return;
    const L = boss.parts.headL;
    const R = boss.parts.headR;
    const v = boss.vars;
    if (L.destroyed !== R.destroyed) {
      v.regrow = (v.regrow ?? 0) + dt;
      if (v.regrow >= REGROW_TIME) {
        const dead = L.destroyed ? L : R;
        dead.revive(0.6);
        v.regrow = 0;
        const p = boss.worldPoint(dead.ox, dead.oy);
        boss.world.particles.ring(p.x, p.y, '#73eff7', 40, 0.5);
        boss.world.popup('A CABEÇA RENASCEU!', p.x, p.y - 30, '#73eff7');
        boss.world.audio.play('shieldBreak');
      }
    } else {
      v.regrow = 0;
    }
  },

  hudHint(boss) {
    if (boss.phaseIndex !== 0) return null;
    const left = REGROW_TIME - (boss.vars.regrow ?? 0);
    return boss.vars.regrow > 0 ? `CORTE A OUTRA CABEÇA! ${left.toFixed(1)} S` : null;
  },

  tilt(boss) {
    const L = boss.parts.headL.destroyed;
    const R = boss.parts.headR.destroyed;
    if (L && !R) return -0.1;
    if (R && !L) return 0.1;
    return 0;
  },

  segments(boss) {
    const b = boss.vars.breath;
    if (boss.phaseIndex !== 1 || !b || b.stage !== 'fire') return [];
    const m = mouth(boss);
    return [{
      x1: m.x, y1: m.y,
      x2: m.x + Math.cos(b.angle) * BREATH.length, y2: m.y + Math.sin(b.angle) * BREATH.length,
      width: BREATH.width,
    }];
  },

  /** Aviso do sopro e o próprio raio congelante. */
  drawWorld(ctx, boss) {
    const b = boss.vars.breath;
    if (boss.phaseIndex !== 1 || !b || boss.state !== 'fight' || b.stage === 'rest') return;
    const m = mouth(boss);
    const x2 = m.x + Math.cos(b.angle) * BREATH.length;
    const y2 = m.y + Math.sin(b.angle) * BREATH.length;
    if (b.stage === 'charge') {
      drawBeamWarning(ctx, m.x, m.y, x2, y2, b.t, 'rgba(115, 239, 247, 0.85)');
      return;
    }
    drawLethalBeam(ctx, { x1: m.x, y1: m.y, x2, y2, width: BREATH.width }, ['rgba(65, 166, 246, 0.35)', 'rgba(115, 239, 247, 0.9)']);
  },
});
