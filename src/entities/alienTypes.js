/**
 * Tipos de alienígenas comuns. Usados tanto nas fases de ondas (formação)
 * quanto como escolta invocada pelos chefes.
 *
 *  - green:  frágil e numeroso; 1 tiro simples ao mergulhar.
 *  - orange: resistente; leque de 3 tiros e mergulha "puxando" escoltas verdes.
 */
export const ALIEN_TYPES = Object.freeze({
  green: {
    sprite: 'minion',
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
    hp: 3,
    escortHp: 3,
    points: 300,
    divePoints: 600,
    shot: { kind: 'orb', color: '#ef7d57', radius: 4, count: 3, speed: 180 },
    debris: ['#ef7d57', '#ffcd75', '#b13e53'],
    dropChance: 0.1,
  },
});

/** Power-ups que um alienígena pode soltar. */
export const ALIEN_DROPS = Object.freeze(['rapid', 'shield', 'double']);
