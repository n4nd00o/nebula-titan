/**
 * Fases de ondas (Setores) — dois por mundo, obrigatórios antes dos mini-chefes.
 * Não dão buffs; dão bônus de pontuação. Cada mundo apresenta um alienígena novo:
 *   Mundo 1: verde e laranja · Mundo 2: azul (blindado)
 *   Mundo 3: roxo (divisor)  · Mundo 4: vermelho (kamikaze)
 *
 * Grupo: { type, count, path: 'swoop'|'side'|'dive', dir: 1 (esquerda) | -1 (direita), delay }
 * Limites por onda: 8 inimigos "top" (laranja/azul) e 24 "bottom" (verde/roxo/vermelho).
 */
export const STAGE_1 = Object.freeze({
  id: 'stage1',
  kind: 'waves',
  name: 'SETOR 1',
  intro: { title: 'SETOR 1', subtitle: 'VANGUARDA ALIENÍGENA' },
  description: 'Ondas de alienígenas verdes. Aprenda a ler os mergulhos.',
  phaseClearText: 'PRÓXIMA ONDA SE APROXIMANDO...',
  parTime: 90,
  music: 'stage',
  waves: [
    {
      title: 'PRIMEIRO CONTATO',
      hint: 'Abater em mergulho vale o dobro!',
      diveEvery: 2.2,
      shootEvery: 2.6,
      maxDivers: 2,
      groups: [
        { type: 'green', count: 8, path: 'swoop', dir: 1, delay: 0 },
        { type: 'green', count: 8, path: 'swoop', dir: -1, delay: 2.2 },
      ],
    },
    {
      title: 'CERCO',
      hint: 'Eles voltam para a formação se errarem.',
      diveEvery: 1.7,
      shootEvery: 2.2,
      maxDivers: 3,
      groups: [
        { type: 'green', count: 8, path: 'side', dir: 1, delay: 0 },
        { type: 'green', count: 8, path: 'side', dir: -1, delay: 1.4 },
        { type: 'green', count: 8, path: 'swoop', dir: 1, delay: 3 },
      ],
    },
    {
      title: 'REFORÇOS LARANJA',
      hint: 'Laranjas aguentam 3 tiros e atiram em leque!',
      diveEvery: 1.5,
      shootEvery: 2,
      maxDivers: 3,
      groups: [
        { type: 'orange', count: 4, path: 'swoop', dir: -1, delay: 0 },
        { type: 'green', count: 8, path: 'side', dir: 1, delay: 1.2 },
        { type: 'green', count: 8, path: 'side', dir: -1, delay: 2.6 },
      ],
    },
  ],
});

export const STAGE_2 = Object.freeze({
  id: 'stage2',
  kind: 'waves',
  name: 'SETOR 2',
  intro: { title: 'SETOR 2', subtitle: 'LINHA DE FRENTE' },
  description: 'Formações mistas e mergulhos em grupo.',
  phaseClearText: 'PRÓXIMA ONDA SE APROXIMANDO...',
  parTime: 110,
  music: 'stage',
  waves: [
    {
      title: 'ESQUADRÃO MISTO',
      hint: 'Laranjas mergulham puxando escoltas!',
      diveEvery: 1.5,
      shootEvery: 1.9,
      maxDivers: 3,
      groups: [
        { type: 'orange', count: 8, path: 'swoop', dir: 1, delay: 0 },
        { type: 'green', count: 8, path: 'swoop', dir: -1, delay: 2 },
      ],
    },
    {
      title: 'MURALHA',
      hint: 'Priorize os laranjas.',
      diveEvery: 1.3,
      shootEvery: 1.6,
      maxDivers: 4,
      groups: [
        { type: 'green', count: 8, path: 'side', dir: 1, delay: 0 },
        { type: 'green', count: 8, path: 'side', dir: -1, delay: 1.3 },
        { type: 'orange', count: 8, path: 'swoop', dir: 1, delay: 2.8 },
      ],
    },
    {
      title: 'ASSALTO TOTAL',
      hint: 'Sobreviva à investida final!',
      diveEvery: 1.05,
      shootEvery: 1.3,
      maxDivers: 5,
      groups: [
        { type: 'orange', count: 8, path: 'swoop', dir: -1, delay: 0 },
        { type: 'green', count: 8, path: 'side', dir: 1, delay: 1.6 },
        { type: 'green', count: 8, path: 'side', dir: -1, delay: 3 },
        { type: 'green', count: 8, path: 'swoop', dir: 1, delay: 4.4 },
      ],
    },
  ],
});

