/**
 * TitleScene — tela inicial com logo, silhueta do chefe e menu de modos.
 *
 * Opções (as duas do meio só aparecem quando fazem sentido):
 *  - CONTINUAR: retoma a campanha salva (salva após cada vitória).
 *  - NOVA CAMPANHA: 4 mundos, do Setor 1 ao Leviatã.
 *  - MUNDO < N >: começa direto em um mundo já alcançado, com os buffs dos
 *    mundos anteriores (←/→ escolhe o mundo).
 *  - MAPA DE PROGRESSO: os 4 mundos e as fases de cada um; rejoga fases vencidas.
 *  - DUELO COM O TITÃ: luta direta contra o Nebula Titan, sem buffs.
 *
 * No topo ficam botões de toque: SOM, VIBRAR (celulares com vibração) e TELA CHEIA.
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H, UI_COLORS } from '../config.js';
import { drawText } from '../graphics/text.js';
import { Campaign, WORLDS } from '../systems/Campaign.js';
import { PlayScene, SAVE_KEY, UNLOCK_KEY } from './PlayScene.js';
import { MapScene } from './MapScene.js';
import { ProgressScene } from './ProgressScene.js';
import { canVibrate, vibrationEnabled, toggleVibration } from '../core/Haptics.js';

const BOSS_PREVIEW = [
  ['wingL', -66, -8], ['wingR', 66, -8],
  ['hull', 0, 0], ['plate', 0, -3], ['cannon', 0, 45],
];

const MENU_Y = 336;
const MENU_GAP = 30;

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
    const record = storage.get('hiscoreCampaign', 0);

    this.options = [];
    if (this.save) {
      const w = this.save.world;
      this.options.push({ id: 'continue', label: 'CONTINUAR', detail: `Mundo ${w.number}: ${w.name} · ${this.save.score} pts` });
    }
    this.options.push({ id: 'new', label: 'NOVA CAMPANHA', detail: `4 mundos, 12 mini-chefes, 4 chefes e o Leviatã · RECORDE ${record}` });
    if (this.unlocked > 1) this.options.push({ id: 'world', label: 'MUNDO', detail: '' });
    this.options.push({ id: 'map', label: 'MAPA DE PROGRESSO', detail: 'Veja onde você está e rejogue fases vencidas (treino)' });
    this.options.push({ id: 'duel', label: 'DUELO COM O TITÃ', detail: `Luta direta contra o Nebula Titan · RECORDE ${storage.get('hiscore', 0)}` });
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
    const n = this.options.length;
    if (input.wasPressed('up')) this.move(-1);
    if (input.wasPressed('down')) this.move(1);
    if (this.current.id === 'world') {
      if (input.wasPressed('left')) this.changeWorld(-1);
      if (input.wasPressed('right')) this.changeWorld(1);
    }
    // Botões do topo (som, vibração, tela cheia)
    const top = input.tap ? this.topButtons().find((b) => input.tap.x >= b.x && input.tap.x <= b.x + b.w && input.tap.y >= b.y && input.tap.y <= b.y + b.h) : null;
    if (top) {
      top.action();
      this.game.audio.play('select');
      return;
    }
    // Toque/clique em uma opção do menu (no seletor de mundo: bordas trocam o mundo).
    if (input.tap) {
      const index = Math.floor((input.tap.y - MENU_Y + 12) / MENU_GAP);
      if (index >= 0 && index < n) {
        this.selected = index;
        if (this.current.id === 'world' && input.tap.x < W / 2 - 60) this.changeWorld(-1);
        else if (this.current.id === 'world' && input.tap.x > W / 2 + 90) this.changeWorld(1);
        else this.start();
        return;
      }
    }
    if (!input.tap && (input.wasPressed('confirm') || input.wasPressed('fire'))) this.start();
  }

  /** Botões de toque no topo da tela (da direita para a esquerda). */
  topButtons() {
    const game = this.game;
    const buttons = [{ id: 'sound', label: game.audio.muted ? 'SOM OFF' : 'SOM ON', action: () => game.audio.toggleMute() }];
    if (canVibrate()) {
      buttons.push({ id: 'vibe', label: vibrationEnabled(game.storage) ? 'VIBRA ON' : 'VIBRA OFF', action: () => toggleVibration(game.storage) });
    }
    if (game.fullscreenSupported) {
      buttons.push({ id: 'full', label: game.isFullscreen ? 'SAIR TELA' : 'TELA CHEIA', action: () => game.toggleFullscreen() });
    }
    let x = W - 8;
    return buttons.map((b) => {
      const w = b.label.length * 6 + 16;
      x -= w;
      const rect = { ...b, x, y: 8, w, h: 24 };
      x -= 6;
      return rect;
    });
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

  start() {
    const game = this.game;
    game.audio.unlock();
    game.audio.play('select');
    switch (this.current.id) {
      case 'continue':
        resumeCampaign(game, this.save);
        break;
      case 'new': {
        // A campanha começa pelos setores obrigatórios (sem mapa até lá).
        const campaign = new Campaign();
        game.changeScene(new PlayScene(game, { bossId: campaign.available()[0], campaign }));
        break;
      }
      case 'world':
        resumeCampaign(game, Campaign.startingAt(this.worldChoice));
        break;
      case 'map':
        game.changeScene(new ProgressScene(game));
        break;
      default:
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
    drawText(ctx, 'NEBULA', W / 2, 90 + bob, { size: 40, align: 'center', color: UI_COLORS.boss, shadow: '#5d275d' });
    drawText(ctx, 'TITAN', W / 2, 140 + bob, { size: 40, align: 'center', color: UI_COLORS.accent, shadow: '#b13e53' });
    drawText(ctx, 'QUATRO MUNDOS. DEZESSEIS GUARDIÕES. UM LEVIATÃ.', W / 2, 200, { size: 7, align: 'center', color: UI_COLORS.muted });

    // Menu
    this.options.forEach((opt, i) => {
      const y = MENU_Y + i * MENU_GAP;
      const active = i === this.selected;
      if (active) {
        const blink = Math.floor(this.time * 3) % 2 === 0;
        drawText(ctx, '>', W / 2 - 130, y, { size: 12, color: blink ? UI_COLORS.accent : '#b13e53' });
      }
      let label = opt.label;
      let detail = opt.detail;
      if (opt.id === 'world') {
        const w = WORLDS[this.worldChoice];
        label = `MUNDO < ${w.number} >`;
        detail = `${w.name} · começa com os buffs dos mundos anteriores`;
      }
      drawText(ctx, label, W / 2 - 110, y, { size: 12, color: active ? UI_COLORS.text : '#566c86' });
      if (active) drawText(ctx, detail, W / 2 - 110, y + 15, { size: 5, color: UI_COLORS.muted });
    });

    // Controles: texto de teclado ou de toque, conforme o aparelho.
    const touch = this.game.input.touchMode;
    const controls = touch
      ? ['ARRASTE o dedo para mover (tiro automático)', 'Botões BOMBA e DASH no canto · 2º dedo = dash']
      : ['SETAS/WASD mover   ESPAÇO atirar   SHIFT foco', 'C dash   X bomba   P pausa   M som   F tela cheia'];
    controls.forEach((line, i) => {
      drawText(ctx, line, W / 2, 512 + i * 14, { size: 6, align: 'center', color: UI_COLORS.muted });
    });
    drawText(ctx, '(dash e bomba são liberados na campanha)', W / 2, 542, { size: 5, align: 'center', color: '#566c86' });

    drawText(ctx, touch ? 'Toque em uma opção' : '^ v escolher   ENTER confirmar', W / 2, 566, { size: 6, align: 'center', color: '#566c86' });

    for (const b of this.topButtons()) {
      ctx.fillStyle = 'rgba(26, 28, 44, 0.85)';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#566c86';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
      drawText(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2, { size: 6, align: 'center', baseline: 'middle', color: UI_COLORS.muted });
    }
    drawText(ctx, 'Inspirado nos clássicos arcade dos anos 80', W / 2, H - 28, { size: 6, align: 'center', color: '#566c86' });
  }
}
