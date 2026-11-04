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
 * v1.4.1: o alvo precisa de uma JANELA DE TIRO de pelo menos MIN_OPEN_WIDTH px
 * (colunas vizinhas que chegam a ele). Antes bastava UMA coluna, e a Hidra
 * passava no teste com uma fresta de 3 px na borda de uma escama, impossível
 * de acertar jogando de verdade.
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
const SCAN_STEP = 2; // distância entre as colunas de tiro testadas (px)
export const MIN_OPEN_WIDTH = 12; // largura mínima da janela de tiro para um alvo contar como alcançável (px)

/**
 * Varre colunas da tela com tiros retos para cima (de y = 630 até o topo) e mede,
 * para cada ponto fraco, a MAIOR janela contínua de colunas que chegam até ele.
 * @returns {Map<string, {part, width:number}>}
 */
export function openWindows(boss) {
  const windows = new Map();
  let run = null;
  const close = () => {
    if (!run) return;
    const prev = windows.get(run.part.id);
    if (!prev || run.width > prev.width) windows.set(run.part.id, run);
    run = null;
  };
  for (let x = 12; x <= GAME_WIDTH - 12; x += SCAN_STEP) {
    const hit = boss.hitTestPath(x, GAME_HEIGHT - 10, x, -10, BULLET_RADIUS);
    const part = hit && hit.vulnerable ? hit.part : null;
    if (part && run && run.part === part) run.width += SCAN_STEP;
    else {
      close();
      if (part) run = { part, width: SCAN_STEP };
    }
  }
  close();
  return windows;
}

/** Escolhe um alvo da fase com janela de tiro jogável (ou null). */
function scanShots(boss, prefer) {
  let best = null;
  for (const w of openWindows(boss).values()) {
    if (w.width < MIN_OPEN_WIDTH) continue;
    const score = (prefer.has(w.part.id) ? 1000 : 0) + w.width;
    if (!best || score > best.score) best = { ...w, score };
  }
  return best;
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

test('Hidra (regressão v1.4.0): as escamas de cima ficam alcançáveis depois que as de baixo caem', async () => {
  const { tick } = await import('./helpers.js');
  const boss = new Boss(createFakeWorld(), BOSSES.hydra);
  tickUntilFight(boss);
  boss.passive = true;
  for (let i = 0; i < 2; i++) {
    for (const id of boss.phase.targets) boss.applyDamage(boss.parts[id], 9999);
    tick(boss, boss.timing.transition + 0.2);
  }
  assert.equal(boss.phase.id, 'scales');
  for (const id of ['scaleC', 'scaleD']) boss.applyDamage(boss.parts[id], 9999);
  const windows = openWindows(boss);
  for (const id of ['scaleA', 'scaleB']) {
    const w = windows.get(id)?.width ?? 0;
    assert.ok(w >= MIN_OPEN_WIDTH, `${id}: janela de tiro de ${w} px (mínimo ${MIN_OPEN_WIDTH})`);
  }
});