// ============================================================== MUNDO 2
export const STAGE_3 = Object.freeze({
  id: 'stage3',
  kind: 'waves',
  name: 'SETOR 3',
  intro: { title: 'SETOR 3', subtitle: 'CAMPO DE GELO' },
  description: 'Os azuis blindados entram em cena.',
  phaseClearText: 'PRÓXIMA ONDA SE APROXIMANDO...',
  parTime: 110,
  music: 'ice',
  waves: [
    {
      title: 'GELO FINO',
      hint: 'Azuis aguentam 7 tiros e soltam cristais que se partem!',
      diveEvery: 1.6, shootEvery: 1.9, maxDivers: 3,
      groups: [
        { type: 'blue', count: 2, path: 'dive', dir: 1, delay: 0 },
        { type: 'green', count: 8, path: 'swoop', dir: 1, delay: 1 },
        { type: 'green', count: 8, path: 'swoop', dir: -1, delay: 2.6 },
      ],
    },
    {
      title: 'AVALANCHE',
      hint: 'Laranjas e azuis lado a lado.',
      diveEvery: 1.4, shootEvery: 1.7, maxDivers: 4,
      groups: [
        { type: 'orange', count: 4, path: 'swoop', dir: -1, delay: 0 },
        { type: 'blue', count: 2, path: 'dive', dir: -1, delay: 1.2 },
        { type: 'green', count: 8, path: 'side', dir: 1, delay: 2 },
        { type: 'green', count: 8, path: 'side', dir: -1, delay: 3.2 },
      ],
    },
    {
      title: 'NEVASCA',
      hint: 'Muitos cristais na tela: leia os padrões!',
      diveEvery: 1.2, shootEvery: 1.4, maxDivers: 4,
      groups: [
        { type: 'blue', count: 4, path: 'dive', dir: 1, delay: 0 },
        { type: 'orange', count: 4, path: 'swoop', dir: 1, delay: 1.4 },
        { type: 'green', count: 8, path: 'swoop', dir: -1, delay: 2.4 },
        { type: 'green', count: 8, path: 'side', dir: 1, delay: 3.6 },
      ],
    },
  ],
});

export const STAGE_4 = Object.freeze({
  id: 'stage4',
  kind: 'waves',
  name: 'SETOR 4',
  intro: { title: 'SETOR 4', subtitle: 'ANEL DE ASTEROIDES' },
  description: 'Formações cheias e mergulhos em grupo.',
  phaseClearText: 'PRÓXIMA ONDA SE APROXIMANDO...',
  parTime: 120,
  music: 'ice',
  waves: [
    {
      title: 'ESTILHAÇOS',
      hint: 'Elimine os azuis antes que mergulhem.',
      diveEvery: 1.3, shootEvery: 1.6, maxDivers: 4,
      groups: [
        { type: 'blue', count: 4, path: 'swoop', dir: 1, delay: 0 },
        { type: 'green', count: 8, path: 'dive', dir: -1, delay: 1.2 },
        { type: 'green', count: 8, path: 'side', dir: 1, delay: 2.6 },
      ],
    },
    {
      title: 'GEADA',
      hint: 'Laranjas puxam escoltas!',
      diveEvery: 1.15, shootEvery: 1.4, maxDivers: 5,
      groups: [
        { type: 'orange', count: 6, path: 'swoop', dir: -1, delay: 0 },
        { type: 'blue', count: 2, path: 'dive', dir: 1, delay: 1 },
        { type: 'green', count: 8, path: 'side', dir: -1, delay: 2 },
        { type: 'green', count: 8, path: 'side', dir: 1, delay: 3.2 },
      ],
    },
    {
      title: 'ZERO ABSOLUTO',
      hint: 'Formação completa. Sobreviva!',
      diveEvery: 1, shootEvery: 1.2, maxDivers: 5,
      groups: [
        { type: 'blue', count: 4, path: 'dive', dir: -1, delay: 0 },
        { type: 'orange', count: 4, path: 'swoop', dir: 1, delay: 1.2 },
        { type: 'green', count: 8, path: 'swoop', dir: -1, delay: 2.2 },
        { type: 'green', count: 8, path: 'side', dir: 1, delay: 3.4 },
        { type: 'green', count: 8, path: 'side', dir: -1, delay: 4.6 },
      ],
    },
  ],
});

