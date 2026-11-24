/**
 * História de Nebula Titan (v1.7).
 *
 * Premissa: VEGA é a última piloto da Aliança das Colônias. A armada do
 * ÔMEGA, liderada pelo TITÃ, apagou as colônias; ela atravessa os cinco
 * mundos na nave NT-01 para destruir o Ômega na Singularidade.
 *
 * A história casa com as mecânicas:
 *  - cada chefe deixa um NÚCLEO DE ENERGIA = os buffs da campanha;
 *  - cada mundo vencido abre o caminho para o próximo = textos entre mundos;
 *  - vencer o Ômega = final de vitória; desistir após cair = final de derrota.
 *
 * Aqui só ficam os textos (dados puros, testáveis no Node). Quem mostra é a
 * StoryScene. Cada página: { title, text, art? } — `text` é quebrado em
 * linhas automaticamente (wrapText) e `\n` força uma linha nova.
 */
import { TEAM } from './team.js';

/** Introdução: aparece ao começar uma NOVA CAMPANHA (e no botão HISTÓRIA). */
export const INTRO = Object.freeze([
  {
    title: 'ANO 2187',
    art: 'colonies',
    text: 'A Aliança das Colônias vivia em paz na Nebulosa Carmim.\nAté que, numa noite sem aviso, as estrelas começaram a se apagar uma a uma.',
  },
  {
    title: 'A ARMADA DO ÔMEGA',
    art: 'titan',
    text: 'Das sombras veio o TITÃ, uma nave-fortaleza que devora estrelas, puxando uma armada de chefes biomecânicos.\nEm três dias, a frota da Aliança caiu e as colônias ficaram sem luz.',
  },
  {
    title: 'A ÚLTIMA PILOTO',
    art: 'player',
    text: 'Só uma nave escapou: a NT-01, pilotada por VEGA, a última piloto da Aliança.\nOs sinais da armada apontam para o centro da galáxia: a SINGULARIDADE, onde o ÔMEGA comanda tudo.',
  },
  {
    title: 'SUA MISSÃO',
    art: 'cores',
    text: 'Atravesse os cinco mundos, derrote cada chefe e destrua o ÔMEGA.\nCada chefe vencido deixa um NÚCLEO DE ENERGIA: instale-o na NT-01 (os BUFFS) para ficar mais forte.\nBoa sorte, Vega. A galáxia conta com você.',
  },
]);

/**
 * Textos entre mundos: INTERLUDES[n] aparece quando o jogador termina o
 * mundo n e vai para o mundo n + 1 (índices de WORLDS, base 0).
 */
export const INTERLUDES = Object.freeze({
  1: [{
    title: 'RUMO AO CINTURÃO GLACIAL',
    art: 'player',
    text: 'O TITÃ caiu, mas era só a vanguarda.\nNos destroços, Vega encontra um mapa: a armada recua para o CINTURÃO GLACIAL, onde a HIDRA congela as rotas de fuga das colônias.',
  }],
  2: [{
    title: 'RUMO À FORJA ESTELAR',
    art: 'player',
    text: 'As rotas de gelo se abrem e os primeiros refugiados escapam.\nEles contam que as naves inimigas nascem na FORJA ESTELAR, guardada pela fortaleza ÉGIDE. Apague a forja e a armada não terá reforços.',
  }],
  3: [{
    title: 'RUMO AO VAZIO ABISSAL',
    art: 'player',
    text: 'A forja esfria. No silêncio, um chamado vem do VAZIO ABISSAL.\nLá, o ARCONTE e o LEVIATÃ, a fortaleza estelar, protegem o portal para o centro da galáxia.',
  }],
  4: [{
    title: 'A SINGULARIDADE',
    art: 'omega',
    text: 'O Leviatã afunda no vazio e o portal se abre.\nDo outro lado espera o ÔMEGA, a mente que criou o Titã e toda a armada.\nEste é o último voo, Vega.',
  }],
});

/** Final de vitória: depois de derrotar o Ômega. A última página são os créditos. */
export const ENDING_VICTORY = Object.freeze([
  {
    title: 'O ÔMEGA SE DESFAZ EM LUZ',
    art: 'omega',
    text: 'Sem a mente que os comandava, os chefes que restavam se desligam por toda a galáxia.',
  },
  {
    title: 'AS LUZES VOLTAM',
    art: 'colonies',
    text: 'Nas colônias, as estrelas voltam a brilhar uma a uma.\nA NT-01 volta para casa, coberta de cicatrizes.\nVEGA, a última piloto, agora é a primeira de uma nova Aliança.\n\nFIM',
  },
  creditsPage(),
]);

/** Final de derrota: o jogador cai e escolhe desistir em vez de continuar. */
export const ENDING_DEFEAT = Object.freeze([
  {
    title: 'SINAL PERDIDO',
    art: 'wreck',
    text: 'A NT-01 some dos radares.\nSem a última piloto, a armada do Ômega avança sobre as colônias e a galáxia escurece de vez.',
  },
  {
    title: 'FIM?',
    art: 'cores',
    text: 'Mas os núcleos de energia que Vega conquistou continuam salvos.\nEm CONTINUAR, ela pode voar de novo.',
  },
]);

/** Página de créditos com o grupo e os integrantes. */
export function creditsPage(team = TEAM) {
  const lines = team.members.map((m) => `${m.name} · RA ${m.ra}`);
  return {
    title: 'CRÉDITOS',
    art: 'player',
    text: [`NEBULA TITAN · ${team.group}`, '', ...lines, '', 'Obrigado por jogar!'].join('\n'),
  };
}

/**
 * Quebra um texto em linhas de no máximo `maxChars` caracteres, respeitando
 * as palavras. A fonte do jogo é monoespaçada, então contar letras basta.
 * `\n` força uma quebra; uma linha vazia vira um espaço entre parágrafos.
 */
export function wrapText(text, maxChars) {
  const out = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ').filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > maxChars && line) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    out.push(line);
  }
  return out;
}
