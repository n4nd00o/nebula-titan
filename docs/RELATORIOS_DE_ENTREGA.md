# 📦 Relatórios de entrega: Nebula Titan

> Os relatórios de cada versão, **na íntegra e sem edição**, como foram entregues ao fim de cada etapa.
> Servem como registro do progresso do projeto. **Nunca apague uma entrada**: versões novas entram no topo.
> O detalhe técnico de cada versão está no [CHANGELOG](../CHANGELOG.md), as decisões no [Diário](DIARIO_DE_DESENVOLVIMENTO.md) e os testes em [TESTES.md](TESTES.md).

---

## [1.6.1] - 2026-11-05

**Pedido:** "Gostei de como ficou, mas acho que no celular pode diminuir a velocidade dos projéteis em mais uns 10%, além disso quero que o modo padrão de controle no celular seja o clássico com assistência ligada"

A **v1.6.1** está pronta e os 346 testes passam.

- **Tiros inimigos no celular 20% mais lentos** (eram 10%). A vida dos inimigos (-25%) e a hitbox menor continuam iguais.
- **Padrão no celular: controle CLÁSSICO com a ajuda ligada.** A ajuda continua em **AUTOMÁTICA**, que no celular já significa **ligada** (a tela de controles mostra "Agora: LIGADA neste aparelho"); assim o computador continua sem a ajuda. O joystick MODERNO segue disponível em CONTROLES → TOQUE.
- Quem já tinha escolhido um controle na tela CONTROLES mantém a escolha; o padrão novo vale para quem nunca mexeu.

---

## [1.6.0] - 2026-11-05

**Pedido:** "Eu queria que os botões ficassem melhor para o celular, atualmente o jogo é feito pensando em jogar no computador, gostaria de que se for jogado no celular fique bem mais fácil, tipo inimigos com menos vida um pouco pelo menos, interface mais voltada para mexer pelo celular, gameplay mais acessível para celular, botões maiores e talvez um joystick para jogar, podendo ter dois modos de controlar, sendo o atual "clássico" e o moderno mais simplificado"

A **v1.6.0** está pronta e os 346 testes passam. As telas foram conferidas por captura (simulando toque no Edge); ainda falta testar num celular de verdade.

#### Dois jeitos de controlar (escolha em CONTROLES → página TOQUE)
| | MODERNO (padrão) | CLÁSSICO |
|---|---|---|
| Mover | **Joystick flutuante**: aparece onde o polegar encostar | A nave segue o dedo |
| Atirar | **Automático, sempre** | Enquanto o dedo encosta |
| Modo foco | Joystick **pouco inclinado** (anel tracejado) | — |
| Dash | Botão grande **DASH** | Botão ou 2º dedo |
| Bomba | Botão grande **BOMBA** | Botão grande **BOMBA** |

#### Mais fácil no celular (Ajuda do celular)
- Chefes e alienígenas com **25% menos vida**.
- Tiros inimigos **10% mais lentos**.
- Hitbox da nave **menor** (3 px em vez de 4).
- Fica em **AUTOMÁTICA**: liga sozinha no celular e não muda nada no computador. Dá para forçar **LIGADA** ou **DESLIGADA**.

#### Interface para o dedo
- Botões de bomba e dash **quase do dobro do tamanho**, com anel mostrando a recarga.
- Menu principal com opções em **botões altos**; a tela de CONTROLES abre direto na página de toque, com um desenho de cada esquema.
- Pausa sem teclas de teclado no celular; mostra o esquema e a ajuda.
- Os botões aparecem já na primeira tela (o jogo detecta o celular ao abrir).

#### O que não mudou
- No computador, tudo continua igual (o mouse nunca cria joystick).
- Os recordes não separam quem jogou com a ajuda ligada.


---

## [1.5.0] - 2026-11-04

**Pedido:** "O chefe final está muito fácil agora que terminou todos os outros buffs. Quero uma tela que mostre os buffs que tenho, quero poder mudar no computador os botões das habilidades e quero adicionar uma fase final final com um chefe final extremamente difícil e com 6 mini-chefes com buffs únicos."

A **v1.5.0** está pronta. Os 333 testes passam. O equilíbrio do Mundo 5 e do novo Leviatã ainda não foi testado por uma pessoa: só pelos testes e pelas capturas de tela.

#### Chefe final mais difícil
- **Os chefes de mundo agora escalam com os seus buffs:** cada buff que você tem dá a eles +4% de vida e +1,2% de velocidade de ataque. Vale para o Titã, a Hidra, a Égide, o Arconte, o Leviatã e o Ômega. Com os 16 buffs dos Mundos 1 a 4, o Leviatã chega com cerca de 64% a mais de vida e 19% a mais de ataque. Mini-chefes não escalam, porque são eles que dão os buffs.
- **O Leviatã tem 10 fases** (eram 8):
  - **Defesas do Núcleo:** quatro pilares e dois raios giratórios.
  - **Núcleo:** ganhou um canhão de raio que mira e avisa antes.
  - **Último Suspiro:** o núcleo reacende com espirais densas, raios, minas e lasers.

