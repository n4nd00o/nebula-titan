/**
 * Definição do chefe final NEBULA TITAN (design orientado a dados).
 *
 * Toda a "personalidade" do chefe está aqui: quais partes existem, onde
 * ficam, quanta vida têm e o que cada fase faz. A classe Boss (motor
 * genérico) só executa estas regras. Os mini-chefes seguem o mesmo formato.
 */
import { GAME_WIDTH } from '../../config.js';
import { clamp, approach } from '../../utils/math.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';

// ---------------------------------------------------------------------------
// PARTES (a ordem do array = ordem de desenho, de trás para frente)
// ---------------------------------------------------------------------------
const PART_DEFS = [
  {
    id: 'genL', name: 'Gerador Esquerdo', sprite: 'generator',
    ox: -52, oy: 8, w: 28, h: 28, hp: 35, phase: 1,
    look: 'husk', revealedBy: 'wingL', revealText: 'GERADOR EXPOSTO!', drop: 'shield', points: 2000,
    debrisColors: ['#73eff7', '#41a6f6', '#333c57'],
  },
  {
    id: 'genR', name: 'Gerador Direito', sprite: 'generator',
    ox: 52, oy: 8, w: 28, h: 28, hp: 35, phase: 1,
    look: 'husk', revealedBy: 'wingR', revealText: 'GERADOR EXPOSTO!', drop: 'rapid', points: 2000,
    debrisColors: ['#73eff7', '#41a6f6', '#333c57'],
  },
  {
    id: 'wingL', name: 'Asa Esquerda', sprite: 'wingL',
    ox: -66, oy: -8, w: 62, h: 34, hp: 40, phase: 0,
    look: 'remove', drop: 'double', points: 2500, explosionScale: 2, sparksAt: { x: -38, y: -8 },
  },
  {
    id: 'wingR', name: 'Asa Direita', sprite: 'wingR',
    ox: 66, oy: -8, w: 62, h: 34, hp: 40, phase: 0,
    look: 'remove', drop: 'double', points: 2500, explosionScale: 2, sparksAt: { x: 38, y: -8 },
  },
  {
    id: 'hull', name: 'Casco', sprite: 'hull',
    ox: 0, oy: 0, w: 72, h: 72, look: 'none',
    solidUntilPhase: 3, // na fase final o casco está rachado: os tiros passam até o núcleo
  },
  {
    id: 'plate', name: 'Placa Blindada', sprite: 'plate',
    ox: 0, oy: -3, w: 30, h: 30, look: 'remove',
    debrisColors: ['#94b0c2', '#8e478c', '#333c57'],
  },
  {
    id: 'core', name: 'Núcleo', sprite: 'core',
    ox: 0, oy: -3, w: 32, h: 32, hp: 100, phase: 3,
    look: 'remove', requires: 'plate', points: 10000, explosionScale: 3, pulse: true,
    debrisColors: ['#e43b8c', '#ffcd75', '#b13e53'],
  },
  {
    id: 'cannon', name: 'Canhão Principal', sprite: 'cannon',
    ox: 0, oy: 45, w: 22, h: 34, hp: 80, phase: 2,
    look: 'husk', drop: 'life', points: 4000, explosionScale: 2,
  },
];

const CENTER_X = GAME_WIDTH / 2;
const ORB = { kind: 'orb', color: '#e43b8c', radius: 4 };
const ORB_ORANGE = { kind: 'orb', color: '#ef7d57', radius: 4 };
const NEEDLE = { kind: 'needle', color: '#ffcd75', radius: 3 };
const MINE = { kind: 'mine', color: '#73eff7', radius: 5, homing: 2.2, turnRate: 1.8, life: 7 };
const BIG = { kind: 'orb', color: '#b13e53', radius: 7 };

