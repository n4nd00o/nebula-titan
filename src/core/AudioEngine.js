/**
 * AudioEngine — todo o som do jogo é SINTETIZADO em tempo real com a
 * Web Audio API. Não há nenhum arquivo de áudio no projeto.
 *
 * - Efeitos (SFX): osciladores (square/triangle/sawtooth/sine) com
 *   envelopes de volume e frequência, mais ruído branco filtrado para
 *   explosões — a mesma técnica dos chips de som dos consoles 8-bit.
 * - Música: um sequenciador com "agendamento antecipado" (lookahead):
 *   um timer agenda as notas alguns milissegundos à frente no relógio
 *   do AudioContext, garantindo ritmo preciso mesmo se o JS atrasar.
 *
 * Navegadores só permitem áudio após uma interação do usuário; por isso
 * o contexto é criado em unlock(), chamado no primeiro clique/tecla.
 */

const A2 = 110;
const noteFreq = (semitonesFromA2) => A2 * Math.pow(2, semitonesFromA2 / 12);

const MASTER_VOLUME = 0.6;
const LOOKAHEAD = 0.12; // segundos agendados à frente
const SCHEDULER_INTERVAL = 25; // ms

/** Efeitos sonoros. Cada função recebe a engine e toca o som. */
const SFX = {
  shoot: (a) => a.tone({ type: 'square', freq: 1200, freqEnd: 500, duration: 0.06, volume: 0.05 }),
  hit: (a) => a.tone({ type: 'square', freq: 260, freqEnd: 120, duration: 0.05, volume: 0.07 }),
  tink: (a) => a.tone({ type: 'triangle', freq: 2200, freqEnd: 1700, duration: 0.05, volume: 0.06 }),
  enemyShoot: (a) => a.tone({ type: 'sawtooth', freq: 520, freqEnd: 260, duration: 0.08, volume: 0.035 }),
  minionDie: (a) => {
    a.noise({ duration: 0.2, volume: 0.18, filterFreq: 3000, filterEnd: 300 });
    a.tone({ type: 'square', freq: 600, freqEnd: 100, duration: 0.15, volume: 0.05 });
  },
  partDestroyed: (a) => {
    a.noise({ duration: 0.9, volume: 0.4, filterFreq: 2500, filterEnd: 80 });
    a.tone({ type: 'sawtooth', freq: 300, freqEnd: 30, duration: 0.7, volume: 0.15 });
  },
  bossDeath: (a) => {
    a.noise({ duration: 2.2, volume: 0.5, filterFreq: 3000, filterEnd: 40 });
    a.tone({ type: 'sine', freq: 120, freqEnd: 20, duration: 2.0, volume: 0.4 });
  },
  explosionSmall: (a) => a.noise({ duration: 0.25, volume: 0.15, filterFreq: 2000, filterEnd: 200 }),
  playerDeath: (a) => {
    a.noise({ duration: 0.8, volume: 0.35, filterFreq: 4000, filterEnd: 100 });
    a.tone({ type: 'square', freq: 500, freqEnd: 50, duration: 0.6, volume: 0.12 });
  },
  shieldBreak: (a) => {
    a.tone({ type: 'triangle', freq: 1400, freqEnd: 300, duration: 0.3, volume: 0.12 });
    a.noise({ duration: 0.2, volume: 0.1, filterFreq: 6000, filterEnd: 1000 });
  },
  powerup: (a) => [523, 659, 784, 1047].forEach((f, i) =>
    a.tone({ type: 'square', freq: f, duration: 0.08, volume: 0.07, delay: i * 0.06 })),
  laserCharge: (a) => a.tone({ type: 'sawtooth', freq: 90, freqEnd: 700, duration: 1.1, volume: 0.06, attack: 0.3 }),
  laserFire: (a) => {
    a.noise({ duration: 1.4, volume: 0.22, filterFreq: 1200, filterEnd: 400 });
    a.tone({ type: 'sawtooth', freq: 110, freqEnd: 90, duration: 1.4, volume: 0.1 });
  },
  warning: (a) => [0, 1, 2, 3].forEach((i) =>
    a.tone({ type: 'square', freq: i % 2 ? 330 : 440, duration: 0.28, volume: 0.07, delay: i * 0.32 })),
  phaseClear: (a) => [392, 523, 659].forEach((f, i) =>
    a.tone({ type: 'triangle', freq: f, duration: 0.18, volume: 0.1, delay: i * 0.1 })),
  dashWarn: (a) => [0, 1].forEach((i) =>
    a.tone({ type: 'square', freq: 990, duration: 0.09, volume: 0.07, delay: i * 0.14 })),
  dash: (a) => {
    a.noise({ duration: 0.25, volume: 0.15, filterFreq: 6000, filterEnd: 600 });
    a.tone({ type: 'sawtooth', freq: 300, freqEnd: 1200, duration: 0.15, volume: 0.05 });
  },
  bomb: (a) => {
    a.noise({ duration: 1.2, volume: 0.45, filterFreq: 5000, filterEnd: 60 });
    a.tone({ type: 'sine', freq: 200, freqEnd: 30, duration: 1, volume: 0.35 });
    a.tone({ type: 'square', freq: 1600, freqEnd: 200, duration: 0.4, volume: 0.06 });
  },
  buff: (a) => [523, 784, 1047, 1568].forEach((f, i) =>
    a.tone({ type: 'triangle', freq: f, duration: i === 3 ? 0.5 : 0.12, volume: 0.1, delay: i * 0.09 })),
  select: (a) => a.tone({ type: 'square', freq: 880, freqEnd: 1320, duration: 0.08, volume: 0.06 }),
  victory: (a) => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) =>
    a.tone({ type: 'square', freq: f, duration: i === 6 ? 0.6 : 0.14, volume: 0.08, delay: i * 0.14 })),
  gameOver: (a) => [392, 349, 311, 262].forEach((f, i) =>
    a.tone({ type: 'triangle', freq: f, duration: 0.35, volume: 0.12, delay: i * 0.3 })),
};

