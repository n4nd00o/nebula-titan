/**
 * Haptics — vibração no celular (navigator.vibrate).
 *
 * Fica ligada por padrão e pode ser desligada no título (botão VIBRAR ou
 * tecla V). Em navegadores sem suporte (iPhone, desktop) simplesmente não faz nada.
 */
export const VIBRATION_KEY = 'vibration';

const nav = () => (typeof navigator !== 'undefined' ? navigator : null);

/** O aparelho suporta vibração? */
export const canVibrate = () => typeof nav()?.vibrate === 'function';

export const vibrationEnabled = (storage) => storage.get(VIBRATION_KEY, true) !== false;

/** Vibra com um padrão (ms ou lista [vibra, pausa, vibra...]), se estiver ligado. */
export function haptic(storage, pattern) {
  if (!canVibrate() || !vibrationEnabled(storage)) return false;
  try {
    return nav().vibrate(pattern);
  } catch {
    return false;
  }
}

/** Liga/desliga e retorna o novo estado. */
export function toggleVibration(storage) {
  const enabled = !vibrationEnabled(storage);
  storage.set(VIBRATION_KEY, enabled);
  if (enabled) haptic(storage, 60);
  return enabled;
}
