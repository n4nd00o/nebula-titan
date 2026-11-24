/**
 * História (v1.7): os textos existem para cada momento da campanha, cabem na
 * moldura da StoryScene e os créditos listam todos os integrantes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INTRO, INTERLUDES, ENDING_VICTORY, ENDING_DEFEAT, creditsPage, wrapText } from '../src/story/story.js';
import { TEAM } from '../src/story/team.js';
import { WORLDS } from '../src/systems/Campaign.js';

const MAX_CHARS = Math.floor((480 - 72) / 8); // mesma conta da StoryScene
const MAX_LINES = 14; // moldura de 290 px, texto começa 60 px abaixo, 16 px por linha
const allPages = () => [...INTRO, ...Object.values(INTERLUDES).flat(), ...ENDING_VICTORY, ...ENDING_DEFEAT];

test('wrapText respeita o limite e não perde palavras', () => {
  const text = 'a nave da vega cruza cinco mundos para destruir o omega\nfim';
  const lines = wrapText(text, 12);
  assert.ok(lines.every((l) => l.length <= 12));
  assert.equal(lines.join(' ').replace(/\s+/g, ' '), text.replace('\n', ' '));
  assert.deepEqual(wrapText('um\n\ndois', 10), ['um', '', 'dois']);
});

test('há introdução, finais de vitória e derrota e um texto para cada mundo novo', () => {
  assert.ok(INTRO.length >= 3);
  assert.ok(ENDING_VICTORY.length >= 2);
  assert.ok(ENDING_DEFEAT.length >= 1);
  for (let next = 1; next < WORLDS.length; next++) {
    assert.ok(INTERLUDES[next]?.length, `falta o texto de entrada do mundo ${next + 1}`);
  }
});

test('cada texto entre mundos cita o mundo para onde a piloto vai', () => {
  for (let next = 1; next < WORLDS.length; next++) {
    const text = INTERLUDES[next].map((p) => `${p.title} ${p.text}`).join(' ').toUpperCase();
    const name = WORLDS[next].name;
    assert.ok(text.includes(name) || text.includes(name.split(' ')[0]), `mundo ${next + 1} (${name}) não aparece no texto`);
  }
});

test('todas as páginas cabem na moldura da StoryScene', () => {
  for (const page of allPages()) {
    assert.ok(page.title && page.title.length <= 34, `título longo demais: ${page.title}`);
    const lines = wrapText(page.text, MAX_CHARS);
    assert.ok(lines.length <= MAX_LINES, `"${page.title}" tem ${lines.length} linhas`);
    assert.ok(lines.every((l) => l.length <= MAX_CHARS), `"${page.title}" tem palavra maior que a linha`);
  }
});

test('os créditos do final mostram o grupo e todos os integrantes', () => {
  const credits = ENDING_VICTORY.at(-1);
  assert.equal(credits.title, 'CRÉDITOS');
  assert.ok(credits.text.includes(TEAM.group));
  for (const member of TEAM.members) assert.ok(credits.text.includes(member.name), `${member.name} fora dos créditos`);
  const custom = creditsPage({ group: 'G', members: [{ name: 'Ana', ra: '1' }] });
  assert.match(custom.text, /Ana · RA 1/);
});
