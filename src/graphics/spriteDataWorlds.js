/**
 * Pixel art dos Mundos 2, 3 e 4 (mesmo formato de spriteData.js).
 *
 * Cada mundo tem uma identidade de cor:
 *   Mundo 2 (Cinturão Glacial) .. ciano, azul e verde-azulado
 *   Mundo 3 (Forja Estelar) ..... laranja, vermelho e aço
 *   Mundo 4 (Vazio Abissal) ..... roxo, magenta e dourado
 *
 * Todos podem ser trocados por PNGs desenhados à mão (docs/GUIA_DE_SPRITES.md).
 */

/** Espelha cada linha (largura par): "abc" -> "abccba". */
const mirrorEven = (rows) => rows.map((r) => r + [...r].reverse().join(''));

/** Espelha cada linha mantendo a coluna central (largura ímpar): "abc" -> "abcba". */
const mirrorOdd = (rows) => rows.map((r) => r + [...r.slice(0, -1)].reverse().join(''));

/** Espelha verticalmente (metade de cima + metade de baixo invertida). */
const mirrorV = (rows) => rows.concat([...rows].reverse());

/** Inverte horizontalmente. */
const flipH = (rows) => rows.map((r) => [...r].reverse().join(''));

/** Troca cores: recolor(rows, { R: 'P', r: 'p' }). */
const recolor = (rows, map) => rows.map((r) => [...r].map((c) => map[c] ?? c).join(''));

/** Dobra a resolução (cada pixel vira 2x2). */
const upscale2 = (rows) => rows.flatMap((r) => {
  const wide = [...r].map((c) => c + c).join('');
  return [wide, wide];
});

// ===========================================================================
// Alienígenas comuns novos
// ===========================================================================
const ALIEN_BLUE = mirrorOdd([
  '....bbb',
  '..bbBBB',
  '.bBBwBB',
  'bBBBKBB',
  'bBNBBBB',
  'bNNbbbB',
  'bN.bCCb',
  'b..bbbb',
  '....N.N',
]);

const ALIEN_PURPLE = mirrorOdd([
  '..M....',
  '...M...',
  '..pppp.',
  '.pPWpp.',
  'pppKpp.',
  'pPpppp.',
  'p.pPPp.',
  'p.p..p.',
  '...pp..',
]);

const ALIEN_RED = mirrorOdd([
  '.R....r',
  '.RR...r',
  '..RRrrr',
  '..RrWrr',
  '...rKrR',
  '...RrrR',
  '....RRr',
  '.....RY',
  '......Y',
]);

// ===========================================================================
// MUNDO 2 — Cinturão Glacial
// ===========================================================================
const PRISM = mirrorEven(mirrorV([
  '.......k',
  '......kC',
  '.....kCW',
  '....kCbW',
  '...kCbbC',
  '..kCbBbC',
  '.kCbBBbC',
  'kCbBNBbW',
]));

const SHARD = mirrorEven([
  '...k',
  '..kC',
  '.kCW',
  'kCbW',
  'kbBC',
  'kbBC',
  '.kbC',
  '..kb',
  '...k',
]);

const VORTEX = mirrorEven(mirrorV([
  '......kkkk',
  '....kkTTTT',
  '...kTTCCCC',
  '..kTCCkkkk',
  '.kTCkk....',
  '.kTCk.....',
  'kTCk......',
]));

const TURBINE = mirrorEven([
  '..kkk',
  '.kTTT',
  'kTCCk',
  'kTCkW',
  'kTkCC',
  'kTCCk',
  'kTCkW',
  '.kTTT',
  '..kkk',
]);

const VORTEX_EYE = mirrorEven([
  '..kkk',
  '.kCCC',
  'kCbbb',
  'kCbWW',
  'kCbWK',
  'kCbWK',
  'kCbWW',
  'kCbbb',
  '.kCCC',
  '..kkk',
]);

const SCARAB_CORE = mirrorEven([
  '..kkkk',
  '.kGGGG',
  'kGgggY',
  'kGgYYW',
  'kGgYWW',
  'kGgYWW',
  'kGgYYW',
  'kGgggY',
  '.kGGGG',
  '..kkkk',
]);

