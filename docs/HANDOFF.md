# 🔧 Handoff técnico: Nebula Titan

<!-- integrantes:inicio (gerado por npm run integrantes; edite integrantes.json) -->
> **Grupo:** Grupo 19 (Nebula Titan) · **Disciplina:** Usabilidade, desenvolvimento web, mobile e jogos · **Professor:** Elzo Brito dos Santos Filho
>
> **Integrantes:** Luiz Fernando Santana Trindade (RA 824125942) · Luccas Alberto Geraldes Andrade (RA 823116823) · Nathan Silva Barreto (RA 823258091)
<!-- integrantes:fim -->

> Para quem vai **editar o código**. O README já explica o jogo; aqui fica só o que falta para mexer nele sem quebrar nada.
> Versão do código descrita: **1.7.0**. Detalhes mais profundos: [ARQUITETURA.md](ARQUITETURA.md).

## 1. Visão rápida

- JavaScript puro (módulos ES) + Canvas 2D (480×640) + Web Audio. **Sem dependências** no jogo.
- Ponto de entrada: `index.html` → `src/main.js` → `new Game(canvas).start()`.
- Tudo é **orientado a dados**: chefes, setores, mundos e buffs são objetos em arquivos próprios; o motor lê esses dados.
- Arte e som são gerados por código (sem arquivos de imagem ou áudio obrigatórios).
- Textos da interface em **português**.

## 2. Como o código funciona

### Laço principal (`src/core/Game.js`)

- `loop()` roda a cada quadro do navegador (`requestAnimationFrame`).
- Acumula o tempo e chama `update(1/60)` em **passos fixos** (`FIXED_STEP` em `config.js`); depois chama `draw()` uma vez.
- O atraso máximo por quadro é limitado (`MAX_FRAME_TIME` = 0,25 s), para a aba voltar do segundo plano sem "pular" segundos.
- `update(dt)`: teclas globais (M som, V vibração, F tela cheia) → `starfield.update` → `scene.update(dt)` → `input.endStep()`.
- `draw()`: fundo → estrelas → `scene.draw(ctx)` → aviso "SOM OFF".

### Cenas (máquina de estados)

- Só existe **uma cena ativa**: `game.scene`.
- Trocar de tela: `game.changeScene(novaCena)`, que chama `exit()` da antiga e `enter()` da nova.
- Toda cena tem `update(dt)` e `draw(ctx)`; `enter()` e `exit()` são opcionais.

| Cena | Arquivo | Papel |
|---|---|---|
| Título | `src/scenes/TitleScene.js` | Menu: continuar, nova campanha, mundo, mapa, buffs, controles, duelo; botões do topo (história, som, vibração, tela cheia) |
| História | `src/scenes/StoryScene.js` | Páginas de texto datilografado; recebe `pages` e `next()` (a cena seguinte) |
| Luta | `src/scenes/PlayScene.js` | Um encontro jogável (setor de ondas ou chefe). Estados internos: `playing`, `paused`, `gameover`, `victory` |
| Rota de Ataque | `src/scenes/MapScene.js` | Escolha do próximo mini-chefe do mundo atual |
| Mapa de Progresso | `src/scenes/ProgressScene.js` | Galáxia com os 5 mundos; rejogar fases vencidas (treino) |
| Meus Buffs | `src/scenes/BuffsScene.js` | Lista de buffs conquistados |
| Controles | `src/scenes/ControlsScene.js` | Trocar teclas e esquema de toque |

### Fluxo entre cenas

- **Nova campanha:** Título → História (introdução) → Luta (setor 1) → Luta (setor 2) → Rota de Ataque → Luta (mini-chefe) … → Luta (chefe do mundo).
- **Mundo vencido:** Luta → História (texto entre mundos) → Mapa de Progresso → Rota de Ataque do próximo mundo.
- **Vitória final (Ômega):** Luta → História (final + créditos) → Título.
- **Fim de jogo na campanha:** ENTER = continuar (mesma luta, pontos zerados, buffs mantidos); ESC = desistir → História (final de derrota) → Título.
- O que acontece depois de cada luta está em `PlayScene.continueAfterEnd()` e `PlayScene.exitToMenu()`.

### Arquivos principais de `src/`

