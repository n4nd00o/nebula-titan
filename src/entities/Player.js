/**
 * Nave do jogador.
 *
 * Decisões de design "modernas" aplicadas a um clássico:
 *  - hitbox MUITO menor que o sprite (raio 4px), padrão dos shmups atuais:
 *    o jogador sente que "escapou por pouco" em vez de morrer injustamente;
 *  - modo foco (Shift): movimento lento e hitbox visível para desvios finos;
 *  - movimento em 2 eixos (o Galaga original só movia na horizontal);
 *  - invencibilidade temporária após renascer.
 */
import { GAME_WIDTH, GAME_HEIGHT, PLAYER } from '../config.js';
import { clamp, approach } from '../utils/math.js';

export class Player {
  constructor() {
    this.x = GAME_WIDTH / 2;
    this.y = GAME_HEIGHT - 90;
    this.lives = PLAYER.lives;
    this.alive = true;
    this.invuln = PLAYER.spawnInvuln;
    this.fireTimer = 0;
    this.double = false;
    this.rapidTime = 0;
    this.shield = false;
    this.respawnTimer = 0;
    this.hitRadius = PLAYER.hitRadius;
    this.bank = 0;
    this.time = 0;
    this.focused = false;
    this.godMode = false;
    // Buffs da campanha (Set com ids de BUFFS em systems/Campaign.js).
    this.buffs = new Set();
    this.dashTime = 0; // > 0 enquanto está no meio de um dash
    this.dashCooldown = 0;
    this.dashDir = { x: 0, y: -1 };
    this.trail = []; // "imagens fantasma" do dash
  }

  get dashReady() {
    return this.buffs.has('dash') && this.dashCooldown <= 0;
  }

  /** Dash: investida curta com invencibilidade (buff do Ceifador). */
  tryDash(dx, dy, scene) {
    if (!this.dashReady || this.dashTime > 0) return;
    let x = dx;
    let y = dy;
    if (!x && !y) {
      // Sem direção: usa a inclinação atual, ou para cima.
      x = Math.abs(this.bank) > 0.2 ? Math.sign(this.bank) : 0;
      y = x ? 0 : -1;
    }
    const len = Math.hypot(x, y);
    this.dashDir = { x: x / len, y: y / len };
    const phantom = this.buffs.has('phantom'); // Fantasma: recarga e invencibilidade melhores
    this.dashTime = PLAYER.dashDuration;
    this.dashCooldown = phantom ? PLAYER.phantomDashCooldown : PLAYER.dashCooldown;
    this.invuln = Math.max(this.invuln, phantom ? PLAYER.phantomDashInvuln : PLAYER.dashInvuln);
    scene.onPlayerDash?.(this);
  }

  update(dt, scene) {
    this.time += dt;
    if (!this.alive) {
      if (this.lives > 0) {
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) this.respawn(scene);
      }
      return;
    }

    this.invuln = Math.max(0, this.invuln - dt);
    this.rapidTime = Math.max(0, this.rapidTime - dt);

    const input = scene.input;
    let dx = 0;
    let dy = 0;
    this.focused = input.isDown('focus');