/** Tracks musicais definidas por acordes (semitons relativos a A2). */
const TRACKS = {
  boss: {
    bpm: 140,
    chords: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -1, 2]], // Am F G E
    step(a, s, t, d) {
      const i = s % 16;
      const chord = this.chords[Math.floor(s / 16) % this.chords.length];
      const root = chord[0];
      if (i % 4 === 0) a.tone({ type: 'sine', freq: 150, freqEnd: 40, duration: 0.12, volume: 0.35, when: t, music: true });
      if (i % 2 === 0) a.tone({ type: 'triangle', freq: noteFreq(root - 12 + (i % 4 === 2 ? 12 : 0)), duration: d * 1.8, volume: 0.22, when: t, music: true });
      if (i % 4 === 2) a.noise({ duration: 0.03, volume: 0.05, filterFreq: 9000, filterEnd: 7000, when: t, music: true });
      if (i !== 7 && i !== 15) {
        const lift = Math.floor(s / 64) % 2 ? 12 : 0;
        const note = chord[[0, 1, 2, 1][i % 4]] + 24 + lift + (a.tempo > 1.05 ? 12 : 0);
        a.tone({ type: 'square', freq: noteFreq(note), duration: d * 0.9, volume: 0.045, when: t, music: true });
      }
    },
  },
  mini: null, // definida abaixo (reaproveita o sequenciador da batalha com outros acordes)
  map: {
    bpm: 110,
    chords: [[-5, -2, 2], [3, 7, 10], [5, 9, 12], [2, 6, 9]], // Em C D B
    step(a, s, t, d) {
      const i = s % 16;
      const chord = this.chords[Math.floor(s / 16) % this.chords.length];
      if (i % 4 === 0) a.tone({ type: 'triangle', freq: noteFreq(chord[0] - 12), duration: d * 3, volume: 0.18, when: t, music: true });
      if (i % 2 === 0) a.tone({ type: 'square', freq: noteFreq(chord[(i / 2) % 3] + 24), duration: d * 0.8, volume: 0.035, when: t, music: true });
    },
  },
  title: {
    bpm: 96,
    chords: [[0, 3, 7], [5, 8, 12], [-4, 0, 3], [-5, -1, 2]], // Am Dm F E
    step(a, s, t, d) {
      const i = s % 16;
      const chord = this.chords[Math.floor(s / 16) % this.chords.length];
      if (i === 0) a.tone({ type: 'triangle', freq: noteFreq(chord[0] - 12), duration: d * 14, volume: 0.2, when: t, music: true });
      if (i % 2 === 0) {
        const note = chord[(i / 2) % 3] + 24;
        a.tone({ type: 'triangle', freq: noteFreq(note), duration: d * 1.6, volume: 0.07, when: t, music: true });
      }
    },
  },
};

