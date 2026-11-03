/**
 * Paleta de cores da pixel art.
 * Baseada na paleta "Sweetie 16" (GrafxKid), com dois tons extras (M, p).
 * Cada caractere dos sprites (ver spriteData.js) aponta para uma cor.
 * O caractere '.' significa pixel transparente.
 */
export const PALETTE = Object.freeze({
  K: '#1a1c2c', // contorno escuro
  k: '#333c57', // cinza-azulado escuro
  s: '#566c86', // aço
  w: '#94b0c2', // brilho metálico
  W: '#f4f4f4', // branco
  P: '#5d275d', // roxo escuro
  p: '#8e478c', // roxo
  M: '#e43b8c', // magenta (energia do chefe)
  R: '#b13e53', // vermelho
  r: '#ef7d57', // laranja
  Y: '#ffcd75', // amarelo
  g: '#a7f070', // verde claro
  G: '#38b764', // verde
  T: '#257179', // verde-azulado
  N: '#29366f', // azul-marinho
  B: '#3b5dc9', // azul
  b: '#41a6f6', // azul claro
  C: '#73eff7', // ciano
});

export const TRANSPARENT = '.';
