# 🎤 Apresentação: Nebula Titan (A3)

<!-- integrantes:inicio (gerado por npm run integrantes; edite integrantes.json) -->
> **Grupo:** Grupo 19 (Nebula Titan) · **Disciplina:** Usabilidade, desenvolvimento web, mobile e jogos · **Professor:** Elzo Brito dos Santos Filho
>
> **Integrantes:** Luiz Fernando Santana Trindade (RA 824125942) · Luccas Alberto Geraldes Andrade (RA 823116823) · Nathan Silva Barreto (RA 823258091)
<!-- integrantes:fim -->

**Slides:** [`Nebula-Titan-Apresentacao.pptx`](Nebula-Titan-Apresentacao.pptx), 5 slides, abre no PowerPoint e no Google Slides. Cada slide tem **anotações do apresentador** com o que falar.

**Jogo para a demonstração:** [nebula-titan.vercel.app](https://nebula-titan.vercel.app) (ou `npm start` → http://localhost:5173).

## Roteiro de falas (cerca de 5 minutos, Luiz e Nathan)

O enunciado sugere: história e objetivo, demonstração jogando, o que cada um fez, uma dificuldade técnica e como foi resolvida, uso de IA. Tudo isso está no roteiro abaixo.

**Divisão:** o **Luiz** fala da parte técnica (slides 1, 2 e 5) e narra a demonstração. O **Nathan** fala das fases e da história (slides 3 e 4), joga na demonstração e fecha a apresentação. O Luccas não apresenta, mas é citado na capa e no fechamento.

| Parte | Quem | Tempo |
|---|---|---|
| Slide 1 · Capa | Luiz | 0:25 |
| Slide 2 · Linguagem | Luiz | 0:50 |
| Slide 3 · Ideias | Nathan | 0:45 |
| Slide 4 · História | Nathan | 0:40 |
| Demonstração | Nathan joga, Luiz narra | 1:30 |
| Slide 5 · Decisões + fechamento | Luiz, depois Nathan | 0:50 |

> As falas são uma base: não precisa decorar palavra por palavra. O importante é passar a ideia de cada slide no tempo. As mesmas falas estão nas **anotações** de cada slide do PowerPoint.

### Slide 1 · Capa (Luiz, 0:25)

> **LUIZ:** Boa noite, professor. Somos o Grupo 19: eu sou o Luiz, este é o Nathan, e o Luccas também faz parte do grupo. O nosso jogo é o **Nebula Titan**, um jogo de nave no estilo arcade em que os chefes são montados por partes. Cada parte que você destrói muda a aparência e os ataques do chefe.

### Slide 2 · Linguagem (Luiz, 0:50)

> **LUIZ:** Fizemos o jogo em **JavaScript**, que roda direto no navegador, com o **Canvas** para desenhar e a **Web Audio** para o som. A gente não usou pygame porque a disciplina também trata de web e mobile: assim o jogo abre por um link, até no celular, sem instalar nada.
>
> Não usamos nenhuma biblioteca. Os conceitos são os mesmos das aulas: um laço que atualiza e desenha o jogo 60 vezes por segundo, cada tela é um estado, e a colisão é feita com círculos. A arte e as músicas são geradas pelo próprio código, então não dependemos de arquivos de terceiros. E o projeto tem 353 testes automáticos.

### Slide 3 · Ideias (Nathan, 0:45)

> **NATHAN:** A aula começou com o Snake. A gente partiu do Galaga, mas mudou o foco para as lutas contra chefes.
>
> A campanha tem **cinco mundos**. Cada mundo tem setores com inimigos em formação, três mini-chefes que você enfrenta na ordem que quiser, e um chefe no final. Cada mini-chefe dá um **buff**, como tiro triplo ou dash. Os chefes ficam mais fortes conforme os seus buffs, então a dificuldade sempre cresce. E dá para jogar no celular, com controles na tela.

### Slide 4 · História (Nathan, 0:40)

> **NATHAN:** Agora a história. No ano 2187, a armada do **Ômega**, liderada pelo **Titã**, apagou as colônias. A **Vega**, última piloto da Aliança, foge na nave NT-01 para destruir o Ômega no centro da galáxia.
>
> A história conversa com o jogo: os buffs são os núcleos de energia que os chefes deixam, e os mundos são o caminho até o Ômega. Ela aparece dentro do jogo, na introdução, entre cada mundo e nos finais de vitória e de derrota, com uma música própria.

### Demonstração (Nathan joga, Luiz narra, 1:30)

| O Nathan faz | O Luiz fala |
|---|---|
| Na tela inicial, escolhe **NOVA CAMPANHA** | **LUIZ:** Agora o Nathan vai mostrar o jogo funcionando. |
| Deixa a 1ª página da introdução aparecer, aperta **ENTER** e depois **ESC** | **LUIZ:** Essa é a introdução da história. O texto aparece letra por letra; o ENTER passa a página e o ESC pula. |
| Joga o primeiro setor por uns 30 segundos | **LUIZ:** Os inimigos entram em formação, como no Galaga. Em cima ficam os pontos e o recorde; embaixo, as vidas. |
| Aperta **P** e depois **I** | **LUIZ:** O P pausa o jogo, e o I mostra os buffs que o jogador já tem. |
| Volta ao menu (**Q** na pausa) e escolhe **DUELO COM O TITÃ** | **LUIZ:** No duelo dá para ver um chefe. Os colchetes amarelos mostram o ponto fraco. Quando uma asa cai, o chefe fica inclinado e passa a atacar de outro jeito. |
| Joga até acabar o tempo e volta aos slides | **LUIZ:** Voltando aos slides. |

### Slide 5 · Decisões e fechamento (Luiz e Nathan, 0:50)

> **LUIZ:** Três decisões guiaram o projeto. Primeiro, **sem engine**, para entender o que uma engine faz por baixo. Segundo, os **chefes são descritos como dados**: um chefe novo é só um arquivo novo. Terceiro, o jogo tem que ser **justo**: os ataques são avisados antes e a área da nave que leva dano é pequena.
>
> A maior dificuldade foi um chefe impossível de vencer: na fase 3 da Hidra Glacial, o corpo bloqueava todos os tiros. A gente criou testes que jogam cada chefe sozinhos e provam que todos podem ser derrotados.
>
> Usamos **IA**, o Claude Code, como assistente no código, nos testes, na documentação e nos slides. Isso está declarado no README, e as ideias e decisões foram do grupo.
>
> **NATHAN:** Na divisão de tarefas, o Luiz fez a programação, o game design e a documentação, e eu e o Luccas cuidamos das músicas e do design das fases. Obrigado! Alguma pergunta?

### Se o professor perguntar

| Pergunta provável | Quem responde | Resposta curta |
|---|---|---|
| Onde fica o laço principal? | Luiz | Em `src/core/Game.js`: o `loop` chama `update` em passos fixos de 1/60 s e depois `draw`. |
| Como funciona a colisão? | Luiz | Por círculos: duas coisas colidem quando a distância entre os centros é menor que a soma dos raios (`src/systems/Collision.js`). |
| Como a dificuldade aumenta? | Nathan | Cada mundo tem inimigos mais rápidos e resistentes, e os chefes de mundo ganham vida e ataque conforme os buffs do jogador. |
| Onde estão os textos da história? | Nathan | Em `src/story/story.js`; a tela que mostra os textos é a `StoryScene` (`src/scenes/StoryScene.js`). |
| Como foi o uso de IA? | Luiz | Claude Code como assistente; tudo foi revisado, testado e jogado pelo grupo. A declaração está no README, item 9. |

### Antes de começar

- Deixe o jogo aberto em outra aba: [nebula-titan.vercel.app](https://nebula-titan.vercel.app).
- Teste o som da sala: a música e os efeitos também contam na nota.
- Se a internet falhar, rode `npm start` e abra http://localhost:5173.

**Dica para a demonstração:** o modo `?debug` (http://localhost:5173/?debug) tem atalhos: `T` destrói o alvo atual (pula fases), `G` liga a invencibilidade. Útil para mostrar o Ômega ou o final da história sem jogar a campanha inteira.

## Como gerar os slides de novo

Os nomes vêm de [`integrantes.json`](../../integrantes.json). Depois de preencher:

```bash
npm run integrantes                 # atualiza o jogo e todos os documentos
npm install --no-save pptxgenjs     # só na primeira vez (não vira dependência do jogo)
npm run slides                      # recria Nebula-Titan-Apresentacao.pptx
```

O gerador é [`gerar-slides.cjs`](gerar-slides.cjs). As imagens dos slides são as capturas de [`docs/images/`](../images/).