| Arquivo | O que faz |
|---|---|
| `main.js` | Cria o `Game` e registra o service worker (modo offline) |
| `config.js` | Constantes: tamanho da tela, passo fixo, valores do jogador (`PLAYER`), cores da interface |
| `encounters.js` | Junta setores (`STAGES`) e chefes (`BOSSES`) em `ENCOUNTERS`, por id |
| `core/Game.js` | Laço, troca de cenas, tela cheia, escala do canvas |
| `core/Input.js` | Teclado, mouse e toque → ações (`isDown`, `wasPressed`, `tap`) |
| `core/KeyBindings.js` | Teclas padrão (`DEFAULT_BINDINGS`), fixas (`FIXED_BINDINGS`) e troca de teclas |
| `core/TouchControls.js` | Joystick, botões de toque e "ajuda do celular" (`MOBILE_ASSIST`) |
| `core/AudioEngine.js` | Efeitos (`SFX`) e músicas (`TRACKS`) sintetizados |
| `core/Storage.js` | `localStorage` com proteção contra erro |
| `core/Haptics.js` | Vibração no celular |
| `scenes/PlayScene.js` | A luta: jogador, tiros, colisões, buffs, HUD, pausa, fim de luta, salvar progresso. **O maior arquivo (~1.450 linhas)** |
| `boss/Boss.js` | Motor genérico de chefes: lê a definição, controla fases, partes, dano e desenho |
| `boss/BossPart.js` | Uma peça do chefe: vida, blindagem, regeneração, estados visuais de dano |
| `boss/bosses/*.js` | Uma definição por chefe (24 chefes) |
| `boss/bosses/index.js` | Registro `BOSSES` (id → definição) |
| `boss/patterns.js` | Padrões de tiro reutilizáveis (`fireSpread`, `aimAtPlayer`...) |
| `boss/sweepers.js`, `beams.js`, `phasing.js`, `BossLaser.js` | Raios, lasers e "fase espectral" usados por vários chefes |
| `stages/stageData.js` | Os 8 setores de ondas (`STAGE_1`…`STAGE_8`, registro `STAGES`) |
| `stages/WaveStage.js` | "Diretor" das ondas: cria formações, mergulhos e tiros |
| `entities/` | Jogador (`Player.js`), tiros (`projectiles.js`), alienígenas (`FormationEnemy.js`, `alienTypes.js`, `Minion.js`), ala (`Wingman.js`), power-ups, parede de laser |
| `systems/Campaign.js` | **Mundos (`WORLDS`), buffs (`BUFFS`), recompensas (`REWARDS`)** e o estado da campanha (save, vidas, pontos) |
| `systems/Progress.js` | Estado do Mapa de Progresso |
| `systems/Scoring.js` | Rank e bônus de cada luta |
| `systems/Collision.js` | Colisão círculo × círculo e ponto × segmento |
| `systems/ParticleSystem.js`, `Starfield.js` | Partículas e fundo de estrelas |
| `graphics/SpriteBank.js` | Gera as imagens a partir dos dados de sprite; troca por PNG se houver em `assets/sprites/manifest.json` |
| `graphics/spriteData*.js` | Pixel art em texto (matrizes de cores) |
| `graphics/palette.js`, `text.js` | Paleta e texto com a fonte do jogo |
| `story/story.js` | Textos da história (introdução, entre mundos, finais) |
| `story/team.js` | Integrantes (gerado por `npm run integrantes`, não editar à mão) |

## 3. Onde e como alterar

### Chefes

- Cada chefe é um arquivo em `src/boss/bosses/` que exporta um objeto (ex.: `SENTINEL` em `sentinel.js`).
- Campos principais: `id`, `name`, `intro`, `parTime`, `size`, `timing`, `parts`, `phases`, e ganchos opcionais (`update`, `tilt`, `drawBehind`, `drawFront`...).
- **Partes (`parts`):** `id`, `sprite`, posição `ox`/`oy`, `hp`, `phase` (em qual fase vira alvo), `look` (`'remove'` some, `'husk'` vira carcaça), `armor`, `regen`, `solidUntilPhase`, `points`.
- **Fases (`phases`):** `id`, `title`, `hint`, `targets` (ids das partes a destruir), `move(boss)` (movimento) e `attack(boss, dt)` (tiros).
- Tiros: use as funções de `boss/patterns.js`.
- **Chefe novo:** criar o arquivo → registrar em `boss/bosses/index.js` (`BOSSES`) → colocar o id num mundo em `WORLDS` (`minis` ou `boss`) → se for mini-chefe, dar um buff em `REWARDS`.
- Vida do chefe por mundo: `WORLDS[n].hpScale` (ex.: `{ titan: 1.8 }`).
- Escala com os buffs do jogador: `BUFF_HP_SCALE` e `BUFF_ATTACK_SCALE` em `Campaign.js` (usados em `Campaign.difficultyFor`).
- Se o teste de alcance falhar: alguma peça sólida está na frente do ponto fraco. Use `solidUntilPhase`, `revealedBy` ou mova a peça (o tiro do jogador vem de baixo).

