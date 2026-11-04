/**
 * Mini-chefe REFLEXO (Mundo 5, 1º círculo) — um cristal que espelha tudo.
 *
 * Fase 1 (Asas de Cristal): as asas disparam cristais que RICOCHETEIAM nas
 *   laterais da tela; cada tiro mirado em você tem um "reflexo" mirado no lado
 *   oposto da tela.
 * Fase 2 (Núcleo Prismático): leques de cristais que ricocheteiam várias vezes.
 *
 * Tema: prever trajetórias que voltam. Recompensa: RICOCHETE.
 */
import { GAME_WIDTH } from '../../config.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';

const CENTER_X = GAME_WIDTH / 2;
const CRYSTAL = ['#73eff7', '#41a6f6', '#f4f4f4'];
const SHARD = { kind: 'shard', color: '#73eff7', radius: 4, bounce: 2 };
const SHARD3 = { kind: 'shard', color: '#41a6f6', radius: 4, bounce: 3 };
const NEEDLE = { kind: 'needle', color: '#f4f4f4', radius: 3 };

const PARTS = [
  { id: 'wingL', name: 'Asa de Cristal E', sprite: 'mirrorWingL', ox: -42, oy: 4, hp: 70, phase: 0, look: 'remove', points: 4000, debrisColors: CRYSTAL },
  { id: 'wingR', name: 'Asa de Cristal D', sprite: 'mirrorWingR', ox: 42, oy: 4, hp: 70, phase: 0, look: 'remove', points: 4000, drop: 'rapid', debrisColors: CRYSTAL },
  { id: 'core', name: 'Núcleo Prismático', sprite: 'mirrorCore', ox: 0, oy: 0, hp: 140, phase: 1, look: 'remove', pulse: true, points: 12000, explosionScale: 2.6, debrisColors: CRYSTAL },
];

/** Tiro mirado + o seu reflexo, mirado no lado oposto da tela. */
function mirroredShot(boss, x, y) {
  const w = boss.world;
  fireSpread(w, x, y, aimAtPlayer(w, x, y), 1, 0, 210, NEEDLE);
  const mx = GAME_WIDTH - w.player.x;
  fireSpread(w, x, y, Math.atan2(w.player.y - y, mx - x), 1, 0, 210, NEEDLE);
}

const PHASES = [
  {
    id: 'wings',
    title: 'ASAS DE CRISTAL',
    hint: 'Os cristais ricocheteiam nas bordas da tela!',
    targets: ['wingL', 'wingR'],
    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.6) * 110;
      boss.y = boss.homeY + Math.sin(boss.time * 1.2) * 12;
    },
    attack(boss, dt) {
      const w = boss.world;
      for (const [id, side] of [['wingL', -1], ['wingR', 1]]) {
        const part = boss.parts[id];
        if (part.destroyed) continue;
        if (every(boss, id, 1.4, dt, side < 0 ? 0.5 : 1.2)) {
          const p = boss.worldPoint(part.ox, part.oy);
          fireSpread(w, p.x, p.y, Math.PI / 2 + side * 0.9, 3, 0.35, 170, SHARD);
          w.audio.play('enemyShoot');
        }
      }
      if (every(boss, 'mirror', 2, dt, 1.5)) mirroredShot(boss, boss.x, boss.y + 16);
    },
  },
  {
    id: 'core',
    title: 'NÚCLEO PRISMÁTICO',
    hint: 'Leques que voltam: olhe as bordas!',
    targets: ['core'],
    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.8) * 120;
      boss.y = boss.homeY + Math.sin(boss.time * 1.6) * 14;
    },
    attack(boss, dt) {
      const w = boss.world;
      const angry = boss.parts.core.healthRatio < 0.5;
      if (every(boss, 'fan', angry ? 1.2 : 1.6, dt, 0.8)) {
        fireSpread(w, boss.x, boss.y, Math.PI / 2, 7, 2.4, 160, SHARD3);
      }
      if (every(boss, 'mirror', 1.6, dt, 1)) mirroredShot(boss, boss.x, boss.y);
      if (every(boss, 'ring', 3.2, dt, 2)) fireRing(w, boss.x, boss.y, 12, 100, boss.time, SHARD);
    },
  },
];

export const MIRROR = Object.freeze({
  id: 'mirror',
  name: 'REFLEXO',
  intro: { title: 'ALVO DETECTADO', subtitle: 'REFLEXO, O CRISTAL' },
  description: 'Cristal vivo. Os tiros dele ricocheteiam nas bordas.',
  icon: { sprite: 'mirrorCore', scale: 1.1 },
  parTime: 150,
  size: { w: 120, h: 40 },
  timing: { entry: 2.4, transition: 1.8, death: 2.6, homeY: 140 },
  debrisColors: CRYSTAL,
  parts: PARTS,
  phases: PHASES,
});
