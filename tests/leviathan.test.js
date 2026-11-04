import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Boss } from '../src/boss/Boss.js';
import { LEVIATHAN } from '../src/boss/bosses/leviathan.js';
import { LaserWall } from '../src/entities/LaserWall.js';
import { createFakeWorld, tick, tickUntilFight } from './helpers.js';

function fight() {
  const world = createFakeWorld();
  const boss = new Boss(world, LEVIATHAN);
  tickUntilFight(boss);
  return { boss, world };
}

/** Destrói os alvos da fase atual e espera a transição. */
function clearPhase(boss) {
  for (const id of boss.phase.targets) boss.applyDamage(boss.parts[id], 9999, { ignoreArmor: true });
  tick(boss, boss.timing.transition + 0.1);
}

// v1.5: 10 fases (eram 8). As fases 8-10 acontecem na seção do núcleo.
test('Leviatã tem 10 fases; a câmera avança uma seção por fase até o núcleo e depois para', () => {
  const { boss } = fight();
  assert.equal(boss.phaseCount, 10);
  const ys = [boss.y];
  for (let i = 0; i < 9; i++) {
    clearPhase(boss);
    tick(boss, 1);
    ys.push(boss.y);
  }
  for (let i = 1; i < ys.length; i++) {
    const expected = i <= 7 ? 240 : 0;
    assert.ok(Math.abs(ys[i] - ys[i - 1] - expected) < 2, `fase ${i + 1}: avanço de ${ys[i] - ys[i - 1]}px (esperado ${expected})`);
  }
  assert.deepEqual(boss.phases.slice(7).map((p) => p.id), ['pylons', 'core', 'lastBreath']);
});

test('Leviatã (v1.5): raios giratórios nos pilares e núcleo que reacende', () => {
  const { boss } = fight();
  for (let i = 0; i < 7; i++) clearPhase(boss);
  assert.equal(boss.phase.id, 'pylons');
  tick(boss, 2.5); // passa do aviso
  assert.ok(boss.lethalSegments().length >= 2, 'os raios giratórios deveriam estar ativos');
  clearPhase(boss);
  assert.equal(boss.phase.id, 'core');
  clearPhase(boss);
  assert.equal(boss.phase.id, 'lastBreath');
  assert.ok(boss.isPartVisible(boss.parts.lastCore) && boss.isPartVulnerable(boss.parts.lastCore));
});

test('blindagem: tiro comum causa bem menos dano que o perfurante', () => {
  const { boss } = fight();
  clearPhase(boss);
  clearPhase(boss); // fase 3: baterias blindadas
  assert.equal(boss.phase.id, 'batteries');
  const a = boss.parts.bunkerL;
  const b = boss.parts.bunkerR;
  boss.applyDamage(a, 1); // comum
  boss.applyDamage(b, 1.5, { piercing: true }); // perfurante
  const normal = a.maxHp - a.hp;
  const piercing = b.maxHp - b.hp;
  assert.ok(piercing > normal * 3, `comum ${normal} x perfurante ${piercing}`);
});

test('regeneração: reatores recuperam vida quando param de ser atingidos', () => {
  const { boss } = fight();
  for (let i = 0; i < 4; i++) clearPhase(boss);
  assert.equal(boss.phase.id, 'reactors');
  const r = boss.parts.reactorL;
  boss.applyDamage(r, 20);
  const damaged = r.hp;
  tick(boss, 0.5);
  assert.equal(r.hp, damaged, 'não deve regenerar logo após o dano');
  tick(boss, 3);
  assert.ok(r.hp > damaged + 5, `regenerou só até ${r.hp}`);
});

test('o casco não causa dano por contato (o jogador voa sobre ele)', () => {
  const { boss } = fight();
  const p = boss.worldPoint(boss.parts.engTurretL.ox, boss.parts.engTurretL.oy);
  assert.equal(boss.touches(p.x, p.y, 4), false);
});

test('fases de lasers criam paredes; seções com bombRefill existem', () => {
  const { boss, world } = fight();
  for (let i = 0; i < 3; i++) clearPhase(boss);
  assert.equal(boss.phase.id, 'corridor');
  tick(boss, 5);
  assert.ok(world.calls.some((c) => c.name === 'spawnLaserWall'));
  assert.ok(LEVIATHAN.phases.filter((p) => p.bombRefill).length >= 3);
});

test('parede de laser: atinge fora da brecha, poupa dentro dela', () => {
  const wall = new LaserWall({ gapX: 240, gap: 80, speed: 170 });
  assert.equal(wall.hits(100, wall.y, 4), false, 'não atinge durante o aviso');
  for (let i = 0; i < 60; i++) wall.update(1 / 60);
  assert.equal(wall.hits(100, wall.y, 4), true, 'fora da brecha');
  assert.equal(wall.hits(240, wall.y, 4), false, 'dentro da brecha');
  assert.equal(wall.hits(100, wall.y + 30, 4), false, 'longe da faixa');
});
