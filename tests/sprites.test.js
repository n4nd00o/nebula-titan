import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPRITES, flipH } from '../src/graphics/spriteData.js';
import { PALETTE, TRANSPARENT } from '../src/graphics/palette.js';
import { SYMMETRIC_WORLD_SPRITES } from '../src/graphics/spriteDataWorlds.js';
import { SYMMETRIC_FINAL_SPRITES } from '../src/graphics/spriteDataFinal.js';
import { BOSSES } from '../src/boss/bosses/index.js';
import { ALIEN_TYPES } from '../src/entities/alienTypes.js';

test('todas as linhas de cada sprite têm a mesma largura', () => {
  for (const [name, def] of Object.entries(SPRITES)) {
    const widths = new Set(def.rows.map((r) => r.length));
    assert.equal(widths.size, 1, `sprite "${name}" tem linhas de larguras diferentes`);
  }
});

test('sprites só usam cores existentes na paleta', () => {
  for (const [name, def] of Object.entries(SPRITES)) {
    for (const char of def.rows.join('')) {
      assert.ok(char === TRANSPARENT || PALETTE[char], `cor "${char}" desconhecida em "${name}"`);
    }
  }
});

test('asa direita é o espelho exato da esquerda', () => {
  assert.deepEqual(SPRITES.wingR.rows, flipH(SPRITES.wingL.rows));
  assert.deepEqual(SPRITES.bladeR.rows, flipH(SPRITES.bladeL.rows));
  for (const [r, l] of [['shellR', 'shellL'], ['mandibleR', 'mandibleL'], ['hydraHeadR', 'hydraHeadL'], ['archonWingR', 'archonWingL']]) {
    assert.deepEqual(SPRITES[r].rows, flipH(SPRITES[l].rows), `"${r}" deveria espelhar "${l}"`);
  }
});

test('sprites simétricos são de fato simétricos', () => {
  // (o gerador fica de fora: o brilho no canto é assimétrico de propósito)
  for (const name of ['player', 'hull', 'plate', 'core', 'cannon', 'sentinel', 'pod', 'barrier', 'hive', 'nest', 'hiveCore', 'reaper', 'wingman', 'alienOrange', 'turret', 'hangar', 'bunker', 'reactor', 'storm', 'bridge', 'levCore']) {
    assert.deepEqual(SPRITES[name].rows, flipH(SPRITES[name].rows), `"${name}" deveria ser simétrico`);
  }
  for (const name of [...SYMMETRIC_WORLD_SPRITES, ...SYMMETRIC_FINAL_SPRITES]) {
    assert.deepEqual(SPRITES[name].rows, flipH(SPRITES[name].rows), `"${name}" deveria ser simétrico`);
  }
});

test('todo sprite usado por chefes, ícones e alienígenas existe', () => {
  for (const def of Object.values(BOSSES)) {
    for (const part of def.parts) assert.ok(SPRITES[part.sprite], `${def.name}: sprite "${part.sprite}" não existe`);
    if (def.icon) assert.ok(SPRITES[def.icon.sprite], `${def.name}: ícone "${def.icon.sprite}" não existe`);
  }
  for (const [id, type] of Object.entries(ALIEN_TYPES)) assert.ok(SPRITES[type.sprite], `alienígena ${id}`);
});
