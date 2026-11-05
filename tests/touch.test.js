/**
 * Controles de celular (v1.6): joystick flutuante, botões grandes,
 * esquemas MODERNO/CLÁSSICO e AJUDA DO CELULAR.
 * Tudo roda sem navegador: o Input recebe os toques pelos métodos
 * touchStart/touchMove/touchEnd (os mesmos chamados pelos eventos do DOM).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Input } from '../src/core/Input.js';
import { Player } from '../src/entities/Player.js';
import { PlayScene } from '../src/scenes/PlayScene.js';
import { Minion } from '../src/entities/Minion.js';
import {
  touchZone, stickVector, assistActive, loadTouchSettings, cycle,
  STICK, TOUCH_BUTTONS, MOBILE_ASSIST, SCHEMES, ASSIST_MODES, SCHEME_KEY, ASSIST_KEY,
} from '../src/core/TouchControls.js';
import { GAME_WIDTH as W, GAME_HEIGHT as H, PLAYER } from '../src/config.js';
import { defaultBindings } from '../src/core/KeyBindings.js';
import { createFakeWorld } from './helpers.js';

const memoryStorage = (initial = {}) => {
  const data = { ...initial };
  return { data, get: (k, f) => (k in data ? data[k] : f), set: (k, v) => { data[k] = v; } };
};
const newInput = (storage = memoryStorage()) => new Input({ addEventListener() {} }, null, storage);
const modernStorage = () => memoryStorage({ [SCHEME_KEY]: 'modern' });

// ------------------------------------------------------------ geometria
test('botões de toque: grandes (bomba >= 38 px de raio), sem se sobrepor e dentro da tela', () => {
  const { bomb, dash, pause } = TOUCH_BUTTONS;
  assert.ok(bomb.r >= 38 && dash.r >= 30);
  assert.ok(Math.hypot(bomb.x - dash.x, bomb.y - dash.y) > bomb.r + dash.r, 'bomba e dash se sobrepõem');
  for (const b of [bomb, dash]) assert.ok(b.x + b.r <= W && b.y + b.r <= H && b.x - b.r >= 0);
  assert.ok(pause.w >= 44 && pause.h >= 44, 'pausa pequena demais para o dedo');
});

test('touchZone: centro e borda de cada botão; meio da tela e canto esquerdo ficam livres', () => {
  const { bomb, dash } = TOUCH_BUTTONS;
  assert.equal(touchZone(bomb.x, bomb.y), 'bomb');
  assert.equal(touchZone(bomb.x - bomb.r - 4, bomb.y), 'bomb'); // tolerância
  assert.equal(touchZone(dash.x, dash.y), 'dash');
  assert.equal(touchZone(W - 10, 10), 'pause');
  assert.equal(touchZone(W / 2, H / 2), null);
  assert.equal(touchZone(STICK.ghost.x, STICK.ghost.y), null, 'o joystick fantasma não pode cair num botão');
});

// ------------------------------------------------------------ joystick
test('stickVector: zona morta, limite no raio e direção correta', () => {
  assert.deepEqual(stickVector(100, 100, 102, 100), { x: 0, y: 0, mag: 0 });
  const full = stickVector(100, 100, 100 + STICK.radius * 3, 100);
  assert.equal(full.mag, 1);
  assert.ok(Math.abs(full.x - 1) < 1e-9 && Math.abs(full.y) < 1e-9);
  const half = stickVector(100, 100, 100, 100 - STICK.radius / 2);
  assert.ok(Math.abs(half.mag - 0.5) < 1e-9 && half.y < 0);
});

test('Input MODERNO: o 1º dedo livre vira joystick onde encostou; 2º dedo não dá dash; botões funcionam', () => {
  const input = newInput(modernStorage());
  assert.equal(input.touchScheme, 'modern');
  assert.equal(input.touchStart({ x: 120, y: 500 }, { id: 1 }), true);
  assert.equal(input.stick.active, true);
  assert.equal(input.stick.ox, 120);
  input.touchMove(1, { x: 120 + STICK.radius, y: 500 });
  assert.equal(input.stick.vec.mag, 1);
  input.endStep();
  assert.equal(input.touchStart({ x: 300, y: 300 }, { id: 2 }), false);
  assert.ok(!input.wasPressed('dash'));
  input.touchStart({ x: TOUCH_BUTTONS.bomb.x, y: TOUCH_BUTTONS.bomb.y }, { id: 3 });
  assert.ok(input.wasPressed('bomb'));
  input.touchEnd(1);
  assert.equal(input.stick.active, false);
  assert.equal(input.stick.vec.mag, 0);
});

test('Input CLÁSSICO (padrão desde a v1.6.1): a nave segue o dedo e o 2º dedo dá dash', () => {
  const input = newInput();
  assert.equal(input.touchScheme, 'classic');
  input.touchStart({ x: 200, y: 400 }, { id: 1 });
  assert.equal(input.pointer.active, true);
  assert.equal(input.stick.active, false);
  input.touchStart({ x: 300, y: 300 }, { id: 2 });
  assert.ok(input.wasPressed('dash'));
});

test('setTouchScheme salva a escolha e solta os dedos acompanhados', () => {
  const storage = modernStorage();
  const input = newInput(storage);
  input.touchStart({ x: 120, y: 500 }, { id: 1 });
  input.setTouchScheme('classic');
  assert.equal(storage.data[SCHEME_KEY], 'classic');
  assert.equal(input.stick.active, false);
});

test('clique de mouse nunca cria joystick (computador continua igual)', () => {
  const input = newInput();
  assert.equal(input.touchStart({ x: 120, y: 500 }, { touch: false, id: 1 }), false);
  assert.equal(input.stick.active, false);
  assert.ok(input.wasPressed('confirm'));
});

// ------------------------------------------------------------ nave
function playerScene(stickVec, scheme = 'modern') {
  let shots = 0;
  const input = {
    touchMode: true, touchScheme: scheme, isDown: () => false, wasPressed: () => false,
    pointer: { active: false }, stick: { active: Boolean(stickVec), vec: stickVec ?? { x: 0, y: 0, mag: 0 } },
  };
  return { input, firePlayerShot() { shots++; }, get shots() { return shots; } };
}

test('nave MODERNA: joystick inclinado move rápido; pouco inclinado = modo foco', () => {
  const fast = new Player();
  const x0 = fast.x;
  fast.update(0.5, playerScene({ x: 1, y: 0, mag: 1 }));
  assert.ok(Math.abs(fast.x - x0 - PLAYER.speed * 0.5) < 1e-6);
  assert.equal(fast.focused, false);

  const slow = new Player();
  slow.update(0.5, playerScene({ x: 0.3, y: 0, mag: 0.3 }));
  assert.ok(Math.abs(slow.x - x0 - PLAYER.focusSpeed * 0.5) < 1e-6);
  assert.equal(slow.focused, true);
});

test('nave MODERNA atira sozinha mesmo sem tocar na tela; CLÁSSICA só com o dedo encostado', () => {
  const modern = playerScene(null);
  new Player().update(0.1, modern);
  assert.equal(modern.shots, 1);
  const classic = playerScene(null, 'classic');
  new Player().update(0.1, classic);
  assert.equal(classic.shots, 0);
});

// ------------------------------------------------------------ ajuda do celular
test('preferências: padrão CLÁSSICO + ajuda AUTOMÁTICA (ligada no celular); inválidos voltam ao padrão', () => {
  assert.deepEqual(loadTouchSettings(memoryStorage()), { scheme: 'classic', assist: 'auto' });
  assert.deepEqual(loadTouchSettings(memoryStorage({ [SCHEME_KEY]: 'x', [ASSIST_KEY]: 7 })), { scheme: 'classic', assist: 'auto' });
  assert.equal(assistActive(loadTouchSettings(memoryStorage()).assist, true), true);
  assert.equal(cycle(SCHEMES, 'modern'), 'classic');
  assert.equal(cycle(ASSIST_MODES, 'auto', -1), 'off');
});

test('assistActive: automática segue o aparelho; ligada/desligada forçam', () => {
  assert.equal(assistActive('auto', true), true);
  assert.equal(assistActive('auto', false), false);
  assert.equal(assistActive('on', false), true);
  assert.equal(assistActive('off', true), false);
});

function fakeGame(assist, touchMode = false) {
  const rec = createFakeWorld();
  return {
    input: { bindings: defaultBindings(), isDown: () => false, wasPressed: () => false, pointer: { active: false }, stick: { active: false }, tap: null, touchMode, touchScheme: 'modern' },
    audio: rec.audio,
    sprites: rec.sprites,
    starfield: rec.starfield,
    storage: memoryStorage({ [ASSIST_KEY]: assist }),
    changeScene() {},
    resumeScene() {},
  };
}

test('ajuda LIGADA: chefe com 25% menos vida, tiros 20% mais lentos e hitbox de 3 px', () => {
  assert.equal(MOBILE_ASSIST.bulletSpeed, 0.8);
  const normal = new PlayScene(fakeGame('off'), { bossId: 'titan' });
  const easy = new PlayScene(fakeGame('on'), { bossId: 'titan' });
  assert.equal(normal.assist, false);
  assert.equal(easy.assist, true);
  for (const [id, part] of Object.entries(normal.boss.parts)) {
    if (!part.damageable) continue;
    assert.equal(easy.boss.parts[id].maxHp, Math.round(part.maxHp * MOBILE_ASSIST.hpScale), id);
  }
  assert.ok(Math.abs(easy.bulletSpeed - normal.bulletSpeed * MOBILE_ASSIST.bulletSpeed) < 1e-9);
  assert.equal(easy.player.hitRadius, MOBILE_ASSIST.hitRadius);
  assert.equal(normal.player.hitRadius, PLAYER.hitRadius);
});

test('ajuda AUTOMÁTICA: liga em tela de toque; alienígenas perdem vida mas nunca ficam com 0', () => {
  const scene = new PlayScene(fakeGame('auto', true), { bossId: 'stage1' });
  assert.equal(scene.assist, true);
  const tough = scene.enlist(Object.assign(new Minion(100, 0, 1, { type: 'orange' }), { hp: 8 }));
  assert.equal(tough.hp, 6);
  const weak = scene.enlist(Object.assign(new Minion(100, 0, 1), { hp: 1 }));
  assert.equal(weak.hp, 1);
  assert.equal(new PlayScene(fakeGame('auto', false), { bossId: 'stage1' }).assist, false);
});
