/**
 * ProgressScene — MAPA DE PROGRESSO da galáxia.
 *
 * Duas telas:
 *  1. GALÁXIA: os 4 mundos ligados por uma rota. Mostra onde o jogador está
 *     ("VOCÊ ESTÁ AQUI"), o que já foi concluído e o que está bloqueado.
 *  2. MUNDO: ao tocar em um mundo, aparecem as fases internas dele
 *     (2 setores -> 3 mini-chefes -> chefe -> Leviatã no Mundo 4).
 *
 * Fases vencidas podem ser REJOGADAS como treino (sem alterar o save);
 * a próxima fase da campanha é jogada para valer.
 *
 * Abre pelo título (MAPA DE PROGRESSO), pela Rota de Ataque (botão MAPA)
 * e automaticamente ao concluir um mundo (anima a nave até o próximo).
 */
import { GAME_WIDTH as W, GAME_HEIGHT as H, UI_COLORS, PLAYER } from '../config.js';
import { drawText } from '../graphics/text.js';
import { ENCOUNTERS } from '../encounters.js';
import { Campaign, WORLDS, BUFFS, REWARDS } from '../systems/Campaign.js';
import { buildProgress, mergeDefeated, PROGRESS_KEY } from '../systems/Progress.js';
import { clamp, easeOutCubic } from '../utils/math.js';
import { iconFor, MapScene } from './MapScene.js';
import { PlayScene, SAVE_KEY, UNLOCK_KEY } from './PlayScene.js';
import { TitleScene } from './TitleScene.js';

/** Posições dos planetas na tela da galáxia (rota em zigue-zague, de baixo para cima). */
export const PLANETS = Object.freeze([
  { x: 130, y: 456 }, { x: 350, y: 358 }, { x: 130, y: 260 }, { x: 350, y: 162 },
]);
const PLANET_R = 36;

/** Posição da nave "VOCÊ ESTÁ AQUI": ao lado do planeta, no lado de fora da tela. */
const shipSpot = (p) => ({ x: p.x < W / 2 ? p.x - PLANET_R - 30 : p.x + PLANET_R + 30, y: p.y });

/** Sprite de alienígena que representa os setores de cada mundo. */
const STAGE_ICONS = ['minion', 'alienBlue', 'alienPurple', 'alienRed'];
const STAGE_ICONS_W1 = { stage1: 'minion', stage2: 'alienOrange' };

/** Botão "voltar" no canto superior esquerdo. */
const BACK = Object.freeze({ x: 8, y: 8, w: 96, h: 30 });

/** Layout das fases internas de um mundo (y cresce para baixo). */
export function worldNodes(world) {
  const [s1, s2] = world.stages;
  const [a, b, c] = world.minis;
  const bossY = world.finale ? 262 : 236;
  const nodes = [
    { id: s1, x: W / 2 - 84, y: 486, r: 30 },
    { id: s2, x: W / 2 + 84, y: 486, r: 30 },
    { id: a, x: 88, y: 370, r: 32 },
    { id: b, x: W / 2, y: 384, r: 32 },
    { id: c, x: W - 88, y: 370, r: 32 },
    { id: world.boss, x: W / 2, y: bossY, r: 38 },
  ];
  if (world.finale) nodes.push({ id: world.finale, x: W / 2, y: 148, r: 38 });
  // Ligações: setor 1 -> setor 2 -> mini-chefes -> chefe -> Leviatã
  const links = [[0, 1], [1, 2], [1, 3], [1, 4], [2, 5], [3, 5], [4, 5]];
  if (world.finale) links.push([5, 6]);
  return { nodes, links };
}

const inside = (p, r) => p && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

export class ProgressScene {
  /**
   * @param {object} game
   * @param {{campaign?: Campaign|null, focusWorld?: number, openWorld?: boolean,
   *          celebrate?: number, back?: 'title'|'route'}} options
   *   campaign   campanha viva (ao vir da Rota de Ataque ou de uma vitória); senão lê o save
   *   focusWorld mundo selecionado ao abrir
   *   openWorld  já abre a tela das fases desse mundo
   *   celebrate  índice do mundo recém-liberado (anima a nave até ele)
   *   back       para onde o botão voltar leva na tela da galáxia
   */
  constructor(game, { campaign = null, focusWorld = null, openWorld = false, celebrate = null, back = 'title' } = {}) {
    this.game = game;
    this.time = 0;
    this.back = back;
    const storage = game.storage;
    this.save = campaign ?? Campaign.fromJSON(storage.get(SAVE_KEY, null));
    this.defeated = mergeDefeated({
      history: storage.get(PROGRESS_KEY, []),
      save: this.save,
      unlocked: storage.get(UNLOCK_KEY, 1),
    });
    this.progress = buildProgress({ save: this.save, defeated: this.defeated });
    const start = focusWorld ?? Math.max(0, this.progress.currentWorld);
    this.worldIndex = clamp(start, 0, WORLDS.length - 1);
    this.view = openWorld ? 'world' : 'galaxy';
    this.celebrate = celebrate;
    this.layout = null;
    this.selected = 0;
    if (openWorld) this.openWorld(this.worldIndex, false);
  }

