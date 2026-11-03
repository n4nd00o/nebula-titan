/**
 * MapScene — "Rota de Ataque": o jogador escolhe o próximo alvo da campanha.
 *
 * Três mini-chefes na base do mapa, o Nebula Titan no topo (bloqueado até
 * os três caírem). Cada nó mostra o buff que concede, o que transforma a
 * ordem das lutas em uma decisão estratégica.
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H, UI_COLORS } from '../config.js';
import { drawText } from '../graphics/text.js';
import { BOSSES } from '../boss/bosses/index.js';
import { BUFFS, REWARDS, MINI_BOSS_IDS } from '../systems/Campaign.js';
import { PlayScene } from './PlayScene.js';
import { TitleScene } from './TitleScene.js';

const NODES = [
  { id: 'sentinel', x: 90, y: 340, sprite: 'sentinel', scale: 0.75 },
  { id: 'hive', x: W / 2, y: 372, sprite: 'hive', scale: 0.7 },
  { id: 'reaper', x: W - 90, y: 340, sprite: 'reaper', scale: 0.75 },
  { id: 'titan', x: W / 2, y: 240, sprite: 'hull', scale: 0.8 },
  { id: 'leviathan', x: W / 2, y: 140, sprite: 'bridge', scale: 0.75 },
];
const NODE_RADIUS = 40;

export class MapScene {
  constructor(game, campaign) {
    this.game = game;
    this.campaign = campaign;
    this.time = 0;
    const available = campaign.available();
    this.selected = NODES.findIndex((n) => n.id === available[0]);
    // Anúncios únicos quando o Titã e o Leviatã são liberados.
    this.showUnlock = campaign.titanUnlocked && !campaign.unlockShown;
    campaign.unlockShown = campaign.titanUnlocked;
    this.showFinalUnlock = campaign.leviathanUnlocked && !campaign.finalUnlockShown;
    campaign.finalUnlockShown = campaign.leviathanUnlocked;
  }

  enter() {
    this.game.starfield.setSpeed(0.6);
    this.game.audio.setTempo(1);
    this.game.audio.playMusic('map');
  }

  get availableIndexes() {
    const ids = this.campaign.available();
    return NODES.map((n, i) => (ids.includes(n.id) ? i : -1)).filter((i) => i >= 0);
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    const options = this.availableIndexes;
    const pos = options.indexOf(this.selected);

    if (input.wasPressed('left') || input.wasPressed('up')) this.moveSelection(options, pos - 1);
    if (input.wasPressed('right') || input.wasPressed('down')) this.moveSelection(options, pos + 1);

    // Toque/clique: escolher e iniciar o nó tocado.
    if (input.tap) {
      const hit = NODES.findIndex((n) => Math.hypot(n.x - input.tap.x, n.y - input.tap.y) < NODE_RADIUS);
      if (options.includes(hit)) {
        this.selected = hit;
        this.start();
        return;
      }
    }

    if (input.wasPressed('confirm') || input.wasPressed('fire')) this.start();
    else if (input.wasPressed('pause') || input.wasPressed('quit')) this.game.changeScene(new TitleScene(this.game));
  }

  moveSelection(options, index) {
    if (options.length === 0) return;
    this.selected = options[(index + options.length) % options.length];
    this.game.audio.play('select');
  }

  start() {
    const node = NODES[this.selected];
    if (!node || !this.campaign.canFight(node.id)) return;
    this.game.audio.play('select');
    this.game.changeScene(new PlayScene(this.game, { bossId: node.id, campaign: this.campaign }));
  }

  draw(ctx) {
    const { campaign } = this;
    const sprites = this.game.sprites;

    drawText(ctx, 'ROTA DE ATAQUE', W / 2, 28, { size: 16, align: 'center', color: UI_COLORS.accent });
    drawText(ctx, 'Escolha o próximo alvo. A ordem importa!', W / 2, 54, { size: 6, align: 'center', color: UI_COLORS.muted });
    drawText(ctx, `PONTOS ${String(campaign.score).padStart(7, '0')}`, W / 2, 72, { size: 7, align: 'center' });

    // Buffs já conquistados
    const owned = [...campaign.buffs];
    drawText(ctx, owned.length ? 'BUFFS:' : 'SEM BUFFS AINDA', 14, 96, { size: 6, color: UI_COLORS.muted });
    let bx = 60;
    for (const id of owned) {
      drawText(ctx, BUFFS[id].short, bx, 96, { size: 6, color: BUFFS[id].color });
      bx += BUFFS[id].short.length * 6 + 12;
    }

    // Ligações: mini-chefes -> Titã -> Leviatã
    const titan = NODES[3];
    const leviathan = NODES[4];
    const links = [
      ...NODES.slice(0, 3).map((n) => [n, titan, campaign.defeated.has(n.id)]),
      [titan, leviathan, campaign.defeated.has('titan')],
    ];
    for (const [from, to, done] of links) {
      ctx.strokeStyle = done ? '#a7f070' : '#333c57';
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -this.time * 20;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y - NODE_RADIUS);
      ctx.lineTo(to.x, to.y + NODE_RADIUS);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Setores preparatórios já vencidos + vidas
    drawText(ctx, 'SETOR 1 OK   SETOR 2 OK', W / 2, 428, { size: 6, align: 'center', color: '#38b764' });
    drawText(ctx, `VIDAS ${campaign.lives}/5   MORTES ${campaign.deaths}`, W - 14, 96, { size: 6, align: 'right', color: UI_COLORS.muted });

    NODES.forEach((node, i) => this.drawNode(ctx, sprites, node, i === this.selected));
    this.drawInfo(ctx);

    if (this.showUnlock && this.time < 3.5) {
      const alpha = Math.min(1, (3.5 - this.time) * 2);
      ctx.fillStyle = `rgba(26, 28, 44, ${0.9 * alpha})`;
      ctx.fillRect(0, 230, W, 64);
      drawText(ctx, 'O CAMINHO ESTÁ LIVRE!', W / 2, 242, { size: 12, align: 'center', color: '#e43b8c', alpha });
      drawText(ctx, 'BOMBA DE PULSO DESBLOQUEADA (TECLA X)', W / 2, 266, { size: 7, align: 'center', alpha });
    }
    if (this.showFinalUnlock && this.time < 3.5) {
      const alpha = Math.min(1, (3.5 - this.time) * 2);
      ctx.fillStyle = `rgba(26, 28, 44, ${0.9 * alpha})`;
      ctx.fillRect(0, 190, W, 64);
      drawText(ctx, 'O LEVIATÃ SE APROXIMA', W / 2, 202, { size: 12, align: 'center', color: '#e43b8c', alpha });
      drawText(ctx, 'A FORTALEZA ESTELAR. OITO SEÇÕES.', W / 2, 226, { size: 7, align: 'center', alpha });
    }

    drawText(ctx, '< > escolher   ENTER lutar   ESC menu', W / 2, H - 22, { size: 6, align: 'center', color: '#566c86' });
  }

  drawNode(ctx, sprites, node, selected) {
    const { campaign } = this;
    const defeated = campaign.defeated.has(node.id);
    const locked = (node.id === 'titan' && !campaign.titanUnlocked) || (node.id === 'leviathan' && !campaign.leviathanUnlocked);
    const bob = selected ? Math.sin(this.time * 4) * 3 : 0;

    ctx.fillStyle = 'rgba(26, 28, 44, 0.85)';
    ctx.beginPath();
    ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = defeated ? '#38b764' : locked ? '#333c57' : selected ? '#ffcd75' : '#566c86';
    ctx.lineWidth = selected ? 3 : 2;
    ctx.stroke();

    const alpha = defeated ? 0.3 : locked ? 0.2 : 1;
    sprites.draw(ctx, node.sprite, node.x, node.y + bob, { scale: node.scale, alpha });

    const name = BOSSES[node.id].name;
    drawText(ctx, name, node.x, node.y + NODE_RADIUS + 8, { size: 7, align: 'center', color: defeated ? '#38b764' : UI_COLORS.text });
    if (defeated) drawText(ctx, 'DERROTADO', node.x, node.y - 4, { size: 7, align: 'center', color: '#a7f070' });
    if (locked) drawText(ctx, 'BLOQUEADO', node.x, node.y - 4, { size: 7, align: 'center', color: '#566c86' });
    if (!defeated && REWARDS[node.id]) {
      const buff = BUFFS[REWARDS[node.id]];
      drawText(ctx, buff.short, node.x, node.y + NODE_RADIUS + 20, { size: 6, align: 'center', color: buff.color });
    }

    if (selected) {
      const r = NODE_RADIUS + 8 + Math.sin(this.time * 8) * 2;
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
    const node = NODES[this.selected];
    if (!node) return;
    const def = BOSSES[node.id];
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
    } else if (node.id === 'titan') {
      const remaining = MINI_BOSS_IDS.filter((id) => !this.campaign.defeated.has(id)).length;
      const text = remaining > 0 ? `DERROTE MAIS ${remaining} MINI-CHEFE(S) PARA LIBERAR` : 'GUARDIÃO DO LEVIATÃ. VOCÊ ESTÁ PRONTO.';
      drawText(ctx, text, W / 2, y + 80, { size: 7, align: 'center', color: remaining > 0 ? '#566c86' : '#ffcd75' });
    } else {
      const text = this.campaign.leviathanUnlocked ? 'CHEFE FINAL. BOA SORTE, PILOTO.' : 'DERROTE O NEBULA TITAN PARA LIBERAR';
      drawText(ctx, text, W / 2, y + 80, { size: 7, align: 'center', color: this.campaign.leviathanUnlocked ? '#ffcd75' : '#566c86' });
    }
  }
}
