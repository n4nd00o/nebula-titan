/**
 * Registro de todos os chefes do jogo.
 * Para adicionar um chefe novo: crie a definição e registre aqui.
 * (Testes genéricos em tests/minibosses.test.js rodam para cada chefe registrado.)
 */
import { NEBULA_TITAN } from './nebulaTitan.js';
import { SENTINEL } from './sentinel.js';
import { HIVE } from './hive.js';
import { REAPER } from './reaper.js';
import { LEVIATHAN } from './leviathan.js';

export { NEBULA_TITAN, SENTINEL, HIVE, REAPER, LEVIATHAN };

export const BOSSES = Object.freeze({
  titan: NEBULA_TITAN,
  sentinel: SENTINEL,
  hive: HIVE,
  reaper: REAPER,
  leviathan: LEVIATHAN,
});
