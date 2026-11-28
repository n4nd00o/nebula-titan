# 🎤 Apresentação: Nebula Titan (A3)

<!-- integrantes:inicio (gerado por npm run integrantes; edite integrantes.json) -->
> **Grupo:** Grupo 19 (Nebula Titan) · **Disciplina:** Usabilidade, desenvolvimento web, mobile e jogos · **Professor:** Elzo Brito dos Santos Filho
>
> **Integrantes:** Luiz Fernando Santana Trindade (RA 824125942) · Luccas Alberto Geraldes Andrade (RA 823116823) · Nathan Silva Barreto (RA 823258091)
<!-- integrantes:fim -->

**Slides:** [`Nebula-Titan-Apresentacao.pptx`](Nebula-Titan-Apresentacao.pptx), 5 slides, abre no PowerPoint e no Google Slides. Cada slide tem **anotações do apresentador** com o que falar.

**Vídeo da demonstração:** [`demonstracao.mp4`](demonstracao.mp4), 72 segundos, sem som. Ele está **dentro do slide 5** (clique no vídeo para tocar no PowerPoint) e também solto nesta pasta, para abrir em qualquer player. Foi gravado do jogo real, seguindo o roteiro da demonstração: tela inicial → introdução da história → primeiro setor → pausa e Meus Buffs → Duelo com o Titã, em que as duas asas do chefe são destruídas. Na gravação a nave estava invencível e o piloto era automático, para o vídeo não depender de ninguém jogar bem.

