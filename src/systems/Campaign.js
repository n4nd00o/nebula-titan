/**
 * Campaign — estado e regras do modo Campanha (lógica pura, testável).
 *
 * Progressão:
 *   Setor 1 -> Setor 2 (obrigatórios, sem buffs, dão pontos)
 *   -> 3 mini-chefes em ordem livre (cada um dá um buff permanente)
 *   -> Bomba de Pulso liberada -> Nebula Titan -> LEVIATÃ (chefe final)
 *
 * Vidas: acumulam entre as fases (começa com 3, máximo 5). Vida extra pelo
 * power-up 1UP e a cada 50.000 pontos.
 *
 * Derrota: recomeça a fase atual com 3 vidas e os buffs já conquistados,
 * mas a pontuação é zerada. Zerar o jogo sem nenhuma morte dá um bônus enorme.
 */
import { PLAYER } from '../config.js';

export const STAGE_IDS = Object.freeze(['stage1', 'stage2']);
export const MINI_BOSS_IDS = Object.freeze(['sentinel', 'hive', 'reaper']);
export const TITAN_ID = 'titan';
export const FINAL_BOSS_ID = 'leviathan';
export const PERFECT_RUN_BONUS = 100000;

export const BUFFS = Object.freeze({
  piercing: {
    name: 'TIRO PERFURANTE',
    short: 'PERFURANTE',
    description: 'Tiros causam +50% de dano, atravessam drones e ignoram blindagem.',
    color: '#73eff7',
  },
  wingman: {
    name: 'ALA COMPANHEIRA',
    short: 'ALA',
    description: 'Uma nave aliada voa ao seu lado e atira junto.',
    color: '#38b764',
  },
  dash: {
    name: 'DASH',
    short: 'DASH',
    description: 'C: investida rápida e invencível (recarga de 2 s).',
    color: '#ffcd75',
  },
  bomb: {
    name: 'BOMBA DE PULSO',
    short: 'BOMBA',
    description: 'X: limpa a tela e fere o chefe (2 cargas por luta).',
    color: '#e43b8c',
  },
});

/** Buff concedido por cada mini-chefe. */
export const REWARDS = Object.freeze({
  sentinel: 'piercing',
  hive: 'wingman',
  reaper: 'dash',
});

/** Buff extra liberado ao derrotar os três mini-chefes. */
export const COMPLETION_REWARD = 'bomb';

export class Campaign {
  constructor() {
    this.defeated = new Set();
    this.buffs = new Set();
    this.order = []; // ordem em que as fases/chefes foram vencidos
    this.score = 0;
    this.lives = PLAYER.lives;
    this.nextLifeAt = PLAYER.extraLifeEvery;
    this.deaths = 0; // todas as vidas perdidas (inclusive em tentativas fracassadas)
    this.continues = 0;
    this.stats = { time: 0, shots: 0, hits: 0, damageTaken: 0 };
  }

  get minisDone() {
    return MINI_BOSS_IDS.every((id) => this.defeated.has(id));
  }

  /** Mantido por compatibilidade: o Titã é liberado pelos 3 mini-chefes. */
  get titanUnlocked() {
    return this.minisDone;
  }

  get leviathanUnlocked() {
    return this.defeated.has(TITAN_ID);
  }

  get complete() {
    return this.defeated.has(FINAL_BOSS_ID);
  }

  get perfect() {
    return this.deaths === 0;
  }

  hasBuff(id) {
    return this.buffs.has(id);
  }

  /** Fases/chefes que podem ser jogados agora. */
  available() {
    const stage = STAGE_IDS.find((id) => !this.defeated.has(id));
    if (stage) return [stage];
    const minis = MINI_BOSS_IDS.filter((id) => !this.defeated.has(id));
    if (minis.length) return minis;
    if (!this.defeated.has(TITAN_ID)) return [TITAN_ID];
    if (!this.complete) return [FINAL_BOSS_ID];
    return [];
  }

  canFight(id) {
    return this.available().includes(id);
  }

  /** A próxima etapa é uma fase linear (sem escolha no mapa)? */
  get nextIsStage() {
    return STAGE_IDS.includes(this.available()[0]);
  }

  /**
   * Registra uma vitória e retorna os buffs ganhos nela.
   * @param {string} id fase ou chefe vencido
   * @param {{time:number, shots:number, hits:number, damageTaken:number}} fightStats
   * @param {number} score pontuação acumulada ao final da luta
   * @param {number} lives vidas restantes (passam para a próxima fase)
   * @returns {string[]} ids dos buffs novos
   */
  recordVictory(id, fightStats, score, lives = this.lives) {
    if (!this.canFight(id)) throw new Error(`Fase indisponível: ${id}`);
    this.defeated.add(id);
    this.order.push(id);
    this.score = score;
    this.lives = Math.min(lives, PLAYER.maxLives);
    for (const key of Object.keys(this.stats)) this.stats[key] += fightStats[key] ?? 0;

    const gained = [];
    const reward = REWARDS[id];
    if (reward && !this.buffs.has(reward)) gained.push(reward);
    if (this.minisDone && !this.buffs.has(COMPLETION_REWARD)) gained.push(COMPLETION_REWARD);
    gained.forEach((b) => this.buffs.add(b));
    return gained;
  }

  recordDeath() {
    this.deaths++;
  }

  /** Derrota: recomeça a fase atual com 3 vidas, mantendo buffs e zerando a pontuação. */
  recordContinue() {
    this.continues++;
    this.score = 0;
    this.lives = PLAYER.lives;
    this.nextLifeAt = PLAYER.extraLifeEvery;
  }
}
