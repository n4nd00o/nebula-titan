# 📖 Game Design Document: Nebula Titan

> Versão 1.2 · Especificação de design do jogo

---

## 1. Visão geral

| Item | Descrição |
|---|---|
| **Título** | Nebula Titan |
| **Gênero** | Shoot 'em up vertical: setores de ondas + boss rush (3 mini-chefes, Titã e o chefe final Leviatã) |
| **Plataforma** | Navegador (desktop e mobile) |
| **Público** | Jogadores casuais e fãs de arcade; partidas de 2 a 5 minutos |
| **Inspiração** | Galaga (1981) pela estrutura; Monster Hunter, Zelda e bullet hells modernos pelas mecânicas |
| **Pitch** | *"Uma nave contra um titã. Escolha sua rota, roube o poder de cada guardião e desmonte o titã peça por peça."* |
| **Modos** | **Campanha** (2 setores → 3 mini-chefes em ordem livre → Titã → Leviatã, com buffs) e **Duelo** (só o Titã, sem buffs) |

## 2. Pilares de design

1. **Cada golpe muda o chefe.** O jogador deve *ver* e *sentir* o efeito de cada parte destruída.
2. **Escolhas com consequência.** A ordem em que as partes são destruídas altera a luta.
3. **Difícil, mas justo.** Todo ataque é legível e telegrafado; a morte deve parecer culpa do jogador, nunca do jogo.
4. **Alma retrô, design moderno.** Visual e som 8-bit com *game feel* e acessibilidade atuais.

## 3. Loop principal

```
Observar o chefe → Identificar o ponto fraco (colchetes amarelos)
      ↑                                   ↓
Chefe muda (visual + ataques)  ←  Desviar + atirar até destruir a parte
```

## 4. O jogador

| Atributo | Valor | Observação |
|---|---|---|
| Velocidade | 240 px/s (foco: 120 px/s) | Movimento em 8 direções, diagonal normalizada |
| Área de movimento | Metade inferior da tela | Mantém a distância do chefe |
| Hitbox | Círculo de raio 4 px | Muito menor que o sprite (padrão do gênero) |
| Cadência de tiro | ~6 tiros/s (rápido: ~12/s) | Segurar para atirar |
| Vidas | 3 (máx. **5**) | Renasce com 2,5 s de invencibilidade. Na campanha as vidas **acumulam** entre as fases; vida extra pelo 1UP e **a cada 50.000 pontos** |

**Modo foco (Shift):** reduz a velocidade pela metade e mostra a hitbox real, para desvios precisos.

**Misericórdia:** ao morrer ou renascer, todos os projéteis inimigos são removidos da tela.

## 5. O chefe: NEBULA TITAN

### 5.1 Anatomia

```
              [ Placa / Núcleo ]
   [Asa E] ── [     CASCO      ] ── [Asa D]
   (Gerador E)       |              (Gerador D)
                 [ Canhão ]
```

| Parte | Vida | Fase-alvo | Ao ser destruída | Recompensa |
|---|:---:|:---:|---|---|
| Asa Esquerda | 40 | 1 | Some; nave inclina para a esquerda; expõe o Gerador E | Tiro Duplo · 2.500 pts |
| Asa Direita | 40 | 1 | Some; nave inclina para a direita; expõe o Gerador D | Tiro Duplo · 2.500 pts |
| Gerador Esquerdo | 35 | 2 | Escondido até a Asa E cair; ao ser destruído vira carcaça e o escudo enfraquece | Escudo · 2.000 pts |
| Gerador Direito | 35 | 2 | Escondido até a Asa D cair; ao ser destruído vira carcaça e o escudo enfraquece | Tiro Rápido · 2.000 pts |
| Canhão Principal | 80 | 3 | Vira carcaça; laser desativado | Vida Extra · 4.000 pts |
| Placa Blindada | — | — | Arrancada no início da fase 4 | — |
| Núcleo | 100 | 4 | Derrota do chefe | 10.000 pts |
| Casco | ∞ | — | Indestrutível; bloqueia tiros nas fases 1–3 | — |

### 5.2 Estados visuais de cada parte

| Vida | Estado | Visual |
|---|---|---|
| 100%–67% | Intacta | Sprite original |
| 66%–34% | Danificada | Rachaduras + fumaça ocasional |
| 33%–1% | Crítica | Mais rachaduras, brasas laranja, tom escurecido, mais fumaça |
| 0% | Destruída | Some (asas, núcleo) **ou** vira carcaça escura e fumegante (geradores, canhão) |
| Ao ser atingida | Flash | Silhueta branca por 60 ms |

