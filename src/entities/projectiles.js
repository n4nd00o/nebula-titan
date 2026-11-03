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
   * @param {{piercing?: boolean, vx?: number, damage?: number, focus?: boolean}} options
   *        piercing: +50% de dano e atravessa drones; vx: tiro diagonal (Tiro Triplo);
   *        focus: tiro amplificado do modo foco (buff Foco Amplificado)
   */
  constructor(x, y, { piercing = false, vx = 0, damage = null, focus = false } = {}) {
    this.x = x;
    this.y = y;
    this.prevX = x; // posição no quadro anterior (para colisão contínua)
    this.prevY = y;
    this.vx = vx;
    this.vy = -PLAYER.bulletSpeed;
    this.radius = 3;
    this.piercing = piercing;
    this.focus = focus;
    this.damage = damage ?? (piercing ? PLAYER.piercingDamage : PLAYER.bulletDamage);
    this.hitMinions = piercing ? new Set() : null; // drones já atravessados
    this.dead = false;
  }

  update(dt) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y < -20 || this.x < -20 || this.x > GAME_WIDTH + 20) this.dead = true;
  }

  draw(ctx) {
    if (this.focus) {
      ctx.fillStyle = '#e43b8c';
      ctx.fillRect(Math.round(this.x - 2.5), Math.round(this.y - 9), 5, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(this.x - 1), Math.round(this.y - 8), 2, 12);
      return;
    }
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
 * Míssil teleguiado do jogador (buff MÍSSEIS, da Fornalha).
 * Persegue o alvo escolhido pela cena (ponto fraco do chefe ou alienígena)
 * girando no máximo `turnRate` rad/s, então ainda dá para "errar".
 */
export class PlayerMissile extends PlayerBullet {
  constructor(x, y, dir, { damage = PLAYER.missileDamage } = {}) {
    super(x, y, { damage });
    this.speed = PLAYER.missileSpeed;
    this.angle = -Math.PI / 2 + dir * 0.7; // sai abrindo para o lado
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.turnRate = 5;
    this.radius = 3;
    this.missile = true;
    this.time = 0;
  }

  update(dt, scene) {
    this.time += dt;
    const target = scene?.missileTarget?.(this);
    if (target) {
      const desired = Math.atan2(target.y - this.y, target.x - this.x);
      const turn = Math.max(-this.turnRate * dt, Math.min(this.turnRate * dt, angleDiff(this.angle, desired)));
      this.angle += turn;
    }
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.time > 3 || isOutside(this.x, this.y)) this.dead = true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.rotate(this.angle + Math.PI / 2);
    ctx.fillStyle = '#ef7d57';
    ctx.fillRect(-1, 3, 2, 3 + Math.random() * 3);
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(-1.5, -4, 3, 8);
    ctx.fillStyle = '#b13e53';
    ctx.fillRect(-1.5, -5, 3, 2);
    ctx.restore();
  }
}

/**
 * Tipos (kind):
 *  - orb:    bola simples
 *  - needle: projétil alongado e rápido (orientado pela velocidade)
 *  - mine:   mina teleguiada (homing) com espinhos
 *  - shard:  cristal (losango) — costuma se DIVIDIR em vários
 *
 * Comportamentos opcionais (combináveis):
 *  - homing/turnRate: persegue o jogador por `homing` segundos
 *  - spin:  gira o vetor velocidade (rad/s) — tiros que fazem curva
 *  - accel: aceleração (px/s²) até `maxSpeed`
 *  - split: { at, count, speed, spread?, ring?, style? } — após `at` segundos
 *           o projétil some e vira `count` projéteis (leque ou anel)
 */
export class EnemyBullet {
  constructor({
    x, y, vx = 0, vy = 0, kind = 'orb', color = '#e43b8c', radius = 4,
    homing = 0, turnRate = 0, speed = null, life = 9, spin = 0, accel = 0, maxSpeed = 400, split = null,
  }) {
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
    this.spin = spin;
    this.accel = accel;
    this.maxSpeed = maxSpeed;
    this.split = split;
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
    if (this.spin || this.accel) {
      const angle = Math.atan2(this.vy, this.vx) + this.spin * dt;
      if (this.accel) this.speed = Math.max(20, Math.min(this.maxSpeed, this.speed + this.accel * dt));
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.split && this.time >= this.split.at) this.doSplit(scene);
    if (this.life <= 0 || isOutside(this.x, this.y)) this.dead = true;
  }

  /** Divide o projétil em vários (leque na direção atual, ou anel completo). */
  doSplit(scene) {
    const s = this.split;
    this.split = null; // divide uma única vez
    this.dead = true;
    const base = Math.atan2(this.vy, this.vx);
    const style = { kind: 'orb', color: this.color, radius: 3, ...(s.style ?? {}) };
    for (let i = 0; i < s.count; i++) {
      let a;
      if (s.ring) a = base + (i * TAU) / s.count;
      else a = s.count === 1 ? base : base - s.spread / 2 + (s.spread * i) / (s.count - 1);
      scene.spawnEnemyBullet({ x: this.x, y: this.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, ...style });
    }
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
      case 'shard': {
        // Cristal: losango que pisca antes de se dividir.
        const warn = this.split && this.split.at - this.time < 0.25 && Math.floor(this.time * 20) % 2 === 0;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.time * 5);
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = this.color;
        ctx.fillRect(-r - 2, -r - 2, (r + 2) * 2, (r + 2) * 2);
        ctx.globalAlpha = 1;
        ctx.fillStyle = warn ? '#ffffff' : this.color;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.4);
        ctx.lineTo(r, 0);
        ctx.lineTo(0, r * 1.4);
        ctx.lineTo(-r, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -r * 0.6, 2, r * 1.2);
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
