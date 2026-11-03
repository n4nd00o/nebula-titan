/**
 * Fundo de estrelas com parallax (3 camadas em velocidades diferentes).
 * O multiplicador de velocidade cria o efeito de "dobra espacial" (warp)
 * nas transições de fase.
 */
import { rand, pick, approach } from '../utils/math.js';

const LAYERS = [
  { speed: 18, size: 1, alpha: 0.45 },
  { speed: 42, size: 1, alpha: 0.75 },
  { speed: 90, size: 2, alpha: 1 },
];
const COLORS = ['#f4f4f4', '#73eff7', '#ffcd75', '#94b0c2', '#e43b8c'];

export class Starfield {
  constructor(width, height, count = 120) {
    this.width = width;
    this.height = height;
    this.multiplier = 1;
    this.targetMultiplier = 1;
    this.time = 0;
    this.stars = Array.from({ length: count }, () => ({
      x: rand(0, width),
      y: rand(0, height),
      layer: Math.floor(rand(0, LAYERS.length)),
      color: pick(COLORS),
      phase: rand(0, Math.PI * 2),
    }));
  }

  setSpeed(multiplier) {
    this.targetMultiplier = multiplier;
  }

  update(dt) {
    this.time += dt;
    this.multiplier = approach(this.multiplier, this.targetMultiplier, dt * 6);
    for (const star of this.stars) {
      star.y += LAYERS[star.layer].speed * this.multiplier * dt;
      if (star.y > this.height) {
        star.y -= this.height + 4;
        star.x = rand(0, this.width);
      }
    }
  }

  draw(ctx) {
    const streak = this.multiplier > 2;
    for (const star of this.stars) {
      const layer = LAYERS[star.layer];
      const twinkle = 0.65 + 0.35 * Math.sin(this.time * 3 + star.phase);
      ctx.globalAlpha = layer.alpha * twinkle;
      ctx.fillStyle = star.color;
      const h = streak ? layer.size + layer.speed * this.multiplier * 0.04 : layer.size;
      ctx.fillRect(Math.round(star.x), Math.round(star.y), layer.size, Math.round(h));
    }
    ctx.globalAlpha = 1;
  }
}
