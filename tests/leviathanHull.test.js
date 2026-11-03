import { test } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Regressão (v1.2.1): o casco do Leviatã ficava invisível porque o recorte com
 * 'destination-in' era feito linha a linha; cada fillRect apagava o resto do
 * casco. O recorte precisa ser UM único preenchimento.
 */
test('casco do Leviatã: recorte destination-in é feito em uma única operação', async () => {
  const ops = [];
  const fakeCtx = () => {
    const ctx = {
      globalCompositeOperation: 'source-over',
      fillStyle: '#000',
      fillRect() { ops.push({ op: 'fillRect', mode: ctx.globalCompositeOperation }); },
      fill() { ops.push({ op: 'fill', mode: ctx.globalCompositeOperation }); },
      drawImage() { ops.push({ op: 'drawImage', mode: ctx.globalCompositeOperation }); },
      beginPath() {}, rect() {}, arc() {},
    };
    return ctx;
  };
  globalThis.document = { createElement: () => ({ getContext: fakeCtx }) };
  try {
    const { getLeviathanHull } = await import('../src/graphics/leviathanHull.js');
    getLeviathanHull();
    const clipping = ops.filter((o) => o.mode === 'destination-in');
    assert.equal(clipping.length, 1, `esperado 1 recorte, houve ${clipping.length}`);
    assert.equal(clipping[0].op, 'fill');
  } finally {
    delete globalThis.document;
  }
});