// ---------------------------------------------------------------------------
// FASES
// ---------------------------------------------------------------------------
const PHASES = [
  // ------------------------------------------------------------- FASE 1
  {
    id: 'wings',
    title: 'ASAS DE COMBATE',
    hint: 'Destrua as asas!',
    targets: ['wingL', 'wingR'],

    move(boss, dt) {
      const L = boss.parts.wingL.destroyed;
      const R = boss.parts.wingR.destroyed;
      const unbalanced = L !== R;
      // Sem uma das asas, a nave "puxa" para o lado danificado e treme.
      const bias = unbalanced ? (L ? -30 : 30) : 0;
      const wobble = unbalanced ? Math.sin(boss.time * 3.1) * 18 : 0;
      boss.x = CENTER_X + Math.sin(boss.time * 0.6) * 110 + bias + wobble;
      boss.y = boss.homeY + Math.sin(boss.time * 1.2) * 10 + (unbalanced ? 8 : 0);
    },

    attack(boss, dt) {
      const world = boss.world;
      const wings = [boss.parts.wingL, boss.parts.wingR].filter((p) => !p.destroyed);
      const lastWing = wings.length === 1;

      for (const wing of wings) {
        const side = wing.id === 'wingL' ? -1 : 1;
        // A asa restante "compensa" a perda atirando mais rápido.
        const interval = lastWing ? 0.9 : 1.6;
        if (every(boss, `spread_${wing.id}`, interval, dt, side < 0 ? 0.8 : 1.6)) {
          const m = boss.worldPoint(96 * side, 14);
          fireSpread(world, m.x, m.y, aimAtPlayer(world, m.x, m.y), 3, 0.35, 150, side < 0 ? ORB : ORB_ORANGE);
          world.audio.play('enemyShoot');
        }
      }

      // Asa sobrevivente entra em fúria: rajada em varredura.
      if (lastWing) {
        const side = wings[0].id === 'wingL' ? -1 : 1;
        boss.timers.sweepCycle = (boss.timers.sweepCycle ?? 0) + dt;
        const cycle = boss.timers.sweepCycle % 4;
        if (cycle > 2.8 && every(boss, 'sweepShot', 0.07, dt, 0)) {
          const m = boss.worldPoint(96 * side, 14);
          const t = (cycle - 2.8) / 1.2;
          const angle = Math.PI / 2 - side * (0.9 - t * 1.8);
          fireSpread(world, m.x, m.y, angle, 1, 0, 230, NEEDLE);
        }
      }

      if (every(boss, 'ring', 3.2, dt, 2)) {
        const c = boss.worldPoint(0, -3);
        fireRing(world, c.x, c.y, lastWing ? 14 : 10, 110, boss.time, ORB);
      }
    },
  },

  // ------------------------------------------------------------- FASE 2
  {
    id: 'generators',
    title: 'GERADORES DE ESCUDO',
    hint: 'Destrua os geradores expostos!',
    targets: ['genL', 'genR'],

    move(boss, dt) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.5) * 80;
      boss.y = boss.homeY - 10 + Math.sin(boss.time) * 15;
    },

    attack(boss, dt) {
      const world = boss.world;
      const gens = [boss.parts.genL, boss.parts.genR].filter((p) => !p.destroyed);
      const overload = gens.length === 1;

      for (const gen of gens) {
        // Gerador sobrevivente entra em sobrecarga: minas mais frequentes.
        if (every(boss, `mine_${gen.id}`, overload ? 1.4 : 2.6, dt, gen.id === 'genL' ? 1 : 2.2)) {
          const p = boss.worldPoint(gen.ox, gen.oy + 10);
          fireSpread(world, p.x, p.y, Math.PI / 2, 1, 0, 90, MINE);
          world.audio.play('enemyShoot');
        }
      }

      if (every(boss, 'aimed', 2.4, dt, 1.5)) {
        const p = boss.worldPoint(0, 30);
        fireSpread(world, p.x, p.y, aimAtPlayer(world, p.x, p.y), 5, 0.6, 170, NEEDLE);
        world.audio.play('enemyShoot');
      }

      if (every(boss, 'wave', 8, dt, 3)) world.spawnMinionWave(4);
    },
  },

  // ------------------------------------------------------------- FASE 3
  {
    id: 'cannon',
    title: 'CANHÃO PRINCIPAL',
    hint: 'Destrua o canhão! Fuja do laser!',
    targets: ['cannon'],

    move(boss, dt) {
      // Persegue lentamente o jogador para mirar o laser; trava enquanto atira.
      if (!boss.laser.active) {
        boss.x = clamp(approach(boss.x, boss.world.player.x, 70 * dt), 110, GAME_WIDTH - 110);
      }
      boss.y = approach(boss.y, boss.homeY, 40 * dt);
    },

    attack(boss, dt) {
      const world = boss.world;
      const cannon = boss.parts.cannon;
      const damaged = cannon.healthRatio < 0.5;

      if (!boss.laser.active) {
        if (every(boss, 'laser', damaged ? 3.6 : 5, dt, 2)) {
          const dir = world.player.x < boss.x ? -1 : 1;
          boss.laser.start(damaged, dir, world);
        }
        if (every(boss, 'aimed', 0.9, dt, 0.5)) {
          const m = boss.laser.origin(boss);
          fireSpread(world, m.x, m.y, aimAtPlayer(world, m.x, m.y), 3, 0.24, 200, ORB);
          world.audio.play('enemyShoot');
        }
      }

      if (every(boss, 'vents', 2.2, dt, 1.2)) {
        for (const side of [-1, 1]) {
          const v = boss.worldPoint(30 * side, 20);
          fireSpread(world, v.x, v.y, Math.PI / 2 + side * 0.5, 4, 0.8, 150, NEEDLE);
        }
      }

      if (every(boss, 'wave', 10, dt, 6)) world.spawnMinionWave(3);
    },
  },

  // ------------------------------------------------------------- FASE 4
  {
    id: 'core',
    title: 'NÚCLEO EXPOSTO',
    hint: 'Destrua o núcleo!',
    targets: ['core'],
    enrage: true, // casco vermelho + música acelerada

    onStart(boss) {
      boss.blowOff('plate'); // a placa blindada é arrancada e revela o núcleo
    },

    move(boss, dt) {
      // Enfurecido: movimento em "8" rápido.
      boss.x = CENTER_X + Math.sin(boss.time * 0.6) * 120;
      boss.y = boss.homeY + 10 + Math.sin(boss.time * 1.2) * 45;
    },

    attack(boss, dt) {
      const world = boss.world;
      const ratio = boss.parts.core.healthRatio;
      const c = boss.worldPoint(0, -3);

      // Espiral: fica mais densa conforme o núcleo perde vida.
      const arms = ratio < 0.5 ? 3 : 2;
      if (every(boss, 'spiral', 0.16 - (1 - ratio) * 0.04, dt, 0.6)) {
        boss.timers.spin = (boss.timers.spin ?? 0) + 0.27;
        fireRing(world, c.x, c.y, arms, 130, boss.timers.spin, ORB);
      }

      if (every(boss, 'ring', 2.8, dt, 1.5)) {
        fireRing(world, c.x, c.y, 18, 95, boss.time, ORB_ORANGE);
      }

      if (every(boss, 'big', 1.8, dt, 1)) {
        fireSpread(world, c.x, c.y, aimAtPlayer(world, c.x, c.y), 1, 0, 230, BIG);
        world.audio.play('enemyShoot');
      }

      if (every(boss, 'wave', 7, dt, 4)) world.spawnMinionWave(4);
    },
  },
];

