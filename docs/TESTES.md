# 🧪 Testes: Nebula Titan

> Os testes também são **documentação do projeto**: cada um descreve uma regra do jogo em português e prova que ela continua valendo.
> Este documento lista o que cada arquivo garante, os bugs reais que viraram teste e como verificar o jogo.
> **Regra do projeto:** nenhum teste é apagado para "fazer passar". Um teste só muda se a regra do jogo mudar, e a mudança fica registrada no [CHANGELOG](../CHANGELOG.md).

---

## 1. Como rodar

```bash
npm test                                  # suíte inteira (node:test, sem dependências)
node --test tests/reachability.test.js    # um arquivo só
```

A integração contínua (GitHub Actions, [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) roda `npm test` a cada *push* e *pull request*.

## 2. Números da suíte

| Versão | Testes | O que entrou |
|---|---|---|
| 1.0 | 61 | Motor, chefe Nebula Titan, colisão, pontuação, sprites |
| 1.1-1.2 | 80 | Mini-chefes, campanha, setores, Leviatã |
| 1.3 | 172 | 4 mundos, 12 chefes novos, save, mecânicas novas |
| 1.4.0 | 256 | Garantia contra chefes imortais, hitboxes, mapa de progresso, celular, documentação |
| 1.4.1 | 257 | Janela de tiro mínima na garantia (pegou a Hidra) + regressão da Hidra |
| 1.5.0 | 333 | Mundo 5 (7 chefes novos entram nos testes genéricos e na garantia), buffs únicos, teclas configuráveis, escala por buffs, Leviatã com 10 fases |
| **1.6.0** | **346** | **Controles de celular: joystick, esquemas MODERNO/CLÁSSICO, botões maiores e ajuda do celular** |

## 3. Catálogo por arquivo

| Arquivo | Testes | O que garante |
|---|---|---|
| [`buffs.test.js`](../tests/buffs.test.js) | 8 | Buffs únicos do Mundo 5 com a **PlayScene real** e um jogo falso: Orbitais apagam projéteis, Tempo Bala desacelera no foco, Supercarga (8x, perfurante, a cada 5 s), Ascensão (+25%), Renascer (uma vez por luta), Vampirismo e Ricochete; a tela Meus Buffs cobre todos os buffs |
| [`touch.test.js`](../tests/touch.test.js) | 13 | **Celular (v1.6)**: botões grandes sem sobreposição, joystick (zona morta, limite, direção), `Input` nos esquemas MODERNO (1º dedo = joystick) e CLÁSSICO (2º dedo = dash), mouse nunca cria joystick, nave com foco pelo joystick e tiro automático, preferências salvas e a **ajuda do celular** na `PlayScene` real (vida dos chefes e alienígenas, velocidade dos tiros, hitbox) |
| [`controls.test.js`](../tests/controls.test.js) | 8 | **Teclas configuráveis**: todas as ações remapeáveis, conflito transfere a tecla sem deixar ação vazia, teclas reservadas, apagar alternativa, dados salvos inválidos, o `Input` real respondendo à nova tecla e salvando, ESC sempre pausa, textos de ajuda |
| [`boss.test.js`](../tests/boss.test.js) | 15 | Nebula Titan: entrada invulnerável, alvos de cada fase, inclinação ao perder asa, quebra antecipada, fase pulada, fluxo completo, ricochete × dano, **colisão por pixel** e 3 testes de regressão de hitbox |
| [`minibosses.test.js`](../tests/minibosses.test.js) | 101 | **Testes genéricos** para cada chefe registrado (definição válida, alvo atingível no centro, fluxo até a derrota, 20 s de luta sem quebrar) + mecânicas da Sentinela, Colmeia e Ceifador |
| [`reachability.test.js`](../tests/reachability.test.js) | 99 | **Garantia "nenhum chefe imortal"** e **hitboxes** (ver seção 4) |
| [`worlds.test.js`](../tests/worlds.test.js) | 19 | Mundos 2-4: projéteis que se dividem/fazem curva/aceleram, mísseis, Ala Dupla, alienígenas novos e a mecânica central de cada chefe novo (Hidra, Escaravelho, Vórtice, Gêmeos, Fornalha, Martelo, Égide, Espectro, Eco, Arconte) |
| [`campaign.test.js`](../tests/campaign.test.js) | 19 | **5 mundos**, os dois círculos do Mundo 5, chefes de mundo que **escalam com os buffs** (e mini-chefes que não), origem de cada buff, ordem obrigatória (setores → mini-chefes → chefe), buffs em qualquer ordem, bônus de mundo, Leviatã só após o Arconte, dificuldade crescente, seleção de mundo, **salvar/carregar** (e saves inválidos), vidas, *continue*, corrida perfeita |
| [`progress.test.js`](../tests/progress.test.js) | 11 | **Mapa de progresso**: status das fases e mundos, histórico que sobrevive ao fim da campanha, saves antigos, layout sem sobreposição. **Celular**: zonas de toque, botões da pausa, vibração (inclusive sem suporte) |
| [`stages.test.js`](../tests/stages.test.js) | 22 | Setores: ondas cabem na formação, vagas únicas, inimigos entram/formam/mergulham/atiram, cada mundo traz um alienígena novo, setores mais agressivos a cada mundo |
| [`leviathan.test.js`](../tests/leviathan.test.js) | 7 | Leviatã: **10 fases** (câmera por seção até o núcleo, depois fixa), raios giratórios dos pilares, núcleo que reacende, blindagem × perfurante, regeneração, sem dano por contato, paredes de laser |
| [`leviathanHull.test.js`](../tests/leviathanHull.test.js) | 1 | Regressão v1.2.1: o casco do Leviatã é recortado com **uma** operação `destination-in` (antes ficava invisível) |
| [`sprites.test.js`](../tests/sprites.test.js) | 5 | Integridade da arte: linhas com a mesma largura, cores da paleta, espelhamento e simetria, todo sprite usado existe |
| [`collision.test.js`](../tests/collision.test.js) | 4 | AABB, círculo × círculo, círculo × retângulo, distância ponto-segmento |
| [`scoring.test.js`](../tests/scoring.test.js) | 4 | Bônus, ranks S/A/B/C e casos de borda |
| [`math.test.js`](../tests/math.test.js) | 7 | Utilitários: clamp, lerp, rotação, ângulos, gerador pseudoaleatório |
| [`docs.test.js`](../tests/docs.test.js) | 3 | **A documentação acompanha o código**: todo arquivo de teste está neste catálogo, toda versão do CHANGELOG tem relatório de entrega e a versão do `package.json` está no CHANGELOG |

Utilitário compartilhado: [`helpers.js`](../tests/helpers.js) cria um **mundo falso** com `Proxy`, então o motor de chefes roda inteiro no Node.js, sem navegador.

## 4. Garantia "nenhum chefe imortal" (v1.4)

**Por que existe:** no teste de jogo da v1.3, o **Vórtice** não morria. O anel do casco envolvia o ponto fraco (o Olho do Furacão), e todo tiro vindo de baixo ricocheteava no anel. O teste genérico antigo passava porque testava um tiro **parado no centro** da peça, sem o caminho que o tiro faz até ela.

**Como funciona** (`playByShooting` em `reachability.test.js`):
1. Cria o chefe com o mundo falso e espera o combate começar.
2. A cada 0,1 s de luta, varre a tela inteira com **tiros retos que sobem do fundo**, usando o mesmo `hitTestPath` da cena de jogo.
3. Só causa dano quando o tiro chega a um ponto fraco **sem bater em outra peça antes**, e só se houver uma **janela de tiro** de pelo menos **12 px** (colunas vizinhas, testadas a cada 2 px, que chegam ao mesmo alvo). Uma fresta menor não conta: na prática ninguém consegue mirar nela com o chefe se movendo.
4. Se uma fase passa de **120 s** sem terminar, o teste falha e diz qual alvo nunca foi alcançado.

Ele vale **automaticamente** para todo chefe registrado em `src/boss/bosses/index.js`. Na primeira execução, encontrou também o **Oráculo**, com o mesmo defeito, antes de qualquer jogador.

**Lição da v1.4.1:** a primeira versão aceitava uma única coluna de acerto. A **Hidra Glacial** passou assim, por uma fresta de 3 px na borda de uma escama, mas no jogo real as escamas de cima eram impossíveis de destruir (o corpo bloqueava o resto). A regra da janela mínima fecha essa brecha, e `openWindows(boss)` (exportada pelo teste) mede a janela de cada alvo.

**Hitboxes** (mesmo arquivo):
- máscara de colisão = sprite (linhas retangulares, pixels visíveis, caixa dos marcadores do tamanho do sprite);
- **nenhum acerto fantasma**: tiros em 16 direções logo fora do desenho não acertam nada;
- **alienígenas**: o raio de colisão fica entre a meia altura e a meia largura do sprite (antes era menor, e tiros nas asas atravessavam).

## 5. Bugs reais que viraram teste

| Versão | Bug | Teste que impede a volta |
|---|---|---|
| 1.0 | Tiros atravessavam partes finas das asas e do núcleo | `boss.test.js` (regressões de largura visível) |
| 1.2.1 | Casco do Leviatã invisível (`destination-in` apagava o canvas) | `leviathanHull.test.js` |
| 1.3 | Fornalha: chaminés acima do casco, inalcançáveis por baixo | `reachability.test.js` (cobre o caso geral) |
| 1.3 | Escaravelho: carapaça começava fechada sobre o núcleo | `minibosses.test.js` (alvo atingível) |
| 1.3 | Projétil que se divide gerava 60 filhos em vez de 6 | `worlds.test.js` |
| 1.4 | **Vórtice imortal** na fase 2 (anel envolvendo o Olho) | `reachability.test.js` |
| 1.4 | **Oráculo imortal** na fase 2 (mandala envolvendo o Olho) | `reachability.test.js` |
| 1.4 | Hitbox dos alienígenas menor que o sprite | `reachability.test.js` (raio × sprite) |
| 1.5.0 | Véu do Ômega intangível justamente no início da fase (o ciclo usava o relógio global do chefe) | `minibosses.test.js` (alvo atingível no início da fase) |
| 1.4.1 | **Hidra imortal** na fase 3: o corpo bloqueava as escamas de cima depois que as de baixo caíam (o teste antigo aceitava uma fresta de 3 px) | `reachability.test.js` (janela mínima + regressão da Hidra) |

## 6. Verificação além dos testes automatizados

- **Visual:** capturas de tela no Edge headless com uma página de prévia temporária que avança a simulação (`game.update(1/60)` em laço). Foi assim que se achou a sobreposição de textos no mapa da galáxia (v1.4) e o casco invisível do Leviatã (v1.2.1).
- **Simulação da campanha:** os 25 encontros jogados em sequência com todos os buffs, até a vitória e a troca de mundo (v1.3).
- **Limite conhecido:** o Edge headless não abre janelas com menos de ~500 px de largura, então **o toque real no celular precisa de teste manual** num aparelho.

## 7. Como adicionar um chefe sem quebrar nada

1. Crie a definição em `src/boss/bosses/` e registre em `index.js`.
2. Rode `npm test`: os testes genéricos e a garantia de alcance passam a valer para ele na hora.
3. Se a garantia falhar, alguma peça sólida está na frente do ponto fraco. Use `solidUntilPhase`, `revealedBy` ou mova a peça (o tiro do jogador vem **de baixo**).
4. Atualize este catálogo e o CHANGELOG (o `docs.test.js` cobra isso).
