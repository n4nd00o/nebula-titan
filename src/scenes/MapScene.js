/**
 * MapScene — "Rota de Ataque": o jogador escolhe o próximo alvo do mundo atual.
 *
 * Três mini-chefes na base do mapa, o chefe do mundo acima (bloqueado até
 * os três caírem) e, no Mundo 4, o Leviatã no topo. Cada nó mostra o buff
 * que concede, o que transforma a ordem das lutas em uma decisão estratégica.
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H, UI_COLORS } from '../config.js';
import { drawText } from '../graphics/text.js';
import { ENCOUNTERS } from '../encounters.js';
import { BUFFS, REWARDS } from '../systems/Campaign.js';
import { PlayScene } from './PlayScene.js';
import { TitleScene } from './TitleScene.js';
import { ProgressScene } from './ProgressScene.js';

const NODE_RADIUS = 40;

/** Botões de toque no topo: voltar ao menu e abrir o Mapa de Progresso. */
const MENU_BUTTON = Object.freeze({ x: 8, y: 8, w: 76, h: 26 });
const MAP_BUTTON = Object.freeze({ x: W - 84, y: 8, w: 76, h: 26 });
const inside = (p, r) => p && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

/** Ícones dos chefes do Mundo 1 (os chefes novos declaram `icon` na definição). */
const LEGACY_ICONS = {
  sentinel: { sprite: 'sentinel', scale: 0.75 },
  hive: { sprite: 'hive', scale: 0.7 },
  reaper: { sprite: 'reaper', scale: 0.75 },
  titan: { sprite: 'hull', scale: 0.8 },
  leviathan: { sprite: 'bridge', scale: 0.75 },
};

export const iconFor = (id) => ENCOUNTERS[id].icon ?? LEGACY_ICONS[id] ?? { sprite: 'minion', scale: 1 };

/**
 * Monta os nós do mapa para um mundo.
 * Mundo 5 (v1.5): dois círculos de 3 mini-chefes (o de baixo primeiro) e o Ômega no topo.
 */
export function buildNodes(world) {
  const xs = [90, W / 2, W - 90];
  let nodes;
  if (world.circles) {
    const [inner, outer] = world.circles;
    nodes = [
      ...inner.map((id, i) => ({ id, x: xs[i], y: 380, kind: 'mini', circle: 0, r: 32 })),
      ...outer.map((id, i) => ({ id, x: xs[i], y: 256, kind: 'mini', circle: 1, r: 32 })),
      { id: world.boss, x: W / 2, y: 162, kind: 'boss', r: 36 },
    ];
  } else {
    const [a, b, c] = world.minis;
    const bossY = world.finale ? 240 : 205;
    nodes = [
      { id: a, x: 90, y: 340, kind: 'mini' },
      { id: b, x: W / 2, y: 372, kind: 'mini' },
      { id: c, x: W - 90, y: 340, kind: 'mini' },
      { id: world.boss, x: W / 2, y: bossY, kind: 'boss' },
    ];
    if (world.finale) nodes.push({ id: world.finale, x: W / 2, y: 140, kind: 'finale' });
  }
  return nodes.map((n) => ({ r: NODE_RADIUS, ...n, ...iconFor(n.id) }));
}

/** Ligações do mapa: [de, para] por índice de nó. */
export function buildLinks(world, nodes) {
  const boss = nodes.findIndex((n) => n.kind === 'boss');
  const finale = nodes.findIndex((n) => n.kind === 'finale');
  const links = [];
  if (world.circles) {
    for (let i = 0; i < 3; i++) links.push([i, i + 3], [i + 3, boss]);
  } else {
    for (let i = 0; i < 3; i++) links.push([i, boss]);
  }
  if (finale >= 0) links.push([boss, finale]);
  return links;
}

