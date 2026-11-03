/**
 * SpriteBank — gera, carrega e guarda em cache todas as imagens do jogo.
 *
 * Pipeline:
 *  1. "Rasteriza" cada sprite de texto (spriteData.js) em um <canvas> 1:1.
 *  2. Lê assets/sprites/manifest.json; para cada nome listado, carrega o PNG
 *     desenhado à mão e substitui o sprite gerado (modo "misto").
 *  3. Gera variações automaticamente, a partir do sprite final:
 *     - flash : silhueta branca (feedback de dano)
 *     - dmg1  : rachaduras leves
 *     - dmg2  : rachaduras pesadas + brasas
 *     - husk  : carcaça destruída (escurecida)
 *     - rage  : tom avermelhado (chefe enfurecido)
 *
 * O tamanho na tela é sempre definido pelo sprite de texto (largura x altura
 * × PIXEL_SIZE). Assim, trocar a arte nunca altera hitboxes nem jogabilidade.
 */
import { SPRITES } from './spriteData.js';
import { PALETTE, TRANSPARENT } from './palette.js';
import { PIXEL_SIZE } from '../config.js';
import { mulberry32, hashString } from '../utils/math.js';

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function copyCanvas(source) {
  const canvas = createCanvas(source.width, source.height);
  canvas.getContext('2d').drawImage(source, 0, 0);
  return canvas;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Converte linhas de texto em um canvas (1 caractere = 1 pixel). */
function rasterize(rows) {
  const canvas = createCanvas(rows[0].length, rows.length);
  const ctx = canvas.getContext('2d');
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === TRANSPARENT) return;
      ctx.fillStyle = PALETTE[char] ?? '#ff00ff';
      ctx.fillRect(x, y, 1, 1);
    });
  });
  return canvas;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    img.src = src;
  });
}

/** Silhueta de uma única cor, preservando a transparência. */
function silhouette(source, color) {
  const canvas = copyCanvas(source);
  const ctx = canvas.getContext('2d');
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Aplica uma camada de cor por cima dos pixels opacos. */
function tint(source, color, alpha) {
  const canvas = copyCanvas(source);
  const ctx = canvas.getContext('2d');
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Desenha rachaduras procedurais (caminhadas aleatórias determinísticas)
 * apenas sobre pixels opacos.
 */
function cracked(source, seed, level) {
  const canvas = copyCanvas(source);
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const random = mulberry32(seed + level * 977);
  const dark = hexToRgb(PALETTE.K);
  const ember = hexToRgb(PALETTE.r);

  const opaque = [];
  for (let i = 0; i < width * height; i++) if (data[i * 4 + 3] > 0) opaque.push(i);
  if (opaque.length === 0) return canvas;

  const crackCount = Math.max(1, Math.round((opaque.length / 120) * level));
  const crackLength = Math.max(3, Math.round((width + height) / 5));

  for (let c = 0; c < crackCount; c++) {
    const start = opaque[Math.floor(random() * opaque.length)];
    let x = start % width;
    let y = Math.floor(start / width);
    let dirX = random() < 0.5 ? -1 : 1;
    let dirY = random() < 0.5 ? -1 : 1;
    for (let step = 0; step < crackLength; step++) {
      if (x < 0 || y < 0 || x >= width || y >= height) break;
      const idx = (y * width + x) * 4;
      if (data[idx + 3] > 0) {
        const color = level >= 2 && random() < 0.18 ? ember : dark;
        data[idx] = color[0];
        data[idx + 1] = color[1];
        data[idx + 2] = color[2];
      }
      // Rachaduras "zigue-zague": muda de direção ocasionalmente.
      if (random() < 0.35) dirX = random() < 0.5 ? -1 : 1;
      if (random() < 0.25) dirY = random() < 0.5 ? -1 : 1;
      if (random() < 0.5) x += dirX;
      else y += dirY;
    }
  }

  if (level >= 2) {
    // Escurece levemente tudo (aparência de desgaste).
    for (let i = 0; i < data.length; i += 4) {
      data[i] *= 0.82;
      data[i + 1] *= 0.82;
      data[i + 2] *= 0.82;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export class SpriteBank {
  constructor(basePath = 'assets/sprites/') {
    this.basePath = basePath;
    this.images = new Map();
    this.overridden = new Set();
  }

  async build() {
    for (const [name, def] of Object.entries(SPRITES)) {
      this.images.set(name, rasterize(def.rows));
    }
    await this.loadOverrides();
    for (const name of Object.keys(SPRITES)) this.buildVariants(name);
  }

  /** Carrega PNGs desenhados à mão listados em manifest.json. */
  async loadOverrides() {
    let names = [];
    try {
      const response = await fetch(`${this.basePath}manifest.json`, { cache: 'no-cache' });
      if (response.ok) {
        const manifest = await response.json();
        names = Array.isArray(manifest.overrides) ? manifest.overrides : [];
      }
    } catch {
      // Sem manifest (ou abrindo via file://): usa só a arte gerada por código.
    }

    await Promise.all(
      names
        .filter((name) => {
          if (!SPRITES[name]) console.warn(`[SpriteBank] Sprite desconhecido no manifest: "${name}"`);
          return Boolean(SPRITES[name]);
        })
        .map(async (name) => {
          try {
            const img = await loadImage(`${this.basePath}${name}.png`);
            const canvas = createCanvas(img.width, img.height);
            canvas.getContext('2d').drawImage(img, 0, 0);
            this.images.set(name, canvas);
            this.overridden.add(name);
          } catch (err) {
            console.warn(`[SpriteBank] ${err.message}. Usando a arte gerada por código.`);
          }
        }),
    );
  }

  buildVariants(name) {
    const base = this.images.get(name);
    const seed = hashString(name);
    this.images.set(`${name}:flash`, silhouette(base, '#ffffff'));
    this.images.set(`${name}:dmg1`, cracked(base, seed, 1));
    this.images.set(`${name}:dmg2`, cracked(base, seed, 2));
    this.images.set(`${name}:husk`, tint(cracked(base, seed, 3), PALETTE.K, 0.55));
    this.images.set(`${name}:rage`, tint(base, '#ff2848', 0.3));
  }

  get(name, variant) {
    return (variant && this.images.get(`${name}:${variant}`)) || this.images.get(name);
  }

  /** Tamanho do sprite na tela (em pixels lógicos do jogo). */
  size(name) {
    const rows = SPRITES[name].rows;
    return { w: rows[0].length * PIXEL_SIZE, h: rows.length * PIXEL_SIZE };
  }

  /** Desenha o sprite centralizado em (x, y). */
  draw(ctx, name, x, y, { variant = null, scale = 1, alpha = 1 } = {}) {
    const image = this.get(name, variant);
    if (!image) return;
    const { w, h } = this.size(name);
    const dw = w * scale;
    const dh = h * scale;
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = prevAlpha * alpha;
    ctx.drawImage(image, Math.round(x - dw / 2), Math.round(y - dh / 2), Math.round(dw), Math.round(dh));
    ctx.globalAlpha = prevAlpha;
  }
}