    if (input.pointer.active) {
      // Toque: a nave segue o dedo (um pouco acima, para o dedo não cobrir a nave).
      const tx = input.pointer.x;
      const ty = input.pointer.y - PLAYER.touchOffset;
      const ddx = tx - this.x;
      const ddy = ty - this.y;
      const dist = Math.hypot(ddx, ddy);
      if (dist > 2) {
        const step = Math.min(dist, PLAYER.speed * 1.4 * dt);
        this.x += (ddx / dist) * step;
        this.y += (ddy / dist) * step;
        dx = Math.abs(ddx) > 4 ? Math.sign(ddx) : 0;
      }
    } else {
      if (input.isDown('left')) dx -= 1;
      if (input.isDown('right')) dx += 1;
      if (input.isDown('up')) dy -= 1;
      if (input.isDown('down')) dy += 1;
      if (dx && dy) {
        // Normaliza a diagonal para não andar mais rápido na diagonal.
        dx *= Math.SQRT1_2;
        dy *= Math.SQRT1_2;
      }
      const speed = this.focused ? PLAYER.focusSpeed : PLAYER.speed;
      this.x += dx * speed * dt;
      this.y += dy * speed * dt;
    }

    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    if (input.wasPressed('dash')) this.tryDash(Math.sign(dx), Math.sign(dy), scene);
    if (this.dashTime > 0) {
      this.dashTime -= dt;
      this.x += this.dashDir.x * PLAYER.dashSpeed * dt;
      this.y += this.dashDir.y * PLAYER.dashSpeed * dt;
      this.trail.push({ x: this.x, y: this.y, life: 0.25 });
    }
    for (const t of this.trail) t.life -= dt;
    this.trail = this.trail.filter((t) => t.life > 0);

    this.bank = approach(this.bank, dx, dt * 6);
    this.x = clamp(this.x, 20, GAME_WIDTH - 20);
    this.y = clamp(this.y, PLAYER.minY, GAME_HEIGHT - 30);

    this.fireTimer -= dt;
    const wantsFire = input.isDown('fire') || input.pointer.active;
    if (wantsFire && this.fireTimer <= 0) {
      const base = this.rapidTime > 0 ? PLAYER.rapidCooldown : PLAYER.fireCooldown;
      this.fireTimer = this.buffs.has('overdrive') ? base * PLAYER.overdriveFactor : base;
      scene.firePlayerShot(this);
    }
  }

  /** Tenta aplicar dano. Retorna true se o jogador perdeu uma vida. */
  hit(scene) {
    if (!this.alive || this.invuln > 0 || this.godMode) return false;
    if (this.shield) {
      this.shield = false;
      this.invuln = 1;
      scene.onShieldBreak(this);
      return false;
    }
    if (this.buffs.has('rebirth') && !scene.rebirthUsed) {
      // RENASCER: uma vez por luta, não perde a vida.
      this.invuln = 2.5;
      scene.onRebirth?.(this);
      return false;
    }
    this.alive = false;
    this.lives--;
    this.double = false;
    this.rapidTime = 0;
    this.respawnTimer = PLAYER.respawnDelay;
    scene.onPlayerDeath(this);
    return true;
  }

  respawn(scene) {
    this.alive = true;
    this.x = GAME_WIDTH / 2;
    this.y = GAME_HEIGHT - 90;
    this.invuln = PLAYER.respawnInvuln;
    scene.onPlayerRespawn?.(this);
  }

  draw(ctx, sprites) {
    if (!this.alive) return;
    const blinking = this.invuln > 0 && Math.floor(this.time * 16) % 2 === 0;

    // Chama do motor (procedural, tremula a cada frame).
    const flame = 6 + Math.random() * 6;
    ctx.fillStyle = '#ef7d57';
    ctx.fillRect(Math.round(this.x - 2), Math.round(this.y + 18), 4, Math.round(flame));
    ctx.fillStyle = '#ffcd75';
    ctx.fillRect(Math.round(this.x - 1), Math.round(this.y + 18), 2, Math.round(flame * 0.6));

    for (const t of this.trail) {
      sprites.draw(ctx, 'player', t.x, t.y, { variant: 'flash', alpha: t.life * 1.6 });
    }

    if (!blinking) {
      ctx.save();
      ctx.translate(Math.round(this.x), Math.round(this.y));
      ctx.rotate(this.bank * 0.12);
      sprites.draw(ctx, 'player', 0, 0);
      ctx.restore();
    }

    if (this.shield) {
      const pulse = 0.5 + 0.3 * Math.sin(this.time * 8);
      ctx.strokeStyle = `rgba(56, 183, 100, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 28, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.focused) {
      // Mostra a hitbox real no modo foco.
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.hitRadius + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e43b8c';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.hitRadius - 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
