/**
 * Chefe final verdadeiro: ÔMEGA, o criador da frota (Mundo 5, v1.5).
 *
 * Extremamente difícil por projeto: OITO fases, cada uma usando a arma de um
 * guardião que o jogador já venceu, e uma última fase que junta tudo.
 *
 *   1 Anéis de Ômega ... quatro nós orbitais (lembra a Sentinela)
 *   2 Tempo Partido .... ponteiros-raio giratórios + anéis congelados (Cronos)
 *   3 Espelhos ......... leques que ricocheteiam + tiros refletidos (Reflexo)
 *   4 Legião ........... kamikazes + paredes de laser (Legião)
 *   5 Vazio ............ o véu fica intangível, puxa a nave e solta esporos (Espectro, Parasita)
 *   6 Artilharia ....... canhões que avisam e disparam raios (Artilheiro)
 *   7 Inferno .......... chuva de brasas + espirais (Fênix)
 *   8 Ômega ............ o núcleo regenera e usa TUDO ao mesmo tempo
 *
 * Na campanha ele ainda recebe hpScale alto e escala com os buffs do jogador.
 * O casco não bloqueia tiros (só as peças de cada fase são sólidas).
 */
import { GAME_WIDTH } from '../../config.js';
import { TAU, rand } from '../../utils/math.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';
import {
  resetHands, updateHands, handSegments, drawHands,
  updateCannonBeam, cannonSegment, drawCannonBeam, emberRain,
} from '../sweepers.js';

const CENTER_X = GAME_WIDTH / 2;
const VOID = ['#8e478c', '#e43b8c', '#ffcd75', '#f4f4f4'];
const ORB = { kind: 'orb', color: '#e43b8c', radius: 4 };
const GOLD = { kind: 'orb', color: '#ffcd75', radius: 4 };
const FROZEN = { kind: 'orb', color: '#ffcd75', radius: 4, accel: 240, maxSpeed: 220 };
const NEEDLE = { kind: 'needle', color: '#f4f4f4', radius: 3 };
const SHARD = { kind: 'shard', color: '#73eff7', radius: 4, bounce: 2 };
const SPORE = { kind: 'mine', color: '#a7f070', radius: 5, homing: 1.6, turnRate: 1.5, life: 6 };
const EMBER = { kind: 'orb', color: '#ef7d57', radius: 3 };
const NODE_IDS = ['nodeA', 'nodeB', 'nodeC', 'nodeD'];
const HAND_LENGTHS = [300, 360];
const BEAM_COLORS = ['rgba(228, 59, 140, 0.35)', 'rgba(228, 59, 140, 0.9)'];
const BEAM_KEYS = ['beamL', 'beamR', 'coreBeam'];

const part = (id, name, sprite, ox, oy, hp, phase, extra = {}) => ({
  id, name, sprite, ox, oy, hp, phase, visibleFromPhase: phase, look: 'remove', points: 6000, debrisColors: VOID, ...extra,
});