### Fases (setores de ondas)

- Arquivo: `src/stages/stageData.js`. Cada setor tem `id`, `kind: 'waves'`, `name`, `intro`, `parTime`, `music` e `waves`.
- Cada onda: `title`, `hint`, `diveEvery`, `shootEvery`, `maxDivers` e `groups`.
- Cada grupo: `type` (alienígena), `count`, `path` (`'swoop'`, `'side'`...), `dir` (1 ou -1), `delay` em segundos.
- Tipos de alienígena (`green`, `orange`, `blue`, `purple`, `red`): `src/entities/alienTypes.js`.
- Trajetórias (`path`): definidas em `src/entities/FormationEnemy.js`.
- Setor novo: criar `STAGE_N` → adicionar em `STAGES` → colocar o id em `WORLDS[n].stages`.

### Mundos

- Arquivo: `src/systems/Campaign.js` → `WORLDS` (5 mundos).
- Campos: `number`, `name`, `tagline`, `stages`, `minis`, `boss`, `finale`, `completionReward`, `difficulty` (`attackRate`, `bulletSpeed`), `hpScale`, `music`, `theme` (cores do fundo).
- O Mundo 5 usa `circles` (dois grupos de mini-chefes; o 2º abre quando o 1º cai).
- Os mapas (Rota de Ataque e Progresso) são gerados a partir de `WORLDS`; não precisa desenhar nada.
- Mundo novo também precisa de: texto entre mundos em `src/story/story.js` (`INTERLUDES`) e música em `AudioEngine.js` (`TRACKS`), se quiser uma própria.
- Chefe final da campanha: `FINAL_BOSS_ID` em `Campaign.js`.

### Buffs

- Lista e textos: `BUFFS` em `src/systems/Campaign.js` (`name`, `short`, `color`, `description`).
- Quem dá cada buff: `REWARDS` (id do mini-chefe → id do buff) e `completionReward` de cada mundo.
- Efeito no jogo: procure por `buffs.has('<id>')` em `src/scenes/PlayScene.js` e `src/entities/Player.js`.
- Números: `PLAYER` em `src/config.js` e `BUFF_TUNING` em `PlayScene.js`.
- Buff novo: entrada em `BUFFS` → origem em `REWARDS` ou `completionReward` → efeito com `buffs.has(...)` → teste em `tests/buffs.test.js`.

### Outros

| Quero... | Onde |
|---|---|
| Velocidade, cadência, vidas do jogador | `src/config.js` → `PLAYER` |
| Efeito sonoro ou música | `src/core/AudioEngine.js` → `SFX` / `TRACKS` |
| Teclas | `src/core/KeyBindings.js` → `DEFAULT_BINDINGS` / `FIXED_BINDINGS` |
| Ajuda do celular | `src/core/TouchControls.js` → `MOBILE_ASSIST` |
| Textos da história | `src/story/story.js` |
| Integrantes | `integrantes.json` + `npm run integrantes` |
| Sprites | `src/graphics/spriteData*.js` (ou PNGs, ver [GUIA_DE_SPRITES.md](GUIA_DE_SPRITES.md)) |

## 4. Como rodar e testar

- Pré-requisito: Node.js 18+ (o CI usa Node 20).
- `npm start` → servidor local em http://localhost:5173 (precisa de servidor por causa dos módulos ES).
- `npm test` → todos os testes (`node:test`), cerca de 30 s. Um arquivo só: `node --test tests/boss.test.js`.
- `http://localhost:5173/?debug` → `T` destrói o alvo atual, `G` invencível, `B` todos os buffs, `H` hitboxes.
- O GitHub Actions roda `npm test` a cada push; a Vercel publica o site sozinha a cada push na `main`.
- Testes que mais pegam erro:
  - `reachability.test.js`: joga cada chefe só com tiros de baixo e falha se algum ficar imortal.
  - `boss.test.js` / `minibosses.test.js`: regras genéricas de todos os chefes.
  - `worlds.test.js` / `campaign.test.js`: estrutura dos mundos, save e progressão.
  - `sprites.test.js`: todo sprite citado existe e tem formato válido.
  - `docs.test.js`: exige teste catalogado em `docs/TESTES.md`, versão do `package.json` no CHANGELOG e relatório em `docs/RELATORIOS_DE_ENTREGA.md`.
