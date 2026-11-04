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
  KeyV: 'vibration',
  KeyF: 'fullscreen',
  Tab: 'map',
  // Atalhos de depuração (só funcionam com ?debug na URL)
  KeyT: 'debugKill',
  KeyB: 'debugBuffs',
  KeyG: 'debugGod',
  KeyH: 'debugHitbox',
});

/**
 * Zonas de toque da tela de jogo (coordenadas lógicas 480x640).
 * Os botões são desenhados pelo HUD nos mesmos lugares.
 *  - canto superior direito: PAUSA (MENU nas telas de fim)
 *  - canto inferior direito: BOMBA, e logo acima dela: DASH
 * @returns {'pause'|'bomb'|'dash'|null}
 */
export function touchZone(x, y) {
  if (x > GAME_WIDTH - 72 && y < 44) return 'pause';
  if (x > GAME_WIDTH - 64 && y > GAME_HEIGHT - 64) return 'bomb';
  if (x > GAME_WIDTH - 64 && y > GAME_HEIGHT - 124 && y <= GAME_HEIGHT - 64) return 'dash';
  return null;
}

export class Input {
  constructor(target, canvas = null) {
    this.down = new Set();
    this.pressed = new Set();
    this.pointer = { active: false, x: 0, y: 0, id: null };
    this.tap = null; // posição do último toque/clique neste passo (para menus)
    this.touchMode = false; // true após o primeiro toque: mostra os botões na tela
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
      if (e.pointerType !== 'mouse') this.touchMode = true;
      // Botões de toque: pausa, bomba e dash (desenhados pelo HUD).
      const zone = touchZone(pos.x, pos.y);
      if (zone) {
        this.pressed.add(zone);
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
    // Sem menu de contexto / seleção ao segurar o dedo na tela.
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
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
