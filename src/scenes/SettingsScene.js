/**
 * SettingsScene — tela "CONFIGURAÇÕES" (v1.8).
 *
 * Junta num lugar só o que antes ficava espalhado em botões pequenos no topo
 * do menu e na página TOQUE dos controles: volume da música e dos efeitos,
 * som ligado/desligado, vibração, tela cheia e, no celular, o esquema de
 * toque e a ajuda do celular.
 *
 * Teclado: ↑/↓ escolhe, ←/→ (ou ENTER) muda, ESC volta.
 * Toque: metade esquerda da linha diminui/volta, metade direita aumenta/avança.
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H, UI_COLORS } from '../config.js';
import { drawText } from '../graphics/text.js';
import { VOLUME_STEPS } from '../core/AudioEngine.js';
import { canVibrate, vibrationEnabled, toggleVibration } from '../core/Haptics.js';
import {
  SCHEMES, SCHEME_LABELS, ASSIST_MODES, ASSIST_LABELS, ASSIST_KEY, loadTouchSettings, isTouchDevice, cycle,
} from '../core/TouchControls.js';

const BACK = Object.freeze({ x: 8, y: 8, w: 110, h: 34 });
const ROW_Y0 = 120;
const ROW_H = 56;

const inside = (p, r) => p && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

export class SettingsScene {
  /** @param {{back: () => object}} options fábrica da cena para onde voltar */
  constructor(game, { back }) {
    this.game = game;
    this.back = back;
    this.row = 0;
    this.time = 0;
  }

  /** Linhas visíveis neste aparelho (as do celular só aparecem com toque). */
  get rows() {
    const game = this.game;
    const touch = game.input.touchMode || isTouchDevice();
    return [
      { id: 'music', label: 'MÚSICA' },
      { id: 'sfx', label: 'EFEITOS' },
      { id: 'mute', label: 'SOM' },
      ...(canVibrate() ? [{ id: 'vibe', label: 'VIBRAÇÃO' }] : []),
      ...(game.fullscreenSupported ? [{ id: 'full', label: 'TELA CHEIA' }] : []),
      ...(touch ? [{ id: 'scheme', label: 'TOQUE' }, { id: 'assist', label: 'AJUDA' }] : []),
    ];
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    const rows = this.rows;
    if (inside(input.tap, BACK) || input.wasPressed('quit') || (!input.tap && input.wasPressed('pause'))) {
      this.game.audio.play('select');
      this.game.changeScene(this.back());
      return;
    }
    if (input.wasPressed('up')) this.row = (this.row - 1 + rows.length) % rows.length;
    if (input.wasPressed('down')) this.row = (this.row + 1) % rows.length;
    if (input.wasPressed('left')) this.change(rows[this.row].id, -1);
    if (input.wasPressed('right') || (!input.tap && input.wasPressed('confirm'))) this.change(rows[this.row].id, 1);
    if (input.tap) {
      const index = Math.floor((input.tap.y - ROW_Y0 + 20) / ROW_H);
      if (index >= 0 && index < rows.length) {
        this.row = index;
        this.change(rows[index].id, input.tap.x < W / 2 ? -1 : 1);
      }
    }
  }

  /** Aplica a mudança de uma linha (delta = -1 ou +1). */
  change(id, delta) {
    const { game } = this;
    const audio = game.audio;
    switch (id) {
      case 'music':
      case 'sfx':
        audio.setVolume(id, audio.volume[id] + delta);
        break;
      case 'mute':
        audio.toggleMute();
        break;
      case 'vibe':
        toggleVibration(game.storage);
        break;
      case 'full':
        game.toggleFullscreen();
        break;
      case 'scheme':
        game.input.setTouchScheme(cycle(SCHEMES, game.input.touchScheme, delta));
        break;
      case 'assist':
        game.storage.set(ASSIST_KEY, cycle(ASSIST_MODES, loadTouchSettings(game.storage).assist, delta));
        break;
      default:
    }
    audio.play('select');
  }

  /** Texto do valor atual de cada linha. */
  valueOf(id) {
    const { game } = this;
    switch (id) {
      case 'mute': return game.audio.muted ? 'DESLIGADO' : 'LIGADO';
      case 'vibe': return vibrationEnabled(game.storage) ? 'LIGADA' : 'DESLIGADA';
      case 'full': return game.isFullscreen ? 'LIGADA' : 'DESLIGADA';
      case 'scheme': return SCHEME_LABELS[game.input.touchScheme];
      case 'assist': return ASSIST_LABELS[loadTouchSettings(game.storage).assist];
      default: return '';
    }
  }

  draw(ctx) {
    drawText(ctx, 'CONFIGURAÇÕES', W / 2, 66, { size: 16, align: 'center', color: UI_COLORS.accent });
    this.rows.forEach((row, i) => {
      const y = ROW_Y0 + i * ROW_H;
      const active = i === this.row;
      ctx.fillStyle = active ? 'rgba(59, 93, 201, 0.35)' : 'rgba(26, 28, 44, 0.75)';
      ctx.fillRect(28, y - 20, W - 56, 42);
      ctx.strokeStyle = active ? UI_COLORS.accent : '#333c57';
      ctx.lineWidth = active ? 2 : 1;
      ctx.strokeRect(28.5, y - 19.5, W - 57, 41);
      drawText(ctx, row.label, 44, y, { size: 11, baseline: 'middle', color: active ? UI_COLORS.text : '#94b0c2' });
      if (row.id === 'music' || row.id === 'sfx') this.drawVolume(ctx, this.game.audio.volume[row.id], y, active);
      else drawText(ctx, `< ${this.valueOf(row.id)} >`, W - 44, y, { size: 10, align: 'right', baseline: 'middle', color: active ? '#ffcd75' : '#94b0c2' });
    });
    this.drawBack(ctx);
    drawText(ctx, '< > MUDAR    ESC VOLTAR', W / 2, H - 40, { size: 8, align: 'center', color: '#566c86' });
  }

  /** Barra de volume com 10 blocos. */
  drawVolume(ctx, value, y, active) {
    const x0 = W - 44 - VOLUME_STEPS * 16;
    for (let i = 0; i < VOLUME_STEPS; i++) {
      ctx.fillStyle = i < value ? (active ? '#ffcd75' : '#94b0c2') : '#333c57';
      ctx.fillRect(x0 + i * 16, y - 8, 12, 16);
    }
  }

  drawBack(ctx) {
    ctx.fillStyle = 'rgba(26, 28, 44, 0.85)';
    ctx.fillRect(BACK.x, BACK.y, BACK.w, BACK.h);
    ctx.strokeStyle = '#566c86';
    ctx.lineWidth = 1;
    ctx.strokeRect(BACK.x + 0.5, BACK.y + 0.5, BACK.w - 1, BACK.h - 1);
    drawText(ctx, '< VOLTAR', BACK.x + BACK.w / 2, BACK.y + BACK.h / 2, { size: 9, align: 'center', baseline: 'middle' });
  }
}
