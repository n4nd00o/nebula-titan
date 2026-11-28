/**
 * ControlsScene — tela "CONTROLES".
 *
 * v1.8 (feedback de jogadores): em vez de só escrever o que cada tecla faz, a
 * tela desenha um TECLADO com as teclas de cada ação pintadas na cor da ação.
 * Embaixo, a lista das ações (mesmas cores) continua permitindo trocar as
 * teclas: setas escolhem, ENTER troca (a próxima tecla apertada é a nova),
 * DEL apaga a alternativa e "RESTAURAR PADRÃO" volta ao original.
 *
 * Página TOQUE (abre direto no celular): explica os controles de toque do
 * esquema atual. A escolha do esquema e da ajuda do celular fica em
 * CONFIGURAÇÕES (v1.8).
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H, UI_COLORS } from '../config.js';
import { drawText } from '../graphics/text.js';
import { drawKeyboard, KEYBOARD_SIZE } from '../graphics/keyboard.js';
import {
  REMAPPABLE, ACTION_LABELS, assignKey, clearSlot, defaultBindings, keyLabel,
} from '../core/KeyBindings.js';
import { isTouchDevice } from '../core/TouchControls.js';

/** Cor de cada ação (as quatro direções dividem a mesma cor: MOVER). */
export const ACTION_COLORS = Object.freeze({
  up: '#73eff7', down: '#73eff7', left: '#73eff7', right: '#73eff7',
  fire: '#ffcd75', focus: '#a7f070', dash: '#e43b8c', bomb: '#ef7d57', pause: '#94b0c2',
});

const KB_X = Math.round((W - KEYBOARD_SIZE.w) / 2);
const KB_Y = 70;
const ROW_Y0 = 232;
const ROW_H = 28;
const SLOT_X = [250, 360];
const SLOT_W = 96;
const RESET_ROW = REMAPPABLE.length; // última "linha": botão restaurar
const BACK = Object.freeze({ x: 8, y: 8, w: 110, h: 34 });
const TAB = Object.freeze({ x: W - 118, y: 8, w: 110, h: 34 });

const inside = (p, r) => p && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
const rowY = (i) => ROW_Y0 + i * ROW_H;

/** Textos curtos da página de toque, por esquema. */
const TOUCH_LINES = Object.freeze({
  modern: ['JOYSTICK: TOQUE E ARRASTE', 'O TIRO É AUTOMÁTICO', 'BOTÕES: DASH E BOMBA'],
  classic: ['A NAVE SEGUE O DEDO', 'O TIRO É AUTOMÁTICO', 'SEGUNDO DEDO: DASH'],
});

export class ControlsScene {
  /** @param {{back: () => object}} options fábrica da cena para onde voltar */
  constructor(game, { back } = {}) {
    this.game = game;
    this.back = back;
    this.row = 0;
    this.slot = 0;
    this.waiting = false;
    this.message = null;
    this.messageColor = UI_COLORS.muted;
    this.time = 0;
    // No celular a tela abre na página de toque (trocar teclas precisa de teclado).
    this.page = game.input.touchMode || isTouchDevice() ? 'touch' : 'keys';
  }

  get bindings() {
    return this.game.input.bindings;
  }

  say(text, color = UI_COLORS.muted) {
    this.message = text;
    this.messageColor = color;
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (this.waiting) {
      // A próxima tecla vai para o callback de captura. Um toque cancela (celular sem teclado).
      if (input.tap) {
        input.capture = null;
        this.waiting = false;
        this.say('PRECISA DE UM TECLADO', '#ffcd75');
      }
      return;
    }
    if (inside(input.tap, BACK) || input.wasPressed('quit') || (!input.tap && input.wasPressed('pause'))) {
      this.game.audio.play('select');
      this.game.changeScene(this.back());
      return;
    }
    if (inside(input.tap, TAB)) {
      this.page = this.page === 'touch' ? 'keys' : 'touch';
      this.message = null;
      this.game.audio.play('select');
      return;
    }
    if (this.page === 'touch') return;

    if (input.wasPressed('up')) this.moveRow(-1);
    if (input.wasPressed('down')) this.moveRow(1);
    if (input.wasPressed('left') || input.wasPressed('right')) {
      this.slot = 1 - this.slot;
      this.game.audio.play('select');
    }
    if (input.wasPressed('clear') && this.row < RESET_ROW) {
      this.game.input.setBindings(clearSlot(this.bindings, REMAPPABLE[this.row], this.slot));
      this.say(this.slot === 0 ? 'A PRINCIPAL NÃO PODE FICAR VAZIA' : 'ALTERNATIVA REMOVIDA');
    }
    if (input.tap) {
      const hit = this.slotAt(input.tap);
      if (hit) {
        this.row = hit.row;
        this.slot = hit.slot;
        this.activate();
        return;
      }
      if (input.tap.y >= rowY(RESET_ROW) && input.tap.y <= rowY(RESET_ROW) + 26) {
        this.row = RESET_ROW;
        this.activate();
        return;
      }
    }
    if (!input.tap && input.wasPressed('confirm')) this.activate();
  }

  moveRow(delta) {
    this.row = (this.row + delta + RESET_ROW + 1) % (RESET_ROW + 1);
    this.game.audio.play('select');
  }

  slotAt({ x, y }) {
    for (let r = 0; r < RESET_ROW; r++) {
      for (let s = 0; s < 2; s++) {
        if (x >= SLOT_X[s] && x <= SLOT_X[s] + SLOT_W && y >= rowY(r) - 2 && y <= rowY(r) + 24) return { row: r, slot: s };
      }
    }
    return null;
  }

