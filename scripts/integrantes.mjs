/**
 * Espalha os integrantes do grupo por todo o projeto.
 *
 * Uso:  edite integrantes.json  ->  npm run integrantes
 *
 * O que o script atualiza:
 *  - src/story/team.js (créditos do final de vitória, dentro do jogo);
 *  - um bloco com grupo, disciplina, professor e integrantes logo abaixo do
 *    título de cada documento (README.md, README.en.md, CHANGELOG.md, docs/);
 *  - a tabela de divisão de tarefas do README (bloco "integrantes-tabela").
 *
 * Os blocos ficam entre comentários <!-- integrantes:inicio --> e
 * <!-- integrantes:fim -->. Se o bloco ainda não existe, ele é criado logo
 * abaixo do primeiro título "# ". Rodar de novo só troca o conteúdo.
 *
 * Depois, para os slides: npm run slides (veja docs/apresentacao/README.md).
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const path = (p) => new URL(p, root);
const data = JSON.parse(readFileSync(path('integrantes.json'), 'utf8'));
const members = data.members ?? [];

/** Lê mantendo CRLF/LF do arquivo original. */
function readText(p) {
  const raw = readFileSync(path(p), 'utf8');
  return { text: raw.replace(/\r\n/g, '\n'), crlf: raw.includes('\r\n') };
}
function writeText(p, text, crlf) {
  writeFileSync(path(p), crlf ? text.replace(/\n/g, '\r\n') : text);
}

const jsString = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const mdCell = (s) => String(s).replace(/\|/g, '\\|');

// ------------------------------------------------------------------ jogo
{
  const file = 'src/story/team.js';
  const { text, crlf } = readText(file);
  const list = members
    .map((m) => `    Object.freeze({ name: ${jsString(m.name)}, ra: ${jsString(m.ra)}, role: ${jsString(m.role ?? '')} }),`)
    .join('\n');
  const block = `// integrantes:inicio (gerado por scripts/integrantes.mjs, não edite à mão)
export const TEAM = Object.freeze({
  group: ${jsString(data.group)},
  members: Object.freeze([
${list}
  ]),
});
// integrantes:fim`;
  const next = text.replace(/\/\/ integrantes:inicio[\s\S]*?\/\/ integrantes:fim/, block);
  writeText(file, next, crlf);
}

// ------------------------------------------------------------- documentos
function headerBlock(english) {
  const names = members.map((m) => `${m.name} (RA ${m.ra})`).join(' · ');
  const lines = english
    ? [
      `> **Group:** ${data.group} · **Course:** ${data.course} · **Professor:** ${data.professor}`,
      '>',
      `> **Members:** ${names}`,
    ]
    : [
      `> **Grupo:** ${data.group} · **Disciplina:** ${data.course} · **Professor:** ${data.professor}`,
      '>',
      `> **Integrantes:** ${names}`,
    ];
  return ['<!-- integrantes:inicio (gerado por npm run integrantes; edite integrantes.json) -->', ...lines, '<!-- integrantes:fim -->'].join('\n');
}

function tableBlock(english) {
  const head = english ? '| Member | RA | What they did |\n|---|---|---|' : '| Integrante | RA | O que fez |\n|---|---|---|';
  const rows = members.map((m) => `| ${mdCell(m.name)} | ${mdCell(m.ra)} | ${mdCell(m.role ?? '')} |`);
  return ['<!-- integrantes-tabela:inicio (gerado por npm run integrantes) -->', head, ...rows, '<!-- integrantes-tabela:fim -->'].join('\n');
}

const docs = [
  'README.md', 'README.en.md', 'CHANGELOG.md',
  ...readdirSync(path('docs/')).filter((f) => f.endsWith('.md')).map((f) => `docs/${f}`),
  ...(existsSync(path('docs/apresentacao/')) ? readdirSync(path('docs/apresentacao/')).filter((f) => f.endsWith('.md')).map((f) => `docs/apresentacao/${f}`) : []),
];

for (const file of docs) {
  const { text, crlf } = readText(file);
  const english = file.endsWith('.en.md');
  let next = text;
  const header = headerBlock(english);
  if (/<!-- integrantes:inicio[\s\S]*?<!-- integrantes:fim -->/.test(next)) {
    next = next.replace(/<!-- integrantes:inicio[\s\S]*?<!-- integrantes:fim -->/, header);
  } else {
    // Primeiro título "# ": o bloco entra logo abaixo dele.
    next = next.replace(/^(# .*\n)/m, `$1\n${header}\n`);
  }
  next = next.replace(/<!-- integrantes-tabela:inicio[\s\S]*?<!-- integrantes-tabela:fim -->/g, tableBlock(english));
  if (next !== text) writeText(file, next, crlf);
}

console.log(`Integrantes atualizados: ${members.length} pessoa(s) em src/story/team.js e ${docs.length} documentos.`);
