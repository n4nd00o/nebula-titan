# 📓 Diário de Desenvolvimento

> Registro cronológico das decisões, problemas e aprendizados do projeto.
> Novas entradas são adicionadas no topo.

---

## 04/11/2026: Versão 1.4.1 (Hidra imortal na fase 3)

### Motivação
No teste de jogo, as **escamas de cima** da Hidra Glacial (chefe do Mundo 2) não podiam ser destruídas na fase 3.

### Causa
As escamas de baixo ficam logo abaixo das de cima. Quando elas caem, quem aparece embaixo das escamas de cima é o **corpo** da Hidra, que é sólido e indestrutível até a fase 4. O tiro sobe, bate no corpo e ricocheteia. Sobrava só uma fresta de 3 px na borda de uma escama.

### Por que o teste de garantia não pegou
Ele aceitava **uma única coluna** de acerto como prova de que o alvo era alcançável, e a fresta de 3 px bastou. Um teste pode passar e mesmo assim não refletir o jogo: "alcançável" precisa significar "dá para mirar".

### Solução
1. O teste passou a exigir uma **janela de tiro de pelo menos 12 px** (`openWindows`). Com isso, ele falhou na Hidra, e em mais nenhum chefe.
2. O corpo da Hidra deixou de bloquear tiros a partir da fase das escamas (`solidUntilPhase: 2`). As escamas de cima ficaram com janelas de ~33 px.
3. Um teste de regressão específico mede a janela das escamas de cima depois que as de baixo caem.

### Aprendizado
Primeiro o teste foi deixado **mais rígido até reproduzir o bug** e só depois veio a correção. Assim fica provado que o teste agora enxerga esse tipo de problema em qualquer chefe.

---

## 04/11/2026: Versão 1.4 (mapa de progresso, celular e garantia contra chefes imortais)

### Motivação
No teste de jogo, o **Vórtice** (mini-chefe do Mundo 2) ficou **imortal**. Pedidos: corrigir, criar **testes que garantam que nenhum outro chefe fique assim**, conferir **todas as hitboxes**, fazer um **mapa de progresso** com os 4 mundos (tocando em um mundo, aparecem as fases internas) e melhorar o jogo **no celular**. Decisões tomadas antes de começar: o mapa **mostra o progresso e permite rejogar fases vencidas como treino**; aparece **no título e após concluir um mundo**; no celular, **botões na tela, tela cheia/retrato, vibração e PWA offline**.

### O que foi feito
1. **Causa do Vórtice:** o anel do casco (peça indestrutível e sólida) é um aro fechado que envolve o Olho do Furacão. O tiro do jogador sobe e encosta no aro **antes** de chegar ao Olho, então sempre ricocheteava. O teste genérico de "alvo atingível" passava, porque testava um tiro parado **no centro** da peça.
2. **Teste de garantia novo:** o teste joga a luta inteira como o jogador: a cada 0,1 s, varre a tela com tiros retos subindo do fundo (`hitTestPath`, o mesmo usado pela cena) e só causa dano quando o tiro chega a um ponto fraco. Se uma fase passa de 120 s sem terminar, o chefe é declarado imortal. Rodando nos 17 chefes, ele achou **um segundo caso, o Oráculo** (a mandala envolvia o Olho do mesmo jeito).
3. **Hitboxes:** testes de máscara = sprite e de "acerto fantasma". O teste de raio dos alienígenas mostrou que o círculo de colisão (raio 12) era menor que os sprites (33-39 px).
4. **Mapa de progresso** (`ProgressScene` + `Progress.js` de lógica pura) e **modo treino** na `PlayScene`.
5. **Celular:** zonas de toque centralizadas em `touchZone()`, botões desenhados no HUD, pausa tocável, tela cheia, vibração e PWA.

### Problemas encontrados e soluções
| Problema | Solução |
|---|---|
| Vórtice e Oráculo imortais na fase 2 (aro sólido envolvendo o ponto fraco). | `solidUntilPhase: 1`: o aro deixa de bloquear tiros quando o Olho vira o alvo. |
| O teste antigo de "alvo atingível" não pegou o bug (tiro testado no centro, sem trajeto). | Teste novo que simula o **trajeto real** do tiro vindo de baixo, durante a luta inteira. |
| Alienígenas com hitbox menor que o desenho. | Raio por tipo (`ALIEN_TYPES[type].radius`); o contato com o jogador continua limitado a 12 para não ficar mais punitivo. |
| O save é apagado ao zerar a campanha, então o mapa "esqueceria" tudo. | Histórico separado (`progressDefeated`) + leitura de saves antigos por `worldsUnlocked`. |
| No primeiro layout da galáxia, as rotas cruzavam os nomes dos mundos (visto nas capturas). | Nomes embaixo dos planetas; a rota sai do topo de um planeta e entra pela lateral do próximo; a nave fica ao lado. |
| Qualquer toque em área vazia de um menu contava como ENTER e iniciava a opção selecionada. | Toque só aciona o que está embaixo do dedo; ENTER do teclado continua igual. |
| O Edge headless não abre janelas com menos de ~500 px, então a captura "de celular" sai cortada. | A escala foi conferida pela lógica (`#app` desconta as áreas seguras) e pelas capturas em 480x640. |

