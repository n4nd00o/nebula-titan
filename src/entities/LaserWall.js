/**
 * Parede de laser horizontal (Leviatã) — atravessa a tela de cima para baixo.
 *
 * Tem uma BRECHA por onde dá para passar (mantém a fase justa sem buffs),
 * mas o DASH, com sua invencibilidade, atravessa a parede em qualquer ponto.
 * Antes de descer, pisca no topo por 0,7 s (aviso).
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H } from '../config.js';

const START_Y = 72;
const WARN_TIME = 0.7;
const THICKNESS = 8;

export class LaserWall {
  constructor({ gapX, gap = 84, speed = 170 }) {
    this.gapX = gapX;
    this.gap = gap;
    this.speed = speed;
    this.y = START_Y;
    this.state = 'warn';
    this.timer = WARN_TIME;
    this.time = 0;
    this.dead = false;
  }

  update(dt) {
    this.time += dt;
    if (this.state === 'warn') {
      this.timer -= dt;
      if (this.timer <= 0) this.state = 'move';
      return;
    }
    this.y += this.speed * dt;
    if (this.y > H + 10) this.dead = true;
  }

  /** O círculo (jogador) está na faixa do laser e fora da brecha? */
  hits(x, y, radius) {
    if (this.state !== 'move') return false;
    if (Math.abs(y - this.y) > THICKNESS / 2 + radius) return false;
    return Math.abs(x - this.gapX) > this.gap / 2 - radius;
  }

  draw(ctx) {
    const left = this.gapX - this.gap / 2;
    const right = this.gapX + this.gap / 2;
    if (this.state === 'warn') {
      if (Math.floor(this.time * 14) % 2 === 0) {
        ctx.fillStyle = 'rgba(228, 59, 140, 0.8)';
        ctx.fillRect(0, this.y - 1, left, 2);
        ctx.fillRect(right, this.y - 1, W - right, 2);
      }
      // Marcadores da brecha
      ctx.fillStyle = '#a7f070';
      ctx.fillRect(left - 2, this.y - 6, 2, 12);
      ctx.fillRect(right, this.y - 6, 2, 12);
      return;
    }
    const flicker = 0.85 + Math.random() * 0.15;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const [x0, x1] of [[0, left], [right, W]]) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#e43b8c';
      ctx.fillRect(x0, this.y - THICKNESS * flicker, x1 - x0, THICKNESS * 2 * flicker);
      ctx.globalAlpha = 1;
      ctx.fillRect(x0, this.y - THICKNESS / 2, x1 - x0, THICKNESS);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x0, this.y - 1, x1 - x0, 2);
    }
    ctx.restore();
    // Emissores nas pontas da brecha
    ctx.fillStyle = '#a7f070';
    ctx.fillRect(left - 3, this.y - 5, 3, 10);
    ctx.fillRect(right, this.y - 5, 3, 10);
  }
}
