/**
 * Mini-chefe MARTELO (Mundo 3) — uma prensa industrial que esmaga o chão.
 *
 * Padrão de PANCADA (telegrafado): o Martelo trava sobre a posição X do jogador,
 * mostra a sombra do impacto (0,8 s) e desce até a metade de baixo da tela.
 * No impacto, duas ONDAS DE CHOQUE correm rente ao "chão" para os lados:
 * é preciso subir ou descer para escapar delas.
 *
 * Fase 1 (Pistões): os pistões atiram rajadas; pancadas a cada ~4 s.
 * Fase 2 (Cabeça): pancadas rápidas, ondas duplas e anel de estilhaços.
 *
 * Recompensa: SOBRECARGA (cadência de tiro +25%).
 */
import { GAME_WIDTH } from '../../config.js';
import { clamp, approach } from '../../utils/math.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';

const CENTER_X = GAME_WIDTH / 2;
const SLAM_Y = 420;
const METAL = ['#566c86', '#94b0c2', '#ef7d57'];
const NEEDLE = { kind: 'needle', color: '#ffcd75', radius: 3 };
const WAVE = { kind: 'orb', color: '#ef7d57', radius: 5 };
const SHRAPNEL = { kind: 'needle', color: '#ef7d57', radius: 3 };

const PARTS = [
  {
    id: 'pistonL', name: 'Pistão Esquerdo', sprite: 'piston', ox: -44, oy: -18, hp: 70, phase: 0,
    look: 'husk', points: 3000, debrisColors: METAL,
  },
  {
    id: 'pistonR', name: 'Pistão Direito', sprite: 'piston', ox: 44, oy: -18, hp: 70, phase: 0,
    look: 'husk', points: 3000, drop: 'shield', debrisColors: METAL,
  },
  {
    id: 'head', name: 'Cabeça do Martelo', sprite: 'hammer', ox: 0, oy: 14, hp: 170, phase: 1,
    look: 'remove', points: 9000, explosionScale: 2.8, debrisColors: METAL,
  },
];

/** Onda de choque: fileira de orbes correndo rente ao chão, para os dois lados. */
function shockwave(boss, y, speed) {
  const w = boss.world;
  for (const dir of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      w.spawnEnemyBullet({ x: boss.x + dir * (40 + i * 14), y, vx: dir * speed, vy: 0, ...WAVE });
    }
  }
}

/** idle -> warn (sombra) -> down -> hold (impacto) -> up -> idle */
function updateSlam(boss, dt, cfg) {
  const s = (boss.vars.slam ??= { stage: 'idle', t: 0, x: CENTER_X });
  s.t += dt;
  switch (s.stage) {
    case 'idle':
      boss.x = approach(boss.x, CENTER_X + Math.sin(boss.time * 0.8) * 140, 160 * dt);
      boss.y = approach(boss.y, boss.homeY, 220 * dt);
      if (s.t >= cfg.every && !boss.passive) {
        s.stage = 'warn';
        s.t = 0;
        s.x = clamp(boss.world.player.x, 60, GAME_WIDTH - 60);
        boss.world.audio.play('dashWarn');
      }
      break;
    case 'warn':
      boss.x = approach(boss.x, s.x, 520 * dt);
      if (s.t >= cfg.warn) {
        s.stage = 'down';
        s.t = 0;
      }
      break;
    case 'down':
      boss.y += 820 * dt;
      if (boss.y >= SLAM_Y) {
        boss.y = SLAM_Y;
        s.stage = 'hold';
        s.t = 0;
        boss.world.shake(9, 0.4);
        boss.world.audio.play('explosionSmall');
        boss.world.particles.debris(boss.x, boss.y + 30, METAL, 16);
        cfg.onImpact(boss);
      }
      break;
    case 'hold':
      if (s.t >= 0.45) {
        s.stage = 'up';
        s.t = 0;
      }
      break;
    case 'up':
      boss.y = approach(boss.y, boss.homeY, 300 * dt);
      if (boss.y <= boss.homeY + 1) {
        s.stage = 'idle';
        s.t = 0;
      }
      break;
    default:
      break;
  }
}

