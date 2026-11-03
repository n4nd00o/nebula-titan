# 🗺️ Planejamento do Projeto: Nebula Titan

> Documento de planejamento: contexto, motivação, objetivos, escopo, requisitos, cronograma e riscos.
> É um documento vivo, atualizado a cada etapa relevante do desenvolvimento.

---

## 1. Contexto

O projeto foi desenvolvido no âmbito de uma disciplina de desenvolvimento de jogos. Como introdução aos fundamentos, o professor apresentou à turma o desenvolvimento do **Snake** (jogo da cobrinha), que cobre os conceitos essenciais de qualquer jogo em tempo real:

- o **game loop** (atualizar → desenhar → repetir);
- a leitura da **entrada do usuário**;
- a **detecção de colisão**;
- os **estados de jogo** (jogando, game over, reiniciar).

A partir disso, cada grupo deveria propor e desenvolver o próprio jogo retrô.

## 2. Da ideia inicial à ideia final

### 2.1 Brainstorm inicial

Várias ideias foram discutidas, quase todas partindo de clássicos dos anos 70 e 80. O critério que guiou a escolha foi:

> *"Não queremos só recriar um jogo antigo. Queremos pegar um jogo antigo e colocar nele as nossas ideias, usando princípios de jogos atuais."*

### 2.2 Por que Galaga?

O **Galaga** (Namco, 1981) foi escolhido porque:

