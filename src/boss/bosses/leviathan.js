/**
 * Chefe final verdadeiro: LEVIATÃ, a fortaleza estelar.
 *
 * Uma nave maior que a tela. O jogador voa sobre o casco e, a cada fase,
 * a "câmera" avança para a próxima das 8 seções (popa -> proa). Cada seção
 * tem seus pontos fracos e é desenhada em torno de um BUFF, que fica cada
 * vez mais necessário (mas nunca obrigatório):
 *
 *   1 Motores ............ aquecimento (sem buff específico)
 *   2 Hangares ........... enxames de alienígenas (Ala Companheira / Perfurante)
 *   3 Baterias Blindadas . blindagem: o Tiro Perfurante a ignora (+1 bomba)
 *   4 Corredor de Lasers . paredes de laser: o Dash atravessa
 *   5 Reatores Gêmeos .... regeneram: exige poder de fogo (Ala Companheira) (+1 bomba)
 *   6 Tempestade ......... cortina de projéteis: hora da Bomba
 *   7 Ponte de Comando ... blindagem + lasers + escoltas (+1 bomba)
 *   8 Núcleo ............. tudo junto; o núcleo regenera
 *
 * O casco não é sólido (está "abaixo" do jogador): só as peças sobre ele
 * bloqueiam tiros. O casco é desenhado por código (graphics/leviathanHull.js).
 */
import { GAME_WIDTH } from '../../config.js';
import { approach, rand } from '../../utils/math.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';
import { drawLeviathanHull } from '../../graphics/leviathanHull.js';

const CENTER_X = GAME_WIDTH / 2;
const SECTION_H = 240;
const sectionCenter = (i) => -(i + 0.5) * SECTION_H;

const ORB = { kind: 'orb', color: '#e43b8c', radius: 4 };
const ORB_ORANGE = { kind: 'orb', color: '#ef7d57', radius: 4 };
const NEEDLE = { kind: 'needle', color: '#ffcd75', radius: 3 };
const RAIN = { kind: 'orb', color: '#73eff7', radius: 3 };
const MINE = { kind: 'mine', color: '#a7f070', radius: 5, homing: 2.2, turnRate: 1.7, life: 7 };
const BIG = { kind: 'orb', color: '#b13e53', radius: 7 };
const METAL = ['#566c86', '#94b0c2', '#333c57'];

