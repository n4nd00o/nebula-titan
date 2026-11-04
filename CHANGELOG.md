# Changelog

Todas as mudanças relevantes do projeto são documentadas aqui.
O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.5.0] - 2026-11-04

### Adicionado
- **Mundo 5, SINGULARIDADE** (liberado ao vencer o Leviatã): sem setores, **6 mini-chefes em dois círculos** (o 2º círculo abre quando o 1º cai inteiro, ordem livre dentro de cada um) e o chefe final verdadeiro **ÔMEGA**.
  - 1º círculo: **Cronos** (anéis congelados e ponteiros-raio giratórios), **Reflexo** (cristais que ricocheteiam nas bordas e tiros refletidos), **Parasita** (bolsas que regeneram, esporos teleguiados e gravidade).
  - 2º círculo: **Legião** (kamikazes e paredes de laser), **Artilheiro** (canhões que miram, avisam e disparam raios), **Fênix** (chuva de brasas e um coração que renasce: 3 fases).
  - **ÔMEGA**: 8 fases, cada uma com a arma de um guardião (nós orbitais, ponteiros, espelhos, legião, véu intangível, artilharia, inferno) e um núcleo final que regenera e usa tudo ao mesmo tempo.
- **7 buffs novos** (23 no total): **Tempo Bala**, **Ricochete**, **Vampirismo**, **Orbitais**, **Supercarga**, **Renascer** e o bônus do mundo **Ascensão**.
- **Tela MEUS BUFFS** (`BuffsScene`): todos os buffs por mundo, com efeito e origem; os que faltam aparecem como "???". Abre pela pausa (botão ou `I`), pelo Mapa de Progresso (botão BUFFS) e pelo título. Na pausa, a luta é retomada exatamente como estava (`Game.resumeScene`).
- **Teclas configuráveis** (`ControlsScene` + `src/core/KeyBindings.js`): todas as ações (mover, atirar, foco, dash, bomba, pausa) com tecla principal e alternativa, transferência automática em caso de conflito, teclas reservadas, "restaurar padrão" e textos de ajuda que mostram as teclas atuais. Salvo no navegador (`keyBindings`).
- Projéteis inimigos que **ricocheteiam** nas laterais (`bounce`); módulo `src/boss/sweepers.js` (ponteiros-raio, canhões de raio com aviso, chuva de brasas); 24 sprites novos (`src/graphics/spriteDataFinal.js`).
- Testes novos: `tests/controls.test.js` e `tests/buffs.test.js` (a cena de jogo real com um jogo falso), Mundo 5 e escala por buffs em `campaign.test.js`; os 7 chefes novos entram automaticamente nos testes genéricos e na garantia contra chefes imortais. Total: **333 testes**.

### Alterado
- **Chefes de mundo escalam com os buffs do jogador:** cada buff dá **+4% de vida e +1,2% de velocidade de ataque** aos chefes de mundo, ao Leviatã e ao Ômega (mini-chefes não escalam). Pedido: "o chefe final está muito fácil agora que terminou todos os outros buffs".
- **Leviatã com 10 fases** (eram 8): **Defesas do Núcleo** (4 pilares + dois raios giratórios), o núcleo ganhou um **canhão de raio**, e a nova fase **Último Suspiro** (o núcleo reacende). As fases 8 a 10 acontecem na seção do núcleo.
- A campanha termina no Ômega (`FINAL_BOSS_ID`); vencer o Leviatã agora conclui o Mundo 4 e abre o Mundo 5.
- Mapa de Progresso com 5 planetas; Rota de Ataque e fases internas com o layout de dois círculos.
- Pausa: botões **CONTINUAR / MEUS BUFFS / MENU** e controles atuais na tela. Descrições dos buffs sem teclas fixas.
- Testes alterados porque a regra do jogo mudou: Leviatã com 10 fases, campanha com 5 mundos e 23 buffs, pausa com 3 botões.

## [1.4.1] - 2026-11-04