const isIdle = (boss) => (boss.vars.slam?.stage ?? 'idle') === 'idle';
const resetSlam = (boss) => {
  boss.vars.slam = { stage: 'idle', t: 0, x: CENTER_X };
};

const PHASES = [
  {
    id: 'pistons',
    title: 'PISTÕES',
    hint: 'Fuja da sombra e pule as ondas de choque!',
    targets: ['pistonL', 'pistonR'],
    onStart: resetSlam,

    move(boss, dt) {
      const oneLost = boss.parts.pistonL.destroyed !== boss.parts.pistonR.destroyed;
      updateSlam(boss, dt, {
        every: oneLost ? 3 : 4.2,
        warn: 0.85,
        onImpact: (b) => shockwave(b, b.y + 30, 190),
      });
    },

    attack(boss, dt) {
      if (!isIdle(boss)) return;
      const world = boss.world;
      for (const [id, side] of [['pistonL', -1], ['pistonR', 1]]) {
        if (boss.parts[id].destroyed) continue;
        if (every(boss, id, 1.2, dt, side < 0 ? 0.5 : 1.1)) {
          const p = boss.worldPoint(boss.parts[id].ox, boss.parts[id].oy + 20);
          fireSpread(world, p.x, p.y, aimAtPlayer(world, p.x, p.y), 3, 0.25, 220, NEEDLE);
          world.audio.play('enemyShoot');
        }
      }
    },
  },
  {
    id: 'head',
    title: 'MARTELO-MESTRE',
    hint: 'Pancadas rápidas! Fique longe do centro do impacto.',
    targets: ['head'],
    enrage: true,
    onStart: resetSlam,

    move(boss, dt) {
      updateSlam(boss, dt, {
        every: 2.3,
        warn: 0.7,
        onImpact: (b) => {
          shockwave(b, b.y + 30, 220);
          shockwave(b, b.y - 50, 160);
          fireRing(b.world, b.x, b.y, 12, 120, b.time, SHRAPNEL);
        },
      });
    },

    attack(boss, dt) {
      if (!isIdle(boss)) return;
      const world = boss.world;
      if (every(boss, 'aimed', 0.9, dt, 0.4)) {
        fireSpread(world, boss.x, boss.y + 30, aimAtPlayer(world, boss.x, boss.y), 5, 0.6, 200, NEEDLE);
      }
    },
  },
];

export const HAMMER = Object.freeze({
  id: 'hammer',
  name: 'MARTELO',
  intro: { title: 'ALVO DETECTADO', subtitle: 'MARTELO' },
  description: 'Prensa industrial. Esmaga o chão e solta ondas de choque.',
  icon: { sprite: 'hammer', scale: 0.85 },
  parTime: 140,
  size: { w: 110, h: 70 },
  timing: { entry: 2.4, transition: 1.8, death: 2.4, homeY: 130 },
  debrisColors: METAL,
  rageSprite: 'hammer',
  parts: PARTS,
  phases: PHASES,

  tilt(boss) {
    const L = boss.parts.pistonL.destroyed;
    const R = boss.parts.pistonR.destroyed;
    if (L && !R) return -0.1;
    if (R && !L) return 0.1;
    return 0;
  },

  /** Sombra do impacto enquanto o Martelo mira. */
  drawWorld(ctx, boss) {
    const s = boss.vars.slam;
    if (!s || s.stage !== 'warn' || boss.state !== 'fight') return;
    const blink = Math.floor(s.t * 12) % 2 === 0;
    ctx.fillStyle = blink ? 'rgba(239, 125, 87, 0.3)' : 'rgba(239, 125, 87, 0.12)';
    ctx.fillRect(s.x - 40, boss.y + 20, 80, SLAM_Y + 30 - boss.y);
    ctx.fillStyle = 'rgba(255, 205, 117, 0.9)';
    ctx.fillRect(s.x - 44, SLAM_Y + 28, 88, 3);
    ctx.fillRect(0, SLAM_Y + 30, GAME_WIDTH, 1);
  },
});