export class MapScene {
  constructor(game, campaign) {
    this.game = game;
    this.campaign = campaign;
    this.time = 0;
    this.world = campaign.world;
    this.nodes = buildNodes(this.world);
    const available = campaign.available();
    this.selected = Math.max(0, this.nodes.findIndex((n) => n.id === available[0]));
    // Anúncios únicos quando o chefe do mundo e o chefe final são liberados.
    const i = campaign.worldIndex;
    this.showUnlock = campaign.bossUnlocked && !campaign.shown.has(`boss${i}`);
    if (campaign.bossUnlocked) campaign.shown.add(`boss${i}`);
    this.showFinalUnlock = campaign.finaleUnlocked && !campaign.shown.has(`finale${i}`);
    if (campaign.finaleUnlocked) campaign.shown.add(`finale${i}`);
  }

  enter() {
    this.game.starfield.setSpeed(0.6);
    this.game.starfield.setTheme(this.world.theme);
    this.game.audio.setTempo(1);
    this.game.audio.playMusic('map');
  }

  get availableIndexes() {
    const ids = this.campaign.available();
    return this.nodes.map((n, i) => (ids.includes(n.id) ? i : -1)).filter((i) => i >= 0);
  }

  isLocked(node) {
    const c = this.campaign;
    if (node.kind === 'boss') return !c.bossUnlocked;
    if (node.kind === 'finale') return !c.finaleUnlocked;
    if (node.circle === 1) return this.world.circles[0].some((id) => !c.defeated.has(id));
    return false;
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    const options = this.availableIndexes;
    const pos = options.indexOf(this.selected);

    if (input.wasPressed('left') || input.wasPressed('up')) this.moveSelection(options, pos - 1);
    if (input.wasPressed('right') || input.wasPressed('down')) this.moveSelection(options, pos + 1);

    if (input.wasPressed('map') || inside(input.tap, MAP_BUTTON)) {
      this.game.audio.play('select');
      this.game.changeScene(new ProgressScene(this.game, { campaign: this.campaign, focusWorld: this.campaign.worldIndex, back: 'route' }));
      return;
    }
    if (inside(input.tap, MENU_BUTTON)) {
      this.game.changeScene(new TitleScene(this.game));
      return;
    }

    // Toque/clique: escolher e iniciar o nó tocado.
    if (input.tap) {
      const hit = this.nodes.findIndex((n) => Math.hypot(n.x - input.tap.x, n.y - input.tap.y) < n.r);
      if (options.includes(hit)) {
        this.selected = hit;
        this.start();
        return;
      }
    }

    if (!input.tap && (input.wasPressed('confirm') || input.wasPressed('fire'))) this.start();
    else if (input.wasPressed('pause') || input.wasPressed('quit')) this.game.changeScene(new TitleScene(this.game));
  }

  moveSelection(options, index) {
    if (options.length === 0) return;
    this.selected = options[(index + options.length) % options.length];
    this.game.audio.play('select');
  }

  start() {
    const node = this.nodes[this.selected];
    if (!node || !this.campaign.canFight(node.id)) return;
    this.game.audio.play('select');
    this.game.changeScene(new PlayScene(this.game, { bossId: node.id, campaign: this.campaign }));
  }