const SHELL_LEFT = [
  '.....kkk',
  '...kkTGk',
  '..kTGGGk',
  '.kTGgGGk',
  '.kTGgGGk',
  'kTGgGGGk',
  'kTGgGGGk',
  'kTGgGGGk',
  'kTGgGGGk',
  '.kTGgGGk',
  '.kTGGGGk',
  '..kTGGGk',
  '...kkTGk',
  '.....kkk',
];

const MANDIBLE_LEFT = [
  'kk....',
  'kGk...',
  '.kGk..',
  '.kGGk.',
  '..kGGk',
  '..kGgk',
  '.kGgGk',
  'kGgGk.',
  'kkkk..',
];

const HYDRA_BODY = mirrorEven([
  '..........kkkk',
  '........kkTTTT',
  '......kkTTCCCC',
  '.....kTTCCbbbb',
  '....kTCCbbBBBB',
  '...kTCbbBBNNNN',
  '..kTCbBBNNkkkk',
  '..kTCbBNNkKKKK',
  '.kTCbBNNkKKKKK',
  '.kTCbBNkKKKKKK',
  '.kTCbBNkKKKKKK',
  '..kTCbBNkKKKKK',
  '..kTCbBNNkKKKK',
  '...kTCbBNNkkkk',
  '....kTCbBBNNNN',
  '.....kTCCbbbbb',
  '......kkTTTTTT',
  '........kkkkkk',
]);

const HYDRA_HEAD_LEFT = [
  '....kkkk....',
  '..kkTTTTk...',
  '.kTCCCCTTk..',
  'kTCbbbbCTk..',
  'kTCbWKbCTk..',
  'kTCbbbbCTk..',
  '.kTCCCCTk...',
  '..kTRRTk....',
  '..kRYYRk....',
  '...kRRk.....',
];

const HYDRA_HEAD_CENTER = mirrorEven([
  '...kkkk',
  '..kTTTT',
  '.kTCCCC',
  'kTCbbbb',
  'kTCbWKb',
  'kTCbbbb',
  'kTCCCCC',
  '.kTCCCC',
  '..kTRRR',
  '..kRYYY',
  '...kRRY',
  '....kkR',
]);

const ICE_SCALE = mirrorEven([
  'kkkk',
  'kwCC',
  'kCbb',
  'kCbB',
  'kCbB',
  '.kCb',
  '..kk',
]);

const HYDRA_HEART = mirrorEven([
  '.kk..',
  'kRRk.',
  'kRMRk',
  'kRMMR',
  'kRMYM',
  '.kRMY',
  '..kRM',
  '...kR',
  '....k',
]);

// ===========================================================================
// MUNDO 3 — Forja Estelar
// ===========================================================================
const HAMMER = mirrorEven([
  'kkkkkkkkkkkk',
  'kwwwwwwwwwww',
  'kwssssssssss',
  'kwsRRssRRsss',
  'kwsRYssRYsss',
  'kwssssssssss',
  'kkssssssssss',
  '.kkkkkkkkkkk',
]);

const PISTON = mirrorEven([
  'kkk',
  'kws',
  'kws',
  'kss',
  'kss',
  'kRR',
  'kRY',
  'kRR',
  'kss',
  'kss',
  'kws',
  'kkk',
]);

const TWIN = mirrorEven([
  '......k',
  '.....kr',
  '....krY',
  '...krrW',
  '..krrrr',
  '.krRrrr',
  'krRRkrr',
  'kRRk.kr',
  'kRk..kR',
  'kk....k',
]).reverse(); // ponta para baixo

const TWIN_LINK = mirrorEven([
  '..kkk',
  '.kYYY',
  'kYrrr',
  'kYrMM',
  'kYrMW',
  'kYrMW',
  'kYrMM',
  'kYrrr',
  '.kYYY',
  '..kkk',
]);