### Aprendizados
- Teste de "acerta no centro" não é teste de jogabilidade: o teste precisa **jogar do jeito que o jogador joga** (de onde o tiro vem, por onde ele passa).
- Um teste genérico bom acha bugs que ninguém reportou ainda (o Oráculo).
- No celular, todo comando de teclado precisa de um equivalente tocável (sair da pausa, voltar ao menu, ligar o som).
- **Decisão de processo:** nada que registra o progresso é apagado. Os relatórios de cada versão ficam arquivados na íntegra em [RELATORIOS_DE_ENTREGA.md](RELATORIOS_DE_ENTREGA.md), os testes têm catálogo próprio em [TESTES.md](TESTES.md) e um teste (`docs.test.js`) falha se a documentação ficar para trás.

---

## 03/11/2026: Versão 1.3 (quatro mundos)

### Motivação
Aumentar o escopo com um **sistema de progressão**: dificuldade crescente, mantendo o esquema de fases comuns, fases com mini-chefes, uma fase com chefe e o chefe final. Decisões tomadas antes de começar: **4 mundos** (o conteúdo atual vira o Mundo 1 e o Leviatã fecha o Mundo 4), **chefes inéditos**, **3 mini-chefes por mundo** como no Mundo 1, e dificuldade com **inimigos comuns novos**, **escala numérica por mundo**, **progresso salvo** e **seleção de mundo**.

### O que foi feito
1. **Campanha como dados:** a `Campaign` passou a ler uma tabela `WORLDS` (setores, mini-chefes, chefe, chefe final, bônus, dificuldade, música e tema). As regras (`available`, `recordVictory`...) valem para qualquer mundo. A campanha virou **serializável** para o save.
2. **Ganchos genéricos no motor:** em vez de condicionais por chefe, o `Boss` ganhou ganchos opcionais: raios letais (`segments`), gravidade (`pull`), intangibilidade (`intangible`/`alpha`), dica no HUD e velocidade de ataque por mundo. Toda mecânica nova foi construída com eles.
3. **12 chefes novos**, cada um com uma ideia central diferente (gravidade, carapaça que abre e fecha, cabeças que renascem, raio entre duas naves, colunas de fogo, nave intangível, cópia do jogador...). Os testes genéricos validaram os 12 automaticamente assim que foram registrados.
4. **Projéteis novos** (curva, aceleração, divisão), **alienígenas novos** e **12 buffs novos**, quase todos ligados ao tema do mini-chefe que os concede.
5. **Save e seleção de mundo** no título, com tema visual e música por mundo.

### Problemas encontrados e soluções
| Problema | Solução |
|---|---|
| A Fornalha tinha as chaminés em cima do casco: o tiro do jogador, que sobe, batia no casco antes de chegar nelas. O teste genérico de "alvo atingível" passava, porque testa um ponto no centro da peça. | Chaminés movidas para baixo do casco. Ao posicionar peças, considerar de onde vem o tiro (de baixo para cima). |
| Na fase 2 do Escaravelho, a carapaça começava fechada e cobria o núcleo, o que falhava o teste de alvo atingível. | No início da fase, a carapaça já começa aberta (posição ajustada na hora, não animada). |
| Um projétil que se divide gerava 60 filhos em vez de 6 quando era atualizado de novo antes de ser removido. | `doSplit` zera `split` depois de dividir. Achado por um teste unitário novo. |
| As capturas de tela no Edge headless mostravam o jogo "congelado" no início. | No modo headless o `requestAnimationFrame` roda poucos quadros. A página de prévia passou a **avançar a simulação** chamando `game.update()` em laço, o que é determinístico. |
| A apresentação do mundo era coberta pelo aviso "ONDA 1/3" depois de 1,5 s. | `WaveStage.entryDelay`: a primeira onda espera a apresentação terminar. |
| Simulando a duração das lutas, a Hidra (Mundo 2) terminava mais rápido que o Titã (Mundo 1), embora o jogador chegue com mais buffs. | Vida extra para os chefes de mundo na campanha (Hidra +40%, Égide +50%, Arconte +60%, Leviatã +120%). As lutas agora ficam mais longas a cada mundo. |

