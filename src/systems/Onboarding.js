/**
 * Onboarding — o que o jogador vê nas primeiras vezes (v1.8, lógica pura).
 *
 * Feito a partir do feedback de jogadores:
 *  - menu enxuto na primeira vez (INICIAR, CONTROLES, CONFIGURAÇÕES); as outras
 *    opções aparecem depois que a pessoa já jogou;
 *  - tutorial jogável antes do Setor 1 (mover, atirar, pausar);
 *  - dica curta toda vez que uma habilidade de ativação é liberada (dash,
 *    bomba, tempo bala), porque era fácil esquecer que elas existiam.
 *
 * Tudo aqui é testável no Node (tests/onboarding.test.js). As cenas só desenham.
 */

export const PLAYED_KEY = 'played';
export const TUTORIAL_KEY = 'tutorialDone';
export const TIPS_KEY = 'abilityTipsSeen';

/** A pessoa já jogou alguma vez? (save, mundo liberado ou recorde também contam) */
export function hasPlayed(storage, { hasSave = false, unlocked = 1 } = {}) {
  return Boolean(storage.get(PLAYED_KEY, false) || hasSave || unlocked > 1
    || storage.get('hiscore', 0) > 0 || storage.get('hiscoreCampaign', 0) > 0);
}

export function markPlayed(storage) {
  storage.set(PLAYED_KEY, true);
}

/** Ids das opções do menu inicial, na ordem em que aparecem. */
export function titleOptionIds({ played, hasSave = false, unlocked = 1 }) {
  if (!played) return ['new', 'controls', 'settings'];
  return [
    ...(hasSave ? ['continue'] : []),
    'new',
    ...(unlocked > 1 ? ['world'] : []),
    'map',
    'buffs',
    'duel',
    'controls',
    'settings',
  ];
}

// ------------------------------------------------------------- tutorial

/** Passos do tutorial. `touch` = o passo vale no celular. */
export const TUTORIAL_STEPS = Object.freeze([
  { id: 'move', title: 'MOVA A NAVE', actions: ['left', 'up', 'down', 'right'], touchText: 'ARRASTE O DEDO', touch: true },
  { id: 'shoot', title: 'DESTRUA OS ALVOS', actions: ['fire'], touchText: 'O TIRO É AUTOMÁTICO', touch: true },
  { id: 'pause', title: 'PAUSE O JOGO', actions: ['pause'], touch: false },
]);
export const TUTORIAL_MOVE_GOAL = 160; // pixels andados
export const TUTORIAL_TARGETS = 3;

/** Estado inicial (imutável: cada evento devolve um estado novo). */
export function createTutorial({ touch = false } = {}) {
  const steps = TUTORIAL_STEPS.filter((s) => !touch || s.touch).map((s) => s.id);
  return Object.freeze({ steps, index: 0, moved: 0, hits: 0, done: false });
}

export const currentStep = (state) => TUTORIAL_STEPS.find((s) => s.id === state.steps[state.index]) ?? null;

/** Aplica um evento: { type: 'moved', distance } | { type: 'targetDown' } | { type: 'paused' }. */
export function tutorialEvent(state, event) {
  if (state.done) return state;
  const step = state.steps[state.index];
  let { moved, hits } = state;
  let complete = false;
  if (step === 'move' && event.type === 'moved') {
    moved += event.distance;
    complete = moved >= TUTORIAL_MOVE_GOAL;
  } else if (step === 'shoot' && event.type === 'targetDown') {
    hits += 1;
    complete = hits >= TUTORIAL_TARGETS;
  } else if (step === 'pause' && event.type === 'paused') {
    complete = true;
  }
  if (!complete) return Object.freeze({ ...state, moved, hits });
  const index = state.index + 1;
  return Object.freeze({ ...state, moved, hits, index, done: index >= state.steps.length });
}

// ------------------------------------------------------ dicas de habilidade

/** Habilidades que dependem de apertar uma tecla, na ordem em que costumam chegar. */
export const ABILITY_TIPS = Object.freeze([
  { id: 'dash', buff: 'dash', action: 'dash', title: 'NOVA HABILIDADE: DASH', text: 'Desvio rápido e invencível.' },
  { id: 'bomb', buff: 'bomb', action: 'bomb', title: 'NOVA HABILIDADE: BOMBA', text: 'Limpa os tiros da tela.' },
  { id: 'bulletTime', buff: 'bulletTime', action: 'focus', title: 'NOVA HABILIDADE: TEMPO BALA', text: 'Segure o foco: tiros inimigos ficam lentos.' },
]);

export function seenTips(storage) {
  const list = storage.get(TIPS_KEY, []);
  return Array.isArray(list) ? list : [];
}

/** Primeira dica ainda não vista entre as habilidades que o jogador tem. */
export function nextAbilityTip(buffs, seen) {
  return ABILITY_TIPS.find((tip) => buffs.has(tip.buff) && !seen.includes(tip.id)) ?? null;
}

export function markTipSeen(storage, id) {
  const seen = seenTips(storage);
  if (!seen.includes(id)) storage.set(TIPS_KEY, [...seen, id]);
}