const FURNACE = mirrorEven([
  '.kkkkkkkkkkkkk',
  'kwwwwwwwwwwwww',
  'kwssssssssssss',
  'kwssRRssssRRss',
  'kwssssssssssss',
  'kwsskkkkkkkkkk',
  'kwsskKKKKKKKKK',
  'kwsskKKKKKKKKK',
  'kwsskKKKKKKKKK',
  'kwsskKKKKKKKKK',
  'kwsskkkkkkkkkk',
  'kwssssssssssss',
  '.kwwwwwwwwwwww',
  '..kkkkkkkkkkkk',
]);

const VENT = mirrorEven([
  'kkkk',
  'ksss',
  'ksKK',
  'ksKr',
  'ksKY',
  'ksKr',
  'ksKK',
  'kkkk',
]);

const FURNACE_CORE = mirrorEven([
  '..kkkk',
  '.krrrr',
  'krrYYY',
  'krYYWW',
  'krYYWW',
  'krrYYY',
  '.krrrr',
  '..kkkk',
]);

const AEGIS_BODY = mirrorEven([
  '......kkkkkkkkkk',
  '....kkwwwwwwwwww',
  '...kwwssssssssss',
  '..kwssNNNNNNNNNN',
  '.kwssNbbbbbbbbbb',
  'kwssNbBBBBBBBBBB',
  'kwssNbBkkkkkkkkk',
  'kwssNbBkKKKKKKKK',
  'kwssNbBkKKKKKKKK',
  'kwssNbBkkkkkkkkk',
  '.kwssNbBBBBBBBBB',
  '..kwssNbbbbbbbbb',
  '...kwwsNNNNNNNNN',
  '....kkwwwwwwwwww',
  '......kkkkkkkkkk',
]);

const AEGIS_CANNON = mirrorEven([
  'kkkk',
  'kwss',
  'kwsB',
  'kwsB',
  '.kwB',
  '.kwB',
  '.kRR',
  '.kYY',
  '..kk',
]);

const AEGIS_SHIELD = mirrorEven([
  'kkkk',
  'kwww',
  'kwCC',
  'kwCb',
  'kkkk',
]);

const AEGIS_GUN = mirrorEven([
  'kkkkkk',
  'kwwwww',
  'kwssss',
  'kwsBBB',
  '.kwsBB',
  '.kwsBB',
  '..kwsB',
  '..kwsB',
  '..kRRR',
  '..kRYY',
  '..kRRR',
  '...kkk',
]);

const AEGIS_CORE = mirrorEven(mirrorV([
  '...kkk',
  '..kCCC',
  '.kCbbb',
  'kCbWWW',
  'kCbWYY',
  'kCbWYM',
]));

// ===========================================================================
// MUNDO 4 — Vazio Abissal
// ===========================================================================
const SPECTER = mirrorEven([
  '.....kkkk',
  '...kkpppp',
  '..kppwwww',
  '.kpwwWWWW',
  '.kpwWKKWW',
  'kpwWWKKWW',
  'kpwWWWWWW',
  'kpwWWWWWW',
  'kpwwWWWWW',
  'kppwwwwww',
  '.kpppwwww',
  '.kp.kpppp',
  '.k..kp.kp',
  '.k...k..k',
]);

const LANTERN = mirrorEven([
  '.kk',
  'kMM',
  'kMY',
  'kYW',
  'kMY',
  'kMM',
  '.kk',
]);

const ORACLE = mirrorEven(mirrorV([
  '........kkkk',
  '......kkPPPP',
  '....kkPPpppp',
  '...kPPppMMMM',
  '..kPppMMkkkk',
  '.kPpMMk.....',
  '.kPpMk......',
  'kPpMk.......',
]));

const PETAL = mirrorEven([
  '..kk',
  '.kMM',
  'kMpp',
  'kMpY',
  'kMpY',
  'kMpp',
  '.kMM',
  '..kk',
]);

const ORACLE_EYE = mirrorEven([
  '..kkkk',
  '.kYYYY',
  'kYWWWW',
  'kYWMMM',
  'kYWMKK',
  'kYWMKK',
  'kYWMMM',
  'kYWWWW',
  '.kYYYY',
  '..kkkk',
]);

