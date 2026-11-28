/**
 * Gera os slides da apresentação da A3 (5 slides) em
 * docs/apresentacao/Nebula-Titan-Apresentacao.pptx.
 *
 * Uso (na raiz do projeto):
 *   npm install --no-save pptxgenjs     (só na primeira vez; não vira dependência do jogo)
 *   npm run slides
 *
 * Os nomes do grupo vêm de integrantes.json: depois de preencher, rode
 * `npm run integrantes` e `npm run slides` de novo.
 */
const path = require('path');
const fs = require('fs');
const PptxGenJS = require('pptxgenjs');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(__dirname, 'Nebula-Titan-Apresentacao.pptx');
const IMG = (name) => path.join(ROOT, 'docs', 'images', name);
const team = JSON.parse(fs.readFileSync(path.join(ROOT, 'integrantes.json'), 'utf8'));
const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

// Paleta do próprio jogo (Sweetie 16).
const C = {
  bg: '1A1C2C', panel: '262B44', line: '333C57', text: 'F4F4F4', muted: '94B0C2',
  pink: 'E43B8C', gold: 'FFCD75', cyan: '73EFF7', green: 'A7F070', orange: 'EF7D57',
};
const HEAD = 'Courier New';
const BODY = 'Calibri';

const pres = new PptxGenJS();
pres.layout = 'LAYOUT_16x9'; // 10 x 5.625 pol.
pres.title = 'Nebula Titan: apresentação A3';
pres.author = team.members.map((m) => m.name).join(', ');
pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };

pres.defineSlideMaster({
  title: 'NT_CONTEUDO',
  background: { color: C.bg },
  objects: [
    { text: { text: `NEBULA TITAN · ${team.group}`, options: { x: 0.5, y: 5.2, w: 6, h: 0.3, fontFace: HEAD, fontSize: 9, color: C.muted, margin: 0 } } },
  ],
  slideNumber: { x: 9.1, y: 5.2, w: 0.4, h: 0.3, fontFace: HEAD, fontSize: 9, color: C.muted, align: 'right' },
});

/** Título padrão dos slides de conteúdo (mesma posição em todos). */
function title(slide, text, kicker, color = C.gold) {
  slide.addText(kicker, { x: 0.5, y: 0.3, w: 9, h: 0.3, fontFace: HEAD, fontSize: 11, bold: true, color: C.pink, margin: 0, isTextBox: true });
  slide.addText(text, { x: 0.5, y: 0.6, w: 9, h: 0.6, fontFace: HEAD, fontSize: 28, bold: true, color, margin: 0, isTextBox: true });
}

/** Cartão com título e texto. */
function card(slide, { x, y, w, h, head, body, color }) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: C.panel }, line: { color: C.line, width: 1 } });
  slide.addText(head, { x: x + 0.18, y: y + 0.14, w: w - 0.36, h: 0.34, fontFace: HEAD, fontSize: 14, bold: true, color, margin: 0, isTextBox: true });
  slide.addText(body, { x: x + 0.18, y: y + 0.5, w: w - 0.36, h: h - 0.62, fontFace: BODY, fontSize: 13, color: C.text, margin: 0, valign: 'top', isTextBox: true });
}

/** Captura de tela do jogo com moldura. */
function shot(slide, file, x, y, h, label) {
  const w = h * 0.75; // capturas 480 x 640
  slide.addShape(pres.shapes.RECTANGLE, { x: x - 0.05, y: y - 0.05, w: w + 0.1, h: h + 0.1, fill: { color: C.line }, line: { color: C.pink, width: 1.5 } });
  slide.addImage({ path: IMG(file), x, y, w, h, altText: label });
  if (label) slide.addText(label, { x: x - 0.3, y: y + h + 0.08, w: w + 0.6, h: 0.25, fontFace: BODY, fontSize: 10, italic: true, color: C.muted, align: 'center', margin: 0, isTextBox: true });
}

