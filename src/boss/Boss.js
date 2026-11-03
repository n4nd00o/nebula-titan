/**
 * Boss — motor genérico de chefes (Nebula Titan e mini-chefes).
 *
 * O "motor" é o mesmo para todos os chefes; o que muda é a DEFINIÇÃO
 * (um objeto de dados em src/boss/bosses/). Uma definição descreve:
 *   - as partes (posição, vida, sprite, regras de visibilidade/solidez);
 *   - as fases (alvos, movimento, ataques, eventos de início);
 *   - ganchos opcionais: inclinação, atualização por quadro (órbitas),
 *     desenhos extras (escudos, avisos) e tempos (entrada, transição, morte);
 *   - mecânicas especiais opcionais (mundos 2 a 4):
 *       intangible(boss) -> true = tiros atravessam (Espectro)
 *       alpha(boss)      -> transparência ao desenhar
 *       segments(boss)   -> raios letais [{x1,y1,x2,y2,width}] (Hidra, Gêmeos, Fornalha...)
 *       pull(boss)       -> gravidade {x, y, strength} que puxa a nave (Vórtice)
 *
 * Máquina de estados:
 *   entering -> fight <-> transition -> ... -> dying -> dead
 *
 * Ideias centrais do design:
 *  1. Chefe = composição de PARTES (BossPart). Destruí-las muda visual e comportamento.
 *  2. Cada FASE tem pontos fracos diferentes. Partes blindadas fazem o tiro ricochetear.
 *  3. A ORDEM importa: partes podem revelar outras e mudar o comportamento das restantes.
 *
 * O Boss não conhece o DOM nem o canvas na lógica: ele conversa com o
 * "mundo" (a cena) por uma interface (world). Isso permite testá-lo no
 * Node.js com um mundo falso (ver tests/boss.test.js).
 */
import { GAME_WIDTH, PIXEL_SIZE } from '../config.js';
import { clamp, lerp, rotatePoint, rand, approach, easeOutCubic } from '../utils/math.js';
import { BossPart } from './BossPart.js';
import { BossLaser } from './BossLaser.js';
import { NEBULA_TITAN } from './bosses/nebulaTitan.js';

/** Tempos padrão (cada definição pode sobrescrever em `def.timing`). */
export const DEFAULT_TIMING = Object.freeze({
  entry: 3.2,
  transition: 2.6,
  death: 3.4,
  startY: -170,
  homeY: 140,
});

/** Tempos do Nebula Titan (mantido por compatibilidade com os testes). */
export const BOSS_TIMING = Object.freeze({ ...DEFAULT_TIMING, ...NEBULA_TITAN.timing });

const EARLY_BREAK_BONUS = 5000;

export class Boss {
  /**
   * @param {object} world interface com a cena (ver seção "mundo" na arquitetura)
   * @param {object} def definição do chefe (src/boss/bosses/)
   * @param {{hpScale?: number, attackRate?: number}} options
   *        hpScale multiplica a vida das partes (o Titã e o Leviatã são reforçados
   *        na campanha para compensar os buffs do jogador); attackRate acelera os
   *        ataques (dificuldade crescente a cada mundo)
   */
  constructor(world, def = NEBULA_TITAN, { hpScale = 1, attackRate = 1 } = {}) {
    this.world = world;
    this.def = def;
    this.attackRate = attackRate;
    this.timing = { ...DEFAULT_TIMING, ...(def.timing ?? {}) };
    this.x = GAME_WIDTH / 2;
    this.y = this.timing.startY;
    this.homeY = this.timing.homeY;

    this.parts = {};
    this.drawOrder = [];
    for (const partDef of def.parts) {
      const part = new BossPart(partDef);
      if (part.damageable && hpScale !== 1) {
        part.maxHp = Math.round(part.maxHp * hpScale);
        part.hp = part.maxHp;
      }
      this.parts[part.id] = part;
      this.drawOrder.push(part);
    }
    this.hitOrder = [...this.drawOrder].reverse(); // de cima para baixo

    this.phaseIndex = 0;
    this.state = 'entering';
    this.stateTime = 0;
    this.time = 0;
    this.tilt = 0;
    this.timers = {}; // zerados a cada fase
    this.vars = {}; // estado persistente do chefe (órbitas, investidas...)
    this.enraged = false;
    this.passive = false; // true = não ataca (ex.: após game over)
    this.laser = new BossLaser();
    this.shakeX = 0;
    this.shakeY = 0;
    this.effectsTimer = 0;
    this.destroyedOrder = [];
    def.init?.(this);
  }