  draw(ctx) {
    const { campaign, world } = this;
    const sprites = this.game.sprites;

    for (const [b, label] of [[MENU_BUTTON, '< MENU'], [MAP_BUTTON, 'MAPA (TAB)']]) {
      ctx.fillStyle = 'rgba(26, 28, 44, 0.85)';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#566c86';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
      drawText(ctx, label, b.x + b.w / 2, b.y + b.h / 2, { size: 6, align: 'center', baseline: 'middle', color: UI_COLORS.muted });
    }
    drawText(ctx, `MUNDO ${world.number}: ${world.name}`, W / 2, 16, { size: 8, align: 'center', color: world.theme.accent });
    drawText(ctx, 'ROTA DE ATAQUE', W / 2, 32, { size: 16, align: 'center', color: UI_COLORS.accent });
    drawText(ctx, 'Escolha o próximo alvo. A ordem importa!', W / 2, 56, { size: 6, align: 'center', color: UI_COLORS.muted });
    drawText(ctx, `PONTOS ${String(campaign.score).padStart(7, '0')}`, W / 2, 72, { size: 7, align: 'center' });

    // Buffs já conquistados (resumo)
    drawText(ctx, campaign.buffs.size ? `BUFFS: ${campaign.buffs.size}` : 'SEM BUFFS AINDA', 14, 96, { size: 6, color: UI_COLORS.muted });
    drawText(ctx, `VIDAS ${campaign.lives}/5   MORTES ${campaign.deaths}`, W - 14, 96, { size: 6, align: 'right', color: UI_COLORS.muted });

    // Ligações: mini-chefes -> chefe -> chefe final
    const boss = this.nodes.find((n) => n.kind === 'boss');
    const links = buildLinks(world, this.nodes).map(([a, b]) => [this.nodes[a], this.nodes[b], campaign.defeated.has(this.nodes[a].id)]);
    for (const [from, to, done] of links) {
      ctx.strokeStyle = done ? '#a7f070' : '#333c57';
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -this.time * 20;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y - from.r);
      ctx.lineTo(to.x, to.y + to.r);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Setores do mundo já vencidos
    const sectors = world.circles
      ? 'DOIS CÍRCULOS: VENÇA OS 3 DE BAIXO PARA ABRIR OS 3 DE CIMA'
      : world.stages.map((id) => `${ENCOUNTERS[id].name} OK`).join('   ');
    drawText(ctx, sectors, W / 2, 112, { size: 6, align: 'center', color: '#38b764' });

    this.nodes.forEach((node, i) => this.drawNode(ctx, sprites, node, i === this.selected));
    this.drawInfo(ctx);

    if (this.showUnlock && this.time < 3.5) {
      const alpha = Math.min(1, (3.5 - this.time) * 2);
      const reward = BUFFS[world.completionReward];
      ctx.fillStyle = `rgba(26, 28, 44, ${0.9 * alpha})`;
      ctx.fillRect(0, boss.y - 10, W, 64);
      drawText(ctx, 'O CAMINHO ESTÁ LIVRE!', W / 2, boss.y + 2, { size: 12, align: 'center', color: '#e43b8c', alpha });
      drawText(ctx, `${reward.name} DESBLOQUEADA!`, W / 2, boss.y + 26, { size: 7, align: 'center', alpha });
    }
    if (this.showFinalUnlock && this.time < 3.5) {
      const alpha = Math.min(1, (3.5 - this.time) * 2);
      ctx.fillStyle = `rgba(26, 28, 44, ${0.9 * alpha})`;
      ctx.fillRect(0, 190, W, 64);
      drawText(ctx, 'O LEVIATÃ SE APROXIMA', W / 2, 202, { size: 12, align: 'center', color: '#e43b8c', alpha });
      drawText(ctx, 'A FORTALEZA ESTELAR. OITO SEÇÕES.', W / 2, 226, { size: 7, align: 'center', alpha });
    }

    drawText(ctx, this.game.input.touchMode ? 'Toque em um alvo para lutar' : '< > escolher   ENTER lutar   TAB mapa   ESC menu', W / 2, H - 22, { size: 6, align: 'center', color: '#566c86' });
  }

  drawNode(ctx, sprites, node, selected) {
    const { campaign } = this;
    const defeated = campaign.defeated.has(node.id);
    const locked = this.isLocked(node);
    const bob = selected ? Math.sin(this.time * 4) * 3 : 0;

    ctx.fillStyle = 'rgba(26, 28, 44, 0.85)';
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = defeated ? '#38b764' : locked ? '#333c57' : selected ? '#ffcd75' : '#566c86';
    ctx.lineWidth = selected ? 3 : 2;
    ctx.stroke();

    // Ícone limitado ao círculo (sprites grandes não vazam do nó).
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r - 3, 0, Math.PI * 2);
    ctx.clip();
    const alpha = defeated ? 0.3 : locked ? 0.2 : 1;
    sprites.draw(ctx, node.sprite, node.x, node.y + bob, { scale: node.scale, alpha });
    ctx.restore();