/** QR code que abre o jogo online, com a legenda ao lado (side) ou embaixo. */
const GAME_URL = 'nebula-titan.vercel.app';
function qr(slide, x, y, size, side) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.06, y: y - 0.06, w: size + 0.12, h: size + 0.12, rectRadius: 0.06, fill: { color: 'FFFFFF' }, line: { color: C.cyan, width: 1.5 } });
  slide.addImage({ path: IMG('qr-jogo.png'), x, y, w: size, h: size, altText: `QR code que abre o jogo em ${GAME_URL}` });
  const caption = [
    { text: 'JOGUE AGORA', options: { fontFace: HEAD, fontSize: 12, bold: true, color: C.cyan, breakLine: true } },
    { text: 'Aponte a câmera do celular', options: { fontSize: 10, color: C.text, breakLine: true } },
    { text: GAME_URL, options: { fontSize: 9, color: C.muted } },
  ];
  const box = side
    ? { x: x + size + 0.2, y, w: 1.6, h: size, valign: 'middle' }
    : { x: x - 0.25, y: y + size + 0.14, w: size + 0.5, h: 0.75, valign: 'top', align: 'center' };
  slide.addText(caption, { ...box, fontFace: BODY, margin: 0, isTextBox: true });
}

// ---------------------------------------------------------------- 1. Capa
{
  const s = pres.addSlide({ masterName: 'NT_CONTEUDO' });
  s.addText('A3 · DESENVOLVIMENTO DE UM JOGO', { x: 0.5, y: 0.45, w: 6, h: 0.3, fontFace: HEAD, fontSize: 11, bold: true, color: C.pink, margin: 0, isTextBox: true });
  s.addText([
    { text: 'NEBULA', options: { color: C.pink, breakLine: true } },
    { text: 'TITAN', options: { color: C.gold } },
  ], { x: 0.5, y: 0.8, w: 6, h: 1.5, fontFace: HEAD, fontSize: 50, bold: true, margin: 0, isTextBox: true });
  s.addText('Shoot \'em up retrô com chefes de partes destrutíveis: cada parte arrancada muda a luta.', {
    x: 0.5, y: 2.35, w: 5.8, h: 0.6, fontFace: BODY, fontSize: 15, color: C.text, margin: 0, isTextBox: true,
  });
  const people = team.members.map((m, i) => ({
    text: `${m.name} · RA ${m.ra}`,
    options: { bullet: true, breakLine: i < team.members.length - 1 },
  }));
  s.addText(team.group.toUpperCase(), { x: 0.5, y: 3.1, w: 5.8, h: 0.3, fontFace: HEAD, fontSize: 12, bold: true, color: C.cyan, margin: 0, isTextBox: true });
  s.addText(people, { x: 0.5, y: 3.42, w: 5.8, h: 1.1, fontFace: BODY, fontSize: 13, color: C.text, margin: 0, valign: 'top', paraSpaceAfter: 2, isTextBox: true });
  s.addText(`${team.course} · Prof. ${team.professor}`, { x: 0.5, y: 4.65, w: 5.8, h: 0.3, fontFace: BODY, fontSize: 11, color: C.muted, margin: 0, isTextBox: true });
  shot(s, 'luta-tita.png', 7.0, 0.45, 3.2, null);
  qr(s, 6.65, 3.9, 0.95, true);
  s.addNotes("Boa noite, professor. Somos o Grupo 19, formado pelo Luiz, pelo Luccas e pelo Nathan. O nosso jogo é o Nebula Titan, um jogo de nave no estilo arcade em que os chefes são montados por partes. Cada parte que você destrói muda a aparência e os ataques do chefe.");
}

