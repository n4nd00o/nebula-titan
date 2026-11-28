/**
 * Teclado desenhado (v1.8): mostra as teclas em vez de só escrever o nome.
 *
 * - keyboardLayout(): posição de cada tecla de um teclado simplificado
 *   (lógica pura, testada em tests/onboarding.test.js).
 * - drawKeyboard(): desenha o teclado e pinta as teclas usadas por cada ação.
 * - drawKeyCap(): uma tecla sozinha (tutorial e dicas de habilidade).
 */
import { drawText } from './text.js';
import { keyLabel } from '../core/KeyBindings.js';

const U = 24; // largura de uma tecla comum
const GAP = 2;
const KEY_H = 22;
const ROW_STEP = KEY_H + GAP + 2;

// Cada linha: [código, largura em teclas]
const ROWS = [
  [['Escape', 1], ...'1234567890'.split('').map((d) => [`Digit${d}`, 1])],
  [['Tab', 1.5], ...'QWERTYUIOP'.split('').map((k) => [`Key${k}`, 1])],
  [['CapsLock', 1.75], ...'ASDFGHJKL'.split('').map((k) => [`Key${k}`, 1]), ['Enter', 1.75]],
  [['ShiftLeft', 2.25], ...'ZXCVBNM'.split('').map((k) => [`Key${k}`, 1]), ['Comma', 1], ['Period', 1], ['ShiftRight', 2.25]],
  [['ControlLeft', 1.5], ['AltLeft', 1.25], ['Space', 6], ['AltRight', 1.25], ['ControlRight', 1.5]],
];
const widthOf = (units) => units * U + (units - 1) * GAP;
const MAIN_W = Math.max(...ROWS.map((row) => row.reduce((w, [, u]) => w + widthOf(u) + GAP, -GAP)));
const ARROWS_W = 3 * U + 2 * GAP;
export const KEYBOARD_SIZE = Object.freeze({ w: MAIN_W + 10 + ARROWS_W, h: ROWS.length * ROW_STEP - 2 });

/** Retângulos de todas as teclas, a partir do canto (x0, y0). */
export function keyboardLayout(x0, y0) {
  const keys = [];
  ROWS.forEach((row, r) => {
    let x = x0;
    for (const [code, units] of row) {
      keys.push({ code, x, y: y0 + r * ROW_STEP, w: widthOf(units), h: KEY_H });
      x += widthOf(units) + GAP;
    }
  });
  // Setas, à direita do bloco principal (cima na 4ª linha, as outras três na 5ª).
  const ax = x0 + MAIN_W + 10;
  keys.push({ code: 'ArrowUp', x: ax + U + GAP, y: y0 + 3 * ROW_STEP, w: U, h: KEY_H });
  ['ArrowLeft', 'ArrowDown', 'ArrowRight'].forEach((code, i) => {
    keys.push({ code, x: ax + i * (U + GAP), y: y0 + 4 * ROW_STEP, w: U, h: KEY_H });
  });
  return keys;
}

const ARROW_ANGLE = { ArrowUp: -Math.PI / 2, ArrowDown: Math.PI / 2, ArrowLeft: Math.PI, ArrowRight: 0 };

/** Desenha o rótulo de uma tecla (setas viram triângulos). */
function drawLabel(ctx, code, cx, cy, color, size) {
  if (code in ARROW_ANGLE) {
    const s = size * 0.7;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ARROW_ANGLE[code]);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(-s * 0.6, -s * 0.8);
    ctx.lineTo(-s * 0.6, s * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return;
  }
  drawText(ctx, keyLabel(code), cx, cy, { size, align: 'center', baseline: 'middle', color, shadow: null });
}

/**
 * Teclado inteiro. `colorOf(code)` devolve a cor da ação daquela tecla, ou
 * null para tecla sem uso (fica apagada e sem rótulo, para não poluir).
 */
export function drawKeyboard(ctx, x0, y0, colorOf) {
  for (const key of keyboardLayout(x0, y0)) {
    const color = colorOf(key.code);
    ctx.fillStyle = color ?? '#262b44';
    ctx.fillRect(key.x, key.y, key.w, key.h);
    ctx.strokeStyle = color ? '#f4f4f4' : '#333c57';
    ctx.lineWidth = 1;
    ctx.strokeRect(key.x + 0.5, key.y + 0.5, key.w - 1, key.h - 1);
    if (color) drawLabel(ctx, key.code, key.x + key.w / 2, key.y + key.h / 2 + 1, '#1a1c2c', key.w > U * 1.5 ? 7 : 8);
  }
}

/** Uma tecla grande sozinha, centralizada em (cx, cy). Devolve a largura usada. */
export function drawKeyCap(ctx, code, cx, cy, { color = '#ffcd75', size = 12, pressed = false } = {}) {
  const label = code in ARROW_ANGLE ? '' : keyLabel(code);
  const w = Math.max(size * 3, label.length * size + size * 1.6);
  const h = size * 3;
  const y = cy - h / 2 + (pressed ? 3 : 0);
  ctx.fillStyle = '#1a1c2c';
  ctx.fillRect(cx - w / 2, cy - h / 2 + 4, w, h); // "sombra" da tecla
  ctx.fillStyle = color;
  ctx.fillRect(cx - w / 2, y, w, h);
  ctx.strokeStyle = '#f4f4f4';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - w / 2 + 1, y + 1, w - 2, h - 2);
  drawLabel(ctx, code, cx, y + h / 2 + 1, '#1a1c2c', size);
  return w;
}
