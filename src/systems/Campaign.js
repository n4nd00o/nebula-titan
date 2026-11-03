/**
 * Campaign — estado e regras do modo Campanha (lógica pura, testável).
 *
 * A campanha tem QUATRO MUNDOS. Cada mundo segue a mesma estrutura:
 *   2 Setores (ondas, obrigatórios, sem buffs)
 *   -> 3 mini-chefes em ordem livre (cada um dá um buff permanente)
 *   -> bônus de mundo (buff extra ao vencer os 3 mini-chefes)
 *   -> chefe do mundo
 * O Mundo 4 termina com o chefe final verdadeiro: o LEVIATÃ.
 *
 * Dificuldade: cada mundo acelera os ataques (attackRate) e os projéteis
 * inimigos (bulletSpeed). Chefes antigos que enfrentam um jogador com muitos
 * buffs (Titã, Leviatã) recebem vida extra (hpScale).
 *
 * Vidas: acumulam entre as fases (começa com 3, máximo 5). Vida extra pelo
 * power-up 1UP e a cada 50.000 pontos.
 *
 * Derrota: recomeça a fase atual com 3 vidas e os buffs já conquistados,
 * mas a pontuação é zerada. Zerar o jogo sem nenhuma morte dá um bônus enorme.
 *
 * Progresso salvo: toJSON()/fromJSON() — a cena salva após cada vitória.
 */
import { PLAYER } from '../config.js';

export const PERFECT_RUN_BONUS = 100000;
export const SAVE_VERSION = 2;

export const WORLDS = Object.freeze([
  Object.freeze({
    number: 1,
    name: 'NEBULOSA CARMIM',
    tagline: 'Onde tudo começou.',
    stages: ['stage1', 'stage2'],
    minis: ['sentinel', 'hive', 'reaper'],
    boss: 'titan',
    finale: null,
    completionReward: 'bomb',
    difficulty: { attackRate: 1, bulletSpeed: 1 },
    hpScale: { titan: 1.8 },
    music: { stage: 'stage', mini: 'mini', boss: 'boss' },
    theme: { bg: '#05050d', stars: ['#f4f4f4', '#73eff7', '#ffcd75', '#94b0c2', '#e43b8c'], accent: '#e43b8c' },
  }),
  Object.freeze({
    number: 2,
    name: 'CINTURÃO GLACIAL',
    tagline: 'Gelo, cristais e uma hidra adormecida.',
    stages: ['stage3', 'stage4'],
    minis: ['prism', 'vortex', 'scarab'],
    boss: 'hydra',
    finale: null,
    completionReward: 'bombPlus',
    difficulty: { attackRate: 1.05, bulletSpeed: 1.05 },
    hpScale: { hydra: 1.4 },
    music: { stage: 'ice', mini: 'ice', boss: 'boss' },
    theme: { bg: '#030a14', stars: ['#f4f4f4', '#73eff7', '#41a6f6', '#94b0c2'], accent: '#73eff7' },
  }),
  Object.freeze({
    number: 3,
    name: 'FORJA ESTELAR',
    tagline: 'As fábricas que constroem a frota inimiga.',
    stages: ['stage5', 'stage6'],
    minis: ['hammer', 'twins', 'furnace'],
    boss: 'aegis',
    finale: null,
    completionReward: 'bombRegen',
    difficulty: { attackRate: 1.1, bulletSpeed: 1.08 },
    hpScale: { aegis: 1.5 },
    music: { stage: 'forge', mini: 'forge', boss: 'boss' },
    theme: { bg: '#0e0505', stars: ['#ffcd75', '#ef7d57', '#f4f4f4', '#b13e53'], accent: '#ef7d57' },
  }),
  Object.freeze({
    number: 4,
    name: 'VAZIO ABISSAL',
    tagline: 'O coração da frota. O Leviatã espera.',
    stages: ['stage7', 'stage8'],
    minis: ['specter', 'oracle', 'echo'],
    boss: 'archon',
    finale: 'leviathan',
    completionReward: 'nova',
    difficulty: { attackRate: 1.15, bulletSpeed: 1.12 },
    hpScale: { archon: 1.6, leviathan: 2.2 },
    music: { stage: 'void', mini: 'void', boss: 'boss' },
    theme: { bg: '#07030d', stars: ['#8e478c', '#e43b8c', '#5d275d', '#f4f4f4', '#73eff7'], accent: '#e43b8c' },
  }),
]);

/** Todos os encontros de um mundo, na ordem em que aparecem. */
export const worldEncounters = (w) => [...w.stages, ...w.minis, w.boss, ...(w.finale ? [w.finale] : [])];

/** Em que mundo fica este encontro (índice 0..3, ou -1). */
export const worldIndexOf = (id) => WORLDS.findIndex((w) => worldEncounters(w).includes(id));