// ------------------------------------------------- 2. Linguagem e tecnologia
{
  const s = pres.addSlide({ masterName: 'NT_CONTEUDO' });
  title(s, 'JavaScript no navegador', '01 · LINGUAGEM');
  const stats = [
    ['0', 'bibliotecas', C.green],
    ['60', 'quadros/s', C.cyan],
    ['362', 'testes', C.gold],
  ];
  stats.forEach(([n, label, color], i) => {
    const x = 0.5 + i * 1.55;
    s.addText(n, { x, y: 1.45, w: 1.45, h: 0.75, fontFace: HEAD, fontSize: 40, bold: true, color, margin: 0, isTextBox: true });
    s.addText(label, { x, y: 2.2, w: 1.45, h: 0.3, fontFace: BODY, fontSize: 12, color: C.muted, margin: 0, isTextBox: true });
  });
  s.addText([
    { text: 'JavaScript + HTML5 Canvas + Web Audio', options: { bold: true, color: C.gold, breakLine: true } },
    { text: 'Por que não pygame: roda em qualquer navegador e no celular, sem instalar nada; o professor joga pelo link.', options: { bullet: true, breakLine: true } },
    { text: 'A disciplina inclui web e mobile: controles de toque, joystick e app instalável (PWA).', options: { bullet: true, breakLine: true } },
    { text: 'Mesmos conceitos das aulas: laço update + draw, cenas como estados, colisão por círculos.', options: { bullet: true } },
  ], { x: 0.5, y: 2.65, w: 4.7, h: 2.3, fontFace: BODY, fontSize: 14, color: C.text, margin: 0, valign: 'top', paraSpaceAfter: 4, isTextBox: true });
  card(s, {
    x: 5.5, y: 1.45, w: 4, h: 1.65, color: C.cyan, head: 'Arte e som por código',
    body: 'Pixel art desenhada a partir de matrizes e música sintetizada em tempo real. Nenhum arquivo de terceiros, então nenhum problema de licença.',
  });
  card(s, {
    x: 5.5, y: 3.3, w: 4, h: 1.65, color: C.green, head: 'Node.js só para rodar',
    body: 'npm start abre o servidor local; npm test roda os testes. O jogo em si não tem dependências.',
  });
  s.addNotes("Fizemos o jogo em JavaScript, com o Canvas para desenhar e a Web Audio para o som. Escolhemos JavaScript em vez de pygame porque ele roda direto no navegador: o jogo abre por um link, até no celular, sem instalar Python nem nada. E a disciplina também trata de web e mobile, então fazia sentido o jogo funcionar nos dois.\n\nOs conceitos são os mesmos das aulas: um laço que atualiza e desenha o jogo 60 vezes por segundo, cada tela é um estado, e a colisão é feita com círculos. A arte e as músicas são geradas pelo próprio código, porque assim não dependemos de arquivos de outras pessoas, que precisariam de licença e crédito. E o projeto tem 362 testes automáticos.");
}

// ------------------------------------------------ 3. Decisões técnicas, dificuldade e IA
{
  const s = pres.addSlide({ masterName: 'NT_CONTEUDO' });
  title(s, 'Decisões técnicas', '02 · POR DENTRO DO JOGO');
  const decisions = [
    ['Sem engine', 'Laço, colisão, desenho e áudio escritos por nós para entender o que as engines escondem.', C.gold],
    ['Chefes como dados', 'Um motor único lê a descrição de cada chefe. Com 24 chefes, corrigir o motor corrige todos.', C.cyan],
    ['PC e celular juntos', 'O mesmo código atende mouse, teclado e toque, e o jogo instala como app e roda offline.', C.green],
  ];
  decisions.forEach(([head, body, color], i) => {
    card(s, { x: 0.5 + i * 3.05, y: 1.45, w: 2.9, h: 1.75, head, body, color });
  });
  card(s, {
    x: 0.5, y: 3.4, w: 4.45, h: 1.6, color: C.orange, head: 'Dificuldade técnica',
    body: 'Um chefe ficava impossível de vencer: o corpo bloqueava os tiros. Criamos testes que jogam cada chefe sozinhos e provam que todos podem ser derrotados.',
  });
  card(s, {
    x: 5.05, y: 3.4, w: 4.45, h: 1.6, color: C.pink, head: 'Uso de IA (declarado)',
    body: 'Claude Code como assistente de código, testes, documentação e slides. Ideias e decisões do grupo; tudo revisado, testado e jogado por nós.',
  });
  s.addNotes("Agora, as decisões técnicas e o porquê de cada uma.\n\nPrimeiro, não usamos engine. O motivo é que a disciplina ensina os fundamentos, como o laço, a colisão e o desenho, e o enunciado pede que a lógica do jogo seja nossa. Numa engine isso já vem pronto; escrevendo à mão, a gente teve que entender cada parte. E o jogo fica leve: abre direto no navegador, sem instalar e sem precisar compilar.\n\nSegundo, os chefes são descritos como dados. No começo o código sabia detalhes de um chefe só. Quando o jogo chegou a 24 chefes, copiar esse código para cada um ia espalhar os mesmos erros por todo lado. Então fizemos um motor único que lê um arquivo com as partes, as fases e os ataques de cada chefe. Assim, um chefe novo é só um arquivo novo, e corrigir o motor corrige todos de uma vez.\n\nTerceiro, o mesmo código serve para o computador e o celular, porque o navegador trata mouse e toque do mesmo jeito; assim não precisamos de duas versões. E o jogo pode ser instalado como app e jogado sem internet.\n\nA maior dificuldade foi um chefe impossível de vencer: na fase 3 da Hidra Glacial, o corpo bloqueava todos os tiros. Com 24 chefes, não dava para jogar tudo de novo a cada mudança, então criamos testes que jogam cada chefe sozinhos e provam que todos podem ser derrotados.\n\nUsamos IA, o Claude Code, como assistente no código, nos testes, na documentação e nos slides. Declaramos no README porque o enunciado exige, e as ideias e decisões foram do grupo.\n\nPassagem: agora a parte de design e a história do jogo.");
}

