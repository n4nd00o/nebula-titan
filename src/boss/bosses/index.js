/**
 * Registro de todos os chefes do jogo.
 * Para adicionar um chefe novo: crie a definição e registre aqui.
 * (Testes genéricos em tests/minibosses.test.js rodam para cada chefe registrado.)
 */
import { NEBULA_TITAN } from './nebulaTitan.js';
import { SENTINEL } from './sentinel.js';
import { HIVE } from './hive.js';
import { REAPER } from './reaper.js';
import { PRISM } from './prism.js';
import { VORTEX } from './vortex.js';
import { SCARAB } from './scarab.js';
import { HYDRA } from './hydra.js';
import { HAMMER } from './hammer.js';
import { TWINS } from './twins.js';
import { FURNACE } from './furnace.js';
import { AEGIS } from './aegis.js';
import { SPECTER } from './specter.js';
import { ORACLE } from './oracle.js';
import { ECHO } from './echo.js';
import { ARCHON } from './archon.js';
import { LEVIATHAN } from './leviathan.js';

export {
  NEBULA_TITAN, SENTINEL, HIVE, REAPER,
  PRISM, VORTEX, SCARAB, HYDRA,
  HAMMER, TWINS, FURNACE, AEGIS,
  SPECTER, ORACLE, ECHO, ARCHON,
  LEVIATHAN,
};

export const BOSSES = Object.freeze({
  // Mundo 1
  titan: NEBULA_TITAN,
  sentinel: SENTINEL,
  hive: HIVE,
  reaper: REAPER,
  // Mundo 2
  prism: PRISM,
  vortex: VORTEX,
  scarab: SCARAB,
  hydra: HYDRA,
  // Mundo 3
  hammer: HAMMER,
  twins: TWINS,
  furnace: FURNACE,
  aegis: AEGIS,
  // Mundo 4
  specter: SPECTER,
  oracle: ORACLE,
  echo: ECHO,
  archon: ARCHON,
  leviathan: LEVIATHAN,
});