// ============================================================== MUNDO 3
export const STAGE_5 = Object.freeze({
  id: 'stage5',
  kind: 'waves',
  name: 'SETOR 5',
  intro: { title: 'SETOR 5', subtitle: 'LINHA DE MONTAGEM' },
  description: 'Os roxos se dividem ao serem destruídos.',
  phaseClearText: 'PRÓXIMA ONDA SE APROXIMANDO...',
  parTime: 120,
  music: 'forge',
  waves: [
    {
      title: 'PRODUÇÃO EM SÉRIE',
      hint: 'Roxos se partem em dois drones verdes!',
      diveEvery: 1.4, shootEvery: 1.7, maxDivers: 4,
      groups: [
        { type: 'purple', count: 8, path: 'swoop', dir: 1, delay: 0 },
        { type: 'green', count: 8, path: 'swoop', dir: -1, delay: 2 },
      ],
    },
    {
      title: 'CALDEIRA',
      hint: 'Abata os roxos longe de você.',
      diveEvery: 1.2, shootEvery: 1.5, maxDivers: 4,
      groups: [
        { type: 'orange', count: 4, path: 'dive', dir: 1, delay: 0 },
        { type: 'purple', count: 8, path: 'side', dir: -1, delay: 1.2 },
        { type: 'green', count: 8, path: 'side', dir: 1, delay: 2.6 },
      ],
    },
    {
      title: 'METAL FUNDIDO',
      hint: 'Todos os tipos juntos!',
      diveEvery: 1.05, shootEvery: 1.3, maxDivers: 5,
      groups: [
        { type: 'blue', count: 4, path: 'swoop', dir: -1, delay: 0 },
        { type: 'orange', count: 4, path: 'swoop', dir: 1, delay: 1.2 },
        { type: 'purple', count: 8, path: 'dive', dir: 1, delay: 2.2 },
        { type: 'green', count: 8, path: 'side', dir: -1, delay: 3.4 },
      ],
    },
  ],
});

export const STAGE_6 = Object.freeze({
  id: 'stage6',
  kind: 'waves',
  name: 'SETOR 6',
  intro: { title: 'SETOR 6', subtitle: 'ALTO-FORNO' },
  description: 'Pressão constante. Prioridade é tudo.',
  phaseClearText: 'PRÓXIMA ONDA SE APROXIMANDO...',
  parTime: 130,
  music: 'forge',
  waves: [
    {
      title: 'FAÍSCAS',
      hint: 'Mergulhos em sequência!',
      diveEvery: 1.1, shootEvery: 1.4, maxDivers: 5,
      groups: [
        { type: 'purple', count: 8, path: 'dive', dir: -1, delay: 0 },
        { type: 'purple', count: 8, path: 'swoop', dir: 1, delay: 1.6 },
        { type: 'orange', count: 4, path: 'swoop', dir: -1, delay: 3 },
      ],
    },
    {
      title: 'FUNDIÇÃO',
      hint: 'Blindados na frente, divisores atrás.',
      diveEvery: 1, shootEvery: 1.25, maxDivers: 5,
      groups: [
        { type: 'blue', count: 6, path: 'dive', dir: 1, delay: 0 },
        { type: 'purple', count: 8, path: 'side', dir: 1, delay: 1.4 },
        { type: 'green', count: 8, path: 'side', dir: -1, delay: 2.6 },
      ],
    },
    {
      title: 'FORJA VIVA',
      hint: 'Formação completa!',
      diveEvery: 0.9, shootEvery: 1.1, maxDivers: 6,
      groups: [
        { type: 'orange', count: 4, path: 'swoop', dir: 1, delay: 0 },
        { type: 'blue', count: 4, path: 'dive', dir: -1, delay: 1 },
        { type: 'purple', count: 8, path: 'swoop', dir: -1, delay: 2 },
        { type: 'purple', count: 8, path: 'side', dir: 1, delay: 3.2 },
        { type: 'green', count: 8, path: 'side', dir: -1, delay: 4.4 },
      ],
    },
  ],
});