// ------------------------------------------------------- 4. Ideias de design
{
  const s = pres.addSlide({ masterName: 'NT_CONTEUDO' });
  title(s, 'Do Galaga a chefes que se desmontam', '03 · DESIGN');
  const ideas = [
    ['Chefes modulares', 'Asas, canhões e escudos são partes com vida própria. Arrancar uma muda o visual e os ataques.', C.pink],
    ['5 mundos', 'Setores com alienígenas em formação, 3 mini-chefes à escolha e um chefe por mundo, até o Ômega.', C.gold],
    ['Buffs', 'Cada mini-chefe dá um poder (tiro triplo, dash, bomba...). Os chefes de mundo escalam com eles.', C.cyan],
    ['Celular', 'Joystick ou arrastar o dedo, tiro automático e uma ajuda que deixa o jogo justo no toque.', C.green],
  ];
  ideas.forEach(([head, body, color], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    card(s, { x: 0.5 + col * 3.15, y: 1.45 + row * 1.85, w: 3.0, h: 1.7, head, body, color });
  });
  shot(s, 'tela-inicial.png', 7.15, 1.4, 3.4, 'Tela inicial');
  s.addNotes("A aula começou com o Snake. A gente partiu do Galaga, mas mudou o foco para as lutas contra chefes: asas, canhões e escudos são partes separadas, e arrancar uma muda o visual e os ataques do chefe. Fizemos assim porque queríamos que o jogador visse o efeito de cada tiro, e que a ordem em que ele destrói as partes mudasse a luta.\n\nA campanha tem cinco mundos, com três mini-chefes que você enfrenta na ordem que quiser, para o jogador ter escolha. Cada mini-chefe dá um buff, como tiro triplo ou dash. E os chefes ficam mais fortes conforme os seus buffs, porque sem isso o jogador ficaria forte demais e o fim do jogo perderia a graça.\n\nTambém quisemos que o jogo fosse justo: a ideia é que, quando você morre, a culpa seja sua e não do jogo. Por isso os ataques são avisados antes e a área da nave que leva dano é pequena. No celular, o toque é menos preciso que o teclado, então lá os inimigos têm menos vida e os tiros são mais lentos.");
}

