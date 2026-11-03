import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Campaign, WORLDS, STAGE_IDS, MINI_BOSS_IDS, REWARDS, BUFFS, PERFECT_RUN_BONUS,
  worldEncounters, worldIndexOf, ALL_MINI_BOSS_IDS,
} from '../src/systems/Campaign.js';
import { ENCOUNTERS } from '../src/encounters.js';
import { PLAYER } from '../src/config.js';

const STATS = { time: 60, shots: 100, hits: 50, damageTaken: 1 };

/** Avança uma campanha até depois dos setores obrigatórios do Mundo 1. */
function afterStages() {
  const c = new Campaign();
  c.recordVictory('stage1', STATS, 100);
  c.recordVictory('stage2', STATS, 200);
  return c;
}

/** Vence todos os encontros de um mundo, na ordem. */
function clearWorld(c, index) {
  for (const id of worldEncounters(WORLDS[index])) c.recordVictory(id, STATS, c.score + 1000);
}

test('a campanha começa obrigatoriamente pelo Setor 1, depois o Setor 2', () => {
  const c = new Campaign();
  assert.deepEqual(c.available(), ['stage1']);
  assert.ok(c.nextIsStage);
  assert.equal(c.canFight('sentinel'), false, 'mini-chefes bloqueados antes dos setores');
  assert.deepEqual(c.recordVictory('stage1', STATS, 100), [], 'setores não dão buff');
  assert.deepEqual(c.available(), ['stage2']);
  c.recordVictory('stage2', STATS, 200);
  assert.deepEqual(c.available().sort(), [...MINI_BOSS_IDS].sort());
  assert.equal(c.nextIsStage, false);
});

test('cada mini-chefe concede o seu buff, em qualquer ordem', () => {
  const c = afterStages();
  assert.deepEqual(c.recordVictory('reaper', STATS, 1000), ['dash']);
  assert.deepEqual(c.recordVictory('sentinel', STATS, 2000), ['piercing']);
  assert.ok(c.hasBuff('dash') && c.hasBuff('piercing') && !c.hasBuff('wingman'));
  assert.equal(c.score, 2000);
});

test('Mundo 1: setores -> mini-chefes (+bomba) -> Titã -> abre o Mundo 2', () => {
  const c = afterStages();
  c.recordVictory('hive', STATS, 1);
  c.recordVictory('sentinel', STATS, 2);
  assert.deepEqual(c.recordVictory('reaper', STATS, 3), ['dash', 'bomb']);
  assert.deepEqual(c.available(), ['titan']);
  assert.equal(c.worldIndex, 0);
  c.recordVictory('titan', STATS, 4);
  assert.ok(c.isWorldComplete(0));
  assert.equal(c.worldIndex, 1, 'o Titã abre o Mundo 2');
  assert.deepEqual(c.available(), ['stage3']);
  assert.ok(c.nextIsStage);
});

test('são 4 mundos, cada um com 2 setores, 3 mini-chefes e 1 chefe; o Leviatã fecha o último', () => {
  assert.equal(WORLDS.length, 4);
  for (const w of WORLDS) {
    assert.equal(w.stages.length, 2, `${w.name}: setores`);
    assert.equal(w.minis.length, 3, `${w.name}: mini-chefes`);
    for (const id of worldEncounters(w)) assert.ok(ENCOUNTERS[id], `${id} não existe`);
    assert.ok(BUFFS[w.completionReward], `${w.name}: bônus de mundo`);
  }
  assert.equal(WORLDS[3].finale, 'leviathan');
  assert.ok(WORLDS.slice(0, 3).every((w) => !w.finale));
  const all = WORLDS.flatMap(worldEncounters);
  assert.equal(new Set(all).size, all.length, 'um encontro aparece em dois mundos');
});

test('campanha completa: 4 mundos em sequência até o Leviatã', () => {
  const c = new Campaign();
  for (let i = 0; i < WORLDS.length; i++) {
    assert.equal(c.worldIndex, i);
    clearWorld(c, i);
  }
  assert.ok(c.complete);
  assert.deepEqual(c.available(), []);
  assert.equal(c.order.at(-1), 'leviathan');
  assert.equal(c.order.at(-2), 'archon', 'o Arconte vem antes do Leviatã');
  // 12 buffs de mini-chefes + 4 bônus de mundo.
  assert.equal(c.buffs.size, 16);
  assert.ok(Object.keys(BUFFS).every((id) => c.hasBuff(id)));
});

test('o Leviatã só libera depois do Arconte (chefe do Mundo 4)', () => {
  const c = Campaign.startingAt(3);
  for (const id of ['stage7', 'stage8', 'specter', 'oracle', 'echo']) c.recordVictory(id, STATS, 1);
  assert.deepEqual(c.available(), ['archon']);
  assert.equal(c.finaleUnlocked, false);
  assert.throws(() => c.recordVictory('leviathan', STATS, 1));
  c.recordVictory('archon', STATS, 1);
  assert.ok(c.finaleUnlocked && c.leviathanUnlocked);
  assert.deepEqual(c.available(), ['leviathan']);
});

test('cada mundo dá um bônus ao vencer seus 3 mini-chefes', () => {
  const c = Campaign.startingAt(1);
  for (const id of ['stage3', 'stage4', 'prism', 'vortex']) c.recordVictory(id, STATS, 1);
  assert.deepEqual(c.recordVictory('scarab', STATS, 1), ['carapace', 'bombPlus']);
});

