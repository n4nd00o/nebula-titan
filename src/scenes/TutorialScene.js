/**
 * TutorialScene — "TREINO DE VOO" (v1.8).
 *
 * Feedback de jogadores: o jogo soltava a pessoa no Setor 1 sem ensinar os
 * controles. Agora, na primeira campanha, antes do Setor 1, há um treino
 * curto e jogável, com a tecla desenhada na tela:
 *   1. MOVA A NAVE   (setas/WASD; no celular, arrastar o dedo)
 *   2. DESTRUA OS ALVOS (atirar; no celular o tiro é automático)
 *   3. PAUSE O JOGO  (P/ESC; não existe no celular, que tem o botão)
 * ENTER (ou o botão PULAR) pula o treino. Ninguém morre aqui: não há tiros inimigos.
 *
 * Os passos são lógica pura em src/systems/Onboarding.js; esta cena só joga e desenha.
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H, UI_COLORS } from '../config.js';
import { drawText } from '../graphics/text.js';
import { drawKeyCap } from '../graphics/keyboard.js';
import { Player } from '../entities/Player.js';
import { PlayerBullet } from '../entities/projectiles.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { circleOverlap } from '../systems/Collision.js';
import { WORLDS } from '../systems/Campaign.js';
import {
  createTutorial, tutorialEvent, currentStep, TUTORIAL_KEY, TUTORIAL_TARGETS, TUTORIAL_MOVE_GOAL, markPlayed,
} from '../systems/Onboarding.js';

const SKIP = Object.freeze({ x: W - 110, y: 8, w: 102, h: 34 });
const DONE_TIME = 1.6; // segundos de "PRONTO!" antes de seguir
const TARGET_HP = 3;

const inside = (p, r) => p && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

export class TutorialScene {
  /** @param {{next: () => object}} options cena que vem depois do treino */
  constructor(game, { next }) {
    this.game = game;
    this.next = next;
    this.input = game.input; // o Player lê a entrada por aqui
    this.touch = Boolean(game.input.touchMode);
    this.state = createTutorial({ touch: this.touch });
    this.player = new Player();
    this.playerBullets = [];
    this.targets = [];
    this.particles = new ParticleSystem();
    this.time = 0;
    this.doneTime = 0;
    this.flash = 0;
    this.finished = false;
  }

  enter() {
    this.game.starfield.setSpeed(1);
    this.game.starfield.setTheme?.(WORLDS[0].theme);
    this.game.audio.playMusic('map');
  }

  /** Chamado pelo Player quando ele atira. */
  firePlayerShot(player) {
    this.playerBullets.push(new PlayerBullet(player.x, player.y - 18));
    this.game.audio.play('shoot');
  }

  update(dt) {
    this.time += dt;
    const input = this.input;
    if (inside(input.tap, SKIP) || (!input.tap && input.wasPressed('confirm') && !this.state.done)) {
      this.finish();
      return;
    }
    if (this.state.done) {
      this.doneTime += dt;
      this.particles.update(dt);
      if (this.doneTime >= DONE_TIME) this.finish();
      return;
    }
    const step = currentStep(this.state);
    if (step.id === 'pause' && input.wasPressed('pause')) this.advance({ type: 'paused' });

    const before = { x: this.player.x, y: this.player.y };
    this.player.update(dt, this);
    const moved = Math.hypot(this.player.x - before.x, this.player.y - before.y);
    if (moved > 0) this.advance({ type: 'moved', distance: moved });

    if (step.id === 'shoot' && this.targets.length === 0) this.spawnTargets();
    this.updateTargets(dt);
    this.particles.update(dt);
    this.flash = Math.max(0, this.flash - dt);
  }

  advance(event) {
    const before = this.state.index;
    this.state = tutorialEvent(this.state, event);
    if (this.state.index !== before) {
      this.flash = 0.6;
      this.game.audio.play(this.state.done ? 'victory' : 'powerup');
    }
  }

  spawnTargets() {
    for (let i = 0; i < TUTORIAL_TARGETS; i++) {
      this.targets.push({ x: W / 2 + (i - 1) * 120, y: 200, baseY: 200, phase: i, hp: TARGET_HP, hit: 0 });
    }
  }

  updateTargets(dt) {
    for (const b of this.playerBullets) b.update(dt);
    for (const t of this.targets) {
      t.y = t.baseY + Math.sin(this.time * 2 + t.phase) * 14;
      t.hit = Math.max(0, t.hit - dt);
      for (const b of this.playerBullets) {
        if (b.dead || !circleOverlap(b.x, b.y, b.radius, t.x, t.y, 16)) continue;
        b.dead = true;
        t.hp -= 1;
        t.hit = 0.1;
        this.game.audio.play('hit');
      }
      if (t.hp <= 0 && !t.dead) {
        t.dead = true;
        this.particles.explosion(t.x, t.y, 0.8);
        this.game.audio.play('minionDie');
        this.advance({ type: 'targetDown' });
      }
    }
    this.targets = this.targets.filter((t) => !t.dead);
    this.playerBullets = this.playerBullets.filter((b) => !b.dead && b.y > -20);
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.game.storage.set(TUTORIAL_KEY, true);
    markPlayed(this.game.storage);
    this.game.audio.play('select');
    this.game.changeScene(this.next());
  }

  draw(ctx) {
    const sprites = this.game.sprites;
    for (const t of this.targets) {
      sprites.draw(ctx, 'minion', t.x, t.y, { alpha: t.hit > 0 ? 0.5 : 1 });
    }
    for (const b of this.playerBullets) b.draw(ctx);
    this.player.draw(ctx, sprites);
    this.particles.draw(ctx);
    this.drawGuide(ctx);
    this.drawSkip(ctx);
  }

  /** Faixa do passo atual: título grande, tecla desenhada e progresso. */
  drawGuide(ctx) {
    drawText(ctx, 'TREINO DE VOO', W / 2, 26, { size: 10, align: 'center', color: UI_COLORS.muted });
    if (this.state.done) {
      drawText(ctx, 'PRONTO!', W / 2, 300, { size: 24, align: 'center', color: '#a7f070' });
      return;
    }
    const step = currentStep(this.state);
    const color = this.flash > 0 ? '#a7f070' : '#ffcd75';
    drawText(ctx, step.title, W / 2, 60, { size: 16, align: 'center', color });
    if (this.touch) {
      drawText(ctx, step.touchText, W / 2, 110, { size: 11, align: 'center' });
    } else {
      this.drawKeys(ctx, step.id);
    }
    // Progresso do passo.
    let progress = '';
    if (step.id === 'move') progress = `${Math.min(100, Math.round((this.state.moved / TUTORIAL_MOVE_GOAL) * 100))}%`;
    if (step.id === 'shoot') progress = `${this.state.hits} / ${TUTORIAL_TARGETS}`;
    if (progress) drawText(ctx, progress, W / 2, 180, { size: 12, align: 'center', color: '#94b0c2' });
    // Passos (bolinhas).
    const n = this.state.steps.length;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i < this.state.index ? '#a7f070' : i === this.state.index ? '#ffcd75' : '#333c57';
      ctx.fillRect(W / 2 - n * 10 + i * 20 + 4, H - 34, 12, 12);
    }
  }

  /** Teclas do passo atual, desenhadas (primeira tecla de cada ação). */
  drawKeys(ctx, stepId) {
    const b = this.input.bindings;
    const y = 118;
    if (stepId === 'move') {
      // Setas em "T" invertido, como no teclado.
      const s = 9;
      drawKeyCap(ctx, b.up[0], W / 2 - 60, y - 14, { size: s, color: '#73eff7' });
      [b.left[0], b.down[0], b.right[0]].forEach((code, i) => drawKeyCap(ctx, code, W / 2 - 92 + i * 32, y + 16, { size: s, color: '#73eff7' }));
      if (b.up[1]) {
        drawText(ctx, 'OU', W / 2 + 4, y + 2, { size: 9, align: 'center', color: '#94b0c2' });
        drawKeyCap(ctx, b.up[1], W / 2 + 70, y - 14, { size: s, color: '#73eff7' });
        [b.left[1], b.down[1], b.right[1]].forEach((code, i) => drawKeyCap(ctx, code, W / 2 + 38 + i * 32, y + 16, { size: s, color: '#73eff7' }));
      }
      return;
    }
    const action = stepId === 'shoot' ? 'fire' : 'pause';
    const pressed = this.input.isDown?.(action) ?? false;
    drawKeyCap(ctx, b[action][0], W / 2, y + 4, { size: 12, color: '#ffcd75', pressed });
    drawText(ctx, stepId === 'shoot' ? 'SEGURE PARA ATIRAR' : '', W / 2, y + 32, { size: 9, align: 'center', color: '#94b0c2' });
  }

  drawSkip(ctx) {
    const r = SKIP;
    ctx.fillStyle = 'rgba(26, 28, 44, 0.85)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = '#566c86';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    drawText(ctx, 'PULAR', r.x + r.w / 2, r.y + r.h / 2, { size: 9, align: 'center', baseline: 'middle' });
    if (!this.touch) drawText(ctx, 'ENTER PULA O TREINO', W / 2, H - 56, { size: 8, align: 'center', color: '#566c86' });
  }
}
