/**
 * Alienígena de formação — o comportamento clássico do Galaga:
 *
 *   waiting -> entering (voa por uma trajetória curva)
 *           -> toSlot (vai até sua vaga na formação)
 *           -> formation (balança junto com a formação, às vezes atira)
 *           -> diving (mergulha no jogador, atira; se sair por baixo,
 *                      reaparece no topo e volta para a vaga)
 *
 * Abater um alienígena durante o mergulho vale o dobro de pontos.
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H } from '../config.js';
import { angleDiff, approach } from '../utils/math.js';
import { ALIEN_TYPES } from './alienTypes.js';
import { fireAlienShot } from './Minion.js';

const ENTRY_DURATION = 2.2;
const TO_SLOT_SPEED = 320;
const DIVE_SPEED = 240; // padrão (cada tipo pode ter o seu: ALIEN_TYPES[type].diveSpeed)

/**
 * Trajetórias de entrada parametrizadas por t ∈ [0, 1].
 * dir = +1 entra pela esquerda, -1 pela direita.
 */
const PATHS = {
  // Desce pela lateral, faz um looping e sobe para a formação.
  swoop(t, dir) {
    const x0 = dir > 0 ? 130 : W - 130;
    const x1 = x0 + dir * 60;
    if (t < 0.45) {
      const a = t / 0.45;
      return { x: x0 + dir * 60 * a, y: -20 + 320 * a };
    }
    const b = (t - 0.45) / 0.55;
    const cx = x1 - dir * 50;
    const start = dir > 0 ? 0 : Math.PI;
    const angle = start + dir * Math.PI * 2 * b;
    return { x: cx + Math.cos(angle) * 50, y: 300 + Math.sin(angle) * 50 };
  },
  // Cruza a tela de lado em arco.
  side(t, dir) {
    const x0 = dir > 0 ? -20 : W + 20;
    return { x: x0 + dir * W * 0.7 * t, y: 230 - Math.sin(t * Math.PI) * 110 };
  },
  // Cai pelo topo em zigue-zague até o meio da tela e sobe de volta (Mundos 2+).
  dive(t, dir) {
    const x0 = W / 2 - dir * 40;
    return { x: x0 + Math.sin(t * Math.PI * 2) * dir * 150, y: -20 + Math.sin(t * Math.PI) * 360 };
  },
};

export class FormationEnemy {
  /**
   * @param {object} opts
   * @param {string} opts.type tipo em ALIEN_TYPES
   * @param {{col:number,row:number}} opts.slot vaga na formação
   * @param {'swoop'|'side'|'dive'} opts.path trajetória de entrada
   * @param {number} opts.dir lado de entrada (+1 esquerda, -1 direita)
   * @param {number} opts.delay atraso para entrar em fila
   * @param {object} opts.formation objeto que calcula a posição das vagas
   */
  constructor({ type, slot, path, dir, delay, formation }) {
    this.type = type;
    this.info = ALIEN_TYPES[type];
    this.slot = slot;
    this.path = PATHS[path];
    this.dir = dir;
    this.delay = delay;
    this.formation = formation;
    this.state = 'waiting';
    this.t = 0;
    this.hp = this.info.hp;
    this.radius = this.info.radius ?? 12;
    this.x = -100;
    this.y = -100;
    this.vx = 0;
    this.vy = 0;
    this.heading = 0;
    this.flash = 0;
    this.dead = false;
  }

  get active() {
    return this.state !== 'waiting';
  }

  get inFormation() {
    return this.state === 'formation';
  }

  get points() {
    return this.state === 'diving' ? this.info.divePoints : this.info.points;
  }

  get dropChance() {
    return this.info.dropChance;
  }

  update(dt, scene) {
    this.flash = Math.max(0, this.flash - dt);
    const prevX = this.x;
    const prevY = this.y;

    switch (this.state) {
      case 'waiting':
        this.delay -= dt;
        if (this.delay <= 0) {
          this.state = 'entering';
          this.t = 0;
        }
        return;
      case 'entering': {
        this.t += dt / ENTRY_DURATION;
        const p = this.path(Math.min(1, this.t), this.dir);
        this.x = p.x;
        this.y = p.y;
        if (this.t >= 1) this.state = 'toSlot';
        break;
      }
      case 'toSlot': {
        const s = this.formation.slotPos(this.slot);
        const d = Math.hypot(s.x - this.x, s.y - this.y);
        const step = TO_SLOT_SPEED * dt;
        if (d <= step) {
          this.state = 'formation';
          this.x = s.x;
          this.y = s.y;
        } else {
          this.x += ((s.x - this.x) / d) * step;
          this.y += ((s.y - this.y) / d) * step;
        }
        break;
      }
      case 'formation': {
        const s = this.formation.slotPos(this.slot);
        this.x = s.x;
        this.y = s.y;
        break;
      }
      case 'diving':
        this.t += dt;
        // Curva de perseguição nos primeiros instantes, depois segue reto.
        const speed = this.info.diveSpeed ?? DIVE_SPEED;
        const turnRate = this.info.diveTurn ?? 2.6;
        if (this.t > 0.35 && this.t < (this.info.diveChase ?? 1.6) && scene.player.alive) {
          const current = Math.atan2(this.vy, this.vx);
          const desired = Math.atan2(scene.player.y - this.y, scene.player.x - this.x);
          const turn = Math.max(-turnRate * dt, Math.min(turnRate * dt, angleDiff(current, desired)));
          this.vx = Math.cos(current + turn) * speed;
          this.vy = Math.sin(current + turn) * speed;
        } else if (this.t <= 0.35) {
          this.vy += 600 * dt; // fim do "pulo" inicial para fora da formação
        }
        if (!this.fired && this.t > 0.5) {
          this.fired = true;
          if (this.info.shot) fireAlienShot(scene, this.x, this.y + 10, this.info.shot);
        }
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.x = Math.max(-30, Math.min(W + 30, this.x));
        if (this.y > H + 20) {
          // Saiu por baixo: reaparece no topo e volta para a vaga.
          this.y = -20;
          this.x = this.formation.slotPos(this.slot).x;
          this.state = 'toSlot';
        }
        break;
      default:
        break;
    }

    const dx = this.x - prevX;
    const dy = this.y - prevY;
    if (Math.abs(dx) + Math.abs(dy) > 0.5) this.heading = Math.atan2(dy, dx) - Math.PI / 2;
    else this.heading = approach(this.heading, 0, dt * 4);
  }

  /** Começa um mergulho (chamado pelo diretor da fase). */
  startDive() {
    if (this.state !== 'formation') return false;
    this.state = 'diving';
    this.t = 0;
    this.fired = false;
    const side = this.x < W / 2 ? -1 : 1;
    this.vx = side * 110;
    this.vy = -160; // "pula" para fora da formação antes de descer
    return true;
  }

  damage(amount) {
    this.hp -= amount;
    this.flash = 0.08;
    if (this.hp <= 0) this.dead = true;
    return this.dead;
  }

  draw(ctx, sprites) {
    if (!this.active) return;
    // Em formação, as "asas" batem (leve escala horizontal).
    const flap = this.state === 'formation' ? 1 + Math.sin(this.formation.time * 8 + this.slot.col) * 0.06 : 1;
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.rotate(this.state === 'formation' ? 0 : this.heading);
    ctx.scale(flap, 1);
    sprites.draw(ctx, this.info.sprite, 0, 0, { variant: this.flash > 0 ? 'flash' : null });
    ctx.restore();
  }
}