### Corrigido
- **Hidra Glacial imortal na fase 3 (Escamas de Gelo):** depois que as duas escamas de baixo caíam, o **corpo** (sólido e indestrutível) ficava entre o tiro e as escamas de cima. Sobrava só uma fresta de 3 px na borda de uma escama. O corpo agora deixa de bloquear tiros a partir da fase das escamas (`solidUntilPhase: 2`).

### Alterado
- **Teste de garantia mais rígido:** um ponto fraco só conta como alcançável se tiver uma **janela de tiro de pelo menos 12 px** (colunas vizinhas que chegam até ele), medida a cada 2 px. Antes bastava uma coluna, e a Hidra passava no teste com a fresta de 3 px. Com a regra nova, o teste acusa a Hidra e mais nenhum chefe.
- Teste de regressão da Hidra (total: 257 testes).

## [1.4.0] - 2026-11-04

### Adicionado
- **Mapa de progresso** (`ProgressScene`): galáxia com os 4 mundos ligados por uma rota, marcando o mundo atual ("VOCÊ ESTÁ AQUI"), os concluídos e os bloqueados. Tocar em um mundo abre as **fases internas** (2 setores → 3 mini-chefes → chefe → Leviatã).
  - Fases vencidas podem ser **rejogadas como treino** (modo `practice` da `PlayScene`): usa os buffs atuais e não altera save, recorde nem estatísticas.
  - Acesso pelo título (**MAPA DE PROGRESSO**), pela Rota de Ataque (botão **MAPA** / `Tab`) e automaticamente ao concluir um mundo, com a nave viajando até o próximo planeta.
  - Histórico permanente de fases vencidas (`progressDefeated`), que sobrevive ao fim da campanha. Lógica pura em `src/systems/Progress.js`.
- **Celular**:
  - botões de **DASH**, **BOMBA** e **PAUSA** desenhados na tela (aparecem após o primeiro toque);
  - pausa com botões **CONTINUAR** e **MENU**; botão **MENU/MAPA** nas telas de fim;
  - **tela cheia** com trava em retrato (`F` ou botão no título), aviso "gire o celular" em paisagem, áreas seguras (*notch*) e altura `100dvh`;
  - **vibração** ao levar dano, quebrar o escudo, usar bomba e vencer (`src/core/Haptics.js`; liga/desliga com `V` ou botão no título);
  - **PWA**: `manifest.webmanifest`, ícones e service worker (`sw.js`, rede primeiro com cache de reserva) para instalar e jogar **offline**;
  - sem menu de contexto, zoom por toque duplo ou "puxar para atualizar".
- **Testes de garantia** (`tests/reachability.test.js`): cada chefe é vencido só com tiros retos vindos de baixo (como o jogador atira), fase por fase; hitbox = sprite; nenhum acerto fora do desenho; raio dos alienígenas compatível com o sprite.
- 84 testes novos (total: 256), incluindo `tests/progress.test.js` e `tests/docs.test.js` (a documentação precisa acompanhar o código).
- **Documentação dos testes** ([docs/TESTES.md](docs/TESTES.md)): catálogo por arquivo, garantia contra chefes imortais e bugs que viraram teste.
- **Relatórios de entrega** ([docs/RELATORIOS_DE_ENTREGA.md](docs/RELATORIOS_DE_ENTREGA.md)): o relatório de cada versão na íntegra, como registro permanente do progresso.

### Corrigido
- **Vórtice imortal na fase 2**: o anel do casco envolvia o Olho do Furacão por completo e todo tiro ricocheteava nele. O anel deixa de bloquear tiros na fase do Olho (`solidUntilPhase: 1`).
- **Oráculo imortal na fase 2**: mesmo problema (a mandala envolvia o Olho). Encontrado pelo teste de garantia novo antes de chegar ao jogador.
- **Hitbox dos alienígenas** menor que o sprite (raio 12 para sprites de 33-39 px): tiros nas pontas das asas atravessavam. Agora o raio acompanha o sprite (14 e 16); o dano por contato no jogador continua o mesmo.
- Toques em áreas vazias dos menus não iniciam mais a opção selecionada por engano.

### Alterado
- Texto de controles do título e da Rota de Ataque muda para instruções de toque no celular.
- Linha "SETOR OK" da Rota de Ataque foi para o topo (sobrepunha o nome do mini-chefe do meio).

