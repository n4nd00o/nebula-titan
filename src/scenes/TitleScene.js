/**
 * TitleScene — tela inicial com logo, silhueta do chefe e menu.
 *
 * v1.8 (feedback de jogadores: "interfaces cheias, muito texto pequeno"):
 *  - na PRIMEIRA vez o menu tem só INICIAR JOGO, CONTROLES e CONFIGURAÇÕES;
 *  - depois que a pessoa já jogou aparecem CONTINUAR, MUNDO < N >, MAPA,
 *    MEUS BUFFS e DUELO (lista em src/systems/Onboarding.js);
 *  - som, vibração e tela cheia saíram do topo e foram para CONFIGURAÇÕES;
 *  - sem textos pequenos: nada de descrição embaixo de cada opção.
 *
 * Nova campanha: introdução da história → TREINO DE VOO (só até ser concluído
 * uma vez) → Setor 1.
 *
 * No canto superior esquerdo fica uma lupa de busca.
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H, UI_COLORS } from '../config.js';
import { drawText } from '../graphics/text.js';
import { Campaign, WORLDS } from '../systems/Campaign.js';
import { PlayScene, SAVE_KEY, UNLOCK_KEY } from './PlayScene.js';
import { MapScene } from './MapScene.js';
import { ProgressScene } from './ProgressScene.js';
import { BuffsScene } from './BuffsScene.js';
import { ControlsScene } from './ControlsScene.js';
import { SettingsScene } from './SettingsScene.js';
import { TutorialScene } from './TutorialScene.js';
import { openSearch, isSearchOpen } from './SearchOverlay.js';
import { HEART_BOSS } from '../boss/bosses/heart.js';
import { StoryScene } from './StoryScene.js';
import { INTRO } from '../story/story.js';
import { hasPlayed, markPlayed, titleOptionIds, TUTORIAL_KEY } from '../systems/Onboarding.js';

const BOSS_PREVIEW = [
  ['wingL', -66, -8], ['wingR', 66, -8],
  ['hull', 0, 0], ['plate', 0, -3], ['cannon', 0, 45],
];

const LABELS = Object.freeze({
  continue: 'CONTINUAR', new: 'NOVA CAMPANHA', world: 'MUNDO', map: 'MAPA',
  buffs: 'MEUS BUFFS', duel: 'DUELO', controls: 'CONTROLES', settings: 'CONFIGURAÇÕES',
});
/** Menu no computador: poucas opções ficam mais espaçadas. */
const MENU = Object.freeze({ y: 262, gap: 30, gapFew: 44, yFew: 300 });
/** Menu no celular: botões altos, fáceis de tocar. */
const TOUCH_MENU = Object.freeze({ y: 240, gap: 40, h: 34, gapFew: 52, yFew: 290 });
const SEARCH_BUTTON = Object.freeze({ x: 8, y: 8, w: 28, h: 24 });

