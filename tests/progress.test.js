import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Campaign, WORLDS, worldEncounters } from '../src/systems/Campaign.js';
import { buildProgress, mergeDefeated, encounterKind } from '../src/systems/Progress.js';
import { worldNodes, PLANETS } from '../src/scenes/ProgressScene.js';
import { touchZone } from '../src/core/Input.js';
import { haptic, toggleVibration, vibrationEnabled } from '../src/core/Haptics.js';
import { pauseButtonAt } from '../src/scenes/PlayScene.js';
import { GAME_WIDTH as W, GAME_HEIGHT as H } from '../src/config.js';

/** Vence fases em sequência (como o jogador faria). */
function winUntil(campaign, count) {
  for (let i = 0; i < count; i++) {
    const next = campaign.available()[0];
    campaign.recordVictory(next, {}, 0);
  }
  return campaign;
}

const memoryStorage = (initial = {}) => {
  const data = { ...initial };
  return { get: (k, f) => (k in data ? data[k] : f), set: (k, v) => { data[k] = v; }, data };
};

// ------------------------------------------------------------ Mapa de progresso
test('Progresso: sem save e sem histórico, o Mundo 1 é o atual e só o Setor 1 está liberado', () => {
  const { worlds, currentWorld } = buildProgress({ save: null, defeated: new Set() });
  assert.equal(currentWorld, 0);
  assert.equal(worlds[0].status, 'current');
  assert.deepEqual(worlds[0].encounters.filter((e) => e.status === 'available').map((e) => e.id), ['stage1']);
  assert.ok(worlds.slice(1).every((w) => w.status === 'locked'));
});

test('Progresso: campanha no meio do Mundo 2 marca vencidas, disponíveis e bloqueadas', () => {
  const c = winUntil(new Campaign(), worldEncounters(WORLDS[0]).length + 2); // Mundo 1 + 2 setores
  const p = buildProgress({ save: c, defeated: mergeDefeated({ save: c }) });
  assert.equal(p.currentWorld, 1);
  assert.equal(p.worlds[0].status, 'done');
  assert.equal(p.worlds[0].doneCount, p.worlds[0].total);
  const w2 = p.worlds[1].encounters;
  assert.deepEqual(w2.filter((e) => e.status === 'done').map((e) => e.id), ['stage3', 'stage4']);
  assert.deepEqual(w2.filter((e) => e.status === 'available').map((e) => e.id), ['prism', 'vortex', 'scarab']);
  assert.equal(w2.find((e) => e.id === 'hydra').status, 'locked');
  assert.equal(p.worlds[2].status, 'locked');
});

test('Progresso: histórico sobrevive ao fim da campanha (save apagado)', () => {
  const all = WORLDS.flatMap(worldEncounters);
  const p = buildProgress({ save: null, defeated: mergeDefeated({ history: all }) });
  assert.equal(p.currentWorld, -1); // nenhuma campanha em andamento
  assert.ok(p.worlds.every((w) => w.status === 'done' && w.complete));
});

test('Progresso: saves antigos (só worldsUnlocked) contam os mundos anteriores como vencidos', () => {
  const done = mergeDefeated({ unlocked: 3 });
  for (const id of [...worldEncounters(WORLDS[0]), ...worldEncounters(WORLDS[1])]) assert.ok(done.has(id), id);
  assert.ok(!done.has('stage5'));
});

test('Progresso: nova campanha com histórico antigo — fase vencida antes volta a ser "disponível"', () => {
  const history = worldEncounters(WORLDS[0]);
  const fresh = new Campaign();
  const p = buildProgress({ save: fresh, defeated: mergeDefeated({ history, save: fresh }) });
  assert.equal(p.worlds[0].encounters.find((e) => e.id === 'stage1').status, 'available');
  assert.equal(p.worlds[0].encounters.find((e) => e.id === 'titan').status, 'done'); // pode treinar
});

test('Progresso: ids desconhecidos no histórico são ignorados', () => {
  const done = mergeDefeated({ history: ['naoExiste', 'stage1'] });
  assert.deepEqual([...done], ['stage1']);
});

test('Progresso: tipos das fases internas', () => {
  const w4 = WORLDS[3];
  assert.equal(encounterKind(w4, 'stage7'), 'stage');
  assert.equal(encounterKind(w4, 'oracle'), 'mini');
  assert.equal(encounterKind(w4, 'archon'), 'boss');
  assert.equal(encounterKind(w4, 'leviathan'), 'finale');
});

test('Mapa: cada mundo tem um nó por fase, dentro da tela e sem sobreposição', () => {
  WORLDS.forEach((world) => {
    const { nodes, links } = worldNodes(world);
    assert.deepEqual(nodes.map((n) => n.id), worldEncounters(world));
    for (const n of nodes) {
      assert.ok(n.x - n.r >= 0 && n.x + n.r <= W && n.y - n.r >= 100 && n.y + n.r <= H - 80, `${n.id} fora da área`);
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        assert.ok(d > nodes[i].r + nodes[j].r + 8, `${nodes[i].id} encosta em ${nodes[j].id}`);
      }
    }
    for (const [a, b] of links) assert.ok(nodes[a] && nodes[b]);
  });
  assert.equal(PLANETS.length, WORLDS.length);
});

// ------------------------------------------------------------ Celular
test('Toque: zonas de pausa, bomba e dash nos cantos; o resto da tela move a nave', () => {
  assert.equal(touchZone(W - 20, 20), 'pause');
  assert.equal(touchZone(W - 30, H - 30), 'bomb');
  assert.equal(touchZone(W - 30, H - 96), 'dash');
  assert.equal(touchZone(W / 2, H - 30), null);
  assert.equal(touchZone(30, H - 96), null);
  assert.equal(touchZone(W / 2, H / 2), null);
});

// v1.5: a pausa ganhou o botão MEUS BUFFS entre CONTINUAR e MENU.
test('Pausa: botões CONTINUAR, MEUS BUFFS e MENU respondem ao toque', () => {
  assert.equal(pauseButtonAt({ x: W / 2, y: 238 }), 'resume');
  assert.equal(pauseButtonAt({ x: W / 2, y: 282 }), 'buffs');
  assert.equal(pauseButtonAt({ x: W / 2, y: 326 }), 'menu');
  assert.equal(pauseButtonAt({ x: 10, y: 10 }), null);
});

test('Vibração: respeita o ajuste e funciona sem suporte do navegador', () => {
  const storage = memoryStorage();
  const calls = [];
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { value: { vibrate: (p) => { calls.push(p); return true; } }, configurable: true });
  try {
    assert.equal(vibrationEnabled(storage), true);
    haptic(storage, 50);
    assert.deepEqual(calls, [50]);
    assert.equal(toggleVibration(storage), false);
    haptic(storage, 80);
    assert.deepEqual(calls, [50]); // desligada: não vibra
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
    assert.equal(haptic(memoryStorage(), 50), false); // sem suporte: não quebra
  } finally {
    if (original) Object.defineProperty(globalThis, 'navigator', original);
    else delete globalThis.navigator;
  }
});
