/**
 * Alienígena de escolta invocado por chefes — homenagem direta ao Galaga:
 * entra em fila fazendo curvas e depois mergulha (dive) em direção ao
 * jogador, disparando. Pode ser verde (frágil) ou laranja (resistente).
 *
 * (Nas fases de ondas, os alienígenas usam FormationEnemy, que monta
 * formação antes de mergulhar.)
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { angleDiff } from '../utils/math.js';
import { ALIEN_TYPES } from './alienTypes.js';

export class Minion {
  /**
   * @param {number} baseX posição X de entrada
   * @param {number} delay atraso antes de aparecer (para entrar em fila)
   * @param {number} direction lado da curva em "S" (-1 ou 1)
   * @param {{startY?: number, entryTime?: number, type?: string}} options
   *        drones nascidos de ninhos/hangares começam mais abaixo e mergulham mais cedo
   */
  constructor(baseX, delay, direction, { startY = -20, entryTime = 1.3, type = 'green' } = {}) {
    this.baseX = baseX;
    this.x = baseX;
    this.y = startY;
    this.entryTime = entryTime;
    this.delay = delay;
    this.dir = direction;
    this.type = type;
    this.info = ALIEN_TYPES[type];
    this.state = 'waiting'; // waiting -> entering -> diving
    this.t = 0;
    this.hp = this.info.escortHp;
    this.radius = this.info.radius ?? 12;
    this.vx = 0;
    this.vy = 0;
    this.flash = 0;
    this.dead = false;
  }

  get active() {
    return this.state !== 'waiting';
  }

  get points() {
    return this.info.points + 50;
  }

  get dropChance() {
    return this.info.dropChance;
  }

  update(dt, scene) {
    if (this.state === 'waiting') {
      this.delay -= dt;
      if (this.delay <= 0) this.state = 'entering';
      return;
    }
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt);

    if (this.state === 'entering') {
      // Entrada em "S": desce enquanto oscila lateralmente.
      this.y += 140 * dt;
      this.x = this.baseX + Math.sin(this.t * 3) * 60 * this.dir;
      if (this.t > this.entryTime) this.startDive(scene);
    } else {
      // Mergulho com leve perseguição nos primeiros instantes.
      if (this.t < 1.9 && scene.player.alive) {
        const current = Math.atan2(this.vy, this.vx);
        const desired = Math.atan2(scene.player.y - this.y, scene.player.x - this.x);
        const turn = Math.max(-1.2 * dt, Math.min(1.2 * dt, angleDiff(current, desired)));
        const speed = Math.hypot(this.vx, this.vy);
        this.vx = Math.cos(current + turn) * speed;
        this.vy = Math.max(60, Math.sin(current + turn) * speed);
      }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.y > GAME_HEIGHT + 30 || this.x < -40 || this.x > GAME_WIDTH + 40) this.dead = true;
    }
  }

  startDive(scene) {
    this.state = 'diving';
    const target = scene.player;
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    const speed = Math.max(230, this.info.diveSpeed ?? 0);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.max(80, Math.sin(angle) * speed);
    if (this.info.shot) fireAlienShot(scene, this.x, this.y + 10, this.info.shot);
  }

  /** Retorna true se o drone foi destruído. */
  damage(amount) {
    this.hp -= amount;
    this.flash = 0.08;
    if (this.hp <= 0) this.dead = true;
    return this.dead;
  }

  draw(ctx, sprites) {
    if (!this.active) return;
    const angle = this.state === 'diving' ? Math.atan2(this.vy, this.vx) - Math.PI / 2 : 0;
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.rotate(angle);
    sprites.draw(ctx, this.info.sprite, 0, 0, { variant: this.flash > 0 ? 'flash' : null });
    ctx.restore();
  }
}

/** Disparo padrão de um alienígena (1 agulha ou leque de 3), mirado no jogador. */
export function fireAlienShot(scene, x, y, shot) {
  if (!shot) return;
  const p = scene.player;
  const base = Math.atan2(p.y - y, p.x - x);
  const spread = shot.count > 1 ? 0.35 : 0;
  for (let i = 0; i < shot.count; i++) {
    const a = shot.count === 1 ? base : base - spread / 2 + (spread * i) / (shot.count - 1);
    scene.spawnEnemyBullet({
      x, y,
      vx: Math.cos(a) * shot.speed,
      vy: Math.sin(a) * shot.speed,
      kind: shot.kind,
      color: shot.color,
      radius: shot.radius,
      split: shot.split ?? null,
    });
  }
}