// ------------------------------------------------------------- 5. História
{
  const s = pres.addSlide({ masterName: 'NT_CONTEUDO' });
  title(s, 'A última piloto da Aliança', '04 · HISTÓRIA');
  const rows = [
    ['Premissa', 'Ano 2187. Vega foge na nave NT-01 para destruir o Ômega, no centro da galáxia.', C.gold],
    ['Conflito', 'A armada do Ômega, liderada pelo Titã, apagou as colônias e derrubou a frota.', C.pink],
    ['No jogo', 'Introdução, um texto entre cada mundo e fim de jogo com a frase da história.', C.cyan],
    ['Desfecho', 'Vitória: as colônias voltam a ter luz e aparecem os créditos. Derrota: "Sinal perdido".', C.green],
  ];
  rows.forEach(([head, body, color], i) => {
    const y = 1.45 + i * 0.9;
    s.addShape(pres.shapes.OVAL, { x: 0.5, y: y + 0.12, w: 0.42, h: 0.42, fill: { color } });
    s.addText(String(i + 1), { x: 0.5, y: y + 0.12, w: 0.42, h: 0.42, fontFace: HEAD, fontSize: 14, bold: true, color: C.bg, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    s.addText(head, { x: 1.1, y, w: 3.9, h: 0.3, fontFace: HEAD, fontSize: 14, bold: true, color, margin: 0, isTextBox: true });
    s.addText(body, { x: 1.1, y: y + 0.3, w: 3.9, h: 0.55, fontFace: BODY, fontSize: 12, color: C.text, margin: 0, valign: 'top', isTextBox: true });
  });
  // Vídeo da demonstração (gravado do jogo, 72 s, sem som): clique para tocar.
  const vh = 3.4;
  const vw = vh * 0.75;
  const vx = 5.3;
  const vy = 1.4;
  s.addShape(pres.shapes.RECTANGLE, { x: vx - 0.05, y: vy - 0.05, w: vw + 0.1, h: vh + 0.1, fill: { color: C.line }, line: { color: C.pink, width: 1.5 } });
  s.addMedia({
    type: 'video', path: path.join(__dirname, 'demonstracao.mp4'), x: vx, y: vy, w: vw, h: vh,
    cover: 'image/png;base64,' + fs.readFileSync(IMG('demonstracao-capa.png')).toString('base64'),
  });
  s.addText('Demonstração (clique para tocar)', { x: vx - 0.3, y: vy + vh + 0.08, w: vw + 0.6, h: 0.25, fontFace: BODY, fontSize: 10, italic: true, color: C.muted, align: 'center', margin: 0, isTextBox: true });
  qr(s, 8.25, 1.45, 1.1, false);
  s.addNotes("Agora a história. No ano 2187, a armada do Ômega, liderada pelo Titã, apagou as colônias. A Vega, última piloto da Aliança, foge na nave NT-01 para destruir o Ômega no centro da galáxia.\n\nA história conversa com o jogo: os buffs são os núcleos de energia que os chefes deixam, e os mundos são o caminho até o Ômega. Ela aparece dentro do jogo, na introdução, entre cada mundo e nos finais de vitória e de derrota, com uma música própria.\n\nDEMONSTRAÇÃO (1:30): Nova Campanha > introdução (ENTER, depois ESC) > 30 s do primeiro setor > P e I > Q > Duelo com o Titã. Roteiro completo em docs/apresentacao/README.md.\n\nFECHAMENTO: Na divisão de tarefas, o Luiz fez a programação, o game design e a documentação, e o Nathan e o Luccas cuidaram das músicas e do design das fases. Obrigado! Alguma pergunta?");
}

// Grava sem as entradas de pasta que o pptxgenjs coloca no ZIP (o OneDrive e
// o Google Drive às vezes recusam abrir arquivos com elas).
(async () => {
  const JSZip = require('jszip');
  const source = await JSZip.loadAsync(await pres.write({ outputType: 'nodebuffer' }));
  const clean = new JSZip();
  // Copia só os arquivos (zip.remove de uma pasta apagaria o conteúdo dela também).
  for (const [name, entry] of Object.entries(source.files)) {
    if (!entry.dir) clean.file(name, await entry.async('nodebuffer'), { createFolders: false });
  }
  fs.writeFileSync(OUT, await clean.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  console.log(`Slides gerados: ${path.relative(ROOT, OUT)}`);
})();
