/**
 * Ala Companheira — nave aliada libertada da Colmeia.
 *
 * Homenagem direta à "nave dupla" do Galaga original (lá, o jogador
 * resgatava uma nave capturada pelo raio trator do inimigo). Aqui ela
 * segue o jogador com um leve atraso e atira junto. É invulnerável e
 * some enquanto o jogador está renascendo.
 */
import { approach } from '../utils/math.js';

const OFFSET_X = -34;
const OFFSET_Y = 14;

export class Wingman {
  /**
   * @param {object} player
   * @param {number} side -1 = à esquerda (Ala Companheira), +1 = à direita (Ala Dupla)
   */
  constructor(player, side = -1) {
    this.side = side;
    this.x = player.x - OFFSET_X * side;
    this.y = player.y + OFFSET_Y;
    this.visible = true;
    this.time = 0;
  }

  update(dt, player) {
    this.time += dt;
    this.visible = player.alive;
    if (!player.alive) return;
    // Segue a posição-alvo com atraso (sensação de formação de voo).
    const tx = player.x - OFFSET_X * this.side;
    const ty = player.y + OFFSET_Y + Math.sin(this.time * 3 + (this.side > 0 ? Math.PI : 0)) * 3;
    this.x = approach(this.x, tx, Math.max(60, Math.abs(tx - this.x) * 8) * dt);
    this.y = approach(this.y, ty, Math.max(60, Math.abs(ty - this.y) * 8) * dt);
  }

  draw(ctx, sprites) {
    if (!this.visible) return;
    ctx.fillStyle = '#38b764';
    ctx.fillRect(Math.round(this.x - 1), Math.round(this.y + 14), 2, 4 + Math.random() * 4);
    sprites.draw(ctx, 'wingman', this.x, this.y, { scale: 0.8 });
  }
}
