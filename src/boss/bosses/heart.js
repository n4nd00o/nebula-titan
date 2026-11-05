/**
 * Encontro especial (fora da campanha e do registro de chefes): CORAÇÃO ETERNO.
 * Aberto pela lupa do menu (src/scenes/SearchOverlay.js).
 *
 * Fase 1 (Asas do Cupido): as duas asas atiram flechas; o coração é blindado.
 * Fase 2 (Duas Metades): cada metade do coração vira alvo. Ao cair, revela
 *   um nome no lugar dela. A metade que sobra fica furiosa.
 * Fase 3 (Um Só Coração): o núcleo dourado aparece entre os nomes.
 *
 * A vitória mostra uma tela própria (drawVictory) no lugar do placar.
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H, UI_COLORS } from '../../config.js';
import { fireSpread, fireRing, aimAtPlayer, every } from '../patterns.js';
import { drawText } from '../../graphics/text.js';

/** Texto guardado em base64 (UTF-8). */
function decode(b64) {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const TEXT = {
  right: 'TFVJWg==',
  left: 'QU5EUkVTU0E=',
  message: 'QW1vciBkYSBtaW5oYSB2aWRhLCBlc3NhIGZhc2Ugw6kgc8OzIHVtYSBkYXMgY29pc2FzIHF1ZSBmYXJlaSBwb3Igdm9jw6ouIFBvciB2b2PDqiBldSBjb25zdHJ1byBjYXN0ZWxvcywgZGVzdHJ1byBtdW5kb3MgZSBlcmdvIHVtIGltcMOpcmlvIGludGVpcm8gc8OzIHByYSB0ZSBmYXplciBhIHBlc3NvYSBtYWlzIGZlbGl6IGRvIG11bmRvLiBOw6NvIGltcG9ydGEgb25kZSBpcmVtb3MgcGFyYXIsIGRlc2RlIHF1ZSBlc3RlamFtb3MganVudG9z4p2k',
  love: 'RXUgdGUgYW1vIG1pbCBtaWxow7Vlc+KdpOKdpA==',
};
const HEART = '❤';

const PINK = ['#e43b8c', '#f4f4f4', '#b13e53', '#ffcd75'];
const ARROW = { kind: 'needle', color: '#ffcd75', radius: 3 };
const LOVE = { kind: 'heart', color: '#e43b8c', radius: 5 };
const SMALL_LOVE = { kind: 'heart', color: '#f4f4f4', radius: 4 };
const ORB = { kind: 'orb', color: '#e43b8c', radius: 4 };

/** Ponto da curva do coração (t em radianos), normalizado para ~[-1, 1]. */
function heartPoint(t) {
  const s = Math.sin(t);
  return {
    x: (16 * s * s * s) / 17,
    y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17,
  };
}

/** Anel em forma de coração que se expande a partir de (x, y). */
function fireHeart(world, x, y, count, speed, style = LOVE) {
  for (let i = 0; i < count; i++) {
    const p = heartPoint((i / count) * Math.PI * 2);
    world.spawnEnemyBullet({ x, y, vx: p.x * speed, vy: p.y * speed, ...style });
  }
}

const halves = (boss) => [boss.parts.heartL, boss.parts.heartR].filter((p) => !p.destroyed);
const wings = (boss) => [boss.parts.wingL, boss.parts.wingR].filter((p) => !p.destroyed);

const PARTS = [
  {
    id: 'core', name: 'Núcleo do Coração', sprite: 'heartCore', ox: 0, oy: -4, hp: 140, phase: 2, visibleFromPhase: 2,
    points: 20000, pulse: true, explosionScale: 3, debrisColors: PINK,
  },
  {
    id: 'heartL', name: 'Metade Esquerda', sprite: 'heartL', ox: -33, oy: 0, hp: 80, phase: 1,
    points: 8000, explosionScale: 2.4, debrisColors: PINK,
  },
  {
    id: 'heartR', name: 'Metade Direita', sprite: 'heartR', ox: 33, oy: 0, hp: 80, phase: 1,
    points: 8000, explosionScale: 2.4, debrisColors: PINK,
  },
  {
    id: 'wingL', name: 'Asa Esquerda', sprite: 'heartWingL', ox: -104, oy: -18, hp: 48, phase: 0,
    points: 4000, explosionScale: 1.8, debrisColors: ['#f4f4f4', '#94b0c2', '#e43b8c'],
  },
  {
    id: 'wingR', name: 'Asa Direita', sprite: 'heartWingR', ox: 104, oy: -18, hp: 48, phase: 0,
    points: 4000, explosionScale: 1.8, debrisColors: ['#f4f4f4', '#94b0c2', '#e43b8c'],
  },
];

const PHASES = [
  {
    id: 'cupid',
    title: 'ASAS DO CUPIDO',
    hint: 'O coração é blindado: derrube as asas!',
    targets: ['wingL', 'wingR'],

    move(boss) {
      const t = boss.time * 0.7;
      boss.x = W / 2 + Math.sin(t) * 70;
      boss.y = boss.homeY + Math.sin(t * 2) * 18;
    },

    attack(boss, dt) {
      const world = boss.world;
      const angry = wings(boss).length === 1;
      for (const wing of wings(boss)) {
        if (every(boss, wing.id, angry ? 0.9 : 1.5, dt, wing.id === 'wingL' ? 0.5 : 1.25)) {
          const p = boss.worldPoint(wing.ox, wing.oy + 10);
          fireSpread(world, p.x, p.y, aimAtPlayer(world, p.x, p.y), angry ? 5 : 3, 0.45, 210, ARROW);
          world.audio.play('enemyShoot');
        }
      }
      if (every(boss, 'heart', 3.2, dt, 1.8)) fireHeart(world, boss.x, boss.y, 22, 120);
    },
  },
  {
    id: 'halves',
    title: 'DUAS METADES',
    hint: 'Cada metade guarda um segredo...',
    targets: ['heartL', 'heartR'],

    move(boss) {
      const t = boss.time * 0.85;
      boss.x = W / 2 + Math.sin(t) * 110;
      boss.y = boss.homeY + Math.sin(t * 2) * 30;
    },

    attack(boss, dt) {
      const world = boss.world;
      const alone = halves(boss).length === 1;
      if (every(boss, 'heart', alone ? 1.7 : 2.4, dt, 1)) {
        fireHeart(world, boss.x, boss.y, alone ? 26 : 22, 125);
      }
      for (const half of halves(boss)) {
        const side = half.id === 'heartL' ? -1 : 1;
        if (every(boss, half.id, alone ? 0.12 : 0.2, dt, 0.8)) {
          // Espiral: cada metade gira para um lado.
          const p = boss.worldPoint(half.ox + side * 10, half.oy + 10);
          const a = Math.PI / 2 + side * Math.sin(boss.time * 1.6) * 1.1;
          world.spawnEnemyBullet({ x: p.x, y: p.y, vx: Math.cos(a) * 165, vy: Math.sin(a) * 165, ...ORB, radius: 3 });
        }
      }
      if (every(boss, 'arrows', alone ? 1.6 : 2.6, dt, 2)) {
        fireSpread(world, boss.x, boss.y + 40, aimAtPlayer(world, boss.x, boss.y + 40), 3, 0.25, 240, ARROW);
        world.audio.play('enemyShoot');
      }
    },
  },
  {
    id: 'one',
    title: 'UM SÓ CORAÇÃO',
    hint: 'Acerte o núcleo dourado!',
    targets: ['core'],
    enrage: true,

    move(boss) {
      const t = boss.time * 0.95;
      boss.x = W / 2 + Math.sin(t) * 120;
      boss.y = boss.homeY + Math.sin(t * 2) * 36;
    },

    attack(boss, dt) {
      const world = boss.world;
      const low = boss.parts.core.healthRatio < 0.5;
      if (every(boss, 'spiral', low ? 0.09 : 0.12, dt, 0.6)) {
        const a = boss.time * 2.4;
        for (const o of [0, Math.PI]) {
          world.spawnEnemyBullet({ x: boss.x, y: boss.y, vx: Math.cos(a + o) * 150, vy: Math.sin(a + o) * 150, ...SMALL_LOVE });
        }
      }
      if (every(boss, 'heart', low ? 2 : 2.8, dt, 1.4)) fireHeart(world, boss.x, boss.y, 26, 135);
      if (every(boss, 'arrows', low ? 1.4 : 2, dt, 1)) {
        fireSpread(world, boss.x, boss.y, aimAtPlayer(world, boss.x, boss.y), 5, 0.6, 230, ARROW);
        world.audio.play('enemyShoot');
      }
      if (low && every(boss, 'ring', 3.4, dt, 1.5)) fireRing(world, boss.x, boss.y, 18, 100, boss.time, ORB);
    },
  },
];

// ------------------------------------------------------------ nomes
/** Desenha um coração de pixels com o canto superior esquerdo em (x, y). */
export function drawPixelHeart(ctx, x, y, size, color) {
  const shape = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
  const px = size / 7;
  ctx.fillStyle = color;
  shape.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] === '#') ctx.fillRect(Math.round(x + c * px), Math.round(y + r * px), Math.ceil(px), Math.ceil(px));
    }
  });
}