const PARTS = [
  // S1 Motores
  { id: 'engTurretL', name: 'Torreta de Popa E', sprite: 'turret', ox: -120, oy: -150, hp: 33, phase: 0, look: 'husk', points: 3000, debrisColors: METAL },
  { id: 'engTurretR', name: 'Torreta de Popa D', sprite: 'turret', ox: 120, oy: -150, hp: 33, phase: 0, look: 'husk', points: 3000, drop: 'double', debrisColors: METAL },
  // S2 Hangares
  { id: 'hangarL', name: 'Hangar Esquerdo', sprite: 'hangar', ox: -110, oy: -360, hp: 45, phase: 1, look: 'husk', points: 3500, drop: 'shield' },
  { id: 'hangarR', name: 'Hangar Direito', sprite: 'hangar', ox: 110, oy: -360, hp: 45, phase: 1, look: 'husk', points: 3500 },
  // S3 Baterias blindadas
  { id: 'bunkerL', name: 'Bateria E', sprite: 'bunker', ox: -140, oy: -610, hp: 40, armor: 0.65, phase: 2, look: 'husk', points: 4000, debrisColors: METAL },
  { id: 'bunkerC', name: 'Bateria Central', sprite: 'bunker', ox: 0, oy: -580, hp: 40, armor: 0.65, phase: 2, look: 'husk', points: 4000, drop: 'life', debrisColors: METAL },
  { id: 'bunkerR', name: 'Bateria D', sprite: 'bunker', ox: 140, oy: -610, hp: 40, armor: 0.65, phase: 2, look: 'husk', points: 4000, debrisColors: METAL },
  // S4 Corredor de lasers
  { id: 'emitterL', name: 'Emissor E', sprite: 'generator', ox: -170, oy: -860, hp: 40, phase: 3, look: 'husk', points: 4000, debrisColors: ['#73eff7', '#41a6f6'] },
  { id: 'emitterR', name: 'Emissor D', sprite: 'generator', ox: 170, oy: -860, hp: 40, phase: 3, look: 'husk', points: 4000, drop: 'rapid', debrisColors: ['#73eff7', '#41a6f6'] },
  // S5 Reatores gêmeos (regeneram)
  { id: 'reactorL', name: 'Reator E', sprite: 'reactor', ox: -90, oy: -1080, hp: 60, regen: 8, phase: 4, look: 'husk', points: 5000, drop: 'shield', debrisColors: ['#a7f070', '#257179'] },
  { id: 'reactorR', name: 'Reator D', sprite: 'reactor', ox: 90, oy: -1080, hp: 60, regen: 8, phase: 4, look: 'husk', points: 5000, debrisColors: ['#a7f070', '#257179'] },
  // S6 Tempestade
  { id: 'storm', name: 'Canhão de Tempestade', sprite: 'storm', ox: 0, oy: -1320, hp: 105, phase: 5, look: 'husk', points: 8000, drop: 'life', explosionScale: 2.5 },
  // S7 Ponte de comando (torretas laterais indestrutíveis)
  { id: 'bridgeTurretL', name: 'Torreta da Ponte E', sprite: 'turret', ox: -160, oy: -1545, solidUntilPhase: 7 },
  { id: 'bridgeTurretR', name: 'Torreta da Ponte D', sprite: 'turret', ox: 160, oy: -1545, solidUntilPhase: 7 },
  { id: 'bridge', name: 'Ponte de Comando', sprite: 'bridge', ox: 0, oy: -1575, hp: 120, armor: 0.5, phase: 6, look: 'husk', points: 10000, drop: 'shield', explosionScale: 3 },
  // S8 Núcleo
  { id: 'core', name: 'Núcleo do Leviatã', sprite: 'levCore', ox: 0, oy: -1800, hp: 160, regen: 2.5, regenDelay: 2, phase: 7, look: 'remove', pulse: true, points: 30000, explosionScale: 3.5, debrisColors: ['#e43b8c', '#ffcd75', '#8e478c'] },
];

/** Movimento comum: a nave deriva levemente e a câmera segue a seção atual. */
function cruise(boss, dt) {
  boss.x = CENTER_X + Math.sin(boss.time * 0.3) * 10;
  boss.y = approach(boss.y, boss.homeY, 120 * dt);
}

const partPos = (boss, id) => boss.worldPoint(boss.parts[id].ox, boss.parts[id].oy);
const alive = (boss, ids) => ids.filter((id) => !boss.parts[id].destroyed);

/** Parede de laser horizontal com uma brecha (o Dash atravessa sem precisar da brecha). */
function laserWall(boss, gap = 84) {
  boss.world.spawnLaserWall({ gapX: rand(70, GAME_WIDTH - 70), gap, speed: 170 });
}

