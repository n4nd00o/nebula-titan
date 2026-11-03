/**
 * PlayScene — um "encontro" jogável: fase de ondas ou luta contra chefe.
 *
 * O encontro fica em `this.boss` (um Boss ou um WaveStage); os dois têm a
 * mesma interface, então a cena não precisa saber qual dos dois está rodando.
 *
 * Esta cena é o "mundo" do jogo: guarda todas as entidades, resolve
 * colisões, aplica "game feel" (tremor de tela, hit-stop, flashes) e
 * desenha o HUD. Ela também implementa a interface usada pelos encontros
 * (spawnEnemyBullet, shake, announce, addScore...).
 *
 * Modos:
 *  - duel:     luta direta contra o Nebula Titan (sem buffs);
 *  - campaign: setores, mini-chefes, Titã e Leviatã; usa e concede buffs.
 *
 * Sub-estados: playing | paused | gameover | victory
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H, PLAYER, DEBUG, UI_COLORS } from '../config.js';
import { Player } from '../entities/Player.js';
import { PlayerBullet, EnemyBullet } from '../entities/projectiles.js';
import { Minion } from '../entities/Minion.js';
import { PowerUp } from '../entities/PowerUp.js';
import { Wingman } from '../entities/Wingman.js';
import { LaserWall } from '../entities/LaserWall.js';
import { ALIEN_DROPS } from '../entities/alienTypes.js';
import { Boss } from '../boss/Boss.js';
import { WaveStage } from '../stages/WaveStage.js';
import { ENCOUNTERS } from '../encounters.js';
import { fireSpread, aimAtPlayer } from '../boss/patterns.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { circleOverlap, pointSegmentDistance } from '../systems/Collision.js';
import { computeResults, rulesForParTime, formatTime } from '../systems/Scoring.js';
import { BUFFS, MINI_BOSS_IDS, PERFECT_RUN_BONUS } from '../systems/Campaign.js';
import { drawText } from '../graphics/text.js';
import { rand, clamp, removeDead } from '../utils/math.js';
import { TitleScene } from './TitleScene.js';
import { MapScene } from './MapScene.js';

const MAX_ENEMY_BULLETS = 450;
/** Tempo-par da campanha inteira (soma dos tempos-par de todas as fases). */
const CAMPAIGN_PAR_TIME = 90 + 110 + 120 * MINI_BOSS_IDS.length + 300 + 420;
const CAMPAIGN_TITAN_HP_SCALE = 1.8;

export class PlayScene {
  /**
   * @param {object} game
   * @param {{bossId?: string, campaign?: import('../systems/Campaign.js').Campaign}} options
   */
  constructor(game, { bossId = 'titan', campaign = null } = {}) {
    this.game = game;
    this.input = game.input;
    this.audio = game.audio;
    this.sprites = game.sprites;
    this.storage = game.storage;
    this.campaign = campaign;
    this.mode = campaign ? 'campaign' : 'duel';
    this.def = ENCOUNTERS[bossId];

    this.particles = new ParticleSystem();
    this.player = new Player();
    this.player.buffs = campaign ? campaign.buffs : new Set();
    this.wingman = this.player.buffs.has('wingman') ? new Wingman(this.player) : null;
    this.bombs = this.player.buffs.has('bomb') ? PLAYER.bombCharges : 0;
    this.playerBullets = [];
    this.enemyBullets = [];
    this.minions = [];
    this.powerUps = [];
    this.popups = [];
    this.hazards = []; // paredes de laser

    // Na campanha o Titã chega reforçado: o jogador está com todos os buffs.
    const hpScale = campaign && bossId === 'titan' ? CAMPAIGN_TITAN_HP_SCALE : 1;
    this.boss = this.def.kind === 'waves' ? new WaveStage(this, this.def) : new Boss(this, this.def, { hpScale });

    // Vidas acumulam na campanha (máximo 5); vida extra a cada 50.000 pontos.
    if (campaign) this.player.lives = campaign.lives;
    this.nextLifeAt = campaign ? campaign.nextLifeAt : PLAYER.extraLifeEvery;

    this.score = campaign ? campaign.score : 0;
    this.hiscoreKey = campaign ? 'hiscoreCampaign' : 'hiscore';
    this.hiscore = this.storage.get(this.hiscoreKey, 0);
    this.state = 'playing';
    this.stateTime = 0;
    this.shakeTime = 0;
    this.shakeDuration = 1;
    this.shakeAmount = 0;
    this.hitstopTime = 0;
    this.flashAlpha = 0;
    this.announcement = null;
    this.endTimer = 0;
    this.pendingEnd = null;
    this.results = null;
    this.gainedBuffs = [];
    this.campaignResults = null;
    this.perfectBonus = 0;
    this.newRecord = false;
    this.showHitboxes = DEBUG;
    this.stats = { time: 0, shots: 0, hits: 0, damageTaken: 0 };
  }

  /** Esta luta encerra o modo atual? (Leviatã na campanha; Titã no duelo) */
  get isFinalEncounter() {
    return this.campaign ? this.def.id === 'leviathan' : true;
  }

  enter() {
    this.game.starfield.setSpeed(1);
    this.audio.setTempo(1);
    this.audio.playMusic(this.def.music ?? (this.def.id === 'titan' ? 'boss' : 'mini'));
    this.audio.play('warning');
    this.announce(this.def.intro.title, this.def.intro.subtitle, 3, 'warning');
  }

  exit() {
    this.audio.resume();
    this.audio.setTempo(1);
  }

