# 🎨 Guia de Sprites: como desenhar a sua própria arte

O jogo funciona **completo sem nenhuma imagem**: toda a pixel art é gerada por código. Mesmo assim, qualquer sprite pode ser substituído por um **PNG desenhado à mão** (modo misto). As variações de dano (rachaduras, flash branco, carcaça e tom de fúria) são **geradas automaticamente** a partir do seu desenho, então você só precisa desenhar a versão **intacta**.

---

## 1. Ferramentas recomendadas (gratuitas)

| Ferramenta | Tipo | Link |
|---|---|---|
| **Piskel** | Online, no navegador | https://www.piskelapp.com |
| **LibreSprite** | Desktop (gratuito) | https://libresprite.github.io |
| **Aseprite** | Desktop (pago, padrão da indústria) | https://www.aseprite.org |

## 2. Lista de sprites

| Nome do arquivo | O que é | Tamanho (pixels) | Na tela (×3) |
|---|---|:---:|:---:|
| `player.png` | Nave do jogador (apontando para **cima**) | 15 × 14 | 45 × 42 |
| `hull.png` | Casco central do chefe | 26 × 26 | 78 × 78 |
| `wingL.png` | Asa **esquerda** do chefe (a borda direita encosta no casco) | 24 × 15 | 72 × 45 |
| `wingR.png` | Asa **direita** do chefe (espelho da esquerda) | 24 × 15 | 72 × 45 |
| `generator.png` | Gerador de escudo (fica sob as asas) | 10 × 10 | 30 × 30 |
| `plate.png` | Placa blindada sobre o núcleo | 10 × 10 | 30 × 30 |
| `core.png` | Núcleo de energia (ponto fraco final) | 10 × 10 | 30 × 30 |
| `cannon.png` | Canhão principal (aponta para **baixo**) | 8 × 12 | 24 × 36 |
| `minion.png` | Drone inimigo (aponta para **baixo**) | 11 × 9 | 33 × 27 |
| `wingman.png` | Nave aliada (Ala Companheira), aponta para **cima** | 15 × 14 | 36 × 34 (escala 0,8) |
| `alienOrange.png` | Alienígena laranja (aponta para **baixo**) | 13 × 9 | 39 × 27 |
| **Leviatã** *(o casco é desenhado por código)* | | | |
| `turret.png` | Torreta do casco (cano para **baixo**) | 12 × 12 | 36 × 36 |
| `hangar.png` | Porta de hangar | 18 × 10 | 54 × 30 |
| `bunker.png` | Bateria blindada | 14 × 14 | 42 × 42 |
| `reactor.png` | Reator regenerativo | 14 × 14 | 42 × 42 |
| `storm.png` | Canhão de tempestade (3 canos para baixo) | 24 × 11 | 72 × 33 |
| `bridge.png` | Ponte de comando | 30 × 15 | 90 × 45 |
| `levCore.png` | Núcleo do Leviatã | 16 × 16 | 48 × 48 |
| **Sentinela** | | | |
| `sentinel.png` | Olho blindado (corpo) | 18 × 18 | 54 × 54 |
| `pod.png` | Cápsula orbital | 10 × 10 | 30 × 30 |
| `barrier.png` | Barreira giratória | 10 × 6 | 30 × 18 |
| **Colmeia** | | | |
| `hive.png` | Carapaça | 28 × 12 | 84 × 36 |
| `nest.png` | Ninho de drones (fica na parte de baixo da carapaça) | 10 × 8 | 30 × 24 |
| `hiveCore.png` | Rainha (núcleo, centro-baixo) | 12 × 10 | 36 × 30 |
| **Ceifador** | | | |
| `reaper.png` | Corpo (ponta para **baixo**) | 20 × 14 | 60 × 42 |
| `bladeL.png` | Lâmina esquerda (borda direita encosta no corpo) | 14 × 11 | 42 × 33 |
| `bladeR.png` | Lâmina direita (espelho) | 14 × 11 | 42 × 33 |

