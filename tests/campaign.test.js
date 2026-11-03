import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Campaign, STAGE_IDS, MINI_BOSS_IDS, REWARDS, BUFFS, PERFECT_RUN_BONUS,
} from '../src/systems/Campaign.js';
import { PLAYER } from '../src/config.js';

const STATS = { time: 60, shots: 100, hits: 50, damageTaken: 1 };

/** Avança uma campanha até depois dos setores obrigatórios. */
function afterStages() {
  const c = new Campaign();
  c.recordVictory('stage1', STATS, 100);
  c.recordVictory('stage2', STATS, 200);
  return c;
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

test('progressão completa: setores -> mini-chefes (+bomba) -> Titã -> Leviatã', () => {
  const c = afterStages();
  c.recordVictory('hive', STATS, 1);
  c.recordVictory('sentinel', STATS, 2);
  assert.deepEqual(c.recordVictory('reaper', STATS, 3), ['dash', 'bomb']);
  assert.deepEqual(c.available(), ['titan']);
  assert.equal(c.leviathanUnlocked, false);
  c.recordVictory('titan', STATS, 4);
  assert.ok(c.leviathanUnlocked);
  assert.deepEqual(c.available(), ['leviathan']);
  c.recordVictory('leviathan', STATS, 5);
  assert.ok(c.complete);
  assert.deepEqual(c.available(), []);
  assert.deepEqual(c.order, [...STAGE_IDS, 'hive', 'sentinel', 'reaper', 'titan', 'leviathan']);
  assert.equal(c.stats.time, 60 * 7);
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
  assert.throws(() => d.recordVictory('leviathan', STATS, 1));
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

test('todos os buffs de recompensa existem e têm descrição', () => {
  for (const buff of Object.values(REWARDS)) assert.ok(BUFFS[buff]?.description);
  assert.ok(BUFFS.bomb.description);
});
