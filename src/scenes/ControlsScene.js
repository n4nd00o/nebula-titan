/**
 * ControlsScene — tela "CONTROLES" (v1.5): troca as teclas de cada ação.
 *
 * Cada ação tem duas teclas (principal e alternativa). Selecione com as setas,
 * ENTER para trocar (a próxima tecla apertada é a nova), DEL para apagar a
 * alternativa e "RESTAURAR PADRÃO" para voltar ao original. Se a tecla já
 * era de outra ação, ela é transferida e a tela avisa. Salvo no navegador.
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H, UI_COLORS } from '../config.js';
import { drawText } from '../graphics/text.js';
import {
  REMAPPABLE, ACTION_LABELS, assignKey, clearSlot, defaultBindings, keyLabel,
} from '../core/KeyBindings.js';

const ROW_Y0 = 104;
const ROW_H = 38;
const SLOT_X = [214, 340];
const SLOT_W = 116;
const RESET_ROW = REMAPPABLE.length; // última "linha": botão restaurar
const BACK = Object.freeze({ x: 8, y: 8, w: 96, h: 30 });

const inside = (p, r) => p && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
const rowY = (i) => ROW_Y0 + i * ROW_H;

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
  }

  enter() {}

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
        this.say('Troca cancelada. Trocar teclas precisa de um teclado.', '#ffcd75');
      }
      return;
    }

    if (inside(input.tap, BACK) || input.wasPressed('quit') || (!input.tap && input.wasPressed('pause'))) {
      this.game.audio.play('select');
      this.game.changeScene(this.back());
      return;
    }
    if (input.wasPressed('up')) this.moveRow(-1);
    if (input.wasPressed('down')) this.moveRow(1);
    if (input.wasPressed('left') || input.wasPressed('right')) {
      this.slot = 1 - this.slot;
      this.game.audio.play('select');
    }
    if (input.wasPressed('clear') && this.row < RESET_ROW) {
      this.game.input.setBindings(clearSlot(this.bindings, REMAPPABLE[this.row], this.slot));
      this.say(this.slot === 0 ? 'A tecla principal não pode ficar vazia.' : 'Tecla alternativa removida.');
    }
    if (input.tap) {
      const hit = this.slotAt(input.tap);
      if (hit) {
        this.row = hit.row;
        this.slot = hit.slot;
        this.activate();
        return;
      }
      if (input.tap.y >= rowY(RESET_ROW) && input.tap.y <= rowY(RESET_ROW) + 30) {
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
        if (x >= SLOT_X[s] && x <= SLOT_X[s] + SLOT_W && y >= rowY(r) && y <= rowY(r) + 30) return { row: r, slot: s };
      }
    }
    return null;
  }

  activate() {
    const input = this.game.input;
    this.game.audio.play('select');
    if (this.row === RESET_ROW) {
      input.setBindings(defaultBindings());
      this.say('Teclas restauradas para o padrão.', '#a7f070');
      return;
    }
    const action = REMAPPABLE[this.row];
    this.waiting = true;
    this.say(`Aperte a nova tecla para ${ACTION_LABELS[action]} (ESC cancela)`, '#ffcd75');
    input.capture = (code) => {
      this.waiting = false;
      if (code === 'Escape') {
        this.say('Troca cancelada.');
        return;
      }
      const result = assignKey(this.bindings, action, this.slot, code);
      if (!result.ok) {
        this.say(`${keyLabel(code)} é reservada pelo jogo. Escolha outra.`, '#ff2848');
        return;
      }
      input.setBindings(result.bindings);
      if (result.movedFrom) this.say(`${keyLabel(code)} saiu de ${ACTION_LABELS[result.movedFrom]} e agora é ${ACTION_LABELS[action]}.`, '#ffcd75');
      else this.say(`${ACTION_LABELS[action]}: ${keyLabel(code)}`, '#a7f070');
    };
  }

  draw(ctx) {
    drawText(ctx, 'CONTROLES', W / 2, 44, { size: 16, align: 'center', color: UI_COLORS.accent });
    drawText(ctx, 'PRINCIPAL', SLOT_X[0] + SLOT_W / 2, 84, { size: 6, align: 'center', color: UI_COLORS.muted });
    drawText(ctx, 'ALTERNATIVA', SLOT_X[1] + SLOT_W / 2, 84, { size: 6, align: 'center', color: UI_COLORS.muted });

    REMAPPABLE.forEach((action, r) => {
      const y = rowY(r);
      const selectedRow = r === this.row;
      drawText(ctx, ACTION_LABELS[action], 30, y + 15, { size: 8, baseline: 'middle', color: selectedRow ? UI_COLORS.text : '#94b0c2' });
      for (let s = 0; s < 2; s++) {
        const selected = selectedRow && s === this.slot;
        const blink = selected && this.waiting && Math.floor(this.time * 4) % 2 === 0;
        ctx.fillStyle = selected ? 'rgba(59, 93, 201, 0.35)' : 'rgba(26, 28, 44, 0.9)';
        ctx.fillRect(SLOT_X[s], y, SLOT_W, 30);
        ctx.strokeStyle = selected ? UI_COLORS.accent : '#333c57';
        ctx.lineWidth = selected ? 2 : 1;
        ctx.strokeRect(SLOT_X[s] + 0.5, y + 0.5, SLOT_W - 1, 29);
        const label = blink ? '...' : keyLabel(this.bindings[action][s]);
        drawText(ctx, label, SLOT_X[s] + SLOT_W / 2, y + 15, { size: 8, align: 'center', baseline: 'middle' });
      }
    });

    // Botão restaurar padrão
    const ry = rowY(RESET_ROW);
    const resetSel = this.row === RESET_ROW;
    ctx.fillStyle = resetSel ? 'rgba(59, 93, 201, 0.35)' : 'rgba(26, 28, 44, 0.9)';
    ctx.fillRect(W / 2 - 120, ry, 240, 30);
    ctx.strokeStyle = resetSel ? UI_COLORS.accent : '#566c86';
    ctx.lineWidth = resetSel ? 2 : 1;
    ctx.strokeRect(W / 2 - 119.5, ry + 0.5, 239, 29);
    drawText(ctx, 'RESTAURAR PADRÃO', W / 2, ry + 15, { size: 8, align: 'center', baseline: 'middle' });

    if (this.message) drawText(ctx, this.message, W / 2, H - 70, { size: 6, align: 'center', color: this.messageColor });
    drawText(ctx, 'ENTER trocar   DEL apagar alternativa   ESC voltar', W / 2, H - 44, { size: 6, align: 'center', color: '#566c86' });
    drawText(ctx, 'Fixas: ENTER confirmar, ESC pausa, I buffs, M som, F tela cheia, Q sair', W / 2, H - 28, { size: 5, align: 'center', color: '#566c86' });

    ctx.fillStyle = 'rgba(26, 28, 44, 0.9)';
    ctx.fillRect(BACK.x, BACK.y, BACK.w, BACK.h);
    ctx.strokeStyle = '#566c86';
    ctx.lineWidth = 2;
    ctx.strokeRect(BACK.x + 0.5, BACK.y + 0.5, BACK.w - 1, BACK.h - 1);
    drawText(ctx, '< VOLTAR', BACK.x + BACK.w / 2, BACK.y + BACK.h / 2, { size: 7, align: 'center', baseline: 'middle' });
  }
}
