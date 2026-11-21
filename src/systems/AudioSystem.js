export class AudioSystem {
  constructor() { this.ctx=null; this.master=null; this.volume=0.7; }
  init() {
    if(this.ctx)return this;
    const AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!AudioContextClass)return this;
    this.ctx=new AudioContextClass(); this.master=this.ctx.createGain();
    this.master.gain.value=this.volume; this.master.connect(this.ctx.destination); return this;
  }
  async resume() { if(this.ctx?.state==='suspended')await this.ctx.resume(); }
  setVolume(value) {
    this.volume=Math.max(0,Math.min(1,Number(value)||0));
    if(this.master)this.master.gain.value=this.volume; return this.volume;
  }
  beep(frequency=440,duration=0.1,type='sine',volume=0.3) {
    if(!this.ctx||!this.master)return null;
    const oscillator=this.ctx.createOscillator(),gain=this.ctx.createGain();
    const safeDuration=Math.max(0.01,Number(duration)||0.1);
    oscillator.type=type; oscillator.frequency.value=Math.max(1,Number(frequency)||440);
    gain.gain.setValueAtTime(Math.max(0.0001,Number(volume)||0.3),this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001,this.ctx.currentTime+safeDuration);
    oscillator.connect(gain).connect(this.master); oscillator.start(); oscillator.stop(this.ctx.currentTime+safeDuration);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();}; return oscillator;
  }
  noise(duration=0.1,volume=0.3) {
    if(!this.ctx||!this.master)return null;
    const seconds=Math.max(0.01,Number(duration)||0.1);
    const buffer=this.ctx.createBuffer(1,Math.ceil(this.ctx.sampleRate*seconds),this.ctx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++){const fade=1-i/data.length;data[i]=(Math.random()*2-1)*fade*fade*fade;}
    const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();
    source.buffer=buffer;gain.gain.value=Math.max(0,Math.min(1,Number(volume)||0));
    source.connect(gain).connect(this.master);source.start();source.onended=()=>{source.disconnect();gain.disconnect();};return source;
  }
  dispose() { if(this.ctx){this.ctx.close();this.ctx=null;this.master=null;} }
}