  enter() {
    this.game.starfield.setSpeed(0.4);
    this.game.starfield.setTheme(WORLDS[this.view === 'world' ? this.worldIndex : 0].theme);
    this.game.audio.setTempo(1);
    this.game.audio.playMusic('map');
  }

  get worldInfo() {
    return this.progress.worlds[this.worldIndex];
  }

  // ------------------------------------------------------------ navegação
  openWorld(index, sound = true) {
    this.worldIndex = index;
    this.view = 'world';
    this.layout = worldNodes(WORLDS[index]);
    const encounters = this.worldInfo.encounters;
    // Seleciona a fase disponível; senão a última vencida; senão a primeira.
    const avail = encounters.findIndex((e) => e.status === 'available');
    const lastDone = encounters.map((e) => e.status).lastIndexOf('done');
    this.selected = avail >= 0 ? avail : Math.max(0, lastDone);
    this.game.starfield.setTheme(WORLDS[index].theme);
    if (sound) this.game.audio.play('select');
  }

  goBack() {
    const game = this.game;
    game.audio.play('select');
    if (this.view === 'world') {
      this.view = 'galaxy';
      game.starfield.setTheme(WORLDS[0].theme);
    } else if (this.back === 'route' && this.save) {
      game.changeScene(new MapScene(game, this.save));
    } else {
      game.changeScene(new TitleScene(game));
    }
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if ((input.wasPressed('pause') && !input.tap) || input.wasPressed('quit') || inside(input.tap, BACK)) {
      this.goBack();
      return;
    }
    if (this.view === 'galaxy') this.updateGalaxy(input);
    else this.updateWorld(input);
  }

  updateGalaxy(input) {
    const n = WORLDS.length;
    if (input.wasPressed('left') || input.wasPressed('down')) this.moveWorld(-1, n);
    if (input.wasPressed('right') || input.wasPressed('up')) this.moveWorld(1, n);
    if (input.tap) {
      const hit = PLANETS.findIndex((p) => Math.hypot(p.x - input.tap.x, p.y - input.tap.y) < PLANET_R + 14);
      if (hit >= 0) {
        this.openWorld(hit);
        return;
      }
    }
    if (!input.tap && (input.wasPressed('confirm') || input.wasPressed('fire'))) this.openWorld(this.worldIndex);
  }

  moveWorld(delta, n) {
    this.worldIndex = (this.worldIndex + delta + n) % n;
    this.game.audio.play('select');
  }

  updateWorld(input) {
    const nodes = this.layout.nodes;
    const n = nodes.length;
    if (input.wasPressed('left') || input.wasPressed('down')) this.moveNode(-1, n);
    if (input.wasPressed('right') || input.wasPressed('up')) this.moveNode(1, n);
    if (input.tap) {
      const hit = nodes.findIndex((p) => Math.hypot(p.x - input.tap.x, p.y - input.tap.y) < p.r + 10);
      if (hit >= 0) {
        // 1º toque seleciona; tocar de novo na mesma fase joga.
        if (hit === this.selected) this.activate();
        else {
          this.selected = hit;
          this.game.audio.play('select');
        }
        return;
      }
      if (input.tap.y > H - 78) {
        this.activate(); // o painel inferior também é um botão
        return;
      }
    }
    if (!input.tap && (input.wasPressed('confirm') || input.wasPressed('fire'))) this.activate();
  }

  moveNode(delta, n) {
    this.selected = (this.selected + delta + n) % n;
    this.game.audio.play('select');
  }

  /** Joga a fase selecionada: treino (vencida) ou campanha (disponível). */
  activate() {
    const enc = this.worldInfo.encounters[this.selected];
    const game = this.game;
    if (!enc || enc.status === 'locked') {
      game.audio.play('tink');
      return;
    }
    game.audio.unlock();
    game.audio.play('select');
    if (enc.status === 'available') {
      const campaign = this.save ?? new Campaign();
      game.changeScene(new PlayScene(game, { bossId: enc.id, campaign }));
      return;
    }
    game.changeScene(new PlayScene(game, { bossId: enc.id, campaign: this.practiceCampaign(), practice: true }));
  }

