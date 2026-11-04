/**
 * Teclas configuráveis (v1.5): a tela CONTROLES troca a tecla de qualquer ação.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  REMAPPABLE, DEFAULT_BINDINGS, RESERVED, defaultBindings, loadBindings, assignKey, clearSlot,
  buildKeyMap, keyLabel, controlsHelp,
} from '../src/core/KeyBindings.js';
import { Input } from '../src/core/Input.js';

const usedKeys = (b) => REMAPPABLE.flatMap((a) => b[a]);

test('todas as ações do jogo podem ser remapeadas (mover, atirar, foco, dash, bomba, pausa)', () => {
  assert.deepEqual([...REMAPPABLE].sort(), ['bomb', 'dash', 'down', 'fire', 'focus', 'left', 'pause', 'right', 'up']);
  const b = defaultBindings();
  for (const a of REMAPPABLE) assert.ok(b[a].length >= 1 && b[a].length <= 2, a);
  assert.equal(new Set(usedKeys(b)).size, usedKeys(b).length, 'padrão sem teclas repetidas');
});

test('trocar uma tecla: a ação passa a responder à nova tecla e o mapa usado pelo Input muda', () => {
  const r = assignKey(defaultBindings(), 'dash', 0, 'KeyE');
  assert.ok(r.ok);
  assert.deepEqual(r.bindings.dash, ['KeyE', 'KeyL']);
  const map = buildKeyMap(r.bindings);
  assert.equal(map.KeyE, 'dash');
  assert.equal(map.KeyC, undefined, 'a tecla antiga deixa de fazer dash');
  assert.equal(map.Enter, 'confirm', 'teclas fixas continuam no mapa');
});

test('conflito: a tecla sai da outra ação, que nunca fica sem tecla', () => {
  const r = assignKey(defaultBindings(), 'bomb', 0, 'KeyC'); // C era do dash
  assert.ok(r.ok);
  assert.equal(r.movedFrom, 'dash');
  assert.deepEqual(r.bindings.bomb, ['KeyC', 'KeyK']);
  assert.deepEqual(r.bindings.dash, ['KeyL']);
  // Ação com UMA tecla só perde a sua tecla: recebe a antiga da outra ação.
  let b = clearSlot(defaultBindings(), 'dash', 1); // dash = [C]
  const r2 = assignKey(b, 'bomb', 0, 'KeyC');
  assert.deepEqual(r2.bindings.dash, ['KeyX'], 'dash herda o X que era da bomba');
  b = r2.bindings;
  assert.equal(new Set(usedKeys(b)).size, usedKeys(b).length, 'nenhuma tecla em duas ações');
});

test('teclas reservadas (ENTER, ESC, TAB, M, Q, I, F, V...) não podem ser atribuídas', () => {
  for (const code of ['Enter', 'Escape', 'Tab', 'KeyM', 'KeyQ', 'KeyI', 'KeyF', 'KeyV', 'Backspace']) {
    assert.ok(RESERVED.has(code));
    assert.equal(assignKey(defaultBindings(), 'fire', 0, code).ok, false, code);
  }
});

test('apagar: só a tecla alternativa pode ser removida', () => {
  const b = clearSlot(defaultBindings(), 'fire', 1);
  assert.deepEqual(b.fire, ['Space']);
  assert.deepEqual(clearSlot(b, 'fire', 0).fire, ['Space'], 'a principal não fica vazia');
});

test('carregar: dados salvos inválidos ou repetidos voltam ao padrão', () => {
  assert.deepEqual(loadBindings(null), defaultBindings());
  assert.deepEqual(loadBindings('lixo'), defaultBindings());
  const b = loadBindings({ fire: ['KeyE'], dash: ['KeyE', 'KeyR'], bomb: ['Enter'], up: 42 });
  assert.deepEqual(b.fire, ['KeyE']);
  assert.deepEqual(b.dash, ['KeyR'], 'E já era do tiro');
  assert.deepEqual(b.bomb, DEFAULT_BINDINGS.bomb, 'tecla reservada é descartada');
  assert.deepEqual(b.up, DEFAULT_BINDINGS.up);
  assert.equal(new Set(usedKeys(b)).size, usedKeys(b).length);
});

test('Input lê as teclas salvas, responde à nova tecla e salva ao trocar', () => {
  const listeners = {};
  const target = { addEventListener: (type, fn) => { listeners[type] = fn; } };
  const saved = {};
  const storage = { get: (k, f) => (k in saved ? saved[k] : f), set: (k, v) => { saved[k] = v; } };
  saved.keyBindings = { ...defaultBindings(), fire: ['KeyE', 'Space'] };
  const input = new Input(target, null, storage);
  const key = (code) => listeners.keydown({ code, repeat: false, preventDefault() {} });
  key('KeyE');
  assert.ok(input.wasPressed('fire'));
  input.endStep();
  key('KeyZ');
  assert.equal(input.wasPressed('fire'), false, 'Z deixou de atirar');
  // Captura (tela de controles): a próxima tecla não vira ação.
  let captured = null;
  input.capture = (code) => { captured = code; };
  key('KeyR');
  assert.equal(captured, 'KeyR');
  assert.equal(input.capture, null);
  input.setBindings(assignKey(input.bindings, 'bomb', 0, 'KeyR').bindings);
  assert.deepEqual(saved.keyBindings.bomb[0], 'KeyR', 'salvo no navegador');
  input.endStep();
  key('KeyR');
  assert.ok(input.wasPressed('bomb'));
  // ESC sempre pausa, mesmo que a PAUSA seja remapeada.
  input.setBindings(assignKey(input.bindings, 'pause', 1, 'KeyO').bindings);
  input.endStep();
  key('Escape');
  assert.ok(input.wasPressed('pause'));
});

test('textos de ajuda mostram as teclas atuais', () => {
  assert.equal(keyLabel('KeyX'), 'X');
  assert.equal(keyLabel('ArrowLeft'), 'ESQ');
  assert.equal(keyLabel('Space'), 'ESPAÇO');
  assert.equal(keyLabel('Digit7'), '7');
  const lines = controlsHelp(defaultBindings());
  assert.match(lines[0], /^SETAS\/WASD mover/);
  const custom = assignKey(defaultBindings(), 'dash', 0, 'KeyE').bindings;
  assert.match(controlsHelp(custom)[1], /^E dash/);
});