function drawName(ctx, boss, part, text) {
  if (!part.destroyed) return;
  const t = boss.vars.reveal?.[part.id] ?? 0;
  const appear = Math.min(1, t / 0.6);
  const size = text.length > 5 ? 8 : 11;
  // Os nomes ficam do lado de fora, deixando o núcleo (fase 3) à vista.
  const x = Math.sign(part.ox) * (24 + text.length * size * 0.5 + 6);
  const y = part.oy - 6 + Math.sin(boss.time * 2 + part.ox) * 2;
  ctx.save();
  ctx.globalAlpha *= appear;
  ctx.fillStyle = 'rgba(228, 59, 140, 0.25)';
  ctx.fillRect(x - text.length * size * 0.5 - 6, y - 6, text.length * size + 12, size + 12);
  drawText(ctx, text, x, y, { size, align: 'center', color: '#ffffff', shadow: '#b13e53' });
  drawPixelHeart(ctx, x - 5, y + size + 10, 10, '#e43b8c');
  ctx.restore();
}

// ------------------------------------------------------------ tela final
const TYPE_SPEED = 30; // letras por segundo

/** Quebra o texto em linhas que cabem em `maxWidth` (o coração conta como uma letra). */
function wrap(ctx, text, size, maxWidth) {
  ctx.save();
  ctx.font = `${size}px "Press Start 2P", "Courier New", monospace`;
  const width = (s) => ctx.measureText(s.replaceAll(HEART, 'M')).width;
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && width(next) > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  ctx.restore();
  return lines;
}

