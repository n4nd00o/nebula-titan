# 📦 Relatórios de entrega: Nebula Titan

> Os relatórios de cada versão, **na íntegra e sem edição**, como foram entregues ao fim de cada etapa.
> Servem como registro do progresso do projeto. **Nunca apague uma entrada**: versões novas entram no topo.
> O detalhe técnico de cada versão está no [CHANGELOG](../CHANGELOG.md), as decisões no [Diário](DIARIO_DE_DESENVOLVIMENTO.md) e os testes em [TESTES.md](TESTES.md).

---

## [1.4.0] - 2026-11-04

**Pedido:** corrigir o Vórtice imortal, criar testes de garantia para que nenhum outro chefe fique assim, garantir as hitboxes, fazer um mapa de progresso dos 4 mundos com as fases internas e melhorar o jogo para celular.

A **v1.4.0** está pronta e publicada (commit `9232ca2`). A Vercel deve atualizar https://nebula-titan.vercel.app sozinha em alguns minutos. Os 253 testes passam.

#### Chefes imortais e hitboxes
- **Vórtice:** o anel do casco é um aro fechado em volta do Olho do Furacão. Todo tiro vindo de baixo batia no anel antes de chegar ao Olho e ricocheteava. Agora o anel deixa de bloquear tiros na fase 2.
- **Teste de garantia novo:** ele luta contra cada um dos 17 chefes como o jogador faz, varrendo a tela com tiros que sobem do fundo. Só conta o dano quando o tiro chega ao ponto fraco sem bater antes em outra peça. Se uma fase passar de 120 s, o teste acusa chefe imortal. Ele achou um segundo caso: o **Oráculo** (Mundo 4) tinha o mesmo defeito, e já está corrigido.
- **Por que o teste antigo não pegou:** ele só testava um tiro parado no centro da peça, sem o caminho que o tiro faz até lá.
- **Hitboxes:** agora há testes de que a área de colisão bate com o desenho e de que nenhum tiro acerta fora dele. Isso revelou que a hitbox dos alienígenas era menor que o sprite, e tiros na ponta das asas passavam direto. Já corrigi. O dano quando um alienígena encosta em você continua igual.

#### Mapa de progresso
- **Galáxia:** os 4 mundos aparecem como planetas ligados por uma rota. Cada um mostra se é **VOCÊ ESTÁ AQUI**, **CONCLUÍDO** ou **BLOQUEADO**, e quantas fases você já venceu.
- **Fases internas:** tocar em um mundo mostra as fases dele, de dois setores a 3 mini-chefes e o chefe (e o Leviatã no Mundo 4). Verde é vencida, amarelo é disponível e cinza é bloqueada.
- **Treino:** fases vencidas podem ser rejogadas. Isso não muda o save nem o recorde.
- **Onde aparece:** como opção no título, pelo botão **MAPA** (ou `Tab`) na Rota de Ataque e sozinho ao concluir um mundo, com a nave viajando até o próximo planeta.

#### Celular
- Botões **DASH**, **BOMBA** e **PAUSA** na tela. A pausa tem os botões **CONTINUAR** e **MENU**, e todos os menus funcionam só com toque.
- **Tela cheia** em modo retrato, aviso para girar o celular e espaço reservado para o notch.
- **Vibração** ao tomar dano, usar a bomba e vencer. Dá para desligar no título.
- **Dá para instalar como app (PWA)** e jogar sem internet depois da primeira visita.
- **Bug corrigido:** tocar em área vazia de um menu iniciava a opção selecionada sem querer.

Conferi as telas novas com capturas no Edge headless e ajustei o layout do mapa por causa delas. A documentação PT/EN, o CHANGELOG e o diário estão atualizados.

