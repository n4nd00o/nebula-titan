/**
 * TouchControls — tudo o que é específico do celular (v1.6).
 *
 *  - Dois ESQUEMAS de controle por toque (padrão: CLÁSSICO, desde a v1.6.1):
 *      moderno:  joystick FLUTUANTE (nasce onde o polegar encosta), tiro
 *                automático e botões grandes de BOMBA e DASH à direita;
 *                joystick pouco inclinado = modo foco (lento e preciso);
 *      clássico: a nave segue o dedo (esquema original), 2º dedo = dash.
 *  - AJUDA DO CELULAR: inimigos com menos vida, tiros mais lentos e hitbox
 *    menor. "Automática" liga sozinha em aparelhos de toque.
 *  - Geometria dos botões de toque (a mesma usada pelo HUD para desenhar).
 *
 * Funções puras (sem DOM), testadas em tests/touch.test.js.
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H } from '../config.js';

export const SCHEME_KEY = 'touchScheme';
export const ASSIST_KEY = 'mobileAssist';
export const SCHEMES = Object.freeze(['modern', 'classic']);
export const SCHEME_LABELS = Object.freeze({ modern: 'MODERNO', classic: 'CLÁSSICO' });
export const ASSIST_MODES = Object.freeze(['auto', 'on', 'off']);
export const ASSIST_LABELS = Object.freeze({ auto: 'AUTOMÁTICA', on: 'LIGADA', off: 'DESLIGADA' });

/** Quanto a ajuda do celular facilita. */
export const MOBILE_ASSIST = Object.freeze({
  hpScale: 0.75, // chefes e alienígenas com 25% menos vida
  bulletSpeed: 0.8, // projéteis inimigos 20% mais lentos (v1.6.1; era 10%)
  hitRadius: 3, // hitbox da nave: 3 px (no computador: 4 px)
});

/** Joystick virtual (unidades lógicas do jogo, 480x640). */
export const STICK = Object.freeze({
  radius: 54, // distância máxima do polegar até o centro
  deadzone: 0.15, // abaixo disto (fração do raio) a nave não se move
  focusBelow: 0.5, // abaixo disto o movimento é lento (modo foco)
  ghost: Object.freeze({ x: 92, y: H - 120 }), // onde o joystick "fantasma" aparece parado
});

/** Botões de toque da tela de jogo. */
export const TOUCH_BUTTONS = Object.freeze({
  pause: Object.freeze({ x: W - 74, y: 0, w: 74, h: 46 }),
  bomb: Object.freeze({ x: W - 54, y: H - 60, r: 38 }),
  dash: Object.freeze({ x: W - 54, y: H - 150, r: 32 }),
});
const TOLERANCE = 8; // toque um pouco fora do círculo ainda conta

/**
 * Qual botão de toque está em (x, y)?
 * @returns {'pause'|'bomb'|'dash'|null}
 */
export function touchZone(x, y) {
  const p = TOUCH_BUTTONS.pause;
  if (x >= p.x && y <= p.y + p.h) return 'pause';
  for (const id of ['bomb', 'dash']) {
    const b = TOUCH_BUTTONS[id];
    if (Math.hypot(x - b.x, y - b.y) <= b.r + TOLERANCE) return id;
  }
  return null;
}

/**
 * Vetor do joystick: do centro (ox, oy) até o polegar (x, y).
 * @returns {{x: number, y: number, mag: number}} direção * intensidade (0..1)
 */
export function stickVector(ox, oy, x, y) {
  const dx = x - ox;
  const dy = y - oy;
  const dist = Math.hypot(dx, dy);
  const mag = Math.min(1, dist / STICK.radius);
  if (mag < STICK.deadzone || dist === 0) return { x: 0, y: 0, mag: 0 };
  return { x: (dx / dist) * mag, y: (dy / dist) * mag, mag };
}

/** Lê as preferências salvas (com valores padrão). */
export function loadTouchSettings(storage) {
  const scheme = storage?.get(SCHEME_KEY, 'classic');
  const assist = storage?.get(ASSIST_KEY, 'auto');
  return {
    scheme: SCHEMES.includes(scheme) ? scheme : 'classic',
    assist: ASSIST_MODES.includes(assist) ? assist : 'auto',
  };
}

/** A ajuda do celular vale agora? */
export function assistActive(assist, touchDevice) {
  if (assist === 'on') return true;
  if (assist === 'off') return false;
  return Boolean(touchDevice);
}

/** O aparelho tem tela de toque como entrada principal? */
export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.matchMedia?.('(pointer: coarse)').matches) || (navigator.maxTouchPoints ?? 0) > 0 && !window.matchMedia?.('(pointer: fine)').matches;
}

/** Próximo valor de uma lista (para botões que alternam). */
export const cycle = (list, value, delta = 1) => list[(list.indexOf(value) + delta + list.length) % list.length];
