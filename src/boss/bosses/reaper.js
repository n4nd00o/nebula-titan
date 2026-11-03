/**
 * Mini-chefe CEIFADOR — nave-lâmina que mergulha contra o jogador.
 *
 * Padrão de investida (telegrafado): o Ceifador escolhe a posição X do
 * jogador, alinha-se piscando em vermelho com uma faixa de aviso (0,8 s)
 * e mergulha até o fundo da tela. Encostar nele causa dano.
 *
 * Fase 1 (Lâminas): duas lâminas atiram leques. Perder uma lâmina faz o
 *   Ceifador inclinar e mergulhar com mais frequência.
 * Fase 2 (Fúria): o corpo vira alvo; investidas rápidas e explosão de
 *   projéteis ao chegar ao fundo.
 *
 * Recompensa: DASH (o jogador aprende a manobra do Ceifador).
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../../config.js';
import { clamp, approach } from '../../utils/math.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';

const CENTER_X = GAME_WIDTH / 2;
const DIVE_BOTTOM = GAME_HEIGHT - 80;
const NEEDLE = { kind: 'needle', color: '#ef7d57', radius: 3 };
const ORB = { kind: 'orb', color: '#b13e53', radius: 4 };

const PARTS = [
  {
    id: 'bladeL', name: 'Lâmina Esquerda', sprite: 'bladeL',
    ox: -44, oy: -6, hp: 26, phase: 0, look: 'remove', points: 1500,
    sparksAt: { x: -26, y: -6 }, debrisColors: ['#94b0c2', '#566c86', '#b13e53'],
  },
  {
    id: 'bladeR', name: 'Lâmina Direita', sprite: 'bladeR',
    ox: 44, oy: -6, hp: 26, phase: 0, look: 'remove', points: 1500, drop: 'shield',
    sparksAt: { x: 26, y: -6 }, debrisColors: ['#94b0c2', '#566c86', '#b13e53'],
  },
  {
    id: 'body', name: 'Corpo do Ceifador', sprite: 'reaper',
    ox: 0, oy: 0, hp: 60, phase: 1, look: 'remove', points: 6000, explosionScale: 2.5,
    debrisColors: ['#b13e53', '#ef7d57', '#1a1c2c'],
  },
];

/** Máquina de estados da investida: idle -> warn -> down -> up -> idle. */
function updateDive(boss, dt, cfg) {
  const d = (boss.vars.dive ??= { stage: 'idle', t: 0, x: CENTER_X });
  d.t += dt;
  switch (d.stage) {
    case 'idle':
      boss.x = approach(boss.x, CENTER_X + Math.sin(boss.time * cfg.patrol) * 150, 260 * dt);
      boss.y = approach(boss.y, boss.homeY + Math.sin(boss.time * 2) * 8, 200 * dt);
      if (d.t >= cfg.diveEvery && !boss.passive) {
        d.stage = 'warn';
        d.t = 0;
        d.x = clamp(boss.world.player.x, 50, GAME_WIDTH - 50);
        boss.world.audio.play('dashWarn');
      }
      break;
    case 'warn':
      boss.x = approach(boss.x, d.x, 600 * dt);
      boss.y = approach(boss.y, boss.homeY - 10, 100 * dt);
      if (d.t >= cfg.warnTime) {
        d.stage = 'down';
        d.t = 0;
        boss.world.audio.play('dash');
      }
      break;
    case 'down':
      boss.y += 740 * dt;
      if (boss.y >= DIVE_BOTTOM) {
        boss.y = DIVE_BOTTOM;
        d.stage = 'up';
        d.t = 0;
        boss.world.shake(5, 0.25);
        cfg.onBottom?.(boss);
      }
      break;
    case 'up':
      boss.y = approach(boss.y, boss.homeY, 380 * dt);
      if (boss.y <= boss.homeY + 1) {
        d.stage = 'idle';
        d.t = 0;
      }
      break;
    default:
      break;
  }
}

