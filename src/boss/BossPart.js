/**
 * BossPart — uma peça individual do chefe (asa, gerador, canhão, núcleo...).
 *
 * Cada parte tem vida própria, posição relativa ao centro do chefe,
 * hitbox, aparência quando destruída e recompensa. O chefe é uma
 * COMPOSIÇÃO de partes: é isso que permite que ele mude de aparência
 * e comportamento conforme o jogador o desmonta.
 *
 * Colisão por máscara de pixels: a parte só é atingida onde há pixel
 * visível no sprite (o que você vê é o que você acerta). Os campos w/h
 * continuam existindo como "caixa" para marcadores e efeitos visuais.
 */
import { SPRITES } from '../graphics/spriteData.js';
import { PIXEL_SIZE } from '../config.js';

export class BossPart {
  constructor(def) {
    this.id = def.id;
    this.name = def.name;
    // Máscara de colisão derivada do sprite de texto (independente do DOM).
    this.maskRows = SPRITES[def.sprite].rows;
    this.spriteW = this.maskRows[0].length * PIXEL_SIZE;
    this.spriteH = this.maskRows.length * PIXEL_SIZE;
    this.sprite = def.sprite;
    this.ox = def.ox; // deslocamento X em relação ao centro do chefe
    this.oy = def.oy; // deslocamento Y
    this.w = def.w ?? Math.round(this.spriteW * 0.9); // caixa para marcadores/efeitos
    this.h = def.h ?? Math.round(this.spriteH * 0.9);
    this.maxHp = def.hp ?? Infinity; // Infinity = indestrutível (blindagem)
    this.hp = this.maxHp;
    this.phase = def.phase ?? -1; // fase em que é alvo (-1 = nunca)
    this.look = def.look ?? 'remove'; // 'remove' some | 'husk' vira carcaça
    this.requires = def.requires ?? null; // só aparece se esta parte foi destruída
    this.revealedBy = def.revealedBy ?? null; // escondida até esta parte cair (e exposta antecipadamente)
    this.revealText = def.revealText ?? null; // mensagem exibida quando é revelada
    this.visibleFromPhase = def.visibleFromPhase ?? 0; // só aparece a partir desta fase
    this.solidUntilPhase = def.solidUntilPhase ?? Infinity; // deixa de bloquear tiros nesta fase
    this.sparksAt = def.sparksAt ?? null; // {x, y}: faíscas no "toco" após ser destruída
    this.pulse = def.pulse ?? false; // pulsa (núcleos de energia)
    this.armor = def.armor ?? 0; // 0..1: redução de dano de tiros comuns (o perfurante ignora)
    this.regen = def.regen ?? 0; // vida recuperada por segundo quando não é atingida
    this.regenDelay = def.regenDelay ?? 1.2; // segundos sem levar dano antes de regenerar
    this.sinceHit = 0;
    this.drop = def.drop ?? null;
    this.points = def.points ?? 0;
    this.debrisColors = def.debrisColors ?? ['#8e478c', '#5d275d', '#94b0c2'];
    this.explosionScale = def.explosionScale ?? 1.5;
    this.destroyed = false;
    this.flash = 0;
  }

  get damageable() {
    return Number.isFinite(this.maxHp);
  }

  get healthRatio() {
    return this.damageable ? Math.max(0, this.hp / this.maxHp) : 1;
  }

  /** 0 = intacta, 1 = rachada, 2 = muito danificada. */
  get damageLevel() {
    if (!this.damageable || this.destroyed) return 0;
    const ratio = this.healthRatio;
    if (ratio > 0.66) return 0;
    if (ratio > 0.33) return 1;
    return 2;
  }

  /** Está recuperando vida neste momento? */
  get regenerating() {
    return this.regen > 0 && !this.destroyed && this.sinceHit >= this.regenDelay && this.hp < this.maxHp;
  }

  /** Aplica dano. Retorna true se a parte foi destruída AGORA. */
  damage(amount) {
    if (this.destroyed || !this.damageable) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.flash = 0.06;
    this.sinceHit = 0;
    if (this.hp <= 0) {
      this.destroyed = true;
      return true;
    }
    return false;
  }

  /** Destrói a parte sem passar pelo dano (ex.: placa arrancada por roteiro). */
  forceDestroy() {
    this.hp = 0;
    this.destroyed = true;
  }

  /** O ponto local (relativo ao centro desta parte) cai sobre um pixel visível? */
  isOpaqueAt(lx, ly) {
    const col = Math.floor((lx + this.spriteW / 2) / PIXEL_SIZE);
    const row = Math.floor((ly + this.spriteH / 2) / PIXEL_SIZE);
    if (row < 0 || row >= this.maskRows.length || col < 0 || col >= this.maskRows[0].length) return false;
    return this.maskRows[row][col] !== '.';
  }

  /** Círculo (em coordenadas locais) toca algum pixel visível? Amostra centro + 8 pontos da borda. */
  overlapsCircle(lx, ly, radius) {
    if (this.isOpaqueAt(lx, ly)) return true;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      if (this.isOpaqueAt(lx + Math.cos(a) * radius, ly + Math.sin(a) * radius)) return true;
    }
    return false;
  }

  update(dt) {
    this.flash = Math.max(0, this.flash - dt);
    this.sinceHit += dt;
    if (this.regenerating) this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);
  }
}
