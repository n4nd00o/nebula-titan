/**
 * Renderização de texto em estilo arcade.
 * A fonte "Press Start 2P" é carregada pelo Google Fonts (index.html);
 * se não estiver disponível (offline), cai para uma fonte monoespaçada.
 */
export const FONT_FAMILY = '"Press Start 2P", "Courier New", monospace';

export function drawText(ctx, text, x, y, options = {}) {
  const {
    size = 10,
    color = '#f4f4f4',
    align = 'left',
    baseline = 'top',
    shadow = '#1a1c2c',
    alpha = 1,
  } = options;

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${size}px ${FONT_FAMILY}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  const px = Math.round(x);
  const py = Math.round(y);
  if (shadow) {
    const offset = Math.max(1, Math.floor(size / 8));
    ctx.fillStyle = shadow;
    ctx.fillText(text, px + offset, py + offset);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, px, py);
  ctx.restore();
}

/** Mede a largura de um texto com a fonte do jogo. */
export function measureText(ctx, text, size = 10) {
  ctx.save();
  ctx.font = `${size}px ${FONT_FAMILY}`;
  const width = ctx.measureText(text).width;
  ctx.restore();
  return width;
}