const isIdle = (boss) => (boss.vars.dive?.stage ?? 'idle') === 'idle';
const resetDive = (boss) => {
  boss.vars.dive = { stage: 'idle', t: 0, x: CENTER_X };
};

const PHASES = [
  {
    id: 'blades',
    title: 'LÂMINAS',
    hint: 'Desvie das investidas e quebre as lâminas!',
    targets: ['bladeL', 'bladeR'],
    onStart: resetDive,

    move(boss, dt) {
      const oneLost = boss.parts.bladeL.destroyed !== boss.parts.bladeR.destroyed;
      updateDive(boss, dt, { patrol: 1.1, diveEvery: oneLost ? 3.0 : 4.5, warnTime: 0.8 });
    },

    attack(boss, dt) {
      if (!isIdle(boss)) return;
      const world = boss.world;
      for (const [id, side] of [['bladeL', -1], ['bladeR', 1]]) {
        if (boss.parts[id].destroyed) continue;
        if (every(boss, `fan_${id}`, 1.7, dt, side < 0 ? 0.6 : 1.4)) {
          const p = boss.worldPoint(60 * side, 8);
          fireSpread(world, p.x, p.y, Math.PI / 2 - side * 0.25, 3, 0.5, 170, NEEDLE);
          world.audio.play('enemyShoot');
        }
      }
    },
  },
  {
    id: 'fury',
    title: 'FÚRIA',
    hint: 'Destrua o corpo do Ceifador!',
    targets: ['body'],
    enrage: true,
    onStart: resetDive,

    move(boss, dt) {
      updateDive(boss, dt, {
        patrol: 1.5,
        diveEvery: 2.6,
        warnTime: 0.65,
        onBottom: (b) => fireRing(b.world, b.x, b.y, 10, 90, b.time, ORB),
      });
    },

    attack(boss, dt) {
      if (!isIdle(boss)) return;
      const world = boss.world;
      if (every(boss, 'aimed', 1.3, dt, 0.6)) {
        fireSpread(world, boss.x, boss.y + 24, aimAtPlayer(world, boss.x, boss.y), 5, 0.7, 190, NEEDLE);
        world.audio.play('enemyShoot');
      }
    },
  },
];

export const REAPER = Object.freeze({
  id: 'reaper',
  name: 'CEIFADOR',
  intro: { title: 'ALVO DETECTADO', subtitle: 'CEIFADOR' },
  description: 'Nave-lâmina que mergulha em investidas. Exige reflexo.',
  parTime: 120,
  size: { w: 130, h: 60 },
  timing: { entry: 2.4, transition: 1.8, death: 2.4, homeY: 130 },
  debrisColors: ['#b13e53', '#ef7d57', '#94b0c2', '#1a1c2c'],
  rageSprite: 'reaper',
  parts: PARTS,
  phases: PHASES,

  /** Sem uma lâmina, o Ceifador fica desequilibrado. */
  tilt(boss) {
    const L = boss.parts.bladeL.destroyed;
    const R = boss.parts.bladeR.destroyed;
    if (L && !R) return -0.14;
    if (R && !L) return 0.14;
    return 0;
  },

  /** Faixa de aviso da investida (em coordenadas do mundo). */
  drawWorld(ctx, boss) {
    const d = boss.vars.dive;
    if (!d || d.stage !== 'warn' || boss.state !== 'fight') return;
    const blink = Math.floor(d.t * 12) % 2 === 0;
    ctx.fillStyle = blink ? 'rgba(255, 40, 72, 0.28)' : 'rgba(255, 40, 72, 0.12)';
    ctx.fillRect(d.x - 32, boss.y, 64, GAME_HEIGHT - boss.y);
    ctx.fillStyle = 'rgba(255, 40, 72, 0.8)';
    ctx.fillRect(d.x - 1, boss.y, 2, GAME_HEIGHT - boss.y);
  },
});