O casco acumula rachaduras a cada fase vencida e fica **avermelhado** na fase 4.

### 5.3 Fases

#### Fase 1: Asas de Combate
- **Alvos:** Asa Esquerda e Asa Direita.
- **Movimento:** vai e vem horizontal suave.
- **Ataques:**
  - leque de 3 tiros mirados a partir da torreta de cada asa (a cada 1,6 s);
  - anel de 10 projéteis a partir do centro (a cada 3,2 s).
- **Reação à primeira asa perdida:**
  - a nave inclina ~10° para o lado danificado, desvia para aquele lado e treme;
  - a asa sobrevivente atira a cada 0,9 s e dispara uma **rajada em varredura** a cada 4 s;
  - o anel passa a ter 14 projéteis;
  - o gerador daquele lado fica **exposto** (quebra antecipada liberada).

#### Fase 2: Geradores de Escudo
- **Alvos:** Gerador Esquerdo e Gerador Direito.
- **Visual:** bolha de energia ciano ao redor do casco; a intensidade cai com cada gerador perdido.
- **Ataques:**
  - **minas teleguiadas** a partir de cada gerador (perseguem o jogador por 2,2 s);
  - leque de 5 agulhas mirado (a cada 2,4 s);
  - **esquadrão de 4 drones** a cada 8 s (entram em "S" e mergulham, como no Galaga).
- **Sobrecarga:** com um gerador destruído, o outro lança minas com quase o dobro da frequência.

#### Fase 3: Canhão Principal
- **Alvo:** Canhão Principal.
- **Movimento:** persegue lentamente a posição X do jogador e **trava** enquanto usa o laser.
- **Ataques:**
  - **Laser**: 1,1 s de carga (linha de aviso piscando, partículas sendo sugadas e som crescente) seguido de 1,4 s de disparo;
  - abaixo de 50% de vida, o laser fica mais frequente e **varre** a tela em direção ao jogador;
  - tiros triplos mirados entre os lasers;
  - agulhas em leque pelas saídas laterais;
  - esquadrão de 3 drones a cada 10 s.

#### Fase 4: Núcleo Exposto
- **Início:** a placa blindada é **arrancada** com explosão; o chefe fica **enfurecido** (casco vermelho, olhos piscando) e a música acelera 20%.
- **Alvo:** Núcleo (pulsante).
- **Movimento:** trajetória em "8", rápida e ampla.
- **Ataques:**
  - **espiral** contínua com 2 braços (3 abaixo de 50% de vida), que fica mais densa conforme o núcleo enfraquece;
  - anel de 18 projéteis a cada 2,8 s;
  - orbe grande mirado a cada 1,8 s;
  - esquadrão de 4 drones a cada 7 s.
- **Derrota:** 3,4 s de explosões em cadeia, a nave afunda e se inclina, depois vem uma explosão final com flash e onda de choque.

### 5.4 Transições

Entre fases há **2,6 s de transição**: o chefe fica invulnerável, treme e volta ao centro; os projéteis em tela viram pontos (+10 cada); o fundo estrelado acelera (efeito de dobra espacial) e um anúncio mostra o nome e o objetivo da próxima fase.

### 5.5 Quebra antecipada (a ordem importa)

- Destruir uma asa **expõe** o gerador daquele lado, que pode ser destruído **ainda na fase 1**.
- Cada parte destruída antes da sua fase rende **+5.000 pontos**.
- Se os dois geradores forem destruídos antes da fase 2, ela é **pulada** (+5.000).
- A tela de vitória mostra a **ordem de destruição**, o que incentiva o jogador a experimentar rotas diferentes.

## 6. Campanha e mini-chefes

### 6.1 Estrutura

```
                    [ LEVIATÃ ]       ← chefe final (8 fases), liberado pelo Titã
                         |
                 [ NEBULA TITAN ]     ← liberado após os 3 mini-chefes (+ Bomba de Pulso)
                /       |        \
       [SENTINELA]  [COLMEIA]  [CEIFADOR]   ← ordem livre, escolhida no mapa
                \       |        /
                [SETOR 1] → [SETOR 2]       ← obrigatórios, sem buffs, só pontos
```

