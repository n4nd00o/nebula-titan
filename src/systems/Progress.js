/**
 * Progress — estado do MAPA DE PROGRESSO (lógica pura, testável no Node).
 *
 * Junta três fontes de informação:
 *  - o save da campanha em andamento (o que está disponível AGORA);
 *  - o histórico de fases já vencidas em qualquer campanha (`progressDefeated`),
 *    que sobrevive ao fim da campanha (o save é apagado ao zerar o jogo);
 *  - quantos mundos foram liberados (`worldsUnlocked`, saves antigos).
 *
 * Cada fase interna recebe um status:
 *   'done'      vencida pelo menos uma vez -> pode ser REJOGADA como treino
 *   'available' próxima etapa da campanha  -> joga para valer (salva)
 *   'locked'    ainda não alcançada
 */
import { WORLDS, worldEncounters, worldIndexOf } from './Campaign.js';

export const PROGRESS_KEY = 'progressDefeated';

/** Tipo de cada fase dentro do mundo (para o desenho do mapinha). */
export function encounterKind(world, id) {
  if (world.stages.includes(id)) return 'stage';
  if (world.minis.includes(id)) return 'mini';
  if (id === world.finale) return 'finale';
  return 'boss';
}

/**
 * Lista de fases vencidas "para sempre": histórico salvo + save atual +
 * mundos liberados por saves antigos (mundos antes do último liberado
 * estão, por definição, completos).
 */
export function mergeDefeated({ history = [], save = null, unlocked = 1 } = {}) {
  const known = new Set(WORLDS.flatMap(worldEncounters));
  const done = new Set(history.filter((id) => known.has(id)));
  save?.defeated.forEach((id) => done.add(id));
  for (let i = 0; i < Math.min(unlocked, WORLDS.length) - 1; i++) worldEncounters(WORLDS[i]).forEach((id) => done.add(id));
  return done;
}

/**
 * Monta o mapa inteiro.
 * @param {{save?: import('./Campaign.js').Campaign|null, defeated: Set<string>}} input
 */
export function buildProgress({ save = null, defeated }) {
  const available = new Set(save ? save.available() : defeated.has(WORLDS[0].stages[0]) ? [] : [WORLDS[0].stages[0]]);
  // Mundo onde o jogador "está": o da campanha salva (ou o 1º, sem save e sem progresso).
  const currentWorld = save ? save.worldIndex : available.size ? 0 : -1;

  const worlds = WORLDS.map((world, index) => {
    const encounters = worldEncounters(world).map((id) => {
      // A campanha salva manda: o que ela libera agora é 'available' mesmo se já foi vencido antes.
      let status = 'locked';
      if (available.has(id)) status = 'available';
      else if (save?.defeated.has(id) || defeated.has(id)) status = 'done';
      return { id, kind: encounterKind(world, id), status };
    });
    const doneCount = encounters.filter((e) => e.status === 'done').length;
    const complete = doneCount === encounters.length;
    let status = 'locked';
    if (index === currentWorld) status = 'current';
    else if (complete) status = 'done';
    else if (doneCount > 0) status = 'visited'; // jogado em outra campanha, sem terminar
    return { index, world, encounters, doneCount, total: encounters.length, complete, status };
  });
  return { worlds, currentWorld };
}

/** O mundo pode ser aberto no mapa (ver as fases internas)? */
export const canOpenWorld = (w) => w.status !== 'locked';

/** Em que mundo fica o encontro (atalho para a cena). */
export const worldOf = (id) => WORLDS[Math.max(0, worldIndexOf(id))];