/** O Eco é uma cópia sombria da nave do jogador, de cabeça para baixo e em dobro. */
const PLAYER_SHAPE = mirrorOdd([
  '.......W',
  '......WW',
  '......WC',
  '......WC',
  '.....WBC',
  '.R...WBB',
  '.R..WWBB',
  '.W.WWBBW',
  '.WWWBBWW',
  'WWRWBBBW',
  'WWRRWWBW',
  'W..RRWWW',
  'W...RR.R',
  '.......Y',
]);
const ECHO = upscale2(recolor([...PLAYER_SHAPE].reverse(), { W: 's', B: 'P', C: 'M', R: 'K', Y: 'M' }));

const REFLECTOR = mirrorEven([
  'kkkk',
  'kWWC',
  'kWCC',
  'kCCb',
  'kCbb',
  'kCbb',
  'kCCb',
  'kWCC',
  'kWWC',
  'kkkk',
]);

const ARCHON = mirrorEven([
  '..........kkkkkk',
  '.......kkkPPPPPP',
  '.....kkPPPppppYY',
  '....kPPppppYYYYY',
  '...kPppYYYYkkkkk',
  '..kPpYYkkkkKKKKK',
  '.kPpYkkKKKKKKKKK',
  'kPpYkKKKKKKKKKKK',
  'kPpYkKKKKKKKKKKK',
  'kPpYkKKKKKKKKKKK',
  'kPpYkkKKKKKKKKKK',
  '.kPpYYkkkkKKKKKK',
  '..kPpppYYYkkkkkk',
  '...kPPPppppYYYYY',
  '....kkkPPPPppppp',
  '.......kkkPPPPPP',
  '..........kkkkkk',
]);

const ARCHON_WING_LEFT = [
  '..........kk..',
  '........kkPPk.',
  '......kkPPppk.',
  '....kkPPppYYk.',
  '..kkPPppYYppk.',
  'kkPPppYYppPPk.',
  'kPppYYppPPkkk.',
  'kpYYppPPkk....',
  'kYppPPkk......',
  'kRRkkk........',
  'kYRk..........',
  '.kk...........',
];

const ARCHON_CANNON = mirrorEven([
  'kkkkk',
  'kYYYY',
  'kYPPP',
  '.kPpp',
  '.kPpM',
  '.kPpM',
  '..kPM',
  '..kMW',
  '..kMM',
  '...kk',
]);

const ARCHON_MASK = mirrorEven([
  'kkkkkkk',
  'kYYYYYY',
  'kYWWWWW',
  'kYWKKWW',
  'kYWWWWW',
  'kYYWWWW',
  '.kYYWWW',
  '..kYYYY',
  '...kkkk',
]);

const ARCHON_CORE = mirrorEven(mirrorV([
  '...kkk',
  '..kMMM',
  '.kMppp',
  'kMpYYY',
  'kMpYWW',
  'kMpYWW',
]));

const ARCHON_POD = mirrorEven([
  '...kk',
  '..kpp',
  '.kpYp',
  'kpYWp',
  'kpppp',
  'kPppp',
  'kPPpp',
  '.kPPp',
  '..kPP',
  '...kk',
]);

