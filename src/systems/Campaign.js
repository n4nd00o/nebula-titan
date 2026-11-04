/**
 * Campaign — estado e regras do modo Campanha (lógica pura, testável).
 *
 * A campanha tem CINCO MUNDOS. Os Mundos 1 a 4 seguem a mesma estrutura:
 *   2 Setores (ondas, obrigatórios, sem buffs)
 *   -> 3 mini-chefes em ordem livre (cada um dá um buff permanente)
 *   -> bônus de mundo (buff extra ao vencer os 3 mini-chefes)
 *   -> chefe do mundo
 * O Mundo 4 termina com o LEVIATÃ. O Mundo 5 (SINGULARIDADE, v1.5) não tem
 * setores: são 6 mini-chefes em DOIS CÍRCULOS de 3 (ordem livre dentro de cada
 * círculo), cada um com um buff único, e o chefe final verdadeiro: ÔMEGA.
 *
 * Dificuldade: cada mundo acelera os ataques (attackRate) e os projéteis
 * inimigos (bulletSpeed). Chefes de mundo recebem vida extra (hpScale) e, desde a
 * v1.5, ESCALAM COM OS BUFFS do jogador: cada buff conquistado dá a eles +4% de
 * vida e +1,2% de velocidade de ataque (quanto mais forte você chega, mais forte
 * eles ficam).
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
  Object.freeze({
    number: 5,
    name: 'SINGULARIDADE',
    tagline: 'Onde a frota nasceu. Onde tudo termina.',
    stages: [],
    // Dois círculos de guardiões: o 2º só abre depois que o 1º cai inteiro.
    circles: [['chronos', 'mirror', 'parasite'], ['legion', 'gunner', 'phoenix']],
    minis: ['chronos', 'mirror', 'parasite', 'legion', 'gunner', 'phoenix'],
    boss: 'omega',
    finale: null,
    completionReward: 'ascension',
    difficulty: { attackRate: 1.2, bulletSpeed: 1.15 },
    hpScale: { chronos: 1.4, mirror: 1.4, parasite: 1.4, legion: 1.5, gunner: 1.5, phoenix: 1.5, omega: 2.4 },
    music: { stage: 'void', mini: 'void', boss: 'boss' },
    theme: { bg: '#020204', stars: ['#f4f4f4', '#ffcd75', '#73eff7', '#e43b8c', '#94b0c2'], accent: '#ffcd75' },
  }),
]);

/** Cada buff deixa os chefes de mundo mais fortes (v1.5). */
export const BUFF_HP_SCALE = 0.04;
export const BUFF_ATTACK_SCALE = 0.012;

/** Chefes de mundo (e finais), que escalam com os buffs do jogador. */
export const WORLD_BOSS_IDS = Object.freeze(WORLDS.flatMap((w) => [w.boss, ...(w.finale ? [w.finale] : [])]));

/** Todos os encontros de um mundo, na ordem em que aparecem. */
export const worldEncounters = (w) => [...w.stages, ...w.minis, w.boss, ...(w.finale ? [w.finale] : [])];

/** Em que mundo fica este encontro (índice 0..3, ou -1). */
export const worldIndexOf = (id) => WORLDS.findIndex((w) => worldEncounters(w).includes(id));

