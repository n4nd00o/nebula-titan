import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Boss } from '../src/boss/Boss.js';
import { BOSSES } from '../src/boss/bosses/index.js';
import { createFakeWorld, tick, tickUntilFight } from './helpers.js';

/** Cria um chefe já em combate. */
function fight(id) {
  const world = createFakeWorld();
  const boss = new Boss(world, BOSSES[id]);
  tickUntilFight(boss);
  return { boss, world };
}

const transition = (boss) => tick(boss, boss.timing.transition + 0.1);

// Testes genéricos: valem para TODOS os chefes registrados (inclusive futuros).
for (const [id, def] of Object.entries(BOSSES)) {
  test(`${def.name}: definição válida (partes e alvos existem)`, () => {
    const partIds = new Set(def.parts.map((p) => p.id));
    assert.equal(partIds.size, def.parts.length, 'ids de partes duplicados');
    for (const phase of def.phases) {
      assert.ok(phase.targets.length > 0, `fase ${phase.id} sem alvos`);
      for (const target of phase.targets) assert.ok(partIds.has(target), `alvo inexistente: ${target}`);
      assert.equal(typeof phase.move, 'function');
      assert.equal(typeof phase.attack, 'function');
    }
    assert.ok(def.parTime > 0 && def.intro?.title && def.name);
  });

  test(`${def.name}: cada alvo é atingível no início da sua fase`, () => {
    const { boss } = fight(id);
    boss.passive = true;
    for (const phase of def.phases) {
      for (const targetId of phase.targets) {
        const part = boss.parts[targetId];
        if (part.destroyed) continue;
        assert.ok(boss.isPartVulnerable(part), `${targetId} não está vulnerável na fase ${phase.id}`);
        // Um tiro no centro visível da parte deve acertá-la.
        const c = boss.worldPoint(part.ox, part.oy);
        const hit = boss.hitTest(c.x, c.y, 3);
        assert.ok(hit, `tiro no centro de ${targetId} não acertou nada`);
        assert.equal(hit.part.id, targetId, `tiro em ${targetId} acertou ${hit.part.id}`);
      }
      for (const targetId of phase.targets) boss.applyDamage(boss.parts[targetId], 9999);
      if (boss.state === 'transition') transition(boss);
    }
  });

  test(`${def.name}: fluxo completo até a derrota`, () => {
    const { boss, world } = fight(id);
    for (const phase of def.phases) {
      assert.equal(boss.state, 'fight', `esperava combate na fase ${phase.id}`);
      for (const targetId of phase.targets) boss.applyDamage(boss.parts[targetId], 9999);
      if (boss.state === 'transition') transition(boss);
    }
    assert.equal(boss.state, 'dying');
    tick(boss, boss.timing.death + 0.1);
    assert.equal(boss.state, 'dead');
    assert.ok(world.calls.some((c) => c.name === 'onBossDefeated'));
  });

  test(`${def.name}: ataca durante o combate e não quebra com o tempo`, () => {
    const { boss, world } = fight(id);
    tick(boss, 20);
    assert.ok(world.bullets.length > 0 || world.calls.some((c) => c.name.startsWith('spawnMinion')));
    assert.ok(Number.isFinite(boss.x) && Number.isFinite(boss.y));
  });
}

test('Sentinela: cápsulas giram mais rápido quando uma é destruída', () => {
  const { boss } = fight('sentinel');
  const angleAfter = (seconds) => {
    const start = boss.vars.podAngle;
    tick(boss, seconds);
    return boss.vars.podAngle - start;
  };
  const before = angleAfter(1);
  boss.applyDamage(boss.parts.podA, 9999);
  const after = angleAfter(1);
  assert.ok(after > before * 1.3, `rotação ${before.toFixed(2)} -> ${after.toFixed(2)}`);
});

test('Sentinela: barreiras só existem na fase 2 e bloqueiam tiros', () => {
  const { boss } = fight('sentinel');
  assert.equal(boss.isPartVisible(boss.parts.barrierA), false);
  for (const id of ['podA', 'podB', 'podC']) boss.applyDamage(boss.parts[id], 9999);
  transition(boss);
  const barrier = boss.parts.barrierA;
  assert.equal(boss.isPartSolid(barrier), true);
  const c = boss.worldPoint(barrier.ox, barrier.oy);
  const hit = boss.hitTest(c.x, c.y, 3);
  assert.equal(hit.part.id, 'barrierA');
  assert.equal(hit.vulnerable, false);
});

test('Colmeia: ninhos geram drones; perder um acelera o outro', () => {
  const count = (world) => world.calls.filter((c) => c.name === 'spawnMinion').length;
  const a = fight('hive');
  tick(a.boss, 12);
  const both = count(a.world);
  const b = fight('hive');
  b.boss.applyDamage(b.boss.parts.nestL, 9999);
  tick(b.boss, 12);
  assert.ok(both > 0, 'nenhum drone gerado');
  // Taxa POR NINHO: o sobrevivente produz bem mais que cada ninho produzia antes.
  const perNestBefore = both / 2;
  assert.ok(count(b.world) > perNestBefore * 1.4, `ninho restante (${count(b.world)}) vs antes por ninho (${perNestBefore})`);
});

test('Ceifador: investida é avisada antes e desce até o jogador', () => {
  const { boss } = fight('reaper');
  const stages = new Set();
  let maxY = boss.y;
  for (let i = 0; i < 60 * 8; i++) {
    boss.update(1 / 60);
    stages.add(boss.vars.dive?.stage);
    maxY = Math.max(maxY, boss.y);
  }
  assert.ok(stages.has('warn') && stages.has('down') && stages.has('up'), [...stages].join(','));
  assert.ok(maxY > 500, `mergulho chegou só a y=${maxY}`);
});

test('Ceifador: encostar no corpo causa contato', () => {
  const { boss } = fight('reaper');
  assert.ok(boss.touches(boss.x, boss.y, 4));
  assert.ok(!boss.touches(boss.x, boss.y + 200, 4));
});