// ---------------------------------------------------------------------------
// DEFINIÇÃO COMPLETA
// ---------------------------------------------------------------------------
export const NEBULA_TITAN = Object.freeze({
  id: 'titan',
  name: 'NEBULA TITAN',
  intro: { title: 'ALERTA!', subtitle: 'NAVE-MÃE HOSTIL SE APROXIMANDO' },
  description: 'A nave-mãe. Quatro fases, oito partes.',
  parTime: 300,
  size: { w: 160, h: 90 },
  rageSprite: 'hull',
  timing: { entry: 3.2, transition: 2.6, death: 3.4, homeY: 140 },
  parts: PART_DEFS,
  phases: PHASES,

  /** Sem uma das asas, a nave inclina para o lado danificado. */
  tilt(boss) {
    const L = boss.parts.wingL.destroyed;
    const R = boss.parts.wingR.destroyed;
    if (L && !R) return -0.17;
    if (R && !L) return 0.17;
    return 0;
  },

  /** Escudo de energia enquanto os geradores estiverem ativos (fase 2). */
  drawBehind(ctx, boss) {
    if (boss.phaseIndex !== 1 || boss.state !== 'fight') return;
    const alive = [boss.parts.genL, boss.parts.genR].filter((p) => !p.destroyed).length;
    if (alive === 0) return;
    const pulse = 0.18 + 0.08 * Math.sin(boss.time * 6);
    ctx.fillStyle = `rgba(115, 239, 247, ${pulse * (alive / 2)})`;
    ctx.strokeStyle = `rgba(115, 239, 247, ${0.5 * (alive / 2) + 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 10, 48, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  },

  /** Olhos piscando em vermelho quando enfurecido. */
  drawFront(ctx, boss) {
    if (!boss.enraged) return;
    ctx.fillStyle = Math.floor(boss.time * 8) % 2 ? '#ff2848' : '#ffcd75';
    ctx.fillRect(-12, -24, 6, 3);
    ctx.fillRect(6, -24, 6, 3);
  },
});