// Compatibilidade com o Mundo 1 (testes e textos antigos).
export const STAGE_IDS = WORLDS[0].stages;
export const MINI_BOSS_IDS = WORLDS[0].minis;
export const TITAN_ID = 'titan';
export const FINAL_BOSS_ID = 'leviathan';
export const ALL_MINI_BOSS_IDS = Object.freeze(WORLDS.flatMap((w) => w.minis));

export const BUFFS = Object.freeze({
  // ---------------------------------------------------------- Mundo 1
  piercing: {
    name: 'TIRO PERFURANTE', short: 'PERFURANTE', color: '#73eff7',
    description: 'Tiros causam +50% de dano, atravessam drones e ignoram blindagem.',
  },
  wingman: {
    name: 'ALA COMPANHEIRA', short: 'ALA', color: '#38b764',
    description: 'Uma nave aliada voa ao seu lado e atira junto.',
  },
  dash: {
    name: 'DASH', short: 'DASH', color: '#ffcd75',
    description: 'C: investida rápida e invencível (recarga de 2 s).',
  },
  bomb: {
    name: 'BOMBA DE PULSO', short: 'BOMBA', color: '#e43b8c',
    description: 'X: limpa a tela e fere o chefe (2 cargas por luta).',
  },
  // ---------------------------------------------------------- Mundo 2
  spread: {
    name: 'TIRO TRIPLO', short: 'TRIPLO', color: '#73eff7',
    description: 'Dois tiros extras em diagonal (dano menor).',
  },
  shockdash: {
    name: 'ONDA DE CHOQUE', short: 'CHOQUE', color: '#41a6f6',
    description: 'O dash solta um pulso que apaga projéteis e fere drones.',
  },
  carapace: {
    name: 'CARAPAÇA', short: 'CARAPAÇA', color: '#38b764',
    description: 'Comece cada luta com escudo. Ele volta após 20 s sem dano.',
  },
  bombPlus: {
    name: 'BOMBA EXTRA', short: '+BOMBA', color: '#e43b8c',
    description: 'Uma carga de bomba a mais em cada luta (3 no total).',
  },
  // ---------------------------------------------------------- Mundo 3
  overdrive: {
    name: 'SOBRECARGA', short: 'SOBRECARGA', color: '#ef7d57',
    description: 'Cadência de tiro 25% maior, para sempre.',
  },
  wingman2: {
    name: 'ALA DUPLA', short: 'ALA 2', color: '#38b764',
    description: 'Uma segunda nave aliada voa do outro lado.',
  },
  missiles: {
    name: 'MÍSSEIS TELEGUIADOS', short: 'MÍSSEIS', color: '#f4f4f4',
    description: 'Mísseis automáticos perseguem pontos fracos e inimigos.',
  },
  bombRegen: {
    name: 'RECARGA DE BOMBA', short: 'RECARGA', color: '#e43b8c',
    description: 'Ganhe 1 carga de bomba a cada 30 s de luta.',
  },
  // ---------------------------------------------------------- Mundo 4
  phantom: {
    name: 'FANTASMA', short: 'FANTASMA', color: '#8e478c',
    description: 'O dash recarrega em 1 s e dá mais invencibilidade.',
  },
  focus: {
    name: 'FOCO AMPLIFICADO', short: 'FOCO', color: '#e43b8c',
    description: 'No modo foco (Shift), seus tiros causam +60% de dano.',
  },
  reactive: {
    name: 'ESCUDO REATIVO', short: 'REATIVO', color: '#a7f070',
    description: 'Quando o escudo quebra, solta um pulso que limpa a tela.',
  },
  nova: {
    name: 'BOMBA NOVA', short: 'NOVA', color: '#ffcd75',
    description: 'A bomba causa o TRIPLO de dano no chefe.',
  },
});

/** Buff concedido por cada mini-chefe. */
export const REWARDS = Object.freeze({
  sentinel: 'piercing',
  hive: 'wingman',
  reaper: 'dash',
  prism: 'spread',
  vortex: 'shockdash',
  scarab: 'carapace',
  hammer: 'overdrive',
  twins: 'wingman2',
  furnace: 'missiles',
  specter: 'phantom',
  oracle: 'focus',
  echo: 'reactive',
});

