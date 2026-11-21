export class AudioDirector {
  constructor() {
    this.context = null;
    this.master = null;
    this.ambience = [];
    this.running = false;
    this.volume = 0.8;
    this.thunderTimer = 0;
    this.stepCooldown = 0;
  }

  async start() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    if (!this.context) {
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.context.destination);
      this.#startRain();
      this.#startWind();
      this.#startStationHum();
    }
    if (this.context.state === 'suspended') await this.context.resume();
    this.running = true;
    this.thunderTimer = 18 + Math.random() * 12;
    return true;
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, Number(value) || 0));
    if (this.master) this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.04);
  }

  #noiseBuffer(seconds = 2) {
    const length = Math.ceil(this.context.sampleRate * seconds);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (0.65 + Math.random() * 0.35);
    return buffer;
  }

  #loopNoise({ lowpass = 4000, highpass = 0, volume = 0.04, playbackRate = 1 }) {
    const source = this.context.createBufferSource();
    source.buffer = this.#noiseBuffer(3);
    source.loop = true;
    source.playbackRate.value = playbackRate;
    let previous = source;
    if (highpass) {
      const hp = this.context.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = highpass;
      previous.connect(hp); previous = hp;
    }
    if (lowpass) {
      const lp = this.context.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = lowpass;
      previous.connect(lp); previous = lp;
    }
    const gain = this.context.createGain(); gain.gain.value = volume;
    previous.connect(gain).connect(this.master);
    source.start();
    this.ambience.push(source, gain);
  }

  #startRain() { this.#loopNoise({ lowpass: 6500, highpass: 550, volume: 0.055 }); }
  #startWind() { this.#loopNoise({ lowpass: 260, highpass: 70, volume: 0.12, playbackRate: 0.75 }); }

  #startStationHum() {
    for (const [frequency, volume] of [[53, 0.012], [79, 0.006]]) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.value = volume;
      oscillator.connect(gain).connect(this.master); oscillator.start();
      this.ambience.push(oscillator, gain);
    }
  }

  update(dt) {
    if (!this.running) return;
    this.thunderTimer -= dt;
    if (this.thunderTimer <= 0) {
      this.thunder();
      this.thunderTimer = 24 + Math.random() * 32;
    }
  }

  footstep(mode = 'walk') {
    if (!this.context || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    const duration = mode === 'run' ? 0.15 : 0.12;
    const source = this.context.createBufferSource(); source.buffer = this.#noiseBuffer(duration);
    const filter = this.context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = mode === 'run' ? 750 : 520;
    const gain = this.context.createGain();
    const volume = mode === 'run' ? 0.58 : mode === 'crouch' ? 0.18 : 0.36;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(gain).connect(this.master); source.start(now); source.stop(now + duration);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    const thump = this.context.createOscillator();
    const thumpGain = this.context.createGain();
    thump.type = 'sine'; thump.frequency.setValueAtTime(mode === 'run' ? 82 : 66, now);
    thump.frequency.exponentialRampToValueAtTime(35, now + 0.075);
    thumpGain.gain.setValueAtTime(volume * 0.6, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    thump.connect(thumpGain).connect(this.master); thump.start(now); thump.stop(now + 0.1);
  }

  thunder() {
    if (!this.context || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    const delay = 0.25 + Math.random() * 0.7;
    const source = this.context.createBufferSource(); source.buffer = this.#noiseBuffer(5.5);
    const low = this.context.createBiquadFilter(); low.type = 'lowpass'; low.frequency.setValueAtTime(280, now); low.frequency.exponentialRampToValueAtTime(65, now + 4.8);
    const high = this.context.createBiquadFilter(); high.type = 'highpass'; high.frequency.value = 28;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, now + delay);
    gain.gain.linearRampToValueAtTime(0.72, now + delay + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 5.2);
    source.connect(high).connect(low).connect(gain).connect(this.master);
    source.start(now + delay); source.stop(now + delay + 5.3);
    source.onended = () => { source.disconnect(); high.disconnect(); low.disconnect(); gain.disconnect(); };
    if (Math.random() > 0.45) {
      const flash = window.dispatchEvent(new CustomEvent('freq:lightning', { detail: { duration: 0.16 + Math.random() * 0.12 } }));
    }
  }

  radioStatic() {
    if (!this.context || this.context.state !== 'running') return;
    const source = this.context.createBufferSource(); source.buffer = this.#noiseBuffer(0.42);
    const band = this.context.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = 1800; band.Q.value = 0.8;
    const gain = this.context.createGain(); gain.gain.value = 0.17;
    source.connect(band).connect(gain).connect(this.master); source.start(); source.stop(this.context.currentTime + 0.42);
    source.onended = () => { source.disconnect(); band.disconnect(); gain.disconnect(); };
  }

  radioTone(frequency = 440, duration = 0.18) {
    if (!this.context || this.context.state !== 'running') return;
    const oscillator = this.context.createOscillator(); const gain = this.context.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0.13, this.context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    oscillator.connect(gain).connect(this.master); oscillator.start(); oscillator.stop(this.context.currentTime + duration);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }

  creatureCall() {
    if (!this.context || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator(); const filter = this.context.createBiquadFilter(); const gain = this.context.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(92, now); osc.frequency.exponentialRampToValueAtTime(31, now + 1.1);
    filter.type = 'lowpass'; filter.frequency.value = 230;
    gain.gain.setValueAtTime(0.0001, now); gain.gain.linearRampToValueAtTime(0.2, now + 0.08); gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
    osc.connect(filter).connect(gain).connect(this.master); osc.start(); osc.stop(now + 1.4);
    osc.onended = () => { osc.disconnect(); filter.disconnect(); gain.disconnect(); };
  }

  dispose() {
    this.running = false;
    for (const node of this.ambience) { try { node.stop?.(); node.disconnect?.(); } catch {} }
    this.ambience.length = 0;
    if (this.context) { this.context.close(); this.context = null; this.master = null; }
  }
}
