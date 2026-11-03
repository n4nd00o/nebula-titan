<div align="center">

# 🚀 NEBULA TITAN

**Um shoot 'em up retrô com chefes de partes destrutíveis: setores de alienígenas, três mini-chefes, uma rota à sua escolha e uma fortaleza estelar que ocupa a tela inteira.**

*Releitura moderna dos clássicos arcade dos anos 80, inspirada em Galaga (Namco, 1981).*

![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=black)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-E34F26?logo=html5&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Web%20Audio-API-8E478C)
![Dependências](https://img.shields.io/badge/depend%C3%AAncias-zero-38B764)
![Testes](https://img.shields.io/badge/testes-node%3Atest-41A6F6)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-lightgrey)

[🎮 Jogar online](#-jogar-online) · [📖 Game Design](docs/GDD.md) · [🏗️ Arquitetura](docs/ARQUITETURA.md) · [🗺️ Planejamento](docs/PLANEJAMENTO.md) · [🇺🇸 English](README.en.md)

<!-- Quando tiver uma captura de tela/GIF, salve em docs/images/ e descomente a linha abaixo:
![Gameplay do Nebula Titan](docs/images/gameplay.gif)
-->

</div>

---

## 📌 Sumário

1. [Sobre o projeto](#-sobre-o-projeto)
2. [Objetivos](#-objetivos)
3. [Modos de jogo e campanha](#-modos-de-jogo-e-campanha)
4. [O chefe final: Leviatã](#-o-chefe-final-leviatã-a-fortaleza-estelar) · [O Titã](#-o-penúltimo-chefe-as-quatro-fases-do-titã)
5. [Funcionalidades](#-funcionalidades)
6. [Como jogar](#-como-jogar)
7. [Como executar](#-como-executar)
8. [Tecnologias utilizadas](#-tecnologias-utilizadas)
9. [Ferramentas utilizadas](#-ferramentas-utilizadas)
10. [Arquitetura e decisões técnicas](#-arquitetura-e-decisões-técnicas)
11. [Qualidade e testes](#-qualidade-e-testes)
12. [Conhecimentos adquiridos](#-conhecimentos-adquiridos)
13. [Estrutura do projeto](#-estrutura-do-projeto)
14. [Roadmap](#-roadmap)
15. [Créditos e inspiração](#-créditos-e-inspiração)
16. [Autor](#-autor)

---

## 🎯 Sobre o projeto

**Nebula Titan** nasceu como um projeto acadêmico de desenvolvimento de jogos. Para ensinar os fundamentos (game loop, entrada do usuário, colisão e estados de jogo), o professor apresentou à turma o clássico **Snake** (jogo da cobrinha). A proposta do grupo foi além da reprodução de um clássico: **pegar um jogo antigo e reinterpretá-lo com ideias de design de jogos atuais**.

O ponto de partida escolhido foi o **Galaga**, um dos *shoot 'em ups* mais icônicos da era arcade. Em vez de recriar suas ondas de inimigos, o projeto foca em algo que o original nunca teve: **uma batalha contra um chefe gigante, modular e reativo**, inspirada em mecânicas modernas como a quebra de partes de *Monster Hunter*, os pontos fracos de *Zelda* e a leitura de padrões de *bullet hell* contemporâneos.

> **A ideia central:** cada parte do chefe que você destrói **muda a aparência e o comportamento dele**. Arrancar a asa direita deixa a nave sem a asa, desequilibrada e inclinada para aquele lado. A asa que sobra passa a atacar com mais fúria e o gerador de escudo escondido atrás dela fica exposto. **A ordem das suas escolhas muda a luta.**

O escopo foi definido de forma deliberada e incremental: a **versão 1.0** entregou uma única batalha contra o chefe final, polida ao máximo. Com a base validada, a **versão 1.1** acrescentou uma **campanha com três mini-chefes** que concedem buffs, e a **versão 1.2** completou a progressão: **dois setores preparatórios** com alienígenas em formação (no estilo do Galaga) e um **chefe final gigante de 8 fases**, o **Leviatã**, em que os buffs coletados se tornam cada vez mais necessários. A evolução do escopo está registrada no [documento de planejamento](docs/PLANEJAMENTO.md).

## 🧭 Objetivos

| Dimensão | Objetivo |
|---|---|
| **Acadêmico** | Aplicar os fundamentos ensinados com o Snake (loop, input, colisão, estados) em um projeto de complexidade maior e autoral. |
| **Design** | Provar que um conceito retrô pode ganhar profundidade com princípios modernos: telegrafia de ataques, feedback visual, quebra de partes e escolhas com consequência. |
| **Técnico** | Construir um jogo completo **sem engine e sem bibliotecas**, com arquitetura organizada, código documentado e testes automatizados. |
| **Profissional** | Servir de **peça de portfólio** que demonstre domínio de JavaScript, organização de código, documentação técnica e processo de desenvolvimento. |

## 🗺️ Modos de jogo e campanha

| Modo | Descrição |
|---|---|
| **Campanha** | **Setor 1 → Setor 2** (obrigatórios) → **3 mini-chefes na ordem que quiser** (cada um dá um **buff permanente**) → **Nebula Titan** → **LEVIATÃ** (chefe final). As vidas **acumulam** entre as fases (máximo 5). Se perder todas, você **recomeça a fase atual** com 3 vidas e os buffs mantidos, mas a pontuação é zerada. Zerar o jogo **sem nenhuma morte** vale **+100.000 pontos**. |
| **Duelo com o Titã** | Luta direta contra o chefe final, sem buffs: o desafio puro da versão 1.0. |

### Os setores preparatórios

Duas fases obrigatórias de **ondas em formação**, uma homenagem direta ao Galaga: os alienígenas entram fazendo curvas, montam uma formação que "respira" no topo da tela e mergulham contra você. Se errarem o mergulho, voltam para a vaga. Os setores não dão buffs, só **pontos** (abater em mergulho vale o dobro).

| Inimigo | Vida | Ataque | Comportamento |
|---|:---:|---|---|
| **Alienígena verde** | 1 | 1 agulha mirada | Frágil e numeroso; mergulha sozinho ou como escolta |
| **Alienígena laranja** | 3 | Leque de 3 tiros | Fica na fileira de cima e mergulha **puxando escoltas verdes** |

Os dois tipos também aparecem como **escolta** nas lutas contra os chefes.

### Os mini-chefes

| Mini-chefe | Mecânica | Como ele muda | Buff ao derrotar |
|---|---|---|---|
| **Sentinela** | Olho blindado cercado por **3 cápsulas orbitais**; depois, **barreiras giratórias** | Cada cápsula destruída faz as restantes girarem e atirarem **mais rápido**. Na fase 2, é preciso atirar **pelas brechas** das barreiras. | **Tiro Perfurante**: +50% de dano e os tiros atravessam drones |
| **Colmeia** | Nave-mãe orgânica com **2 ninhos** que fabricam drones; depois, a **rainha** | Perder um ninho faz a Colmeia **pender** para aquele lado e o ninho restante produzir **mais rápido**. | **Ala Companheira**: uma nave aliada, que a Colmeia mantinha presa, passa a voar e atirar ao seu lado (homenagem à nave dupla do Galaga) |
| **Ceifador** | Nave-lâmina que faz **investidas telegrafadas** contra o jogador | Sem uma lâmina, ele se desequilibra e investe com **mais frequência**. Na fase 2, investidas mais rápidas explodem em projéteis no fundo da tela. | **Dash**: investida rápida e invencível (você aprende a manobra dele) |
| *Os três derrotados* | — | — | **Bomba de Pulso**: limpa a tela e fere o chefe (2 cargas por luta) |

**A ordem importa também aqui:** os buffs conquistados mudam as lutas seguintes. Quem derrota a Colmeia primeiro ganha a nave aliada para enfrentar a Sentinela; quem começa pelo Ceifador ganha o dash para escapar das barreiras e cápsulas. No final, a tela de vitória mostra **a rota escolhida**. Para compensar os buffs, o Titã chega **reforçado (+80% de vida)** na campanha.

## 🛸 O chefe final: LEVIATÃ, a fortaleza estelar

Uma nave **maior que a tela**: o jogador voa **sobre o casco** e, a cada fase, a câmera avança para a próxima das **8 seções**, da popa até a proa. O casco é **desenhado proceduralmente** e cada seção tem visual próprio. Cada seção é construída em torno de um buff, que fica **cada vez mais necessário, mas nunca obrigatório**:

| Seção | Pontos fracos | Ameaça | Buff que brilha |
|:---:|---|---|---|
| 1 · Motores | 2 torretas de popa | Leques mirados + escoltas | — (aquecimento) |
| 2 · Hangares | 2 portas de hangar | Lançam alienígenas sem parar | Ala Companheira / Perfurante |
| 3 · Baterias Blindadas | 3 baterias | **Blindagem**: tiros comuns causam só 35% do dano | **Tiro Perfurante** (ignora a blindagem) · +1 bomba |
| 4 · Corredor de Lasers | 2 emissores | **Paredes de laser** com uma brecha estreita | **Dash** (atravessa em qualquer ponto) |
| 5 · Reatores Gêmeos | 2 reatores | **Regeneram** quando não são atingidos | **Ala Companheira** (poder de fogo) · +1 bomba |
| 6 · Tempestade | Canhão de tempestade | Cortina densa de projéteis | **Bomba de Pulso** |
| 7 · Ponte de Comando | Ponte blindada | Blindagem + lasers + escoltas laranja | Perfurante + Dash · +1 bomba |
| 8 · Núcleo | Núcleo regenerativo | Espirais, anéis, lasers e escoltas | **Todos** |

## 👾 O penúltimo chefe: as quatro fases do Titã

O **NEBULA TITAN** é uma nave-mãe montada a partir de **8 partes independentes**. Cada uma tem vida, hitbox, aparência danificada e recompensa próprias. A luta avança em quatro fases, e cada fase expõe um novo ponto fraco:

| Fase | Ponto fraco | Comportamento | Mudança visual |
|:---:|---|---|---|
| **1 · Asas de Combate** | Asa esquerda e asa direita | Leques de tiros pelas torretas das asas e anéis de energia. Ao perder uma asa, a outra entra em fúria (mais cadência + rajada em varredura). | A asa destruída **some**; a nave **inclina** para o lado danificado, treme e solta faíscas do "toco". |
| **2 · Geradores de Escudo** | Os geradores escondidos sob as asas | Minas teleguiadas, leques de agulhas e esquadrões de drones que mergulham no estilo Galaga. Um escudo de energia envolve o casco. | O escudo **enfraquece** a cada gerador perdido; os geradores viram **carcaças** escurecidas e soltando fumaça. |
| **3 · Canhão Principal** | O canhão sob o casco | O chefe persegue o jogador e dispara um **laser** com aviso prévio. Abaixo de 50% de vida, o laser passa a **varrer** a tela. | O canhão **racha** progressivamente e vira sucata ao ser destruído. |
| **4 · Núcleo Exposto** | O núcleo de energia | A placa blindada é **arrancada**. O Titã enfurecido dispara espirais que ficam mais densas conforme o núcleo enfraquece. | Casco em **tom vermelho**, luzes piscando, núcleo pulsante e a música acelera. |

**Mecânicas que fazem a ordem importar:**

- **Quebra antecipada:** destruir uma asa expõe o gerador daquele lado, que **já pode ser destruído durante a fase 1** (bônus de +5.000). Se os dois geradores caírem cedo, a fase 2 é **pulada**.
- **Assimetria:** perder a asa esquerda ou a direita primeiro produz inclinações, rotas de fuga e origens de tiro diferentes.
- **Recompensas por parte:** cada parte destruída solta um power-up diferente (tiro duplo, escudo, tiro rápido, vida extra).
- **Leitura sem texto:** tiros em partes blindadas **ricocheteiam** (som metálico e faísca cinza); os pontos fracos atuais são marcados com colchetes pulsantes.

A especificação completa está no [Game Design Document](docs/GDD.md).

## ✨ Funcionalidades

- 🧩 **4 chefes modulares** (1 chefe final + 3 mini-chefes) com partes destrutíveis, fases e 3 estados visuais de dano por parte (intacta → rachada → em chamas → carcaça).
- 🗺️ **Campanha com rota à escolha**, mapa de seleção, **4 buffs** (tiro perfurante, nave aliada, dash e bomba) e sistema de *continue*.
- 👽 **Setores com alienígenas em formação** (verdes e laranja) no estilo clássico do Galaga: entrada em curvas, formação que "respira" e mergulhos com escolta.
- 🛸 **Chefe final de 8 fases maior que a tela**, com câmera que avança seção por seção e casco gerado por código; blindagem, regeneração e paredes de laser.
- ❤️ **Vidas acumuladas** (máximo 5), vida extra a cada 50.000 pontos e bônus de **corrida perfeita** (sem mortes).
- 🎨 **Pixel art gerada por código** (com suporte a substituição por PNGs desenhados à mão, sem alterar a jogabilidade).
- 🔊 **Áudio 100% sintetizado** em tempo real (efeitos + trilha musical com sequenciador), sem nenhum arquivo de som.
- 💥 **Game feel moderno**: *hit-stop*, tremor de tela, flashes, partículas, ondas de choque e destroços com física.
- 🎯 **Design justo**: hitbox reduzida, ataques telegrafados, modo foco (movimento preciso) e limpeza de tela ao morrer.
- 🏆 **Pontuação e rank** (S/A/B/C) com bônus de tempo, precisão e "sem dano", além de recorde salvo no navegador.
- 📱 **Responsivo**: escala para qualquer tela e aceita controle por toque no celular.
- 🧪 **81 testes automatizados**: todos os chefes e setores, campanha, colisões, pontuação e integridade dos sprites.
- 🐞 **Modo debug** (`?debug`) com hitboxes, contador de FPS, invencibilidade, todos os buffs e atalho para pular fases.

## 🕹️ Como jogar

| Ação | Teclado | Toque (celular) |
|---|---|---|
| Mover | `Setas` ou `W A S D` | Arrastar o dedo |
| Atirar | `Espaço`, `Z` ou `J` (segure) | Automático ao tocar |
| Modo foco (lento + hitbox visível) | `Shift` | — |
| Dash *(buff do Ceifador)* | `C` ou `L` | Tocar com um **segundo dedo** |
| Bomba de Pulso *(após os 3 mini-chefes)* | `X` ou `K` | Botão de bomba no canto inferior direito |
| Navegar nos menus/mapa | `Setas` + `Enter` | Tocar na opção |
| Pausar | `P` ou `Esc` | Botão ⏸ no canto superior direito |
| Voltar ao menu (pausado) | `Q` | — |
| Ligar/desligar som | `M` | — |

**Dica:** a nave só é atingida no **pontinho central** (ative o modo foco para vê-lo). Use os colchetes amarelos para saber onde atirar.

## ▶️ Como executar

### 🎮 Jogar online

> **[▶ Jogar agora: nebula-titan.vercel.app](https://nebula-titan.vercel.app)**, hospedado na Vercel e publicado automaticamente a cada *push* na branch `main`.

### 💻 Localmente

Pré-requisito: [Node.js](https://nodejs.org/) 18 ou superior (usado só para o servidor local e os testes, porque o jogo em si não tem dependências).

```bash
git clone https://github.com/n4nd00o/nebula-titan.git
cd nebula-titan
npm start
```

Acesse **http://localhost:5173**.

> **Por que um servidor?** O jogo usa **módulos ES** (`import`/`export`), e os navegadores bloqueiam módulos em páginas abertas direto do disco (`file://`). Alternativas equivalentes: a extensão *Live Server* do VS Code ou `python -m http.server`.

### 🐞 Modo debug

Acesse **http://localhost:5173/?debug** para habilitar:

| Tecla | Função |
|---|---|
| `T` | Destrói instantaneamente os pontos fracos atuais / todos os alienígenas da onda (pula fases) |
| `G` | Liga/desliga a invencibilidade |
| `B` | Concede todos os buffs (para testar o Duelo com buffs) |
| `H` | Mostra/oculta hitboxes (verde = vulnerável, cinza = blindado) |

## 🛠️ Tecnologias utilizadas

| Tecnologia | Onde é usada | Por que foi escolhida |
|---|---|---|
| **JavaScript (ES2022+)** | Todo o jogo | Linguagem nativa da web; roda em qualquer navegador sem instalação. Uso de classes, módulos, *destructuring*, *optional chaining*, `Proxy` (nos testes) e `async/await`. |
| **ES Modules** | Organização do código | Separação real de responsabilidades por arquivo, sem *bundler*. |
| **HTML5 Canvas 2D** | Renderização | API de desenho imediato, ideal para pixel art e controle total do *pipeline* gráfico (composição aditiva, transformações, manipulação de pixels com `ImageData`). |
| **Web Audio API** | Efeitos sonoros e música | Síntese em tempo real com osciladores, ruído filtrado e envelopes, a mesma lógica dos chips de som 8-bit. Agendamento preciso pelo relógio do `AudioContext`. |
| **CSS3** | Layout e escala | Centralização responsiva e `image-rendering: pixelated` para manter os pixels nítidos. |
| **Pointer Events API** | Controle por toque | Um único modelo de eventos para mouse, toque e caneta. |
| **localStorage** | Recorde e preferência de som | Persistência simples no navegador, com tratamento de erro para modo privado. |
| **Node.js** | Servidor local e testes | Executa o servidor estático (`scripts/serve.mjs`) e a suíte de testes. |
| **node:test** | Testes automatizados | *Test runner* nativo do Node, sem dependências externas. |
| **GitHub Actions** | Integração contínua | Roda os testes automaticamente a cada *push* e *pull request*. |
| **Vercel** | Hospedagem e deploy contínuo | Publica o jogo como site estático; cada *push* no GitHub gera um novo deploy automaticamente. |

> **Por que não usar uma engine (Unity, Godot) ou biblioteca (Phaser)?** Por decisão pedagógica e de portfólio: implementar o game loop, a colisão, a renderização e o áudio "na mão" demonstra entendimento dos fundamentos que as engines abstraem. Detalhes em [ARQUITETURA.md](docs/ARQUITETURA.md#por-que-sem-engine).

## 🧰 Ferramentas utilizadas

| Ferramenta | Finalidade |
|---|---|
| **Visual Studio Code** | Editor de código |
| **Git** | Controle de versão |
| **GitHub** | Hospedagem do repositório, CI (Actions), integrado à Vercel para o deploy |
| **Node.js / npm** | Scripts de execução e testes |
| **DevTools do navegador** | Depuração, *profiling* de desempenho e inspeção do canvas |
| **Claude Code (IA)** | Assistente de programação usado no planejamento, na implementação e na revisão |
| **Piskel / Aseprite / LibreSprite** *(opcional)* | Edição de pixel art para substituir os sprites gerados por código |
| **Mermaid** | Diagramas de arquitetura dentro do Markdown |

## 🏗️ Arquitetura e decisões técnicas

```mermaid
flowchart LR
    main[main.js] --> Game
    Game --> Input & AudioEngine & SpriteBank & Storage & Starfield
    Game -->|cena ativa| TitleScene
    Game -->|cena ativa| MapScene
    Game -->|cena ativa| PlayScene
    MapScene --> Campaign
    PlayScene --> Campaign
    PlayScene --> Player & Wingman & Boss & Minion & PowerUp & Projeteis[Projéteis]
    PlayScene --> ParticleSystem & Collision & Scoring
    Boss --> BossPart & BossLaser
    PlayScene --> WaveStage --> FormationEnemy
    Boss -->|executa| Defs[bosses/*.js<br/>Titã, Leviatã, Sentinela, Colmeia, Ceifador]
    Defs --> patterns[patterns.js]
```

Principais decisões (explicadas em profundidade em [docs/ARQUITETURA.md](docs/ARQUITETURA.md)):

1. **Game loop com passo fixo (*fixed timestep*)**: a simulação roda sempre a 60 atualizações por segundo, independentemente do monitor (60 Hz ou 144 Hz). Isso garante comportamento determinístico e justo.
2. **Máquinas de estado**: o jogo (Título → Jogo → Pausa/Vitória/Derrota) e o chefe (entrada → combate ⇄ transição → morte) são máquinas de estado explícitas, o que evita condicionais espalhadas.
3. **Composição em vez de herança**: o chefe é um conjunto de `BossPart`. Adicionar uma parte nova não exige mudar a classe `Boss`.
4. **Motor de chefes genérico e orientado a dados**: os **5 chefes** usam a mesma classe `Boss`. Cada chefe é só um arquivo de definição (`src/boss/bosses/`) com partes, fases e ganchos opcionais (inclinação, órbitas, desenhos extras). Os 3 mini-chefes foram adicionados **sem nenhuma condicional específica** no motor.
5. **Inversão de dependência**: o `Boss` conversa com a cena por uma interface (o "mundo") e não conhece o DOM. Por isso ele pode ser **testado no Node.js** com um mundo falso.
6. **Arte procedural com fallback para PNG**: os sprites são definidos como texto e as variações de dano (rachaduras, carcaça, flash, fúria) são **geradas por algoritmo**. Um PNG desenhado à mão pode substituir qualquer sprite sem alterar hitboxes.
7. **Abstração de entrada**: o código pergunta por **ações** (`fire`, `left`) e não por teclas, então teclado e toque compartilham a mesma lógica.
8. **Interface comum de "encontro"**: uma fase de ondas (`WaveStage`) implementa a mesma interface de um chefe (`update`, `state`, `phaseIndex`, `hitTestPath`...), então a cena de jogo roda os dois sem saber qual é qual (polimorfismo por *duck typing*).
9. **Colisão por pixel com detecção contínua**: as partes do chefe só são atingidas onde há pixel visível, e o trajeto do tiro entre quadros é verificado em passos de 4 px (sem "atravessar" peças finas).
10. **Gerenciamento de memória**: remoção de entidades por compactação *in-place* (`removeDead`), o que evita criar arrays novos a cada quadro e reduz pausas do *garbage collector*.

## ✅ Qualidade e testes

```bash
npm test
```

A suíte (81 testes) cobre:

- **Lógica do chefe**: progressão de fases, invulnerabilidade na entrada e nas transições, quebra antecipada, fase pulada, inclinação por asa perdida, *hit test* (ricochete × dano) e o fluxo completo até a derrota.
- **Colisão**: AABB, círculo × círculo, círculo × retângulo, distância ponto-segmento (laser) e **colisão por pixel** nas partes do chefe (com testes de regressão de bugs reais).
- **Todos os chefes (testes genéricos)**: cada chefe registrado tem a definição validada, cada alvo é verificado como atingível na sua fase e o fluxo completo até a derrota é simulado. Um chefe novo ganha esses testes **automaticamente**.
- **Mecânicas dos mini-chefes**: rotação acelerada das cápsulas, barreiras bloqueando tiros, produção de drones por ninho e o ciclo aviso → investida → retorno do Ceifador.
- **Setores**: as ondas cabem na formação, as vagas são únicas, os inimigos entram, formam, mergulham e atiram, e o setor termina quando todos caem.
- **Leviatã**: câmera avançando exatamente uma seção por fase, blindagem × perfurante, regeneração dos reatores, ausência de dano por contato e paredes de laser (brecha e aviso).
- **Campanha**: setores obrigatórios antes dos mini-chefes, buffs em qualquer ordem, liberação do Titã/bomba/Leviatã, vidas acumuladas (máx. 5), *continue* e corrida perfeita.
- **Pontuação**: bônus, ranks e casos de borda (divisão por zero e tempo acima do par).
- **Integridade da arte**: largura consistente dos sprites, cores existentes na paleta, simetria e espelhamento das asas.
- **Utilitários matemáticos**: interpolação, rotação, ângulos e gerador pseudoaleatório determinístico.

Além dos testes unitários, **a campanha inteira e o duelo** são validados com uma **simulação headless** (DOM falso + "bot" jogando): título → mapa → 3 mini-chefes → Titã → vitória, e também derrota → *continue*. A mesma simulação foi usada para **medir a duração de cada luta** e balancear a dificuldade.

## 🎓 Conhecimentos adquiridos

### Técnicos
- **Arquitetura de jogos**: game loop com passo fixo, separação entre *update* e *render*, cenas e máquinas de estado.
- **Matemática aplicada**: vetores, trigonometria (mira, espirais, rotação de hitboxes), interpolação, *easing* e detecção de colisão geométrica.
- **Computação gráfica 2D**: Canvas API, transformações, modos de composição (`lighter`, `source-atop`), manipulação de pixels com `ImageData` e geração procedural de texturas.
- **Áudio digital**: síntese subtrativa, envelopes ADSR simplificados, ruído filtrado e agendamento de eventos musicais com *lookahead*.
- **Engenharia de software**: modularização, composição, design orientado a dados, inversão de dependência, **refatoração para generalizar** (de 1 chefe para um motor de N chefes), *clean code* e documentação técnica.
- **Testes automatizados**: testes unitários com `node:test`, *test doubles* com `Proxy` e simulação headless.
- **DevOps básico**: versionamento com Git, integração contínua com GitHub Actions e deploy contínuo com a Vercel.

### Design de jogos
- **Design de chefes**: fases, pontos fracos, telegrafia de ataques, escalada de dificuldade e recompensas.
- **Game feel / "juice"**: *hit-stop*, tremor de tela, partículas e feedback audiovisual imediato.
- **Legibilidade e justiça**: linguagem visual de cores (amarelo = jogador, rosa/laranja = inimigo), hitbox reduzida e comunicação sem texto (ricochete).
- **Balanceamento**: ajuste de vida, cadência e densidade de projéteis com base em testes de jogo e em métricas da simulação.
- **Progressão e escolha**: rota não linear, recompensas que mudam as lutas seguintes e compensação de dificuldade (Titã reforçado na campanha).

### Comportamentais
- **Definição e controle de escopo**: começar com *uma* batalha excelente e só expandir (campanha) depois da base validada.
- **Planejamento iterativo**: protótipo → núcleo jogável → polimento → documentação.
- **Comunicação técnica**: documentar decisões para professores, colegas e recrutadores.

## 📁 Estrutura do projeto

```
nebula-titan/
├── index.html               # Página do jogo
├── css/style.css            # Layout e escala do canvas
├── src/
│   ├── main.js              # Ponto de entrada
│   ├── config.js            # Constantes e parâmetros de balanceamento
│   ├── core/                # Motor: loop, entrada, áudio, armazenamento
│   ├── graphics/            # Paleta, sprites em texto, SpriteBank, texto
│   ├── systems/             # Partículas, colisão, fundo, pontuação, campanha
│   ├── entities/            # Jogador, nave aliada, projéteis, alienígenas, power-ups, lasers
│   ├── boss/                # Motor de chefes: partes, laser, padrões de tiro
│   │   └── bosses/          # Definições: Titã, Leviatã, Sentinela, Colmeia, Ceifador
│   ├── stages/              # Setores de ondas: diretor (WaveStage) e dados das ondas
│   ├── encounters.js        # Registro de todos os encontros (setores + chefes)
│   ├── scenes/              # Título (menu), mapa da campanha e batalha
│   └── utils/               # Funções matemáticas puras
├── assets/sprites/          # PNGs opcionais (substituem a arte gerada)
├── tests/                   # Testes automatizados (node:test)
├── scripts/serve.mjs        # Servidor estático de desenvolvimento
├── docs/                    # GDD, arquitetura, planejamento, guias e diário
└── .github/workflows/ci.yml # Integração contínua
```

## 📚 Documentação

| Documento | Conteúdo |
|---|---|
| [docs/PLANEJAMENTO.md](docs/PLANEJAMENTO.md) | Contexto, ideia inicial × final, escopo, requisitos, cronograma e riscos |
| [docs/GDD.md](docs/GDD.md) | Game Design Document: mecânicas, chefe, fases, pontuação, arte e áudio |
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | Arquitetura de software, diagramas e decisões técnicas |
| [docs/GUIA_DE_SPRITES.md](docs/GUIA_DE_SPRITES.md) | Como desenhar e substituir os sprites |
| [docs/DIARIO_DE_DESENVOLVIMENTO.md](docs/DIARIO_DE_DESENVOLVIMENTO.md) | Registro cronológico do desenvolvimento |
| [CHANGELOG.md](CHANGELOG.md) | Histórico de versões |

## 🗺️ Roadmap

- [x] Núcleo do motor (loop, entrada, cenas, áudio)
- [x] Chefe modular com 4 fases e quebra de partes
- [x] Game feel (partículas, hit-stop, tremor, flashes)
- [x] Pontuação, rank e recorde
- [x] Suporte a toque e modo debug
- [x] Testes automatizados e CI
- [x] Campanha com 3 mini-chefes, rota à escolha e buffs (v1.1)
- [x] Motor de chefes genérico (novos chefes = novos arquivos de dados)
- [x] Setores de ondas em formação + chefe final de 8 fases maior que a tela (v1.2)
- [ ] Sprites desenhados à mão (modo misto)
- [ ] Menu de opções (volume, reduzir tremor de tela, dificuldade)
- [ ] Suporte a gamepad (Gamepad API)
- [ ] Ranking online
- [ ] Mais mini-chefes e rotas alternativas na campanha

## 🙏 Créditos e inspiração

- **Galaga** © Bandai Namco Entertainment. Este é um projeto **acadêmico, autoral e sem fins comerciais**, *inspirado* no gênero e na era do jogo original. Nenhum nome, personagem, arte ou som do Galaga foi utilizado.
- Paleta de cores baseada na **Sweetie 16**, de GrafxKid.
- Fonte **Press Start 2P**, de CodeMan38 (SIL Open Font License), via Google Fonts.
- Referências de design: *Monster Hunter* (quebra de partes), *The Legend of Zelda* (pontos fracos), *Touhou* e *Ikaruga* (legibilidade de *bullet hell*).

## 👤 Autor

**Luiz Fernando Santana**
Estudante de [CURSO] na [INSTITUIÇÃO]

- GitHub: [@n4nd00o](https://github.com/n4nd00o)
- LinkedIn: [linkedin.com/in/luiz-fernando-santana-trindade](https://www.linkedin.com/in/luiz-fernando-santana-trindade/)
- E-mail: luizfernandosantanadev@gmail.com

<!-- Se o projeto foi feito em grupo, liste aqui os demais integrantes e o papel de cada um. -->

## 📄 Licença

Distribuído sob a licença **MIT**. Veja [LICENSE](LICENSE) para mais informações.
