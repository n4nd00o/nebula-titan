/**
 * Utilitários de teste: um "mundo" falso para testar o Boss sem navegador.
 *
 * Qualquer propriedade não definida vira um "gravador": pode ser chamada
 * como função ou acessada como objeto (ex.: world.particles.explosion(...)),
 * e todas as chamadas ficam registradas em `calls` para asserções.
 */
function recorder(name, calls) {
  const fn = (...args) => {
    calls.push({ name, args });
    return undefined;
  };
  return new Proxy(fn, {
    get(target, prop) {
      if (prop === 'then') return undefined; // não é uma Promise
      return recorder(`${name}.${String(prop)}`, calls);
    },
  });
}

export function createFakeWorld(overrides = {}) {
  const calls = [];
  const base = {
    calls,
    player: { x: 240, y: 560, alive: true },
    bullets: [],
    spawnEnemyBullet(opts) {
      this.bullets.push(opts);
    },
    ...overrides,
  };
  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'then') return undefined;
      return recorder(String(prop), calls);
    },
  });
}

/** Avança a simulação do chefe em passos de 1/60 s. */
export function tick(boss, seconds, step = 1 / 60) {
  const steps = Math.round(seconds / step);
  for (let i = 0; i < steps; i++) boss.update(step);
}

/** Avança até o chefe estar no estado de combate. */
export function tickUntilFight(boss, maxSeconds = 10) {
  let elapsed = 0;
  while (boss.state !== 'fight' && elapsed < maxSeconds) {
    boss.update(1 / 60);
    elapsed += 1 / 60;
  }
}