export const WORLD_SPRITES = Object.freeze({
  // Alienígenas
  alienBlue: { rows: ALIEN_BLUE, description: 'Alienígena azul (blindado)' },
  alienPurple: { rows: ALIEN_PURPLE, description: 'Alienígena roxo (divisor)' },
  alienRed: { rows: ALIEN_RED, description: 'Alienígena vermelho (kamikaze)' },
  // Mundo 2
  prism: { rows: PRISM, description: 'Prisma: núcleo de cristal' },
  shard: { rows: SHARD, description: 'Prisma: fragmento orbital' },
  vortex: { rows: VORTEX, description: 'Vórtice: anel do casco' },
  turbine: { rows: TURBINE, description: 'Vórtice: turbina' },
  vortexEye: { rows: VORTEX_EYE, description: 'Vórtice: olho do furacão' },
  scarabCore: { rows: SCARAB_CORE, description: 'Escaravelho: núcleo' },
  shellL: { rows: SHELL_LEFT, description: 'Escaravelho: carapaça esquerda' },
  shellR: { rows: flipH(SHELL_LEFT), description: 'Escaravelho: carapaça direita' },
  mandibleL: { rows: MANDIBLE_LEFT, description: 'Escaravelho: mandíbula esquerda' },
  mandibleR: { rows: flipH(MANDIBLE_LEFT), description: 'Escaravelho: mandíbula direita' },
  hydraBody: { rows: HYDRA_BODY, description: 'Hidra: corpo' },
  hydraHeadL: { rows: HYDRA_HEAD_LEFT, description: 'Hidra: cabeça esquerda' },
  hydraHeadR: { rows: flipH(HYDRA_HEAD_LEFT), description: 'Hidra: cabeça direita' },
  hydraHeadC: { rows: HYDRA_HEAD_CENTER, description: 'Hidra: cabeça central' },
  iceScale: { rows: ICE_SCALE, description: 'Hidra: escama de gelo' },
  hydraHeart: { rows: HYDRA_HEART, description: 'Hidra: coração' },
  // Mundo 3
  hammer: { rows: HAMMER, description: 'Martelo: cabeça' },
  piston: { rows: PISTON, description: 'Martelo: pistão' },
  twin: { rows: TWIN, description: 'Gêmeos: nave irmã' },
  twinLink: { rows: TWIN_LINK, description: 'Gêmeos: núcleo do elo' },
  furnace: { rows: FURNACE, description: 'Fornalha: casco' },
  vent: { rows: VENT, description: 'Fornalha: chaminé' },
  furnaceCore: { rows: FURNACE_CORE, description: 'Fornalha: núcleo' },
  aegisBody: { rows: AEGIS_BODY, description: 'Égide: fortaleza' },
  aegisCannon: { rows: AEGIS_CANNON, description: 'Égide: canhão de canto' },
  aegisShield: { rows: AEGIS_SHIELD, description: 'Égide: segmento do anel' },
  aegisGun: { rows: AEGIS_GUN, description: 'Égide: arma principal' },
  aegisCore: { rows: AEGIS_CORE, description: 'Égide: núcleo' },
  // Mundo 4
  specter: { rows: SPECTER, description: 'Espectro: corpo' },
  lantern: { rows: LANTERN, description: 'Espectro: lanterna' },
  oracle: { rows: ORACLE, description: 'Oráculo: mandala' },
  petal: { rows: PETAL, description: 'Oráculo: pétala' },
  oracleEye: { rows: ORACLE_EYE, description: 'Oráculo: olho' },
  echo: { rows: ECHO, description: 'Eco: cópia sombria da sua nave' },
  reflector: { rows: REFLECTOR, description: 'Eco: refletor' },
  archon: { rows: ARCHON, description: 'Arconte: casco' },
  archonWingL: { rows: ARCHON_WING_LEFT, description: 'Arconte: asa esquerda' },
  archonWingR: { rows: flipH(ARCHON_WING_LEFT), description: 'Arconte: asa direita' },
  archonCannon: { rows: ARCHON_CANNON, description: 'Arconte: canhão' },
  archonMask: { rows: ARCHON_MASK, description: 'Arconte: máscara' },
  archonCore: { rows: ARCHON_CORE, description: 'Arconte: núcleo' },
  archonPod: { rows: ARCHON_POD, description: 'Arconte: cápsula orbital' },
});

/** Sprites simétricos (o teste confere que são idênticos ao próprio espelho). */
export const SYMMETRIC_WORLD_SPRITES = Object.freeze([
  'alienBlue', 'alienPurple', 'alienRed', 'prism', 'shard', 'vortex', 'turbine', 'vortexEye',
  'scarabCore', 'hydraBody', 'hydraHeadC', 'iceScale', 'hydraHeart', 'hammer', 'piston', 'twin',
  'twinLink', 'furnace', 'vent', 'furnaceCore', 'aegisBody', 'aegisCannon', 'aegisShield', 'aegisGun',
  'aegisCore', 'specter', 'lantern', 'oracle', 'petal', 'oracleEye', 'echo', 'reflector', 'archon',
  'archonCannon', 'archonMask', 'archonCore', 'archonPod',
]);
