/**
 * Ciclo de "fase espectral" (Espectro e Arconte): o chefe fica sólido por um
 * tempo, desvanece, some (INTANGÍVEL: os tiros atravessam), teletransporta
 * e reaparece. O estado vive em boss.vars.ghost.
 *
 *   solid -> fading -> gone (teleporta no meio) -> appearing -> solid
 */
import { GAME_WIDTH } from '../config.js';
import { rand } from '../utils/math.js';

const FADE = 0.45;
const APPEAR = 0.4;

export function resetGhost(boss) {
  boss.vars.ghost = { stage: 'solid', t: 0, teleported: false };
}

/**
 * @param {object} cfg { solid, gone, onAppear?(boss) }
 */
export function updateGhost(boss, dt, cfg) {
  const g = (boss.vars.ghost ??= { stage: 'solid', t: 0, teleported: false });
  g.t += dt;
  switch (g.stage) {
    case 'solid':
      if (g.t >= cfg.solid) {
        g.stage = 'fading';
        g.t = 0;
        boss.world.audio.play('dashWarn');
      }
      break;
    case 'fading':
      if (g.t >= FADE) {
        g.stage = 'gone';
        g.t = 0;
        g.teleported = false;
      }
      break;
    case 'gone':
      if (!g.teleported && g.t >= cfg.gone / 2) {
        g.teleported = true;
        // Teletransporta para longe da posição atual.
        const side = boss.x < GAME_WIDTH / 2 ? 1 : -1;
        boss.vars.homeX = GAME_WIDTH / 2 + side * rand(40, 140);
      }
      if (g.t >= cfg.gone) {
        g.stage = 'appearing';
        g.t = 0;
      }
      break;
    case 'appearing':
      if (g.t >= APPEAR) {
        g.stage = 'solid';
        g.t = 0;
        cfg.onAppear?.(boss);
      }
      break;
    default:
      break;
  }
}

/** Intangível enquanto desvanece, some e reaparece. */
export const isGhost = (boss) => {
  const g = boss.vars.ghost;
  return Boolean(g) && g.stage !== 'solid';
};

/** Transparência do desenho em cada etapa do ciclo. */
export function ghostAlpha(boss) {
  const g = boss.vars.ghost;
  if (!g) return 1;
  switch (g.stage) {
    case 'fading': return 1 - 0.8 * Math.min(1, g.t / FADE);
    case 'gone': return 0.2 + Math.sin(boss.time * 20) * 0.05;
    case 'appearing': return 0.2 + 0.8 * Math.min(1, g.t / APPEAR);
    default: return 1;
  }
}