- Testes **não pegam problemas visuais**. Confira a tela: abra o jogo ou tire uma captura com o Edge sem janela (`msedge --headless=new --window-size=480,640 --screenshot=...`).

## 5. Arquivos para enviar a outro chat

Sempre envie: este `docs/HANDOFF.md`, `src/config.js` e o arquivo que vai mudar. Depois, conforme a tarefa:

| Tarefa | Arquivos |
|---|---|
| Mudar um chefe | `src/boss/bosses/<chefe>.js`, `src/boss/Boss.js`, `src/boss/BossPart.js`, `src/boss/patterns.js` |
| Chefe novo | os de cima + `src/boss/bosses/index.js`, um chefe parecido como modelo, `src/systems/Campaign.js`, `tests/reachability.test.js` |
| Setores (ondas) | `src/stages/stageData.js`, `src/stages/WaveStage.js`, `src/entities/alienTypes.js`, `src/entities/FormationEnemy.js` |
| Mundos | `src/systems/Campaign.js`, `src/story/story.js`, `tests/worlds.test.js` |
| Buffs | `src/systems/Campaign.js`, `src/scenes/PlayScene.js`, `src/entities/Player.js`, `tests/buffs.test.js` |
| Telas/menus | a cena em `src/scenes/`, `src/core/Game.js`, `src/graphics/text.js` |
| Controles | `src/core/Input.js`, `src/core/KeyBindings.js`, `src/core/TouchControls.js` |
| Som | `src/core/AudioEngine.js` |
| Sprites | o `src/graphics/spriteData*.js` certo, `src/graphics/SpriteBank.js`, `src/graphics/palette.js` |

- `PlayScene.js` é grande (~1.450 linhas): se só uma parte importa, envie o trecho e diga o nome do método.
- Peça para o outro chat **não reescrever arquivos inteiros**, só as partes que mudam.

## 6. Regras que eu sigo

- Perguntar as dúvidas **antes** de começar; depois fazer tudo sem parar.
- Não mudar a jogabilidade além do que foi pedido.
- Não apagar nem alterar código que você não entende; pergunte antes.
- Rodar `npm test` antes de cada commit; todos os testes passando.
- Nunca apagar um teste para "fazer passar". Teste só muda se a regra do jogo mudar.
- Todo teste novo vai catalogado em `docs/TESTES.md` (o `docs.test.js` cobra).
- A cada versão: subir `version` no `package.json`, escrever a entrada no `CHANGELOG.md` e o relatório em `docs/RELATORIOS_DE_ENTREGA.md` (o teste cobra os dois).
- Nunca apagar relatórios, entradas do CHANGELOG ou do diário: são o histórico do projeto.
- Atualizar a documentação junto com o código: `README.md` e `README.en.md`, `docs/GDD.md`, `docs/ARQUITETURA.md`, `docs/PLANEJAMENTO.md`, `docs/DIARIO_DE_DESENVOLVIMENTO.md`, e as contagens de testes citadas neles.
- Conferir visualmente toda mudança de tela (captura com o Edge sem janela).
- Manter o jogo **sem dependências**; ferramentas extras (como o gerador de slides) ficam fora do jogo.
- Textos do jogo em português; código e comentários também em português.
- Alguns arquivos usam fim de linha CRLF: ao editar por script, preserve o formato.
- Mudou o formato do save? Suba `SAVE_VERSION` em `Campaign.js` e garanta que saves antigos não quebrem.
- Integrantes só por `integrantes.json` + `npm run integrantes`.
- Commit com mensagem clara e push na `main` (a Vercel publica sozinha).

## 7. O que eu não sei

- Como o joystick se comporta num celular de verdade: eu não sei (só foi testado simulando toque).
- Se o equilíbrio dos Mundos 2 a 5 está bom para jogadores humanos: eu não sei (foi ajustado por simulação).
- Desempenho em celulares fracos: eu não sei.
- Detalhes internos da colisão por máscara de pixels das partes do chefe: eu não sei de cabeça; está em `Boss.js` (`hitTestPath`) e em [ARQUITETURA.md](ARQUITETURA.md).