const PARTS = [
  // Casco: nunca bloqueia tiros (só as peças de cada fase são sólidas).
  { id: 'hull', name: 'Casco de Ômega', sprite: 'omega', ox: 0, oy: 0, look: 'none', solidUntilPhase: 0 },
  ...NODE_IDS.map((id, i) => ({ ...part(id, 'Nó Orbital', 'omegaNode', 0, 0, 45, 0), visibleFromPhase: 0, drop: i === 3 ? 'shield' : null })),
  part('gearL', 'Engrenagem E', 'gear', -72, 34, 80, 1),
  part('gearR', 'Engrenagem D', 'gear', 72, 34, 80, 1, { drop: 'rapid' }),
  part('mirrorL', 'Espelho E', 'mirrorWingL', -112, 12, 80, 2),
  part('mirrorR', 'Espelho D', 'mirrorWingR', 112, 12, 80, 2, { drop: 'shield' }),
  part('bayL', 'Hangar E', 'bay', -52, 36, 90, 3),
  part('bayR', 'Hangar D', 'bay', 52, 36, 90, 3, { drop: 'double' }),
  part('veil', 'Véu do Vazio', 'omegaVeil', 0, 34, 160, 4, { regen: 2, regenDelay: 1.5, drop: 'life' }),
  part('gunL', 'Canhão E', 'gunBarrel', -38, 42, 90, 5),
  part('gunR', 'Canhão D', 'gunBarrel', 38, 42, 90, 5, { drop: 'shield' }),
  part('flameL', 'Asa de Fogo E', 'flameWingL', -98, 8, 90, 6),
  part('flameR', 'Asa de Fogo D', 'flameWingR', 98, 8, 90, 6, { drop: 'rapid' }),
  part('core', 'Núcleo Ômega', 'omegaCore', 0, 0, 260, 7, { regen: 3, regenDelay: 2, pulse: true, points: 50000, explosionScale: 4 }),
];

/** Ciclo do véu, contado desde o início da fase 5. */
const veiled = (boss) => boss.phaseIndex === 4 && boss.state === 'fight' && (boss.timers.veilT ?? 0) % 4.5 > 3;

const alive = (boss, ids) => ids.filter((id) => !boss.parts[id].destroyed);
const pos = (boss, id, dy = 0) => boss.worldPoint(boss.parts[id].ox, boss.parts[id].oy + dy);

function sway(speed, amp, bob = 10) {
  return (boss) => {
    boss.x = CENTER_X + Math.sin(boss.time * speed) * amp;
    boss.y = boss.homeY + Math.sin(boss.time * speed * 2) * bob;
  };
}

function spiral(boss, dt, interval, arms, style, speed = 120) {
  if (every(boss, 'spiral', interval, dt, 0.5)) {
    boss.timers.spin = (boss.timers.spin ?? 0) + 0.3;
    fireRing(boss.world, boss.x, boss.y, arms, speed, boss.timers.spin, style);
  }
}

function mirroredShot(boss, x, y) {
  const w = boss.world;
  fireSpread(w, x, y, aimAtPlayer(w, x, y), 1, 0, 220, NEEDLE);
  fireSpread(w, x, y, Math.atan2(w.player.y - y, GAME_WIDTH - w.player.x - x), 1, 0, 220, NEEDLE);
}

