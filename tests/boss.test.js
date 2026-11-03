import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Boss, BOSS_TIMING } from '../src/boss/Boss.js';
import { NEBULA_TITAN } from '../src/boss/bosses/nebulaTitan.js';
import { createFakeWorld, tick, tickUntilFight } from './helpers.js';

const PHASES = NEBULA_TITAN.phases;

function newBossInFight() {
  const world = createFakeWorld();
  const boss = new Boss(world);
  tickUntilFight(boss);
  return { boss, world };
}

const destroy = (boss, id) => boss.applyDamage(boss.parts[id], 9999);

test('o chefe entra em cena e começa na fase 1 (asas)', () => {
  const world = createFakeWorld();
  const boss = new Boss(world);
  assert.equal(boss.state, 'entering');
  tick(boss, BOSS_TIMING.entry + 0.1);
  assert.equal(boss.state, 'fight');
  assert.equal(boss.phaseIndex, 0);
  assert.equal(boss.phase.id, 'wings');
});

test('durante a entrada o chefe é invulnerável', () => {
  const world = createFakeWorld();
  const boss = new Boss(world);
  assert.equal(boss.applyDamage(boss.parts.wingL, 9999), false);
  assert.equal(boss.parts.wingL.destroyed, false);
});

test('na fase 1 só as asas são vulneráveis', () => {
  const { boss } = newBossInFight();
  const vulnerable = boss.vulnerableParts().map((p) => p.id).sort();
  assert.deepEqual(vulnerable, ['wingL', 'wingR']);
  assert.equal(destroy(boss, 'cannon'), false);
  assert.equal(destroy(boss, 'core'), false);
});

test('perder uma asa inclina o chefe para o lado danificado', () => {
  const left = newBossInFight().boss;
  destroy(left, 'wingL');
  tick(left, 1);
  assert.ok(left.tilt < -0.1, `tilt esperado negativo, obtido ${left.tilt}`);

  const right = newBossInFight().boss;
  destroy(right, 'wingR');
  tick(right, 1);
  assert.ok(right.tilt > 0.1, `tilt esperado positivo, obtido ${right.tilt}`);
});

test('destruir uma asa expõe o gerador daquele lado (quebra antecipada)', () => {
  const { boss } = newBossInFight();
  assert.equal(boss.isPartVulnerable(boss.parts.genL), false);
  destroy(boss, 'wingL');
  assert.equal(boss.isPartVulnerable(boss.parts.genL), true);
  assert.equal(boss.isPartVulnerable(boss.parts.genR), false);
});

test('destruir as duas asas leva à transição e depois à fase 2', () => {
  const { boss } = newBossInFight();
  destroy(boss, 'wingL');
  destroy(boss, 'wingR');
  assert.equal(boss.state, 'transition');
  assert.equal(boss.isPartVulnerable(boss.parts.genL), false, 'invulnerável durante a transição');
  tick(boss, BOSS_TIMING.transition + 0.1);
  assert.equal(boss.state, 'fight');
  assert.equal(boss.phase.id, 'generators');
});

test('se os dois geradores caírem antes, a fase 2 é pulada', () => {
  const { boss, world } = newBossInFight();
  destroy(boss, 'wingL');
  destroy(boss, 'genL');
  destroy(boss, 'wingR'); // conclui a fase 1
  tick(boss, BOSS_TIMING.transition + 0.1);
  assert.equal(boss.phase.id, 'generators');
  destroy(boss, 'genR'); // conclui a fase 2 normalmente
  tick(boss, BOSS_TIMING.transition + 0.1);
  assert.equal(boss.phase.id, 'cannon');

  const other = newBossInFight().boss;
  destroy(other, 'wingL');
  destroy(other, 'genL');
  destroy(other, 'wingR');
  destroy(other, 'genR'); // ainda na transição da fase 1 -> não vale
  assert.equal(other.parts.genR.destroyed, false, 'não pode destruir durante a transição');
  assert.ok(world.calls.some((c) => c.name === 'announce'));
});

test('fluxo completo: asas -> geradores -> canhão -> núcleo -> derrota', () => {
  const { boss, world } = newBossInFight();
  for (const phase of PHASES) {
    assert.equal(boss.state, 'fight');
    for (const id of phase.targets) destroy(boss, id);
    if (phase.id !== 'core') tick(boss, BOSS_TIMING.transition + 0.1);
  }
  assert.equal(boss.state, 'dying');
  assert.ok(boss.parts.plate.destroyed, 'a placa é arrancada na fase final');
  assert.ok(boss.enraged);
  tick(boss, BOSS_TIMING.death + 0.1);
  assert.equal(boss.state, 'dead');
  assert.ok(world.calls.some((c) => c.name === 'onBossDefeated'));
  assert.deepEqual(boss.destroyedOrder.slice(0, 2), ['Asa Esquerda', 'Asa Direita']);
});