- O jogador escolhe o próximo alvo na tela **Rota de Ataque** (mapa).
- Cada mini-chefe concede um **buff permanente** até o fim da campanha.
- Derrotar os três libera a **Bomba de Pulso** e o Nebula Titan.
- **Derrota:** o jogador recomeça a **luta atual** com vidas cheias e buffs mantidos; a pontuação da campanha é **zerada** (penalidade).
- As **vidas acumulam** entre as fases (máximo 5). Os power-ups temporários (tiro duplo, rápido, escudo) não passam de uma luta para outra; os buffs, sim.
- **Corrida perfeita:** zerar a campanha sem nenhuma morte (contando tentativas que terminaram em *continue*) vale **+100.000 pontos**.
- **Compensação:** na campanha, o Titã tem **+80% de vida**, porque o jogador chega com todos os buffs.

### 6.2 Mini-chefes

Cada mini-chefe segue os mesmos pilares do Titã (partes destrutíveis, mudança por parte perdida, ataques telegrafados), mas tem **2 fases** e dura cerca de 30 a 60 s.

#### Sentinela: precisão
| Fase | Alvos | Comportamento |
|---|---|---|
| 1 · Cápsulas Orbitais | 3 cápsulas (16 HP cada) girando ao redor do olho | Cada cápsula atira uma bola mirada; o olho dispara anéis. **A cada cápsula perdida, as restantes giram e atiram mais rápido.** |
| 2 · Olho Exposto | Olho (45 HP) | 3 **barreiras indestrutíveis** giram ao redor do olho no sentido contrário: é preciso atirar **pelas brechas**. Abaixo de 50%, as barreiras aceleram e surge uma espiral. |

**Recompensa:** Tiro Perfurante.

#### Colmeia: controle de multidão
| Fase | Alvos | Comportamento |
|---|---|---|
| 1 · Ninhos | 2 ninhos (30 HP cada) | Cada ninho **fabrica drones** que saem dele e mergulham no jogador. Perder um ninho faz a Colmeia **pender** para aquele lado e o ninho restante produzir **mais rápido**. |
| 2 · Rainha | Rainha (55 HP, pulsante) | Minas teleguiadas, anéis de projéteis e esquadrões vindos do topo (mais frequentes abaixo de 50%). |

**Recompensa:** Ala Companheira. *Narrativa: a Colmeia mantinha uma nave aliada capturada; derrotá-la a liberta. É uma homenagem à mecânica de nave capturada/nave dupla do Galaga original.*

#### Ceifador: reflexo
| Fase | Alvos | Comportamento |
|---|---|---|
| 1 · Lâminas | 2 lâminas (26 HP cada) | Patrulha rápida e leques pelas lâminas. A cada 4,5 s faz uma **investida**: alinha-se com o jogador, mostra uma **faixa vermelha de aviso** por 0,8 s e mergulha até o fundo da tela. **Encostar nele causa dano.** Sem uma lâmina, inclina-se e investe a cada 3 s. |
| 2 · Fúria | Corpo (60 HP) | Investidas a cada 2,6 s com aviso mais curto; ao chegar ao fundo, explode em um anel de projéteis. |

**Recompensa:** Dash.

### 6.3 Buffs

| Buff | Origem | Efeito | Controle |
|---|---|---|---|
| **Tiro Perfurante** | Sentinela | Tiros com +50% de dano (1,5); atravessam drones; visual ciano | Automático |
| **Ala Companheira** | Colmeia | Nave aliada invulnerável segue o jogador com leve atraso e dispara junto (+1 tiro por disparo) | Automático |
| **Dash** | Ceifador | Investida de 0,14 s a 700 px/s na direção do movimento, com 0,3 s de invencibilidade; recarga de 2 s | `C` / segundo dedo |
| **Bomba de Pulso** | Os três mini-chefes | Limpa todos os projéteis (viram pontos), destrói drones, causa 6 de dano a cada ponto fraco ativo, dá 1,2 s de invencibilidade. **2 cargas por luta.** | `X` / botão na tela |

**Design dos buffs:** cada buff responde a uma ameaça específica do Titã. O perfurante acelera a quebra das partes; a ala companheira ajuda contra os drones da fase 2; o dash atravessa o laser da fase 3; a bomba salva da espiral da fase 4. Assim, a **ordem** da rota decide com quais ferramentas o jogador enfrenta cada mini-chefe.

### 6.4 Pontuação na campanha

- A pontuação **acumula** entre as lutas.
- Cada luta tem bônus de tempo, precisão e "sem dano" proporcionais ao seu tempo-par (mini-chefes: 120 s; Titã: 300 s).
- Ao final, um **rank geral** é calculado com os totais da campanha (tempo-par de 660 s).
- A tela final mostra a **rota escolhida** e a ordem de destruição do Titã.
- Recordes separados para Campanha e Duelo.

### 6.5 Setores preparatórios (ondas em formação)