**QR code:** na **capa** e no **slide 5**, abre [nebula-titan.vercel.app](https://nebula-titan.vercel.app) para quem quiser jogar no celular. A imagem também está em [`docs/images/qr-jogo.png`](../images/qr-jogo.png).

**Jogo para a demonstração:** [nebula-titan.vercel.app](https://nebula-titan.vercel.app) (ou `npm start` → http://localhost:5173).

## Roteiro de falas (cerca de 5 minutos, Luiz e Nathan)

O enunciado sugere: história e objetivo, demonstração jogando, o que cada um fez, uma dificuldade técnica e como foi resolvida, uso de IA. Tudo isso está no roteiro abaixo.

**Divisão em dois blocos, sem alternar:** o **Luiz** abre e apresenta toda a parte técnica (slides 1 a 3). Depois passa a palavra uma única vez, e o **Nathan** apresenta as escolhas de design e a história (slides 4 e 5), faz a demonstração e fecha. O Luccas não apresenta, mas é citado na abertura e no fechamento.

| Bloco | Parte | Tempo |
|---|---|---|
| **Luiz** (técnico) | Slide 1 · Capa | 0:20 |
| | Slide 2 · Linguagem | 0:50 |
| | Slide 3 · Decisões técnicas, dificuldade e IA | 1:10 |
| **Nathan** (design) | Slide 4 · Design | 0:55 |
| | Slide 5 · História | 0:40 |
| | Demonstração | 1:00 |
| | Fechamento | 0:15 |

> As falas são uma base: não precisa decorar palavra por palavra. As mesmas falas estão nas **anotações** de cada slide do PowerPoint, sem o nome de quem fala.

### Bloco do Luiz: parte técnica

**Slide 1 · Capa (0:20)**

> Boa noite, professor. Somos o Grupo 19, formado pelo Luiz, pelo Luccas e pelo Nathan. O nosso jogo é o **Nebula Titan**, um jogo de nave no estilo arcade em que os chefes são montados por partes. Cada parte que você destrói muda a aparência e os ataques do chefe.

**Slide 2 · Linguagem (0:50)**

> Fizemos o jogo em **JavaScript**, com o **Canvas** para desenhar e a **Web Audio** para o som. Escolhemos JavaScript em vez de pygame **porque** ele roda direto no navegador: o jogo abre por um link, até no celular, sem instalar Python nem nada. E a disciplina também trata de web e mobile, então fazia sentido o jogo funcionar nos dois.
>
> Os conceitos são os mesmos das aulas: um laço que atualiza e desenha o jogo 60 vezes por segundo, cada tela é um estado, e a colisão é feita com círculos. A arte e as músicas são geradas pelo próprio código, **porque** assim não dependemos de arquivos de outras pessoas, que precisariam de licença e crédito. E o projeto tem 362 testes automáticos.

**Slide 3 · Decisões técnicas (1:10)**

> Agora, as decisões técnicas e o porquê de cada uma.
>
> Primeiro, **não usamos engine**. O motivo é que a disciplina ensina os fundamentos, como o laço, a colisão e o desenho, e o enunciado pede que a lógica do jogo seja nossa. Numa engine isso já vem pronto; escrevendo à mão, a gente teve que entender cada parte. E o jogo fica leve: abre direto no navegador, sem instalar e sem precisar compilar.
>
> Segundo, os **chefes são descritos como dados**. No começo o código sabia detalhes de um chefe só. Quando o jogo chegou a 24 chefes, copiar esse código para cada um ia espalhar os mesmos erros por todo lado. Então fizemos um motor único que lê um arquivo com as partes, as fases e os ataques de cada chefe. Assim, um chefe novo é só um arquivo novo, e corrigir o motor corrige todos de uma vez.
>
> Terceiro, o **mesmo código serve para o computador e o celular**, porque o navegador trata mouse e toque do mesmo jeito; assim não precisamos de duas versões. E o jogo pode ser instalado como app e jogado sem internet.
>
> A maior dificuldade foi um chefe impossível de vencer: na fase 3 da Hidra Glacial, o corpo bloqueava todos os tiros. Com 24 chefes, não dava para jogar tudo de novo a cada mudança, então criamos testes que jogam cada chefe sozinhos e provam que todos podem ser derrotados.
>
> Usamos **IA**, o Claude Code, como assistente no código, nos testes, na documentação e nos slides. Declaramos no README porque o enunciado exige, e as ideias e decisões foram do grupo.
>
> Agora o Nathan vai falar das escolhas de design e da história do jogo.

### Bloco do Nathan: design, história e demonstração

**Slide 4 · Design (0:55)**

> A aula começou com o Snake. A gente partiu do Galaga, mas mudou o foco para as lutas contra chefes: asas, canhões e escudos são partes separadas, e arrancar uma muda o visual e os ataques do chefe. Fizemos assim **porque** queríamos que o jogador visse o efeito de cada tiro, e que a ordem em que ele destrói as partes mudasse a luta.
>
> A campanha tem **cinco mundos**, com três mini-chefes que você enfrenta na ordem que quiser, para o jogador ter escolha. Cada mini-chefe dá um **buff**, como tiro triplo ou dash. E os chefes ficam mais fortes conforme os seus buffs, **porque** sem isso o jogador ficaria forte demais e o fim do jogo perderia a graça.
>
> Também quisemos que o jogo fosse **justo**: a ideia é que, quando você morre, a culpa seja sua e não do jogo. Por isso os ataques são avisados antes e a área da nave que leva dano é pequena. No celular, o toque é menos preciso que o teclado, então lá os inimigos têm menos vida e os tiros são mais lentos.

**Slide 5 · História (0:40)**

> Agora a história. No ano 2187, a armada do **Ômega**, liderada pelo **Titã**, apagou as colônias. A **Vega**, última piloto da Aliança, foge na nave NT-01 para destruir o Ômega no centro da galáxia.
>
> A história conversa com o jogo: os buffs são os núcleos de energia que os chefes deixam, e os mundos são o caminho até o Ômega. Ela aparece dentro do jogo, na introdução, entre cada mundo e nos finais de vitória e de derrota, com uma música própria.

**Demonstração (1:00)**: o Nathan comenta enquanto o **vídeo do slide 5** roda (um clique nele para tocar). O vídeo segue exatamente a ordem da tabela abaixo, então as falas acompanham as cenas. Se preferirem jogar ao vivo, a tabela também serve: a coluna da esquerda diz o que apertar.

| O que fazer no jogo | O que falar |
|---|---|
| Na tela inicial, escolher **NOVA CAMPANHA** | Vou mostrar o jogo funcionando. |
| Deixar a 1ª página da introdução aparecer, apertar **ENTER** e depois **ESC** | Essa é a introdução. ENTER passa a página e ESC pula. |
| Jogar o primeiro setor por uns 30 segundos | Os inimigos entram em formação, como no Galaga. Em cima ficam os pontos; embaixo, as vidas. |
| Apertar **P** e depois **I** | O P pausa, e o I mostra os buffs. |
| Voltar ao menu (**Q** na pausa) e escolher **DUELO COM O TITÃ** | Aqui é um chefe. Os colchetes amarelos mostram o ponto fraco, e quando uma asa cai ele muda os ataques. |

**Fechamento (0:15)**

> Na divisão de tarefas, o Luiz fez a programação, o game design e a documentação, e eu e o Luccas cuidamos das músicas e do design das fases. Obrigado! Alguma pergunta?

### Por que decidimos assim (para estudar antes)

Esta parte **não é para ler na apresentação**. É para vocês entenderem os motivos e conseguirem responder se o professor perguntar mais.

**Decisões técnicas (Luiz)**

| Decisão | Por quê | Se perguntarem mais |
|---|---|---|
| **JavaScript em vez de pygame** | Roda no navegador de qualquer computador ou celular, sem instalar nada. O professor joga pelo link. A disciplina inclui web e mobile. | Cada envio para o GitHub publica o site sozinho na Vercel, de graça. |
| **Sem engine** (Unity, Godot, Phaser) | A disciplina ensina os fundamentos e o enunciado diz que "a lógica do jogo é escrita pelo grupo". Uma engine esconde o laço, a colisão e o desenho; escrevendo à mão, a gente aprende como funcionam. | O código inteiro tem menos de 1 MB e abre direto no navegador; com uma engine, o jogo precisaria ser exportado/compilado e carregaria o motor dela junto. Como o escopo era controlado, escrever o motor custou pouco. |
| **Laço com passo fixo de 1/60 s** | Se o jogo andasse "o tempo que passou desde o último quadro", ele ficaria diferente em cada monitor: num computador lento, um tiro rápido poderia pular por cima do alvo sem acertar. Com passo fixo, a simulação avança sempre do mesmo jeito, em qualquer máquina. | Se a aba fica em segundo plano, o jogo limita o atraso a 0,25 s para não tentar "recuperar" vários segundos de uma vez (`src/core/Game.js`). |
| **Cada tela é um estado (cena)** | Menu, luta, mapa e história têm regras diferentes. Separar em cenas deixa cada uma simples, e trocar de tela é só trocar a cena ativa. | `game.changeScene(...)` em `src/core/Game.js`; as cenas ficam em `src/scenes/`. |
| **Colisão por círculos** | É o teste mais simples e rápido: basta comparar a distância entre os centros com a soma dos raios. Com até uns 450 tiros na tela e uma nave só, dá para testar todos sem otimização. | Nas partes do chefe o teste usa a forma do desenho (máscara de pixels), para o tiro acertar onde a peça realmente aparece. |
| **Chefes como dados** | Com 24 chefes, copiar código para cada um repetiria os mesmos erros. Um motor único lê a descrição de cada chefe (partes, fases, ataques). Corrigir o motor corrige todos, e um chefe novo é só um arquivo novo. | O motor fica em `src/boss/Boss.js` e cada chefe em `src/boss/bosses/`. |
| **Arte e som feitos por código** | O enunciado exige crédito e licença para tudo que é de terceiros. Gerando por código, não existe arquivo de terceiros. Também deixa o jogo leve e com cara de console antigo. | Os desenhos são matrizes de cores (`src/graphics/`) e o som é sintetizado na hora (`src/core/AudioEngine.js`). |
| **PC e celular no mesmo código** | O navegador trata mouse, toque e caneta pelo mesmo tipo de evento (Pointer Events), então não precisamos de duas versões. Instalar como app (PWA) deixa jogar sem internet. | `src/core/Input.js` e `src/core/TouchControls.js`; o modo offline fica no `sw.js`. |
| **Testes automáticos** | São 24 chefes: não dá para jogar todos de novo a cada mudança. O teste joga cada chefe sozinho e avisa se algum ficou impossível. | O teste da Hidra passava antes mesmo com o chefe impossível, porque aceitava um espaço de 3 pixels para atirar. Hoje ele exige pelo menos 12 pixels. |
| **Declarar a IA** | O enunciado exige a declaração; IA não declarada é violação de autoria. | Os testes e o jogo jogado por nós são a forma de garantir que entendemos e conferimos o que foi gerado. |

**Escolhas de design (Nathan)**

| Decisão | Por quê |
|---|---|
| **Chefes montados por partes** | Para o jogador ver o efeito de cada tiro e para a ordem das escolhas mudar a luta (perder uma asa deixa o chefe inclinado e muda os ataques). |
| **Mini-chefes em qualquer ordem** | Dá escolha ao jogador e faz cada partida ser um pouco diferente. |
| **Buffs como recompensa** | Recompensam vencer um mini-chefe e mudam o jeito de jogar (dash, tiro triplo, bomba). |
| **Chefes que escalam com os buffs** | Sem isso, quem junta muitos buffs ficaria forte demais e o fim do jogo perderia o desafio. |
| **Jogo justo** | A morte tem que parecer culpa do jogador, nunca do jogo: ataques avisados antes, área de dano pequena, pausa e continuar. |
| **Ajuda no celular** | O toque é menos preciso que o teclado, então no celular os inimigos têm 25% menos vida e os tiros inimigos são 20% mais lentos. |
| **História curta e que dá para pular** | O enunciado pede a história dentro do jogo, mas a campanha já é longa. Textos curtos, ENTER acelera e ESC pula, e nada aparece no meio de uma luta. |
| **Buffs viram "núcleos de energia" na história** | Assim a história explica as mecânicas, em vez de ser só um texto à parte. |

### Se o professor perguntar

| Pergunta provável | Quem responde | Resposta curta |
|---|---|---|
| Onde fica o laço principal? | Luiz | Em `src/core/Game.js`: o `loop` chama `update` em passos fixos de 1/60 s e depois `draw`. |
| Como funciona a colisão? | Luiz | Por círculos: duas coisas colidem quando a distância entre os centros é menor que a soma dos raios (`src/systems/Collision.js`). |
| Como foi o uso de IA? | Luiz | Claude Code como assistente; tudo foi revisado, testado e jogado pelo grupo. A declaração está no README, item 9. |
| Como a dificuldade aumenta? | Nathan | Cada mundo tem inimigos mais rápidos e resistentes, e os chefes de mundo ganham vida e ataque conforme os buffs do jogador. |
| Por que a história com a Vega? | Nathan | Ela explica as mecânicas: os buffs são os núcleos de energia dos chefes e os mundos são a rota até o Ômega. Os textos ficam em `src/story/story.js`. |

### Antes de começar

- Teste o vídeo do slide 5 no computador da sala. Se o PowerPoint de lá não tocar vídeo, abra o `demonstracao.mp4` direto.
- Deixe o jogo aberto em outra aba, caso queiram jogar ao vivo: [nebula-titan.vercel.app](https://nebula-titan.vercel.app).
- Teste o som da sala: a música e os efeitos também contam na nota.
- Se a internet falhar, rode `npm start` e abra http://localhost:5173.

**Desde a v1.8 (jogando ao vivo):** num navegador que nunca jogou, o menu mostra só **INICIAR JOGO, CONTROLES e CONFIGURAÇÕES**, e depois da introdução aparece o **Treino de Voo** (ENTER pula). O **dash agora é no Shift** e o foco no C. Na primeira luta com uma habilidade nova aparece um cartão pedindo para apertar a tecla. O vídeo `demonstracao.mp4` foi gravado antes dessas mudanças.

**Dica para a demonstração:** o modo `?debug` (http://localhost:5173/?debug) tem atalhos: `T` destrói o alvo atual (pula fases), `G` liga a invencibilidade. Útil para mostrar o Ômega ou o final da história sem jogar a campanha inteira.

## Como gerar os slides de novo

Os nomes vêm de [`integrantes.json`](../../integrantes.json). Depois de preencher:

```bash
npm run integrantes                 # atualiza o jogo e todos os documentos
npm install --no-save pptxgenjs     # só na primeira vez (não vira dependência do jogo)
npm run slides                      # recria Nebula-Titan-Apresentacao.pptx
```

O gerador é [`gerar-slides.cjs`](gerar-slides.cjs). As imagens dos slides são as capturas de [`docs/images/`](../images/).
