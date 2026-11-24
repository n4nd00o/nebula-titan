/**
 * StoryScene — mostra páginas da história com texto "datilografado" (v1.7).
 *
 * Usada na introdução da campanha, entre os mundos e nos finais de vitória
 * e derrota. Os textos ficam em src/story/story.js; esta cena só desenha.
 *
 * Controles: ENTER/ESPAÇO/toque = mostra o texto todo ou passa a página;
 * ESC = pula a história inteira. Ao terminar, chama `next()` e troca para a
 * cena que ele devolver (a luta, o mapa ou o menu).
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H, UI_COLORS } from '../config.js';
import { drawText } from '../graphics/text.js';
import { WORLDS } from '../systems/Campaign.js';
import { wrapText } from '../story/story.js';

const CHARS_PER_SECOND = 42;
const TEXT_SIZE = 8;
const LINE_HEIGHT = 16;
const MAX_CHARS = Math.floor((W - 72) / TEXT_SIZE); // fonte monoespaçada
/** Ignora entradas logo após abrir, para o ENTER do menu não pular a página. */
const INPUT_DELAY = 0.3;

/** Mesmo desenho da silhueta do Titã na tela inicial. */
const TITAN_PARTS = [
  ['wingL', -66, -8], ['wingR', 66, -8],
  ['hull', 0, 0], ['plate', 0, -3], ['cannon', 0, 45],
];
const CORE_COLORS = ['#e43b8c', '#73eff7', '#ffcd75', '#a7f070', '#ef7d57'];

export class StoryScene {
  /**
   * @param {object} game
   * @param {object} options
   * @param {Array<{title: string, text: string, art?: string}>} options.pages
   * @param {() => object} options.next   cena seguinte
   * @param {object} [options.theme]      tema do fundo estrelado (cores de WORLDS)
   * @param {string} [options.music]      trilha (padrão: 'story')
   * @param {string} [options.label]      rótulo pequeno acima do título
   */
  constructor(game, { pages, next, theme = WORLDS[0].theme, music = 'story', label = 'HISTÓRIA' }) {
    this.game = game;
    this.pages = pages;
    this.next = next;
    this.theme = theme;
    this.music = music;
    this.label = label;
    this.index = 0;
    this.time = 0;
    this.openPage(0);
  }

  enter() {
    this.game.starfield.setSpeed(0.4);
    this.game.starfield.setTheme?.(this.theme);
    this.game.audio.playMusic(this.music);
  }

  exit() {
    this.game.starfield.setSpeed(1);
  }

  get page() {
    return this.pages[this.index];
  }

  openPage(index) {
    this.index = index;
    this.pageTime = 0;
    this.shown = 0;
    this.lines = wrapText(this.page.text, MAX_CHARS);
    this.totalChars = this.lines.reduce((sum, line) => sum + line.length, 0);
  }

  get pageDone() {
    return this.shown >= this.totalChars;
  }

  update(dt) {
    this.time += dt;
    this.pageTime += dt;
    // Efeito máquina de escrever, com um "tic" a cada poucas letras.
    if (!this.pageDone) {
      const before = Math.floor(this.shown);
      this.shown = Math.min(this.totalChars, this.shown + dt * CHARS_PER_SECOND);
      if (Math.floor(this.shown / 3) > Math.floor(before / 3)) this.game.audio.play('type');
    }
    if (this.time < INPUT_DELAY) return;
    const input = this.game.input;
    if (input.wasPressed('pause') || input.wasPressed('quit')) {
      this.finish();
      return;
    }
    if (input.tap || input.wasPressed('confirm') || input.wasPressed('fire')) this.advance();
  }

  /** Primeiro mostra o texto todo; depois passa para a próxima página. */
  advance() {
    if (!this.pageDone) {
      this.shown = this.totalChars;
      return;
    }
    this.game.audio.play('select');
    if (this.index + 1 < this.pages.length) this.openPage(this.index + 1);
    else this.finish();
  }

  finish() {
    if (this.done) return;
    this.done = true;
    this.game.changeScene(this.next());
  }

  draw(ctx) {
    const accent = this.theme.accent ?? UI_COLORS.accent;
    this.drawArt(ctx, this.page.art, accent);

    // Moldura do texto: cresce com o número de linhas da página.
    const boxH = Math.max(150, 76 + this.lines.length * LINE_HEIGHT);
    ctx.fillStyle = 'rgba(26, 28, 44, 0.88)';
    ctx.fillRect(24, 262, W - 48, boxH);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 262, W - 48, boxH);
    const footY = 262 + boxH + 18;