/** Buff extra liberado ao derrotar os três mini-chefes do Mundo 1. */
export const COMPLETION_REWARD = WORLDS[0].completionReward;

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
    this.startWorld = 0; // mundo em que esta campanha começou (seleção de mundo)
    this.shown = new Set(); // anúncios do mapa já exibidos
    this.stats = { time: 0, shots: 0, hits: 0, damageTaken: 0 };
  }

  /**
   * Começa direto no mundo `index` (seleção de mundo do título): os mundos
   * anteriores contam como vencidos e os buffs deles já vêm conquistados.
   */
  static startingAt(index) {
    const c = new Campaign();
    const target = Math.max(0, Math.min(WORLDS.length - 1, index));
    for (let i = 0; i < target; i++) {
      const w = WORLDS[i];
      worldEncounters(w).forEach((id) => c.defeated.add(id));
      w.minis.forEach((id) => c.buffs.add(REWARDS[id]));
      c.buffs.add(w.completionReward);
    }
    c.startWorld = target;
    return c;
  }

  // ------------------------------------------------------------ consultas
  isWorldComplete(index) {
    return worldEncounters(WORLDS[index]).every((id) => this.defeated.has(id));
  }

  /** Índice do mundo atual (o primeiro ainda não concluído). */
  get worldIndex() {
    const i = WORLDS.findIndex((_, idx) => !this.isWorldComplete(idx));
    return i < 0 ? WORLDS.length - 1 : i;
  }

  get world() {
    return WORLDS[this.worldIndex];
  }

  /** Os 3 mini-chefes do mundo atual caíram? */
  get minisDone() {
    return this.world.minis.every((id) => this.defeated.has(id));
  }

  /** O chefe do mundo atual está liberado? */
  get bossUnlocked() {
    return this.minisDone;
  }

  /** Mantido por compatibilidade (Mundo 1). */
  get titanUnlocked() {
    return WORLDS[0].minis.every((id) => this.defeated.has(id));
  }

  get finaleUnlocked() {
    return Boolean(this.world.finale) && this.defeated.has(this.world.boss);
  }

  get leviathanUnlocked() {
    return this.defeated.has(WORLDS[WORLDS.length - 1].boss);
  }

  get complete() {
    return WORLDS.every((_, i) => this.isWorldComplete(i));
  }

  get perfect() {
    return this.deaths === 0;
  }

  hasBuff(id) {
    return this.buffs.has(id);
  }

  /** Fases/chefes que podem ser jogados agora. */
  available() {
    if (this.complete) return [];
    const w = this.world;
    const stage = w.stages.find((id) => !this.defeated.has(id));
    if (stage) return [stage];
    const minis = w.minis.filter((id) => !this.defeated.has(id));
    if (minis.length) return minis;
    if (!this.defeated.has(w.boss)) return [w.boss];
    if (w.finale && !this.defeated.has(w.finale)) return [w.finale];
    return [];
  }

  canFight(id) {
    return this.available().includes(id);
  }

  /** A próxima etapa é uma fase linear (sem escolha no mapa)? */
  get nextIsStage() {
    const next = this.available()[0];
    return Boolean(next) && WORLDS.some((w) => w.stages.includes(next));
  }

  /** Dificuldade do mundo onde fica este encontro. */
  difficultyFor(id) {
    const w = WORLDS[Math.max(0, worldIndexOf(id))];
    return { ...w.difficulty, hpScale: w.hpScale[id] ?? 1 };
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
    const world = this.world;
    this.defeated.add(id);
    this.order.push(id);
    this.score = score;
    this.lives = Math.min(lives, PLAYER.maxLives);
    for (const key of Object.keys(this.stats)) this.stats[key] += fightStats[key] ?? 0;

    const gained = [];
    const reward = REWARDS[id];
    if (reward && !this.buffs.has(reward)) gained.push(reward);
    const minisDone = world.minis.every((m) => this.defeated.has(m));
    if (minisDone && !this.buffs.has(world.completionReward)) gained.push(world.completionReward);
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

  // ------------------------------------------------------------ salvar/carregar
  toJSON() {
    return {
      version: SAVE_VERSION,
      defeated: [...this.defeated],
      buffs: [...this.buffs],
      order: [...this.order],
      score: this.score,
      lives: this.lives,
      nextLifeAt: this.nextLifeAt,
      deaths: this.deaths,
      continues: this.continues,
      startWorld: this.startWorld,
      shown: [...this.shown],
      stats: { ...this.stats },
    };
  }

  /** Recria uma campanha salva. Retorna null se o save for inválido ou antigo. */
  static fromJSON(data) {
    if (!data || data.version !== SAVE_VERSION || !Array.isArray(data.defeated)) return null;
    const c = new Campaign();
    const known = new Set(WORLDS.flatMap(worldEncounters));
    data.defeated.filter((id) => known.has(id)).forEach((id) => c.defeated.add(id));
    (data.buffs ?? []).filter((id) => BUFFS[id]).forEach((id) => c.buffs.add(id));
    c.order = (data.order ?? []).filter((id) => known.has(id));
    c.score = Number(data.score) || 0;
    c.lives = Math.max(1, Math.min(PLAYER.maxLives, Number(data.lives) || PLAYER.lives));
    c.nextLifeAt = Number(data.nextLifeAt) || PLAYER.extraLifeEvery;
    c.deaths = Number(data.deaths) || 0;
    c.continues = Number(data.continues) || 0;
    c.startWorld = Number(data.startWorld) || 0;
    (data.shown ?? []).forEach((s) => c.shown.add(s));
    for (const key of Object.keys(c.stats)) c.stats[key] = Number(data.stats?.[key]) || 0;
    return c.complete ? null : c;
  }
}