// ============================================================== MUNDO 4
export const STAGE_7 = Object.freeze({
  id: 'stage7',
  kind: 'waves',
  name: 'SETOR 7',
  intro: { title: 'SETOR 7', subtitle: 'HORIZONTE DE EVENTOS' },
  description: 'Os vermelhos mergulham como mísseis.',
  phaseClearText: 'PRÓXIMA ONDA SE APROXIMANDO...',
  parTime: 130,
  music: 'void',
  waves: [
    {
      title: 'SINAL VERMELHO',
      hint: 'Vermelhos não atiram, mas perseguem você!',
      diveEvery: 1.2, shootEvery: 1.6, maxDivers: 4,
      groups: [
        { type: 'red', count: 8, path: 'swoop', dir: 1, delay: 0 },
        { type: 'green', count: 8, path: 'swoop', dir: -1, delay: 2 },
      ],
    },
    {
      title: 'ENXAME ESCURO',
      hint: 'Desvie dos kamikazes e atire nos roxos.',
      diveEvery: 1.05, shootEvery: 1.4, maxDivers: 5,
      groups: [
        { type: 'orange', count: 4, path: 'dive', dir: -1, delay: 0 },
        { type: 'red', count: 8, path: 'side', dir: 1, delay: 1.2 },
        { type: 'purple', count: 8, path: 'side', dir: -1, delay: 2.6 },
      ],
    },
    {
      title: 'ECLIPSE',
      hint: 'Todos os tipos. Mantenha a calma.',
      diveEvery: 0.95, shootEvery: 1.2, maxDivers: 5,
      groups: [
        { type: 'blue', count: 4, path: 'swoop', dir: 1, delay: 0 },
        { type: 'orange', count: 4, path: 'swoop', dir: -1, delay: 1.2 },
        { type: 'red', count: 8, path: 'dive', dir: -1, delay: 2.2 },
        { type: 'purple', count: 8, path: 'side', dir: 1, delay: 3.4 },
      ],
    },
  ],
});

export const STAGE_8 = Object.freeze({
  id: 'stage8',
  kind: 'waves',
  name: 'SETOR 8',
  intro: { title: 'SETOR 8', subtitle: 'PORTÕES DO ABISMO' },
  description: 'A última linha de defesa antes do Arconte.',
  phaseClearText: 'PRÓXIMA ONDA SE APROXIMANDO...',
  parTime: 140,
  music: 'void',
  waves: [
    {
      title: 'VANGUARDA SOMBRIA',
      hint: 'Kamikazes em massa!',
      diveEvery: 0.95, shootEvery: 1.3, maxDivers: 5,
      groups: [
        { type: 'red', count: 8, path: 'dive', dir: 1, delay: 0 },
        { type: 'red', count: 8, path: 'swoop', dir: -1, delay: 1.6 },
        { type: 'orange', count: 4, path: 'swoop', dir: 1, delay: 3 },
      ],
    },
    {
      title: 'MURALHA NEGRA',
      hint: 'Blindados protegem a formação.',
      diveEvery: 0.9, shootEvery: 1.15, maxDivers: 6,
      groups: [
        { type: 'blue', count: 8, path: 'dive', dir: -1, delay: 0 },
        { type: 'purple', count: 8, path: 'side', dir: 1, delay: 1.6 },
        { type: 'red', count: 8, path: 'side', dir: -1, delay: 3 },
      ],
    },
    {
      title: 'ÚLTIMA ONDA',
      hint: 'Tudo o que eles têm. Sobreviva!',
      diveEvery: 0.8, shootEvery: 1, maxDivers: 6,
      groups: [
        { type: 'orange', count: 4, path: 'swoop', dir: 1, delay: 0 },
        { type: 'blue', count: 4, path: 'dive', dir: -1, delay: 1 },
        { type: 'red', count: 8, path: 'swoop', dir: -1, delay: 2 },
        { type: 'purple', count: 8, path: 'side', dir: 1, delay: 3.2 },
        { type: 'green', count: 8, path: 'side', dir: -1, delay: 4.4 },
      ],
    },
  ],
});

export const STAGES = Object.freeze({
  stage1: STAGE_1, stage2: STAGE_2,
  stage3: STAGE_3, stage4: STAGE_4,
  stage5: STAGE_5, stage6: STAGE_6,
  stage7: STAGE_7, stage8: STAGE_8,
});