/** Abre a campanha no ponto certo: setor linear ou mapa de escolha. */
export function resumeCampaign(game, campaign) {
  if (campaign.nextIsStage) game.changeScene(new PlayScene(game, { bossId: campaign.available()[0], campaign }));
  else game.changeScene(new MapScene(game, campaign));
}

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
    const storage = game.storage;
    this.save = Campaign.fromJSON(storage.get(SAVE_KEY, null));
    this.unlocked = Math.max(1, Math.min(WORLDS.length, storage.get(UNLOCK_KEY, 1)));
    this.worldChoice = this.unlocked - 1;
    this.played = hasPlayed(storage, { hasSave: Boolean(this.save), unlocked: this.unlocked });
    this.options = titleOptionIds({ played: this.played, hasSave: Boolean(this.save), unlocked: this.unlocked })
      .map((id) => ({ id, label: id === 'new' && !this.played ? 'INICIAR JOGO' : LABELS[id] }));
    this.selected = 0;
  }

  enter() {
    this.game.starfield.setSpeed(1);
    this.game.starfield.setTheme(WORLDS[0].theme);
    this.game.audio.playMusic('title');
  }

  get current() {
    return this.options[this.selected];
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (isSearchOpen()) return;
    const n = this.options.length;
    if (input.wasPressed('up')) this.move(-1);
    if (input.wasPressed('down')) this.move(1);
    if (this.current.id === 'world') {
      if (input.wasPressed('left')) this.changeWorld(-1);
      if (input.wasPressed('right')) this.changeWorld(1);
    }
    // Lupa (canto superior esquerdo)
    const s = SEARCH_BUTTON;
    if (input.tap && input.tap.x >= s.x && input.tap.x <= s.x + s.w && input.tap.y >= s.y && input.tap.y <= s.y + s.h) {
      this.game.audio.unlock();
      this.game.audio.play('select');
      openSearch({ onSecret: () => this.startSecret() });
      return;
    }
    // Toque/clique em uma opção do menu (no seletor de mundo: bordas trocam o mundo).
    if (input.tap) {
      const m = this.menuLayout;
      const index = Math.floor((input.tap.y - m.y + m.pad) / m.gap);
      if (index >= 0 && index < n) {
        this.selected = index;
        if (this.current.id === 'world' && input.tap.x < W / 2 - 60) this.changeWorld(-1);
        else if (this.current.id === 'world' && input.tap.x > W / 2 + 60) this.changeWorld(1);
        else this.start();
        return;
      }
    }
    if (!input.tap && (input.wasPressed('confirm') || input.wasPressed('fire'))) this.start();
  }

  /** Posição das linhas do menu (no celular, botões mais altos; poucas opções, mais espaço). */
  get menuLayout() {
    const few = this.options.length <= 3;
    if (this.game.input.touchMode) {
      return { y: few ? TOUCH_MENU.yFew : TOUCH_MENU.y, gap: few ? TOUCH_MENU.gapFew : TOUCH_MENU.gap, pad: 12, touch: true };
    }
    return { y: few ? MENU.yFew : MENU.y, gap: few ? MENU.gapFew : MENU.gap, pad: 14, touch: false };
  }

  startSecret() {
    const game = this.game;
    if (game.scene !== this) return;
    game.audio.unlock();
    game.audio.play('buff');
    game.changeScene(new PlayScene(game, { encounter: HEART_BOSS }));
  }

  move(delta) {
    const n = this.options.length;
    this.selected = (this.selected + delta + n) % n;
    this.game.audio.play('select');
  }

  changeWorld(delta) {
    this.worldChoice = (this.worldChoice + delta + this.unlocked) % this.unlocked;
    this.game.audio.play('select');
  }

  /** Nova campanha: história → treino de voo (até ser concluído uma vez) → Setor 1. */
  startNewCampaign() {
    const game = this.game;
    const campaign = new Campaign();
    const firstStage = () => new PlayScene(game, { bossId: campaign.available()[0], campaign });
    const afterStory = game.storage.get(TUTORIAL_KEY, false)
      ? firstStage
      : () => new TutorialScene(game, { next: firstStage });
    markPlayed(game.storage);
    game.changeScene(new StoryScene(game, { pages: INTRO, next: afterStory }));
  }

  start() {
    const game = this.game;
    const back = () => new TitleScene(game);
    game.audio.unlock();
    game.audio.play('select');
    switch (this.current.id) {
      case 'continue':
        resumeCampaign(game, this.save);
        break;
      case 'new':
        this.startNewCampaign();
        break;
      case 'world':
        resumeCampaign(game, Campaign.startingAt(this.worldChoice));
        break;
      case 'buffs':
        game.changeScene(new BuffsScene(game, { buffs: this.save?.buffs ?? new Set(), back }));
        break;
      case 'controls':
        game.changeScene(new ControlsScene(game, { back }));
        break;
      case 'settings':
        game.changeScene(new SettingsScene(game, { back }));
        break;
      case 'map':
        game.changeScene(new ProgressScene(game));
        break;
      default:
        markPlayed(game.storage);
        game.changeScene(new PlayScene(game));
    }
  }

  draw(ctx) {
    const sprites = this.game.sprites;

    // Silhueta do chefe flutuando ao fundo.
    ctx.save();
    ctx.translate(W / 2, 290 + Math.sin(this.time * 1.2) * 8);
    ctx.globalAlpha = 0.25;
    for (const [name, x, y] of BOSS_PREVIEW) sprites.draw(ctx, name, x, y);
    ctx.restore();

    // Logo
    const bob = Math.sin(this.time * 2) * 3;
    drawText(ctx, 'NEBULA', W / 2, 100 + bob, { size: 40, align: 'center', color: UI_COLORS.boss, shadow: '#5d275d' });
    drawText(ctx, 'TITAN', W / 2, 150 + bob, { size: 40, align: 'center', color: UI_COLORS.accent, shadow: '#b13e53' });

    // Menu
    const m = this.menuLayout;
    this.options.forEach((opt, i) => {
      const y = m.y + i * m.gap;
      const active = i === this.selected;
      const label = opt.id === 'world' ? `MUNDO < ${WORLDS[this.worldChoice].number} >` : opt.label;
      if (m.touch) {
        ctx.fillStyle = active ? 'rgba(59, 93, 201, 0.35)' : 'rgba(26, 28, 44, 0.75)';
        ctx.fillRect(W / 2 - 150, y - 11, 300, TOUCH_MENU.h);
        ctx.strokeStyle = active ? UI_COLORS.accent : '#333c57';
        ctx.lineWidth = active ? 2 : 1;
        ctx.strokeRect(W / 2 - 149.5, y - 10.5, 299, TOUCH_MENU.h - 1);
        drawText(ctx, label, W / 2, y + 6, { size: 12, align: 'center', baseline: 'middle', color: active ? UI_COLORS.text : '#94b0c2' });
        return;
      }
      if (active) {
        const blink = Math.floor(this.time * 3) % 2 === 0;
        drawText(ctx, '>', W / 2 - 130, y, { size: 14, color: blink ? UI_COLORS.accent : '#b13e53' });
      }
      drawText(ctx, label, W / 2 - 104, y, { size: 14, color: active ? UI_COLORS.text : '#566c86' });
    });

    if (!this.game.input.touchMode) {
      drawText(ctx, 'ENTER PARA ESCOLHER', W / 2, H - 48, { size: 8, align: 'center', color: '#566c86' });
    }
    this.drawSearchButton(ctx);
  }

  /** Lupa no canto superior esquerdo. */
  drawSearchButton(ctx) {
    const b = SEARCH_BUTTON;
    ctx.fillStyle = 'rgba(26, 28, 44, 0.85)';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = '#566c86';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    const cx = b.x + 12;
    const cy = b.y + 10;
    ctx.strokeStyle = '#94b0c2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.moveTo(cx + 4, cy + 4);
    ctx.lineTo(cx + 9, cy + 9);
    ctx.stroke();
  }
}
