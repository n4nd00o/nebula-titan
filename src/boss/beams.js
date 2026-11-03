/**
 * Desenho de raios letais (segmentos) usados por vários chefes:
 * sopro da Hidra, elo dos Gêmeos, colunas de fogo da Fornalha, arma da Égide...
 *
 * A COLISÃO é feita pela cena (PlayScene) a partir de boss.lethalSegments();
 * aqui fica só a parte visual: o AVISO (linha fina piscando) e o RAIO.
 */

/** Linha com brilho aditivo. */
export function drawBeam(ctx, x1, y1, x2, y2, width, color) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/** Aviso antes do disparo: linha fina piscando. */
export function drawBeamWarning(ctx, x1, y1, x2, y2, time, color = 'rgba(255, 40, 72, 0.85)') {
  if (Math.floor(time * 14) % 2 !== 0) return;
  drawBeam(ctx, x1, y1, x2, y2, 2, color);
}

/**
 * Raio letal em três camadas (halo, corpo e núcleo branco).
 * @param {{x1:number,y1:number,x2:number,y2:number,width:number}} seg
 * @param {[string, string]} colors [halo, corpo]
 */
export function drawLethalBeam(ctx, seg, colors = ['rgba(228, 59, 140, 0.35)', 'rgba(228, 59, 140, 0.9)']) {
  const flicker = 0.85 + Math.random() * 0.15;
  drawBeam(ctx, seg.x1, seg.y1, seg.x2, seg.y2, seg.width * 1.6 * flicker, colors[0]);
  drawBeam(ctx, seg.x1, seg.y1, seg.x2, seg.y2, seg.width * flicker, colors[1]);
  drawBeam(ctx, seg.x1, seg.y1, seg.x2, seg.y2, Math.max(2, seg.width * 0.35), '#ffffff');
}