  /** Cópia descartável da campanha para o treino (buffs atuais, 3 vidas). */
  practiceCampaign() {
    const copy = this.save ? Campaign.fromJSON(this.save.toJSON()) : null;
    const c = copy ?? Campaign.startingAt(Math.max(this.worldIndex, this.progress.worlds.filter((w) => w.complete).length - 1));
    c.lives = PLAYER.lives;
    c.score = 0;
    return c;
  }

  // ------------------------------------------------------------ desenho
  draw(ctx) {
    if (this.view === 'galaxy') this.drawGalaxy(ctx);
    else this.drawWorld(ctx);
    this.drawBackButton(ctx);
  }

  drawBackButton(ctx) {
    ctx.fillStyle = 'rgba(26, 28, 44, 0.85)';
    ctx.fillRect(BACK.x, BACK.y, BACK.w, BACK.h);
    ctx.strokeStyle = '#566c86';
    ctx.lineWidth = 2;
    ctx.strokeRect(BACK.x + 0.5, BACK.y + 0.5, BACK.w - 1, BACK.h - 1);
    const label = this.view === 'world' ? '< MUNDOS' : this.back === 'route' && this.save ? '< ROTA' : '< MENU';
    drawText(ctx, label, BACK.x + BACK.w / 2, BACK.y + BACK.h / 2, { size: 7, align: 'center', baseline: 'middle' });
  }