    const name = ENCOUNTERS[node.id].name;
    drawText(ctx, name, node.x, node.y + node.r + 8, { size: 7, align: 'center', color: defeated ? '#38b764' : UI_COLORS.text });
    if (defeated) drawText(ctx, 'DERROTADO', node.x, node.y - 4, { size: 7, align: 'center', color: '#a7f070' });
    if (locked) drawText(ctx, 'BLOQUEADO', node.x, node.y - 4, { size: 7, align: 'center', color: '#566c86' });
    if (!defeated && REWARDS[node.id]) {
      const buff = BUFFS[REWARDS[node.id]];
      drawText(ctx, buff.short, node.x, node.y + node.r + 20, { size: 6, align: 'center', color: buff.color });
    }

    if (selected) {
      const r = node.r + 8 + Math.sin(this.time * 8) * 2;
      ctx.strokeStyle = '#ffcd75';
      ctx.lineWidth = 2;
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        ctx.beginPath();
        ctx.moveTo(node.x + sx * r, node.y + sy * (r - 10));
        ctx.lineTo(node.x + sx * r, node.y + sy * r);
        ctx.lineTo(node.x + sx * (r - 10), node.y + sy * r);
        ctx.stroke();
      }
    }
  }

  drawInfo(ctx) {
    const node = this.nodes[this.selected];
    if (!node) return;
    const def = ENCOUNTERS[node.id];
    const y = 448;
    ctx.fillStyle = 'rgba(26, 28, 44, 0.9)';
    ctx.fillRect(20, y, W - 40, 120);
    ctx.strokeStyle = '#566c86';
    ctx.lineWidth = 1;
    ctx.strokeRect(20.5, y + 0.5, W - 41, 119);

    drawText(ctx, def.name, W / 2, y + 12, { size: 12, align: 'center', color: UI_COLORS.boss });
    drawText(ctx, def.description, W / 2, y + 34, { size: 6, align: 'center' });
    drawText(ctx, `${def.phases.length} FASES`, W / 2, y + 50, { size: 6, align: 'center', color: UI_COLORS.muted });

    if (REWARDS[node.id]) {
      const buff = BUFFS[REWARDS[node.id]];
      drawText(ctx, `RECOMPENSA: ${buff.name}`, W / 2, y + 72, { size: 8, align: 'center', color: buff.color });
      drawText(ctx, buff.description, W / 2, y + 90, { size: 6, align: 'center', color: UI_COLORS.muted });
    } else if (node.kind === 'boss') {
      const remaining = this.world.minis.filter((id) => !this.campaign.defeated.has(id)).length;
      const next = this.world.finale ? 'GUARDIÃO DO LEVIATÃ.' : this.world.circles ? 'O CRIADOR DA FROTA.' : `CHEFE DO MUNDO ${this.world.number}.`;
      const text = remaining > 0 ? `DERROTE MAIS ${remaining} MINI-CHEFE(S) PARA LIBERAR` : `${next} VOCÊ ESTÁ PRONTO.`;
      drawText(ctx, text, W / 2, y + 80, { size: 7, align: 'center', color: remaining > 0 ? '#566c86' : '#ffcd75' });
    } else {
      const unlocked = this.campaign.finaleUnlocked;
      const text = unlocked ? 'CHEFE FINAL. BOA SORTE, PILOTO.' : `DERROTE ${ENCOUNTERS[this.world.boss].name} PARA LIBERAR`;
      drawText(ctx, text, W / 2, y + 80, { size: 7, align: 'center', color: unlocked ? '#ffcd75' : '#566c86' });
    }
  }
}
