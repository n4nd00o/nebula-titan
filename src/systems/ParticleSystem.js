/**
 * Sistema de partículas: explosões, faíscas, fumaça, destroços e ondas de choque.
 *
 * Partículas são objetos simples guardados em um array. A remoção é feita
 * por compactação in-place (sem criar arrays novos a cada frame) para
 * reduzir trabalho do coletor de lixo (garbage collector).
 */
import { rand, pick, TAU, removeDead } from '../utils/math.js';

const FIRE = ['#ffcd75', '#ef7d57', '#b13e53', '#f4f4f4'];
const SMOKE = ['#333c57', '#566c86', '#29366f'];

export class ParticleSystem {
  constructor(max = 1500) {
    this.items = [];
    this.max = max;
  }

  get count() {
    return this.items.length;
  }

  add(p) {
    if (this.items.length >= this.max) return;
    this.items.push({
      x: p.x,
      y: p.y,
      vx: p.vx ?? 0,
      vy: p.vy ?? 0,
      life: p.life ?? 0.5,
      maxLife: p.life ?? 0.5,
      size: p.size ?? 2,
      sizeEnd: p.sizeEnd ?? p.size ?? 2,
      color: p.color ?? '#ffffff',
      gravity: p.gravity ?? 0,
      drag: p.drag ?? 0,
      shape: p.shape ?? 'square', // square | spark | ring | circle
      glow: p.glow ?? false,
      dead: false,
    });
  }

  /** Emite várias partículas em leque/círculo. */
  burst(x, y, opts = {}) {
    const {
      count = 10,
      speed = [40, 120],
      life = [0.3, 0.7],
      size = [2, 3],
      sizeEnd = null,
      colors = FIRE,
      angle = 0,
      spread = TAU,
      gravity = 0,
      drag = 0,
      shape = 'square',
      glow = false,
      jitter = 0,
    } = opts;
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const v = rand(speed[0], speed[1]);
      const s = rand(size[0], size[1]);
      this.add({
        x: x + rand(-jitter, jitter),
        y: y + rand(-jitter, jitter),
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: rand(life[0], life[1]),
        size: s,
        sizeEnd: sizeEnd ?? s,
        color: pick(colors),
        gravity,
        drag,
        shape,
        glow,
      });
    }
  }

  explosion(x, y, scale = 1) {
    this.ring(x, y, '#ffcd75', 28 * scale, 0.35);
    this.burst(x, y, {
      count: Math.round(26 * scale),
      speed: [40 * scale, 190 * scale],
      life: [0.3, 0.8],
      size: [2, 4 + scale],
      sizeEnd: 0.5,
      drag: 2.5,
      glow: true,
      jitter: 6 * scale,
    });
    this.burst(x, y, {
      count: Math.round(12 * scale),
      speed: [10, 50 * scale],
      life: [0.6, 1.3],
      size: [4, 6 + 2 * scale],
      sizeEnd: 10 + 3 * scale,
      colors: SMOKE,
      drag: 1.5,
      gravity: -15,
      shape: 'circle',
      jitter: 8 * scale,
    });
    this.burst(x, y, {
      count: Math.round(10 * scale),
      speed: [150, 320],
      life: [0.2, 0.45],
      colors: ['#ffffff', '#ffcd75'],
      shape: 'spark',
      glow: true,
      drag: 3,
    });
  }

  debris(x, y, colors, count = 16) {
    this.burst(x, y, {
      count,
      speed: [60, 220],
      life: [0.8, 1.6],
      size: [3, 6],
      colors,
      gravity: 260,
      drag: 0.6,
      angle: -Math.PI / 2,
      spread: Math.PI * 1.6,
      jitter: 10,
    });
  }

  smoke(x, y) {
    this.add({
      x: x + rand(-3, 3),
      y,
      vx: rand(-10, 10),
      vy: rand(-30, -10),
      life: rand(0.6, 1.1),
      size: rand(3, 5),
      sizeEnd: rand(8, 12),
      color: pick(SMOKE),
      shape: 'circle',
      drag: 0.8,
    });
  }

  sparks(x, y, count = 4, color = '#ffcd75') {
    this.burst(x, y, {
      count,
      speed: [60, 180],
      life: [0.15, 0.35],
      colors: [color, '#ffffff'],
      shape: 'spark',
      glow: true,
      gravity: 300,
      angle: Math.PI / 2,
      spread: Math.PI * 1.2,
    });
  }

  hitSpark(x, y, color = '#ffcd75') {
    this.burst(x, y, {
      count: 4,
      speed: [40, 140],
      life: [0.08, 0.2],
      colors: [color, '#ffffff'],
      shape: 'spark',
      glow: true,
      angle: Math.PI / 2,
      spread: Math.PI * 1.4,
    });
  }

  ring(x, y, color = '#ffffff', radius = 30, life = 0.4) {
    this.add({ x, y, life, size: 2, sizeEnd: radius, color, shape: 'ring', glow: true });
  }

  /** Partícula sendo "sugada" para um ponto (carga do laser). */
  charge(x, y, color = '#e43b8c') {
    const a = rand(0, TAU);
    const dist = rand(30, 60);
    const life = 0.35;
    this.add({
      x: x + Math.cos(a) * dist,
      y: y + Math.sin(a) * dist,
      vx: (-Math.cos(a) * dist) / life,
      vy: (-Math.sin(a) * dist) / life,
      life,
      size: 2,
      sizeEnd: 1,
      color,
      glow: true,
    });
  }

  update(dt) {
    for (const p of this.items) {
      p.life -= dt;
      if (p.life <= 0) {
        p.dead = true;
        continue;
      }
      if (p.drag) {
        const k = Math.max(0, 1 - p.drag * dt);
        p.vx *= k;
        p.vy *= k;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    removeDead(this.items);
  }

  draw(ctx) {
    // Duas passadas: normal (fumaça/destroços) e aditiva (brilho/fogo).
    this.drawPass(ctx, false);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    this.drawPass(ctx, true);
    ctx.restore();
  }

  drawPass(ctx, glow) {
    for (const p of this.items) {
      if (p.glow !== glow) continue;
      const t = 1 - p.life / p.maxLife; // 0 -> 1
      const size = p.size + (p.sizeEnd - p.size) * t;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife + 0.15));
      switch (p.shape) {
        case 'ring':
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1, 3 * (1 - t));
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, TAU);
          ctx.stroke();
          break;
        case 'spark':
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
          ctx.stroke();
          break;
        case 'circle':
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size / 2, 0, TAU);
          ctx.fill();
          break;
        default:
          ctx.fillStyle = p.color;
          ctx.fillRect(Math.round(p.x - size / 2), Math.round(p.y - size / 2), Math.ceil(size), Math.ceil(size));
      }
    }
    ctx.globalAlpha = 1;
  }
}
