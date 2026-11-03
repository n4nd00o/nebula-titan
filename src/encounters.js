/**
 * Todos os "encontros" jogáveis: fases de ondas + chefes.
 * A PlayScene recebe um id daqui e cria o objeto certo:
 *  - kind 'waves' -> WaveStage (diretor de ondas em formação)
 *  - demais       -> Boss (motor genérico de chefes)
 */
import { BOSSES } from './boss/bosses/index.js';
import { STAGES } from './stages/stageData.js';

export const ENCOUNTERS = Object.freeze({ ...STAGES, ...BOSSES });
