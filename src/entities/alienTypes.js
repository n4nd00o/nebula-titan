/**
 * Tipos de alienígenas comuns. Usados tanto nas fases de ondas (formação)
 * quanto como escolta invocada pelos chefes.
 *
 *  - green:  frágil e numeroso; 1 tiro simples ao mergulhar.            (Mundo 1)
 *  - orange: resistente; leque de 3 tiros e mergulha "puxando" escoltas. (Mundo 1)
 *  - blue:   BLINDADO; muitos tiros para cair, mergulha devagar e solta
 *            um orbe grande que se divide.                               (Mundo 2)
 *  - purple: DIVISOR; ao ser destruído se parte em 2 drones verdes.      (Mundo 3)
 *  - red:    KAMIKAZE; não atira, mas mergulha muito rápido e persegue.  (Mundo 4)
 *
 * tier: 'top' ocupa a fileira de cima da formação (8 vagas);
 *       'bottom' ocupa as três fileiras de baixo (24 vagas).
 */
export const ALIEN_TYPES = Object.freeze({
  green: {
    sprite: 'minion',
    tier: 'bottom',
    hp: 1,
    escortHp: 2, // quando invocado por um chefe (sem formação), aguenta mais
    points: 100,
    divePoints: 200, // abater durante o mergulho vale mais (como no Galaga)
    shot: { kind: 'needle', color: '#a7f070', radius: 3, count: 1, speed: 200 },
    debris: ['#38b764', '#a7f070'],
    dropChance: 0.04,
  },
  orange: {
    sprite: 'alienOrange',
    tier: 'top',
    hp: 3,
    escortHp: 3,
    points: 300,
    divePoints: 600,
    shot: { kind: 'orb', color: '#ef7d57', radius: 4, count: 3, speed: 180 },
    debris: ['#ef7d57', '#ffcd75', '#b13e53'],
    dropChance: 0.1,
    leader: true, // mergulha puxando escoltas verdes
  },
  blue: {
    sprite: 'alienBlue',
    tier: 'top',
    hp: 7,
    escortHp: 6,
    points: 500,
    divePoints: 1000,
    diveSpeed: 170,
    shot: {
      kind: 'shard', color: '#41a6f6', radius: 5, count: 1, speed: 140,
      split: { at: 0.8, count: 6, speed: 120, ring: true, style: { kind: 'orb', color: '#73eff7', radius: 3 } },
    },
    debris: ['#41a6f6', '#73eff7', '#29366f'],
    dropChance: 0.14,
  },
  purple: {
    sprite: 'alienPurple',
    tier: 'bottom',
    hp: 2,
    escortHp: 2,
    points: 250,
    divePoints: 500,
    shot: { kind: 'needle', color: '#e43b8c', radius: 3, count: 2, speed: 210 },
    debris: ['#8e478c', '#e43b8c', '#5d275d'],
    dropChance: 0.06,
    splitInto: { type: 'green', count: 2 }, // vira 2 drones ao morrer
  },
  red: {
    sprite: 'alienRed',
    tier: 'bottom',
    hp: 1,
    escortHp: 2,
    points: 200,
    divePoints: 500,
    diveSpeed: 360,
    diveTurn: 3.6, // persegue com muito mais força
    diveChase: 2.2,
    shot: null, // kamikaze: não atira
    debris: ['#b13e53', '#ef7d57', '#1a1c2c'],
    dropChance: 0.05,
  },
});

/** Power-ups que um alienígena pode soltar. */
export const ALIEN_DROPS = Object.freeze(['rapid', 'shield', 'double']);