test('não permite repetir fases nem pular etapas', () => {
  const c = new Campaign();
  assert.throws(() => c.recordVictory('stage2', STATS, 1), 'Setor 2 antes do Setor 1');
  c.recordVictory('stage1', STATS, 1);
  assert.throws(() => c.recordVictory('stage1', STATS, 1));
  const d = afterStages();
  d.recordVictory('hive', STATS, 1);
  assert.throws(() => d.recordVictory('hive', STATS, 1));
  assert.throws(() => d.recordVictory('titan', STATS, 1));
  assert.throws(() => d.recordVictory('prism', STATS, 1), 'mini-chefe de outro mundo');
  assert.throws(() => d.recordVictory('leviathan', STATS, 1));
});

test('seleção de mundo: começa no mundo escolhido com os buffs dos anteriores', () => {
  const c = Campaign.startingAt(2);
  assert.equal(c.worldIndex, 2);
  assert.deepEqual(c.available(), ['stage5']);
  for (const id of [...WORLDS[0].minis, ...WORLDS[1].minis]) assert.ok(c.hasBuff(REWARDS[id]));
  assert.ok(c.hasBuff('bomb') && c.hasBuff('bombPlus'));
  assert.ok(!c.hasBuff('overdrive'), 'buffs do próprio mundo ainda não');
  assert.equal(c.startWorld, 2);
  assert.equal(c.score, 0);
});

test('a dificuldade cresce a cada mundo', () => {
  const c = new Campaign();
  const rates = WORLDS.map((w) => c.difficultyFor(w.stages[0]));
  for (let i = 1; i < rates.length; i++) {
    assert.ok(rates[i].attackRate > rates[i - 1].attackRate, `ataques do mundo ${i + 1}`);
    assert.ok(rates[i].bulletSpeed > rates[i - 1].bulletSpeed, `projéteis do mundo ${i + 1}`);
  }
  assert.equal(c.difficultyFor('titan').hpScale, 1.8);
  assert.ok(c.difficultyFor('leviathan').hpScale > 1.8, 'o Leviatã enfrenta um jogador com 16 buffs');
  assert.equal(c.difficultyFor('prism').hpScale, 1);
});

test('salvar e carregar preserva o progresso', () => {
  const c = Campaign.startingAt(1);
  c.recordVictory('stage3', STATS, 5000, 4);
  c.recordDeath();
  c.shown.add('boss1');
  const loaded = Campaign.fromJSON(JSON.parse(JSON.stringify(c.toJSON())));
  assert.ok(loaded);
  assert.deepEqual([...loaded.defeated].sort(), [...c.defeated].sort());
  assert.deepEqual([...loaded.buffs].sort(), [...c.buffs].sort());
  assert.equal(loaded.score, 5000);
  assert.equal(loaded.lives, 4);
  assert.equal(loaded.deaths, 1);
  assert.equal(loaded.worldIndex, 1);
  assert.deepEqual(loaded.available(), ['stage4']);
  assert.ok(loaded.shown.has('boss1'));
});

test('saves inválidos ou de versão antiga são ignorados', () => {
  assert.equal(Campaign.fromJSON(null), null);
  assert.equal(Campaign.fromJSON({ defeated: ['stage1'] }), null, 'sem versão');
  assert.equal(Campaign.fromJSON({ version: 1, defeated: [] }), null);
  const c = new Campaign();
  for (let i = 0; i < WORLDS.length; i++) clearWorld(c, i);
  assert.equal(Campaign.fromJSON(c.toJSON()), null, 'campanha já concluída não é retomada');
});

test('vidas acumulam entre as fases, com máximo de 5', () => {
  const c = new Campaign();
  assert.equal(c.lives, PLAYER.lives);
  c.recordVictory('stage1', STATS, 1, 4);
  assert.equal(c.lives, 4);
  c.recordVictory('stage2', STATS, 1, 9);
  assert.equal(c.lives, PLAYER.maxLives);
});

test('continue: volta com 3 vidas, zera a pontuação e mantém os buffs', () => {
  const c = afterStages();
  c.recordVictory('hive', STATS, 5000, 5);
  c.nextLifeAt = 150000;
  c.recordContinue();
  assert.equal(c.score, 0);
  assert.equal(c.lives, PLAYER.lives);
  assert.equal(c.nextLifeAt, PLAYER.extraLifeEvery);
  assert.equal(c.continues, 1);
  assert.ok(c.hasBuff('wingman'));
});

test('corrida perfeita depende de não morrer nenhuma vez', () => {
  const c = new Campaign();
  assert.ok(c.perfect);
  c.recordDeath();
  assert.equal(c.perfect, false);
  assert.ok(PERFECT_RUN_BONUS > 0);
});

test('todos os mini-chefes dão um buff diferente, e todos os buffs têm descrição', () => {
  assert.equal(ALL_MINI_BOSS_IDS.length, 12);
  const rewards = ALL_MINI_BOSS_IDS.map((id) => REWARDS[id]);
  assert.equal(new Set(rewards).size, 12, 'dois mini-chefes dão o mesmo buff');
  for (const id of rewards) assert.ok(BUFFS[id]?.description, `buff ${id}`);
  for (const w of WORLDS) assert.ok(!rewards.includes(w.completionReward), 'bônus de mundo repetido');
  assert.equal(worldIndexOf('hydra'), 1);
  assert.equal(worldIndexOf('leviathan'), 3);
  assert.deepEqual(STAGE_IDS, ['stage1', 'stage2']);
});
