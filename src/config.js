/**
 * Configurações globais do jogo.
 * Centralizar constantes aqui facilita o balanceamento (game tuning)
 * sem precisar caçar "números mágicos" espalhados pelo código.
 */

/** Resolução interna (lógica) do jogo. O canvas é escalado via CSS. */
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 640;

/** Tamanho, em pixels de tela, de cada "pixel" da pixel art. */
export const PIXEL_SIZE = 3;

/** Passo fixo da simulação (60 atualizações por segundo). */
export const FIXED_STEP = 1 / 60;

/** Tempo máximo de um frame — evita a "espiral da morte" após travamentos. */
export const MAX_FRAME_TIME = 0.25;

/** Modo de depuração: abra o jogo com `?debug` na URL. */
export const DEBUG =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug');

/** Prefixo usado no localStorage. */
export const STORAGE_PREFIX = 'nebula-titan';

/** Parâmetros da nave do jogador. */
export const PLAYER = Object.freeze({
  speed: 240,
  focusSpeed: 120,
  fireCooldown: 0.17,
  rapidCooldown: 0.085,
  bulletSpeed: 620,
  bulletDamage: 1,
  lives: 3,
  maxLives: 5,
  extraLifeEvery: 50000, // vida extra a cada N pontos
  hitRadius: 4,
  pickupRadius: 24,
  minY: GAME_HEIGHT * 0.5,
  spawnInvuln: 1.5,
  respawnInvuln: 2.5,
  respawnDelay: 1.4,
  rapidDuration: 12,
  touchOffset: 70,
  // Buffs da campanha
  piercingDamage: 1.5,
  dashSpeed: 700,
  dashDuration: 0.14,
  dashInvuln: 0.3,
  dashCooldown: 2,
  bombCharges: 2,
  bombMax: 3, // o Leviatã recarrega bombas em algumas seções
  bombDamage: 6,
  // Buffs dos mundos 2 a 4
  spreadAngle: 0.22, // Tiro Triplo: abertura dos tiros diagonais (rad)
  spreadDamage: 0.6, // os tiros diagonais são mais fracos
  shockRadius: 80, // Onda de Choque do dash
  shockDamage: 3,
  carapaceRecharge: 20, // segundos sem dano para a Carapaça voltar
  overdriveFactor: 0.8, // Sobrecarga: recarga do tiro x0,8
  missileEvery: 1.1,
  missileDamage: 1.5,
  missileSpeed: 380,
  bombRegenEvery: 30, // Recarga de Bomba: +1 carga a cada N segundos
  phantomDashCooldown: 1, // Fantasma
  phantomDashInvuln: 0.5,
  focusDamage: 1.6, // Foco Amplificado: multiplicador no modo foco
  reactiveDamage: 4, // Escudo Reativo: dano do pulso nos pontos fracos
  novaDamageFactor: 3, // Bomba Nova
});

/** Paleta de cores usada pela interface (HUD). */
export const UI_COLORS = Object.freeze({
  text: '#f4f4f4',
  muted: '#94b0c2',
  accent: '#ffcd75',
  boss: '#e43b8c',
  bossDim: '#5d275d',
  danger: '#b13e53',
  info: '#73eff7',
  good: '#38b764',
  panel: 'rgba(26, 28, 44, 0.85)',
});
