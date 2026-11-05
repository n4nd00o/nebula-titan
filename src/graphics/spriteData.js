/**
 * Sprites em pixel art definidos como texto ("ASCII art" colorida).
 *
 * Cada linha é uma fileira de pixels; cada caractere é uma cor da paleta
 * (ver palette.js). Vantagens desta abordagem:
 *  - zero arquivos de imagem obrigatórios (o jogo roda "out of the box");
 *  - versionável no Git (diffs legíveis);
 *  - fácil de espelhar/gerar variações por código.
 *
 * Qualquer sprite pode ser substituído por um PNG desenhado à mão.
 * Veja docs/GUIA_DE_SPRITES.md.
 *
 * Os sprites dos Mundos 2 a 4 ficam em spriteDataWorlds.js.
 */
import { WORLD_SPRITES } from './spriteDataWorlds.js';
import { FINAL_SPRITES } from './spriteDataFinal.js';
import { HEART_SPRITES } from './spriteDataHeart.js';

/** Espelha cada linha (largura par): "abc" -> "abccba". */
const mirrorEven = (rows) => rows.map((r) => r + [...r].reverse().join(''));

/** Espelha cada linha mantendo a coluna central (largura ímpar): "abc" -> "abcba". */
const mirrorOdd = (rows) => rows.map((r) => r + [...r.slice(0, -1)].reverse().join(''));

/** Inverte horizontalmente. */
export const flipH = (rows) => rows.map((r) => [...r].reverse().join(''));

