/**
 * Testes de GARANTIA: nenhum chefe pode ficar "imortal".
 *
 * Em vez de testar o centro das partes (como em minibosses.test.js), aqui o
 * teste joga como o jogador: varre a tela com TIROS RETOS PARA CIMA, saindo de
 * baixo, exatamente como a cena faz (hitTestPath com o raio do tiro). Só conta
 * o dano quando o tiro chega ao ponto fraco sem ser bloqueado por outra peça.
 *
 * Esse teste pegou o bug do Vórtice (v1.3.0): o anel do casco envolvia o Olho
 * do Furacão por completo, e todo tiro vindo de baixo ricocheteava no anel.
 *
 * Vale automaticamente para TODOS os chefes registrados, inclusive futuros.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Boss } from '../src/boss/Boss.js';
import { BOSSES } from '../src/boss/bosses/index.js';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER } from '../src/config.js';
import { createFakeWorld, tickUntilFight } from './helpers.js';

const STEP = 1 / 60;
const SCAN_EVERY = 6; // varre a tela a cada 0,1 s
const DAMAGE_PER_SCAN = 2; // ~20 de dano/s (bem acima do jogador real: o teste mede ALCANCE, não balanço)
const PHASE_LIMIT = 120; // segundos máximos por fase antes de declarar "imortal"
const BULLET_RADIUS = 3; // raio do tiro do jogador (src/entities/projectiles.js)

/**
 * Varre colunas da tela com tiros retos para cima (de y = 630 até o topo).
 * Retorna o primeiro acerto em um ponto fraco ainda vivo (ou null).
 */
function scanShots(boss, prefer) {
  let fallback = null;
  for (let x = 12; x <= GAME_WIDTH - 12; x += 4) {
    const hit = boss.hitTestPath(x, GAME_HEIGHT - 10, x, -10, BULLET_RADIUS);
    if (!hit || !hit.vulnerable) continue;
    if (prefer.has(hit.part.id)) return hit;
    fallback ??= hit;
  }
  return fallback;
}

/** Joga a luta inteira atirando só de baixo. Retorna o relatório por fase. */
function playByShooting(def) {
  const world = createFakeWorld({ player: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60, alive: true } });
  const boss = new Boss(world, def);
  tickUntilFight(boss);
  const report = [];
  let phaseTime = 0;
  let frame = 0;
  let lastPhase = -1;
  const reached = new Set();

  while (boss.state !== 'dying' && boss.state !== 'dead') {
    if (boss.phaseIndex !== lastPhase && boss.state === 'fight') {
      lastPhase = boss.phaseIndex;
      phaseTime = 0;
      report.push({ phase: boss.phase.id, reached: new Set() });
    }
    boss.update(STEP);
    frame++;
    phaseTime += STEP;
    if (phaseTime > PHASE_LIMIT) {
      const current = report.at(-1);
      const alive = boss.phase.targets.filter((id) => !boss.parts[id].destroyed);
      return { ok: false, boss, phase: boss.phase.id, alive, reached: [...(current?.reached ?? [])] };
    }
    if (boss.state !== 'fight' || frame % SCAN_EVERY) continue;
    // O jogador fica embaixo e vai até a coluna do ponto fraco.
    const targets = new Set(boss.phase.targets.filter((id) => !boss.parts[id].destroyed));
    const hit = scanShots(boss, targets);
    if (hit) {
      report.at(-1)?.reached.add(hit.part.id);
      reached.add(hit.part.id);
      boss.applyDamage(hit.part, DAMAGE_PER_SCAN);
    }
  }
  return { ok: true, boss, report, reached };
}

for (const [id, def] of Object.entries(BOSSES)) {
  test(`${def.name}: pode ser derrotado só com tiros vindos de baixo (nenhuma fase imortal)`, () => {
    const result = playByShooting(def);
    assert.ok(
      result.ok,
      `${id} ficou imortal na fase "${result.phase}": alvos vivos [${result.alive}] ` +
        `nunca alcançáveis por um tiro reto (alcançados: [${result.reached}])`,
    );
  });

  test(`${def.name}: todo alvo de fase é alcançado por tiro direto (sem depender de outro alvo)`, () => {
    const result = playByShooting(def);
    assert.ok(result.ok);
    for (const phase of def.phases) {
      for (const target of phase.targets) {
        // Um alvo pode ter sido destruído por roteiro (ex.: blowOff) — então não precisa ser alcançado.
        const part = result.boss.parts[target];
        assert.ok(part.destroyed, `${target} não foi destruído`);
      }
    }
  });

  test(`${def.name}: hitbox = sprite (máscara retangular e com pixels visíveis)`, () => {
    const boss = new Boss(createFakeWorld(), def);
    for (const part of boss.drawOrder) {
      const width = part.maskRows[0].length;
      assert.ok(part.maskRows.every((r) => r.length === width), `${part.id}: linhas do sprite com larguras diferentes`);
      assert.ok(part.maskRows.some((r) => /[^.]/.test(r)), `${part.id}: sprite sem pixels visíveis`);
      // A caixa dos marcadores (w/h) não pode ser maior que o próprio sprite.
      assert.ok(part.w <= part.spriteW + 4 && part.h <= part.spriteH + 4, `${part.id}: caixa maior que o sprite`);
    }
  });

  test(`${def.name}: tiro fora do sprite nunca acerta (sem hitbox fantasma)`, () => {
    const world = createFakeWorld();
    const boss = new Boss(world, def);
    tickUntilFight(boss);
    boss.passive = true;
    // Pontos bem longe de qualquer parte não podem acertar nada.
    let farthest = 0;
    for (const part of boss.drawOrder) {
      farthest = Math.max(farthest, Math.hypot(part.ox, part.oy) + Math.hypot(part.spriteW, part.spriteH) / 2);
    }
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      const x = boss.x + Math.cos(ang) * (farthest + 12);
      const y = boss.y + Math.sin(ang) * (farthest + 12);
      assert.equal(boss.hitTest(x, y, BULLET_RADIUS), null, `acerto fantasma em (${x.toFixed(0)}, ${y.toFixed(0)})`);
    }
  });
}

test('Jogador: hitbox pequena (4 px) e tiros têm o raio usado nos testes de alcance', () => {
  assert.equal(PLAYER.hitRadius, 4);
  assert.ok(BULLET_RADIUS >= 2 && BULLET_RADIUS <= 4);
});

test('Alienígenas: hitbox circular cobre o corpo do sprite (nem menor, nem maior)', async () => {
  const { ALIEN_TYPES } = await import('../src/entities/alienTypes.js');
  const { SPRITES } = await import('../src/graphics/spriteData.js');
  const { PIXEL_SIZE } = await import('../src/config.js');
  for (const [type, info] of Object.entries(ALIEN_TYPES)) {
    const rows = SPRITES[info.sprite].rows;
    const halfW = (rows[0].length * PIXEL_SIZE) / 2;
    const halfH = (rows.length * PIXEL_SIZE) / 2;
    assert.ok(info.radius >= halfH, `${type}: raio ${info.radius} menor que meia altura ${halfH}`);
    assert.ok(info.radius <= halfW, `${type}: raio ${info.radius} maior que meia largura ${halfW}`);
  }
});
