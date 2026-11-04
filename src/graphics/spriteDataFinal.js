/**
 * Pixel art do Mundo 5 (SINGULARIDADE) e do chefe final ÔMEGA (v1.5).
 * Mesmo formato de spriteData.js: cada caractere é uma cor da paleta.
 *
 * Identidade: dourado e branco (o "berço" da frota), com detalhes de cada
 * guardião: relógio (Cronos), cristal (Reflexo), carne (Parasita),
 * aço (Legião), artilharia (Artilheiro) e fogo (Fênix).
 */

const mirrorEven = (rows) => rows.map((r) => r + [...r].reverse().join(''));
const mirrorV = (rows) => rows.concat([...rows].reverse());
const flipH = (rows) => rows.map((r) => [...r].reverse().join(''));
const recolor = (rows, map) => rows.map((r) => [...r].map((c) => map[c] ?? c).join(''));

// ---------------------------------------------------------------- Cronos
const CHRONOS = mirrorEven(mirrorV([
  '.....kkk',
  '...kkYYY',
  '..kYYwww',
  '.kYwwWWW',
  '.kYwWWWW',
  'kYwWWWkW',
  'kYwWWWWW',
  'kYwWWWW.',
]));

const GEAR = mirrorEven(mirrorV([
  '..k.k',
  '.kYYY',
  'kYYrr',
  '.YrKK',
  'kYrKK',
]));

const CHRONO_CORE = mirrorEven(mirrorV([
  '..kk',
  '.kYY',
  'kYWM',
  'kYMM',
]));

// ---------------------------------------------------------------- Reflexo
const MIRROR_WING = [
  '.......kk',
  '......kCk',
  '.....kCWk',
  '....kCWbk',
  '...kCWbbk',
  '..kCWbbBk',
  '.kCWbbBBk',
  'kCWbbBBNk',
  'kCbbBBNNk',
  '.kbBBNNk.',
  '..kBNNk..',
  '...kkk...',
];

const MIRROR_CORE = mirrorEven(mirrorV([
  '..kkk',
  '.kCCW',
  'kCbWW',
  'kCbbW',
  'kCbbb',
]));

// ---------------------------------------------------------------- Parasita
const PARASITE = mirrorEven([
  '.....kkkkkk',
  '...kkRRRRRR',
  '..kRRppppPP',
  '.kRppPPkkkk',
  'kRpPPk.....',
  'kRpPk......',
  'kRpPk......',
  'kRppPk.....',
  '.kRppPkkkkk',
  '..kRRpppppp',
  '...kkRRRRRR',
  '.....kkkkkk',
]);

const SAC = mirrorEven([
  '..kk',
  '.kgg',
  'kgGG',
  'kgGY',
  'kgGG',
  '.kGG',
  '..kk',
]);

const PARASITE_CORE = mirrorEven(mirrorV([
  '..kk',
  '.kMM',
  'kMRY',
  'kMRR',
]));

// ---------------------------------------------------------------- Legião
const LEGION = mirrorEven([
  '........kkkkk',
  '.....kkksssss',
  '...kksssswwww',
  '.kksssswwkkkk',
  'kssssswk.....',
  'kssssswk.....',
  '.kksssswkkkkk',
  '...kkssssssss',
  '.....kkkkkkkk',
]);

const BAY = mirrorEven([
  'kkkkk',
  'ksssw',
  'ksRRR',
  'ksRYY',
  'ksRRR',
  'kssss',
  '.kkkk',
]);

const LEGION_CORE = mirrorEven(mirrorV([
  '..kk',
  '.kRR',
  'kRYY',
  'kRYW',
]));

// ---------------------------------------------------------------- Artilheiro
const GUNNER = mirrorEven([
  '....kkkkkk',
  '..kksssrrr',
  '.ksssrrRRR',
  'ksssrRRkkk',
  'kssrRk....',
  'kssrRk....',
  '.kssrRkkkk',
  '..kkssssss',
  '....kkkkkk',
]);

const GUN_BARREL = mirrorEven([
  'kkk',
  'ksw',
  'ksw',
  'ksw',
  'ksw',
  'krr',
  'krY',
  'krY',
  'kRR',
  'kkk',
]);

const GUNNER_CORE = mirrorEven(mirrorV([
  '..kk',
  '.kgg',
  'kgYW',
  'kgWW',
]));

// ---------------------------------------------------------------- Fênix
const PHOENIX = mirrorEven([
  '...kkkk',
  '..krrrr',
  '.krYYYY',
  'krY....',
  'krY....',
  'krY....',
  '.krYYYY',
  '..krrrr',
  '...kkkk',
]);