1. tem mecânica simples e universalmente reconhecível (nave embaixo, inimigos em cima, atirar e desviar);
2. é um gênero (*shoot 'em up*) que evoluiu muito desde então, o que deixa espaço para contrastar o "antigo" com o "moderno";
3. **o original não tem batalhas contra chefes**, e é aí que a nossa contribuição autoral se encaixa.

### 2.3 A ideia que diferencia o projeto

> **Uma batalha contra um chefe em que cada parte destruída muda o chefe.**

Exemplo da proposta original: *"destruir a asa direita da nave faz ela ficar sem a asa, e isso muda de acordo com a parte que você destrói"*. Além disso, *"o chefe vai ter várias fases e, em cada uma, o objetivo é destruir um ponto fraco novo, e a aparência do chefe vai mudando"*.

### 2.4 Ideia final (como foi implementada)

| Ideia inicial | Como virou realidade |
|---|---|
| Destruir a asa faz o chefe ficar sem a asa | Cada asa é uma **parte independente**. Ao ser destruída, ela **some**, a nave **inclina** para o lado danificado, treme e solta faíscas. |
| O chefe muda conforme a parte destruída | A **asa restante entra em fúria** (atira mais rápido + rajada em varredura); o **gerador** escondido sob a asa fica exposto; o **laser** passa a varrer a tela quando o canhão está danificado; o **casco** fica vermelho na fase final. |
| Várias fases, cada uma com um novo ponto fraco | **4 fases**: Asas → Geradores → Canhão → Núcleo. |
| A aparência muda a cada fase | Rachaduras progressivas em cada parte (3 níveis), carcaças destruídas, escudo de energia, placa blindada arrancada e casco enfurecido. |
| *(evolução durante o desenvolvimento)* | **Quebra antecipada**: a ordem importa de verdade, porque é possível destruir geradores antes da hora (e até pular a fase 2). |
| *(evolução durante o desenvolvimento)* | **Power-ups por parte** e **ordem de destruição** exibida na tela de vitória, reforçando que cada partida é diferente. |

### 2.5 Evolução do escopo na versão 1.1: mini-chefes e buffs

Depois de jogar a versão 1.0 e validar a batalha contra o Titã, surgiu a ideia:

> *"Que tal adicionarmos uns 3 mini-chefes antes desse chefe final? Assim, derrotar cada um deles dá um buff diferente, preparando para a batalha com o chefe."*

Decisões tomadas para essa expansão:

| Pergunta | Decisão | Motivo |
|---|---|---|
| Ordem dos mini-chefes | **O jogador escolhe** (mapa "Rota de Ataque") | Reforça o pilar "a ordem importa": os buffs já obtidos mudam as lutas seguintes. |
| Quais buffs | **Tiro Perfurante, Ala Companheira, Dash e Bomba** | Um por mini-chefe, ligado ao tema da luta; a bomba é a recompensa por vencer os três. Cada buff responde a uma ameaça específica do Titã. |
| Derrota na campanha | **Continuar da luta atual**, mantendo os buffs e zerando a pontuação | A campanha dura de 6 a 10 minutos; recomeçar do zero seria frustrante. A pontuação zerada mantém a pressão. |
| O modo original | **Mantido como "Duelo com o Titã"** | Preserva o desafio puro e permite demonstrar o chefe final rapidamente. |

A expansão só foi viável sem reescrever o jogo porque o motor do chefe era **orientado a dados**: a classe `Boss` foi generalizada para executar qualquer definição de chefe, e cada mini-chefe virou apenas um arquivo novo.

### 2.6 Evolução do escopo na versão 1.2: progressão completa

Nova ideia após a v1.1:

> *"Uma fase nova com o boss final: uma nave gigante que ocupa a tela inteira, com o mesmo esquema de destruir partes, porém com 8 fases, e conforme as fases avançam os buffs coletados se tornam mais necessários. Além disso, 2 fases preparatórias com inimigos simples, como os alienígenas verdes, e inimigos um pouco mais fortes, laranja, que também podem ser usados nas demais fases. Seriam obrigatórias antes dos mini-chefes, sem buffs, dando apenas bônus de pontuação caso o jogador passe delas e zere o jogo sem mortes. É possível obter vidas extras até um máximo de 5."*

| Pergunta | Decisão | Motivo |
|---|---|---|
| Posição da nave gigante | **Depois do Titã** (chefe final verdadeiro) | Escalada clara: setores → mini-chefes → Titã → Leviatã |
| Como "ocupar a tela inteira" | **Voo sobre o casco**, com câmera avançando seção por seção | Permite 8 fases com visual próprio, no estilo dos encouraçados dos shmups clássicos |
| Vidas | **Acumulam na campanha** (máx. 5), vida extra pelo 1UP e a cada 50.000 pontos | Dá peso a jogar bem nas fases iniciais |
| Necessidade dos buffs | **Muito úteis, não obrigatórios** | Cada seção é desenhada para um buff, sem nunca travar o jogador |

**Ideia inicial × implementação:** os "alienígenas verdes" viraram o inimigo comum de formação; os "laranja, um pouco mais fortes" aguentam 3 tiros, atiram em leque e lideram mergulhos. O "bônus caso passe e zere sem mortes" virou o bônus de setor (pontos por fase) mais o **bônus de corrida perfeita** de +100.000.

### 2.6b Evolução do escopo na versão 1.3: quatro mundos

Nova ideia após a v1.2:

> *"Eu queria fazer várias fases agora. Temos a fase principal e inicial; agora quero aumentar o escopo, fazer um sistema de progressão com a dificuldade aumentando, ao mesmo tempo que mantemos o esquema de fases comuns e fases com mini-chefes, uma fase com um chefe e uma com o boss final."*

| Pergunta | Decisão | Motivo |
|---|---|---|
| Quantos mundos | **4** (o conteúdo atual vira o Mundo 1; o Leviatã fecha o Mundo 4) | Campanha longa, com uma curva de dificuldade clara |
| Chefes novos ou variações | **Todos inéditos** (9 mini-chefes + 3 chefes) | Cada mundo com identidade própria |
| Mini-chefes por mundo | **3, como no Mundo 1**, cada um com um buff | Mantém a rota à escolha em todos os mundos |
| Como a dificuldade sobe | **Inimigos comuns novos**, **escala numérica por mundo** | Novidade de mecânica *e* de intensidade |
| Persistência | **Progresso salvo** e **seleção de mundo** no título | A campanha ficou longa demais para uma sessão só |

**Implementação:** a estrutura de mundo virou dado (`WORLDS`), o motor de chefes ganhou ganchos genéricos (raios letais, gravidade, intangibilidade) e cada mundo apresenta um alienígena novo e uma família de mecânicas (Mundo 2: projéteis que se dividem e gravidade; Mundo 3: raios e fogo; Mundo 4: intangibilidade, *bullet hell* e imitação do jogador).

### 2.7 Nome do jogo

O nome **"Galaga"** é marca registrada da Bandai Namco. Como o projeto será público (portfólio), adotou-se um nome original, **Nebula Titan**. O jogo deixa explícito que é *inspirado* no clássico, sem usar nome, personagens, arte ou sons dele. Essa decisão também valoriza a autoria do projeto.

## 3. Objetivos

### 3.1 Objetivo geral

Desenvolver um jogo retrô completo e polido, com uma única fase contra um chefe de partes destrutíveis, aplicando fundamentos de programação de jogos e princípios modernos de game design.

### 3.2 Objetivos específicos (mensuráveis)

| # | Objetivo | Critério de sucesso | Status |
|---|---|---|:---:|
| O1 | Implementar o motor do jogo sem engine/bibliotecas | Loop com passo fixo, cenas, entrada e áudio próprios | ✅ |
| O2 | Chefe com partes destrutíveis que alteram aparência e comportamento | ≥ 6 partes, ≥ 3 estados visuais de dano, comportamento diferente por parte | ✅ (8 partes) |
| O3 | Múltiplas fases com pontos fracos distintos | ≥ 3 fases | ✅ (4 fases) |
| O4 | Partida de duração adequada | Entre 2 e 5 minutos para um jogador médio | ✅ (~3 min) |
| O5 | Rodar em navegador, desktop e celular | Funciona em Chrome/Edge/Firefox e com toque | ✅ |
| O6 | Desempenho estável | 60 FPS com centenas de projéteis e partículas | ✅ |
| O7 | Qualidade verificável | Testes automatizados da lógica principal + CI | ✅ (34 testes) |
| O8 | Documentação de nível profissional | README bilíngue + GDD + arquitetura + planejamento | ✅ |
| O10 | *(v1.1)* Campanha com mini-chefes e buffs | 3 mini-chefes, rota à escolha, 4 buffs, sem duplicar o motor | ✅ |
| O11 | *(v1.2)* Progressão completa | 2 setores de ondas, chefe final de 8 fases maior que a tela, vidas acumuladas | ✅ |
| O9 | Publicação jogável | Link público na Vercel | ✅ |

## 4. Escopo

### 4.1 Dentro do escopo (MVP)

- *(v1.0)* 1 batalha contra o chefe final (4 sub-fases);
- *(v1.1)* campanha com 3 mini-chefes (2 fases cada), mapa de rota, 4 buffs e *continue*;
- *(v1.2)* 2 setores de ondas em formação (alienígenas verdes e laranja), chefe final Leviatã (8 seções), vidas acumuladas (máx. 5) e bônus de corrida perfeita;
- nave do jogador com tiro, movimento em 2 eixos, modo foco, vidas e power-ups;
- inimigos menores (drones) invocados pelo chefe;
- HUD com pontos, recorde, barra de vida segmentada por fase, vidas e power-ups;
- telas de título, pausa, game over e vitória (com rank e estatísticas);
- efeitos sonoros e música sintetizados;
- controles por teclado e toque;
- testes automatizados e documentação completa.

### 4.2 Fora do escopo (nesta versão)

- fases com rolagem de cenário (terreno) entre os chefes;
- menu de configurações;
- gamepad;
- ranking online;
- história/cutscenes;
- localização da interface do jogo (o jogo está em PT-BR; a documentação é bilíngue).

> **Justificativa:** escopo controlado é uma das habilidades mais valorizadas no desenvolvimento de jogos. Uma única batalha excelente comunica mais qualidade do que várias fases inacabadas. A arquitetura, porém, foi feita para **escalar**: novos chefes são, essencialmente, novos arquivos de dados.

## 5. Requisitos

### 5.1 Requisitos funcionais

| ID | Requisito |
|---|---|
| RF01 | O jogador deve mover a nave nos dois eixos, limitada à metade inferior da tela. |
| RF02 | O jogador deve atirar continuamente ao segurar o botão de tiro. |
| RF03 | O chefe deve ser composto por partes com vida individual. |
| RF04 | Apenas as partes da fase atual (ou expostas antecipadamente) devem receber dano. |
| RF05 | Tiros em partes blindadas devem gerar feedback de ricochete. |
| RF06 | Ao destruir uma parte, o chefe deve mudar visualmente e/ou de comportamento. |
| RF07 | O chefe deve avançar de fase quando todos os alvos da fase forem destruídos. |
| RF08 | O jogo deve exibir pontuação, recorde, vidas e progresso do chefe. |
| RF09 | O jogo deve oferecer pausa, game over e vitória com opção de reiniciar. |
| RF10 | O recorde deve ser persistido entre sessões. |
| RF11 | O jogo deve aceitar controle por toque. |

### 5.2 Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF01 | Rodar a 60 FPS em computadores comuns. |
| RNF02 | Lógica independente da taxa de atualização do monitor. |
| RNF03 | Zero dependências em tempo de execução. |
| RNF04 | Código modular, comentado e com responsabilidades separadas. |
| RNF05 | Lógica central testável sem navegador. |
| RNF06 | Interface legível: o jogador deve sempre distinguir seus tiros dos tiros inimigos. |

## 6. Metodologia e cronograma

Desenvolvimento **iterativo e incremental**, em etapas curtas com uma versão jogável ao fim de cada uma:

| Etapa | Entregas | Status |
|---|---|:---:|
| 1. Concepção | Escolha do jogo, conceito do chefe, definição de escopo e tecnologias | ✅ |
| 2. Motor | Game loop, cenas, entrada, renderização, fundo estrelado | ✅ |
| 3. Jogador | Movimento, tiro, vidas, invencibilidade, modo foco | ✅ |
| 4. Chefe (estrutura) | Sistema de partes, hit test, estados, fases orientadas a dados | ✅ |
| 5. Chefe (conteúdo) | 4 fases, padrões de tiro, laser, drones, quebra antecipada | ✅ |
| 6. Game feel | Partículas, hit-stop, tremor, flashes, variações de dano procedurais | ✅ |
| 7. Áudio | Efeitos e trilha sintetizados | ✅ |
| 8. Interface | HUD, título, pausa, game over, vitória, rank | ✅ |
| 9. Qualidade | Testes, simulação headless, balanceamento | ✅ |
| 10. Documentação | README PT/EN, GDD, arquitetura, planejamento, guia de sprites | ✅ |
| 11. Arte autoral | Substituição de sprites por desenhos próprios (opcional) | ⏳ |
| 12. Publicação | Repositório no GitHub + deploy contínuo na Vercel | ✅ |
| 13. *(v1.1)* Generalização | Motor de chefes genérico, definições em arquivos separados | ✅ |
| 14. *(v1.1)* Campanha | 3 mini-chefes, buffs, mapa de rota, continue, menu de modos | ✅ |
| 15. *(v1.1)* Qualidade | Testes genéricos por chefe + campanha (61 no total), simulação da campanha inteira | ✅ |
| 16. *(v1.2)* Setores | Inimigos em formação, diretor de ondas, 2 setores, alienígena laranja | ✅ |
| 17. *(v1.2)* Leviatã | Casco procedural, câmera por seção, blindagem, regeneração, lasers, 8 fases | ✅ |
| 18. *(v1.2)* Qualidade | 81 testes; simulação setores → Leviatã; verificação visual em navegador headless | ✅ |

## 7. Riscos e mitigações

| Risco | Impacto | Mitigação adotada |
|---|---|---|
| Escopo crescer demais | Alto | Escopo fechado em 1 chefe; ideias extras vão para o roadmap. |
| Falta de arte | Médio | Pixel art gerada por código + suporte a PNGs opcionais. |
| Dificuldade desbalanceada | Médio | Parâmetros centralizados (`config.js`, `src/boss/bosses/`) + simulação automatizada + testes de jogo. |
| Bugs na progressão do chefe | Alto | Testes automatizados cobrindo todas as transições de fase. |
| Áudio bloqueado pelo navegador | Baixo | Áudio iniciado somente após a primeira interação do usuário. |
| Desempenho com muitos projéteis | Médio | Limite de projéteis, partículas em *pool* e remoção sem alocação. |

## 8. Visão de futuro

As ideias que surgiram durante o desenvolvimento e ficaram para próximas versões estão no [Roadmap do README](../README.md#-roadmap). Destaques:

- ~~Novos chefes reaproveitando o sistema de partes~~ (feito na v1.3: 12 chefes novos, incluindo a Hidra, cujas cabeças renascem);
- **Modo "Boss Rush"** encadeando vários chefes;
- **Acessibilidade**: opção de reduzir o tremor de tela e os flashes, além de modo de alto contraste;
- **Ranking online** com um back-end simples.