## [1.3.0] - 2026-11-03

### Adicionado
- **Progressão em 4 mundos** com dificuldade crescente. Cada mundo segue o esquema **2 setores → 3 mini-chefes (ordem livre) → chefe**; o Mundo 4 termina no Leviatã.
  - Mundo 1, **Nebulosa Carmim**: o conteúdo anterior (Setores 1-2, Sentinela, Colmeia, Ceifador, Nebula Titan).
  - Mundo 2, **Cinturão Glacial**: Setores 3-4, **Prisma**, **Vórtice**, **Escaravelho** e o chefe **Hidra Glacial**.
  - Mundo 3, **Forja Estelar**: Setores 5-6, **Martelo**, **Gêmeos**, **Fornalha** e o chefe **Égide**.
  - Mundo 4, **Vazio Abissal**: Setores 7-8, **Espectro**, **Oráculo**, **Eco**, o chefe **Arconte** e o **Leviatã**.
- **3 alienígenas novos**: azul blindado (tiro de cristal que se divide), roxo divisor (vira 2 drones) e vermelho kamikaze.
- **12 buffs novos**: Tiro Triplo, Onda de Choque, Carapaça, Bomba Extra, Sobrecarga, Ala Dupla, Mísseis Teleguiados, Recarga de Bomba, Fantasma, Foco Amplificado, Escudo Reativo e Bomba Nova (16 no total).
- **Dificuldade por mundo**: ataques e projéteis mais rápidos (`attackRate`, `bulletSpeed`) e chefes de mundo reforçados (`hpScale`).
- **Progresso salvo** no navegador após cada vitória (opção **CONTINUAR**) e **seleção de mundo** no título.
- Tema por mundo: cor de fundo, estrelas e música (`ice`, `forge`, `void`); apresentação do mundo no primeiro setor.
- Ganchos genéricos no motor de chefes: `segments` (raios letais), `pull` (gravidade), `intangible` e `alpha` (Espectro), `hudHint`, `attackRate`; `BossPart.revive` (cabeças da Hidra).
- Projéteis inimigos com **curva** (`spin`), **aceleração** (`accel`) e **divisão** (`split`), e o novo formato `shard`. Mísseis teleguiados do jogador (`PlayerMissile`).
- Módulos `src/boss/beams.js` (desenho de raios) e `src/boss/phasing.js` (ciclo espectral), e `src/graphics/spriteDataWorlds.js` (45 sprites novos).
- 91 testes novos (total: 172), incluindo `tests/worlds.test.js`.

### Alterado
- `Campaign` reescrita em torno da tabela `WORLDS`; serializável com `toJSON()`/`fromJSON()`.
- Mapa da campanha gerado a partir do mundo atual; o título ganhou menu dinâmico.
- Setores: vagas da formação por *tier* (`top`/`bottom`) em vez de por cor; nova trajetória de entrada `dive`.
- HUD: recarga do dash, total de buffs e mundo atual; a pausa lista os buffs conquistados.

### Corrigido
- Um projétil que se divide não se divide mais de uma vez se for atualizado de novo antes de ser removido.

## [1.2.1] - 2026-11-03

### Corrigido
- **Casco do Leviatã invisível:** só o fogo dos motores aparecia. O recorte da silhueta usava `destination-in` linha a linha, e no Canvas cada operação nesse modo apaga tudo o que está fora dela; assim, cada linha apagava as anteriores. Agora a silhueta é um único caminho, preenchido de uma vez.
- Teste de regressão que garante um único recorte (81 testes).

## [1.2.0] - 2026-11-03