| **Mundos 2 a 4** *(definidos em `src/graphics/spriteDataWorlds.js`)* | | | |
| `alienBlue.png` / `alienPurple.png` / `alienRed.png` | Alienígenas azul, roxo e vermelho (apontam para **baixo**) | 13 × 9 | 39 × 27 |
| `prism.png` · `shard.png` | Prisma: núcleo de cristal · fragmento orbital | 16 × 16 · 8 × 9 | 48 × 48 · 24 × 27 |
| `vortex.png` · `turbine.png` · `vortexEye.png` | Vórtice: anel · turbina · olho | 20 × 14 · 10 × 9 · 10 × 10 | 60 × 42 · 30 × 27 · 30 × 30 |
| `scarabCore.png` · `shellL/R.png` · `mandibleL/R.png` | Escaravelho: núcleo · metades da carapaça · mandíbulas | 12 × 10 · 8 × 14 · 6 × 9 | 36 × 30 · 24 × 42 · 18 × 27 |
| `hydraBody.png` · `hydraHeadL/R/C.png` · `iceScale.png` · `hydraHeart.png` | Hidra: corpo · cabeças · escama · coração | 28 × 18 · 12 × 10 (C: 14 × 12) · 8 × 7 · 10 × 9 | 84 × 54 · 36 × 30 · 24 × 21 · 30 × 27 |
| `hammer.png` · `piston.png` | Martelo: cabeça · pistão | 24 × 8 · 6 × 12 | 72 × 24 · 18 × 36 |
| `twin.png` · `twinLink.png` | Gêmeos: nave irmã · núcleo do elo | 14 × 10 · 10 × 10 | 42 × 30 · 30 × 30 |
| `furnace.png` · `vent.png` · `furnaceCore.png` | Fornalha: casco · chaminé · núcleo | 28 × 14 · 8 × 8 · 12 × 8 | 84 × 42 · 24 × 24 · 36 × 24 |
| `aegisBody.png` · `aegisCannon.png` · `aegisShield.png` · `aegisGun.png` · `aegisCore.png` | Égide: fortaleza · canhão de canto · segmento do anel · arma principal · núcleo | 32 × 15 · 8 × 9 · 8 × 5 · 12 × 12 · 12 × 12 | 96 × 45 · 24 × 27 · 24 × 15 · 36 × 36 · 36 × 36 |
| `specter.png` · `lantern.png` | Espectro: corpo · lanterna | 18 × 14 · 6 × 7 | 54 × 42 · 18 × 21 |
| `oracle.png` · `petal.png` · `oracleEye.png` | Oráculo: mandala · pétala · olho | 24 × 16 · 8 × 8 · 12 × 10 | 72 × 48 · 24 × 24 · 36 × 30 |
| `echo.png` · `reflector.png` | Eco: cópia sombria da nave (de cabeça para baixo) · refletor | 30 × 28 · 8 × 10 | 90 × 84 · 24 × 30 |
| `archon.png` · `archonWingL/R.png` · `archonCannon.png` · `archonMask.png` · `archonCore.png` · `archonPod.png` | Arconte: casco · asas · canhão · máscara · núcleo · cápsula | 32 × 17 · 14 × 12 · 10 × 10 · 14 × 9 · 12 × 12 · 10 × 10 | 96 × 51 · 42 × 36 · 30 × 30 · 42 × 27 · 36 × 36 · 30 × 30 |

> 💡 **Desenhe exatamente nesses tamanhos** (1 pixel do arquivo = 1 "pixel" do jogo). Também é possível desenhar em múltiplos (ex.: 2× ou 3×), porque o jogo redimensiona para o tamanho da tabela, mas as rachaduras automáticas ficam mais finas.

### Encaixe das peças do chefe

```
      ┌───────── asa E (24×15) ─────────┐┌─ casco (26×26) ─┐┌───────── asa D ─────────┐
      │ torreta na ponta esquerda       ││   placa/núcleo  ││   torreta na ponta dir. │
      └─────────────────────────────────┘│   no centro     │└─────────────────────────┘
                (gerador E por baixo)    │                 │   (gerador D por baixo)
                                         └──── canhão ─────┘
```

- O **centro da cavidade** do casco (onde ficam a placa e o núcleo) está 1 pixel acima do centro do casco.
- O **canhão** fica pendurado na parte de baixo do casco.
- As **torretas** ficam na ponta externa inferior de cada asa (é de onde saem os tiros).

## 3. Regras importantes

1. **Fundo transparente** (PNG com canal alfa).
2. **Sem antialiasing**: use lápis de 1 pixel, nunca pincel suave.
3. Mantenha as **proporções, os pontos de encaixe e a silhueta** parecidos com o original: a colisão usa os pixels do sprite de texto (`src/graphics/spriteData.js`), não os do seu PNG. Se mudar muito o formato, atualize também o sprite de texto.
4. Prefira a **paleta do jogo** para manter a unidade visual (abaixo).
5. Não desenhe as versões danificadas: o jogo as gera.

## 4. Paleta do jogo

