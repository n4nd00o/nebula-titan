/**
 * Testes das mecânicas dos Mundos 2 a 4: projéteis novos, alienígenas novos
 * e as regras especiais de cada chefe (as regras genéricas de todos os chefes
 * ficam em minibosses.test.js).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Boss } from '../src/boss/Boss.js';
import { BOSSES } from '../src/boss/bosses/index.js';
import { EnemyBullet, PlayerBullet, PlayerMissile } from '../src/entities/projectiles.js';
import { ALIEN_TYPES } from '../src/entities/alienTypes.js';
import { Wingman } from '../src/entities/Wingman.js';
import { createFakeWorld, tick, tickUntilFight } from './helpers.js';

function fight(id) {
  const world = createFakeWorld();
  const boss = new Boss(world, BOSSES[id]);
  tickUntilFight(boss);
  return { boss, world };
}

const kill = (boss, ids) => ids.forEach((id) => boss.applyDamage(boss.parts[id], 9999, { ignoreArmor: true }));
const nextPhase = (boss) => tick(boss, boss.timing.transition + 0.1);

// ------------------------------------------------------------ projéteis
test('projétil que se divide vira vários ao fim do tempo', () => {
  const spawned = [];
  const scene = { player: { x: 0, y: 0, alive: true }, spawnEnemyBullet: (o) => spawned.push(o) };
  const b = new EnemyBullet({ x: 100, y: 100, vy: 100, split: { at: 0.5, count: 6, speed: 90, ring: true } });
  for (let i = 0; i < 20; i++) b.update(1 / 60, scene);
  assert.equal(spawned.length, 0);
  for (let i = 0; i < 20; i++) b.update(1 / 60, scene);
  assert.ok(b.dead);
  assert.equal(spawned.length, 6);
  assert.ok(spawned.every((o) => Math.abs(Math.hypot(o.vx, o.vy) - 90) < 0.01));
});

test('projétil com spin faz curva e com accel acelera', () => {
  const scene = { player: { x: 0, y: 0, alive: true } };
  const curve = new EnemyBullet({ x: 200, y: 100, vx: 0, vy: 120, spin: 1 });
  for (let i = 0; i < 60; i++) curve.update(1 / 60, scene);
  assert.ok(curve.vx < -50, `deveria curvar (vx=${curve.vx.toFixed(1)})`);
  assert.ok(Math.abs(Math.hypot(curve.vx, curve.vy) - 120) < 0.5, 'a curva mantém a velocidade');
  const fast = new EnemyBullet({ x: 200, y: 100, vy: 50, accel: 100, maxSpeed: 120 });
  for (let i = 0; i < 120; i++) fast.update(1 / 60, scene);
  assert.ok(Math.abs(fast.speed - 120) < 0.01);
});

test('tiro diagonal (Tiro Triplo) anda na horizontal e guarda a posição anterior', () => {
  const b = new PlayerBullet(100, 500, { vx: 140, damage: 0.6 });
  b.update(0.1);
  assert.equal(b.prevX, 100);
  assert.ok(b.x > 100 && b.y < 500);
  assert.equal(b.damage, 0.6);
});

test('míssil persegue o alvo indicado pela cena', () => {
  const target = { x: 400, y: 100 };
  const m = new PlayerMissile(240, 560, -1);
  const scene = { missileTarget: () => target };
  const start = Math.hypot(target.x - m.x, target.y - m.y);
  for (let i = 0; i < 60; i++) m.update(1 / 60, scene);
  assert.ok(Math.hypot(target.x - m.x, target.y - m.y) < start * 0.4, 'o míssil não se aproximou do alvo');
});

test('Ala Dupla: as duas alas voam em lados opostos', () => {
  const player = { x: 240, y: 560, alive: true };
  const left = new Wingman(player, -1);
  const right = new Wingman(player, 1);
  for (let i = 0; i < 120; i++) {
    left.update(1 / 60, player);
    right.update(1 / 60, player);
  }
  assert.ok(left.x < player.x && right.x > player.x);
});

// ------------------------------------------------------------ alienígenas novos
test('alienígenas novos: azul blindado, roxo divisor, vermelho kamikaze', () => {
  const { green, blue, purple, red } = ALIEN_TYPES;
  assert.ok(blue.hp >= 5 && blue.shot.split, 'azul: resistente e com tiro que se divide');
  assert.deepEqual(purple.splitInto, { type: 'green', count: 2 });
  assert.equal(red.shot, null, 'vermelho não atira');
  assert.ok(red.diveSpeed > 300 && red.diveTurn > 2.6, 'vermelho mergulha rápido e persegue');
  for (const t of Object.values(ALIEN_TYPES)) assert.ok(['top', 'bottom'].includes(t.tier));
  assert.equal(green.tier, 'bottom');
});

// ------------------------------------------------------------ Mundo 2
test('Hidra: cabeça cortada sozinha renasce; cortar as duas avança a fase', () => {
  const { boss } = fight('hydra');
  kill(boss, ['headL']);
  assert.ok(boss.parts.headL.destroyed);
  tick(boss, 0.5);
  assert.match(boss.hudHint(), /CORTE A OUTRA/);
  tick(boss, 8.7);
  assert.equal(boss.parts.headL.destroyed, false, 'a cabeça deveria ter renascido');
  assert.ok(boss.parts.headL.hp < boss.parts.headL.maxHp);
  kill(boss, ['headL', 'headR']);
  assert.equal(boss.state, 'transition');
});

test('Hidra: o sopro avisa antes e depois vira um raio letal', () => {
  const { boss } = fight('hydra');
  kill(boss, ['headL', 'headR']);
  nextPhase(boss);
  assert.equal(boss.phase.id, 'breath');
  const stages = [];
  let lethal = false;
  for (let i = 0; i < 60 * 4; i++) {
    boss.update(1 / 60);
    stages.push(boss.vars.breath.stage);
    if (boss.lethalSegments().length) {
      lethal = true;
      assert.ok(stages.includes('charge'), 'o raio ligou sem aviso');
    }
  }
  assert.ok(lethal, 'o sopro nunca ficou letal');
});

test('Escaravelho: a carapaça fecha e bloqueia o núcleo, depois abre de novo', () => {
  const { boss } = fight('scarab');
  kill(boss, ['mandibleL', 'mandibleR']);
  nextPhase(boss);
  const core = boss.parts.core;
  const centerHit = () => {
    const c = boss.worldPoint(core.ox, core.oy);
    return boss.hitTest(c.x, c.y, 3)?.part.id;
  };
  assert.equal(centerHit(), 'core', 'começa aberta');
  tick(boss, 3); // fecha após 2,4 s
  assert.match(centerHit(), /shell/, 'fechada, a carapaça deveria bloquear o tiro');
  tick(boss, 2.8);
  assert.equal(centerHit(), 'core', 'deveria abrir de novo');
});

test('Vórtice: a gravidade puxa e, na fase 2, também empurra', () => {
  const { boss } = fight('vortex');
  const pull = boss.pullForce();
  assert.ok(pull && pull.strength > 0);
  kill(boss, ['turbineL']);
  assert.ok(boss.pullForce().strength < pull.strength, 'perder uma turbina enfraquece a gravidade');
  kill(boss, ['turbineR']);
  nextPhase(boss);
  const signs = new Set();
  for (let i = 0; i < 60 * 5; i++) {
    boss.update(1 / 60);
    signs.add(Math.sign(boss.pullForce().strength));
  }
  assert.ok(signs.has(1) && signs.has(-1));
});

// ------------------------------------------------------------ Mundo 3
test('Gêmeos: o raio liga as naves e cai quando uma é destruída', () => {
  const { boss } = fight('twins');
  let linked = false;
  for (let i = 0; i < 60 * 3; i++) {
    boss.update(1 / 60);
    if (boss.lethalSegments().length === 1) linked = true;
  }
  assert.ok(linked, 'o raio nunca ligou');
  kill(boss, ['twinA']);
  for (let i = 0; i < 60 * 5; i++) {
    boss.update(1 / 60);
    assert.equal(boss.lethalSegments().length, 0);
  }
});

test('Fornalha: colunas de fogo têm aviso; na fase 2 dois raios giram', () => {
  const { boss } = fight('furnace');
  let warned = false;
  let fired = false;
  for (let i = 0; i < 60 * 6; i++) {
    boss.update(1 / 60);
    if (Object.values(boss.vars.columns).some((c) => c.stage === 'warn')) warned = true;
    if (boss.lethalSegments().length) {
      fired = true;
      assert.ok(warned, 'coluna de fogo sem aviso');
    }
  }
  assert.ok(fired);
  kill(boss, ['ventL', 'ventC', 'ventR']);
  nextPhase(boss);
  tick(boss, 1.2);
  assert.equal(boss.lethalSegments().length, 2);
});

test('Martelo: a pancada desce até a metade de baixo da tela', () => {
  const { boss } = fight('hammer');
  let maxY = 0;
  const stages = new Set();
  for (let i = 0; i < 60 * 7; i++) {
    boss.update(1 / 60);
    stages.add(boss.vars.slam?.stage);
    maxY = Math.max(maxY, boss.y);
  }
  assert.ok(stages.has('warn') && stages.has('down') && stages.has('hold'));
  assert.ok(maxY >= 400, `a pancada só chegou a y=${maxY}`);
});

test('Égide: o anel de escudo só aparece na fase 2 e gira', () => {
  const { boss } = fight('aegis');
  assert.equal(boss.isPartVisible(boss.parts.segA), false);
  kill(boss, ['cannonA', 'cannonB', 'cannonC', 'cannonD']);
  nextPhase(boss);
  assert.ok(boss.isPartVisible(boss.parts.segA));
  const before = boss.parts.segA.ox;
  tick(boss, 0.5);
  assert.notEqual(boss.parts.segA.ox, before);
});

// ------------------------------------------------------------ Mundo 4
test('Espectro: fica intangível (tiros atravessam) e volta a ser sólido', () => {
  const { boss } = fight('specter');
  const lantern = boss.parts.lanternA;
  const states = new Set();
  for (let i = 0; i < 60 * 6; i++) {
    boss.update(1 / 60);
    const c = boss.worldPoint(lantern.ox, lantern.oy);
    const hit = boss.hitTest(c.x, c.y, 3);
    if (boss.intangible) assert.equal(hit, null, 'tiro acertou o Espectro intangível');
    states.add(boss.intangible);
  }
  assert.ok(states.has(true) && states.has(false));
  assert.ok(BOSSES.specter.alpha(boss) <= 1);
});

test('Eco: segue a posição X do jogador', () => {
  const { boss, world } = fight('echo');
  world.player.x = 400;
  tick(boss, 3);
  assert.ok(boss.x > 300, `o Eco ficou em x=${boss.x.toFixed(0)}`);
});

test('Eco: na fase 2, projéteis sobem do fundo da tela depois do aviso', () => {
  const { boss, world } = fight('echo');
  kill(boss, ['reflectorL', 'reflectorR']);
  nextPhase(boss);
  tick(boss, 4);
  assert.ok(world.bullets.some((b) => b.vy < 0 && b.y > 600), 'nenhum projétil subiu do fundo');
});

test('Arconte: cinco fases com as mecânicas dos guardiões', () => {
  const { boss } = fight('archon');
  assert.equal(boss.phaseCount, 5);
  kill(boss, ['podA', 'podB', 'podC']);
  nextPhase(boss);
  assert.ok(boss.pullForce()?.strength > 0, 'fase 2: gravidade');
  kill(boss, ['wingL', 'wingR']);
  nextPhase(boss);
  let scissor = false;
  for (let i = 0; i < 60 * 4; i++) {
    boss.update(1 / 60);
    if (boss.lethalSegments().length === 2) scissor = true;
  }
  assert.ok(scissor, 'fase 3: tesoura de raios');
  kill(boss, ['cannon']);
  nextPhase(boss);
  let ghost = false;
  for (let i = 0; i < 60 * 5; i++) {
    boss.update(1 / 60);
    if (boss.intangible) ghost = true;
  }
  assert.ok(ghost, 'fase 4: máscara espectral');
  assert.equal(boss.parts.mask.armor > 0, true);
  kill(boss, ['mask']);
  nextPhase(boss);
  assert.ok(boss.isPartVulnerable(boss.parts.core), 'fase 5: núcleo exposto');
});

test('dificuldade: attackRate acelera os ataques do chefe', () => {
  const count = (rate) => {
    const world = createFakeWorld();
    const boss = new Boss(world, BOSSES.prism, { attackRate: rate });
    tickUntilFight(boss);
    tick(boss, 10);
    return world.bullets.length;
  };
  assert.ok(count(1.3) > count(1), 'mais ataques com attackRate maior');
});
