/**
 * Mini-chefe ECO (Mundo 4) — uma cópia sombria e gigante da SUA nave.
 *
 * O Eco imita o jogador:
 *  - Fase 1 (Refletores): segue a sua posição X com atraso. Os refletores
 *    disparam rajadas retas para baixo; para acertá-los é preciso ficar na
 *    linha de tiro deles e atirar nas pausas entre as rajadas.
 *  - Fase 2 (Reflexo): passa a voar ESPELHADO (do lado oposto da tela) e
 *    "devolve" ataques: projéteis surgem do FUNDO da tela e sobem, sempre
 *    avisados por marcadores piscando.
 *
 * Recompensa: ESCUDO REATIVO (quando o escudo quebra, solta um pulso).
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../../config.js';
import { clamp, rand } from '../../utils/math.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';

const CENTER_X = GAME_WIDTH / 2;
const ECHO_WARN = 0.75;
const VOID = ['#566c86', '#5d275d', '#e43b8c'];
const COLUMN = { kind: 'needle', color: '#e43b8c', radius: 3 };
const RISING = { kind: 'needle', color: '#73eff7', radius: 3 };
const ORB = { kind: 'orb', color: '#8e478c', radius: 4 };

const PARTS = [
  {
    id: 'body', name: 'Eco', sprite: 'echo', ox: 0, oy: 0, hp: 240, phase: 1,
    look: 'remove', points: 10000, explosionScale: 3, debrisColors: VOID,
  },
  {
    id: 'reflectorL', name: 'Refletor E', sprite: 'reflector', ox: -58, oy: -4, hp: 80, phase: 0,
    look: 'husk', points: 3500, debrisColors: ['#73eff7', '#f4f4f4'],
  },
  {
    id: 'reflectorR', name: 'Refletor D', sprite: 'reflector', ox: 58, oy: -4, hp: 80, phase: 0,
    look: 'husk', points: 3500, drop: 'shield', debrisColors: ['#73eff7', '#f4f4f4'],
  },
];

/** Segue um X-alvo com atraso (guarda o histórico de posições do jogador). */
function follow(boss, dt, mirrored) {
  const v = boss.vars;
  const px = boss.world.player.x;
  v.trail ??= [];
  v.trail.push(mirrored ? GAME_WIDTH - px : px);
  if (v.trail.length > 36) v.trail.shift(); // ~0,6 s de atraso
  const target = clamp(v.trail[0], 70, GAME_WIDTH - 70);
  boss.x += (target - boss.x) * Math.min(1, dt * 2.5);
  boss.y = boss.homeY + Math.sin(boss.time * 1.2) * 8;
}

/** Marca um ponto no fundo da tela; depois de um aviso, projéteis sobem dali. */
function queueEcho(boss, x) {
  (boss.vars.echoes ??= []).push({ x: clamp(x, 20, GAME_WIDTH - 20), t: 0 });
}

function updateEchoes(boss, dt) {
  const list = boss.vars.echoes ?? [];
  for (const e of list) {
    e.t += dt;
    if (e.t >= ECHO_WARN && !e.fired) {
      e.fired = true;
      for (let i = 0; i < 3; i++) {
        boss.world.spawnEnemyBullet({ x: e.x + (i - 1) * 10, y: GAME_HEIGHT + 6 + i * 14, vx: 0, vy: -230, ...RISING });
      }
    }
  }
  boss.vars.echoes = list.filter((e) => !e.fired);
}

const PHASES = [
  {
    id: 'reflectors',
    title: 'REFLETORES',
    hint: 'Ele copia você! Atire nos refletores entre as rajadas.',
    targets: ['reflectorL', 'reflectorR'],

    move(boss, dt) {
      follow(boss, dt, false);
    },

    attack(boss, dt) {
      const world = boss.world;
      // Rajada de 3 tiros a cada 1,4 s, alternando os refletores.
      const cycle = (boss.time % 1.4);
      const side = Math.floor(boss.time / 1.4) % 2 ? 'reflectorL' : 'reflectorR';
      const id = boss.parts[side].destroyed ? (side === 'reflectorL' ? 'reflectorR' : 'reflectorL') : side;
      if (!boss.parts[id].destroyed && cycle < 0.4 && every(boss, 'burst', 0.12, dt, 0)) {
        const p = boss.worldPoint(boss.parts[id].ox, boss.parts[id].oy + 18);
        fireSpread(world, p.x, p.y, Math.PI / 2, 1, 0, 300, COLUMN);
      }
      if (every(boss, 'aimed', 2.2, dt, 1)) {
        fireSpread(world, boss.x, boss.y + 40, aimAtPlayer(world, boss.x, boss.y), 3, 0.4, 190, ORB);
        world.audio.play('enemyShoot');
      }
    },
  },
  {
    id: 'mirror',
    title: 'REFLEXO',
    hint: 'Projéteis sobem do fundo! Fique de olho nos marcadores.',
    targets: ['body'],
    enrage: true,
    onStart(boss) {
      boss.vars.echoes = [];
      boss.vars.trail = [];
    },

    move(boss, dt) {
      follow(boss, dt, true);
      updateEchoes(boss, dt);
    },

    attack(boss, dt) {
      const world = boss.world;
      const ratio = boss.parts.body.healthRatio;
      if (every(boss, 'echo', ratio < 0.5 ? 1.1 : 1.6, dt, 1)) {
        queueEcho(boss, world.player.x + rand(-20, 20));
        if (ratio < 0.5) queueEcho(boss, world.player.x + (Math.random() < 0.5 ? -90 : 90));
      }
      if (every(boss, 'aimed', 1.2, dt, 0.6)) {
        fireSpread(world, boss.x, boss.y + 40, aimAtPlayer(world, boss.x, boss.y), 3, 0.3, 210, ORB);
      }
      if (every(boss, 'ring', 2.8, dt, 1.8)) fireRing(world, boss.x, boss.y, 14, 100, boss.time, ORB);
    },
  },
];

export const ECHO = Object.freeze({
  id: 'echo',
  name: 'ECO',
  intro: { title: 'ALVO DETECTADO', subtitle: 'ECO' },
  description: 'Uma cópia sombria da sua nave. Imita você.',
  icon: { sprite: 'echo', scale: 0.5 },
  parTime: 150,
  size: { w: 140, h: 90 },
  timing: { entry: 2.4, transition: 1.8, death: 2.6, homeY: 120 },
  debrisColors: VOID,
  rageSprite: 'echo',
  parts: PARTS,
  phases: PHASES,

  /** Marcadores piscando no fundo da tela, onde os projéteis vão surgir. */
  drawWorld(ctx, boss) {
    if (boss.state !== 'fight') return;
    for (const e of boss.vars.echoes ?? []) {
      if (Math.floor(e.t * 12) % 2) continue;
      const k = e.t / ECHO_WARN;
      ctx.fillStyle = `rgba(115, 239, 247, ${0.25 + k * 0.5})`;
      ctx.fillRect(e.x - 14, GAME_HEIGHT - 6, 28, 6);
      ctx.beginPath();
      ctx.moveTo(e.x, GAME_HEIGHT - 26);
      ctx.lineTo(e.x - 8, GAME_HEIGHT - 12);
      ctx.lineTo(e.x + 8, GAME_HEIGHT - 12);
      ctx.closePath();
      ctx.fill();
    }
  },
});
