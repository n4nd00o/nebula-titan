# 🎤 Apresentação: Nebula Titan (A3)

<!-- integrantes:inicio (gerado por npm run integrantes; edite integrantes.json) -->
> **Grupo:** Grupo 19 (Nebula Titan) · **Disciplina:** Usabilidade, desenvolvimento web, mobile e jogos · **Professor:** Elzo Brito dos Santos Filho
>
> **Integrantes:** Luiz Fernando Santana Trindade (RA 824125942) · Luccas Alberto Geraldes Andrade (RA 823116823) · Nathan Silva Barreto (RA 823258091)
<!-- integrantes:fim -->

**Slides:** [`Nebula-Titan-Apresentacao.pptx`](Nebula-Titan-Apresentacao.pptx), 5 slides, abre no PowerPoint e no Google Slides. Cada slide tem **anotações do apresentador** com o que falar.

**Jogo para a demonstração:** [nebula-titan.vercel.app](https://nebula-titan.vercel.app) (ou `npm start` → http://localhost:5173).

## Roteiro (cerca de 8 minutos)

O enunciado sugere: história e objetivo, demonstração jogando, o que cada um fez, uma dificuldade técnica e como foi resolvida, uso de IA.

| # | Slide | O que falar | Tempo |
|---|---|---|---|
| 1 | **Capa** | Grupo, integrantes e o jogo em uma frase: chefes feitos de partes que você destrói, e cada parte muda a luta. | 0:30 |
| 2 | **Linguagem** | JavaScript + Canvas + Web Audio, sem bibliotecas. Por que não pygame: roda no navegador e no celular, o professor joga pelo link. Os conceitos das aulas estão lá: laço `update`/`draw` a 60 quadros por segundo, cenas como estados, colisão por círculos. | 1:30 |
| 3 | **Ideias** | Partimos do Galaga (a aula usou o Snake), mas o foco são os chefes modulares. Depois vieram os 5 mundos, os buffs e a versão para celular. | 1:30 |
| 4 | **História** | Vega, a última piloto da Aliança. Os buffs são os núcleos de energia dos chefes; os mundos são a rota até o Ômega. Aparece no jogo: introdução, textos entre mundos, finais de vitória e derrota. | 1:00 |
| — | **Demonstração** | *Nova Campanha* → mostrar a introdução (ENTER passa, ESC pula) → jogar um setor e um mini-chefe → abrir a pausa (P) e os buffs (I). Para mostrar um chefe rápido: *Duelo com o Titã*. | 2:30 |
| 5 | **Decisões** | Sem engine, chefes descritos como dados, design justo. Dificuldade: um chefe ficava impossível de vencer (a Hidra Glacial na fase 3) e criamos testes que jogam cada chefe e provam que todos podem ser derrotados. Declarar o uso de IA. Cada integrante diz o que fez. | 1:00 |

**Dica para a demonstração:** o modo `?debug` (http://localhost:5173/?debug) tem atalhos: `T` destrói o alvo atual (pula fases), `G` liga a invencibilidade. Útil para mostrar o Ômega ou o final da história sem jogar a campanha inteira.

## Como gerar os slides de novo

Os nomes vêm de [`integrantes.json`](../../integrantes.json). Depois de preencher:

```bash
npm run integrantes                 # atualiza o jogo e todos os documentos
npm install --no-save pptxgenjs     # só na primeira vez (não vira dependência do jogo)
npm run slides                      # recria Nebula-Titan-Apresentacao.pptx
```

O gerador é [`gerar-slides.cjs`](gerar-slides.cjs). As imagens dos slides são as capturas de [`docs/images/`](../images/).