const PHASES = [
  {
    id: 'nodes', title: 'ANÉIS DE ÔMEGA', hint: 'Ele conhece todos os guardiões. Prepare-se.',
    targets: NODE_IDS,
    move: sway(0.4, 70),
    attack(boss, dt) {
      const w = boss.world;
      alive(boss, NODE_IDS).forEach((id, i) => {
        if (every(boss, id, 1.6, dt, 0.5 + i * 0.4)) {
          const p = pos(boss, id);
          fireSpread(w, p.x, p.y, aimAtPlayer(w, p.x, p.y), 2, 0.25, 190, ORB);
        }
      });
      if (every(boss, 'ring', 2.2, dt, 1.2)) fireRing(w, boss.x, boss.y, 16, 105, boss.time, GOLD);
    },
  },
  {
    id: 'time', title: 'TEMPO PARTIDO', hint: 'Ponteiros letais e anéis congelados!',
    targets: ['gearL', 'gearR'],
    onStart: resetHands,
    move: sway(0.3, 50, 8),
    attack(boss, dt) {
      updateHands(boss, dt, [0.6, -0.9]);
      if (every(boss, 'frozen', 2.4, dt, 1.5)) fireRing(boss.world, boss.x, boss.y, 16, 8, boss.time, FROZEN);
      for (const id of alive(boss, ['gearL', 'gearR'])) {
        if (every(boss, id, 1.8, dt, id === 'gearL' ? 0.7 : 1.5)) {
          const p = pos(boss, id, 10);
          fireSpread(boss.world, p.x, p.y, aimAtPlayer(boss.world, p.x, p.y), 3, 0.3, 200, NEEDLE);
        }
      }
    },
  },
  {
    id: 'mirrors', title: 'ESPELHOS', hint: 'Cristais que voltam das bordas!',
    targets: ['mirrorL', 'mirrorR'],
    move: sway(0.5, 60),
    attack(boss, dt) {
      const w = boss.world;
      for (const [id, side] of [['mirrorL', -1], ['mirrorR', 1]]) {
        if (boss.parts[id].destroyed) continue;
        if (every(boss, id, 1.2, dt, side < 0 ? 0.4 : 1)) {
          const p = pos(boss, id);
          fireSpread(w, p.x, p.y, Math.PI / 2 + side * 0.8, 4, 0.45, 175, SHARD);
        }
      }
      if (every(boss, 'mirror', 1.5, dt, 1)) mirroredShot(boss, boss.x, boss.y + 20);
    },
  },
  {
    id: 'legion', title: 'LEGIÃO', hint: 'Kamikazes e lasers: DASH!',
    targets: ['bayL', 'bayR'],
    move: sway(0.35, 70),
    attack(boss, dt) {
      const w = boss.world;
      const open = alive(boss, ['bayL', 'bayR']);
      for (const id of open) {
        if (every(boss, id, open.length === 1 ? 1 : 1.5, dt, id === 'bayL' ? 0.6 : 1.3)) {
          const p = pos(boss, id, 10);
          w.spawnMinion(p.x, p.y, { entryTime: 0.5, dir: id === 'bayL' ? -1 : 1, type: Math.random() < 0.6 ? 'red' : 'purple' });
        }
      }
      if (every(boss, 'wall', 2.8, dt, 1.5)) w.spawnLaserWall({ gapX: rand(70, GAME_WIDTH - 70), gap: 88, speed: 180 });
      if (every(boss, 'ring', 2.6, dt, 2)) fireRing(w, boss.x, boss.y, 12, 110, boss.time, ORB);
    },
  },
  {
    id: 'void', title: 'VAZIO', hint: 'O véu some e volta. Ele te puxa!',
    targets: ['veil'],
    move: sway(0.45, 90, 12),
    attack(boss, dt) {
      const w = boss.world;
      boss.timers.veilT = (boss.timers.veilT ?? 0) + dt;
      if (every(boss, 'spores', 1.5, dt, 0.8)) {
        const p = pos(boss, 'veil', 10);
        fireSpread(w, p.x, p.y, aimAtPlayer(w, p.x, p.y), 3, 1.1, 120, SPORE);
      }
      spiral(boss, dt, 0.22, 2, ORB);
    },
  },
  {
    id: 'artillery', title: 'ARTILHARIA', hint: 'Linha piscando = raio. Saia da linha!',
    targets: ['gunL', 'gunR'],
    move: sway(0.4, 80),
    attack(boss, dt) {
      updateCannonBeam(boss, 'beamL', boss.parts.gunL.destroyed ? null : pos(boss, 'gunL', 16), dt, { rest: 1.3 });
      updateCannonBeam(boss, 'beamR', boss.parts.gunR.destroyed ? null : pos(boss, 'gunR', 16), dt, { rest: 1.3, delay: 1.1 });
      if (every(boss, 'ring', 2.2, dt, 1)) fireRing(boss.world, boss.x, boss.y, 14, 105, boss.time, GOLD);
    },
  },
  {
    id: 'inferno', title: 'INFERNO', hint: 'Fogo de cima e de todos os lados!',
    targets: ['flameL', 'flameR'],
    onStart(boss) {
      for (const k of BEAM_KEYS) delete boss.vars[k];
    },
    move: sway(0.6, 90, 14),
    attack(boss, dt) {
      if (every(boss, 'rain', 0.18, dt, 0.8)) emberRain(boss.world, 1, 170, EMBER);
      spiral(boss, dt, 0.17, 3, GOLD);
    },
  },
  {
    id: 'omega', title: 'ÔMEGA', hint: 'Tudo ao mesmo tempo. Use TUDO o que você tem!',
    targets: ['core'],
    enrage: true,
    onStart: resetHands,
    move: sway(0.5, 100, 16),
    attack(boss, dt) {
      const w = boss.world;
      const ratio = boss.parts.core.healthRatio;
      updateHands(boss, dt, [0.45, -0.7]);
      spiral(boss, dt, ratio < 0.5 ? 0.13 : 0.17, ratio < 0.5 ? 4 : 3, ORB, 125);
      updateCannonBeam(boss, 'coreBeam', boss.worldPoint(0, 22), dt, { rest: ratio < 0.5 ? 2 : 2.8 });
      if (every(boss, 'wall', ratio < 0.5 ? 3.4 : 4.4, dt, 3)) w.spawnLaserWall({ gapX: rand(70, GAME_WIDTH - 70), gap: 96, speed: 170 });
      if (every(boss, 'rain', 0.35, dt, 1)) emberRain(w, 1, 160, EMBER);
      if (every(boss, 'wave', 8, dt, 5)) w.spawnMinionWave(3, { type: 'red' });
    },
  },
];

