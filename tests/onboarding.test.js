/**
 * Primeiras vezes do jogador (v1.8, feedback de jogadores): menu enxuto,
 * treino de voo, dicas de habilidade, teclado desenhado, volume e teclas padrão.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasPlayed, markPlayed, titleOptionIds, createTutorial, tutorialEvent, currentStep,
  TUTORIAL_MOVE_GOAL, TUTORIAL_TARGETS, ABILITY_TIPS, nextAbilityTip, seenTips, markTipSeen, PLAYED_KEY,
} from '../src/systems/Onboarding.js';
import { keyboardLayout, KEYBOARD_SIZE } from '../src/graphics/keyboard.js';
import { defaultBindings, REMAPPABLE } from '../src/core/KeyBindings.js';
import { AudioEngine, VOLUME_STEPS } from '../src/core/AudioEngine.js';
import { GAME_WIDTH } from '../src/config.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { get: (k, f) => (data.has(k) ? data.get(k) : f), set: (k, v) => data.set(k, v), data };
}

test('menu: na primeira vez só INICIAR, CONTROLES e CONFIGURAÇÕES', () => {
  assert.deepEqual(titleOptionIds({ played: false }), ['new', 'controls', 'settings']);
  const later = titleOptionIds({ played: true, hasSave: true, unlocked: 3 });
  assert.deepEqual(later, ['continue', 'new', 'world', 'map', 'buffs', 'duel', 'controls', 'settings']);
  assert.ok(!titleOptionIds({ played: true }).includes('world'), 'MUNDO só com mais de um mundo liberado');
  assert.ok(!later.includes('story'), 'sem botão de história no menu (ela aparece ao jogar)');
});

test('menu: "já jogou" vem do aviso salvo, do save, do mundo liberado ou do recorde', () => {
  const s = memoryStorage();
  assert.equal(hasPlayed(s), false);
  assert.equal(hasPlayed(s, { hasSave: true }), true);
  assert.equal(hasPlayed(s, { unlocked: 2 }), true);
  assert.equal(hasPlayed(memoryStorage({ hiscore: 1200 })), true);
  markPlayed(s);
  assert.equal(s.data.get(PLAYED_KEY), true);
  assert.equal(hasPlayed(s), true);
});

test('treino de voo: mover, destruir os alvos e pausar, nessa ordem', () => {
  let t = createTutorial();
  assert.equal(currentStep(t).id, 'move');
  t = tutorialEvent(t, { type: 'targetDown' }); // fora de ordem: não conta
  assert.equal(t.hits, 0);
  t = tutorialEvent(t, { type: 'moved', distance: TUTORIAL_MOVE_GOAL - 1 });
  assert.equal(currentStep(t).id, 'move');
  const before = t;
  t = tutorialEvent(t, { type: 'moved', distance: 1 });
  assert.equal(before.index, 0, 'o estado antigo não muda (imutável)');
  assert.equal(currentStep(t).id, 'shoot');
  for (let i = 0; i < TUTORIAL_TARGETS; i++) t = tutorialEvent(t, { type: 'targetDown' });
  assert.equal(currentStep(t).id, 'pause');
  t = tutorialEvent(t, { type: 'paused' });
  assert.equal(t.done, true);
});

test('treino de voo no celular: sem o passo de pausar (lá a pausa é um botão)', () => {
  const t = createTutorial({ touch: true });
  assert.deepEqual(t.steps, ['move', 'shoot']);
});

test('dicas: cada habilidade de ativação aparece uma vez, quando o jogador a tem', () => {
  const s = memoryStorage();
  assert.equal(nextAbilityTip(new Set(), seenTips(s)), null);
  const buffs = new Set(['piercing', 'dash', 'bomb']);
  assert.equal(nextAbilityTip(buffs, seenTips(s)).id, 'dash');
  markTipSeen(s, 'dash');
  markTipSeen(s, 'dash');
  assert.deepEqual(seenTips(s), ['dash'], 'sem repetir');
  assert.equal(nextAbilityTip(buffs, seenTips(s)).id, 'bomb');
  markTipSeen(s, 'bomb');
  assert.equal(nextAbilityTip(buffs, seenTips(s)), null);
  for (const tip of ABILITY_TIPS) assert.ok(REMAPPABLE.includes(tip.action), `${tip.id}: a tecla é configurável`);
  assert.deepEqual(seenTips(memoryStorage({ abilityTipsSeen: 'lixo' })), [], 'valor salvo inválido vira lista vazia');
});

test('teclas padrão (feedback): SHIFT faz dash e o foco foi para o C', () => {
  const b = defaultBindings();
  assert.deepEqual(b.dash, ['ShiftLeft', 'ShiftRight']);
  assert.equal(b.focus[0], 'KeyC');
  assert.equal(b.bomb[0], 'KeyX');
});

test('teclado desenhado: cabe na tela, sem teclas sobrepostas e com todas as teclas padrão', () => {
  assert.ok(KEYBOARD_SIZE.w <= GAME_WIDTH - 20, `largura ${KEYBOARD_SIZE.w}`);
  const keys = keyboardLayout(10, 0);
  for (const k of keys) assert.ok(k.x >= 10 && k.x + k.w <= 10 + KEYBOARD_SIZE.w && k.y + k.h <= KEYBOARD_SIZE.h, k.code);
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i];
      const c = keys[j];
      const overlap = a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h;
      assert.ok(!overlap, `${a.code} sobrepõe ${c.code}`);
    }
  }
  const codes = new Set(keys.map((k) => k.code));
  for (const action of REMAPPABLE) for (const code of defaultBindings()[action]) assert.ok(codes.has(code), `${code} (${action}) não está no desenho`);
});

test('volume: música e efeitos de 0 a 10, salvos e limitados', () => {
  const s = memoryStorage({ musicVolume: 3 });
  const audio = new AudioEngine(s);
  assert.equal(audio.volume.music, 3);
  assert.equal(audio.volume.sfx, VOLUME_STEPS, 'padrão = volume original');
  assert.equal(audio.setVolume('sfx', 42), VOLUME_STEPS);
  assert.equal(audio.setVolume('music', -5), 0);
  assert.equal(s.data.get('musicVolume'), 0);
  assert.equal(audio.busGain('music'), 0);
  assert.equal(new AudioEngine(memoryStorage({ sfxVolume: 'x' })).volume.sfx, VOLUME_STEPS, 'valor inválido volta ao padrão');
});