Fases **obrigatórias** antes dos mini-chefes. Não dão buffs, só pontos e bônus. Funcionam como **tutorial jogável**: ensinam a ler mergulhos e a priorizar alvos, e apresentam o alienígena laranja.

**Comportamento clássico do Galaga:**
1. Os alienígenas **entram em fila** por trajetórias curvas (descida com *looping* ou arco lateral).
2. Ocupam **vagas numa formação** de 8 colunas × 4 fileiras (laranjas em cima, verdes embaixo). A formação balança e "respira" (expande e contrai).
3. Um diretor escolhe quem **mergulha**: o alienígena "pula" para fora da formação, faz uma curva de perseguição e atira. Laranjas mergulham **puxando até 2 verdes** como escolta.
4. Quem erra o mergulho sai por baixo, **reaparece no topo** e volta à vaga.
5. Quanto **menos inimigos restam**, mais frequentes os mergulhos (pressão crescente).

| Setor | Ondas | Destaques |
|---|---|---|
| **1 · Vanguarda** | Primeiro Contato (16 verdes) · Cerco (24 verdes) · Reforços Laranja (4 laranja + 16 verdes) | Aprender a mecânica; o laranja aparece na última onda |
| **2 · Linha de Frente** | Esquadrão Misto (8+8) · Muralha (16 verdes + 8 laranja) · Assalto Total (8 laranja + 24 verdes) | Mergulhos em grupo, até 5 simultâneos |

| Pontuação | Em formação | Em mergulho |
|---|:---:|:---:|
| Verde | 100 | 200 |
| Laranja | 300 | 600 |

## 6B. O chefe final: LEVIATÃ

### Conceito
Uma fortaleza estelar **maior que a tela** (468 × 1.992 px). O jogador voa **sobre o casco**; a cada fase concluída, a câmera avança **uma seção (240 px)** em direção à proa. O casco não é sólido nem causa dano por contato, porque está "abaixo" do jogador: só as peças sobre ele bloqueiam tiros.

### Princípio de design: buffs cada vez mais necessários (mas nunca obrigatórios)
Cada seção é construída em torno de **uma ameaça que um buff resolve**. Sem o buff, a seção continua possível, só que bem mais difícil. Nas seções 3, 5 e 7 o jogador ganha **+1 carga de bomba** (máx. 3).

| # | Seção | Alvos (vida) | Mecânica | Buff ideal |
|:---:|---|---|---|---|
| 1 | Motores | 2 torretas (33) | Leques mirados, escoltas verdes | — |
| 2 | Hangares | 2 hangares (45) | Lançam alienígenas (30% laranja); com um só hangar, lança mais rápido | Ala / Perfurante |
| 3 | Baterias Blindadas | 3 baterias (40, **blindagem 65%**) | Tiro comum causa 35% do dano; perfurante e bomba ignoram a blindagem | **Perfurante** |
| 4 | Corredor de Lasers | 2 emissores (40) | **Paredes de laser** horizontais descem a tela com uma brecha de ~84 px (aviso de 0,7 s) | **Dash** |
| 5 | Reatores Gêmeos | 2 reatores (60, **regeneram 8/s**) | Regeneram após 1,2 s sem levar dano; minas teleguiadas | **Ala Companheira** |
| 6 | Tempestade | Canhão (105) | 3 s de chuva densa / 1,5 s de pausa + orbes grandes | **Bomba** |
| 7 | Ponte de Comando | Ponte (120, blindagem 50%) | Torretas indestrutíveis + lasers + escoltas laranja | Perfurante + Dash |
| 8 | Núcleo | Núcleo (160, regenera 2,5/s) | Espiral de 3–4 braços, anéis, lasers, escoltas; casco vermelho e música no máximo | **Todos** |

**Sinalização:** colchetes **amarelos** = ponto fraco comum; **cinza-azulados** = blindado; **verdes** = regenerando. Tiros comuns em blindagem fazem som metálico e mostram "BLINDADO! (PERFURANTE IGNORA)".

**Música:** acelera 3% a cada seção e 28% no núcleo.

## 7. Inimigos menores: alienígenas de escolta

| Atributo | Valor |
|---|---|
| Tipos | **Verde** (2 de vida como escolta, 1 agulha) e **laranja** (3 de vida, leque de 3 tiros) |
| Vida | 2 (verde) / 3 (laranja) |
| Comportamento | Entram em fila oscilando em "S" por 1,3 s (ou saem de um ninho da Colmeia e mergulham após 0,7 s) e depois mergulham em direção ao jogador, com leve perseguição |
| Ataque | 1 agulha mirada no início do mergulho + colisão corporal |
| Pontos | 150 (verde) / 350 (laranja) |
| Drop | 4% (verde) / 10% (laranja) de soltar Tiro Rápido, Escudo ou Tiro Duplo |