#### O que fica com você
- **Testar num celular de verdade:** abra o link, instale ("Adicionar à tela inicial") e jogue um pouco. O Edge headless não simula telas com menos de cerca de 500 px de largura, então os toques reais não foram testados.
- **Rever o Vórtice e o Oráculo:** agora dá para chegar à fase 2 deles e vencer. Se ficaram fáceis ou difíceis demais, me diga.

---

## [1.3.0] - 2026-11-03

**Pedido:** sistema de progressão com dificuldade crescente, mantendo setores, mini-chefes, chefe e chefe final.

A **v1.3.0** está pronta e publicada (commit `534bdf1`). A Vercel deve publicar sozinha em https://nebula-titan.vercel.app nos próximos minutos. Os 172 testes passam. O equilíbrio dos Mundos 2 a 4 ainda não foi testado por uma pessoa, só por simulação.

#### Como ficou a campanha
| Mundo | Setores (inimigo novo) | Mini-chefes → buff | Chefe |
|---|---|---|---|
| **1 · Nebulosa Carmim** | 1-2 (verde, laranja) | Sentinela, Colmeia, Ceifador | Nebula Titan |
| **2 · Cinturão Glacial** | 3-4 (**azul blindado**) | Prisma → Tiro Triplo · Vórtice → Onda de Choque · Escaravelho → Carapaça | **Hidra Glacial** |
| **3 · Forja Estelar** | 5-6 (**roxo**, que se divide em 2) | Martelo → Sobrecarga · Gêmeos → Ala Dupla · Fornalha → Mísseis | **Égide** |
| **4 · Vazio Abissal** | 7-8 (**vermelho kamikaze**) | Espectro → Fantasma · Oráculo → Foco Amplificado · Eco → Escudo Reativo | **Arconte** → **LEVIATÃ** |

- **Chefes inéditos:** os 12 chefes novos usam mecânicas diferentes entre si. Por exemplo:
  - gravidade que puxa a nave;
  - uma carapaça que abre e fecha;
  - cabeças da Hidra que renascem se você não cortar as duas em 9 s;
  - raios letais com aviso;
  - um chefe que fica intangível;
  - o Eco, uma cópia sombria da sua nave.
- **Dificuldade crescente:** a cada mundo os ataques e os tiros inimigos ficam mais rápidos e os chefes chegam com mais vida. Simulei a duração das lutas: os chefes ficam mais longos a cada mundo (Titã ~80 s, Leviatã ~122 s).
- **Progresso salvo:** o jogo salva após cada vitória. O título ganhou a opção **CONTINUAR** e a **seleção de mundo**. Ao escolher um mundo, você começa nele com os buffs dos mundos anteriores.
- **Identidade de cada mundo:** cada um tem cor de fundo, estrelas e música próprias.

#### Como verifiquei
- **Capturas de tela** no Edge headless de todos os chefes novos e de várias fases, do mapa e do título. Isso pegou 3 problemas, que corrigi: um texto do HUD sobreposto, uma sobreposição no mapa e a apresentação do mundo sendo coberta pelo aviso da onda.
- **Simulação da cena completa** dos 25 encontros, com todos os buffs, até a vitória e a troca de mundo. Também cobri game over, continue e o save.
- **Bug corrigido:** um projétil que se divide gerava 60 tiros em vez de 6.

A documentação PT/EN, o CHANGELOG e o diário estão atualizados.

#### O que fica com você
- **Jogar os Mundos 2 a 4.** Se algum chefe estiver difícil ou fácil demais, me diga qual e eu ajusto.
- **Sprites desenhados à mão (opcional):** a arte gerada por código está completa. Se quiser desenhar, os 45 sprites novos estão listados com os tamanhos em `docs/GUIA_DE_SPRITES.md`.

---

## Versões anteriores (1.0.0 a 1.2.1)

Essas versões foram entregues antes de os relatórios serem arquivados. O registro delas está no [Diário de Desenvolvimento](DIARIO_DE_DESENVOLVIMENTO.md) e no [CHANGELOG](../CHANGELOG.md).
