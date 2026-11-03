/**
 * Game — orquestrador principal.
 *
 * Responsabilidades:
 *  - criar os serviços compartilhados (entrada, áudio, sprites, armazenamento);
 *  - rodar o GAME LOOP com passo fixo (fixed timestep);
 *  - gerenciar a CENA ativa (máquina de estados: Título -> Jogo -> ...).
 *
 * Por que passo fixo? A física/lógica roda sempre em incrementos de 1/60 s,
 * independentemente da taxa de atualização do monitor (60 Hz, 144 Hz...).
 * Isso torna o jogo determinístico e justo em qualquer máquina.
 */
import { GAME_WIDTH, GAME_HEIGHT, FIXED_STEP, MAX_FRAME_TIME, DEBUG, STORAGE_PREFIX } from '../config.js';
import { Input } from './Input.js';
import { AudioEngine } from './AudioEngine.js';
import { Storage } from './Storage.js';
import { SpriteBank } from '../graphics/SpriteBank.js';
import { Starfield } from '../systems/Starfield.js';
import { drawText } from '../graphics/text.js';
import { TitleScene } from '../scenes/TitleScene.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.storage = new Storage(STORAGE_PREFIX);
    this.input = new Input(window, canvas);
    this.audio = new AudioEngine(this.storage);
    this.sprites = new SpriteBank();
    this.starfield = new Starfield(GAME_WIDTH, GAME_HEIGHT);

    this.scene = null;
    this.accumulator = 0;
    this.lastTime = 0;
    this.fps = 0;
    this.fpsFrames = 0;
    this.fpsTime = 0;
    this.loop = this.loop.bind(this);

    window.addEventListener('resize', () => this.resize());
    this.resize();

    // Áudio só pode iniciar após interação do usuário (política dos navegadores).
    const unlock = () => this.audio.unlock();
    window.addEventListener('keydown', unlock);
    window.addEventListener('pointerdown', unlock);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.scene?.onBlur?.();
    });
    window.addEventListener('blur', () => this.scene?.onBlur?.());
  }

  async start() {
    await Promise.all([this.sprites.build(), this.loadFonts()]);
    this.changeScene(new TitleScene(this));
    requestAnimationFrame((time) => {
      this.lastTime = time;
      requestAnimationFrame(this.loop);
    });
  }

  async loadFonts() {
    if (!document.fonts?.load) return;
    const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
    try {
      await Promise.race([document.fonts.load('16px "Press Start 2P"'), timeout]);
    } catch {
      // Sem a fonte, usa a fonte monoespaçada de fallback.
    }
  }

  changeScene(scene) {
    this.scene?.exit?.();
    this.scene = scene;
    this.scene.enter?.();
  }

  loop(time) {
    let frameTime = (time - this.lastTime) / 1000;
    this.lastTime = time;
    if (frameTime > MAX_FRAME_TIME) frameTime = MAX_FRAME_TIME;

    this.accumulator += frameTime;
    while (this.accumulator >= FIXED_STEP) {
      this.update(FIXED_STEP);
      this.accumulator -= FIXED_STEP;
    }
    this.draw();
    this.trackFps(frameTime);
    requestAnimationFrame(this.loop);
  }

  update(dt) {
    if (this.input.wasPressed('mute')) this.audio.toggleMute();
    this.starfield.update(dt);
    this.scene.update(dt);
    this.input.endStep();
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#05050d';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.starfield.draw(ctx);
    this.scene.draw(ctx);
    if (this.audio.muted) drawText(ctx, 'SOM OFF (M)', GAME_WIDTH / 2, GAME_HEIGHT - 12, { size: 6, align: 'center', color: '#566c86' });
    if (DEBUG) drawText(ctx, `${this.fps} FPS`, GAME_WIDTH - 6, GAME_HEIGHT - 12, { size: 6, align: 'right', color: '#a7f070' });
  }

  trackFps(frameTime) {
    this.fpsFrames++;
    this.fpsTime += frameTime;
    if (this.fpsTime >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsTime);
      this.fpsFrames = 0;
      this.fpsTime = 0;
    }
  }

  /** Escala o canvas para caber na janela mantendo a proporção. */
  resize() {
    const scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
    this.canvas.style.width = `${Math.floor(GAME_WIDTH * scale)}px`;
    this.canvas.style.height = `${Math.floor(GAME_HEIGHT * scale)}px`;
  }
}
