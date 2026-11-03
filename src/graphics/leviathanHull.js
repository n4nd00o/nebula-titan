/**
 * Casco do LEVIATÃ — gerado proceduralmente (uma vez) em um canvas.
 *
 * A nave tem 8 seções empilhadas (popa embaixo, proa em cima), cada uma
 * com elementos visuais próprios (motores, hangares, plataformas, trincheira,
 * poços de reator, convés da tempestade, base da ponte e poço do núcleo).
 *
 * A arte é desenhada em "pixels de arte" (156 x 664) e escalada 3x na tela
 * (468 x 1992 px), maior que a própria tela: por isso o jogador "voa sobre"
 * o casco enquanto a câmera avança seção por seção.
 *
 * Só roda no navegador (usa canvas); a lógica do chefe não depende disto.
 */
import { PALETTE } from './palette.js';
import { PIXEL_SIZE } from '../config.js';
import { mulberry32 } from '../utils/math.js';

export const HULL_ART_W = 156;
export const SECTION_ART_H = 80;
export const SECTION_COUNT = 8;
export const BOW_ART_H = 24;
export const HULL_ART_H = BOW_ART_H + SECTION_ART_H * SECTION_COUNT; // 664

/** Posição local (px) do canto superior esquerdo do casco em relação ao centro do chefe. */
export const HULL_LEFT = -(HULL_ART_W * PIXEL_SIZE) / 2; // -234
export const HULL_TOP = -HULL_ART_H * PIXEL_SIZE; // -1992 (a popa fica em y = 0)

const CX = HULL_ART_W / 2;

/** Converte posição local (px) do chefe para coordenadas de arte do casco. */
export const toArt = (x, y) => ({ c: (x - HULL_LEFT) / PIXEL_SIZE, r: (y - HULL_TOP) / PIXEL_SIZE });

/** Linha de arte onde começa a seção i (0 = popa). */
const sectionTop = (i) => BOW_ART_H + (SECTION_COUNT - 1 - i) * SECTION_ART_H;

/** Meia-largura do casco em cada linha (proa afunilada + recortes estruturais). */
function halfWidth(r) {
  const taperEnd = BOW_ART_H + 60;
  if (r < taperEnd) return 12 + (CX - 12) * (r / taperEnd);
  return Math.floor(r / 16) % 3 === 0 ? CX - 4 : CX;
}

let cache = null;

/** Retorna { hull, rage, lights } (gerados na primeira chamada). */
export function getLeviathanHull() {
  if (cache) return cache;
  const hull = buildHull();
  const rage = document.createElement('canvas');
  rage.width = hull.width;
  rage.height = hull.height;
  const rctx = rage.getContext('2d');
  rctx.drawImage(hull, 0, 0);
  rctx.globalCompositeOperation = 'source-atop';
  rctx.fillStyle = 'rgba(255, 40, 72, 0.28)';
  rctx.fillRect(0, 0, rage.width, rage.height);
  cache = { hull, rage, lights: buildLights() };
  return cache;
}

