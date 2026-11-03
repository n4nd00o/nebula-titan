/**
 * Input — camada de abstração de entrada.
 *
 * O jogo nunca pergunta "a tecla ArrowLeft está pressionada?", e sim
 * "a AÇÃO 'left' está ativa?". Isso desacopla a lógica do hardware e
 * permite remapear teclas ou adicionar controles (toque, gamepad) sem
 * mexer no código do jogo.
 *
 *  - isDown(action):     ação mantida pressionada
 *  - wasPressed(action): ação pressionada NESTE passo de simulação
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export const KEY_BINDINGS = Object.freeze({
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  Space: 'fire',
  KeyJ: 'fire',
  KeyZ: 'fire',
  ShiftLeft: 'focus',
  ShiftRight: 'focus',
  KeyC: 'dash',
  KeyL: 'dash',
  KeyX: 'bomb',
  KeyK: 'bomb',
  Enter: 'confirm',
  NumpadEnter: 'confirm',
  KeyP: 'pause',
  Escape: 'pause',
  KeyQ: 'quit',
  KeyM: 'mute',
  // Atalhos de depuração (só funcionam com ?debug na URL)
  KeyT: 'debugKill',
  KeyB: 'debugBuffs',
  KeyG: 'debugGod',
  KeyH: 'debugHitbox',
});

export class Input {
  constructor(target, canvas = null) {
    this.down = new Set();
    this.pressed = new Set();
    this.pointer = { active: false, x: 0, y: 0, id: null };
    this.tap = null; // posição do último toque/clique neste passo (para menus)
    this.canvas = canvas;

    target.addEventListener('keydown', (e) => {
      const action = KEY_BINDINGS[e.code];
      if (!action) return;
      e.preventDefault(); // evita rolar a página com setas/espaço
      if (!e.repeat && !this.down.has(action)) this.pressed.add(action);
      this.down.add(action);
    });
    target.addEventListener('keyup', (e) => {
      const action = KEY_BINDINGS[e.code];
      if (action) this.down.delete(action);
    });
    target.addEventListener('blur', () => this.down.clear());

    if (canvas) this.bindPointer(canvas);
  }

  bindPointer(canvas) {
    const toGame = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * GAME_WIDTH,
        y: ((e.clientY - rect.top) / rect.height) * GAME_HEIGHT,
      };
    };

    canvas.addEventListener('pointerdown', (e) => {
      const pos = toGame(e);
      this.tap = pos;
      // Canto superior direito = botão de pausa no celular.
      if (pos.x > GAME_WIDTH - 48 && pos.y < 48) {
        this.pressed.add('pause');
        return;
      }
      // Canto inferior direito = botão de bomba.
      if (pos.x > GAME_WIDTH - 64 && pos.y > GAME_HEIGHT - 64) {
        this.pressed.add('bomb');
        return;
      }
      // Segundo dedo enquanto o primeiro move a nave = dash.
      if (this.pointer.active && e.pointerType !== 'mouse') {
        this.pressed.add('dash');
        return;
      }
      this.pressed.add('confirm');
      if (e.pointerType !== 'mouse') {
        this.pointer.active = true;
        this.pointer.id = e.pointerId;
        this.pointer.x = pos.x;
        this.pointer.y = pos.y;
        canvas.setPointerCapture?.(e.pointerId);
      }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.pointer.active || e.pointerId !== this.pointer.id) return;
      const pos = toGame(e);
      this.pointer.x = pos.x;
      this.pointer.y = pos.y;
    });
    const release = (e) => {
      if (e.pointerId === this.pointer.id) {
        this.pointer.active = false;
        this.pointer.id = null;
      }
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
  }

  isDown(action) {
    return this.down.has(action);
  }

  wasPressed(action) {
    return this.pressed.has(action);
  }

  /** Chamado pelo Game ao fim de cada passo de simulação. */
  endStep() {
    this.pressed.clear();
    this.tap = null;
  }
}