test('hitTest: tiro no casco ricocheteia, tiro na asa causa dano', () => {
  const { boss } = newBossInFight();
  const hull = boss.partRect(boss.parts.hull);
  const hitHull = boss.hitTest(hull.cx, hull.cy - 25, 3);
  assert.equal(hitHull.part.id, 'hull');
  assert.equal(hitHull.vulnerable, false);

  const wing = boss.partRect(boss.parts.wingR);
  const hitWing = boss.hitTest(wing.cx, wing.cy, 3);
  assert.equal(hitWing.part.id, 'wingR');
  assert.equal(hitWing.vulnerable, true);
});

test('o chefe dispara projéteis durante o combate', () => {
  const { boss, world } = newBossInFight();
  tick(boss, 4);
  assert.ok(world.bullets.length > 0);
});

test('nível de dano visual muda conforme a vida da parte', () => {
  const { boss } = newBossInFight();
  const wing = boss.parts.wingL;
  assert.equal(wing.damageLevel, 0);
  boss.applyDamage(wing, Math.ceil(wing.maxHp * 0.4));
  assert.equal(wing.damageLevel, 1);
  boss.applyDamage(wing, Math.ceil(wing.maxHp * 0.4));
  assert.equal(wing.damageLevel, 2);
});

// ---------------------------------------------------------------------------
// Regressão: "acerto a asa mas não conta" (v1.0.0)
// Causa: o gerador escondido sob a asa bloqueava os tiros na metade interna.
// ---------------------------------------------------------------------------

/** Dispara de baixo para cima em x e retorna o primeiro acerto. */
function shootFromBelow(boss, x) {
  let prev = 660;
  for (let y = 640; y > -20; y -= 620 / 60) {
    const hit = boss.hitTestPath(x, prev, x, y, 3);
    if (hit) return hit;
    prev = y;
  }
  return null;
}

test('regressão: toda a largura visível de cada asa recebe dano na fase 1', () => {
  const { boss } = newBossInFight();
  boss.passive = true;
  for (const [id, side] of [['wingL', -1], ['wingR', 1]]) {
    // Da ponta da asa até a borda do casco (de 102 a 42 px do centro).
    for (let d = 42; d <= 100; d += 2) {
      const hit = shootFromBelow(boss, boss.x + side * d);
      assert.ok(hit, `${id}: tiro em ${d}px não acertou nada`);
      assert.equal(hit.part.id, id, `${id}: tiro em ${d}px acertou "${hit.part.id}"`);
      assert.equal(hit.vulnerable, true);
    }
  }
});

test('regressão: gerador fica escondido (e não bloqueia tiros) enquanto a asa existe', () => {
  const { boss } = newBossInFight();
  assert.equal(boss.isPartVisible(boss.parts.genL), false);
  assert.equal(boss.isPartSolid(boss.parts.genL), false);
  destroy(boss, 'wingL');
  assert.equal(boss.isPartVisible(boss.parts.genL), true);
  const hit = shootFromBelow(boss, boss.worldPoint(-52, 8).x);
  assert.equal(hit.part.id, 'genL');
  assert.equal(hit.vulnerable, true);
});

test('regressão: o núcleo recebe dano em toda a sua largura na fase 4', () => {
  const { boss } = newBossInFight();
  for (const phase of PHASES.slice(0, 3)) {
    for (const id of phase.targets) destroy(boss, id);
    tick(boss, BOSS_TIMING.transition + 0.1);
  }
  boss.passive = true;
  const c = boss.worldPoint(0, -3);
  for (let d = -12; d <= 12; d += 3) {
    const hit = shootFromBelow(boss, c.x + d);
    assert.ok(hit && hit.part.id === 'core' && hit.vulnerable, `tiro em ${d}px não acertou o núcleo`);
  }
});

test('colisão segue os pixels: área transparente do sprite não bloqueia tiros', () => {
  const { boss } = newBossInFight();
  // Canto superior esquerdo do retângulo da asa esquerda é transparente (asa é triangular).
  const p = boss.worldPoint(-66 - 34, -8 - 20);
  assert.equal(boss.hitTest(p.x, p.y, 1), null);
});
