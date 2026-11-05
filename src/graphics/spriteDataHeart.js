/**
 * Pixel art gerada por código para o encontro especial (src/boss/bosses/heart.js).
 * Mesmo formato de spriteData.js: cada caractere é uma cor da paleta.
 *
 * A forma vem da curva implícita do coração: (x² + y² − 1)³ − x²·y³ ≤ 0.
 */

/** O ponto (x, y) normalizado está dentro do coração? */
function inside(x, y) {
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
}

/**
 * Rasteriza um coração com contorno, casco, painéis e brilho.
 * @param {number} cols largura em pixels de arte
 * @param {number} rows altura em pixels de arte
 * @param {{edge: string, fill: string, shade: string, light: string, panel?: string}} c cores
 */
function heartRows(cols, rows, c) {
  const solid = (col, row) => {
    if (col < 0 || row < 0 || col >= cols || row >= rows) return false;
    const x = ((col + 0.5) / cols) * 2.5 - 1.25;
    const y = 1.2 - ((row + 0.5) / rows) * 2.26;
    return inside(x, y);
  };
  const out = [];
  for (let row = 0; row < rows; row++) {
    let line = '';
    for (let col = 0; col < cols; col++) {
      if (!solid(col, row)) {
        line += '.';
        continue;
      }
      const edge = !solid(col - 1, row) || !solid(col + 1, row) || !solid(col, row - 1) || !solid(col, row + 1);
      const nx = col / cols;
      const ny = row / rows;
      if (edge) line += 'K';
      else if (!solid(col, row + 2) || !solid(col + 2, row)) line += c.shade; // sombra embaixo/direita
      else if (Math.hypot((nx - 0.28) * 1.4, ny - 0.24) < 0.08) line += c.light; // brilho no lobo esquerdo
      else if (c.panel && (row % 6 === 0 || col === Math.floor(cols / 2))) line += c.panel; // painéis
      else line += c.fill;
    }
    out.push(line);
  }
  return out;
}

const splitLeft = (rows) => rows.map((r) => r.slice(0, r.length / 2));
const splitRight = (rows) => rows.map((r) => r.slice(r.length / 2));

/** Amplia uma arte 2x (cada pixel vira 2x2). */
const scale2 = (rows) => rows.flatMap((r) => {
  const wide = [...r].map((ch) => ch + ch).join('');
  return [wide, wide];
});

const HULL = heartRows(44, 38, { fill: 'M', shade: 'R', light: 'W', panel: 'p' });
// A emenda do meio vira uma "costura" escura entre as duas metades.
const LEFT = splitLeft(HULL).map((r) => r.slice(0, -1) + (r.at(-1) === '.' ? '.' : 'P'));
const RIGHT = splitRight(HULL).map((r) => (r[0] === '.' ? '.' : 'P') + r.slice(1));

const CORE = heartRows(16, 14, { fill: 'Y', shade: 'r', light: 'W' });

// Asas de cupido: penas em degraus (esquerda), espelhadas para a direita.
const WING = scale2([
  '..........kk',
  '........kkWk',
  '......kkWWWk',
  '....kkWWwWWk',
  '..kkWWwWWWMk',
  '.kWWwWWWWMMk',
  'kWWwWWWWMMk.',
  'kWwWWWMMMk..',
  '.kWWWMMMk...',
  '.kWWMMk.....',
  '..kWMk......',
  '...kk.......',
]);
const flipH = (rows) => rows.map((r) => [...r].reverse().join(''));

export const HEART_SPRITES = Object.freeze({
  heartL: { rows: LEFT, description: 'Coração: metade esquerda' },
  heartR: { rows: RIGHT, description: 'Coração: metade direita' },
  heartCore: { rows: CORE, description: 'Coração: núcleo' },
  heartWingL: { rows: WING, description: 'Coração: asa esquerda' },
  heartWingR: { rows: flipH(WING), description: 'Coração: asa direita' },
});
