/**
 * Mini-chefe ARTILHEIRO (Mundo 5, 2º círculo) — uma bateria de raios.
 *
 * Fase 1 (Canhões): dois canhões MIRAM em você, avisam com uma linha piscando
 *   e disparam um raio letal; eles se revezam.
 * Fase 2 (Canhão Mestre): o núcleo dispara três raios em leque, com aviso.
 *
 * Tema: ler o aviso e sair da linha. Recompensa: SUPERCARGA.
 */
import { GAME_WIDTH } from '../../config.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';
import { updateCannonBeam, cannonSegment, drawCannonBeam } from '../sweepers.js';

const CENTER_X = GAME_WIDTH / 2;
const ARMS = ['#566c86', '#a7f070', '#ef7d57'];
const ORB = { kind: 'orb', color: '#a7f070', radius: 4 };
const BEAM_COLORS = ['rgba(167, 240, 112, 0.35)', 'rgba(167, 240, 112, 0.9)'];
const FAN = [-0.45, 0, 0.45];

const PARTS = [
  // O casco envolve o núcleo: deixa de bloquear tiros na fase do núcleo.
  { id: 'hull', name: 'Casco', sprite: 'gunner', ox: 0, oy: 0, look: 'none', solidUntilPhase: 1 },
  { id: 'gunL', name: 'Canhão E', sprite: 'gunBarrel', ox: -44, oy: 18, hp: 65, phase: 0, look: 'husk', points: 4000, debrisColors: ARMS },
  { id: 'gunR', name: 'Canhão D', sprite: 'gunBarrel', ox: 44, oy: 18, hp: 65, phase: 0, look: 'husk', points: 4000, drop: 'shield', debrisColors: ARMS },
  { id: 'core', name: 'Canhão Mestre', sprite: 'gunnerCore', ox: 0, oy: 0, hp: 150, phase: 1, look: 'remove', pulse: true, points: 12000, explosionScale: 2.6, debrisColors: ARMS },
];

const muzzle = (boss, id) => (boss.parts[id].destroyed ? null : boss.worldPoint(boss.parts[id].ox, boss.parts[id].oy + 16));

const PHASES = [
  {
    id: 'guns',
    title: 'CANHÕES',
    hint: 'Linha piscando = raio chegando. Saia da linha!',
    targets: ['gunL', 'gunR'],
    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.45) * 90;
      boss.y = boss.homeY + Math.sin(boss.time * 1.0) * 8;
    },
    attack(boss, dt) {
      updateCannonBeam(boss, 'beamL', muzzle(boss, 'gunL'), dt, { delay: 0 });
      updateCannonBeam(boss, 'beamR', muzzle(boss, 'gunR'), dt, { delay: 1.3 });
      if (every(boss, 'ring', 2.6, dt, 1.2)) fireRing(boss.world, boss.x, boss.y, 10, 110, boss.time, ORB);
    },
  },
  {
    id: 'master',
    title: 'CANHÃO MESTRE',
    hint: 'Três raios em leque: procure o vão!',
    targets: ['core'],
    onStart(boss) {
      for (const k of ['beamL', 'beamR']) delete boss.vars[k];
    },
    move(boss) {
      boss.x = CENTER_X + Math.sin(boss.time * 0.5) * 90;
      boss.y = boss.homeY + Math.sin(boss.time * 1.0) * 8;
    },
    attack(boss, dt) {
      const origin = boss.worldPoint(0, 12);
      FAN.forEach((offset, i) => updateCannonBeam(boss, `fan${i}`, origin, dt, { offset, charge: 1.2, fire: 0.8, rest: 1.4 }));
      if (every(boss, 'aimed', 1.4, dt, 0.7)) {
        fireSpread(boss.world, boss.x, boss.y, aimAtPlayer(boss.world, boss.x, boss.y), 3, 0.5, 180, ORB);
      }
    },
  },
];

const BEAM_KEYS = ['beamL', 'beamR', 'fan0', 'fan1', 'fan2'];

export const GUNNER = Object.freeze({
  id: 'gunner',
  name: 'ARTILHEIRO',
  intro: { title: 'ALVO DETECTADO', subtitle: 'ARTILHEIRO' },
  description: 'Bateria de raios. Avisa antes de disparar.',
  icon: { sprite: 'gunner', scale: 0.8 },
  parTime: 160,
  size: { w: 120, h: 50 },
  timing: { entry: 2.4, transition: 1.8, death: 2.6, homeY: 130 },
  debrisColors: ARMS,
  parts: PARTS,
  phases: PHASES,
  segments: (boss) => BEAM_KEYS.map((k) => cannonSegment(boss.vars[k])).filter(Boolean),
  drawWorld(ctx, boss) {
    if (boss.state !== 'fight') return;
    for (const k of BEAM_KEYS) drawCannonBeam(ctx, boss.vars[k], BEAM_COLORS);
  },
});
