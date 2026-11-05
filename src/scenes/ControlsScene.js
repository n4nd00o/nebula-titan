/**
 * ControlsScene — tela "CONTROLES" (v1.5): troca as teclas de cada ação.
 *
 * Cada ação tem duas teclas (principal e alternativa). Selecione com as setas,
 * ENTER para trocar (a próxima tecla apertada é a nova), DEL para apagar a
 * alternativa e "RESTAURAR PADRÃO" para voltar ao original. Se a tecla já
 * era de outra ação, ela é transferida e a tela avisa. Salvo no navegador.
 *
 * Página TOQUE (v1.6, abre direto no celular): escolhe o controle MODERNO
 * (joystick flutuante + tiro automático) ou CLÁSSICO (a nave segue o dedo) e
 * liga/desliga a AJUDA DO CELULAR. A aba no canto alterna TECLADO/TOQUE.
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H, UI_COLORS } from '../config.js';
import { drawText } from '../graphics/text.js';
import {
  REMAPPABLE, ACTION_LABELS, assignKey, clearSlot, defaultBindings, keyLabel,
} from '../core/KeyBindings.js';
import {
  SCHEMES, SCHEME_LABELS, ASSIST_MODES, ASSIST_LABELS, ASSIST_KEY, loadTouchSettings, assistActive, isTouchDevice, cycle,
} from '../core/TouchControls.js';

const ROW_Y0 = 104;
const ROW_H = 38;
const SLOT_X = [214, 340];
const SLOT_W = 116;
const RESET_ROW = REMAPPABLE.length; // última "linha": botão restaurar
const BACK = Object.freeze({ x: 8, y: 8, w: 96, h: 30 });
const TAB = Object.freeze({ x: W - 126, y: 8, w: 118, h: 30 });
const SCHEME_CARDS = Object.freeze([
  { id: 'modern', x: 24, y: 100, w: 208, h: 196, lines: ['Joystick onde o polegar tocar', 'Tiro automático', 'BOMBA e DASH grandes à direita', 'Pouca inclinação = modo foco'] },
  { id: 'classic', x: 248, y: 100, w: 208, h: 196, lines: ['A nave segue o seu dedo', 'Atira enquanto encosta', '2º dedo na tela = dash', 'Esquema original do jogo'] },
]);
const ASSIST_BUTTON = Object.freeze({ x: W / 2 - 130, y: 344, w: 260, h: 44 });

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
    // No celular a tela abre na página de toque (trocar teclas precisa de teclado).
    this.page = game.input.touchMode || isTouchDevice() ? 'touch' : 'keys';
    this.touchRow = 0;
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
    if (inside(input.tap, TAB)) {
      this.page = this.page === 'touch' ? 'keys' : 'touch';
      this.message = null;
      this.game.audio.play('select');
      return;
    }
    if (this.page === 'touch') {
      this.updateTouchPage(input);
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
    drawText(ctx, 'CONTROLES', W / 2, 52, { size: 16, align: 'center', color: UI_COLORS.accent });
    this.drawButton(ctx, BACK, '< VOLTAR');
    this.drawButton(ctx, TAB, this.page === 'touch' ? 'TECLADO >' : 'TOQUE >');
    if (this.page === 'touch') {
      this.drawTouchPage(ctx);
      if (this.message) drawText(ctx, this.message, W / 2, H - 70, { size: 6, align: 'center', color: this.messageColor });
      drawText(ctx, 'Toque em um cartão para escolher', W / 2, H - 44, { size: 6, align: 'center', color: '#566c86' });
      return;
    }
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

  }

  drawButton(ctx, r, label) {
    ctx.fillStyle = 'rgba(26, 28, 44, 0.9)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = '#566c86';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    drawText(ctx, label, r.x + r.w / 2, r.y + r.h / 2, { size: 7, align: 'center', baseline: 'middle' });
  }

  // ------------------------------------------------------------ página TOQUE (v1.6)
  get touchSettings() {
    return loadTouchSettings(this.game.storage);
  }

  updateTouchPage(input) {
    if (input.wasPressed('up') || input.wasPressed('down')) {
      this.touchRow = 1 - this.touchRow;
      this.game.audio.play('select');
    }
    if (input.tap) {
      const card = SCHEME_CARDS.find((c) => inside(input.tap, c));
      if (card) {
        this.touchRow = 0;
        this.setScheme(card.id);
        return;
      }
      if (inside(input.tap, ASSIST_BUTTON)) {
        this.touchRow = 1;
        this.cycleAssist(1);
      }
      return;
    }
    const delta = input.wasPressed('left') ? -1 : input.wasPressed('right') || input.wasPressed('confirm') ? 1 : 0;
    if (!delta) return;
    if (this.touchRow === 0) this.setScheme(cycle(SCHEMES, this.game.input.touchScheme, delta));
    else this.cycleAssist(delta);
  }

  setScheme(scheme) {
    this.game.input.setTouchScheme(scheme);
    this.game.audio.play('select');
    this.say(`Controle de toque: ${SCHEME_LABELS[scheme]}`, '#a7f070');
  }

  cycleAssist(delta) {
    const next = cycle(ASSIST_MODES, this.touchSettings.assist, delta);
    this.game.storage.set(ASSIST_KEY, next);
    this.game.audio.play('select');
    this.say(`Ajuda do celular: ${ASSIST_LABELS[next]}`, '#a7f070');
  }

  drawTouchPage(ctx) {
    drawText(ctx, 'JEITO DE JOGAR NO CELULAR', W / 2, 84, { size: 8, align: 'center', color: UI_COLORS.muted });
    const scheme = this.game.input.touchScheme;
    for (const card of SCHEME_CARDS) {
      const selected = card.id === scheme;
      const focused = this.touchRow === 0 && selected;
      ctx.fillStyle = selected ? 'rgba(59, 93, 201, 0.35)' : 'rgba(26, 28, 44, 0.9)';
      ctx.fillRect(card.x, card.y, card.w, card.h);
      ctx.strokeStyle = selected ? UI_COLORS.accent : '#333c57';
      ctx.lineWidth = focused ? 3 : 2;
      ctx.strokeRect(card.x + 0.5, card.y + 0.5, card.w - 1, card.h - 1);
      const cx = card.x + card.w / 2;
      drawText(ctx, SCHEME_LABELS[card.id], cx, card.y + 14, { size: 10, align: 'center', color: selected ? UI_COLORS.text : '#94b0c2' });
      this.drawSchemeDiagram(ctx, card, selected);
      card.lines.forEach((line, i) => {
        drawText(ctx, line, cx, card.y + 128 + i * 12, { size: 5, align: 'center', color: selected ? UI_COLORS.text : UI_COLORS.muted });
      });
      if (selected) drawText(ctx, 'EM USO', cx, card.y + card.h - 16, { size: 6, align: 'center', color: '#a7f070' });
    }

    const a = ASSIST_BUTTON;
    const assist = this.touchSettings.assist;
    const on = assistActive(assist, this.game.input.touchMode || isTouchDevice());
    drawText(ctx, 'AJUDA DO CELULAR', W / 2, a.y - 22, { size: 8, align: 'center', color: UI_COLORS.muted });
    ctx.fillStyle = this.touchRow === 1 ? 'rgba(59, 93, 201, 0.35)' : 'rgba(26, 28, 44, 0.9)';
    ctx.fillRect(a.x, a.y, a.w, a.h);
    ctx.strokeStyle = this.touchRow === 1 ? UI_COLORS.accent : '#566c86';
    ctx.lineWidth = 2;
    ctx.strokeRect(a.x + 0.5, a.y + 0.5, a.w - 1, a.h - 1);
    drawText(ctx, `< ${ASSIST_LABELS[assist]} >`, W / 2, a.y + a.h / 2, { size: 10, align: 'center', baseline: 'middle', color: on ? '#38b764' : UI_COLORS.text });
    const info = [
      'Inimigos com 25% menos vida, tiros inimigos 20% mais lentos',
      'e nave com hitbox menor. AUTOMÁTICA = só em telas de toque.',
      on ? 'Agora: LIGADA neste aparelho' : 'Agora: DESLIGADA neste aparelho',
    ];
    info.forEach((line, i) => drawText(ctx, line, W / 2, a.y + a.h + 12 + i * 12, { size: 5, align: 'center', color: i === 2 ? (on ? '#38b764' : '#94b0c2') : UI_COLORS.muted }));
  }

  /** Mini desenho de cada esquema: joystick + botões, ou dedo arrastando a nave. */
  drawSchemeDiagram(ctx, card, selected) {
    const x0 = card.x + 14;
    const y0 = card.y + 34;
    const w = card.w - 28;
    const h = 80;
    ctx.fillStyle = '#05050d';
    ctx.fillRect(x0, y0, w, h);
    ctx.strokeStyle = '#333c57';
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
    const color = selected ? '#73eff7' : '#566c86';
    this.game.sprites.draw(ctx, 'player', x0 + w / 2, y0 + 30, { scale: 0.5, alpha: selected ? 1 : 0.5 });
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    if (card.id === 'modern') {
      ctx.beginPath();
      ctx.arc(x0 + 28, y0 + 56, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x0 + 36, y0 + 52, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e43b8c';
      ctx.beginPath();
      ctx.arc(x0 + w - 22, y0 + 60, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#ffcd75';
      ctx.beginPath();
      ctx.arc(x0 + w - 22, y0 + 32, 9, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Dedo abaixo da nave, com uma seta de arrasto.
      ctx.beginPath();
      ctx.arc(x0 + w / 2 + 4, y0 + 64, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x0 + w / 2 - 30, y0 + 64);
      ctx.lineTo(x0 + w / 2 - 12, y0 + 64);
      ctx.moveTo(x0 + w / 2 + 20, y0 + 64);
      ctx.lineTo(x0 + w / 2 + 38, y0 + 64);
      ctx.stroke();
    }
  }
}
