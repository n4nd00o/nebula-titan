/**
 * Regras de pontuação final (função pura, testável).
 */

export const SCORE_RULES = Object.freeze({
  parTime: 300, // segundos: abaixo disso o jogador ganha bônus de tempo
  timeBonusPerSecond: 50,
  noDamageBonus: 20000,
  accuracyBonus: 10000,
  rankSTime: 240,
});

/**
 * Calcula bônus e rank ao derrotar o chefe.
 * @param {{score:number, time:number, damageTaken:number, shots:number, hits:number}} stats
 */
export function computeResults({ score, time, damageTaken, shots, hits }, overrides = {}) {
  const rules = { ...SCORE_RULES, ...overrides };
  const accuracy = shots > 0 ? Math.min(1, hits / shots) : 0;
  const timeBonus = Math.max(0, Math.floor((rules.parTime - time) * rules.timeBonusPerSecond));
  const noDamageBonus = damageTaken === 0 ? rules.noDamageBonus : 0;
  const accuracyBonus = Math.floor(accuracy * rules.accuracyBonus);
  const total = score + timeBonus + noDamageBonus + accuracyBonus;

  let rank = 'C';
  if (damageTaken === 0 && time <= rules.rankSTime) rank = 'S';
  else if (damageTaken <= 1) rank = 'A';
  else if (damageTaken <= 3) rank = 'B';

  return { accuracy, timeBonus, noDamageBonus, accuracyBonus, total, rank };
}

/** Regras proporcionais para um chefe com tempo-par `parTime` (mini-chefes valem menos). */
export function rulesForParTime(parTime) {
  const k = parTime / SCORE_RULES.parTime;
  return {
    parTime,
    rankSTime: parTime * 0.8,
    noDamageBonus: Math.round(SCORE_RULES.noDamageBonus * k),
    accuracyBonus: Math.round(SCORE_RULES.accuracyBonus * k),
  };
}

/** Formata segundos como mm:ss. */
export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