/** Desenha uma linha centralizada trocando ❤ por corações de pixels. */
function drawLine(ctx, line, y, size, color) {
  ctx.save();
  ctx.font = `${size}px "Press Start 2P", "Courier New", monospace`;
  const parts = line.split(HEART);
  const hearts = parts.length - 1;
  const total = parts.reduce((s, p) => s + ctx.measureText(p).width, 0) + hearts * (size + 3);
  ctx.restore();
  let x = W / 2 - total / 2;
  parts.forEach((part, i) => {
    if (part) {
      drawText(ctx, part, x, y, { size, color });
      ctx.save();
      ctx.font = `${size}px "Press Start 2P", "Courier New", monospace`;
      x += ctx.measureText(part).width;
      ctx.restore();
    }
    if (i < hearts) {
      drawPixelHeart(ctx, x + 2, y, size, '#e43b8c');
      x += size + 3;
    }
  });
}

function drawVictory(ctx, scene) {
  const t = scene.stateTime;
  const v = (scene.loveScreen ??= {
    lines: wrap(ctx, decode(TEXT.message), 10, W - 56),
    love: decode(TEXT.love),
    shown: 0,
  });
  const totalChars = v.lines.reduce((s, l) => s + l.length, 0);
  v.shown = Math.max(v.shown, Math.min(totalChars, Math.max(0, t - 1) * TYPE_SPEED));

  scene.drawOverlay(ctx, Math.min(0.85, t));

  // Corações subindo ao fundo.
  for (let i = 0; i < 18; i++) {
    const speed = 30 + (i * 17) % 40;
    const x = (i * 97 + Math.sin(t + i) * 16) % W;
    const y = H - ((t * speed + i * 83) % (H + 40));
    ctx.save();
    ctx.globalAlpha = 0.18 + (i % 3) * 0.08;
    drawPixelHeart(ctx, x, y, 8 + (i % 4) * 4, i % 2 ? '#e43b8c' : '#b13e53');
    ctx.restore();
  }

  // Coração grande pulsando.
  const beat = 1 + Math.max(0, Math.sin(t * 6)) * 0.12;
  scene.sprites.draw(ctx, 'heartCore', W / 2, 92, { scale: 2.2 * beat });

  // Mensagem digitada letra a letra.
  let left = Math.floor(v.shown);
  const y0 = 160;
  const gap = 21;
  v.lines.forEach((line, i) => {
    if (left <= 0) return;
    const visible = [...line].slice(0, left).join('');
    left -= line.length;
    drawLine(ctx, visible, y0 + i * gap, 10, '#f4f4f4');
  });

  const done = v.shown >= totalChars;
  if (done) {
    v.doneAt ??= Math.min(t, 1 + totalChars / TYPE_SPEED);
    const a = Math.min(1, (t - v.doneAt) / 0.8);
    const sepY = y0 + v.lines.length * gap + 18;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.fillStyle = '#566c86';
    for (let x = 60; x < W - 60; x += 12) ctx.fillRect(x, sepY, 8, 2);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha *= Math.min(1, Math.max(0, (t - v.doneAt - 0.6) / 0.8));
    drawLine(ctx, v.love, sepY + 26, 12, '#e43b8c');
    ctx.restore();
    if (t - v.doneAt > 2 && Math.floor(t * 2) % 2 === 0) {
      const prompt = scene.input.touchMode ? 'Toque para voltar ao menu' : 'ENTER  voltar ao menu';
      drawText(ctx, prompt, W / 2, H - 50, { size: 7, align: 'center', color: UI_COLORS.muted });
    }
  }
}

