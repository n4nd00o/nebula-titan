import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WaveStage } from '../src/stages/WaveStage.js';
import { STAGES } from '../src/stages/stageData.js';
import { ALIEN_TYPES } from '../src/entities/alienTypes.js';
import { FormationEnemy } from '../src/entities/FormationEnemy.js';
import { createFakeWorld } from './helpers.js';

/** Mundo falso que guarda os inimigos e os atualiza, como a PlayScene faz. */
function stageWorld() {
  const enemies = [];
  const world = createFakeWorld({
    enemies,
    addEnemy(e) {
      enemies.push(e);
    },
  });
  return { world, enemies };
}

function step(stage, world, enemies, seconds) {
  const dt = 1 / 60;
  for (let i = 0; i < Math.round(seconds / dt); i++) {
    stage.update(dt);
    for (const e of enemies) if (!e.dead) e.update(dt, world);
  }
}

for (const [id, def] of Object.entries(STAGES)) {
  test(`${def.name}: ondas cabem na formação (8 vagas em cima, 24 embaixo)`, () => {
    for (const wave of def.waves) {
      const count = (tier) => wave.groups.filter((g) => ALIEN_TYPES[g.type].tier === tier).reduce((n, g) => n + g.count, 0);
      assert.ok(count('top') <= 8, `${wave.title}: inimigos demais na fileira de cima`);
      assert.ok(count('bottom') <= 24, `${wave.title}: inimigos demais nas fileiras de baixo`);
      for (const g of wave.groups) assert.ok(ALIEN_TYPES[g.type], `${wave.title}: tipo ${g.type} não existe`);
    }
  });

  test(`${def.name}: inimigos entram, formam e o setor termina quando todos caem`, () => {
    const { world, enemies } = stageWorld();
    const stage = new WaveStage(world, def);
    for (let w = 0; w < def.waves.length; w++) {
      step(stage, world, enemies, 2);
      assert.equal(stage.state, 'fight', `onda ${w + 1} deveria estar em combate`);
      assert.equal(stage.phaseIndex, w);
      step(stage, world, enemies, 8);
      const wave = enemies.filter((e) => !e.dead);
      assert.ok(wave.some((e) => e.inFormation || e.state === 'diving'), 'ninguém chegou à formação');
      for (const e of wave) e.damage(99);
      step(stage, world, enemies, 0.1);
      if (w < def.waves.length - 1) assert.equal(stage.state, 'transition');
    }
    assert.equal(stage.state, 'dying');
    step(stage, world, enemies, 1.2);
    assert.equal(stage.state, 'dead');
    assert.ok(world.calls.some((c) => c.name === 'onBossDefeated'), `${id} não sinalizou vitória`);
  });
}

test('formação: tipos "top" na fileira de cima, os demais abaixo, vagas únicas', () => {
  for (const id of ['stage2', 'stage6', 'stage8']) {
    const { world, enemies } = stageWorld();
    const stage = new WaveStage(world, STAGES[id]);
    for (let w = 0; w < stage.phaseCount; w++) {
      step(stage, world, enemies, 1.6);
      const wave = enemies.filter((e) => !e.dead);
      const slots = wave.map((e) => `${e.slot.col},${e.slot.row}`);
      assert.equal(new Set(slots).size, slots.length, `${id}: duas naves na mesma vaga`);
      for (const e of wave) assert.equal(e.slot.row === 0, e.info.tier === 'top');
      for (const e of wave) e.damage(99);
      step(stage, world, enemies, 2);
    }
  }
});

test('cada mundo apresenta um alienígena novo nos seus setores', () => {
  const types = (ids) => new Set(ids.flatMap((id) => STAGES[id].waves.flatMap((w) => w.groups.map((g) => g.type))));
  assert.ok(types(['stage3', 'stage4']).has('blue'));
  assert.ok(types(['stage5', 'stage6']).has('purple'));
  assert.ok(types(['stage7', 'stage8']).has('red'));
  assert.ok(!types(['stage1', 'stage2']).has('blue'), 'Mundo 1 só tem verdes e laranjas');
});

test('mundos mais avançados têm setores mais agressivos', () => {
  const minDive = (id) => Math.min(...STAGES[id].waves.map((w) => w.diveEvery));
  assert.ok(minDive('stage8') < minDive('stage4') && minDive('stage4') < minDive('stage2'));
});

test('kamikaze vermelho mergulha mais rápido que o verde e não atira', () => {
  const dive = (type) => {
    const world = createFakeWorld();
    const formation = { time: 0, slotPos: () => ({ x: 240, y: 100 }) };
    const e = new FormationEnemy({ type, slot: { col: 0, row: 1 }, path: 'swoop', dir: 1, delay: 0, formation });
    e.state = 'formation';
    e.x = 240;
    e.y = 100;
    e.startDive();
    let maxSpeed = 0;
    for (let i = 0; i < 60; i++) {
      e.update(1 / 60, world);
      maxSpeed = Math.max(maxSpeed, Math.hypot(e.vx, e.vy));
    }
    return { shots: world.bullets.length, maxSpeed };
  };
  const red = dive('red');
  const green = dive('green');
  assert.equal(red.shots, 0, 'o kamikaze atirou');
  assert.ok(green.shots > 0, 'o verde deveria atirar');
  assert.ok(red.maxSpeed > green.maxSpeed * 1.3);
});

test('alienígenas mergulham e atiram; abater em mergulho vale mais', () => {
  const { world, enemies } = stageWorld();
  const stage = new WaveStage(world, STAGES.stage1);
  step(stage, world, enemies, 14);
  assert.ok(world.bullets.length > 0, 'nenhum tiro disparado');
  const green = ALIEN_TYPES.green;
  assert.ok(green.divePoints > green.points);
});

test('laranja é mais resistente que verde', () => {
  assert.ok(ALIEN_TYPES.orange.hp > ALIEN_TYPES.green.hp);
  assert.ok(ALIEN_TYPES.orange.shot.count > ALIEN_TYPES.green.shot.count);
});
