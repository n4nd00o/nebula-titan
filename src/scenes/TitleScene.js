/**
 * TitleScene — tela inicial com logo, silhueta do chefe e menu de modos.
 *
 * Modos:
 *  - CAMPANHA: 2 setores de ondas -> 3 mini-chefes (ordem à escolha) -> Titã -> Leviatã.
 *  - DUELO: luta direta contra o Nebula Titan, sem buffs.
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H, UI_COLORS } from '../config.js';
import { drawText } from '../graphics/text.js';
import { Campaign } from '../systems/Campaign.js';
import { PlayScene } from './PlayScene.js';

const BOSS_PREVIEW = [
  ['wingL', -66, -8], ['wingR', 66, -8],
  ['hull', 0, 0], ['plate', 0, -3], ['cannon', 0, 45],
];

const MENU_Y = 400;
const MENU_GAP = 34;

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.selected = 0;
    this.options = [
      { label: 'CAMPANHA', detail: '2 setores, 3 mini-chefes, Titã e Leviatã', record: game.storage.get('hiscoreCampaign', 0) },
      { label: 'DUELO COM O TITÃ', detail: 'Luta direta contra o chefe final', record: game.storage.get('hiscore', 0) },
    ];
  }

  enter() {
    this.game.starfield.setSpeed(1);
    this.game.audio.playMusic('title');
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('up') || input.wasPressed('down')) {
      this.selected = 1 - this.selected;
      this.game.audio.play('select');
    }
    // Toque/clique em uma opção do menu.
    if (input.tap) {
      const index = Math.floor((input.tap.y - MENU_Y + 12) / MENU_GAP);
      if (index === 0 || index === 1) {
        this.selected = index;
        this.start();
        return;
      }
    }
    if (input.wasPressed('confirm') || input.wasPressed('fire')) this.start();
  }

  start() {
    const game = this.game;
    game.audio.unlock();
    game.audio.play('select');
    if (this.selected === 0) {
      // A campanha começa pelos setores obrigatórios (sem mapa até lá).
      const campaign = new Campaign();
      game.changeScene(new PlayScene(game, { bossId: campaign.available()[0], campaign }));
    } else {
      game.changeScene(new PlayScene(game));
    }
  }

  draw(ctx) {
    const sprites = this.game.sprites;

    // Silhueta do chefe flutuando ao fundo.
    ctx.save();
    ctx.translate(W / 2, 300 + Math.sin(this.time * 1.2) * 8);
    ctx.globalAlpha = 0.25;
    for (const [name, x, y] of BOSS_PREVIEW) sprites.draw(ctx, name, x, y);
    ctx.restore();

    // Logo
    const bob = Math.sin(this.time * 2) * 3;
    drawText(ctx, 'NEBULA', W / 2, 100 + bob, { size: 40, align: 'center', color: UI_COLORS.boss, shadow: '#5d275d' });
    drawText(ctx, 'TITAN', W / 2, 150 + bob, { size: 40, align: 'center', color: UI_COLORS.accent, shadow: '#b13e53' });
    drawText(ctx, 'SETORES, GUARDIÕES E UMA FORTALEZA ESTELAR.', W / 2, 210, { size: 7, align: 'center', color: UI_COLORS.muted });

    // Menu
    this.options.forEach((opt, i) => {
      const y = MENU_Y + i * MENU_GAP;
      const active = i === this.selected;
      if (active) {
        const blink = Math.floor(this.time * 3) % 2 === 0;
        drawText(ctx, '>', W / 2 - 130, y, { size: 12, color: blink ? UI_COLORS.accent : '#b13e53' });
      }
      drawText(ctx, opt.label, W / 2 - 110, y, { size: 12, color: active ? UI_COLORS.text : '#566c86' });
      if (active) {
        drawText(ctx, `${opt.detail}  ·  RECORDE ${opt.record}`, W / 2 - 110, y + 16, { size: 6, color: UI_COLORS.muted });
      }
    });

    const controls = [
      'SETAS/WASD mover   ESPAÇO atirar   SHIFT foco',
      'C dash   X bomba   P pausa   M som',
    ];
    controls.forEach((line, i) => {
      drawText(ctx, line, W / 2, 500 + i * 14, { size: 6, align: 'center', color: UI_COLORS.muted });
    });
    drawText(ctx, '(dash e bomba são liberados na campanha)', W / 2, 530, { size: 5, align: 'center', color: '#566c86' });

    drawText(ctx, '^ v escolher   ENTER confirmar', W / 2, 560, { size: 6, align: 'center', color: '#566c86' });
    drawText(ctx, 'Inspirado nos clássicos arcade dos anos 80', W / 2, H - 28, { size: 6, align: 'center', color: '#566c86' });
  }
}