  onBlur() {
    if (this.state === 'playing') this.pause();
  }

  pause() {
    this.state = 'paused';
    this.audio.suspend();
  }

  // ===================================================== API do "mundo"
  spawnEnemyBullet(options) {
    if (this.enemyBullets.length < MAX_ENEMY_BULLETS) this.enemyBullets.push(new EnemyBullet(options));
  }

  fireAimed(x, y, speed, style) {
    fireSpread(this, x, y, aimAtPlayer(this, x, y), 1, 0, speed, style);
  }

  spawnPowerUp(type, x, y) {
    this.powerUps.push(new PowerUp(type, x, y));
  }

  /** Esquadrão entrando pelo topo da tela, em fila (os primeiros `orange` são laranja). */
  spawnMinionWave(count = 4, { orange = 0 } = {}) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const baseX = rand(110, W - 110);
    for (let i = 0; i < count; i++) {
      this.minions.push(new Minion(baseX, i * 0.3, dir, { type: i < orange ? 'orange' : 'green' }));
    }
  }

  /** Alienígena nascendo de um ponto específico (ninho da Colmeia, hangar do Leviatã). */
  spawnMinion(x, y, { entryTime = 0.7, dir = 1, type = 'green' } = {}) {
    this.minions.push(new Minion(x, 0, dir, { startY: y, entryTime, type }));
  }

  /** Inimigo já construído (alienígenas de formação das fases de ondas). */
  addEnemy(enemy) {
    this.minions.push(enemy);
  }

  spawnLaserWall(options) {
    this.hazards.push(new LaserWall(options));
    this.audio.play('dashWarn');
  }

  shake(amount, duration) {
    const current = this.shakeAmount * (this.shakeTime / this.shakeDuration);
    if (amount >= current) {
      this.shakeAmount = amount;
      this.shakeDuration = duration;
      this.shakeTime = duration;
    }
  }

  hitstop(seconds) {
    this.hitstopTime = Math.max(this.hitstopTime, seconds);
  }

  flash(alpha) {
    this.flashAlpha = Math.max(this.flashAlpha, alpha);
  }

  addScore(points, x, y, label) {
    this.score += points;
    if (x !== undefined) {
      this.popups.push({
        x, y,
        text: label ? `${label} +${points}` : `+${points}`,
        color: label ? UI_COLORS.accent : UI_COLORS.text,
        size: label ? 8 : 7,
        life: 1.4,
        maxLife: 1.4,
      });
    }
  }

  popup(text, x, y, color = UI_COLORS.info) {
    this.popups.push({ x, y, text, color, size: 8, life: 1.6, maxLife: 1.6 });
  }

  announce(title, subtitle = '', duration = 2.5, style = 'phase', hint = '') {
    this.announcement = { title, subtitle, hint, duration, style, time: 0 };
  }

  clearEnemyBullets(reward) {
    for (const b of this.enemyBullets) {
      this.particles.add({ x: b.x, y: b.y, vy: -40, life: 0.4, size: 3, sizeEnd: 0, color: '#ffcd75', glow: true });
      if (reward) this.score += 10;
    }
    this.enemyBullets.length = 0;
  }

  onPhaseStart(index, phase) {
    this.game.starfield.setSpeed(1);
    // No Leviatã a música acelera a cada seção.
    if (this.def.id === 'leviathan') this.audio.setTempo(1 + index * 0.03);
    if (phase?.enrage) this.audio.setTempo(this.def.id === 'leviathan' ? 1.28 : 1.2);
    if (phase?.bombRefill && this.player.buffs.has('bomb') && this.bombs < PLAYER.bombMax) {
      this.bombs++;
      this.popup('+1 BOMBA', this.player.x, this.player.y - 30, '#e43b8c');
    }
  }

  onPhaseCleared() {
    this.audio.play('phaseClear');
    this.game.starfield.setSpeed(6); // efeito de dobra espacial na transição
    const label = this.boss.phaseLabel === 'ONDA' ? 'ONDA ELIMINADA' : 'FASE CONCLUÍDA';
    this.announce(label, this.def.phaseClearText ?? `${this.def.name} ESTÁ SE ADAPTANDO...`, 1.8, 'clear');
  }

  onBossDying() {
    this.audio.stopMusic();
  }

  onBossDefeated() {
    this.pendingEnd = 'victory';
    this.endTimer = this.def.kind === 'waves' ? 1.2 : 2.2;
  }

  // ===================================================== eventos do jogador
  firePlayerShot(player) {
    const piercing = player.buffs.has('piercing');
    const offsets = player.double ? [-9, 9] : [0];
    for (const o of offsets) this.playerBullets.push(new PlayerBullet(player.x + o, player.y - 18, { piercing }));
    let shots = offsets.length;
    if (this.wingman?.visible) {
      this.playerBullets.push(new PlayerBullet(this.wingman.x, this.wingman.y - 14, { piercing }));
      shots++;
    }
    this.stats.shots += shots;
    this.audio.play('shoot');
  }

  onPlayerDash(player) {
    this.audio.play('dash');
    this.particles.ring(player.x, player.y, '#ffcd75', 24, 0.25);
  }

  onShieldBreak(player) {
    this.particles.ring(player.x, player.y, '#38b764', 40, 0.4);
    this.audio.play('shieldBreak');
    this.shake(4, 0.2);
  }

  onPlayerDeath(player) {
    this.stats.damageTaken++;
    this.campaign?.recordDeath();
    this.particles.explosion(player.x, player.y, 1.8);
    this.particles.debris(player.x, player.y, ['#f4f4f4', '#3b5dc9', '#b13e53'], 18);
    this.shake(10, 0.5);
    this.flash(0.4);
    this.hitstop(0.12);
    this.audio.play('playerDeath');
    this.clearEnemyBullets(false); // misericórdia: limpa a tela ao morrer
    this.hazards.length = 0;
    if (player.lives <= 0) {
      this.pendingEnd = 'gameover';
      this.endTimer = 1.8;
    }
  }

  onPlayerRespawn() {
    this.clearEnemyBullets(false);
  }

  /** Bomba de Pulso: limpa projéteis e lasers, destrói drones e fere os pontos fracos. */
  useBomb() {
    const player = this.player;
    if (this.bombs <= 0 || !player.alive) return;
    this.bombs--;
    this.clearEnemyBullets(true);
    this.hazards.length = 0;
    for (const m of this.minions) if (m.active && !m.dead) {
      m.dead = true;
      this.killMinion(m);
    }
    for (const part of this.boss.vulnerableParts()) {
      this.boss.applyDamage(part, PLAYER.bombDamage, { ignoreArmor: true });
    }
    player.invuln = Math.max(player.invuln, 1.2);
    this.particles.ring(player.x, player.y, '#e43b8c', 420, 0.7);
    this.particles.ring(player.x, player.y, '#ffffff', 300, 0.5);
    this.flash(0.8);
    this.shake(10, 0.5);
    this.audio.play('bomb');
  }

  collectPowerUp(p) {
    const player = this.player;
    switch (p.type) {
      case 'double':
        if (player.double) this.addScore(1000, p.x, p.y);
        player.double = true;
        break;
      case 'rapid':
        player.rapidTime = PLAYER.rapidDuration;
        break;
      case 'shield':
        player.shield = true;
        break;
      case 'life':
        if (player.lives >= PLAYER.maxLives) this.addScore(5000, p.x, p.y);
        player.lives = Math.min(player.lives + 1, PLAYER.maxLives);
        break;
      default:
        break;
    }
    this.popup(p.info.name, p.x, p.y - 12, p.info.color);
    this.particles.ring(p.x, p.y, p.info.color, 30, 0.3);
    this.audio.play('powerup');
  }

  /** Vida extra a cada N pontos (máximo de 5 vidas). */
  checkExtraLife() {
    while (this.score >= this.nextLifeAt) {
      this.nextLifeAt += PLAYER.extraLifeEvery;
      if (this.campaign) this.campaign.nextLifeAt = this.nextLifeAt;
      if (this.player.lives < PLAYER.maxLives) {
        this.player.lives++;
        this.popup('VIDA EXTRA!', this.player.x, this.player.y - 40, '#e43b8c');
        this.audio.play('powerup');
      }
    }
  }

  // ===================================================== update
  update(dt) {
    const input = this.input;

    if (this.state === 'paused') {
      if (input.wasPressed('pause') || input.wasPressed('confirm')) {
        this.state = 'playing';
        this.audio.resume();
      } else if (input.wasPressed('quit')) {
        this.game.changeScene(new TitleScene(this.game));
      }
      return;
    }

    if (this.state === 'gameover' || this.state === 'victory') {
      this.stateTime += dt;
      this.updateWorld(dt, false);
      if (this.stateTime > 1.2) {
        if (input.wasPressed('confirm')) this.continueAfterEnd();
        else if (input.wasPressed('pause') || input.wasPressed('quit')) this.game.changeScene(new TitleScene(this.game));
      }
      return;
    }

    if (input.wasPressed('pause')) {
      this.audio.play('select');
      this.pause();
      return;
    }
    if (DEBUG) this.handleDebugInput();
    if (input.wasPressed('bomb')) this.useBomb();

    if (this.hitstopTime > 0) {
      // Hit-stop: congela o jogo por alguns milissegundos para dar "peso" ao impacto.
      this.hitstopTime -= dt;
      return;
    }

    this.stats.time += dt;
    this.updateWorld(dt, true);
    this.checkExtraLife();

    if (this.pendingEnd) {
      this.endTimer -= dt;
      if (this.endTimer <= 0) this.finish(this.pendingEnd);
    }
  }

  /** O que acontece ao apertar ENTER na tela de vitória/derrota. */
  continueAfterEnd() {
    const { game, campaign } = this;
    if (!campaign) {
      game.changeScene(new PlayScene(game));
    } else if (this.state === 'gameover') {
      campaign.recordContinue();
      game.changeScene(new PlayScene(game, { bossId: this.def.id, campaign }));
    } else if (campaign.complete) {
      game.changeScene(new TitleScene(game));
    } else if (campaign.nextIsStage) {
      game.changeScene(new PlayScene(game, { bossId: campaign.available()[0], campaign }));
    } else {
      game.changeScene(new MapScene(game, campaign));
    }
  }

  updateWorld(dt, active) {
    if (active) this.player.update(dt, this);
    this.wingman?.update(dt, this.player);
    this.boss.update(dt);
    for (const b of this.playerBullets) b.update(dt);
    for (const b of this.enemyBullets) b.update(dt, this);
    for (const m of this.minions) m.update(dt, this);
    for (const p of this.powerUps) p.update(dt);
    for (const h of this.hazards) h.update(dt);
    if (active) this.handleCollisions();

    removeDead(this.playerBullets);
    removeDead(this.enemyBullets);
    removeDead(this.minions);
    removeDead(this.powerUps);
    removeDead(this.hazards);

    this.particles.update(dt);
    for (const p of this.popups) {
      p.life -= dt;
      p.y -= 25 * dt;
      p.dead = p.life <= 0;
    }
    removeDead(this.popups);

    if (this.announcement) {
      this.announcement.time += dt;
      if (this.announcement.time >= this.announcement.duration) this.announcement = null;
    }
    this.shakeTime = Math.max(0, this.shakeTime - dt);
    this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);
  }

  handleCollisions() {
    const { boss, player, particles } = this;

    // Tiros do jogador x chefe / alienígenas
    for (const b of this.playerBullets) {
      if (b.dead) continue;
      // Testa todo o trajeto desde o quadro anterior (evita "atravessar" peças finas).
      const hit = boss.hitTestPath(b.x, b.prevY, b.x, b.y, b.radius);
      if (hit) {
        b.dead = true;
        if (hit.vulnerable) {
          this.stats.hits++;
          this.score += 10;
          boss.applyDamage(hit.part, b.damage, { piercing: b.piercing });
          const armored = hit.part.armor > 0 && !b.piercing;
          particles.hitSpark(hit.x, hit.y, b.piercing ? '#73eff7' : armored ? '#94b0c2' : '#ffcd75');
          this.audio.play(armored ? 'tink' : 'hit');
          if (armored) this.armorHint(hit.part, hit.x, hit.y);
        } else {
          // Ricochete em blindagem: feedback de que ali não é o ponto fraco.
          particles.hitSpark(hit.x, hit.y, '#94b0c2');
          this.audio.play('tink');
        }
        continue;
      }
      for (const m of this.minions) {
        if (!m.active || m.dead || b.hitMinions?.has(m)) continue;
        if (circleOverlap(b.x, b.y, b.radius, m.x, m.y, m.radius)) {
          this.stats.hits++;
          if (b.piercing) b.hitMinions.add(m); // perfurante: atravessa e segue em frente
          else b.dead = true;
          if (m.damage(b.damage)) this.killMinion(m);
          else particles.hitSpark(b.x, b.y, '#a7f070');
          if (b.dead) break;
        }
      }
    }

    if (!player.alive) return;

    // Tiros inimigos x jogador
    for (const e of this.enemyBullets) {
      if (circleOverlap(player.x, player.y, player.hitRadius, e.x, e.y, e.radius)) {
        e.dead = true;
        player.hit(this);
        break;
      }
    }

    // Laser do Titã x jogador
    if (player.alive && boss.laser.isLethal) {
      const s = boss.laser.segment(boss);
      const d = pointSegmentDistance(player.x, player.y, s.x1, s.y1, s.x2, s.y2);
      if (d < boss.laser.width * 0.4 + player.hitRadius) player.hit(this);
    }

    // Paredes de laser (o dash dá invencibilidade para atravessar)
    for (const h of this.hazards) {
      if (player.alive && h.hits(player.x, player.y, player.hitRadius)) player.hit(this);
    }

    // Contato com o corpo do chefe (ex.: investida do Ceifador)
    if (player.alive && boss.touches(player.x, player.y, player.hitRadius)) player.hit(this);

    // Colisão corpo a corpo com alienígenas
    for (const m of this.minions) {
      if (player.alive && m.active && !m.dead && circleOverlap(player.x, player.y, player.hitRadius + 4, m.x, m.y, m.radius - 2)) {
        if (player.hit(this) || player.invuln > 0) {
          m.dead = true;
          particles.explosion(m.x, m.y, 0.8);
        }
      }
    }

    // Coleta de power-ups
    for (const p of this.powerUps) {
      if (player.alive && !p.dead && circleOverlap(player.x, player.y, PLAYER.pickupRadius, p.x, p.y, 8)) {
        p.dead = true;
        this.collectPowerUp(p);
      }
    }
  }

  killMinion(m) {
    this.particles.explosion(m.x, m.y, m.type === 'orange' ? 1.1 : 0.8);
    this.particles.debris(m.x, m.y, m.info?.debris ?? ['#38b764', '#a7f070'], 8);
    this.addScore(m.points, m.x, m.y);
    this.audio.play('minionDie');
    if (Math.random() < (m.dropChance ?? 0.1)) {
      this.spawnPowerUp(ALIEN_DROPS[Math.floor(Math.random() * ALIEN_DROPS.length)], m.x, m.y);
    }
  }

  /** Aviso (com intervalo) de que a parte é blindada e o perfurante ajudaria. */
  armorHint(part, x, y) {
    const now = this.stats.time;
    if (now - (part.lastArmorHint ?? -99) < 4) return;
    part.lastArmorHint = now;
    const text = this.player.buffs.has('piercing') ? 'BLINDADO' : 'BLINDADO! (PERFURANTE IGNORA)';
    this.popup(text, x, y + 20, '#94b0c2');
  }

  finish(kind) {
    this.pendingEnd = null;
    this.stateTime = 0;
    if (kind === 'victory') {
      this.results = computeResults({ score: this.score, ...this.stats }, rulesForParTime(this.def.parTime));
      this.score = this.results.total;
      this.audio.play('victory');
      this.game.starfield.setSpeed(3);
      if (this.campaign) {
        this.gainedBuffs = this.campaign.recordVictory(this.def.id, this.stats, this.score, this.player.lives);
        if (this.gainedBuffs.length) setTimeout(() => this.audio.play('buff'), 900);
        if (this.campaign.complete) {
          // Bônus por zerar o jogo inteiro sem nenhuma morte.
          this.perfectBonus = this.campaign.perfect ? PERFECT_RUN_BONUS : 0;
          this.campaign.score += this.perfectBonus;
          this.score = this.campaign.score;
          this.campaignResults = computeResults(
            { ...this.campaign.stats, score: this.campaign.score },
            rulesForParTime(CAMPAIGN_PAR_TIME),
          );
        }
      }
    } else {
      this.boss.passive = true;
      this.boss.laser.cancel();
      this.hazards.length = 0;
      this.audio.stopMusic();
      this.audio.play('gameOver');
    }
    if (this.score > this.hiscore) {
      this.newRecord = true;
      this.hiscore = this.score;
      this.storage.set(this.hiscoreKey, this.score);
    }
    this.state = kind;
  }

  handleDebugInput() {
    const input = this.input;
    if (input.wasPressed('debugKill')) {
      for (const part of this.boss.vulnerableParts()) this.boss.applyDamage(part, 9999, { ignoreArmor: true });
      // Fases de ondas: elimina todos os alienígenas da onda.
      if (this.def.kind === 'waves') for (const m of this.minions) if (m.active && !m.dead) m.damage(99);
    }
    if (input.wasPressed('debugGod')) {
      this.player.godMode = !this.player.godMode;
      this.popup(this.player.godMode ? 'INVENCÍVEL ON' : 'INVENCÍVEL OFF', W / 2, H / 2, '#a7f070');
    }
    if (input.wasPressed('debugBuffs')) {
      for (const id of Object.keys(BUFFS)) this.player.buffs.add(id);
      this.wingman ??= new Wingman(this.player);
      this.bombs = PLAYER.bombMax;
      this.popup('TODOS OS BUFFS', W / 2, H / 2, '#a7f070');
    }
    if (input.wasPressed('debugHitbox')) this.showHitboxes = !this.showHitboxes;
  }

  // ===================================================== desenho
  draw(ctx) {
    ctx.save();
    if (this.shakeTime > 0) {
      const k = this.shakeAmount * (this.shakeTime / this.shakeDuration);
      ctx.translate(Math.round(rand(-k, k)), Math.round(rand(-k, k)));
    }

    this.boss.draw(ctx, this.sprites, this.showHitboxes);
    for (const p of this.powerUps) p.draw(ctx);
    for (const m of this.minions) m.draw(ctx, this.sprites);
    for (const b of this.playerBullets) b.draw(ctx);
    this.wingman?.draw(ctx, this.sprites);
    this.player.draw(ctx, this.sprites);
    for (const b of this.enemyBullets) b.draw(ctx);
    for (const h of this.hazards) h.draw(ctx);
    this.particles.draw(ctx);
    for (const p of this.popups) {
      drawText(ctx, p.text, p.x, p.y, { size: p.size, color: p.color, align: 'center', alpha: clamp((p.life / p.maxLife) * 2, 0, 1) });
    }
    if (this.showHitboxes) this.drawDebug(ctx);
    ctx.restore();

    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha * 0.6})`;
      ctx.fillRect(0, 0, W, H);
    }

    this.drawHud(ctx);
    this.drawAnnouncement(ctx);

    if (this.state === 'paused') this.drawPause(ctx);
    else if (this.state === 'gameover') this.drawGameOver(ctx);
    else if (this.state === 'victory') this.drawVictory(ctx);
  }

  drawHud(ctx) {
    drawText(ctx, 'PONTOS', 12, 8, { size: 7, color: UI_COLORS.muted });
    drawText(ctx, String(this.score).padStart(7, '0'), 12, 19, { size: 10 });
    drawText(ctx, 'RECORDE', W / 2, 8, { size: 7, color: UI_COLORS.muted, align: 'center' });
    drawText(ctx, String(Math.max(this.hiscore, this.score)).padStart(7, '0'), W / 2, 19, { size: 10, align: 'center', color: UI_COLORS.accent });

    // Botão de pausa (útil no celular)
    ctx.fillStyle = 'rgba(148, 176, 194, 0.5)';
    ctx.fillRect(W - 30, 10, 5, 16);
    ctx.fillRect(W - 21, 10, 5, 16);

    const boss = this.boss;
    if (boss.state !== 'entering' && boss.state !== 'dead') {
      const bx = 12;
      const by = 48;
      const bw = W - 24;
      const gap = boss.phaseCount > 5 ? 3 : 4;
      const segW = (bw - gap * (boss.phaseCount - 1)) / boss.phaseCount;
      const hitFlash = boss.phase.targets.some((id) => boss.parts[id].flash > 0);

      drawText(ctx, boss.name, bx, 36, { size: 8, color: UI_COLORS.boss });
      drawText(ctx, `${boss.phaseLabel ?? 'FASE'} ${boss.phaseIndex + 1}/${boss.phaseCount}`, W - 12, 36, { size: 8, align: 'right', color: UI_COLORS.muted });

      for (let i = 0; i < boss.phaseCount; i++) {
        const x = bx + i * (segW + gap);
        ctx.fillStyle = '#1a1c2c';
        ctx.fillRect(x, by, segW, 8);
        let fill = 0;
        if (i > boss.phaseIndex) fill = 1;
        else if (i === boss.phaseIndex) fill = boss.state === 'dying' ? 0 : boss.phaseHealthRatio();
        ctx.fillStyle = i === boss.phaseIndex ? (hitFlash ? '#ffffff' : UI_COLORS.boss) : UI_COLORS.bossDim;
        ctx.fillRect(x, by, segW * fill, 8);
        ctx.strokeStyle = '#566c86';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, by + 0.5, segW - 1, 7);
      }
      if (boss.state === 'fight') {
        const hint = boss.hudHint?.() ?? `ALVO: ${boss.phase.title}`;
        drawText(ctx, hint, W / 2, 62, { size: 6, align: 'center', color: UI_COLORS.muted });
      }
    }

    // Vidas (canto inferior esquerdo)
    for (let i = 0; i < this.player.lives; i++) {
      this.sprites.draw(ctx, 'player', 18 + i * 22, H - 18, { scale: 0.45 });
    }

    // Buffs da campanha (acima das vidas)
    const player = this.player;
    let bx = 10;
    for (const id of ['piercing', 'wingman', 'dash']) {
      if (!player.buffs.has(id)) continue;
      const buff = BUFFS[id];
      let label = buff.short;
      if (id === 'dash' && player.dashCooldown > 0) label = `DASH ${player.dashCooldown.toFixed(1)}`;
      const color = id === 'dash' && player.dashCooldown > 0 ? '#566c86' : buff.color;
      drawText(ctx, label, bx, H - 44, { size: 6, color });
      bx += label.length * 6 + 10;
    }

    // Botão/indicador da bomba (canto inferior direito; também é área de toque)
    if (player.buffs.has('bomb')) {
      const cx = W - 34;
      const cy = H - 34;
      ctx.fillStyle = this.bombs > 0 ? 'rgba(228, 59, 140, 0.35)' : 'rgba(86, 108, 134, 0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this.bombs > 0 ? '#e43b8c' : '#566c86';
      ctx.lineWidth = 2;
      ctx.stroke();
      drawText(ctx, `X${this.bombs}`, cx, cy - 1, { size: 8, align: 'center', baseline: 'middle', color: this.bombs > 0 ? '#ffffff' : '#566c86' });
      drawText(ctx, 'BOMBA', cx, cy + 26, { size: 5, align: 'center', color: UI_COLORS.muted, baseline: 'top' });
    }

    // Power-ups temporários (acima da bomba)
    const tags = [];
    if (player.double) tags.push({ text: '2X', color: '#41a6f6' });
    if (player.rapidTime > 0) tags.push({ text: `RÁPIDO ${Math.ceil(player.rapidTime)}`, color: '#ef7d57' });
    if (player.shield) tags.push({ text: 'ESCUDO', color: '#38b764' });
    tags.forEach((tag, i) => {
      drawText(ctx, tag.text, W - 12, H - 76 - i * 12, { size: 7, align: 'right', color: tag.color });
    });
  }

  drawAnnouncement(ctx) {
    const a = this.announcement;
    if (!a) return;
    const alpha = Math.min(clamp(a.time / 0.25, 0, 1), clamp((a.duration - a.time) / 0.4, 0, 1));
    const y = 270;

    ctx.save();
    ctx.globalAlpha = alpha;
    if (a.style === 'warning') {
      ctx.fillStyle = 'rgba(177, 62, 83, 0.35)';
      ctx.fillRect(0, y - 20, W, 80);
      // Faixas diagonais de alerta
      ctx.fillStyle = 'rgba(255, 205, 117, 0.5)';
      const offset = (a.time * 60) % 24;
      for (let x = -24; x < W + 24; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x + offset, y - 20); ctx.lineTo(x + offset + 12, y - 20); ctx.lineTo(x + offset + 6, y - 14); ctx.lineTo(x + offset - 6, y - 14);
        ctx.fill();
        ctx.fillRect(x + offset - 6, y + 54, 12, 6);
      }
      if (Math.floor(a.time * 4) % 2 === 0) {
        drawText(ctx, a.title, W / 2, y, { size: a.title.length > 8 ? 16 : 24, align: 'center', color: '#ff2848' });
      }
      drawText(ctx, a.subtitle, W / 2, y + 36, { size: 8, align: 'center' });
    } else {
      ctx.fillStyle = 'rgba(26, 28, 44, 0.75)';
      ctx.fillRect(0, y - 14, W, a.hint ? 76 : 62);
      drawText(ctx, a.title, W / 2, y, { size: 10, align: 'center', color: a.style === 'clear' ? '#a7f070' : UI_COLORS.muted });
      drawText(ctx, a.subtitle, W / 2, y + 18, { size: a.subtitle.length > 24 ? 9 : 14, align: 'center', color: UI_COLORS.accent });
      if (a.hint) drawText(ctx, a.hint, W / 2, y + 44, { size: 7, align: 'center', color: UI_COLORS.info });
    }
    ctx.restore();
  }

  drawOverlay(ctx, alpha = 0.65) {
    ctx.fillStyle = `rgba(5, 5, 13, ${alpha})`;
    ctx.fillRect(0, 0, W, H);
  }

  drawPause(ctx) {
    this.drawOverlay(ctx);
    drawText(ctx, 'PAUSADO', W / 2, 200, { size: 22, align: 'center', color: UI_COLORS.accent });
    drawText(ctx, 'P / ESC  continuar', W / 2, 260, { size: 8, align: 'center' });
    drawText(ctx, 'Q  voltar ao menu', W / 2, 280, { size: 8, align: 'center' });
    drawText(ctx, 'M  ligar/desligar som', W / 2, 300, { size: 8, align: 'center' });
    drawText(ctx, 'SETAS/WASD mover  ESPAÇO atirar', W / 2, 360, { size: 7, align: 'center', color: UI_COLORS.muted });
    drawText(ctx, 'SHIFT modo foco (lento + hitbox)', W / 2, 376, { size: 7, align: 'center', color: UI_COLORS.muted });
    if (this.player.buffs.has('dash')) drawText(ctx, 'C  dash', W / 2, 392, { size: 7, align: 'center', color: UI_COLORS.muted });
    if (this.player.buffs.has('bomb')) drawText(ctx, 'X  bomba de pulso', W / 2, 408, { size: 7, align: 'center', color: UI_COLORS.muted });
  }

  drawGameOver(ctx) {
    this.drawOverlay(ctx, Math.min(0.7, this.stateTime));
    drawText(ctx, 'FIM DE JOGO', W / 2, 190, { size: 22, align: 'center', color: '#ff2848' });
    const label = (this.boss.phaseLabel ?? 'fase').toLowerCase();
    drawText(ctx, `${this.def.name}: ${label} ${this.boss.phaseIndex + 1} de ${this.boss.phaseCount}`, W / 2, 240, { size: 8, align: 'center' });
    drawText(ctx, `PONTOS ${this.score}`, W / 2, 270, { size: 10, align: 'center', color: UI_COLORS.accent });
    if (this.newRecord) drawText(ctx, 'NOVO RECORDE!', W / 2, 292, { size: 9, align: 'center', color: '#a7f070' });
    if (this.stateTime > 1.2) {
      const retry = this.campaign ? 'ENTER  continuar (pontos zerados)' : 'ENTER  tentar de novo';
      if (Math.floor(this.stateTime * 2) % 2 === 0) drawText(ctx, retry, W / 2, 360, { size: 8, align: 'center' });
      if (this.campaign) drawText(ctx, 'Você mantém os buffs e volta com 3 vidas', W / 2, 378, { size: 6, align: 'center', color: UI_COLORS.muted });
      drawText(ctx, 'ESC  menu', W / 2, 398, { size: 8, align: 'center', color: UI_COLORS.muted });
    }
  }

  drawVictory(ctx) {
    if (!this.campaign) this.drawDuelVictory(ctx);
    else if (this.isFinalEncounter) this.drawCampaignVictory(ctx);
    else this.drawMiniVictory(ctx);
  }

  drawStatLines(ctx, lines, y0) {
    lines.forEach(([label, value], i) => {
      const y = y0 + i * 16;
      drawText(ctx, label, 70, y, { size: 8, color: UI_COLORS.muted });
      drawText(ctx, value, W - 70, y, { size: 8, align: 'right' });
    });
  }

  drawPrompt(ctx, text) {
    if (this.stateTime > 1.2 && Math.floor(this.stateTime * 2) % 2 === 0) {
      drawText(ctx, text, W / 2, H - 50, { size: 8, align: 'center' });
    }
  }

  /** Vitória intermediária da campanha: setor limpo, mini-chefe ou Titã. */
  drawMiniVictory(ctx) {
    const r = this.results;
    const isStage = this.def.kind === 'waves';
    this.drawOverlay(ctx, Math.min(0.75, this.stateTime));
    drawText(ctx, `${this.def.name}`, W / 2, 80, { size: 18, align: 'center', color: '#a7f070' });
    drawText(ctx, isStage ? 'LIMPO!' : 'DERROTADO!', W / 2, 108, { size: 12, align: 'center', color: '#a7f070' });
    this.drawStatLines(ctx, [
      ['TEMPO', formatTime(this.stats.time)],
      ['PRECISÃO', `${Math.round(r.accuracy * 100)}%`],
      ['BÔNUS', `+${r.timeBonus + r.accuracyBonus + r.noDamageBonus}`],
      ['RANK DA LUTA', r.rank],
    ], 145);

    if (this.stateTime > 0.8 && this.gainedBuffs.length === 0) {
      // Sem buff: setores dão só pontos; o Titã abre o caminho para o Leviatã.
      const next = this.campaign.available()[0];
      const title = isStage ? 'BÔNUS DE SETOR GARANTIDO' : 'CAMINHO ABERTO';
      ctx.fillStyle = 'rgba(26, 28, 44, 0.9)';
      ctx.fillRect(30, 240, W - 60, 70);
      ctx.strokeStyle = '#ffcd75';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 240, W - 60, 70);
      drawText(ctx, title, W / 2, 256, { size: 10, align: 'center', color: '#ffcd75' });
      if (next) drawText(ctx, `PRÓXIMO: ${ENCOUNTERS[next].name}`, W / 2, 280, { size: 8, align: 'center' });
    }
    if (this.stateTime > 0.8) {
      this.gainedBuffs.forEach((id, i) => {
        const buff = BUFFS[id];
        const y = 240 + i * 82;
        ctx.fillStyle = 'rgba(26, 28, 44, 0.9)';
        ctx.fillRect(30, y, W - 60, 70);
        ctx.strokeStyle = buff.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(30, y, W - 60, 70);
        drawText(ctx, i === 0 ? 'BUFF OBTIDO' : 'BÔNUS DE CAMPANHA', W / 2, y + 10, { size: 7, align: 'center', color: UI_COLORS.muted });
        drawText(ctx, buff.name, W / 2, y + 26, { size: 12, align: 'center', color: buff.color });
        drawText(ctx, buff.description, W / 2, y + 48, { size: 6, align: 'center' });
      });
      const livesY = 240 + Math.max(1, this.gainedBuffs.length) * 82 + 6;
      drawText(ctx, `VIDAS: ${this.player.lives}/${PLAYER.maxLives}   MORTES NA CAMPANHA: ${this.campaign.deaths}`, W / 2, livesY, { size: 6, align: 'center', color: UI_COLORS.muted });
    }
    this.drawPrompt(ctx, this.campaign.nextIsStage ? 'ENTER  próximo setor' : 'ENTER  voltar ao mapa');
  }

  /** Vitória final da campanha (Leviatã destruído). */
  drawCampaignVictory(ctx) {
    const c = this.campaign;
    const r = this.campaignResults;
    this.drawOverlay(ctx, Math.min(0.8, this.stateTime));
    drawText(ctx, 'CAMPANHA', W / 2, 70, { size: 20, align: 'center', color: '#a7f070' });
    drawText(ctx, 'CONCLUÍDA!', W / 2, 98, { size: 20, align: 'center', color: '#a7f070' });
    this.drawStatLines(ctx, [
      ['TEMPO TOTAL', formatTime(c.stats.time)],
      ['PRECISÃO', `${Math.round(r.accuracy * 100)}%`],
      ['MORTES', String(c.deaths)],
      ['CONTINUES', String(c.continues)],
      ['BÔNUS SEM MORTES', this.perfectBonus ? `+${this.perfectBonus}` : '-'],
      ['PONTUAÇÃO FINAL', String(c.score)],
    ], 140);
    if (this.newRecord) drawText(ctx, 'NOVO RECORDE!', W / 2, 244, { size: 9, align: 'center', color: '#a7f070' });
    drawText(ctx, 'RANK', W / 2, 264, { size: 8, align: 'center', color: UI_COLORS.muted });
    drawText(ctx, r.rank, W / 2, 279, { size: 36, align: 'center', color: r.rank === 'S' ? '#ffcd75' : '#73eff7' });
    if (c.perfect) drawText(ctx, 'CORRIDA PERFEITA!', W / 2, 324, { size: 10, align: 'center', color: '#ffcd75' });

    drawText(ctx, 'SUA ROTA DE MINI-CHEFES', W / 2, 350, { size: 7, align: 'center', color: UI_COLORS.muted });
    const route = c.order.filter((id) => MINI_BOSS_IDS.includes(id)).map((id) => ENCOUNTERS[id].name).join(' > ');
    drawText(ctx, route, W / 2, 364, { size: 7, align: 'center' });
    drawText(ctx, `PARTES DO LEVIATÃ DESTRUÍDAS: ${this.boss.destroyedOrder.length}`, W / 2, 392, { size: 7, align: 'center', color: UI_COLORS.muted });
    this.drawPrompt(ctx, 'ENTER  menu principal');
  }

  /** Vitória no modo Duelo (luta direta contra o Titã). */
  drawDuelVictory(ctx) {
    const r = this.results;
    this.drawOverlay(ctx, Math.min(0.75, this.stateTime));
    drawText(ctx, 'VITÓRIA!', W / 2, 90, { size: 26, align: 'center', color: '#a7f070' });
    drawText(ctx, `${this.def.name} FOI DESTRUÍDO`, W / 2, 130, { size: 8, align: 'center' });
    this.drawStatLines(ctx, [
      ['TEMPO', formatTime(this.stats.time)],
      ['PRECISÃO', `${Math.round(r.accuracy * 100)}%`],
      ['DANO SOFRIDO', String(this.stats.damageTaken)],
      ['BÔNUS TEMPO', `+${r.timeBonus}`],
      ['BÔNUS PRECISÃO', `+${r.accuracyBonus}`],
      ['BÔNUS SEM DANO', `+${r.noDamageBonus}`],
    ], 165);
    drawText(ctx, 'TOTAL', 70, 270, { size: 10, color: UI_COLORS.accent });
    drawText(ctx, String(r.total), W - 70, 270, { size: 10, align: 'right', color: UI_COLORS.accent });
    if (this.newRecord) drawText(ctx, 'NOVO RECORDE!', W / 2, 290, { size: 9, align: 'center', color: '#a7f070' });

    drawText(ctx, 'RANK', W / 2, 315, { size: 8, align: 'center', color: UI_COLORS.muted });
    drawText(ctx, r.rank, W / 2, 330, { size: 36, align: 'center', color: r.rank === 'S' ? '#ffcd75' : '#73eff7' });

    drawText(ctx, 'ORDEM DE DESTRUIÇÃO', W / 2, 385, { size: 7, align: 'center', color: UI_COLORS.muted });
    this.boss.destroyedOrder.forEach((name, i) => {
      drawText(ctx, `${i + 1}. ${name}`, W / 2, 400 + i * 12, { size: 7, align: 'center' });
    });
    this.drawPrompt(ctx, 'ENTER jogar de novo   ESC menu');
  }

  drawDebug(ctx) {
    const p = this.player;
    ctx.strokeStyle = '#a7f070';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.hitRadius, 0, Math.PI * 2);
    ctx.stroke();
    drawText(ctx, `balas:${this.enemyBullets.length} part:${this.particles.count} inimigos:${this.minions.length}`, 6, H - 70, { size: 6, color: '#a7f070' });
    drawText(ctx, `T=destruir alvo G=invencível(${p.godMode ? 'on' : 'off'}) B=buffs H=hitbox`, 6, H - 60, { size: 6, color: '#a7f070' });
  }
}