function buildHull() {
  const canvas = document.createElement('canvas');
  canvas.width = HULL_ART_W;
  canvas.height = HULL_ART_H;
  const g = canvas.getContext('2d');
  const rnd = mulberry32(1337);
  const rect = (x, y, w, h, color) => {
    g.fillStyle = PALETTE[color] ?? color;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const circle = (x, y, radius, color) => {
    g.fillStyle = PALETTE[color];
    g.beginPath();
    g.arc(x, y, radius, 0, Math.PI * 2);
    g.fill();
  };

  // 1) Chapas metálicas em grade (cores levemente aleatórias)
  rect(0, 0, HULL_ART_W, HULL_ART_H, 'K');
  for (let py = 0; py < HULL_ART_H; py += 10) {
    for (let px = (py / 10) % 2 ? 0 : 6; px < HULL_ART_W; px += 13) {
      const v = rnd();
      rect(px + 1, py + 1, 11, 8, v < 0.18 ? 's' : v < 0.22 ? 'N' : 'k');
      if (rnd() < 0.3) rect(px + 2, py + 2, 1, 1, 'w'); // rebite
    }
  }
  // Espinha central roxa (identidade visual do inimigo)
  rect(CX - 4, 0, 8, HULL_ART_H, 'P');
  rect(CX - 1, 0, 2, HULL_ART_H, 'p');

  // 2) Elementos de cada seção
  // S0 Motores
  let T = sectionTop(0);
  for (const x of [22, 52, 90, 120]) {
    rect(x, T + 56, 14, 24, 'K');
    rect(x + 2, T + 58, 10, 20, 'R');
    rect(x + 4, T + 60, 6, 18, 'r');
    rect(x + 6, T + 62, 2, 16, 'Y');
  }
  // S1 Hangares
  T = sectionTop(1);
  for (const c of [toArt(-110, 0).c, toArt(110, 0).c]) {
    const r = toArt(0, -360).r;
    rect(c - 13, r - 10, 26, 20, 'K');
    for (let i = 0; i < 26; i += 4) {
      rect(c - 13 + i, r - 12, 2, 2, 'Y');
      rect(c - 13 + i, r + 10, 2, 2, 'Y');
    }
  }
  // S2 Plataformas das baterias
  for (const [x, y] of [[-140, -610], [0, -580], [140, -610]]) {
    const a = toArt(x, y);
    rect(a.c - 10, a.r - 10, 20, 20, 'K');
    rect(a.c - 9, a.r - 9, 18, 18, 's');
    rect(a.c - 9, a.r - 9, 18, 2, 'w');
  }
  // S3 Trincheira dos lasers
  T = sectionTop(3);
  rect(CX - 20, T, 40, SECTION_ART_H, 'K');
  for (let r = T + 2; r < T + SECTION_ART_H; r += 6) {
    rect(CX - 20, r, 2, 2, 'R');
    rect(CX + 18, r, 2, 2, 'R');
  }
  for (const x of [-170, 170]) {
    const a = toArt(x, -860);
    rect(a.c - 8, a.r - 8, 16, 16, 'T');
  }
  // S4 Poços dos reatores
  for (const x of [-90, 90]) {
    const a = toArt(x, -1080);
    circle(a.c, a.r, 12, 'T');
    circle(a.c, a.r, 10, 'K');
  }
  // S5 Convés da tempestade (faixas de alerta)
  T = sectionTop(5);
  for (let x = 0; x < HULL_ART_W; x += 6) {
    rect(x, T + 64, 3, 4, 'Y');
    rect(x, T + 12, 3, 4, 'Y');
  }
  // S6 Base da ponte de comando
  {
    const a = toArt(0, -1575);
    rect(a.c - 26, a.r - 14, 52, 30, 'P');
    rect(a.c - 24, a.r - 12, 48, 26, 'p');
    for (const x of [-160, 160]) {
      const t = toArt(x, -1545);
      rect(t.c - 8, t.r - 8, 16, 16, 's');
    }
  }
  // S7 Poço do núcleo
  {
    const a = toArt(0, -1800);
    circle(a.c, a.r, 15, 'M');
    circle(a.c, a.r, 12, 'P');
  }

  // 3) Recorte no formato do casco (proa afunilada, laterais estruturais).
  // IMPORTANTE: com 'destination-in', CADA operação de desenho apaga tudo o que
  // fica fora dela. Por isso a silhueta inteira é montada em um único caminho
  // e preenchida de uma vez só; preencher linha a linha apagaria o casco todo.
  g.globalCompositeOperation = 'destination-in';
  g.fillStyle = '#000';
  g.beginPath();
  for (let r = 0; r < HULL_ART_H; r++) {
    const half = halfWidth(r);
    g.rect(Math.round(CX - half), r, Math.round(half * 2), 1);
  }
  g.fill();
  g.globalCompositeOperation = 'source-over';

  // 4) Contorno e trilhos laterais
  for (let r = 0; r < HULL_ART_H; r++) {
    const half = Math.round(halfWidth(r));
    rect(CX - half, r, 1, 1, 'K');
    rect(CX + half - 1, r, 1, 1, 'K');
    rect(CX - half + 1, r, 2, 1, 's');
    rect(CX + half - 3, r, 2, 1, 's');
  }
  return canvas;
}

/** Luzes que piscam ao longo das laterais (posições locais em px). */
function buildLights() {
  const rnd = mulberry32(99);
  const lights = [];
  for (let r = BOW_ART_H + 64; r < HULL_ART_H; r += 12) {
    const half = halfWidth(r);
    for (const side of [-1, 1]) {
      lights.push({
        x: (side * (half - 6)) * PIXEL_SIZE,
        y: HULL_TOP + r * PIXEL_SIZE,
        color: rnd() < 0.7 ? PALETTE.C : PALETTE.M,
        phase: rnd() * Math.PI * 2,
      });
    }
  }
  return lights;
}

/** Desenha o casco, as luzes e o fogo dos motores (no espaço local do chefe). */
export function drawLeviathanHull(ctx, boss) {
  const { hull, rage, lights } = getLeviathanHull();
  ctx.drawImage(boss.enraged ? rage : hull, HULL_LEFT, HULL_TOP, HULL_ART_W * PIXEL_SIZE, HULL_ART_H * PIXEL_SIZE);

  // Luzes (só as que estão na tela)
  for (const l of lights) {
    const screenY = boss.y + l.y;
    if (screenY < -10 || screenY > 660) continue;
    const on = Math.sin(boss.time * 3 + l.phase) > 0.2;
    if (!on) continue;
    ctx.fillStyle = l.color;
    ctx.fillRect(l.x - 2, l.y - 2, 4, 4);
  }

  // Fogo dos motores, abaixo da popa (y = 0)
  if (boss.y < 700) {
    for (const col of [29, 59, 97, 127]) {
      const x = HULL_LEFT + col * PIXEL_SIZE;
      const len = 24 + Math.random() * 22;
      ctx.fillStyle = '#ef7d57';
      ctx.fillRect(x - 12, 0, 24, len);
      ctx.fillStyle = '#ffcd75';
      ctx.fillRect(x - 7, 0, 14, len * 0.7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 3, 0, 6, len * 0.4);
    }
  }
}
