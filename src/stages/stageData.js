/**
 * Fases de ondas (Setores) — preparatórias e obrigatórias antes dos mini-chefes.
 * Não dão buffs; dão bônus de pontuação. São o "tutorial jogável": ensinam
 * a ler mergulhos, a priorizar alvos e apresentam o alienígena laranja.
 *
 * Grupo: { type, count, path: 'swoop'|'side', dir: 1 (esquerda) | -1 (direita), delay }
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

export const STAGES = Object.freeze({ stage1: STAGE_1, stage2: STAGE_2 });