### Aprendizados
- Ganchos **genéricos** (um raio letal, uma força) rendem mais que mecânicas específicas: a mesma ideia de "raio" virou sopro, elo, coluna de fogo, raio giratório, canhão que varre e tesoura.
- Testes genéricos sobre um registro (`BOSSES`) pagam o custo de volta a cada chefe novo.
- Ver o jogo continua indispensável: a verificação visual pegou problemas de legibilidade que os testes não veem.

---

## 03/11/2026: Versão 1.2.1 (casco do Leviatã invisível)

### Problema
No teste do jogador, o chefe final aparecia só como o fogo dos propulsores: a nave em si não existia na tela.

### Causa
O casco é gerado uma vez em um canvas e depois recortado no formato da nave com `globalCompositeOperation = 'destination-in'`. O recorte era feito com um `fillRect` por linha (664 chamadas). Só que, no modo `destination-in`, **cada operação** mantém o destino apenas onde ela desenha e **apaga todo o resto do canvas**. Cada linha apagava as anteriores, e no fim sobrava só a última linha (mais o contorno, desenhado depois). Os testes automatizados não pegaram o problema porque rodam a lógica sem canvas, e a simulação usa um contexto falso.

### Solução
A silhueta inteira virou **um único caminho** (`beginPath` + `rect` por linha + **um** `fill`). Um teste de regressão com contexto falso conta as operações feitas em `destination-in` (precisa ser exatamente 1). Desta vez o resultado também foi conferido **visualmente**, com screenshots do jogo no Edge headless.

### Aprendizado
Modos de composição "destrutivos" (`destination-in`, `source-in`, `copy`...) atuam sobre o canvas inteiro a cada chamada. Recortes devem ser feitos em uma única operação (ou com `clip()`). E testes de lógica não substituem ver o jogo rodando: a verificação visual agora faz parte do processo.

---

## 03/11/2026: Versão 1.2 (setores de ondas + chefe final Leviatã)

### Motivação
Fechar a progressão do jogo: fases preparatórias com inimigos comuns (alienígenas verdes e laranja) e um chefe final gigante, de 8 fases, em que os buffs se tornam cada vez mais necessários. Decisões: Leviatã depois do Titã, "voo sobre o casco", vidas acumuladas (máx. 5) e buffs úteis mas não obrigatórios.

### O que foi feito
1. **Interface de "encontro":** a `PlayScene` passou a rodar qualquer encontro (`src/encounters.js`). O `WaveStage` implementa a mesma interface do `Boss`, então a cena roda setores e chefes sem condicionais por tipo.
2. **Inimigos em formação** (`FormationEnemy`): entrada por trajetórias paramétricas, formação que balança e "respira", mergulho com curva de perseguição, retorno à vaga e escoltas puxadas pelos laranjas.
3. **Alienígena laranja** (3 de vida, leque de 3 tiros), também usado como escolta dos chefes.
4. **Leviatã:** 8 seções, 16 peças, casco **procedural** de 468 × 1.992 px e câmera que avança uma seção por fase (`phaseHomeY`).
5. **Recursos novos no motor (dados, não `if`s):** blindagem, regeneração, câmera por fase, centro de explosão, contato opcional e recarga de bomba.
6. **Paredes de laser** com aviso e brecha: o dash atravessa graças à invencibilidade, e a bomba as desfaz.
7. **Vidas acumuladas** (máx. 5), vida extra a cada 50.000 pontos e **bônus de corrida perfeita** (+100.000).
8. **Testes:** de 61 para **80**. Os testes genéricos validaram o Leviatã automaticamente assim que ele foi registrado.

### Problemas encontrados e soluções
| Problema | Solução |
|---|---|
| O shell do ambiente quebrava *heredocs* longos com aspas e crases ao editar arquivos por script. | Os scripts de edição passaram a ser gravados como arquivos antes de executar. |
| Peças indestrutíveis de seções já vencidas (torretas da ponte) desciam até a área do jogador e bloqueavam tiros. | `solidUntilPhase` nelas: deixam de ser sólidas quando a câmera avança. |
| Simulação: com os 4 buffs, o Leviatã caía em ~80 s, curto demais para o chefe final. | Vida das peças +50% (reatores também regeneram mais): ~112 s para o bot, que mira perfeitamente; estimativa de 3–4 min para humanos. |
| Os testes de campanha da v1.1 supunham que a campanha começava pelos mini-chefes. | Testes reescritos para a nova progressão (setores obrigatórios, Leviatã, vidas, corrida perfeita). |

