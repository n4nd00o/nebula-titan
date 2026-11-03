/**
 * Mini-chefe GÊMEOS (Mundo 3) — duas naves irmãs ligadas por um raio de energia.
 *
 * Fase 1 (Irmãos): as naves giram em órbita larga ao redor de um ponto e,
 *   na maior parte do tempo, um RAIO LETAL as une (pisca antes de ligar).
 *   Destruir uma deixa a outra furiosa: gira e atira mais rápido, mas o raio cai.
 * Fase 2 (Elo): o núcleo que as ligava aparece e dispara padrões espelhados.
 *
 * Recompensa: ALA DUPLA (uma segunda nave aliada).
 */
import { GAME_WIDTH } from '../../config.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';
import { drawBeamWarning, drawLethalBeam } from '../beams.js';

const CENTER_X = GAME_WIDTH / 2;
const RX = 150;
const RY = 120;
const LINK = Object.freeze({ on: 2.6, off: 1.6, warn: 0.6, width: 8 });
const FIRE = ['#ef7d57', '#ffcd75', '#b13e53'];
const ORB = { kind: 'orb', color: '#ef7d57', radius: 4 };
const NEEDLE = { kind: 'needle', color: '#ffcd75', radius: 3 };

const twinDef = (id, drop) => ({
  id, name: id === 'twinA' ? 'Irmão Alfa' : 'Irmão Beta', sprite: 'twin', ox: 0, oy: 0, hp: 90, phase: 0,
  look: 'remove', points: 4000, drop, explosionScale: 2, debrisColors: FIRE,
});

const PARTS = [
  {
    id: 'link', name: 'Núcleo do Elo', sprite: 'twinLink', ox: 0, oy: 0, hp: 150, phase: 1, visibleFromPhase: 1,
    look: 'remove', points: 9000, pulse: true, explosionScale: 2.6, debrisColors: ['#e43b8c', '#ffcd75'],
  },
  twinDef('twinA', 'shield'),
  twinDef('twinB', 'double'),
];

const twins = (boss) => [boss.parts.twinA, boss.parts.twinB].filter((p) => !p.destroyed);

/** O raio entre as naves está ligado agora? (só com as duas vivas, na fase 1) */
function linkState(boss) {
  if (boss.phaseIndex !== 0 || twins(boss).length < 2) return 'off';
  const t = (boss.vars.linkT ?? 0) % (LINK.on + LINK.off);
  if (t < LINK.on) return 'on';
  return t > LINK.on + LINK.off - LINK.warn ? 'warn' : 'off';
}

const PHASES = [
  {
    id: 'brothers',
    title: 'IRMÃOS',
    hint: 'Cuidado com o raio que liga as naves!',
    targets: ['twinA', 'twinB'],
    onStart(boss) {
      boss.vars.linkT = LINK.on; // começa desligado (dá tempo de ler a luta)
    },

    move(boss, dt) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.4) * 30;
      boss.y = boss.homeY;
      boss.vars.linkT = (boss.vars.linkT ?? 0) + dt;
    },

    attack(boss, dt) {
      const world = boss.world;
      const alive = twins(boss);
      const furious = alive.length === 1;
      for (const twin of alive) {
        if (every(boss, twin.id, furious ? 0.8 : 1.6, dt, twin.id === 'twinA' ? 0.6 : 1.4)) {
          const p = boss.worldPoint(twin.ox, twin.oy);
          fireSpread(world, p.x, p.y, aimAtPlayer(world, p.x, p.y), furious ? 5 : 3, 0.5, 190, NEEDLE);
          world.audio.play('enemyShoot');
        }
      }
      if (furious && every(boss, 'ring', 2.2, dt, 1)) {
        const p = boss.worldPoint(alive[0].ox, alive[0].oy);
        fireRing(world, p.x, p.y, 12, 110, boss.time, ORB);
      }
    },
  },
  {
    id: 'link',
    title: 'ELO',
    hint: 'O núcleo dispara em espelho!',
    targets: ['link'],
    enrage: true,

    move(boss) {
      const t = boss.time * 0.9;
      boss.x = CENTER_X + Math.sin(t) * 130;
      boss.y = boss.homeY + Math.sin(t * 2) * 40;
    },

    attack(boss, dt) {
      const world = boss.world;
      const ratio = boss.parts.link.healthRatio;
      if (every(boss, 'mirror', ratio < 0.5 ? 0.6 : 0.85, dt, 0.4)) {
        // Leque mirado no jogador + o mesmo leque espelhado no eixo vertical.
        const a = aimAtPlayer(world, boss.x, boss.y);
        fireSpread(world, boss.x, boss.y, a, 3, 0.3, 200, NEEDLE);
        fireSpread(world, boss.x, boss.y, Math.PI - a, 3, 0.3, 200, NEEDLE);
      }
      if (every(boss, 'ring', 2.2, dt, 1.2)) fireRing(world, boss.x, boss.y, 16, 105, boss.time, ORB);
      if (every(boss, 'wave', 7, dt, 3)) world.spawnMinionWave(3, { type: 'purple' });
    },
  },
];

export const TWINS = Object.freeze({
  id: 'twins',
  name: 'GÊMEOS',
  intro: { title: 'ALVO DETECTADO', subtitle: 'GÊMEOS' },
  description: 'Duas naves irmãs unidas por um raio letal.',
  icon: { sprite: 'twin', scale: 1.2 },
  parTime: 140,
  size: { w: 300, h: 120 },
  timing: { entry: 2.4, transition: 1.8, death: 2.4, homeY: 200 },
  debrisColors: FIRE,
  parts: PARTS,
  phases: PHASES,

  /** Órbita elíptica das duas naves (mais rápida quando uma cai). */
  update(boss, dt) {
    const v = boss.vars;
    const speed = twins(boss).length === 1 ? 1.3 : 0.7;
    v.angle = (v.angle ?? 0) + speed * dt;
    const pairs = [['twinA', 0], ['twinB', Math.PI]];
    for (const [id, offset] of pairs) {
      boss.parts[id].ox = Math.cos(v.angle + offset) * RX;
      boss.parts[id].oy = Math.sin(v.angle + offset) * RY;
    }
  },

  segments(boss) {
    if (linkState(boss) !== 'on' || boss.state !== 'fight') return [];
    const a = boss.worldPoint(boss.parts.twinA.ox, boss.parts.twinA.oy);
    const b = boss.worldPoint(boss.parts.twinB.ox, boss.parts.twinB.oy);
    return [{ x1: a.x, y1: a.y, x2: b.x, y2: b.y, width: LINK.width }];
  },

  drawWorld(ctx, boss) {
    if (boss.state !== 'fight') return;
    const state = linkState(boss);
    if (state === 'off') return;
    const a = boss.worldPoint(boss.parts.twinA.ox, boss.parts.twinA.oy);
    const b = boss.worldPoint(boss.parts.twinB.ox, boss.parts.twinB.oy);
    if (state === 'warn') drawBeamWarning(ctx, a.x, a.y, b.x, b.y, boss.time, 'rgba(255, 205, 117, 0.85)');
    else drawLethalBeam(ctx, { x1: a.x, y1: a.y, x2: b.x, y2: b.y, width: LINK.width }, ['rgba(239, 125, 87, 0.35)', 'rgba(255, 205, 117, 0.9)']);
  },
});