    drawText(ctx, this.label, W / 2, 274, { size: 6, align: 'center', color: UI_COLORS.muted });
    drawText(ctx, this.page.title, W / 2, 290, { size: 12, align: 'center', color: accent });

    let left = Math.floor(this.shown);
    this.lines.forEach((line, i) => {
      if (left <= 0) return;
      const visible = line.slice(0, left);
      left -= line.length;
      drawText(ctx, visible, 36, 322 + i * LINE_HEIGHT, { size: TEXT_SIZE, color: UI_COLORS.text });
    });

    // Páginas (bolinhas) e dica de controle.
    const n = this.pages.length;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i === this.index ? accent : '#333c57';
      ctx.fillRect(W / 2 - n * 8 + i * 16 + 4, footY, 8, 8);
    }
    if (this.pageDone && Math.floor(this.pageTime * 2) % 2 === 0) {
      const last = this.index === n - 1;
      drawText(ctx, last ? 'ENTER  começar' : 'ENTER  continuar', W / 2, footY + 20, { size: 8, align: 'center' });
    }
    drawText(ctx, 'ESC  pular história', W / 2, footY + 40, { size: 6, align: 'center', color: '#566c86' });
  }

  /** Ilustração simples no topo da página, feita com os sprites do jogo. */
  drawArt(ctx, art, accent) {
    const sprites = this.game.sprites;
    const t = this.time;
    const cx = W / 2;
    const cy = 150;
    ctx.save();
    switch (art) {
      case 'titan':
        ctx.translate(cx, cy + Math.sin(t * 1.2) * 6);
        ctx.globalAlpha = 0.9;
        for (const [name, x, y] of TITAN_PARTS) sprites.draw(ctx, name, x, y);
        break;
      case 'omega':
        ctx.translate(cx, cy + Math.sin(t * 1.5) * 5);
        sprites.draw(ctx, 'omega', 0, 0, { alpha: 0.9 });
        break;
      case 'cores':
        // Os núcleos de energia (buffs) girando em volta da nave.
        CORE_COLORS.forEach((color, i) => {
          const a = t * 1.2 + (i / CORE_COLORS.length) * Math.PI * 2;
          const x = cx + Math.cos(a) * 70;
          const y = cy + Math.sin(a) * 34;
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.25;
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
        });
        sprites.draw(ctx, 'player', cx, cy, { scale: 2 });
        break;
      case 'colonies':
        // Planetas das colônias; as luzes piscam.
        [[-120, 20, 26, '#3b5dc9'], [0, -10, 38, '#38b764'], [120, 26, 22, '#b13e53']].forEach(([x, y, r, color], i) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(cx + x, cy + y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(26, 28, 44, 0.45)';
          ctx.beginPath();
          ctx.arc(cx + x + r * 0.35, cy + y + r * 0.2, r, 0, Math.PI * 2);
          ctx.fill();
          for (let k = 0; k < 4; k++) {
            const on = Math.floor(t * 2 + k + i) % 3 !== 0;
            ctx.fillStyle = on ? '#ffcd75' : '#333c57';
            ctx.fillRect(cx + x - r * 0.5 + k * r * 0.3, cy + y - 2 + (k % 2) * 6, 3, 3);
          }
        });
        break;
      case 'wreck':
        // NT-01 à deriva, piscando como sinal fraco.
        ctx.translate(cx, cy);
        ctx.rotate(0.5 + Math.sin(t) * 0.1);
        sprites.draw(ctx, 'player', 0, 0, { scale: 2, alpha: Math.floor(t * 3) % 2 ? 0.35 : 0.75 });
        break;
      default:
        // A nave da Vega subindo, com o rastro do motor.
        ctx.translate(cx, cy + Math.sin(t * 2) * 4);
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.5 + Math.sin(t * 20) * 0.2;
        ctx.fillRect(-3, 22, 6, 10 + Math.sin(t * 25) * 4);
        ctx.globalAlpha = 1;
        sprites.draw(ctx, 'player', 0, 0, { scale: 2 });
    }
    ctx.restore();
  }
}
