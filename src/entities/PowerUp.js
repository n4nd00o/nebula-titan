/**
 * Power-ups: soltos quando o jogador destrói partes do chefe.
 * Recompensam a destruição de cada ponto fraco com uma vantagem diferente.
 */
import { GAME_HEIGHT } from '../config.js';
import { drawText } from '../graphics/text.js';

export const POWERUP_TYPES = Object.freeze({
  double: { label: '2X', color: '#41a6f6', name: 'TIRO DUPLO' },
  rapid: { label: 'R', color: '#ef7d57', name: 'TIRO RÁPIDO' },
  shield: { label: 'S', color: '#38b764', name: 'ESCUDO' },
  life: { label: '1UP', color: '#e43b8c', name: 'VIDA EXTRA' },
});

export class PowerUp {
  constructor(type, x, y) {
    this.type = type;
    this.info = POWERUP_TYPES[type];
    this.x = x;
    this.y = y;
    this.vy = -90; // "salta" para cima ao surgir
    this.t = 0;
    this.life = 12;
    this.dead = false;
  }

  update(dt) {
    this.t += dt;
    this.vy = Math.min(this.vy + 140 * dt, 65);
    this.y += this.vy * dt;
    this.x += Math.sin(this.t * 2.5) * 25 * dt;
    if (this.y > GAME_HEIGHT + 20 || this.t > this.life) this.dead = true;
  }

  draw(ctx) {
    // Pisca nos últimos 2 segundos antes de sumir.
    if (this.life - this.t < 2 && Math.floor(this.t * 10) % 2 === 0) return;
    const w = 26;
    const h = 16;
    const x = Math.round(this.x - w / 2);
    const y = Math.round(this.y - h / 2);
    ctx.fillStyle = '#1a1c2c';
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = this.info.color;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x, y, w, 4);
    drawText(ctx, this.info.label, this.x, this.y + 1, { size: 6, align: 'center', baseline: 'middle' });
  }
}