const PHASES = [
  {
    id: 'engines', title: 'MOTORES', hint: 'Destrua as torretas de popa!',
    targets: ['engTurretL', 'engTurretR'],
    move: cruise,
    attack(boss, dt) {
      const w = boss.world;
      for (const id of alive(boss, ['engTurretL', 'engTurretR'])) {
        if (every(boss, id, 1.5, dt, id.endsWith('L') ? 0.8 : 1.5)) {
          const p = partPos(boss, id);
          fireSpread(w, p.x, p.y + 16, aimAtPlayer(w, p.x, p.y), 3, 0.3, 170, ORB_ORANGE);
          w.audio.play('enemyShoot');
        }
      }
      if (every(boss, 'wave', 6, dt, 3)) w.spawnMinionWave(3);
    },
  },
  {
    id: 'hangars', title: 'HANGARES', hint: 'Enxames! Ala Companheira e Perfurante ajudam.',
    targets: ['hangarL', 'hangarR'],
    move: cruise,
    attack(boss, dt) {
      const w = boss.world;
      const open = alive(boss, ['hangarL', 'hangarR']);
      for (const id of open) {
        if (every(boss, id, open.length === 1 ? 1.4 : 2.3, dt, id.endsWith('L') ? 1 : 2)) {
          const p = partPos(boss, id);
          w.spawnMinion(p.x, p.y + 14, { entryTime: 0.6, dir: id.endsWith('L') ? -1 : 1, type: Math.random() < 0.3 ? 'orange' : 'green' });
        }
      }
      if (every(boss, 'ring', 3.2, dt, 1.6)) {
        const c = boss.worldPoint(0, sectionCenter(1));
        fireRing(w, c.x, c.y, 10, 100, boss.time, ORB);
      }
    },
  },
  {
    id: 'batteries', title: 'BATERIAS BLINDADAS', hint: 'Blindadas! O Tiro Perfurante ignora a blindagem.',
    targets: ['bunkerL', 'bunkerC', 'bunkerR'],
    bombRefill: true,
    move: cruise,
    attack(boss, dt) {
      const w = boss.world;
      alive(boss, ['bunkerL', 'bunkerC', 'bunkerR']).forEach((id, i) => {
        if (every(boss, id, 2.4, dt, 0.8 + i * 0.8)) {
          const p = partPos(boss, id);
          fireSpread(w, p.x, p.y + 18, aimAtPlayer(w, p.x, p.y), 5, 0.7, 165, NEEDLE);
          w.audio.play('enemyShoot');
        }
      });
    },
  },
  {
    id: 'corridor', title: 'CORREDOR DE LASERS', hint: 'Use o DASH (C) para atravessar os lasers!',
    targets: ['emitterL', 'emitterR'],
    move: cruise,
    attack(boss, dt) {
      const w = boss.world;
      const emitters = alive(boss, ['emitterL', 'emitterR']);
      if (every(boss, 'wall', emitters.length === 2 ? 2.6 : 3.4, dt, 1.5)) laserWall(boss);
      for (const id of emitters) {
        if (every(boss, id, 2, dt, id.endsWith('L') ? 1 : 2)) {
          const p = partPos(boss, id);
          fireSpread(w, p.x, p.y, aimAtPlayer(w, p.x, p.y), 1, 0, 210, NEEDLE);
        }
      }
    },
  },
  {
    id: 'reactors', title: 'REATORES GÊMEOS', hint: 'Regeneram! Concentre o fogo (Ala Companheira).',
    targets: ['reactorL', 'reactorR'],
    bombRefill: true,
    move: cruise,
    attack(boss, dt) {
      const w = boss.world;
      for (const id of alive(boss, ['reactorL', 'reactorR'])) {
        if (every(boss, id, 2.8, dt, id.endsWith('L') ? 1 : 2.4)) {
          const p = partPos(boss, id);
          fireSpread(w, p.x, p.y + 16, Math.PI / 2, 1, 0, 90, MINE);
        }
      }
      if (every(boss, 'ring', 2.6, dt, 1.4)) {
        const c = boss.worldPoint(0, sectionCenter(4));
        fireRing(w, c.x, c.y, 12, 105, boss.time, ORB);
      }
    },
  },
  {
    id: 'storm', title: 'TEMPESTADE', hint: 'Cortina de projéteis: use a BOMBA (X)!',
    targets: ['storm'],
    move: cruise,
    attack(boss, dt) {
      const w = boss.world;
      // Ciclo: 3 s de chuva intensa, 1,5 s de pausa.
      boss.timers.cycle = ((boss.timers.cycle ?? 0) + dt) % 4.5;
      if (boss.timers.cycle < 3 && every(boss, 'rain', 0.07, dt, 0)) {
        const p = partPos(boss, 'storm');
        const barrel = [-24, 0, 24][Math.floor(Math.random() * 3)];
        fireSpread(w, p.x + barrel, p.y + 20, Math.PI / 2 + rand(-0.55, 0.55), 1, 0, rand(150, 200), RAIN);
      }
      if (every(boss, 'big', 2.2, dt, 1.2)) {
        const p = partPos(boss, 'storm');
        fireSpread(w, p.x, p.y, aimAtPlayer(w, p.x, p.y), 1, 0, 220, BIG);
      }
    },
  },
  {
    id: 'bridge', title: 'PONTE DE COMANDO', hint: 'Blindagem + lasers: Perfurante e Dash!',
    targets: ['bridge'],
    bombRefill: true,
    move: cruise,
    attack(boss, dt) {
      const w = boss.world;
      for (const id of ['bridgeTurretL', 'bridgeTurretR']) {
        if (every(boss, id, 1.8, dt, id.endsWith('L') ? 0.6 : 1.5)) {
          const p = partPos(boss, id);
          fireSpread(w, p.x, p.y + 16, aimAtPlayer(w, p.x, p.y), 2, 0.2, 190, ORB_ORANGE);
        }
      }
      if (every(boss, 'wall', 3.4, dt, 2)) laserWall(boss, 90);
      if (every(boss, 'wave', 7, dt, 4)) w.spawnMinionWave(2, { orange: 2 });
    },
  },
  {
    id: 'core', title: 'NÚCLEO DO LEVIATÃ', hint: 'Use TUDO o que você conquistou!',
    targets: ['core'],
    enrage: true,
    move: cruise,
    attack(boss, dt) {
      const w = boss.world;
      const c = partPos(boss, 'core');
      const ratio = boss.parts.core.healthRatio;
      if (every(boss, 'spiral', 0.15, dt, 0.8)) {
        boss.timers.spin = (boss.timers.spin ?? 0) + 0.25;
        fireRing(w, c.x, c.y, ratio < 0.5 ? 4 : 3, 125, boss.timers.spin, ORB);
      }
      if (every(boss, 'ring', 3, dt, 2)) fireRing(w, c.x, c.y, 16, 95, boss.time, ORB_ORANGE);
      if (every(boss, 'wall', ratio < 0.5 ? 3.2 : 4.2, dt, 3)) laserWall(boss, 96);
      if (every(boss, 'wave', 6, dt, 4)) w.spawnMinionWave(4, { orange: 2 });
    },
  },
];

export const LEVIATHAN = Object.freeze({
  id: 'leviathan',
  name: 'LEVIATÃ',
  intro: { title: 'ALERTA MÁXIMO', subtitle: 'FORTALEZA ESTELAR LEVIATÃ' },
  description: 'A fortaleza estelar. Oito seções. Todos os seus buffs serão testados.',
  parTime: 420,
  size: { w: 420, h: 200 },
  contactDamage: false, // o jogador voa sobre o casco
  music: 'boss',
  phaseClearText: 'AVANÇANDO PARA A PRÓXIMA SEÇÃO...',
  timing: { entry: 4.5, transition: 2.6, death: 4.5, startY: -80, homeY: 310 },
  debrisColors: ['#566c86', '#94b0c2', '#8e478c', '#e43b8c'],
  parts: PARTS,
  phases: PHASES,

  /** A câmera posiciona a seção da fase i perto do topo da tela. */
  phaseHomeY: (i) => 310 + i * SECTION_H,

  /** Explosões de morte acontecem na seção atual. */
  focusPoint: (boss) => ({ x: 0, y: sectionCenter(boss.phaseIndex) }),

  drawBehind: drawLeviathanHull,
});