// ---------------------------------------------------------------------------
// Jogador
// ---------------------------------------------------------------------------
const PLAYER = mirrorOdd([
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

// ---------------------------------------------------------------------------
// Chefe: Nebula Titan (montado a partir de várias partes independentes)
// ---------------------------------------------------------------------------

/** Casco central (indestrutível). A cavidade K abriga a placa/núcleo. */
const HULL = mirrorEven([
  '........kkkkk',
  '......kkppppp',
  '.....kpppwwww',
  '....kppwwpppp',
  '...kppwpPPPPP',
  '...kpwpPPCCCC',
  '..kppwpPkkkkk',
  '..kpwpPkKKKKK',
  '.kppwpPkKKKKK',
  '.kpwppPkKKKKK',
  'kppwpPPkKKKKK',
  'kpwwpPPkKKKKK',
  'kpwppPPkKKKKK',
  'kpwppPPkKKKKK',
  'kpwppPPkKKKKK',
  'kppwpPPkKKKKK',
  '.kpwpPPkKKKKK',
  '.kppwpPkkkkkk',
  '..kpwpPPPPPPP',
  '..kppwpPPRRPP',
  '...kpwppPPPPP',
  '...kppwpPPkkk',
  '....kppwPkKKK',
  '.....kpwPkKKK',
  '......kpPkKKK',
  '.......kkkKKK',
]);

/** Asa esquerda (a direita é o espelho). A torreta fica na ponta. */
const WING_LEFT = [
  '....................kkkk',
  '..................kkpppk',
  '................kkppwwpk',
  '..............kkppwwpppk',
  '............kkppwwppPPPk',
  '..........kkppwwppPPPPPk',
  '........kkppwwppPPCPPPPk',
  '......kkppwwppPPPPCPPPPk',
  '....kkppwwppPPPPPPPCPPPk',
  '..kkppwwppPPPPPPPPPPCPPk',
  '.kkwwppPPPPPPPPPPPPPPPPk',
  'kRRkpPPPPkkkkkkkkPPPPPPk',
  'kYRkPPkkk........kkPPPPk',
  'kRRkkk.............kkPPk',
  '.kk..................kkk',
];

/** Gerador de escudo (escondido atrás de cada asa). */
const GENERATOR = [
  '...kkkk...',
  '..kbbbbk..',
  '.kbCCCCbk.',
  'kbCWWCCCbk',
  'kbCWCCCCbk',
  'kbCCCCCCbk',
  'kbCCCCCCbk',
  '.kbCCCCbk.',
  '..kbbbbk..',
  '...kkkk...',
];

/** Placa blindada que protege o núcleo até a fase final. */
const PLATE = [
  'kkkkkkkkkk',
  'kwwwwwwwwk',
  'kwppppppwk',
  'kwpRkkRpwk',
  'kwpkCCkpwk',
  'kwpkCCkpwk',
  'kwpRkkRpwk',
  'kwppppppwk',
  'kwwwwwwwwk',
  'kkkkkkkkkk',
];

/** Núcleo de energia (ponto fraco final). */
const CORE = [
  '...rrrr...',
  '.rrRRRRrr.',
  '.rRMMMMRr.',
  'rRMMYYMMRr',
  'rRMYWWYMRr',
  'rRMYWWYMRr',
  'rRMMYYMMRr',
  '.rRMMMMRr.',
  '.rrRRRRrr.',
  '...rrrr...',
];

/** Canhão principal (dispara o laser). */
const CANNON = [
  'kkkkkkkk',
  'kwppppwk',
  'kwpPPpwk',
  'kwpPPpwk',
  '.kwPPwk.',
  '.kwPPwk.',
  '.kpPPpk.',
  '..kRRk..',
  '..kRRk..',
  '..kYYk..',
  '..kRRk..',
  '...kk...',
];

// ---------------------------------------------------------------------------
// Inimigos menores (drones invocados pelo chefe)
// ---------------------------------------------------------------------------
const MINION = [
  '..g.....g..',
  '...g...g...',
  '..GGGGGGG..',
  '.GGWGGGWGG.',
  'GGGKGGGKGGG',
  'GgGGGGGGGgG',
  'G.GGgggGG.G',
  'G.G.....G.G',
  '...GG.GG...',
];

/** Nave aliada (Ala Companheira): a nave do jogador recolorida em verde. */
const WINGMAN = PLAYER.map((row) => row.replace(/B/g, 'G').replace(/C/g, 'g').replace(/R/g, 'T'));

// ---------------------------------------------------------------------------
// Mini-chefe 1: SENTINELA (olho blindado + cápsulas orbitais + barreiras)
// ---------------------------------------------------------------------------
const SENTINEL = mirrorEven([
  '......kkk',
  '....kksss',
  '...kswwss',
  '..kswssss',
  '.kswsTTTT',
  '.ksssTkkk',
  'kswsTkRRR',
  'kswsTkRMM',
  'kssTkRMYW',
  'kssTkRMYW',
  'kswsTkRMM',
  'kswsTkRRR',
  '.ksssTkkk',
  '.kswsTTTT',
  '..kssssss',
  '...ksssss',
  '....kksss',
  '......kkk',
]);

const POD = mirrorEven([
  '...kk',
  '..krr',
  '.krYr',
  'krYWr',
  'krrrr',
  'kRrrr',
  'kRRrr',
  '.kRRr',
  '..kRR',
  '...kk',
]);

const BARRIER = mirrorEven([
  'kkkkk',
  'kwwww',
  'kwsss',
  'ksCCC',
  'kssss',
  'kkkkk',
]);

// ---------------------------------------------------------------------------
// Mini-chefe 2: COLMEIA (nave-mãe orgânica com ninhos de drones)
// ---------------------------------------------------------------------------
const HIVE = mirrorEven([
  '.......kkkkkkk',
  '.....kkGGGGGGG',
  '....kGGggggggg',
  '...kGgTTTTTTTT',
  '..kGgTkkkkkkkk',
  '.kGgTkYYkkYYkk',
  'kGgTkYYkkYYkkY',
  'kGgTkkkkkkkkkk',
  'kGgTTTTTTTTTTT',
  '.kGggggggggggg',
  '..kGGGGGGGGGGG',
  '...kkkkkkkkkkk',
]);

const NEST = mirrorEven([
  'kkkkk',
  'kGGGG',
  'kGKKK',
  'kGKgg',
  'kGKgY',
  'kGKgg',
  'kGKKK',
  '.kkkk',
]);

const HIVE_CORE = mirrorEven([
  '..kkkk',
  '.kMMMM',
  'kMMppp',
  'kMpYYY',
  'kMpYWW',
  'kMpYWW',
  'kMpYYY',
  'kMMppp',
  '.kMMMM',
  '..kkkk',
]);

// ---------------------------------------------------------------------------
// Mini-chefe 3: CEIFADOR (nave-lâmina que mergulha no jogador)
// ---------------------------------------------------------------------------
const REAPER = mirrorEven([
  '........kk',
  '.......kRR',
  '......kRrr',
  '.....kRrww',
  '....kRrwkk',
  '...kRrwkKK',
  '..kRrrwkKM',
  '.kRrrrwkKM',
  'kRrrrrrwkk',
  'kRRrrrrrww',
  '.kRRRrrrrr',
  '..kkRRRRRR',
  '....kkkkRR',
  '.......kkk',
]).reverse(); // ponta para baixo, apontando para o jogador

const BLADE_LEFT = [
  'kkk...........',
  'kwwkk.........',
  '.kwwwkk.......',
  '..kwwwwkk.....',
  '...kwwssskk...',
  '....kwssssskk.',
  '.....kwssssssk',
  '......kwsssssk',
  '.......kksssRk',
  '.........kkRRk',
  '...........kkk',
];

/** Espelha verticalmente (metade de cima + metade de baixo invertida). */
const mirrorV = (rows) => rows.concat([...rows].reverse());

// ---------------------------------------------------------------------------
// Alienígena laranja (inimigo comum mais resistente)
// ---------------------------------------------------------------------------
const ALIEN_ORANGE = mirrorOdd([
  '..Y....',
  '...Y...',
  '..rrrrr',
  '.rrWrrr',
  'rrrKrrr',
  'rRrrrrr',
  'R.rRRRr',
  'R.R...r',
  '...RR.R',
]);

// ---------------------------------------------------------------------------
// Chefe final: LEVIATÃ (peças sobre o casco; o casco é desenhado por código)
// ---------------------------------------------------------------------------
const TURRET = mirrorEven([
  '..kkkk',
  '.kssss',
  'ksswww',
  'kswsss',
  'kswsRR',
  'ksssRY',
  'ksssRR',
  '.kssss',
  '..kkks',
  '....ks',
  '....ks',
  '....kk',
]);

const HANGAR = mirrorEven([
  'kkkkkkkkk',
  'kYKYKYKYK',
  'kKYKYKYKY',
  'kkkkkkkkk',
  'kssssssss',
  'ksKKKKKKK',
  'ksKgKKKKK',
  'ksKKKKgKK',
  'ksKKKKKKK',
  'kkkkkkkkk',
]);

const BUNKER = mirrorEven([
  '..kkkkk',
  '.kwwwww',
  'kwsssss',
  'kwsKKKK',
  'kwsKRRR',
  'kwsKRYY',
  'kwsKRYW',
  'kwsKRYW',
  'kwsKRYY',
  'kwsKRRR',
  'kwsKKKK',
  'kwsssss',
  '.kwwwww',
  '..kkkkk',
]);

const REACTOR = mirrorEven(mirrorV([
  '...kkkk',
  '..kTTTT',
  '.kTgggg',
  'kTggCCC',
  'kTgCWWC',
  'kTgCWCC',
  'kTgCCCC',
]));

const STORM = mirrorEven([
  'kkkkkkkkkkkk',
  'kwwwwwwwwwww',
  'kwssssssssss',
  'kwsMMsMMsMMs',
  'kwsMMsMMsMMs',
  'kwssssssssss',
  'kkkkkkkkkkkk',
  '.kRk.kRk.kRk',
  '.kRk.kRk.kRk',
  '.kYk.kYk.kYk',
  '..k...k...k.',
]);

const BRIDGE = mirrorEven([
  '.......kkkkkkkk',
  '.....kkwwwwwwww',
  '....kwwssssssss',
  '...kwsssKKKKKKK',
  '..kwssKCCKCCKCC',
  '..kwssKCCKCCKCC',
  '.kwsssKKKKKKKKK',
  '.kwssssssssssss',
  'kwssPPPPPPPPPPP',
  'kwsPppppppppppp',
  'kwsPpMMMMMMMMMM',
  'kwsPppppppppppp',
  'kwssPPPPPPPPPPP',
  '.kwssssssssssss',
  '..kkkkkkkkkkkkk',
]);

const LEVIATHAN_CORE = mirrorEven(mirrorV([
  '.....kkk',
  '...kkMMM',
  '..kMMppp',
  '.kMpprrr',
  '.kMprYYY',
  'kMprYYWW',
  'kMprYWWW',
  'kMprYWWW',
]));

/**
 * Catálogo de sprites. A chave é o nome usado no código e também
 * o nome do PNG opcional em assets/sprites/<nome>.png.
 */
export const SPRITES = Object.freeze({
  player: { rows: PLAYER, description: 'Nave do jogador' },
  wingman: { rows: WINGMAN, description: 'Nave aliada (Ala Companheira)' },
  alienOrange: { rows: ALIEN_ORANGE, description: 'Alienígena laranja (resistente)' },
  turret: { rows: TURRET, description: 'Leviatã: torreta do casco' },
  hangar: { rows: HANGAR, description: 'Leviatã: porta de hangar' },
  bunker: { rows: BUNKER, description: 'Leviatã: bateria blindada' },
  reactor: { rows: REACTOR, description: 'Leviatã: reator regenerativo' },
  storm: { rows: STORM, description: 'Leviatã: canhão de tempestade' },
  bridge: { rows: BRIDGE, description: 'Leviatã: ponte de comando' },
  levCore: { rows: LEVIATHAN_CORE, description: 'Leviatã: núcleo' },
  sentinel: { rows: SENTINEL, description: 'Sentinela: olho blindado' },
  pod: { rows: POD, description: 'Sentinela: cápsula orbital' },
  barrier: { rows: BARRIER, description: 'Sentinela: barreira giratória' },
  hive: { rows: HIVE, description: 'Colmeia: casco' },
  nest: { rows: NEST, description: 'Colmeia: ninho de drones' },
  hiveCore: { rows: HIVE_CORE, description: 'Colmeia: rainha (núcleo)' },
  reaper: { rows: REAPER, description: 'Ceifador: corpo' },
  bladeL: { rows: BLADE_LEFT, description: 'Ceifador: lâmina esquerda' },
  bladeR: { rows: flipH(BLADE_LEFT), description: 'Ceifador: lâmina direita' },
  hull: { rows: HULL, description: 'Casco central do chefe' },
  wingL: { rows: WING_LEFT, description: 'Asa esquerda do chefe' },
  wingR: { rows: flipH(WING_LEFT), description: 'Asa direita do chefe' },
  generator: { rows: GENERATOR, description: 'Gerador de escudo' },
  plate: { rows: PLATE, description: 'Placa blindada do núcleo' },
  core: { rows: CORE, description: 'Núcleo de energia' },
  cannon: { rows: CANNON, description: 'Canhão principal' },
  minion: { rows: MINION, description: 'Drone inimigo' },
  ...WORLD_SPRITES,
  ...FINAL_SPRITES,
  ...HEART_SPRITES,
});
