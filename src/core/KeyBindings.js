/**
 * KeyBindings — teclas configuráveis (lógica pura, testável no Node).
 *
 * Cada AÇÃO remapeável tem até 2 teclas (slot 0 = principal, slot 1 = alternativa).
 * As teclas ficam salvas no navegador (`keyBindings`) e podem voltar ao padrão.
 *
 * Algumas teclas são FIXAS (não podem ser usadas em ações remapeáveis):
 * Enter/Esc/Tab, além dos atalhos de sistema (som, vibração, tela cheia, buffs, sair).
 */
export const STORAGE_KEY = 'keyBindings';

/** Ações remapeáveis, na ordem em que aparecem na tela de controles. */
export const REMAPPABLE = Object.freeze(['up', 'down', 'left', 'right', 'fire', 'focus', 'dash', 'bomb', 'pause']);

export const ACTION_LABELS = Object.freeze({
  up: 'CIMA', down: 'BAIXO', left: 'ESQUERDA', right: 'DIREITA',
  fire: 'ATIRAR', focus: 'MODO FOCO', dash: 'DASH', bomb: 'BOMBA', pause: 'PAUSA',
});

export const DEFAULT_BINDINGS = Object.freeze({
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  fire: ['Space', 'KeyZ'],
  focus: ['ShiftLeft', 'ShiftRight'],
  dash: ['KeyC', 'KeyL'],
  bomb: ['KeyX', 'KeyK'],
  pause: ['KeyP', 'Escape'],
});

/** Teclas fixas do jogo (não remapeáveis). */
export const FIXED_BINDINGS = Object.freeze({
  Enter: 'confirm',
  NumpadEnter: 'confirm',
  KeyQ: 'quit',
  KeyM: 'mute',
  KeyV: 'vibration',
  KeyF: 'fullscreen',
  KeyI: 'buffs',
  Tab: 'map',
  Escape: 'pause', // ESC sempre pausa/volta, mesmo se a PAUSA for remapeada
  Backspace: 'clear', // tela de controles: apaga a tecla alternativa
  Delete: 'clear',
  // Atalhos de depuração (só funcionam com ?debug na URL)
  KeyT: 'debugKill',
  KeyB: 'debugBuffs',
  KeyG: 'debugGod',
  KeyH: 'debugHitbox',
});

/** Teclas que nunca podem ser atribuídas (usadas pelos menus ou por atalhos fixos). */
export const RESERVED = Object.freeze(new Set([
  'Enter', 'NumpadEnter', 'Escape', 'Tab', 'Backspace', 'Delete',
  'KeyQ', 'KeyM', 'KeyV', 'KeyF', 'KeyI',
]));

/** Cópia profunda dos padrões. */
export const defaultBindings = () => Object.fromEntries(REMAPPABLE.map((a) => [a, [...DEFAULT_BINDINGS[a]]]));

/**
 * Lê teclas salvas, validando (dados corrompidos ou antigos voltam ao padrão).
 * Escape continua permitido na PAUSA por ser o padrão dela.
 */
export function loadBindings(raw) {
  const result = defaultBindings();
  if (!raw || typeof raw !== 'object') return result;
  const used = new Set();
  for (const action of REMAPPABLE) {
    const keys = Array.isArray(raw[action]) ? raw[action] : null;
    if (!keys) continue;
    const valid = keys
      .filter((k) => typeof k === 'string' && k.length > 0 && k.length < 32)
      .filter((k) => !RESERVED.has(k) || (action === 'pause' && k === 'Escape'))
      .filter((k) => !used.has(k))
      .slice(0, 2);
    if (valid.length) {
      result[action] = valid;
      valid.forEach((k) => used.add(k));
    }
  }
  // Se duas ações acabaram com a mesma tecla padrão, remove a duplicata.
  const seen = new Set();
  for (const action of REMAPPABLE) {
    result[action] = result[action].filter((k) => (seen.has(k) ? false : (seen.add(k), true)));
    if (result[action].length === 0) result[action] = [...DEFAULT_BINDINGS[action]].filter((k) => !seen.has(k)).slice(0, 1);
    result[action].forEach((k) => seen.add(k));
  }
  return result;
}