const FLAME_WING = [
  'kk............',
  'kRk...........',
  'kRrk..........',
  '.kRrrk........',
  '.kRrYrkk......',
  '..kRrYYrrkk...',
  '..kRrrYYYrrrkk',
  '...kRRrrrrrrRk',
  '....kkRRRRRRk.',
  '......kkkkkk..',
];

const PHOENIX_CORE = mirrorEven(mirrorV([
  '..kk',
  '.krr',
  'krYW',
  'krWW',
]));

// ---------------------------------------------------------------- Ômega
const OMEGA = mirrorEven([
  '..............kkkkkk',
  '..........kkkkPPPPPP',
  '.......kkkPPPPpppppp',
  '.....kkPPPppppMMMMMM',
  '...kkPPpppMMkkkkkkkk',
  '..kPPppMMkk.........',
  '.kPppMMk............',
  'kPppMk..............',
  'kPpMk...............',
  'kPpMk...............',
  'kPppMk..............',
  '.kPppMkk............',
  '..kPPppMMkkkkkkkkkkk',
  '...kkPPpppMMMMMMMMMM',
  '.....kkPPPpppppppppp',
  '.......kkkPPPPPPPPPP',
  '..........kkkkkkkkkk',
]);

const OMEGA_NODE = mirrorEven(mirrorV([
  '..kk',
  '.kWW',
  'kWYY',
  'kWYM',
]));

const OMEGA_VEIL = mirrorEven([
  '..kkkk',
  '.kpppp',
  'kpPMMM',
  'kpPMWW',
  'kpPMMM',
  '.kpppp',
  '..kkkk',
]);

const OMEGA_CORE = mirrorEven(mirrorV([
  '....kkk',
  '..kkMMM',
  '.kMMYYY',
  '.kMYYWW',
  'kMYYWWW',
  'kMYWWWW',
  'kMYWWWW',
]));

export const FINAL_SPRITES = Object.freeze({
  chronos: { rows: CHRONOS, description: 'Cronos: mostrador do relógio' },
  gear: { rows: GEAR, description: 'Cronos/Ômega: engrenagem' },
  chronoCore: { rows: CHRONO_CORE, description: 'Cronos: núcleo do tempo' },
  mirrorWingL: { rows: MIRROR_WING, description: 'Reflexo: asa de cristal esquerda' },
  mirrorWingR: { rows: flipH(MIRROR_WING), description: 'Reflexo: asa de cristal direita' },
  mirrorCore: { rows: MIRROR_CORE, description: 'Reflexo: núcleo' },
  parasite: { rows: PARASITE, description: 'Parasita: carapaça' },
  sac: { rows: SAC, description: 'Parasita: bolsa de esporos' },
  parasiteCore: { rows: PARASITE_CORE, description: 'Parasita: núcleo' },
  legion: { rows: LEGION, description: 'Legião: porta-naves' },
  bay: { rows: BAY, description: 'Legião/Ômega: hangar' },
  legionCore: { rows: LEGION_CORE, description: 'Legião: núcleo de comando' },
  gunner: { rows: GUNNER, description: 'Artilheiro: casco' },
  gunBarrel: { rows: GUN_BARREL, description: 'Artilheiro/Ômega: canhão' },
  gunnerCore: { rows: GUNNER_CORE, description: 'Artilheiro: núcleo' },
  phoenix: { rows: PHOENIX, description: 'Fênix: corpo' },
  flameWingL: { rows: FLAME_WING, description: 'Fênix/Ômega: asa de fogo esquerda' },
  flameWingR: { rows: flipH(FLAME_WING), description: 'Fênix/Ômega: asa de fogo direita' },
  phoenixCore: { rows: PHOENIX_CORE, description: 'Fênix: coração de fogo' },
  ashCore: { rows: recolor(PHOENIX_CORE, { r: 'p', Y: 'M' }), description: 'Fênix: coração renascido' },
  omega: { rows: OMEGA, description: 'Ômega: casco' },
  omegaNode: { rows: OMEGA_NODE, description: 'Ômega: nó orbital' },
  omegaVeil: { rows: OMEGA_VEIL, description: 'Ômega: véu do vazio' },
  omegaCore: { rows: OMEGA_CORE, description: 'Ômega: núcleo' },
});

/** Sprites simétricos (o teste confere que são idênticos ao próprio espelho). */
export const SYMMETRIC_FINAL_SPRITES = Object.freeze([
  'chronos', 'gear', 'chronoCore', 'mirrorCore', 'parasite', 'sac', 'parasiteCore', 'legion', 'bay',
  'legionCore', 'gunner', 'gunBarrel', 'gunnerCore', 'phoenix', 'phoenixCore', 'ashCore', 'omega',
  'omegaNode', 'omegaVeil', 'omegaCore',
]);