export const HEART_BOSS = Object.freeze({
  id: 'heart',
  name: 'CORAÇÃO ETERNO',
  intro: { title: 'FASE SECRETA', subtitle: 'CORAÇÃO ETERNO' },
  description: 'Uma nave em forma de coração.',
  icon: { sprite: 'heartCore', scale: 1.2 },
  parTime: 150,
  music: 'title',
  theme: { bg: '#0d0510', stars: ['#f4f4f4', '#e43b8c', '#ffcd75', '#b13e53'], accent: '#e43b8c' },
  playerBuffs: ['dash', 'bomb'],
  phaseClearText: 'O CORAÇÃO RESISTE...',
  size: { w: 280, h: 120 },
  timing: { entry: 3, transition: 2, death: 3.6, homeY: 170 },
  debrisColors: PINK,
  parts: PARTS,
  phases: PHASES,

  update(boss, dt) {
    for (const id of Object.keys(boss.vars.reveal ?? {})) boss.vars.reveal[id] += dt;
  },

  onPartDestroyed(boss, part) {
    if (part.id !== 'heartL' && part.id !== 'heartR') return;
    (boss.vars.reveal ??= {})[part.id] = 0;
    const r = boss.partRect(part);
    const w = boss.world;
    w.particles.ring(r.cx, r.cy, '#e43b8c', 90, 0.6);
    w.particles.ring(r.cx, r.cy, '#f4f4f4', 140, 0.8);
    w.audio.play('buff');
  },

  drawFront(ctx, boss) {
    drawName(ctx, boss, boss.parts.heartR, decode(TEXT.right));
    drawName(ctx, boss, boss.parts.heartL, decode(TEXT.left));
  },

  drawVictory,

  /** ENTER/toque durante a digitação mostra o texto inteiro; depois, volta ao menu. */
  onConfirmEnd(scene) {
    const v = scene.loveScreen;
    if (scene.state !== 'victory' || !v) return false;
    const total = v.lines.reduce((s, l) => s + l.length, 0);
    if (v.shown < total) {
      v.shown = total;
      v.doneAt = scene.stateTime;
      return true;
    }
    return scene.stateTime - (v.doneAt ?? scene.stateTime) < 2;
  },
});