  // ---------------------------------------------------- tela da galáxia
  drawGalaxy(ctx) {
    const { worlds, currentWorld } = this.progress;
    drawText(ctx, 'MAPA DA GALÁXIA', W / 2, 44, { size: 16, align: 'center', color: UI_COLORS.accent });
    const total = worlds.reduce((s, w) => s + w.total, 0);
    const done = worlds.reduce((s, w) => s + w.doneCount, 0);
    drawText(ctx, `PROGRESSO ${done}/${total} FASES`, W / 2, 66, { size: 7, align: 'center', color: UI_COLORS.muted });
    this.drawProgressBar(ctx, 120, 80, W - 240, done / total);

    // Rota entre os planetas (verde = trecho já percorrido)
    for (let i = 0; i < PLANETS.length - 1; i++) {
      const a = PLANETS[i];
      const b = PLANETS[i + 1];
      const travelled = worlds[i].complete;
      ctx.strokeStyle = travelled ? '#38b764' : '#333c57';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -this.time * 24;
      ctx.beginPath();
      // Sobe do topo do planeta e entra pela lateral do próximo (não cruza os nomes, que ficam embaixo).
      const side = b.x > a.x ? -1 : 1;
      ctx.moveTo(a.x, a.y - PLANET_R);
      ctx.quadraticCurveTo(a.x, b.y, b.x + side * PLANET_R, b.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    worlds.forEach((w, i) => this.drawPlanet(ctx, w, PLANETS[i], i === this.worldIndex));

    // Nave "VOCÊ ESTÁ AQUI" (anima até o mundo novo ao concluir um mundo)
    if (currentWorld >= 0) {
      let p = shipSpot(PLANETS[currentWorld]);
      if (this.celebrate != null && this.celebrate > 0 && this.time < 2) {
        const from = shipSpot(PLANETS[this.celebrate - 1]);
        const t = easeOutCubic(clamp((this.time - 0.4) / 1.4, 0, 1));
        p = { x: from.x + (p.x - from.x) * t, y: from.y + (p.y - from.y) * t };
      }
      const bob = Math.sin(this.time * 4) * 3;
      this.game.sprites.draw(ctx, 'player', p.x, p.y + bob, { scale: 0.6 });
      drawText(ctx, 'VOCÊ', p.x, p.y + 20, { size: 5, align: 'center', color: '#ffcd75' });
    }

    this.drawGalaxyInfo(ctx);
    if (this.celebrate != null && this.time < 3.2) {
      const alpha = Math.min(1, (3.2 - this.time) * 2);
      const next = WORLDS[this.celebrate];
      ctx.fillStyle = `rgba(26, 28, 44, ${alpha})`;
      ctx.fillRect(16, H - 92, W - 32, 76);
      drawText(ctx, `MUNDO ${this.celebrate} CONCLUÍDO!`, W / 2, H - 78, { size: 12, align: 'center', color: '#ffcd75', alpha });
      drawText(ctx, `PRÓXIMO: ${next.name}`, W / 2, H - 50, { size: 7, align: 'center', color: next.theme.accent, alpha });
    }

  }

  drawPlanet(ctx, info, p, selected) {
    const { world, status } = info;
    const locked = status === 'locked';
    const accent = locked ? '#333c57' : world.theme.accent;
    const r = PLANET_R;

    // Corpo do planeta: disco com faixas na cor do mundo.
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = locked ? '#1a1c2c' : world.theme.bg;
    ctx.fill();
    ctx.clip();
    const colors = world.theme.stars;
    for (let b = 0; b < 5; b++) {
      ctx.fillStyle = locked ? '#262b44' : colors[b % colors.length];
      ctx.globalAlpha = locked ? 0.6 : 0.35;
      const y = p.y - r + b * (r / 2.5) + Math.sin(this.time * 0.6 + b) * 3;
      ctx.fillRect(p.x - r, y, r * 2, r / 5);
    }
    ctx.globalAlpha = 1;
    // Sombra (lado escuro)
    ctx.fillStyle = 'rgba(5, 5, 13, 0.45)';
    ctx.beginPath();
    ctx.arc(p.x + r * 0.45, p.y + r * 0.2, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = status === 'done' ? '#38b764' : accent;
    ctx.lineWidth = selected ? 4 : 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.stroke();
    if (status === 'current') {
      // Anel pulsante no mundo atual
      ctx.strokeStyle = '#ffcd75';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5 + Math.sin(this.time * 5) * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 8 + Math.sin(this.time * 5) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    drawText(ctx, String(world.number), p.x, p.y, { size: 20, align: 'center', baseline: 'middle', color: locked ? '#566c86' : '#ffffff' });

    // Nome e estado embaixo do planeta
    const tx = p.x;
    const align = 'center';
    drawText(ctx, world.name, tx, p.y + r + 6, { size: 7, align, color: locked ? '#566c86' : accent });
    const label = {
      current: 'VOCÊ ESTÁ AQUI', done: 'CONCLUÍDO', visited: 'JÁ VISITADO', locked: 'BLOQUEADO',
    }[status];
    const color = { current: '#ffcd75', done: '#a7f070', visited: '#73eff7', locked: '#566c86' }[status];
    drawText(ctx, `${label} · ${info.doneCount}/${info.total}`, tx, p.y + r + 18, { size: 6, align, color });
  }

  drawProgressBar(ctx, x, y, w, ratio) {
    ctx.fillStyle = '#1a1c2c';
    ctx.fillRect(x, y, w, 6);
    ctx.fillStyle = '#38b764';
    ctx.fillRect(x, y, Math.round(w * ratio), 6);
    ctx.strokeStyle = '#566c86';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 5);
  }

  drawGalaxyInfo(ctx) {
    const info = this.worldInfo;
    const y = H - 92;
    this.drawPanel(ctx, y, 76, info.world.theme.accent);
    drawText(ctx, `MUNDO ${info.world.number}: ${info.world.name}`, W / 2, y + 12, { size: 9, align: 'center', color: info.world.theme.accent });
    drawText(ctx, info.world.tagline, W / 2, y + 30, { size: 6, align: 'center' });
    const hint = info.status === 'locked' ? 'Ainda bloqueado: toque para ver as fases' : 'Toque no planeta (ou ENTER) para ver as fases';
    drawText(ctx, hint, W / 2, y + 50, { size: 6, align: 'center', color: UI_COLORS.muted });
  }

  drawPanel(ctx, y, h, color) {
    ctx.fillStyle = 'rgba(26, 28, 44, 0.92)';
    ctx.fillRect(16, y, W - 32, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(16.5, y + 0.5, W - 33, h - 1);
  }

  // ---------------------------------------------------- tela de um mundo
  drawWorld(ctx) {
    const info = this.worldInfo;
    const { world } = info;
    const { nodes, links } = this.layout;
    drawText(ctx, `MUNDO ${world.number}`, W / 2, 46, { size: 8, align: 'center', color: UI_COLORS.muted });
    drawText(ctx, world.name, W / 2, 60, { size: 14, align: 'center', color: world.theme.accent });
    drawText(ctx, `${info.doneCount}/${info.total} FASES`, W / 2, 84, { size: 7, align: 'center', color: UI_COLORS.muted });
    this.drawProgressBar(ctx, 140, 98, W - 280, info.doneCount / info.total);

    const status = (i) => info.encounters[i].status;
    for (const [a, b] of links) {
      const from = nodes[a];
      const to = nodes[b];
      const done = status(a) === 'done' && status(b) !== 'locked';
      ctx.strokeStyle = done ? '#38b764' : status(a) === 'done' ? '#ffcd75' : '#333c57';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -this.time * 20;
      const ang = Math.atan2(to.y - from.y, to.x - from.x);
      ctx.beginPath();
      ctx.moveTo(from.x + Math.cos(ang) * from.r, from.y + Math.sin(ang) * from.r);
      ctx.lineTo(to.x - Math.cos(ang) * to.r, to.y - Math.sin(ang) * to.r);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    nodes.forEach((node, i) => this.drawNode(ctx, node, info.encounters[i], i === this.selected));
    this.drawWorldInfo(ctx);
  }

  drawNode(ctx, node, enc, selected) {
    const { status } = enc;
    const locked = status === 'locked';
    const r = node.r;
    ctx.fillStyle = 'rgba(26, 28, 44, 0.9)';
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fill();
    const ring = { done: '#38b764', available: '#ffcd75', locked: '#333c57' }[status];
    ctx.strokeStyle = ring;
    ctx.lineWidth = selected ? 4 : 2;
    ctx.stroke();
    if (status === 'available') {
      ctx.globalAlpha = 0.5 + Math.sin(this.time * 6) * 0.3;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Ícone (alienígena para setores, sprite do chefe para os demais)
    const icon = enc.kind === 'stage'
      ? { sprite: STAGE_ICONS_W1[enc.id] ?? STAGE_ICONS[this.worldIndex], scale: 0.9 }
      : iconFor(enc.id);
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x, node.y, r - 3, 0, Math.PI * 2);
    ctx.clip();
    const bob = selected ? Math.sin(this.time * 4) * 2 : 0;
    const scale = icon.scale * (r / 40);
    this.game.sprites.draw(ctx, icon.sprite, node.x, node.y + bob, { scale, alpha: locked ? 0.18 : status === 'done' ? 0.55 : 1 });
    ctx.restore();
    if (status === 'done') drawText(ctx, 'OK', node.x + r - 6, node.y - r + 2, { size: 7, align: 'center', color: '#a7f070' });
    if (locked) drawText(ctx, '?', node.x, node.y, { size: 14, align: 'center', baseline: 'middle', color: '#566c86' });

    const name = ENCOUNTERS[enc.id].name;
    // Fundo escuro atrás do nome: as linhas da rota passam por baixo sem atrapalhar a leitura.
    ctx.fillStyle = 'rgba(5, 5, 13, 0.85)';
    ctx.fillRect(node.x - name.length * 3.5 - 4, node.y + r + 3, name.length * 7 + 8, REWARDS[enc.id] ? 22 : 13);
    drawText(ctx, name, node.x, node.y + r + 6, { size: 6, align: 'center', color: locked ? '#566c86' : UI_COLORS.text });
    if (REWARDS[enc.id]) {
      const buff = BUFFS[REWARDS[enc.id]];
      drawText(ctx, buff.short, node.x, node.y + r + 16, { size: 5, align: 'center', color: locked ? '#566c86' : buff.color });
    }
  }

  drawWorldInfo(ctx) {
    const enc = this.worldInfo.encounters[this.selected];
    if (!enc) return;
    const def = ENCOUNTERS[enc.id];
    const y = H - 78;
    const color = { done: '#38b764', available: '#ffcd75', locked: '#566c86' }[enc.status];
    this.drawPanel(ctx, y, 70, color);
    const kind = { stage: 'SETOR', mini: 'MINI-CHEFE', boss: 'CHEFE DO MUNDO', finale: 'CHEFE FINAL' }[enc.kind];
    drawText(ctx, `${kind} · ${def.name}`, W / 2, y + 10, { size: 8, align: 'center', color: UI_COLORS.boss });
    drawText(ctx, def.description, W / 2, y + 28, { size: 6, align: 'center' });
    const action = {
      done: 'TOQUE DE NOVO / ENTER: TREINAR (não altera o progresso)',
      available: this.save ? 'TOQUE DE NOVO / ENTER: JOGAR (campanha)' : 'TOQUE DE NOVO / ENTER: NOVA CAMPANHA',
      locked: 'BLOQUEADO: vença as fases anteriores',
    }[enc.status];
    const blink = enc.status === 'locked' || Math.floor(this.time * 2) % 2 === 0;
    if (blink) drawText(ctx, action, W / 2, y + 48, { size: 6, align: 'center', color });
  }
}
