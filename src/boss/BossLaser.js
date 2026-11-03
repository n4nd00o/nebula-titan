/**
 * Laser do canhão principal (fase 3).
 *
 * Ciclo: idle -> charge (aviso visual/sonoro) -> fire (letal) -> idle.
 * O "telegraph" (aviso antes do ataque) é um princípio fundamental de
 * design de chefes modernos: o jogador sempre tem chance de reagir.
 */
export const LASER = Object.freeze({
  chargeTime: 1.1,
  fireTime: 1.4,
  width: 26,
  sweepAngle: 0.45,
  muzzleOffsetY: 64,
  length: 900,
});

export class BossLaser {
  constructor() {
    this.state = 'idle';
    this.timer = 0;
    this.angle = Math.PI / 2;
    this.sweep = false;
    this.sweepDir = 1;
    this.width = LASER.width;
  }

  get active() {
    return this.state !== 'idle';
  }

  get isLethal() {
    return this.state === 'fire';
  }

  start(sweep, sweepDir, world) {
    this.state = 'charge';
    this.timer = LASER.chargeTime;
    this.sweep = sweep;
    this.sweepDir = sweepDir;
    this.angle = Math.PI / 2;
    world.audio.play('laserCharge');
  }

  cancel() {
    this.state = 'idle';
  }

  update(dt, boss) {
    if (this.state === 'idle') return;
    this.timer -= dt;
    const world = boss.world;

    if (this.state === 'charge') {
      const o = this.origin(boss);
      world.particles.charge(o.x, o.y);
      if (this.timer <= 0) {
        this.state = 'fire';
        this.timer = LASER.fireTime;
        world.audio.play('laserFire');
        world.shake(3, LASER.fireTime);
      }
    } else if (this.state === 'fire') {
      const progress = 1 - this.timer / LASER.fireTime;
      // Varredura: vai para um lado e volta (seno de 0 a PI).
      const offset = this.sweep ? this.sweepDir * LASER.sweepAngle * Math.sin(progress * Math.PI) : 0;
      this.angle = Math.PI / 2 + offset + boss.tilt;
      if (this.timer <= 0) this.state = 'idle';
    }
  }

  origin(boss) {
    return boss.worldPoint(0, LASER.muzzleOffsetY);
  }

  segment(boss) {
    const o = this.origin(boss);
    return {
      x1: o.x,
      y1: o.y,
      x2: o.x + Math.cos(this.angle) * LASER.length,
      y2: o.y + Math.sin(this.angle) * LASER.length,
    };
  }

  draw(ctx, boss) {
    if (this.state === 'idle') return;
    const s = this.segment(boss);
    const length = LASER.length;
    ctx.save();
    ctx.translate(s.x1, s.y1);
    ctx.rotate(this.angle - Math.PI / 2);

    if (this.state === 'charge') {
      // Linha de aviso piscando.
      const blink = Math.floor(this.timer * 14) % 2 === 0;
      ctx.globalAlpha = blink ? 0.7 : 0.25;
      ctx.fillStyle = '#e43b8c';
      ctx.fillRect(-1, 0, 2, length);
      ctx.globalAlpha = 0.9;
      const r = 4 + (1 - this.timer / LASER.chargeTime) * 10;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const flicker = 0.85 + Math.random() * 0.15;
      const w = this.width * flicker;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#e43b8c';
      ctx.fillRect(-w * 0.9, 0, w * 1.8, length);
      ctx.globalAlpha = 0.9;
      ctx.fillRect(-w / 2, 0, w, length);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-w * 0.2, 0, w * 0.4, length);
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
