/**
 * Input — camada de abstração de entrada.
 *
 * O jogo nunca pergunta "a tecla ArrowLeft está pressionada?", e sim
 * "a AÇÃO 'left' está ativa?". Isso desacopla a lógica do hardware e
 * permite remapear teclas ou adicionar controles (toque, gamepad) sem
 * mexer no código do jogo. As teclas vêm de KeyBindings.js (configuráveis).
 *
 *  - isDown(action):     ação mantida pressionada
 *  - wasPressed(action): ação pressionada NESTE passo de simulação
 *
 * Toque (v1.6): botões grandes de PAUSA, BOMBA e DASH (TouchControls.js).
 * Fora deles, no esquema MODERNO o primeiro dedo cria um joystick flutuante
 * (this.stick); no CLÁSSICO a nave segue o dedo (this.pointer).
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { buildKeyMap, defaultBindings, loadBindings, STORAGE_KEY } from './KeyBindings.js';
import { touchZone, stickVector, loadTouchSettings, isTouchDevice, SCHEME_KEY } from './TouchControls.js';

export { touchZone };

/** Mapa padrão tecla -> ação (as teclas podem ser trocadas em CONTROLES). */
export const KEY_BINDINGS = Object.freeze(buildKeyMap(defaultBindings()));

export class Input {
  /**
   * @param {EventTarget} target onde escutar o teclado (window)
   * @param {HTMLCanvasElement|null} canvas para toque/clique
   * @param {{get: Function, set: Function}|null} storage teclas salvas pelo jogador
   */
  constructor(target, canvas = null, storage = null) {
    this.storage = storage;
    this.setBindings(loadBindings(storage?.get(STORAGE_KEY, null)), false);
    this.capture = null; // função que recebe a PRÓXIMA tecla (tela de controles)
    this.down = new Set();
    this.pressed = new Set();
    this.pointer = { active: false, x: 0, y: 0, id: null }; // CLÁSSICO: dedo que move a nave
    this.stick = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0, vec: { x: 0, y: 0, mag: 0 } }; // MODERNO
    this.touchScheme = loadTouchSettings(storage).scheme;
    this.tap = null; // posição do último toque/clique neste passo (para menus)
    // true em aparelhos de toque (ou após o primeiro toque): mostra os botões na tela
    this.touchMode = isTouchDevice();
    this.canvas = canvas;

    target.addEventListener('keydown', (e) => {
      // Digitando em um campo de texto (caixa de busca): as teclas não viram ações.
      if (e.target?.tagName === 'INPUT') return;
      if (this.capture) {
        // Tela de controles esperando uma tecla: ela não vira ação.
        e.preventDefault();
        const cb = this.capture;
        this.capture = null;
        cb(e.code);
        return;
      }
      const action = this.keyMap[e.code];
      if (!action) return;
      e.preventDefault(); // evita rolar a página com setas/espaço
      if (!e.repeat && !this.down.has(action)) this.pressed.add(action);
      this.down.add(action);
    });
    target.addEventListener('keyup', (e) => {
      const action = this.keyMap[e.code];
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
      const touch = e.pointerType !== 'mouse';
      const captured = this.touchStart(toGame(e), { touch, id: e.pointerId });
      if (captured) canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => this.touchMove(e.pointerId, toGame(e)));
    const release = (e) => this.touchEnd(e.pointerId);
    canvas.addEventListener('pointerup', release);
    // Sem menu de contexto / seleção ao segurar o dedo na tela.
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('pointercancel', release);
  }

  /** Esquema moderno (joystick) ativo? Só vale para toque. */
  get modernTouch() {
    return this.touchScheme === 'modern';
  }

  /** Troca o esquema de toque ('modern' | 'classic') e salva. */
  setTouchScheme(scheme, save = true) {
    this.touchScheme = scheme;
    this.touchEnd(this.stick.id);
    this.touchEnd(this.pointer.id);
    if (save) this.storage?.set(SCHEME_KEY, scheme);
  }

  /**
   * Dedo/clique encostou na tela (coordenadas lógicas).
   * @returns {boolean} true se este dedo passou a ser acompanhado (joystick ou nave)
   */
  touchStart(pos, { touch = true, id = 0 } = {}) {
    this.tap = pos;
    if (touch) this.touchMode = true;
    // Botões de toque: pausa, bomba e dash (desenhados pelo HUD).
    const zone = touchZone(pos.x, pos.y);
    if (zone) {
      this.pressed.add(zone);
      return false;
    }
    if (touch && this.modernTouch) {
      // MODERNO: o primeiro dedo livre vira o joystick, centrado onde encostou.
      if (this.stick.active) return false;
      this.pressed.add('confirm');
      Object.assign(this.stick, { active: true, id, ox: pos.x, oy: pos.y, x: pos.x, y: pos.y, vec: { x: 0, y: 0, mag: 0 } });
      return true;
    }
    // CLÁSSICO: segundo dedo enquanto o primeiro move a nave = dash.
    if (this.pointer.active && touch) {
      this.pressed.add('dash');
      return false;
    }
    this.pressed.add('confirm');
    if (!touch) return false;
    Object.assign(this.pointer, { active: true, id, x: pos.x, y: pos.y });
    return true;
  }

  touchMove(id, pos) {
    if (this.stick.active && id === this.stick.id) {
      this.stick.x = pos.x;
      this.stick.y = pos.y;
      this.stick.vec = stickVector(this.stick.ox, this.stick.oy, pos.x, pos.y);
    } else if (this.pointer.active && id === this.pointer.id) {
      this.pointer.x = pos.x;
      this.pointer.y = pos.y;
    }
  }

  touchEnd(id) {
    if (id == null) return;
    if (id === this.stick.id) Object.assign(this.stick, { active: false, id: null, vec: { x: 0, y: 0, mag: 0 } });
    if (id === this.pointer.id) Object.assign(this.pointer, { active: false, id: null });
  }

  /** Troca as teclas (e salva, se pedido). */
  setBindings(bindings, save = true) {
    this.bindings = bindings;
    this.keyMap = buildKeyMap(bindings);
    this.down?.clear();
    if (save) this.storage?.set(STORAGE_KEY, bindings);
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