## 8. Power-ups

| Ícone | Nome | Efeito | Duração |
|:---:|---|---|---|
| `2X` azul | Tiro Duplo | Dois projéteis paralelos | Até perder uma vida (se já tiver: +1.000 pts) |
| `R` laranja | Tiro Rápido | Dobra a cadência | 12 s |
| `S` verde | Escudo | Absorve um golpe | Até ser atingido |
| `1UP` rosa | Vida Extra | +1 vida (máx. 6) | — |

Os power-ups "saltam" ao surgir, caem oscilando e piscam antes de sumir (após 12 s).

## 9. Pontuação

| Evento | Pontos |
|---|---|
| Acerto em ponto fraco | 10 |
| Drone destruído | 150 |
| Parte destruída | 2.000 – 10.000 |
| Quebra antecipada / fase pulada | +5.000 |
| Projétil limpo na transição | 10 cada |
| **Bônus de tempo** | (300 s − tempo) × 50 |
| **Bônus de precisão** | precisão × 10.000 |
| **Bônus sem dano** | 20.000 |

**Rank:** **S** = sem dano e em até 4 min · **A** = no máximo 1 vida perdida · **B** = até 3 · **C** = demais casos.

## 10. Princípios de justiça e legibilidade

| Princípio | Aplicação |
|---|---|
| Telegrafia | Laser com 1,1 s de aviso; minas piscam enquanto perseguem; drones fazem a entrada antes de atacar. |
| Contraste | Tiros do jogador são amarelos e finos; tiros inimigos são redondos/brilhantes, rosa/laranja/ciano, com núcleo branco. |
| Comunicação sem texto | Ricochete metálico (cinza) em blindagem × faísca amarela em ponto fraco. |
| Música dos setores | Sequenciador da batalha em Dó maior (C–G–Am–F) a 132 BPM, mais "heroica" |
| Música dos mini-chefes | Mesmo sequenciador da batalha final, em Mi menor (Em–C–D–B) a 152 BPM |
| Música do mapa | Arpejos leves em Mi menor a 110 BPM |
| Sinalização | Colchetes amarelos pulsantes nos pontos fracos atuais. |
| Hitbox honesta | Hitbox de 4 px no centro da nave (o modo foco a exibe); as partes do chefe são atingidas exatamente onde há pixel visível, com 2 px de tolerância nos pontos fracos. |
| Misericórdia | Tela limpa ao morrer; invencibilidade ao renascer. |

## 11. Direção de arte

- **Estilo:** pixel art com "pixels" de 3×3 em resolução lógica de 480×640 (proporção vertical, como os gabinetes arcade).
- **Paleta:** baseada na Sweetie 16, com acréscimo de magenta (energia do chefe) e roxo intermediário.
- **Chefe:** tons de roxo e cinza metálico, com detalhes ciano (tecnologia) e magenta/vermelho (energia hostil).
- **Jogador:** branco e azul, para contrastar com o chefe.
- **Efeitos:** brilho aditivo para fogo, faíscas e laser; fumaça opaca em tons frios.

## 12. Áudio

| Categoria | Abordagem |
|---|---|
| Efeitos | Osciladores *square*, *triangle*, *sawtooth* e *sine* com envelopes de frequência, mais ruído branco filtrado (explosões) |
| Música do título | Arpejos lentos em *triangle*, Lá menor (Am–Dm–F–E) |
| Música da batalha | 140 BPM: bumbo, baixo em oitavas, chimbal de ruído e arpejo *square* (Am–F–G–E); acelera 20% na fase 4 |
| Sinalização | Sirene de alerta na entrada do chefe, carga crescente do laser e fanfarra de vitória |

## 13. Interface (HUD)

```
PONTOS            RECORDE              ⏸
0012340          0045000
NEBULA TITAN                    FASE 2/4
[████████][██████░░][████████][████████]
            ALVO: GERADORES DE ESCUDO

                (área de jogo)

▲▲▲                                  2X
vidas                         RÁPIDO 8
```

A barra do chefe é **segmentada por fase**: segmentos já vencidos ficam vazios, o atual mostra a vida restante dos alvos e os futuros ficam cheios em tom escuro. A barra pisca em branco quando o chefe é atingido.

## 14. Controles

Ver a [tabela de controles no README](../README.md#️-como-jogar).
