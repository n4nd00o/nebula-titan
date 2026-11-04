/**
 * Buffs únicos do Mundo 5 e tela MEUS BUFFS (v1.5).
 *
 * Aqui a PlayScene real roda com um "jogo falso" (sem navegador): entrada
 * parada, som e sprites gravados pelo Proxy de helpers.js.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PlayScene, BUFF_TUNING } from '../src/scenes/PlayScene.js';
import { buffsOfWorld, sourceLabel } from '../src/scenes/BuffsScene.js';
import { Campaign, BUFFS, WORLDS } from '../src/systems/Campaign.js';
import { PlayerBullet, EnemyBullet } from '../src/entities/projectiles.js';
import { defaultBindings } from '../src/core/KeyBindings.js';
import { PLAYER } from '../src/config.js';
import { createFakeWorld } from './helpers.js';

function fakeGame() {
  const rec = createFakeWorld();
  return {
    input: { bindings: defaultBindings(), isDown: () => false, wasPressed: () => false, pointer: { active: false }, tap: null, touchMode: false },
    audio: rec.audio,
    sprites: rec.sprites,
    starfield: rec.starfield,
    storage: { get: (k, f) => f, set() {} },
    changeScene() {},
    resumeScene() {},
  };
}

/** Cena de luta com os buffs pedidos, já com o chefe em combate. */
function sceneWith(buffs, bossId = 'sentinel') {
  const c = new Campaign();
  buffs.forEach((b) => c.buffs.add(b));
  const scene = new PlayScene(fakeGame(), { bossId, campaign: c });
  for (let i = 0; i < 600 && scene.boss.state !== 'fight'; i++) scene.boss.update(1 / 60);
  scene.boss.passive = true;
  return scene;
}

test('ORBITAIS: dois orbes giram ao redor da nave e apagam projéteis inimigos', () => {
  const scene = sceneWith(['orbitals']);
  const orbs = scene.orbitalPositions();
  assert.equal(orbs.length, 2);
  for (const o of orbs) assert.ok(Math.abs(Math.hypot(o.x - scene.player.x, o.y - scene.player.y) - BUFF_TUNING.orbitalRadius) < 1e-6);
  const bullet = new EnemyBullet({ x: orbs[0].x, y: orbs[0].y });
  scene.enemyBullets.push(bullet);
  scene.handleCollisions();
  assert.ok(bullet.dead, 'o orbe apagou o projétil');
  assert.equal(sceneWith([]).orbitalPositions().length, 0, 'sem o buff, sem orbes');
});

test('TEMPO BALA: no modo foco, projéteis inimigos andam a 65% da velocidade', () => {
  const move = (buffs, focused) => {
    const scene = sceneWith(buffs);
    scene.player.focused = focused;
    const b = new EnemyBullet({ x: 100, y: 100, vy: 100 });
    scene.enemyBullets.push(b);
    scene.updateWorld(0.1, false);
    return b.y - 100;
  };
  assert.ok(Math.abs(move(['bulletTime'], true) - 6.5) < 1e-6);
  assert.ok(Math.abs(move(['bulletTime'], false) - 10) < 1e-6, 'fora do foco, velocidade normal');
  assert.ok(Math.abs(move([], true) - 10) < 1e-6, 'sem o buff, velocidade normal');
});

test('SUPERCARGA: a cada 5 s sai um raio perfurante com 8x o dano', () => {
  const scene = sceneWith(['supercharge']);
  scene.firePlayerShot(scene.player);
  assert.ok(!scene.playerBullets.some((b) => b.super), 'ainda carregando');
  scene.superTimer = BUFF_TUNING.superEvery;
  scene.firePlayerShot(scene.player);
  const beam = scene.playerBullets.find((b) => b.super);
  assert.ok(beam && beam.piercing);
  assert.equal(beam.damage, PLAYER.bulletDamage * BUFF_TUNING.superDamage);
  assert.equal(scene.superTimer, 0, 'recomeça a carregar');
});

test('ASCENSÃO: todos os tiros causam +25% de dano', () => {
  const normal = sceneWith([]);
  const ascended = sceneWith(['ascension']);
  normal.firePlayerShot(normal.player);
  ascended.firePlayerShot(ascended.player);
  assert.equal(ascended.playerBullets[0].damage, normal.playerBullets[0].damage * BUFF_TUNING.ascension);
});

test('RENASCER: uma vez por luta, o golpe fatal não tira a vida', () => {
  const scene = sceneWith(['rebirth']);
  const p = scene.player;
  p.invuln = 0; // a nave nasce invencível por 1,5 s
  const lives = p.lives;
  assert.equal(p.hit(scene), false);
  assert.equal(p.lives, lives);
  assert.ok(p.alive && p.invuln > 0 && scene.rebirthUsed);
  p.invuln = 0;
  assert.equal(p.hit(scene), true, 'a segunda vez é para valer');
  assert.equal(p.lives, lives - 1);
});

test('VAMPIRISMO: destruir uma parte do chefe restaura o escudo', () => {
  const scene = sceneWith(['vampire']);
  assert.equal(scene.player.shield, false);
  const pod = scene.boss.parts.podA;
  scene.boss.applyDamage(pod, 9999);
  assert.ok(scene.player.shield, 'escudo restaurado');
  const plain = sceneWith([]);
  plain.boss.applyDamage(plain.boss.parts.podA, 9999);
  assert.equal(plain.player.shield, false);
});

test('RICOCHETE: tiro que bate em blindagem vira um míssil teleguiado', () => {
  const shoot = (buffs) => {
    const scene = sceneWith(buffs);
    const boss = scene.boss;
    // O olho da Sentinela é sólido e blindado na fase 1 (as cápsulas são o alvo).
    for (const id of ['podA', 'podB', 'podC']) boss.parts[id].ox = 999;
    const b = new PlayerBullet(boss.x, boss.y + 40);
    b.update(0.06);
    scene.playerBullets.push(b);
    scene.handleCollisions();
    return scene.playerBullets.filter((x) => x.missile).length;
  };
  assert.equal(shoot(['ricochet']), 1);
  assert.equal(shoot([]), 0);
});

test('Tela MEUS BUFFS: todo buff aparece em exatamente uma página e tem origem', () => {
  const all = WORLDS.flatMap((_, i) => buffsOfWorld(i));
  assert.deepEqual([...all].sort(), Object.keys(BUFFS).sort());
  assert.equal(new Set(all).size, all.length);
  assert.equal(buffsOfWorld(4).length, 7, 'Mundo 5: 6 buffs únicos + bônus');
  assert.equal(sourceLabel('rebirth'), 'DE: FÊNIX');
  assert.match(sourceLabel('ascension'), /BÔNUS DO MUNDO 5/);
});