### Adicionado
- **Setores 1 e 2** (obrigatórios antes dos mini-chefes): ondas de alienígenas em formação no estilo Galaga, com entrada em curvas, formação que "respira", mergulhos com escolta e retorno à vaga.
- **Alienígena laranja** (3 de vida, leque de 3 tiros); verdes e laranjas também escoltam os chefes.
- **Chefe final LEVIATÃ:** fortaleza estelar maior que a tela, com 8 seções, câmera avançando seção por seção e casco gerado por código.
- Mecânicas do motor de chefes: **blindagem** (o perfurante e a bomba ignoram), **regeneração**, câmera por fase, contato opcional.
- **Paredes de laser** com aviso e brecha (o dash atravessa; a bomba desfaz).
- Recarga de bomba em seções do Leviatã (máx. 3 cargas).
- **Vidas acumuladas** na campanha (máx. 5), **vida extra a cada 50.000 pontos** e **bônus de corrida perfeita** (+100.000 sem mortes).
- Música dos setores; trilha do Leviatã acelera a cada seção.
- 19 testes novos (total: 80).

### Alterado
- `PlayScene` roda qualquer "encontro" (setor ou chefe) via `src/encounters.js`.
- Máximo de vidas de 6 para 5.
- Mapa da campanha mostra o Leviatã, as vidas e as mortes.

## [1.1.0] - 2026-11-03

### Adicionado
- **Modo Campanha:** 3 mini-chefes em ordem escolhida pelo jogador (mapa "Rota de Ataque") e depois o Nebula Titan.
- **Mini-chefes:** Sentinela (cápsulas orbitais + barreiras giratórias), Colmeia (ninhos que fabricam drones + rainha) e Ceifador (investidas telegrafadas com dano por contato).
- **Buffs:** Tiro Perfurante, Ala Companheira (nave aliada), Dash (`C`) e Bomba de Pulso (`X`, 2 cargas por luta).
- *Continue* na campanha (mantém buffs, zera a pontuação).
- Menu de modos na tela de título; modo **Duelo** (luta direta com o Titã, como na v1.0).
- Telas de vitória específicas (buff obtido, campanha concluída com rota e rank geral).
- Recordes separados para Campanha e Duelo.
- Trilhas musicais e efeitos sonoros novos.
- Controles de toque para dash (segundo dedo) e bomba (botão na tela).
- 27 testes novos (total: 61), incluindo testes genéricos aplicados a todos os chefes.

### Alterado
- `Boss` virou um **motor genérico** que executa definições de chefe (`src/boss/bosses/`); `bossData.js` foi substituído por `bosses/nebulaTitan.js`.
- Na campanha, o Titã tem +80% de vida para compensar os buffs.
- Atalho de debug "destruir alvo" mudou de `K` para `T`; novo atalho `B` concede todos os buffs.

## [1.0.1] - 2026-11-03

### Corrigido
- Tiros na metade interna das asas não causavam dano: o gerador escondido sob a asa interceptava os projéteis.
- Geradores apareciam (e bloqueavam tiros) antes de a asa correspondente ser destruída.

### Alterado
- Colisão com as partes do chefe agora usa **máscara de pixels** do sprite (em vez de retângulos), considerando a inclinação do chefe.
- Colisão **contínua**: o trajeto do tiro entre quadros é verificado, evitando que atravesse partes finas.
- Pontos fracos ganham 2 px de tolerância extra.
- Modo debug (`H`) agora exibe a máscara de colisão real.

### Adicionado
- 4 testes de regressão de colisão (total: 34).

## [1.0.0] - 2026-11-03

### Adicionado
- Motor do jogo: game loop com passo fixo, cenas, entrada (teclado + toque), armazenamento local.
- Chefe **NEBULA TITAN** com 8 partes e 4 fases (Asas, Geradores, Canhão, Núcleo).
- Quebra de partes com mudança visual e de comportamento; inclinação ao perder asas.
- Quebra antecipada de geradores e fase pulada, com bônus.
- Laser telegrafado com varredura; minas teleguiadas; espirais; drones em mergulho.
- Pixel art gerada por código com variações de dano procedurais e suporte a PNGs (modo misto).
- Efeitos sonoros e trilha musical 100% sintetizados (Web Audio API).
- Partículas, hit-stop, tremor de tela e flashes.
- HUD com barra de vida segmentada por fase; telas de título, pausa, game over e vitória.
- Pontuação com bônus e rank (S/A/B/C); recorde persistente.
- Modo debug (`?debug`).
- 30 testes automatizados e integração contínua com GitHub Actions.
- Documentação: README (PT/EN), GDD, arquitetura, planejamento, guia de sprites e diário.
