/**
 * Projéteis do jogador e dos inimigos.
 *
 * Linguagem visual: tiros do jogador são AMARELOS e finos; tiros inimigos
 * são REDONDOS/BRILHANTES em tons de rosa/laranja com núcleo branco.
 * A distinção de cor e forma ajuda o jogador a ler a tela rapidamente.
 */
import { GAME_WIDTH, GAME_HEIGHT, PLAYER } from '../config.js';
import { angleDiff, TAU } from '../utils/math.js';

const MARGIN = 40;

const isOutside = (x, y) => x < -MARGIN || x > GAME_WIDTH + MARGIN || y < -MARGIN || y > GAME_HEIGHT + MARGIN;

export class PlayerBullet {
  /**
   * @param {{piercing?: boolean}} options tiro perfurante: +50% de dano e atravessa drones
   */
  constructor(x, y, { piercing = false } = {}) {
    this.x = x;
    this.y = y;
    this.prevY = y; // posição no quadro anterior (para colisão contínua)
    this.vy = -PLAYER.bulletSpeed;
    this.radius = 3;
    this.piercing = piercing;
    this.damage = piercing ? PLAYER.piercingDamage : PLAYER.bulletDamage;
    this.hitMinions = piercing ? new Set() : null; // drones já atravessados
    this.dead = false;
  }

  update(dt) {
    this.prevY = this.y;
    this.y += this.vy * dt;
    if (this.y < -20) this.dead = true;
  }

  draw(ctx) {
    if (this.piercing) {
      ctx.fillStyle = '#73eff7';
      ctx.fillRect(Math.round(this.x - 2.5), Math.round(this.y - 9), 5, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(this.x - 1), Math.round(this.y - 8), 2, 12);
      return;
    }
    ctx.fillStyle = '#ffcd75';
    ctx.fillRect(Math.round(this.x - 1.5), Math.round(this.y - 7), 3, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(this.x - 0.5), Math.round(this.y - 6), 1, 8);
  }
}

/**
 * Tipos (kind):
 *  - orb:    bola simples
 *  - needle: projétil alongado e rápido (orientado pela velocidade)
 *  - mine:   mina teleguiada (homing) com espinhos
 */
export class EnemyBullet {
  constructor({ x, y, vx = 0, vy = 0, kind = 'orb', color = '#e43b8c', radius = 4, homing = 0, turnRate = 0, speed = null, life = 9 }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.kind = kind;
    this.color = color;
    this.radius = radius;
    this.homing = homing;
    this.turnRate = turnRate;
    this.speed = speed ?? Math.hypot(vx, vy);
    this.life = life;
    this.time = 0;
    this.dead = false;
  }

  update(dt, scene) {
    this.time += dt;
    this.life -= dt;
    if (this.homing > 0 && scene.player.alive) {
      // Gira gradualmente o vetor velocidade em direção ao jogador.
      this.homing -= dt;
      const current = Math.atan2(this.vy, this.vx);
      const desired = Math.atan2(scene.player.y - this.y, scene.player.x - this.x);
      const diff = angleDiff(current, desired);
      const turn = Math.max(-this.turnRate * dt, Math.min(this.turnRate * dt, diff));
      const angle = current + turn;
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.life <= 0 || isOutside(this.x, this.y)) this.dead = true;
  }

  draw(ctx) {
    const { x, y, radius: r } = this;
    switch (this.kind) {
      case 'needle': {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.atan2(this.vy, this.vx));
        ctx.fillStyle = this.color;
        ctx.fillRect(-r * 2.2, -r * 0.8, r * 4.4, r * 1.6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-r * 1.4, -r * 0.35, r * 2.8, r * 0.7);
        ctx.restore();
        break;
      }
      case 'mine': {
        const spin = this.time * 6;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = spin + (i * TAU) / 4;
          ctx.moveTo(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6);
          ctx.lineTo(x + Math.cos(a) * (r + 4), y + Math.sin(a) * (r + 4));
        }
        ctx.stroke();
        this.drawOrb(ctx, x, y, r, this.homing > 0 && Math.floor(this.time * 10) % 2 ? '#ffffff' : this.color);
        break;
      }
      default:
        this.drawOrb(ctx, x, y, r, this.color);
    }
  }

  drawOrb(ctx, x, y, r, color) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r + 3, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.5, 0, TAU);
    ctx.fill();
  }
}
