<div align="center">

# 🚀 NEBULA TITAN

**A retro shoot 'em up with destructible bosses: alien formation sectors, three mini-bosses, a route of your choice, and a screen-filling star fortress.**

*A modern reinterpretation of 1980s arcade classics, inspired by Galaga (Namco, 1981).*

![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=black)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-E34F26?logo=html5&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Web%20Audio-API-8E478C)
![Dependencies](https://img.shields.io/badge/dependencies-zero-38B764)
![Tests](https://img.shields.io/badge/tests-node%3Atest-41A6F6)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

[🎮 Play online](#-play-online) · [🇧🇷 Português](README.md)

<!-- ![Nebula Titan gameplay](docs/images/gameplay.gif) -->

</div>

---

## 🎯 About

**Nebula Titan** started as a university game development project. To teach the fundamentals (game loop, input, collision and game states), our professor walked the class through building **Snake**. Our goal went one step further: **take a classic game and reinterpret it with modern game design ideas.**

We picked **Galaga**, one of the most iconic arcade shooters. Instead of recreating its enemy waves, the project focuses on something the original never had: **a giant, modular, reactive boss fight**, inspired by modern mechanics such as *Monster Hunter*'s part breaking, *Zelda*'s weak points and the readability of contemporary *bullet hells*.

> **Core idea:** every part you destroy **changes how the boss looks and behaves**. Rip off the right wing and the ship loses it, becomes unbalanced and tilts to that side. The remaining wing grows more aggressive and the shield generator hidden underneath is exposed. **The order of your choices changes the fight.**

Scope grew deliberately: **v1.0** shipped a single, polished final-boss fight. Once that foundation was validated, **v1.1** added a **campaign with three mini-bosses** that grant buffs, and **v1.2** completed the progression: **two preparatory sectors** with Galaga-style alien formations and a **giant 8-phase final boss, the Leviathan**, where collected buffs become increasingly necessary. See the planning document (in Portuguese): [docs/PLANEJAMENTO.md](docs/PLANEJAMENTO.md).

## 🧭 Goals

| Dimension | Goal |
|---|---|
| **Academic** | Apply the fundamentals taught with Snake in a larger, original project. |
| **Design** | Show that a retro concept can gain depth from modern principles: telegraphed attacks, visual feedback, part breaking and meaningful choices. |
| **Technical** | Build a complete game **with no engine and no libraries**, with clean architecture, documented code and automated tests. |
| **Professional** | Serve as a **portfolio piece** showcasing JavaScript, software architecture, technical writing and development process. |

## 🗺️ Game modes and campaign

| Mode | Description |
|---|---|
| **Campaign** | **Sector 1 → Sector 2** (mandatory) → **3 mini-bosses in any order** (each grants a **permanent buff**) → **Nebula Titan** → **LEVIATHAN** (final boss). Lives **carry over** (max 5); extra life every 50,000 points. Game over = retry the current stage with 3 lives, keeping buffs, score reset. Finishing with **zero deaths** grants **+100,000**. |
| **Titan Duel** | Straight fight against the final boss, no buffs (the original v1.0 challenge). |

| Mini-boss | Mechanic | How it changes | Reward |
|---|---|---|---|
| **Sentinel** | Armored eye with **3 orbiting pods**, then **rotating barriers** | Each destroyed pod makes the rest spin and fire **faster**; in phase 2 you must shoot **through the gaps**. | **Piercing Shot**: +50% damage, bullets pass through drones |
| **Hive** | Organic mothership with **2 drone nests**, then its **queen** | Losing a nest makes it **lean** to that side while the surviving nest produces **faster**. | **Wingman**: a captured allied ship is freed and fights by your side (a nod to Galaga's dual fighter) |
| **Reaper** | Blade ship performing **telegraphed dive attacks** | Missing a blade, it loses balance and dives **more often**; phase 2 dives burst into bullets. | **Dash**: fast invincible dodge |
| *All three beaten* | — | — | **Pulse Bomb**: screen clear + boss damage (2 charges per fight) |

Earned buffs reshape the remaining fights, so **route order matters**. To compensate, the Titan arrives **reinforced (+80% HP)** in the campaign.

### Preparatory sectors
Galaga-style **formation waves**: aliens swirl in, form a "breathing" formation and dive at you (missed dives return to their slot). **Green aliens** (1 HP, single shot) and **orange aliens** (3 HP, 3-way spread, dive pulling green escorts). Both also escort the bosses.

## 🛸 Final boss: LEVIATHAN
A ship **bigger than the screen**: you fly **over its hull** while the camera advances through **8 sections** (stern to bow). The hull is **procedurally drawn**. Each section is built around a buff that becomes **more necessary, never mandatory**:

| Section | Threat | Buff that shines |
|---|---|---|
| 1 Engines | Aimed spreads + escorts | — (warm-up) |
| 2 Hangars | Endless alien launches | Wingman / Piercing |
| 3 Armored Batteries | **Armor** (normal shots deal 35%) | **Piercing** ignores armor |
| 4 Laser Corridor | **Laser walls** with a narrow gap | **Dash** passes anywhere |
| 5 Twin Reactors | **Regenerate** when not hit | **Wingman** firepower |
| 6 Storm | Dense bullet curtain | **Pulse Bomb** |
| 7 Command Bridge | Armor + lasers + escorts | Piercing + Dash |
| 8 Core | Everything at once | **All of them** |

## 👾 Penultimate boss: Nebula Titan (four phases)

The **NEBULA TITAN** is built from **8 independent parts**, each with its own health, hitbox, damaged look and reward.

| Phase | Weak point | Behavior | Visual change |
|:---:|---|---|---|
| **1 · Battle Wings** | Left and right wings | Aimed spreads from wing turrets and energy rings. Losing one wing makes the other go berserk (faster fire + sweeping burst). | The destroyed wing **disappears**; the ship **tilts** toward the damaged side, shakes and sparks. |
| **2 · Shield Generators** | Generators hidden under the wings | Homing mines, needle spreads and Galaga-style diving drone squads. An energy shield surrounds the hull. | The shield **weakens** with each lost generator; generators become smoking **husks**. |
| **3 · Main Cannon** | Cannon below the hull | Tracks the player and fires a **telegraphed laser**. Below 50% HP, the laser **sweeps** the screen. | The cannon **cracks** progressively and becomes scrap. |
| **4 · Exposed Core** | Energy core | The armor plate is **blown off**. The enraged Titan fires spirals that get denser as the core weakens. | **Red-tinted** hull, flashing lights, pulsing core, faster music. |

**Mechanics that make order matter:**
- **Early break:** destroying a wing exposes that side's generator, which can already be destroyed in phase 1 (+5,000). Break both early and phase 2 is **skipped**.
- **Asymmetry:** losing the left or right wing first produces different tilts, escape routes and firing origins.
- **Per-part rewards:** each destroyed part drops a different power-up.
- **Wordless teaching:** shots on armored parts **ricochet** (metallic sound + grey spark); current weak points are marked by pulsing brackets.

## ✨ Features

- 🧩 **4 modular bosses** (final boss + 3 mini-bosses) with destructible parts and 3 damage states per part.
- 🗺️ **Campaign with player-chosen route**, map screen, **4 buffs** (piercing shot, wingman, dash, bomb) and continues.
- 🎨 **Procedurally generated pixel art** (with optional hand-drawn PNG overrides that never affect gameplay).
- 🔊 **Fully synthesized audio** (SFX + music sequencer), no audio files at all.
- 💥 Modern **game feel**: hit-stop, screen shake, flashes, particles, shockwaves, physics debris.
- 🎯 **Fair design**: tiny hitbox, telegraphed attacks, focus mode, screen clear on death.
- 🏆 Scoring with time/accuracy/no-damage bonuses, **S/A/B/C rank** and persistent high score.
- 📱 Responsive and **touch-enabled**.
- 👽 Galaga-style **formation sectors** with green and orange aliens.
- 🛸 **8-phase screen-filling final boss** with section-by-section camera, armor, regeneration and laser walls.
- ❤️ Lives carry over (max 5), extra life every 50k, **perfect-run bonus**.
- 🧪 **81 automated tests** + CI (generic tests run automatically for every registered boss).
- 🐞 **Debug mode** (`?debug`): hitboxes, FPS, god mode, phase skip.

## 🕹️ Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | `Arrows` / `WASD` | Drag |
| Shoot | `Space` / `Z` / `J` (hold) | Automatic while touching |
| Focus mode (slow + visible hitbox) | `Shift` | — |
| Dash *(Reaper buff)* | `C` / `L` | Tap with a **second finger** |
| Pulse Bomb *(after all mini-bosses)* | `X` / `K` | Bomb button (bottom right) |
| Pause | `P` / `Esc` | ⏸ button (top right) |
| Quit to menu (paused) | `Q` | — |
| Toggle sound | `M` | — |

## ▶️ Running

### 🎮 Play online
> **[▶ Play now: nebula-titan.vercel.app](https://nebula-titan.vercel.app)**, hosted on Vercel and redeployed automatically on every push to `main`.

### 💻 Locally
Requires [Node.js](https://nodejs.org/) 18+ (only for the dev server and tests; the game itself has zero dependencies).

```bash
git clone https://github.com/n4nd00o/nebula-titan.git
cd nebula-titan
npm start        # http://localhost:5173
npm test         # run the test suite
```

> A local server is needed because browsers block ES modules on `file://` pages.

## 🛠️ Tech stack

| Technology | Usage | Why |
|---|---|---|
| **JavaScript (ES2022+)** | Entire game | Native to the web, runs anywhere with no install. Classes, modules, destructuring, optional chaining, `Proxy`, `async/await`. |
| **ES Modules** | Code organization | Real separation of concerns without a bundler. |
| **HTML5 Canvas 2D** | Rendering | Immediate-mode drawing, ideal for pixel art; transforms, additive blending, `ImageData` pixel manipulation. |
| **Web Audio API** | SFX and music | Real-time synthesis (oscillators, filtered noise, envelopes), sample-accurate scheduling. |
| **CSS3** | Layout and scaling | Responsive centering, `image-rendering: pixelated`. |
| **Pointer Events** | Touch input | One event model for mouse, touch and pen. |
| **localStorage** | High score, mute setting | Simple persistence with graceful failure. |
| **Node.js + node:test** | Dev server and tests | Zero-dependency tooling. |
| **GitHub Actions + Vercel** | CI and hosting | Automated tests on every push; continuous deployment of the playable build. |

## 🏗️ Architecture highlights

1. **Fixed-timestep game loop**: deterministic simulation at 60 updates/s regardless of the monitor refresh rate.
2. **Explicit state machines** for scenes (Title → Play → Pause/Victory/Game Over) and for the boss (entering → fight ⇄ transition → dying → dead).
3. **Composition over inheritance**: the boss is a collection of `BossPart` objects.
4. **Generic, data-driven boss engine**: all **5 bosses** share one `Boss` class. Wave sectors (`WaveStage`) implement the same "encounter" interface, so the play scene runs both polymorphically. Each boss is just a definition file (`src/boss/bosses/`) with parts, phases and optional hooks (tilt, orbiting parts, extra drawing). The mini-bosses were added with **zero boss-specific conditionals** in the engine.
5. **Dependency inversion**: the `Boss` talks to the scene through a "world" interface and never touches the DOM, so it is **unit-tested in Node.js** with a `Proxy`-based fake world.
6. **Procedural art pipeline**: sprites are defined as text; damage variants (cracks via deterministic random walks, flash, husk, rage tint) are generated algorithmically, even for hand-drawn PNGs.
7. **Input abstraction**: game code asks for *actions* (`fire`, `left`), not keys.
8. **Pixel-perfect, continuous collision** on boss parts: a part is only hit where its sprite has visible pixels, and the bullet path between frames is swept in 4 px steps.
9. **Allocation-free entity removal** (`removeDead`) to reduce garbage-collector pauses.

Full write-up (Portuguese): [docs/ARQUITETURA.md](docs/ARQUITETURA.md) · Game Design Document: [docs/GDD.md](docs/GDD.md)

## 🎓 What I learned

- **Game architecture**: fixed timestep, update/render split, scenes and state machines.
- **Applied math**: vectors, trigonometry (aiming, spirals, rotated hitboxes), interpolation, easing, geometric collision.
- **2D graphics**: Canvas API, compositing modes, pixel manipulation, procedural textures.
- **Digital audio**: subtractive synthesis, envelopes, filtered noise, lookahead scheduling.
- **Software engineering**: modularity, composition, data-driven design, dependency inversion, **refactoring to generalize** (from one boss to an N-boss engine), documentation.
- **Testing**: unit tests with `node:test`, `Proxy` test doubles, headless full-game simulation.
- **Game design**: boss design, telegraphing, game feel, readability, non-linear progression, metric-driven balancing.
- **Soft skills**: scope control, iterative planning, technical communication.

## 🙏 Credits

- **Galaga** © Bandai Namco Entertainment. This is a **non-commercial academic project** *inspired* by the genre and era; no Galaga names, characters, art or sounds are used.
- Palette based on **Sweetie 16** by GrafxKid.
- **Press Start 2P** font by CodeMan38 (SIL OFL), via Google Fonts.

## 👤 Author

**Luiz Fernando Santana**: [GitHub](https://github.com/n4nd00o) · [LinkedIn](https://www.linkedin.com/in/luiz-fernando-santana-trindade/) · luizfernandosantanadev@gmail.com

## 📄 License

MIT. See [LICENSE](LICENSE).