/**
 * Atribui `code` ao `slot` da `action`.
 * Se a tecla já era de outra ação, ela sai de lá (a outra ação nunca fica sem tecla:
 * se era a única, recebe a tecla que esta ação tinha no slot).
 * @returns {{ok: boolean, bindings?: object, movedFrom?: string|null, reason?: string}}
 */
export function assignKey(bindings, action, slot, code) {
  if (!REMAPPABLE.includes(action)) return { ok: false, reason: 'ação inválida' };
  if (RESERVED.has(code)) return { ok: false, reason: 'tecla reservada' };
  const next = Object.fromEntries(REMAPPABLE.map((a) => [a, [...(bindings[a] ?? [])]]));
  const previous = next[action][slot] ?? null;
  let movedFrom = null;
  for (const other of REMAPPABLE) {
    const i = next[other].indexOf(code);
    if (i < 0 || (other === action && i === slot)) continue;
    if (other === action) {
      next[other].splice(i, 1); // a mesma tecla no outro slot da mesma ação
      continue;
    }
    movedFrom = other;
    next[other].splice(i, 1);
    if (next[other].length === 0 && previous) next[other].push(previous);
  }
  const keys = next[action];
  if (slot >= keys.length) keys.push(code);
  else keys[slot] = code;
  next[action] = keys.slice(0, 2);
  return { ok: true, bindings: next, movedFrom };
}

/** Remove a tecla alternativa (a principal nunca fica vazia). */
export function clearSlot(bindings, action, slot) {
  const next = Object.fromEntries(REMAPPABLE.map((a) => [a, [...bindings[a]]]));
  if (slot === 0 || next[action].length < 2) return next;
  next[action].splice(slot, 1);
  return next;
}

/** Mapa tecla -> ação usado pelo Input (remapeáveis têm prioridade sobre as fixas). */
export function buildKeyMap(bindings) {
  const map = { ...FIXED_BINDINGS };
  for (const action of REMAPPABLE) for (const code of bindings[action] ?? []) map[code] = action;
  return map;
}

const NAMED = {
  ArrowUp: 'CIMA', ArrowDown: 'BAIXO', ArrowLeft: 'ESQ', ArrowRight: 'DIR',
  Space: 'ESPAÇO', ShiftLeft: 'SHIFT', ShiftRight: 'SHIFT D', ControlLeft: 'CTRL', ControlRight: 'CTRL D',
  AltLeft: 'ALT', AltRight: 'ALT GR', Escape: 'ESC', Enter: 'ENTER', Tab: 'TAB', CapsLock: 'CAPS',
  Backquote: "'", Minus: '-', Equal: '=', BracketLeft: '´', BracketRight: '[', Backslash: ']',
  Semicolon: 'Ç', Quote: '~', Comma: ',', Period: '.', Slash: ';', IntlBackslash: '\\', IntlRo: '/',
};

/** Nome curto e legível de uma tecla ("KeyX" -> "X", "ArrowLeft" -> "ESQ"). */
export function keyLabel(code) {
  if (!code) return '-';
  if (NAMED[code]) return NAMED[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return `NUM ${code.slice(6).toUpperCase()}`;
  return code.toUpperCase().slice(0, 8);
}

/** "C/L" — as teclas de uma ação, para textos de ajuda. */
export const keysOf = (bindings, action) => (bindings[action] ?? []).map(keyLabel).join('/');

/** Linhas de ajuda de controles para o título e a pausa. */
export function controlsHelp(bindings) {
  const k = (a) => keysOf(bindings, a);
  const dirs = ['up', 'left', 'down', 'right'];
  const set = (slot) => (dirs.every((d) => bindings[d][slot]) ? dirs.map((d) => keyLabel(bindings[d][slot])).join('') : null);
  const main = set(0) === 'CIMAESQBAIXODIR' ? 'SETAS' : set(0);
  const move = [main, set(1)].filter(Boolean).join('/');
  return [
    `${move} mover   ${k('fire')} atirar   ${keyLabel(bindings.focus[0])} foco`,
    `${keyLabel(bindings.dash[0])} dash   ${keyLabel(bindings.bomb[0])} bomba   ${keyLabel(bindings.pause[0])} pausa   I buffs   M som`,
  ];
}
