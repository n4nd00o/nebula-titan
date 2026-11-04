/**
 * A documentação faz parte do projeto: estes testes falham se ela ficar
 * para trás do código.
 *  - todo arquivo de teste precisa estar no catálogo (docs/TESTES.md);
 *  - toda versão do CHANGELOG a partir da 1.3.0 precisa do seu relatório de
 *    entrega (docs/RELATORIOS_DE_ENTREGA.md), que nunca é apagado;
 *  - a versão do package.json precisa estar no CHANGELOG.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const versions = [...read('CHANGELOG.md').matchAll(/^## \[(\d+)\.(\d+)\.(\d+)\]/gm)].map((m) => m.slice(1).map(Number));

test('todo arquivo de teste está documentado em docs/TESTES.md', () => {
  const catalog = read('docs/TESTES.md');
  const files = readdirSync(new URL('.', import.meta.url)).filter((f) => f.endsWith('.test.js'));
  for (const file of files) assert.ok(catalog.includes(`\`${file}\``), `${file} não está no catálogo de testes`);
});

test('toda versão desde a 1.3.0 tem relatório de entrega arquivado', () => {
  const reports = read('docs/RELATORIOS_DE_ENTREGA.md');
  const archived = versions.filter(([a, b]) => a > 1 || (a === 1 && b >= 3));
  assert.ok(archived.length >= 2);
  for (const v of archived) assert.ok(reports.includes(`## [${v.join('.')}]`), `relatório da versão ${v.join('.')} não encontrado`);
});

test('a versão do package.json está no CHANGELOG', () => {
  const { version } = JSON.parse(read('package.json'));
  assert.ok(versions.some((v) => v.join('.') === version), `CHANGELOG sem a versão ${version}`);
});
