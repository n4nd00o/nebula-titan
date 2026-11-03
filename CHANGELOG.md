# Changelog

Todas as mudanças relevantes do projeto são documentadas aqui.
O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.2.1] - 2026-11-03

### Corrigido
- **Casco do Leviatã invisível:** só o fogo dos motores aparecia. O recorte da silhueta usava `destination-in` linha a linha, e no Canvas cada operação nesse modo apaga tudo o que está fora dela; assim, cada linha apagava as anteriores. Agora a silhueta é um único caminho, preenchido de uma vez.
- Teste de regressão que garante um único recorte (81 testes).

## [1.2.0] - 2026-11-03

### Adicionado
- **Setores 1 e 2** (obrigatórios antes dos mini-chefes): ondas de alienígenas em formação no estilo Galaga, com entrada em curvas, formação que "respira", mergulhos com escolta e retorno à vaga.
- **Alienígena laranja** (3 de vida, leque de 3 tiros); verdes e laranjas também escoltam os chefes.
- **Chefe final LEVIATÃ:** fortaleza estelar maior que a tela, com 8 seções, câmera avançando seção por seção e casco gerado por código.
- Mecânicas do motor de chefes: **blindagem** (o perfurante e a bomba ignoram), **regeneração**, câmera por fase, contato opcional.
- **Paredes de laser** com aviso e brecha (o dash atravessa; a bomba desfaz).
- Recarga de bomba em seções do Leviatã (máx. 3 cargas).
- **Vidas acumuladas** na campanha (máx. 5), **vida extra a cada 50.000 pontos** e **bônus de corrida perfeita** (+100.000 sem mortes).
- Música dos setores; trilha do Leviatã acelera a cada seção.
- 19 testes novos (total: 80).

### Alterado
- `PlayScene` roda qualquer "encontro" (setor ou chefe) via `src/encounters.js`.
- Máximo de vidas de 6 para 5.
- Mapa da campanha mostra o Leviatã, as vidas e as mortes.

## [1.1.0] - 2026-11-03

### Adicionado
- **Modo Campanha:** 3 mini-chefes em ordem escolhida pelo jogador (mapa "Rota de Ataque") e depois o Nebula Titan.
- **Mini-chefes:** Sentinela (cápsulas orbitais + barreiras giratórias), Colmeia (ninhos que fabricam drones + rainha) e Ceifador (investidas telegrafadas com dano por contato).
- **Buffs:** Tiro Perfurante, Ala Companheira (nave aliada), Dash (`C`) e Bomba de Pulso (`X`, 2 cargas por luta).
- *Continue* na campanha (mantém buffs, zera a pontuação).
- Menu de modos na tela de título; modo **Duelo** (luta direta com o Titã, como na v1.0).
- Telas de vitória específicas (buff obtido, campanha concluída com rota e rank geral).
- Recordes separados para Campanha e Duelo.
- Trilhas musicais e efeitos sonoros novos.
- Controles de toque para dash (segundo dedo) e bomba (botão na tela).
- 27 testes novos (total: 61), incluindo testes genéricos aplicados a todos os chefes.

### Alterado
- `Boss` virou um **motor genérico** que executa definições de chefe (`src/boss/bosses/`); `bossData.js` foi substituído por `bosses/nebulaTitan.js`.
- Na campanha, o Titã tem +80% de vida para compensar os buffs.
- Atalho de debug "destruir alvo" mudou de `K` para `T`; novo atalho `B` concede todos os buffs.

## [1.0.1] - 2026-11-03

### Corrigido
- Tiros na metade interna das asas não causavam dano: o gerador escondido sob a asa interceptava os projéteis.
- Geradores apareciam (e bloqueavam tiros) antes de a asa correspondente ser destruída.

### Alterado
- Colisão com as partes do chefe agora usa **máscara de pixels** do sprite (em vez de retângulos), considerando a inclinação do chefe.
- Colisão **contínua**: o trajeto do tiro entre quadros é verificado, evitando que atravesse partes finas.
- Pontos fracos ganham 2 px de tolerância extra.
- Modo debug (`H`) agora exibe a máscara de colisão real.

### Adicionado
- 4 testes de regressão de colisão (total: 34).

## [1.0.0] - 2026-11-03

### Adicionado
- Motor do jogo: game loop com passo fixo, cenas, entrada (teclado + toque), armazenamento local.
- Chefe **NEBULA TITAN** com 8 partes e 4 fases (Asas, Geradores, Canhão, Núcleo).
- Quebra de partes com mudança visual e de comportamento; inclinação ao perder asas.
- Quebra antecipada de geradores e fase pulada, com bônus.
- Laser telegrafado com varredura; minas teleguiadas; espirais; drones em mergulho.
- Pixel art gerada por código com variações de dano procedurais e suporte a PNGs (modo misto).
- Efeitos sonoros e trilha musical 100% sintetizados (Web Audio API).
- Partículas, hit-stop, tremor de tela e flashes.
- HUD com barra de vida segmentada por fase; telas de título, pausa, game over e vitória.
- Pontuação com bônus e rank (S/A/B/C); recorde persistente.
- Modo debug (`?debug`).
- 30 testes automatizados e integração contínua com GitHub Actions.
- Documentação: README (PT/EN), GDD, arquitetura, planejamento, guia de sprites e diário.