export const OMEGA = Object.freeze({
  id: 'omega',
  name: 'ÔMEGA',
  intro: { title: 'ALERTA FINAL', subtitle: 'ÔMEGA, O CRIADOR DA FROTA' },
  description: 'O criador da frota. Oito fases. Usa a arma de cada guardião.',
  icon: { sprite: 'omegaCore', scale: 1.1 },
  parTime: 600,
  size: { w: 240, h: 110 },
  rageSprite: 'omega',
  music: 'boss',
  phaseClearText: 'ÔMEGA ESTÁ SE ADAPTANDO...',
  timing: { entry: 4, transition: 2.2, death: 5, homeY: 150 },
  debrisColors: VOID,
  parts: PARTS,
  phases: PHASES,

  /** Os nós da fase 1 orbitam o casco. */
  update(boss, dt) {
    const v = boss.vars;
    const speed = 0.9 + (4 - alive(boss, NODE_IDS).length) * 0.35;
    v.nodeAngle = (v.nodeAngle ?? 0) + speed * dt;
    NODE_IDS.forEach((id, i) => {
      const a = v.nodeAngle + (i * TAU) / 4;
      boss.parts[id].ox = Math.cos(a) * 92;
      boss.parts[id].oy = Math.sin(a) * 40 + 10;
    });
  },

  /** Fase 5: o véu fica intangível por 1,5 s a cada 4,5 s (o ciclo começa sólido). */
  intangible: veiled,
  alpha: (boss) => (veiled(boss) ? 0.35 : 1),

  /** Fase 5: puxa a nave; fase 8: puxa e empurra. */
  pull(boss) {
    if (boss.phaseIndex === 4) return { x: boss.x, y: boss.y, strength: 50 };
    if (boss.phaseIndex === 7) return { x: boss.x, y: boss.y, strength: boss.time % 6 < 4 ? 40 : -70 };
    return null;
  },

  segments(boss) {
    const segs = [];
    if (boss.phaseIndex === 1 || boss.phaseIndex === 7) segs.push(...handSegments(boss, HAND_LENGTHS, 10));
    for (const k of BEAM_KEYS) {
      const s = cannonSegment(boss.vars[k]);
      if (s) segs.push(s);
    }
    return segs;
  },

  drawWorld(ctx, boss) {
    if (boss.state !== 'fight') return;
    if (boss.phaseIndex === 1 || boss.phaseIndex === 7) drawHands(ctx, boss, HAND_LENGTHS, 10);
    for (const k of BEAM_KEYS) drawCannonBeam(ctx, boss.vars[k], BEAM_COLORS);
  },
});