  // ------------------------------------------------------------ consultas
  get name() {
    return this.def.name;
  }

  get phases() {
    return this.def.phases;
  }

  get phase() {
    return this.def.phases[this.phaseIndex];
  }

  get phaseCount() {
    return this.def.phases.length;
  }

  get alive() {
    return this.state !== 'dead';
  }

  /** Vida restante dos alvos da fase atual (0..1), para a barra do HUD. */
  phaseHealthRatio() {
    const targets = this.phase.targets.map((id) => this.parts[id]);
    const max = targets.reduce((sum, p) => sum + p.maxHp, 0);
    const hp = targets.reduce((sum, p) => sum + p.hp, 0);
    return max > 0 ? hp / max : 0;
  }

  /** Converte coordenadas locais do chefe (com inclinação) para o mundo. */
  worldPoint(lx, ly) {
    const r = rotatePoint(lx, ly, this.tilt);
    return { x: this.x + r.x, y: this.y + r.y };
  }

  partRect(part) {
    const c = this.worldPoint(part.ox, part.oy);
    return { x: c.x - part.w / 2, y: c.y - part.h / 2, w: part.w, h: part.h, cx: c.x, cy: c.y };
  }

  isPartVisible(part) {
    if (part.requires && !this.parts[part.requires].destroyed) return false;
    // Peças escondidas só aparecem quando a peça que as cobre cai.
    if (part.revealedBy && !this.parts[part.revealedBy].destroyed) return false;
    if (this.phaseIndex < part.visibleFromPhase) return false;
    if (part.destroyed) return part.look === 'husk';
    return true;
  }

  /** Partes sólidas bloqueiam tiros (causando dano ou ricochete). */
  isPartSolid(part) {
    if (part.destroyed || !this.isPartVisible(part)) return false;
    if (this.intangible) return false;
    return this.phaseIndex < part.solidUntilPhase;
  }

  isPartVulnerable(part) {
    if (this.state !== 'fight' || part.destroyed || !part.damageable) return false;
    if (!this.isPartVisible(part)) return false;
    if (part.phase === this.phaseIndex) return true;
    // Quebra antecipada: parte exposta porque a peça que a cobria caiu.
    return Boolean(part.revealedBy && this.parts[part.revealedBy].destroyed && part.phase > this.phaseIndex);
  }

  /** Texto extra para o HUD (ex.: contagem regressiva da Hidra). */
  hudHint() {
    return this.def.hudHint?.(this) ?? null;
  }

  /** Chefe "fora de fase" (Espectro): visível, mas os tiros atravessam. */
  get intangible() {
    return Boolean(this.def.intangible?.(this));
  }

  /** Raios letais ativos agora (a cena testa a colisão com o jogador). */
  lethalSegments() {
    if (this.state !== 'fight' || this.passive) return [];
    return this.def.segments?.(this) ?? [];
  }

  /** Gravidade que puxa a nave do jogador (null = nenhuma). */
  pullForce() {
    if (this.state !== 'fight' || this.passive) return null;
    return this.def.pull?.(this) ?? null;
  }

  vulnerableParts() {
    return this.drawOrder.filter((p) => this.isPartVulnerable(p));
  }

  /**
   * Testa um projétil circular contra os PIXELS VISÍVEIS das partes.
   * Pontos fracos ganham 2 px de tolerância extra (generosidade com o jogador).
   */
  hitTest(x, y, radius) {
    if (this.state !== 'fight' && this.state !== 'transition') return null;
    // Converte o ponto para o espaço local do chefe (desfazendo a inclinação).
    const local = rotatePoint(x - this.x, y - this.y, -this.tilt);
    for (const part of this.hitOrder) {
      if (!this.isPartSolid(part)) continue;
      const lx = local.x - part.ox;
      const ly = local.y - part.oy;
      const margin = radius + 2;
      // Descarte rápido pela caixa do sprite antes de olhar os pixels.
      if (Math.abs(lx) > part.spriteW / 2 + margin || Math.abs(ly) > part.spriteH / 2 + margin) continue;
      const vulnerable = this.isPartVulnerable(part);
      if (part.overlapsCircle(lx, ly, vulnerable ? radius + 2 : radius)) {
        return { part, vulnerable };
      }
    }
    return null;
  }

