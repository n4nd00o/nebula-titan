/**
 * Funções de detecção de colisão (geometria 2D).
 *
 * O jogo usa formas simples por desempenho e previsibilidade:
 *  - círculos para projéteis e para a "hitbox" do jogador;
 *  - retângulos alinhados aos eixos (AABB) para as partes do chefe;
 *  - distância ponto-segmento para o laser.
 */
import { clamp } from '../utils/math.js';

/** Sobreposição entre dois retângulos {x, y, w, h}. */
export function aabbOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Sobreposição entre dois círculos. */
export function circleOverlap(ax, ay, ar, bx, by, br) {
  const dx = ax - bx;
  const dy = ay - by;
  const r = ar + br;
  return dx * dx + dy * dy < r * r;
}

/** Sobreposição entre círculo e retângulo (ponto mais próximo do retângulo). */
export function circleRectOverlap(cx, cy, radius, rect) {
  const nearestX = clamp(cx, rect.x, rect.x + rect.w);
  const nearestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

/** Menor distância entre o ponto (px, py) e o segmento (x1, y1)-(x2, y2). */
export function pointSegmentDistance(px, py, x1, y1, x2, y2) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const lengthSq = vx * vx + vy * vy;
  let t = lengthSq === 0 ? 0 : ((px - x1) * vx + (py - y1) * vy) / lengthSq;
  t = clamp(t, 0, 1);
  const cx = x1 + vx * t;
  const cy = y1 + vy * t;
  return Math.hypot(px - cx, py - cy);
}
