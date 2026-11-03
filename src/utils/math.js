/**
 * Funções matemáticas utilitárias, puras e sem dependências.
 * Por serem puras, são fáceis de testar (ver tests/math.test.js).
 */

export const TAU = Math.PI * 2;

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const lerp = (a, b, t) => a + (b - a) * t;

export const rand = (min, max) => min + Math.random() * (max - min);

export const randInt = (min, max) => Math.floor(rand(min, max + 1));

export const pick = (list) => list[Math.floor(Math.random() * list.length)];

/** Move `value` em direção a `target` no máximo `delta` unidades. */
export const approach = (value, target, delta) =>
  value < target ? Math.min(value + delta, target) : Math.max(value - delta, target);

export const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

export const angleTo = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);

/** Curva de suavização (ease-out cúbica). */
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/** Rotaciona o ponto (x, y) em torno da origem. */
export function rotatePoint(x, y, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: x * c - y * s, y: x * s + y * c };
}

/** Diferença angular normalizada no intervalo [-PI, PI]. */
export function angleDiff(from, to) {
  let d = (to - from) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

/**
 * Gerador pseudoaleatório determinístico (Mulberry32).
 * Usado para gerar as rachaduras dos sprites sempre iguais.
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash simples de string -> inteiro (para semear o gerador acima). */
export function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Remove, sem criar um novo array, os itens marcados com `dead = true`. */
export function removeDead(list) {
  let write = 0;
  for (let read = 0; read < list.length; read++) {
    const item = list[read];
    if (!item.dead) list[write++] = item;
  }
  list.length = write;
  return list;
}