  /**
   * Testa o CAMINHO percorrido pelo projétil entre dois quadros, em passos
   * pequenos, para que tiros rápidos não "atravessem" partes finas.
   */
  hitTestPath(x0, y0, x1, y1, radius, step = 4) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const hit = this.hitTest(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius);
      if (hit) return { ...hit, x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t };
    }
    return null;
  }

  /** O corpo do chefe encosta no círculo (dano por contato)? */
  touches(x, y, radius) {
    // Chefes que ficam "abaixo" do jogador (ex.: o casco do Leviatã) não causam contato.
    if (this.state !== 'fight' || this.def.contactDamage === false) return false;
    return this.hitTest(x, y, radius) !== null;
  }

  /**
   * Aplica dano a uma parte. Retorna true se ela foi destruída.
   * Partes blindadas (armor) reduzem o dano de tiros comuns; o Tiro
   * Perfurante e a Bomba ignoram a blindagem.
   */
  applyDamage(part, amount, { piercing = false, ignoreArmor = false } = {}) {
    if (!this.isPartVulnerable(part)) return false;
    const factor = piercing || ignoreArmor ? 1 : 1 - part.armor;
    const destroyed = part.damage(amount * factor);
    if (destroyed) this.onPartDestroyed(part);
    return destroyed;
  }

  // ------------------------------------------------------------ atualização
  update(dt) {
    this.time += dt;
    this.stateTime += dt;
    for (const part of this.drawOrder) part.update(dt);
    if (this.state !== 'dead') this.def.update?.(this, dt);

    switch (this.state) {
      case 'entering': {
        const t = clamp(this.stateTime / this.timing.entry, 0, 1);
        this.y = lerp(this.timing.startY, this.homeY, easeOutCubic(t));
        if (t >= 1) {
          this.setState('fight');
          this.startPhase(0);
        }
        break;
      }
      case 'fight':
        this.updateTilt(dt);
        this.phase.move(this, dt);
        this.laser.update(dt, this);
        if (!this.passive) this.phase.attack(this, dt * this.attackRate);
        break;
      case 'transition':
        this.updateTilt(dt);
        this.x = approach(this.x, GAME_WIDTH / 2, 60 * dt);
        this.y = approach(this.y, this.homeY, 120 * dt);
        this.shakeX = rand(-2, 2);
        this.shakeY = rand(-2, 2);
        if (this.stateTime >= this.timing.transition) {
          this.shakeX = 0;
          this.shakeY = 0;
          this.setState('fight');
          this.startPhase(this.phaseIndex + 1);
        }
        break;
      case 'dying':
        this.updateDying(dt);
        break;
      default:
        break;
    }

    if (this.state !== 'dead' && this.state !== 'entering') this.emitDamageEffects(dt);
  }

  setState(state) {
    this.state = state;
    this.stateTime = 0;
  }

  updateTilt(dt) {
    let target = this.def.tilt?.(this) ?? 0;
    if (target) target += Math.sin(this.time * 2.3) * 0.03;
    if (this.enraged) target += Math.sin(this.time * 5) * 0.05;
    this.tilt = approach(this.tilt, target, dt * 0.6);
  }

  startPhase(index) {
    this.phaseIndex = index;
    this.timers = {};
    if (this.def.phaseHomeY) this.homeY = this.def.phaseHomeY(index);
    this.laser.cancel();
    const phase = this.phase;
    const world = this.world;

    phase.onStart?.(this);
    if (phase.enrage) this.enraged = true;

    world.announce(`FASE ${index + 1}/${this.phaseCount}`, phase.title, 2.6, 'phase', phase.hint);
    world.onPhaseStart?.(index, phase);

    // Se o jogador já destruiu os alvos desta fase antecipadamente, pula.
    if (phase.targets.every((id) => this.parts[id].destroyed)) {
      world.addScore(EARLY_BREAK_BONUS, this.x, this.y, 'FASE PULADA!');
      this.completePhase();
    }
  }

  /** Arranca uma parte por roteiro (ex.: placa blindada que revela o núcleo). */
  blowOff(partId) {
    const part = this.parts[partId];
    const r = this.partRect(part);
    part.forceDestroy();
    const w = this.world;
    w.particles.explosion(r.cx, r.cy, 2);
    w.particles.debris(r.cx, r.cy, part.debrisColors, 28);
    w.shake(10, 0.6);
    w.flash(0.6);
    w.audio.play('partDestroyed');
    this.destroyedOrder.push(part.name);
  }

  completePhase() {
    this.laser.cancel();
    if (this.phaseIndex >= this.phaseCount - 1) {
      this.startDying();
      return;
    }
    this.setState('transition');
    // Chefes com "câmera" (Leviatã): a transição avança até a próxima seção.
    if (this.def.phaseHomeY) this.homeY = this.def.phaseHomeY(this.phaseIndex + 1);
    this.world.clearEnemyBullets(true);
    this.world.onPhaseCleared?.(this.phaseIndex);
  }

  onPartDestroyed(part) {
    const w = this.world;
    const r = this.partRect(part);
    this.destroyedOrder.push(part.name);

    w.particles.explosion(r.cx, r.cy, part.explosionScale);
    w.particles.debris(r.cx, r.cy, part.debrisColors, 24);
    w.shake(8, 0.45);
    w.hitstop(0.09);
    w.flash(0.35);
    w.audio.play('partDestroyed');
    w.addScore(part.points, r.cx, r.cy);
    if (part.drop) w.spawnPowerUp(part.drop, r.cx, r.cy);

    // Peças reveladas pela destruição desta.
    for (const revealed of this.drawOrder) {
      if (revealed.revealedBy === part.id && !revealed.destroyed && revealed.revealText) {
        w.popup(revealed.revealText, r.cx, r.cy + 24, '#73eff7');
      }
    }

    // Destruiu uma parte antes da fase dela: bônus.
    if (part.phase > this.phaseIndex) {
      w.addScore(EARLY_BREAK_BONUS, r.cx, r.cy - 16, 'QUEBRA ANTECIPADA!');
    }

    this.def.onPartDestroyed?.(this, part);
    w.onPartDestroyed?.(part);

    if (this.phase.targets.every((id) => this.parts[id].destroyed)) this.completePhase();
  }

  startDying() {
    this.setState('dying');
    this.laser.cancel();
    this.world.clearEnemyBullets(true);
    this.world.onBossDying?.();
  }

  /** Centro local das explosões de morte (o Leviatã explode na seção atual). */
  focusLocal() {
    return this.def.focusPoint?.(this) ?? { x: 0, y: 0 };
  }

  updateDying(dt) {
    const w = this.world;
    const size = this.def.size ?? { w: 160, h: 90 };
    const f = this.focusLocal();
    this.y += 12 * dt;
    this.tilt += dt * 0.08;
    this.shakeX = rand(-3, 3);
    this.shakeY = rand(-3, 3);
    this.timers.boom = (this.timers.boom ?? 0) - dt;
    if (this.timers.boom <= 0) {
      this.timers.boom = 0.14;
      const p = this.worldPoint(f.x + rand(-size.w / 2, size.w / 2), f.y + rand(-size.h / 2, size.h / 2));
      w.particles.explosion(p.x, p.y, rand(0.8, 1.6));
      w.audio.play('explosionSmall');
      w.shake(5, 0.2);
    }
    if (this.stateTime >= this.timing.death) {
      for (let i = 0; i < 6; i++) {
        const p = this.worldPoint(f.x + rand(-size.w / 3, size.w / 3), f.y + rand(-size.h / 3, size.h / 3));
        w.particles.explosion(p.x, p.y, 3);
      }
      const c = this.worldPoint(f.x, f.y);
      w.particles.debris(c.x, c.y, this.def.debrisColors ?? ['#8e478c', '#5d275d', '#94b0c2', '#e43b8c'], 60);
      w.particles.ring(c.x, c.y, '#ffffff', 220, 0.8);
      w.flash(1);
      w.shake(14, 1);
      w.audio.play('bossDeath');
      this.setState('dead');
      w.onBossDefeated?.();
    }
  }

  /** Fumaça em partes danificadas e faíscas nos "tocos" de partes arrancadas. */
  emitDamageEffects(dt) {
    this.effectsTimer -= dt;
    if (this.effectsTimer > 0) return;
    this.effectsTimer = 0.1;
    const particles = this.world.particles;

    for (const part of this.drawOrder) {
      if (part.destroyed && part.sparksAt && Math.random() < 0.6) {
        const p = this.worldPoint(part.sparksAt.x, part.sparksAt.y + rand(-8, 8));
        particles.sparks(p.x, p.y, 2);
      }
      if (!this.isPartVisible(part)) continue;
      const level = part.destroyed ? 2 : part.damageLevel;
      if (level > 0 && Math.random() < 0.25 * level) {
        const r = this.partRect(part);
        particles.smoke(r.x + Math.random() * r.w, r.y + Math.random() * r.h);
      }
    }
  }

  // ------------------------------------------------------------ desenho
  draw(ctx, sprites, debug = false) {
    if (this.state === 'dead') return;

    ctx.save();
    ctx.globalAlpha = this.def.alpha?.(this) ?? 1;
    ctx.translate(Math.round(this.x + this.shakeX), Math.round(this.y + this.shakeY));
    ctx.rotate(this.tilt);
    this.def.drawBehind?.(ctx, this);

    const rageSprite = this.def.rageSprite;
    for (const part of this.drawOrder) {
      if (!this.isPartVisible(part)) continue;
      let variant = null;
      if (part.destroyed) variant = 'husk';
      else if (part.flash > 0) variant = 'flash';
      else if (!part.damageable) {
        // Blindagem acumula rachaduras a cada fase; fica vermelha quando enfurecido.
        const armorDamage = Math.min(2, this.phaseIndex);
        variant = this.enraged && part.sprite === rageSprite ? 'rage' : armorDamage > 0 ? `dmg${armorDamage}` : null;
      } else if (part.damageLevel > 0) variant = `dmg${part.damageLevel}`;

      const scale = part.pulse ? 1 + Math.sin(this.time * 10) * 0.07 : 1;
      sprites.draw(ctx, part.sprite, part.ox, part.oy, { variant, scale });
    }

    this.def.drawFront?.(ctx, this);
    ctx.restore();

    this.def.drawWorld?.(ctx, this);
    if (this.state === 'fight' && !this.intangible) this.drawWeakPointMarkers(ctx);
    this.laser.draw(ctx, this);
    if (debug) this.drawDebug(ctx);
  }

  /** Colchetes pulsantes ao redor dos pontos fracos atuais (legibilidade). */
  drawWeakPointMarkers(ctx) {
    const pulse = 3 + Math.sin(this.time * 8) * 2;
    ctx.lineWidth = 2;
    for (const part of this.vulnerableParts()) {
      // Cores: amarelo = ponto fraco; cinza-azulado = blindado; verde = regenerando.
      ctx.strokeStyle = part.regenerating ? '#a7f070' : part.armor > 0 ? '#94b0c2' : '#ffcd75';
      const r = this.partRect(part);
      const x1 = r.x - pulse;
      const y1 = r.y - pulse;
      const x2 = r.x + r.w + pulse;
      const y2 = r.y + r.h + pulse;
      const L = 7;
      ctx.beginPath();
      ctx.moveTo(x1, y1 + L); ctx.lineTo(x1, y1); ctx.lineTo(x1 + L, y1);
      ctx.moveTo(x2 - L, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y1 + L);
      ctx.moveTo(x1, y2 - L); ctx.lineTo(x1, y2); ctx.lineTo(x1 + L, y2);
      ctx.moveTo(x2 - L, y2); ctx.lineTo(x2, y2); ctx.lineTo(x2, y2 - L);
      ctx.stroke();
    }
  }

  /** Desenha a máscara de colisão real (verde = vulnerável, cinza = blindado). */
  drawDebug(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tilt);
    ctx.globalAlpha = 0.45;
    for (const part of this.drawOrder) {
      if (!this.isPartSolid(part)) continue;
      ctx.fillStyle = this.isPartVulnerable(part) ? '#38b764' : '#566c86';
      const left = part.ox - part.spriteW / 2;
      const top = part.oy - part.spriteH / 2;
      part.maskRows.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
          if (row[c] !== '.') ctx.fillRect(left + c * PIXEL_SIZE, top + r * PIXEL_SIZE, PIXEL_SIZE - 1, PIXEL_SIZE - 1);
        }
      });
    }
    ctx.restore();
  }
}