// Compatibilidade com o Mundo 1 (testes e textos antigos).
export const STAGE_IDS = WORLDS[0].stages;
export const MINI_BOSS_IDS = WORLDS[0].minis;
export const TITAN_ID = 'titan';
export const LEVIATHAN_ID = 'leviathan';
/** O último chefe da campanha (v1.5: Ômega, no Mundo 5). */
export const FINAL_BOSS_ID = 'omega';
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
    description: 'Investida rápida e invencível (recarga de 2 s).',
  },
  bomb: {
    name: 'BOMBA DE PULSO', short: 'BOMBA', color: '#e43b8c',
    description: 'Limpa a tela e fere o chefe (2 cargas por luta).',
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
    description: 'No modo foco, seus tiros causam +60% de dano.',
  },
  reactive: {
    name: 'ESCUDO REATIVO', short: 'REATIVO', color: '#a7f070',
    description: 'Quando o escudo quebra, solta um pulso que limpa a tela.',
  },
  nova: {
    name: 'BOMBA NOVA', short: 'NOVA', color: '#ffcd75',
    description: 'A bomba causa o TRIPLO de dano no chefe.',
  },
  // ---------------------------------------------------------- Mundo 5 (buffs únicos)
  bulletTime: {
    name: 'TEMPO BALA', short: 'TEMPO', color: '#ffcd75',
    description: 'No modo foco, os projéteis inimigos ficam 35% mais lentos.',
  },
  ricochet: {
    name: 'RICOCHETE', short: 'RICOCHETE', color: '#94b0c2',
    description: 'Tiros que batem em blindagem viram mísseis teleguiados.',
  },
  vampire: {
    name: 'VAMPIRISMO', short: 'VAMPIRO', color: '#b13e53',
    description: 'Cada parte de chefe destruída restaura o seu escudo.',
  },
  orbitals: {
    name: 'ORBITAIS', short: 'ORBITAIS', color: '#73eff7',
    description: 'Dois orbes giram ao seu redor e apagam projéteis.',
  },
  supercharge: {
    name: 'SUPERCARGA', short: 'SUPER', color: '#a7f070',
    description: 'A cada 5 s, um raio perfurante que causa 8x o dano.',
  },
  rebirth: {
    name: 'RENASCER', short: 'RENASCER', color: '#ef7d57',
    description: 'Uma vez por luta, você renasce na hora em vez de perder a vida.',
  },
  ascension: {
    name: 'ASCENSÃO', short: 'ASCENSÃO', color: '#ffffff',
    description: 'Todos os seus tiros causam +25% de dano.',
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
  chronos: 'bulletTime',
  mirror: 'ricochet',
  parasite: 'vampire',
  legion: 'orbitals',
  gunner: 'supercharge',
  phoenix: 'rebirth',
});

/** De onde vem cada buff (para a tela de buffs). */
export function buffSource(buffId) {
  const boss = Object.keys(REWARDS).find((id) => REWARDS[id] === buffId);
  if (boss) return { kind: 'mini', id: boss, world: WORLDS.findIndex((w) => w.minis.includes(boss)) };
  const world = WORLDS.findIndex((w) => w.completionReward === buffId);
  return { kind: 'world', id: null, world };
}

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
    return this.defeated.has(WORLDS[3].boss);
  }

  /** Mundo 5 liberado (o Leviatã caiu)? */
  get singularityUnlocked() {
    return this.isWorldComplete(3);
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
    if (w.circles) {
      // Mundo 5: o círculo seguinte só abre quando o anterior cai inteiro.
      const circle = w.circles.find((c) => c.some((id) => !this.defeated.has(id)));
      if (circle) return circle.filter((id) => !this.defeated.has(id));
    }
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

  /**
   * Dificuldade do mundo onde fica este encontro. Chefes de mundo (e finais)
   * escalam com a quantidade de buffs que o jogador já tem.
   */
  difficultyFor(id) {
    const w = WORLDS[Math.max(0, worldIndexOf(id))];
    const base = { ...w.difficulty, hpScale: w.hpScale[id] ?? 1 };
    if (!WORLD_BOSS_IDS.includes(id)) return base;
    const n = this.buffs.size;
    return {
      ...base,
      hpScale: base.hpScale * (1 + BUFF_HP_SCALE * n),
      attackRate: base.attackRate * (1 + BUFF_ATTACK_SCALE * n),
    };
  }

  /** O círculo de mini-chefes (Mundo 5) ao qual o encontro pertence (0, 1) ou -1. */
  static circleOf(id) {
    for (const w of WORLDS) {
      const i = w.circles?.findIndex((c) => c.includes(id)) ?? -1;
      if (i >= 0) return i;
    }
    return -1;
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