### Aprendizados
- **Projetar interfaces, não tipos:** quando setores e chefes "falam a mesma língua", a cena de jogo não precisa mudar a cada tipo novo de fase.
- Chefe "maior que a tela" não precisa de sistema de câmera: bastou mover o chefe por fase (`phaseHomeY`) e animar o fundo (*warp*) nas transições.
- **Arte procedural determinística** resolve conteúdo grande (um casco de quase 2.000 px) sem desenhar nada à mão e sem variar entre execuções.

---

## 03/11/2026: Versão 1.1 (campanha com mini-chefes)

### Motivação
Depois de jogar a v1.0.1, a ideia foi expandir: *"3 mini-chefes antes do chefe final; derrotar cada um dá um buff diferente, preparando para a batalha com o chefe"*. Decisões: ordem escolhida pelo jogador, 4 buffs (um por mini-chefe + bomba ao vencer os três), *continue* mantendo buffs e zerando a pontuação, e o modo original mantido como "Duelo".

### O que foi feito
1. **Refatoração antes da funcionalidade:** a classe `Boss` conhecia detalhes do Titã (asas, casco, placa). Esses detalhes viraram **dados e ganchos** da definição (`tilt`, `update`, `drawBehind/Front/World`, `onStart`, `enrage`, `solidUntilPhase`, `visibleFromPhase`...). O Titã passou a ser só mais um arquivo em `src/boss/bosses/`. Os 34 testes existentes passaram **sem alteração de comportamento**, o que comprovou que a refatoração foi segura.
2. **Três mini-chefes** como arquivos de definição: Sentinela (partes em **órbita**, com posição dinâmica), Colmeia (drones que **nascem das partes**) e Ceifador (**investida** com aviso e dano por contato).
3. **Buffs:** tiro perfurante (dano 1,5 e atravessa drones), nave aliada (entidade `Wingman`), dash (invencibilidade + rastro) e bomba (limpa a tela e fere pontos fracos).
4. **Campanha:** lógica pura em `Campaign.js`, mapa de rota (`MapScene`), menu de modos na tela de título, telas de vitória por tipo (buff obtido, campanha concluída, duelo) e recordes separados.
5. **Áudio:** trilhas novas (mini-chefes em Mi menor a 152 BPM e mapa) e efeitos de dash, bomba, aviso de investida e buff.
6. **Testes:** de 34 para **61**, incluindo **testes genéricos que rodam para todo chefe registrado**.

### Problemas encontrados e soluções
| Problema | Solução |
|---|---|
| Teste "perder um ninho acelera o outro" falhou: o total de drones caiu de 8 para 7. | O comportamento estava certo (o ninho restante produz 1,75× mais rápido, mas agora é um só). O teste foi corrigido para medir a **taxa por ninho**. |
| Simulação: com os 4 buffs, o Titã caía em 44 s (contra 160 s no Duelo), anticlimático. | Na campanha, o Titã recebe **+80% de vida** (`hpScale`), e a luta final continua sendo a mais longa. |
| Simulação: a fase 2 da Sentinela durava ~74 s (o olho se movia rápido e as barreiras bloqueavam muito). | Vida do olho de 60 → 45 e movimento mais lento: a fase caiu para ~36 s. |
| A tecla `K` (atalho de debug) colidia com o novo controle de bomba. | Debug passou para `T`; `K` virou alternativa de bomba (ao lado de `J` = tiro e `L` = dash). |

### Aprendizados
- **Refatorar antes de expandir:** generalizar o motor primeiro, com os testes antigos como rede de segurança, tornou a adição dos mini-chefes quase só criação de dados.
- **Testes parametrizados** (um laço sobre todos os chefes) escalam com o conteúdo: cada chefe novo é testado sem escrever teste novo.
- Buffs fortes pedem **compensação** de dificuldade; medir com simulação evita adivinhar.

---

## 03/11/2026: Versão 1.0.1 (correção de hitbox)

### Problema relatado no primeiro teste de jogo
> *"A hitbox das asas e dos núcleos está bugada: eu acerto, mas não conta."*

### Investigação
Foi escrito um script de diagnóstico que dispara de baixo para cima em cada posição horizontal do chefe e registra qual parte absorve cada tiro. Resultado na fase 1:

