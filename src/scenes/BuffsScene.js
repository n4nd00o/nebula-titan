/**
 * BuffsScene — tela "MEUS BUFFS" (v1.5).
 *
 * Mostra TODOS os buffs do jogo, um mundo por página: os conquistados com
 * nome, efeito e de onde vieram; os que faltam aparecem como "???" com o
 * chefe que os concede.
 *
 * Abre pela pausa (botão ou tecla I), pelo Mapa de Progresso e pelo título.
 * Ao voltar para a luta, a cena original é retomada exatamente como estava.
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H, UI_COLORS } from '../config.js';
import { drawText } from '../graphics/text.js';
import { ENCOUNTERS } from '../encounters.js';
import { BUFFS, REWARDS, WORLDS, buffSource } from '../systems/Campaign.js';

const BACK = Object.freeze({ x: 8, y: 8, w: 96, h: 30 });
const TAB_Y = 84;
const TAB_W = 80;
const TAB_X0 = (W - TAB_W * WORLDS.length) / 2;
const CARD_Y0 = 116;
const CARD_H = 60;
const CARD_GAP = 4;

const inside = (p, r) => p && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

/** Buffs de um mundo, na ordem: os dos mini-chefes e o bônus do mundo. */
export const buffsOfWorld = (index) => [...WORLDS[index].minis.map((id) => REWARDS[id]), WORLDS[index].completionReward];

/** Texto de origem de um buff ("DE: SENTINELA" / "BÔNUS DO MUNDO 1"). */
export function sourceLabel(buffId) {
  const src = buffSource(buffId);
  return src.kind === 'mini' ? `DE: ${ENCOUNTERS[src.id].name}` : `BÔNUS DO MUNDO ${src.world + 1} (3 MINI-CHEFES)`;
}

export class BuffsScene {
  /**
   * @param {object} game
   * @param {{buffs?: Set<string>, returnTo?: object|null, back?: (() => object)|null}} options
   *   returnTo: cena para RETOMAR sem reiniciar (pausa da luta)
   *   back:     fábrica da cena para onde voltar (título, mapa)
   */
  constructor(game, { buffs = new Set(), returnTo = null, back = null } = {}) {
    this.game = game;
    this.buffs = buffs;
    this.returnTo = returnTo;
    this.back = back;
    this.time = 0;
    // Abre na página do mundo mais avançado em que você já tem buffs.
    const owned = [...buffs].map((id) => buffSource(id).world).filter((i) => i >= 0);
    this.page = owned.length ? Math.max(...owned) : 0;
  }

  enter() {}

  close() {
    const game = this.game;
    game.audio.play('select');
    if (this.returnTo) game.resumeScene(this.returnTo);
    else if (this.back) game.changeScene(this.back());
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('pause') || input.wasPressed('quit') || input.wasPressed('buffs') || inside(input.tap, BACK)) {
      this.close();
      return;
    }
    const n = WORLDS.length;
    if (input.wasPressed('left') || input.wasPressed('up')) this.turn((this.page - 1 + n) % n);
    if (input.wasPressed('right') || input.wasPressed('down')) this.turn((this.page + 1) % n);
    if (input.tap && input.tap.y >= TAB_Y && input.tap.y <= TAB_Y + 24) {
      const tab = Math.floor((input.tap.x - TAB_X0) / TAB_W);
      if (tab >= 0 && tab < n) this.turn(tab);
    }
  }

  turn(page) {
    if (page === this.page) return;
    this.page = page;
    this.game.audio.play('select');
  }

  draw(ctx) {
    // Fundo escuro por cima da cena anterior.
    ctx.fillStyle = 'rgba(5, 5, 13, 0.92)';
    ctx.fillRect(0, 0, W, H);

    const total = Object.keys(BUFFS).length;
    drawText(ctx, 'MEUS BUFFS', W / 2, 44, { size: 16, align: 'center', color: UI_COLORS.accent });
    drawText(ctx, `${this.buffs.size}/${total} CONQUISTADOS`, W / 2, 66, { size: 7, align: 'center', color: UI_COLORS.muted });

    // Abas por mundo
    WORLDS.forEach((w, i) => {
      const x = TAB_X0 + i * TAB_W;
      const active = i === this.page;
      const got = buffsOfWorld(i).filter((id) => this.buffs.has(id)).length;
      ctx.fillStyle = active ? 'rgba(59, 93, 201, 0.35)' : 'rgba(26, 28, 44, 0.9)';
      ctx.fillRect(x + 2, TAB_Y, TAB_W - 4, 24);
      ctx.strokeStyle = active ? w.theme.accent : '#333c57';
      ctx.lineWidth = active ? 2 : 1;
      ctx.strokeRect(x + 2.5, TAB_Y + 0.5, TAB_W - 5, 23);
      drawText(ctx, `M${w.number} ${got}/${buffsOfWorld(i).length}`, x + TAB_W / 2, TAB_Y + 12, { size: 6, align: 'center', baseline: 'middle', color: active ? UI_COLORS.text : '#566c86' });
    });

    const world = WORLDS[this.page];
    buffsOfWorld(this.page).forEach((id, i) => this.drawCard(ctx, id, CARD_Y0 + i * (CARD_H + CARD_GAP), world));

    const touch = this.game.input.touchMode;
    drawText(ctx, touch ? 'Toque nas abas para trocar de mundo' : '< > trocar de mundo   ESC voltar', W / 2, H - 20, { size: 6, align: 'center', color: '#566c86' });

    // Botão voltar
    ctx.fillStyle = 'rgba(26, 28, 44, 0.9)';
    ctx.fillRect(BACK.x, BACK.y, BACK.w, BACK.h);
    ctx.strokeStyle = '#566c86';
    ctx.lineWidth = 2;
    ctx.strokeRect(BACK.x + 0.5, BACK.y + 0.5, BACK.w - 1, BACK.h - 1);
    drawText(ctx, '< VOLTAR', BACK.x + BACK.w / 2, BACK.y + BACK.h / 2, { size: 7, align: 'center', baseline: 'middle' });
  }

  drawCard(ctx, id, y, world) {
    const buff = BUFFS[id];
    const owned = this.buffs.has(id);
    const x = 24;
    const w = W - 48;
    ctx.fillStyle = owned ? 'rgba(26, 28, 44, 0.95)' : 'rgba(26, 28, 44, 0.6)';
    ctx.fillRect(x, y, w, CARD_H);
    ctx.strokeStyle = owned ? buff.color : '#333c57';
    ctx.lineWidth = owned ? 2 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, CARD_H - 1);
    // Marcador colorido à esquerda
    ctx.fillStyle = owned ? buff.color : '#333c57';
    ctx.fillRect(x + 8, y + 10, 8, CARD_H - 20);

    if (owned) {
      drawText(ctx, buff.name, x + 26, y + 10, { size: 9, color: buff.color });
      drawText(ctx, buff.description, x + 26, y + 28, { size: 6 });
      drawText(ctx, sourceLabel(id), x + 26, y + 44, { size: 5, color: UI_COLORS.muted });
    } else {
      drawText(ctx, '???', x + 26, y + 10, { size: 9, color: '#566c86' });
      const src = buffSource(id);
      const hint = src.kind === 'mini' ? `Derrote ${ENCOUNTERS[src.id].name} (Mundo ${world.number})` : `Vença os mini-chefes do Mundo ${world.number}`;
      drawText(ctx, hint, x + 26, y + 30, { size: 6, color: '#566c86' });
    }
  }
}