// Música dos mini-chefes: mesmo "motor" rítmico da batalha final, em Mi menor e mais rápida.
TRACKS.mini = { bpm: 152, chords: [[-5, -2, 2], [3, 7, 10], [5, 9, 12], [2, 6, 9]], step: TRACKS.boss.step };
// Música dos setores: mais 'heroica', em Dó maior (C G Am F).
TRACKS.stage = { bpm: 132, chords: [[3, 7, 10], [-2, 2, 5], [0, 3, 7], [-4, 0, 3]], step: TRACKS.boss.step };

export class AudioEngine {
  constructor(storage) {
    this.storage = storage;
    this.ctx = null;
    this.muted = storage.get('muted', false);
    this.tempo = 1;
    this.track = null;
    this.pendingTrack = null;
    this.timer = null;
    this.lastPlayed = new Map();
  }

  /** Cria/retoma o AudioContext. Deve ser chamado após interação do usuário. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;
    this.master.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.9;
    this.sfxBus.connect(this.master);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.4;
    this.musicBus.connect(this.master);

    // 1 segundo de ruído branco reaproveitado por todos os sons de ruído.
    const length = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    if (this.pendingTrack) this.playMusic(this.pendingTrack);
  }

  toggleMute() {
    this.muted = !this.muted;
    this.storage.set('muted', this.muted);
    if (this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : MASTER_VOLUME, this.ctx.currentTime, 0.02);
    }
    return this.muted;
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  play(name) {
    if (!this.ctx || this.muted) return;
    const fx = SFX[name];
    if (!fx) return;
    // Limita repetições muito próximas do mesmo som (evita "estouro").
    const now = this.ctx.currentTime;
    if (now - (this.lastPlayed.get(name) ?? -1) < 0.03) return;
    this.lastPlayed.set(name, now);
    fx(this);
  }

  tone({ type = 'square', freq = 440, freqEnd = null, duration = 0.1, volume = 0.1, delay = 0, when = null, attack = 0.005, music = false }) {
    const ctx = this.ctx;
    const t = (when ?? ctx.currentTime) + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(music ? this.musicBus : this.sfxBus);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  noise({ duration = 0.3, volume = 0.2, filterFreq = 2000, filterEnd = 200, delay = 0, when = null, music = false }) {
    const ctx = this.ctx;
    const t = (when ?? ctx.currentTime) + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, filterEnd), t + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter).connect(gain).connect(music ? this.musicBus : this.sfxBus);
    src.start(t);
    src.stop(t + duration + 0.02);
  }

  // ---------------------------------------------------------------- música
  playMusic(name) {
    this.pendingTrack = name;
    if (!this.ctx) return;
    this.stopMusic();
    this.pendingTrack = name;
    this.track = TRACKS[name];
    if (!this.track) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.06;
    this.timer = setInterval(() => this.schedule(), SCHEDULER_INTERVAL);
  }

  stopMusic() {
    clearInterval(this.timer);
    this.timer = null;
    this.track = null;
    this.pendingTrack = null;
  }

  setTempo(multiplier) {
    this.tempo = multiplier;
  }

  schedule() {
    if (!this.track || this.ctx.state !== 'running') return;
    const secondsPerStep = 60 / (this.track.bpm * this.tempo) / 4; // semicolcheias
    // Se a aba ficou em segundo plano, não tenta "recuperar" notas atrasadas.
    if (this.nextTime < this.ctx.currentTime - 0.2) this.nextTime = this.ctx.currentTime + 0.05;
    while (this.nextTime < this.ctx.currentTime + LOOKAHEAD) {
      this.track.step(this, this.step, this.nextTime, secondsPerStep);
      this.nextTime += secondsPerStep;
      this.step++;
    }
  }
}