  activate() {
    const input = this.game.input;
    this.game.audio.play('select');
    if (this.row === RESET_ROW) {
      input.setBindings(defaultBindings());
      this.say('TECLAS PADRÃO RESTAURADAS', '#a7f070');
      return;
    }
    const action = REMAPPABLE[this.row];
    this.waiting = true;
    this.say(`APERTE A NOVA TECLA (ESC CANCELA)`, '#ffcd75');
    input.capture = (code) => {
      this.waiting = false;
      if (code === 'Escape') {
        this.say('TROCA CANCELADA');
        return;
      }
      const result = assignKey(this.bindings, action, this.slot, code);
      if (!result.ok) {
        this.say(`${keyLabel(code)} É RESERVADA`, '#ff2848');
        return;
      }
      input.setBindings(result.bindings);
      if (result.movedFrom) this.say(`${keyLabel(code)} SAIU DE ${ACTION_LABELS[result.movedFrom]}`, '#ffcd75');
      else this.say(`${ACTION_LABELS[action]}: ${keyLabel(code)}`, '#a7f070');
    };
  }

  /** Cor da ação de uma tecla no teclado desenhado (null = tecla sem uso). */
  colorOfKey(code) {
    for (const action of REMAPPABLE) if (this.bindings[action].includes(code)) return ACTION_COLORS[action];
    return null;
  }

  draw(ctx) {
    drawText(ctx, 'CONTROLES', W / 2, 30, { size: 14, align: 'center', color: UI_COLORS.accent });
    this.drawButton(ctx, BACK, '< VOLTAR');
    this.drawButton(ctx, TAB, this.page === 'touch' ? 'TECLADO' : 'TOQUE');
    if (this.page === 'touch') {
      this.drawTouchPage(ctx);
      return;
    }
    drawKeyboard(ctx, KB_X, KB_Y, (code) => this.colorOfKey(code));

    REMAPPABLE.forEach((action, r) => {
      const y = rowY(r);
      const selectedRow = r === this.row;
      ctx.fillStyle = ACTION_COLORS[action];
      ctx.fillRect(28, y + 4, 14, 14);
      drawText(ctx, ACTION_LABELS[action], 52, y + 12, { size: 9, baseline: 'middle', color: selectedRow ? UI_COLORS.text : '#94b0c2' });
      for (let s = 0; s < 2; s++) {
        const selected = selectedRow && s === this.slot;
        const blink = selected && this.waiting && Math.floor(this.time * 4) % 2 === 0;
        ctx.fillStyle = selected ? 'rgba(59, 93, 201, 0.35)' : 'rgba(26, 28, 44, 0.9)';
        ctx.fillRect(SLOT_X[s], y, SLOT_W, 24);
        ctx.strokeStyle = selected ? UI_COLORS.accent : '#333c57';
        ctx.lineWidth = selected ? 2 : 1;
        ctx.strokeRect(SLOT_X[s] + 0.5, y + 0.5, SLOT_W - 1, 23);
        const label = blink ? '...' : keyLabel(this.bindings[action][s]);
        drawText(ctx, label, SLOT_X[s] + SLOT_W / 2, y + 12, { size: 9, align: 'center', baseline: 'middle' });
      }
    });

    const ry = rowY(RESET_ROW) + 4;
    const resetSel = this.row === RESET_ROW;
    ctx.fillStyle = resetSel ? 'rgba(59, 93, 201, 0.35)' : 'rgba(26, 28, 44, 0.9)';
    ctx.fillRect(W / 2 - 120, ry, 240, 26);
    ctx.strokeStyle = resetSel ? UI_COLORS.accent : '#566c86';
    ctx.lineWidth = resetSel ? 2 : 1;
    ctx.strokeRect(W / 2 - 119.5, ry + 0.5, 239, 25);
    drawText(ctx, 'RESTAURAR PADRÃO', W / 2, ry + 13, { size: 9, align: 'center', baseline: 'middle' });

    if (this.message) drawText(ctx, this.message, W / 2, H - 58, { size: 8, align: 'center', color: this.messageColor });
    drawText(ctx, 'ENTER TROCAR    ESC VOLTAR', W / 2, H - 32, { size: 8, align: 'center', color: '#566c86' });
  }

  drawButton(ctx, r, label) {
    ctx.fillStyle = 'rgba(26, 28, 44, 0.9)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = '#566c86';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    drawText(ctx, label, r.x + r.w / 2, r.y + r.h / 2, { size: 9, align: 'center', baseline: 'middle' });
  }

  /** Página de toque: três frases curtas do esquema atual. */
  drawTouchPage(ctx) {
    const scheme = this.game.input.touchScheme;
    drawText(ctx, scheme === 'modern' ? 'MODERNO' : 'CLÁSSICO', W / 2, 140, { size: 14, align: 'center', color: '#ffcd75' });
    TOUCH_LINES[scheme].forEach((line, i) => {
      drawText(ctx, line, W / 2, 220 + i * 50, { size: 11, align: 'center' });
    });
    drawText(ctx, 'PAUSA: BOTÃO NO CANTO', W / 2, 370, { size: 11, align: 'center' });
    drawText(ctx, 'TROQUE EM CONFIGURAÇÕES', W / 2, H - 60, { size: 8, align: 'center', color: '#566c86' });
  }
}
