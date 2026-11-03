/**
 * WaveStage — "diretor" das fases de ondas (os Setores de cada mundo).
 *
 * Implementa a mesma interface de "encontro" que o Boss (update, draw,
 * state, phaseIndex, phaseCount, hitTestPath, touches...), o que permite à
 * PlayScene rodar uma fase de ondas exatamente como roda uma luta de chefe.
 *
 * Também funciona como a FORMAÇÃO: calcula a posição de cada vaga, com o
 * balanço lateral e a "respiração" típicos do Galaga.
 *
 * Fluxo: entering -> fight (onda n) -> transition -> fight (onda n+1) ... -> dying -> dead
 */
import { GAME_WIDTH as W } from '../config.js';
import { FormationEnemy } from '../entities/FormationEnemy.js';
import { fireAlienShot } from '../entities/Minion.js';
import { ALIEN_TYPES } from '../entities/alienTypes.js';

const COLUMNS = 8;
const COLUMN_ORDER = [3, 4, 2, 5, 1, 6, 0, 7]; // preenche do centro para fora
const SLOT_SPACING_X = 40;
const SLOT_SPACING_Y = 32;
const FORMATION_TOP = 96;

/** "Laser" inerte: fases de ondas não têm laser, mas a cena consulta o objeto. */
const NO_LASER = Object.freeze({ active: false, isLethal: false, cancel() {}, draw() {} });

export class WaveStage {
  /**
   * @param {object} world a cena
   * @param {object} def definição do setor (stageData.js)
   * @param {{attackRate?: number}} options attackRate > 1 = mergulhos e tiros mais frequentes
   */
  constructor(world, def, { attackRate = 1 } = {}) {
    this.world = world;
    this.def = def;
    this.attackRate = attackRate;
    this.phaseIndex = 0;
    this.state = 'entering';
    this.stateTime = 0;
    this.time = 0;
    this.enemies = [];
    this.timers = {};
    this.passive = false;
    this.laser = NO_LASER;
    this.parts = {};
    this.destroyedOrder = [];
    this.phaseLabel = 'ONDA';
    this.entryDelay = 1.5; // espera antes da 1ª onda (maior quando a cena apresenta um mundo novo)
    this.x = W / 2;
    this.y = 120;
  }

  // ------------------------------------------------------------ interface de "encontro"
  get name() {
    return this.def.name;
  }

  get phaseCount() {
    return this.def.waves.length;
  }

  get wave() {
    return this.def.waves[this.phaseIndex];
  }

  get phase() {
    return { title: this.wave.title, hint: this.wave.hint, targets: [] };
  }

  get aliveEnemies() {
    return this.enemies.filter((e) => !e.dead);
  }

  phaseHealthRatio() {
    return this.enemies.length ? this.aliveEnemies.length / this.enemies.length : 1;
  }

  hudHint() {
    return `INIMIGOS RESTANTES: ${this.aliveEnemies.length}`;
  }

  hitTestPath() {
    return null; // os alienígenas são testados pela cena, como drones
  }

  touches() {
    return false;
  }

  lethalSegments() {
    return [];
  }

  pullForce() {
    return null;
  }

  vulnerableParts() {
    return [];
  }

  applyDamage() {
    return false;
  }

  // ------------------------------------------------------------ formação
  slotPos({ col, row }) {
    const breath = 1 + Math.sin(this.time * 1.5) * 0.05;
    const sway = Math.sin(this.time * 0.7) * 28;
    return {
      x: W / 2 + (col - (COLUMNS - 1) / 2) * SLOT_SPACING_X * breath + sway,
      y: FORMATION_TOP + row * SLOT_SPACING_Y,
    };
  }

  // ------------------------------------------------------------ atualização
  update(dt) {
    this.time += dt;
    this.stateTime += dt;

    switch (this.state) {
      case 'entering':
        if (this.stateTime >= this.entryDelay) this.startWave(0);
        break;
      case 'fight':
        if (!this.passive) this.direct(dt * this.attackRate);
        if (this.enemies.length > 0 && this.aliveEnemies.length === 0) this.completeWave();
        break;
      case 'transition':
        if (this.stateTime >= 1.6) this.startWave(this.phaseIndex + 1);
        break;
      case 'dying':
        if (this.stateTime >= 1) {
          this.setState('dead');
          this.world.onBossDefeated?.();
        }
        break;
      default:
        break;
    }
  }

  setState(state) {
    this.state = state;
    this.stateTime = 0;
  }

  startWave(index) {
    this.phaseIndex = index;
    this.timers = { dive: 2.5, shoot: 2 };
    this.enemies = [];
    this.setState('fight');

    const usedCols = { top: 0, bottom: 0 };
    for (const group of this.wave.groups) {
      for (let i = 0; i < group.count; i++) {
        const slot = this.nextSlot(group.type, usedCols);
        const enemy = new FormationEnemy({
          type: group.type,
          slot,
          path: group.path,
          dir: group.dir,
          delay: (group.delay ?? 0) + i * 0.16,
          formation: this,
        });
        this.enemies.push(enemy);
        this.world.addEnemy(enemy);
      }
    }
    this.world.announce(`ONDA ${index + 1}/${this.phaseCount}`, this.wave.title, 2.2, 'phase', this.wave.hint ?? '');
  }

  /** Tipos "top" (laranja, azul) ocupam a fileira de cima; os demais, as três de baixo. */
  nextSlot(type, used) {
    const tier = ALIEN_TYPES[type].tier;
    const n = used[tier]++;
    if (tier === 'top') return { col: COLUMN_ORDER[n % COLUMNS], row: 0 };
    return { col: COLUMN_ORDER[n % COLUMNS], row: 1 + Math.floor(n / COLUMNS) % 3 };
  }

  /** Diretor de ataques: escolhe quem mergulha e quem atira da formação. */
  direct(dt) {
    const wave = this.wave;
    const alive = this.aliveEnemies;
    const inFormation = alive.filter((e) => e.inFormation);
    const diving = alive.filter((e) => e.state === 'diving').length;
    // Menos inimigos restantes = mergulhos mais frequentes (pressão crescente).
    const pressure = 0.5 + 0.5 * (alive.length / Math.max(1, this.enemies.length));

    this.timers.dive -= dt;
    if (this.timers.dive <= 0 && inFormation.length > 0 && diving < wave.maxDivers) {
      this.timers.dive = wave.diveEvery * pressure;
      const leader = inFormation[Math.floor(Math.random() * inFormation.length)];
      leader.startDive();
      // Laranja mergulha "puxando" até 2 escoltas verdes (formação em V).
      if (leader.info.leader) {
        inFormation
          .filter((e) => e.type === 'green' && e.slot.row === 1 && Math.abs(e.slot.col - leader.slot.col) <= 1)
          .slice(0, 2)
          .forEach((e) => e.startDive());
      }
    }

    this.timers.shoot -= dt;
    if (this.timers.shoot <= 0 && inFormation.length > 0) {
      this.timers.shoot = wave.shootEvery;
      const shooters = inFormation.filter((e) => e.info.shot);
      const shooter = shooters[Math.floor(Math.random() * shooters.length)];
      if (shooter) fireAlienShot(this.world, shooter.x, shooter.y + 10, { ...shooter.info.shot, count: 1 });
    }
  }

  completeWave() {
    if (this.phaseIndex >= this.phaseCount - 1) {
      this.setState('dying');
      this.world.onBossDying?.();
      return;
    }
    this.setState('transition');
    this.world.onPhaseCleared?.(this.phaseIndex);
  }

  draw() {
    // Os alienígenas são desenhados pela cena (lista de inimigos).
  }
}
