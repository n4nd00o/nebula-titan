/**
 * Wrapper seguro para o localStorage.
 * Em modo privado ou com armazenamento bloqueado, o acesso lança exceção:
 * aqui isso é tratado e o jogo continua funcionando (só não salva recordes).
 */
export class Storage {
  constructor(prefix) {
    this.prefix = prefix;
  }

  key(name) {
    return `${this.prefix}:${name}`;
  }

  get(name, fallback) {
    try {
      const raw = localStorage.getItem(this.key(name));
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  set(name, value) {
    try {
      localStorage.setItem(this.key(name), JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
}