#### Mundo 5: Singularidade (a fase final final)
Ele abre depois do Leviatã e não tem setores. São 6 mini-chefes em dois círculos: você vence os 3 de baixo, em qualquer ordem, para abrir os 3 de cima.

| Guardião | Mecânica | Buff único |
|---|---|---|
| **Cronos** | Anéis congelados que disparam de repente e ponteiros-raio | **Tempo Bala**: no modo foco, tiros inimigos 35% mais lentos |
| **Reflexo** | Cristais que ricocheteiam nas bordas e tiros espelhados | **Ricochete**: tiro em blindagem vira míssil |
| **Parasita** | Bolsas que regeneram, esporos que perseguem e gravidade | **Vampirismo**: parte de chefe destruída restaura o escudo |
| **Legião** | Kamikazes e paredes de laser | **Orbitais**: dois orbes apagam projéteis |
| **Artilheiro** | Canhões que miram, avisam e disparam raios | **Supercarga**: raio com 8x o dano a cada 5 s |
| **Fênix** | Chuva de brasas e um coração que renasce (3 fases) | **Renascer**: uma vez por luta, você não perde a vida |

Vencer os 6 dá o bônus **Ascensão** (+25% de dano). Depois vem o **ÔMEGA**, o criador da frota: 8 fases, cada uma usando a arma de um guardião, e um núcleo final que regenera e usa tudo ao mesmo tempo. Ele tem +140% de vida base, além da escala pelos buffs.

#### Tela de buffs
**MEUS BUFFS** mostra os 23 buffs, um mundo por página: os que você tem aparecem com o efeito e de quem vieram, e os que faltam aparecem como "???" com o chefe que os dá. Dá para abrir:
- na pausa (botão ou tecla `I`), e a luta continua do mesmo ponto;
- no Mapa de Progresso (botão BUFFS);
- no título.

#### Teclas configuráveis
A opção **CONTROLES** no título troca as teclas de todas as ações (mover, atirar, foco, dash, bomba, pausa), com uma tecla principal e uma alternativa.
- Se a tecla já era de outra ação, ela passa para a nova e a tela avisa.
- Teclas do sistema (Enter, Esc, I, M...) são reservadas.
- Tem a opção "restaurar padrão", e tudo fica salvo no navegador.
- Os textos de ajuda no título e na pausa mostram as suas teclas.

#### Como verifiquei
- **Testes:**
  - os 7 chefes novos entraram sozinhos nos testes genéricos e na garantia contra chefes imortais;
  - os testes novos rodam a cena de jogo de verdade para provar o efeito de cada buff;
  - as teclas foram testadas na lógica e no `Input` real.
- **Bug achado pelos testes:** o véu do Ômega começava a fase intangível. Já está corrigido.
- **Capturas de tela** de todos os chefes novos, das 8 fases do Ômega, das fases novas do Leviatã, dos mapas, da pausa e das telas novas. Elas mostraram ligações do mapa por cima dos nomes, e eu corrigi.

A documentação (READMEs, CHANGELOG, GDD, arquitetura, planejamento, diário, catálogo de testes e guia de sprites) está atualizada.

#### O que fica com você
- **Jogar o Mundo 5 e o Leviatã novo.** O Ômega foi feito para ser extremamente difícil. Se algum chefe estiver injusto ou fácil, me diga qual e em que fase.
- **Sprites desenhados à mão (opcional):** os 24 sprites novos estão listados no `docs/GUIA_DE_SPRITES.md`.

---

## [1.4.1] - 2026-11-04

**Pedido:** "A Hidra Glacial, chefe do setor 2, não tem como destruir os pontos fracos de cima na fase 3."

A **v1.4.1** corrige a Hidra Glacial. Os 257 testes passam.

#### O problema
Na fase 3, as escamas de baixo ficam logo abaixo das de cima. Quando elas caíam, o que sobrava embaixo das escamas de cima era o **corpo** da Hidra, que é sólido e indestrutível. O tiro batia no corpo e ricocheteava. Só uma fresta de 3 px na borda de uma escama deixava o tiro passar.

#### Por que o teste de garantia não pegou
Ele aceitava **uma única coluna** de acerto como prova de que dava para atingir o alvo. A fresta de 3 px bastava para o teste, mas ninguém consegue mirar nela jogando.

#### O que mudou
- **Teste mais rígido primeiro:** um ponto fraco só conta como alcançável se houver uma **janela de tiro de pelo menos 12 px**. Com essa regra o teste passou a falhar na Hidra, e em nenhum outro chefe. Isso prova que agora ele enxerga esse tipo de problema em todos os 17.
- **Correção:** o corpo deixa de bloquear tiros a partir da fase das escamas. As escamas de cima ficaram com uma janela de cerca de 33 px cada. Continua valendo a ordem: derrube as de baixo primeiro.
- **Teste de regressão** específico da Hidra.

A documentação (CHANGELOG, diário, `docs/TESTES.md` e READMEs) está atualizada, e este relatório também foi arquivado em `docs/RELATORIOS_DE_ENTREGA.md`.

#### O que fica com você
- Jogar a fase 3 da Hidra de novo para confirmar.

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