```
-98..-74: wingL*  (dano)     -68..-44: genL (ricochete!)     -38..34: casco/canhão
```

**Causa:** o gerador de escudo, desenhado *embaixo* da asa e aparecendo levemente abaixo dela, tinha uma hitbox retangular que interceptava os tiros antes de chegarem à asa. Como o gerador não é alvo na fase 1, o tiro ricocheteava. **Quase metade de cada asa não recebia dano.** As bolinhas ciano dos geradores também pareciam "núcleos" atingíveis.

### Correção
1. Geradores ficam **invisíveis e não sólidos** até a asa correspondente ser destruída (era a intenção original de design: "escondidos sob as asas").
2. Hitboxes retangulares trocadas por **máscaras de pixels** derivadas dos sprites, levando em conta a inclinação do chefe.
3. **Colisão contínua**: o trajeto do tiro entre quadros é verificado em passos de 4 px.
4. **Tolerância de 2 px** extra para pontos fracos.
5. **4 testes de regressão** novos (34 no total).

### Impacto medido (simulação com bot)
| Métrica | Antes | Depois |
|---|---|---|
| Duração da fase 1 | 84 s | 46 s |
| Precisão | 30% | 45% |
| Partida completa | ~3 min 20 s | ~2 min 45 s |

### Aprendizado
Testes unitários verificavam se *um* tiro no centro da asa causava dano, e passavam. O bug só aparecia em **outras posições**. Lição: testar **varrendo o espaço de entrada** (todas as posições) em vez de um único caso feliz, e usar **testes de jogo com pessoas reais** cedo.

---

## 03/11/2026: Versão 1.0 (MVP completo)

### O que foi feito
- **Concepção:** a ideia de "releitura do Galaga com chefe de partes destrutíveis" foi transformada em um conceito fechado de 4 fases (Asas → Geradores → Canhão → Núcleo).
- **Decisões de projeto:**
  - tecnologia: **JavaScript puro + HTML5 Canvas**, para rodar no navegador e ter um link jogável no portfólio;
  - arte: **modo misto**, com pixel art gerada por código e substituível por PNGs desenhados à mão;
  - nome original **Nebula Titan** (Galaga é marca registrada da Bandai Namco);
  - documentação **bilíngue** (PT-BR principal + EN).
- **Motor:** game loop com passo fixo, cenas, abstração de entrada (teclado + toque), áudio sintetizado e fundo estrelado com parallax.
- **Chefe:** sistema de partes com vulnerabilidade por fase, ricochete em blindagem, inclinação ao perder asas, quebra antecipada, laser telegrafado e variações visuais de dano geradas por algoritmo.
- **Qualidade:** 30 testes automatizados + simulação headless de partidas inteiras.

### Problemas encontrados e soluções
| Problema | Solução |
|---|---|
| Na fase do núcleo, o casco bloqueava os tiros antes de alcançarem o núcleo (que fica *dentro* do casco). | O casco deixa de ser sólido na fase 4 ("casco rachado"). A regra virou `isPartSolid()`. |
| O dublê de testes (mundo falso) não aceitava chamadas aninhadas como `world.particles.explosion()`. | Um `Proxy` recursivo que registra qualquer chamada em qualquer profundidade. |
| Teste de simetria falhou no sprite do gerador. | O brilho no canto é assimétrico de propósito; o teste foi corrigido em vez do sprite. |
| A simulação mostrou que a fase do núcleo durava ~90 s (longa demais). | Vida do núcleo de 120 → 100; vida das asas de 45 → 40. |
| Mesmo assim, a fase 4 continuava longa: o tiro leva ~0,6 s para subir, e o núcleo, rápido na horizontal, já tinha saído do lugar. | Velocidade lateral do chefe na fase 4 reduzida (movimento mais vertical) e hitbox do núcleo de 26 → 32 px. Partida completa caiu para ~3 min. |

### Aprendizados
- Separar **lógica** de **apresentação** (o Boss não conhece o canvas) tornou possível testar o chefe inteiro sem navegador.
- Design orientado a dados faz o balanceamento virar edição de números, não de código.
- Um bot simples rodando a partida completa encontra problemas de ritmo que testes unitários não pegam.

### Próximos passos
- [x] Publicar no GitHub e na Vercel (v1.2.1).
- [ ] Gravar GIF de gameplay para o README.
- [ ] (Opcional) Desenhar sprites autorais.
- [ ] Testes de jogo com colegas e ajuste fino de dificuldade.