| Cor | Hex | Uso sugerido |
|---|---|---|
| ![](https://placehold.co/16x16/1a1c2c/1a1c2c.png) | `#1a1c2c` | Contorno |
| ![](https://placehold.co/16x16/333c57/333c57.png) | `#333c57` | Sombra metálica |
| ![](https://placehold.co/16x16/566c86/566c86.png) | `#566c86` | Aço |
| ![](https://placehold.co/16x16/94b0c2/94b0c2.png) | `#94b0c2` | Brilho metálico |
| ![](https://placehold.co/16x16/f4f4f4/f4f4f4.png) | `#f4f4f4` | Branco |
| ![](https://placehold.co/16x16/5d275d/5d275d.png) | `#5d275d` | Roxo escuro (chefe) |
| ![](https://placehold.co/16x16/8e478c/8e478c.png) | `#8e478c` | Roxo (chefe) |
| ![](https://placehold.co/16x16/e43b8c/e43b8c.png) | `#e43b8c` | Magenta (energia do chefe) |
| ![](https://placehold.co/16x16/b13e53/b13e53.png) | `#b13e53` | Vermelho |
| ![](https://placehold.co/16x16/ef7d57/ef7d57.png) | `#ef7d57` | Laranja |
| ![](https://placehold.co/16x16/ffcd75/ffcd75.png) | `#ffcd75` | Amarelo |
| ![](https://placehold.co/16x16/a7f070/a7f070.png) | `#a7f070` | Verde claro |
| ![](https://placehold.co/16x16/38b764/38b764.png) | `#38b764` | Verde |
| ![](https://placehold.co/16x16/3b5dc9/3b5dc9.png) | `#3b5dc9` | Azul |
| ![](https://placehold.co/16x16/41a6f6/41a6f6.png) | `#41a6f6` | Azul claro |
| ![](https://placehold.co/16x16/73eff7/73eff7.png) | `#73eff7` | Ciano (tecnologia) |

## 5. Como ativar o seu desenho

1. Salve o PNG em `assets/sprites/` com o **nome exato** da tabela (ex.: `assets/sprites/player.png`).
2. Abra `assets/sprites/manifest.json` e adicione o nome à lista:

   ```json
   {
     "overrides": ["player", "minion"]
   }
   ```

3. Recarregue o jogo (`Ctrl+F5`). Se o arquivo não for encontrado, o console (F12) mostra um aviso e o jogo volta a usar a arte gerada por código.

## 6. Outros desenhos úteis para o portfólio

| Item | Uso | Tamanho sugerido |
|---|---|---|
| **Capa / key art** | Topo do README e do LinkedIn | 1280 × 640 |
| **Logo** "NEBULA TITAN" | README e tela de título | livre |
| **Concept art do chefe** | Seção de design do README/GDD (mostra processo criativo) | livre |
| **GIF de gameplay** | Topo do README (o item mais importante para recrutadores!) | 480 × 640, até 10 s |

Para gravar o GIF: [ScreenToGif](https://www.screentogif.com) (Windows, gratuito). Salve em `docs/images/gameplay.gif` e descomente a linha correspondente no topo do `README.md`.

## Mundo 5 e Ômega (v1.5)

Definidos em `src/graphics/spriteDataFinal.js` (tamanho em pixels de tela; cada pixel de arte vale 3x3):

| Nome | Tamanho | Uso |
|---|---|---|
| `chronos` | 48x48 | Cronos: mostrador |
| `gear` | 30x30 | Cronos e Ômega: engrenagem |
| `chronoCore` | 24x24 | Cronos: núcleo |
| `mirrorWingL` / `mirrorWingR` | 27x36 | Reflexo e Ômega: asas de cristal |
| `mirrorCore` | 30x30 | Reflexo: núcleo |
| `parasite` | 66x36 | Parasita: carapaça |
| `sac` | 24x21 | Parasita: bolsa de esporos |
| `parasiteCore` | 24x24 | Parasita: núcleo |
| `legion` | 78x27 | Legião: porta-naves |
| `bay` | 30x21 | Legião e Ômega: hangar |
| `legionCore` | 24x24 | Legião: núcleo |
| `gunner` | 60x27 | Artilheiro: casco |
| `gunBarrel` | 18x30 | Artilheiro e Ômega: canhão |
| `gunnerCore` | 24x24 | Artilheiro: núcleo |
| `phoenix` | 42x27 | Fênix: corpo |
| `flameWingL` / `flameWingR` | 42x30 | Fênix e Ômega: asas de fogo |
| `phoenixCore` / `ashCore` | 24x24 | Fênix: coração e coração renascido |
| `omega` | 120x51 | Ômega: casco |
| `omegaNode` | 24x24 | Ômega: nó orbital |
| `omegaVeil` | 36x21 | Ômega: véu do vazio |
| `omegaCore` | 42x42 | Ômega: núcleo |

Ao desenhar um PNG, mantenha o mesmo tamanho: a hitbox continua vindo do sprite de texto.
