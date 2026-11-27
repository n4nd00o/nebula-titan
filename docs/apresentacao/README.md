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

**Divisão em dois blocos, sem alternar:** o **Luiz** abre e apresenta toda a parte técnica (slides 1 a 3). Depois passa a palavra uma única vez, e o **Nathan** apresenta as escolhas de design e a história (slides 4 e 5), faz a demonstração e fecha. O Luccas não apresenta, mas é citado na abertura e no fechamento.

| Bloco | Parte | Tempo |
|---|---|---|
| **Luiz** (técnico) | Slide 1 · Capa | 0:20 |
| | Slide 2 · Linguagem | 0:50 |
| | Slide 3 · Decisões técnicas, dificuldade e IA | 0:50 |
| **Nathan** (design) | Slide 4 · Design | 0:50 |
| | Slide 5 · História | 0:40 |
| | Demonstração | 1:10 |
| | Fechamento | 0:15 |

> As falas são uma base: não precisa decorar palavra por palavra. As mesmas falas estão nas **anotações** de cada slide do PowerPoint, sem o nome de quem fala.

### Bloco do Luiz: parte técnica

**Slide 1 · Capa (0:20)**

> Boa noite, professor. Somos o Grupo 19, formado pelo Luiz, pelo Luccas e pelo Nathan. O nosso jogo é o **Nebula Titan**, um jogo de nave no estilo arcade em que os chefes são montados por partes. Cada parte que você destrói muda a aparência e os ataques do chefe.

**Slide 2 · Linguagem (0:50)**

> Fizemos o jogo em **JavaScript**, que roda direto no navegador, com o **Canvas** para desenhar e a **Web Audio** para o som. A gente não usou pygame porque a disciplina também trata de web e mobile: assim o jogo abre por um link, até no celular, sem instalar nada.
>
> Não usamos nenhuma biblioteca. Os conceitos são os mesmos das aulas: um laço que atualiza e desenha o jogo 60 vezes por segundo, cada tela é um estado, e a colisão é feita com círculos. A arte e as músicas são geradas pelo próprio código, então não dependemos de arquivos de terceiros. E o projeto tem 353 testes automáticos.

**Slide 3 · Decisões técnicas (0:50)**

> Agora, três decisões técnicas. Primeiro, **não usamos engine**: o laço, a colisão, o desenho e o áudio foram escritos por nós, para entender o que uma engine faz por baixo. Segundo, os **chefes são descritos como dados**: um motor único lê as partes, as fases e os ataques de cada chefe, então um chefe novo é só um arquivo novo. Terceiro, o **mesmo código roda no computador e no celular**, e o jogo pode ser instalado como app e jogado sem internet.
>
> A maior dificuldade técnica foi um chefe impossível de vencer: na fase 3 da Hidra Glacial, o corpo bloqueava todos os tiros. Criamos testes que jogam cada chefe sozinhos e provam que todos podem ser derrotados.
>
> Usamos **IA**, o Claude Code, como assistente no código, nos testes, na documentação e nos slides. Isso está declarado no README, e as ideias e decisões foram do grupo.
>
> Agora o Nathan vai falar das escolhas de design e da história do jogo.

### Bloco do Nathan: design, história e demonstração

**Slide 4 · Design (0:50)**

> A aula começou com o Snake. A gente partiu do Galaga, mas mudou o foco para as lutas contra chefes: asas, canhões e escudos são partes separadas, e arrancar uma muda o visual e os ataques do chefe.
>
> A campanha tem **cinco mundos**. Cada mundo tem setores com inimigos em formação, três mini-chefes que você enfrenta na ordem que quiser, e um chefe no final. Cada mini-chefe dá um **buff**, como tiro triplo ou dash, e os chefes ficam mais fortes conforme os seus buffs, então a dificuldade sempre cresce.
>
> Também quisemos que o jogo fosse **justo**: os ataques são avisados antes, a área da nave que leva dano é pequena, e dá para pausar e continuar. No celular, os controles ficam na tela.

**Slide 5 · História (0:40)**

> Agora a história. No ano 2187, a armada do **Ômega**, liderada pelo **Titã**, apagou as colônias. A **Vega**, última piloto da Aliança, foge na nave NT-01 para destruir o Ômega no centro da galáxia.
>
> A história conversa com o jogo: os buffs são os núcleos de energia que os chefes deixam, e os mundos são o caminho até o Ômega. Ela aparece dentro do jogo, na introdução, entre cada mundo e nos finais de vitória e de derrota, com uma música própria.

**Demonstração (1:10)**: o Nathan joga e comenta. As falas são curtas para dar para jogar ao mesmo tempo.

| O que fazer no jogo | O que falar |
|---|---|
| Na tela inicial, escolher **NOVA CAMPANHA** | Vou mostrar o jogo funcionando. |
| Deixar a 1ª página da introdução aparecer, apertar **ENTER** e depois **ESC** | Essa é a introdução. ENTER passa a página e ESC pula. |
| Jogar o primeiro setor por uns 30 segundos | Os inimigos entram em formação, como no Galaga. Em cima ficam os pontos; embaixo, as vidas. |
| Apertar **P** e depois **I** | O P pausa, e o I mostra os buffs. |
| Voltar ao menu (**Q** na pausa) e escolher **DUELO COM O TITÃ** | Aqui é um chefe. Os colchetes amarelos mostram o ponto fraco, e quando uma asa cai ele muda os ataques. |

**Fechamento (0:15)**

> Na divisão de tarefas, o Luiz fez a programação, o game design e a documentação, e eu e o Luccas cuidamos das músicas e do design das fases. Obrigado! Alguma pergunta?

### Se o professor perguntar

| Pergunta provável | Quem responde | Resposta curta |
|---|---|---|
| Onde fica o laço principal? | Luiz | Em `src/core/Game.js`: o `loop` chama `update` em passos fixos de 1/60 s e depois `draw`. |
| Como funciona a colisão? | Luiz | Por círculos: duas coisas colidem quando a distância entre os centros é menor que a soma dos raios (`src/systems/Collision.js`). |
| Como foi o uso de IA? | Luiz | Claude Code como assistente; tudo foi revisado, testado e jogado pelo grupo. A declaração está no README, item 9. |
| Como a dificuldade aumenta? | Nathan | Cada mundo tem inimigos mais rápidos e resistentes, e os chefes de mundo ganham vida e ataque conforme os buffs do jogador. |
| Por que a história com a Vega? | Nathan | Ela explica as mecânicas: os buffs são os núcleos de energia dos chefes e os mundos são a rota até o Ômega. Os textos ficam em `src/story/story.js`. |

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
