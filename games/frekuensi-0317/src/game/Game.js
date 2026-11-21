import * as THREE from 'three';
import { Engine } from '../../../../src/core/Engine.js';
import { WorldBuilder } from '../world/WorldBuilder.js';
import { PlayerController } from './PlayerController.js';
import { CreatureAI } from './CreatureAI.js';
import { AudioDirector } from './AudioDirector.js';
import { GameUI } from '../ui/UI.js';
import { CAMPAIGN, NOTES, SECRETS } from '../content.js';
import { SaveManager } from '../save.js';

const REQUIRED_BEACONS = ['beacon-river', 'beacon-ridge', 'beacon-west'];
const CORRECT_VALVES = [2, 1, 3];
const RADIO_TARGET = 103.7;
const FINAL_CODE = '0317';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class Game {
  constructor() {
    this.ui = new GameUI(this);
    this.saves = new SaveManager();
    this.settings = this.saves.loadSettings();
    this.state = null;
    this.engine = null;
    this.builder = null;
    this.player = null;
    this.creature = null;
    this.audio = new AudioDirector();
    this.currentInteraction = null;
    this.currentFrequency = 88;
    this.codeInput = '';
    this.inGame = false;
    this.elapsed = 0;
    this.lastThreatState = false;
    this.hiddenInteraction = null;
    this.saveTimer = 0;
    this.uiTimer = 0;
    this.elapsedTimer = 0;
    this.pointerLockRequested = false;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onLightning = this._onLightning.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('freq:lightning', this._onLightning);
  }

  async launch(loadExisting = false) {
    if (this.inGame) return;
    const loading = document.getElementById('loading-state');
    loading.classList.remove('hidden');
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    this.state = loadExisting ? this.saves.load() : JSON.parse(JSON.stringify((await import('../save.js')).DEFAULT_STATE));
    if (!loadExisting) this.saves.clear();
    this.elapsed = Number(this.state.elapsedSeconds) || 0;
    try {
      const root = document.getElementById('world-layer');
      this.engine = new Engine({ mode: '3d', rendererOptions: { quality: this.settings.quality } });
      this.engine.init(root);
      this.builder = new WorldBuilder(this.engine.renderer.scene);
      this.world = this.builder.build();
      this.#configureScene();
      this.player = new PlayerController(this.engine.renderer.camera, this.engine.renderer.domElement, this.world.colliders, this.settings, this.audio);
      this.creature = new CreatureAI(this.engine.renderer.scene, this.world.colliders, this.audio, () => this.#caught());
      this.creature.deactivate();
      this.#restoreWorldState();
      this.#wireRuntime();
      this.inGame = true;
      this.ui.showHUD();
      this.#updateHud(true);
      this.audio.start().catch(error => console.warn('[FREKUENSI] Audio belum aktif:', error));
      this.engine.start();
      loading.classList.add('hidden');
      this.player.requestLock();
      this.#updateHud(true);
      console.info('[FREKUENSI] Session started. TCS Engine renderer:', this.engine.renderer.constructor.name);
    } catch (error) {
      console.error('[FREKUENSI] Gagal memulai game:', error);
      loading.classList.add('hidden');
      this.ui.showScreen('boot-screen');
      this.ui.showHUD();
      this.ui.showMessage('STARTUP ERROR', 'Game gagal dimulai', `${error.message}. Periksa dukungan WebGL 2 dan jalankan lagi melalui START-FREKUENSI.bat.`, 'KEMBALI', () => this.ui.hideMessage());
    }
  }

  #configureScene() {
    const { scene, camera } = this.engine.renderer;
    scene.background = new THREE.Color(0x0a1518);
    scene.fog = new THREE.FogExp2(0x101b1d, this.settings.quality === 'low' ? 0.014 : 0.0105);
    const flashlight = new THREE.SpotLight(0xe0e9da, 3.0, 30, Math.PI / 7, 0.62, 1.25);
    flashlight.position.set(0, 0, 0);
    flashlight.castShadow = false;
    const target = new THREE.Object3D(); target.position.set(0, 0, -1);
    camera.add(flashlight); camera.add(target); flashlight.target = target;
    this.flashlight = flashlight;
    this.world.lights.forEach(light => { light.intensity *= 0.82; });
    const ambient = new THREE.AmbientLight(0x25373a, 0.32); scene.add(ambient);
    this.ambientLight = ambient;
  }

  #wireRuntime() {
    this.engine.world.addSystem({
      priority: 90,
      enabled: true,
      update: (dt) => this.#update(dt)
    });
    this.engine.renderer.domElement.addEventListener('click', () => {
      if (this.inGame && !this.ui.activeModal && !this.player.hidden && !this.player.locked) this.player.requestLock();
    });
    this.engine.renderer.domElement.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      this.ui.showMessage('GRAFIS', 'Konteks grafis terputus', 'Browser kehilangan konteks WebGL. Muat ulang halaman untuk memulai ulang sesi.', 'KEMBALI KE MENU', () => this.returnToMenu());
    });
  }

  #restoreWorldState() {
    this.state.batteryPickups = Array.isArray(this.state.batteryPickups) ? this.state.batteryPickups : [];
    if (this.state.generatorOn && this.state.chapter < 2) this.state.chapter = 2;
    for (const id of this.state.fuses) this.#hideObject(`fuse-${id}`);
    for (const id of this.state.beacons) this.#lightBeacon(id);
    for (const id of this.state.notes) this.#hideObject(`note-${id}`);
    for (const id of this.state.secrets) this.#hideObject(`secret-${id}`);
    for (const id of this.state.batteryPickups || []) this.#hideObject(id);
    this.player.teleport(this.state.checkpoint.x, this.state.checkpoint.y || 1.68, this.state.checkpoint.z);
    if (this.state.chapter >= 2) this.creature.activate();
  }

  #hideObject(id) {
    const object = this.world.interactionById.get(id);
    if (object) { object.visible = false; object.userData.collected = true; }
  }

  #lightBeacon(id) {
    const object = this.world.interactionById.get(id);
    if (!object) return;
    object.material = new THREE.MeshStandardMaterial({ color: 0x9fdcc5, emissive: 0x52bc92, emissiveIntensity: 2.1 });
  }

  #update(dt) {
    if (!this.inGame || !this.player) return;
    this.builder.updateWeather(dt, this.elapsed);
    this.audio.update(dt);
    const movement = this.player.update(dt);
    this.#updateFlashlight();
    this.creature.update(dt, this.player, this.state.chapter);
    this.#updateInteractionTarget();
    this.#updateChapterTimer(dt);
    this.saveTimer += dt;
    this.uiTimer += dt;
    this.elapsedTimer += dt;
    if (this.saveTimer >= 8) { this.saveTimer = 0; this.#save(); }
    if (this.uiTimer >= 0.12) { this.uiTimer = 0; this.#updateHud(false); }
    if (movement?.moving && this.state.chapter === 3 && this.player.noiseLevel > 0.9) this.creature.state = this.creature.active ? 'hunt' : this.creature.state;
  }

  #updateFlashlight() {
    if (!this.flashlight) return;
    this.flashlight.visible = this.player.flashlightOn && this.player.battery > 0;
    this.flashlight.intensity = this.player.flashlightOn ? 3.0 : 0;
  }

  #updateChapterTimer(dt) {
    this.elapsed += dt;
    this.state.elapsedSeconds = this.elapsed;
  }

  #updateHud(force) {
    const chapter = CAMPAIGN.find(item => item.id === this.state.chapter) || CAMPAIGN[0];
    const progress = this.#chapterProgress();
    if (force || this.uiTimer === 0) {
      this.ui.updateHUD(this.state, this.player, chapter, this.#objectiveText(), this.elapsed);
      document.getElementById('objective-progress-bar').style.width = `${progress.ratio * 100}%`;
      document.getElementById('objective-progress-label').textContent = progress.label;
    }
    const activeThreat = this.creature?.state === 'hunt' && this.creature.active;
    if (activeThreat !== this.lastThreatState) {
      this.lastThreatState = activeThreat;
      this.ui.showThreat(activeThreat);
    }
  }

  #chapterProgress() {
    switch (this.state.chapter) {
      case 1: return { ratio: this.state.fuses.length / 2, label: `${this.state.fuses.length} / 2 SEKring` };
      case 2: return { ratio: this.state.radioAligned ? 1 : 0, label: this.state.radioAligned ? 'SINYAL DIKUNCI' : '1 FREKUENSI' };
      case 3: return { ratio: this.state.beacons.length / 3, label: `${this.state.beacons.length} / 3 RELAI` };
      case 4: return { ratio: this.state.undergroundOpen ? 1 : this.state.valves.filter((v, i) => v === CORRECT_VALVES[i]).length / 3, label: this.state.undergroundOpen ? 'AKSES TERBUKA' : `${this.state.valves.filter((v, i) => v === CORRECT_VALVES[i]).length} / 3 KATUP` };
      case 5: return { ratio: this.state.ending ? 1 : this.state.finalCodeSolved ? 0.72 : 0.35, label: this.state.ending ? 'REKAMAN SELESAI' : this.state.finalCodeSolved ? 'MENUJU MENARA' : 'SIAPKAN SIARAN' };
      default: return { ratio: 1, label: 'SELESAI' };
    }
  }

  #objectiveText() {
    switch (this.state.chapter) {
      case 1: return this.state.fuses.length < 2 ? 'Cari dua sekring keramik di ruang servis dan arsip.' : 'Pasang dua sekring pada panel generator.';
      case 2: return this.state.radioAligned ? 'Sinyal terkunci. Temukan sumber siaran.' : 'Atur radio ke 103.7 MHz.';
      case 3: return 'Aktifkan relai di tepi sungai, punggung bukit, lalu pos barat.';
      case 4: return this.state.undergroundOpen ? 'Gunakan kode akses 0317 dan cari jalan menuju menara.' : 'Atur tiga katup: barat 2, utara 1, selatan 3 putaran.';
      case 5: return this.state.finalCodeSolved ? 'Masuki ruang menara dan aktifkan konsol siaran.' : 'Temukan panel akses dan masukkan kode stasiun.';
      default: return 'Rekaman selesai.';
    }
  }

  #updateInteractionTarget() {
    if (!this.player.locked || this.ui.activeModal || this.player.hidden || !this.inGame) {
      this.currentInteraction = null; this.ui.setPrompt(null, true); return;
    }
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.engine.renderer.camera);
    const hits = raycaster.intersectObjects(this.world.interactables.filter(object => object.visible && !object.userData.collected), false);
    const hit = hits.find(entry => entry.distance <= 4.6 && entry.object.userData.interaction);
    this.currentInteraction = hit ? hit.object : null;
    this.ui.setPrompt(hit?.object.userData.interaction || null, !hit);
  }

  #onKeyDown(event) {
    if (!this.inGame) return;
    if (event.repeat && ['KeyF','KeyT','KeyJ','Escape','Enter','Backspace'].includes(event.code)) return;
    if (this.ui.activeModal === 'radio-modal') {
      if (event.code === 'KeyQ' || event.code === 'ArrowLeft') { this.adjustFrequency(-0.1); event.preventDefault(); }
      if (event.code === 'KeyE' || event.code === 'ArrowRight') { this.adjustFrequency(0.1); event.preventDefault(); }
      if (event.code === 'Enter') this.submitFrequency();
      if (event.code === 'Escape') this.ui.closeModal(true);
      return;
    }
    if (this.ui.activeModal === 'code-modal') {
      if (/^Digit\d$/.test(event.code) || /^Numpad\d$/.test(event.code)) this.appendCode(event.key.slice(-1));
      if (event.code === 'Backspace') this.eraseCode();
      if (event.code === 'Enter') this.submitCode();
      if (event.code === 'Escape') this.ui.closeModal(true);
      return;
    }
    if (this.ui.activeModal || document.getElementById('screen-message').classList.contains('hidden') === false) {
      if (event.code === 'Escape') this.ui.closeModal(true);
      return;
    }
    if (event.code === 'Escape') {
      this.engine.pause(); this.player.releaseLock(); this.ui.showPause();
    } else if (event.code === 'KeyF') this.interact();
    else if (event.code === 'KeyT') {
      const on = this.player.toggleFlashlight();
      if (!on && this.player.battery <= 1) this.ui.showToast('BATERAI SENTER HABIS');
      else this.audio.radioTone(on ? 580 : 260, 0.08);
    } else if (event.code === 'KeyJ') this.ui.journal(this.state);
  }

  interact() {
    if (this.player.hidden) { this.player.setHidden(false); this.hiddenInteraction = null; this.ui.showToast('ANDA KELUAR DARI PERSEMBUNYIAN'); this.player.requestLock(); return; }
    const object = this.currentInteraction;
    if (!object?.userData.interaction) return;
    const { id, type, data, label } = object.userData.interaction;
    if (object.userData.collected) return;
    switch (type) {
      case 'fuse': return this.#collectFuse(object, data.fuse);
      case 'generator': return this.#useGenerator();
      case 'radio': return this.#useRadio();
      case 'beacon': return this.#activateBeacon(object, id);
      case 'note': return this.#collectNote(object, data.noteId);
      case 'secret': return this.#collectSecret(object, data.secretId);
      case 'battery': return this.#collectBattery(object);
      case 'hide': this.hiddenInteraction = object; this.player.setHidden(true); this.ui.showToast('BERSEMBUNYI · TEKAN F UNTUK KELUAR'); return;
      case 'basement-hatch': return this.#enterUnderground();
      case 'exit-underground': return this.#exitUnderground();
      case 'valve': return this.ui.openValves(this.state.valves);
      case 'code-panel': if (!this.state.undergroundOpen) { this.ui.showToast('PANEL MENUNGGU TEKANAN STABIL'); return; } this.codeInput = ''; this.ui.openCode('Panel akses bawah tanah', 'Petunjuk tanggal penutupan stasiun ada di arsip.'); return;
      case 'tower-door': return this.#enterTower();
      case 'tower-console': return this.#openEndingChoice();
      case 'relay-terminal': this.audio.radioStatic(); this.ui.showToast('TERMINAL RELAI · LOG TERAKHIR TERSIMPAN DI JURNAL'); return;
      case 'final-panel': return this.#openEndingChoice();
      case 'door': this.ui.showToast(label); return;
      default: this.ui.showToast('TIDAK ADA YANG TERJADI');
    }
  }

  #collectFuse(object, id) {
    if (this.state.fuses.includes(id)) return;
    this.state.fuses.push(id); object.visible = false; object.userData.collected = true;
    this.audio.radioTone(720, 0.12); this.ui.showToast(`SEKRING ${id.toUpperCase()} DITEMUKAN`); this.#save();
  }

  #useGenerator() {
    if (this.state.generatorOn) { this.ui.showToast('GENERATOR SUDAH MENYALA'); return; }
    if (this.state.fuses.length < 2) { this.ui.showToast('MASIH MEMBUTUHKAN DUA SEKRING KERAMIK'); return; }
    this.state.generatorOn = true;
    this.state.checkpoint = { x: 0, y: 1.68, z: 10.8 };
    this.#advanceChapter(2, 'GENERATOR AKTIF', 'Lampu-lampu stasiun menyala. Dari ruang kontrol, radio mulai mengeluarkan suara napas.');
    this.creature.activate(); this.#save();
  }

  #useRadio() {
    if (!this.state.generatorOn) { this.ui.showToast('PANEL RADIO BELUM MENDAPAT DAYA'); return; }
    if (this.state.radioAligned) { this.ui.showToast('FREKUENSI 103.7 MHz SUDAH TERSIMPAN'); return; }
    this.currentFrequency = 88;
    this.player.releaseLock();
    this.ui.openRadio(this.currentFrequency, RADIO_TARGET);
  }

  adjustFrequency(amount) {
    this.currentFrequency = clamp(Math.round((this.currentFrequency + amount) * 10) / 10, 88, 108);
    this.ui.updateRadio(this.currentFrequency, RADIO_TARGET);
    this.audio.radioStatic();
  }

  setFrequency(value) {
    this.currentFrequency = clamp(Math.round(value * 10) / 10, 88, 108);
    this.ui.updateRadio(this.currentFrequency, RADIO_TARGET);
    if (Math.abs(this.currentFrequency - RADIO_TARGET) < 0.6) this.audio.radioTone(390 + (this.currentFrequency - 88) * 15, 0.04);
  }

  submitFrequency() {
    if (Math.abs(this.currentFrequency - RADIO_TARGET) > 0.06) {
      document.getElementById('radio-feedback').textContent = 'SINyal BELUM STABIL · CARI NADA YANG TEPAT';
      this.audio.radioStatic(); return;
    }
    this.state.radioAligned = true;
    this.audio.radioTone(1037, 0.35);
    this.ui.closeModal(false); this.#advanceChapter(3, 'SINYAL TERKUNCI', 'Siaran itu menyebut tiga titik relai. Salah satu suara di radio menyebut nama Anda.');
    this.#save(); this.player.requestLock();
  }

  #activateBeacon(object, id) {
    if (this.state.chapter < 3) { this.ui.showToast('RELAI BELUM MENERIMA SUMBER DAYA'); return; }
    if (this.state.beacons.includes(id)) { this.ui.showToast('RELAI SUDAH AKTIF'); return; }
    const next = REQUIRED_BEACONS[this.state.beacons.length];
    if (id !== next) {
      this.ui.showToast('URUTAN RELAI SALAH · PERIKSA PETA JALUR'); this.audio.radioStatic();
      if (this.creature) this.creature.state = 'search'; return;
    }
    this.state.beacons.push(id); this.#lightBeacon(id); this.audio.radioTone(480 + this.state.beacons.length * 120, 0.18);
    this.ui.showToast(`RELAI ${this.state.beacons.length}/3 AKTIF`); this.#save();
    if (this.state.beacons.length === 3) {
      this.state.checkpoint = { x: 10.8, y: 1.68, z: -7.4 };
      this.#advanceChapter(4, 'TIGA RELAI MENYALA', 'Pintu di bawah stasiun terbuka. Sinyal itu kini terdengar dari bawah tanah.');
    }
  }

  #collectNote(object, noteId) {
    const note = NOTES.find(item => item.id === noteId);
    if (!note) return;
    if (!this.state.notes.includes(noteId)) {
      this.state.notes.push(noteId); object.userData.collected = true; object.visible = false;
      this.audio.radioTone(660, 0.08); this.#save();
    }
    this.player.releaseLock(); this.ui.openNote(note);
  }

  #collectSecret(object, secretId) {
    const secret = SECRETS.find(item => item.id === secretId);
    if (!secret) return;
    if (!this.state.secrets.includes(secretId)) {
      this.state.secrets.push(secretId); object.userData.collected = true; object.visible = false;
      this.audio.radioTone(880, 0.24); this.ui.showToast(`FRAGMEN RAHASIA · ${secret.label.toUpperCase()}`); this.#save();
    }
  }

  #collectBattery(object) {
    object.visible = false; object.userData.collected = true;
    this.player.recharge(36); this.state.batteries = Math.min(4, this.state.batteries + 1);
    this.audio.radioTone(520, 0.1); this.ui.showToast('BATERAI SENTER +36%'); this.#save();
  }

  #enterUnderground() {
    if (this.state.chapter < 4 || this.state.beacons.length < 3) { this.ui.showToast('AKSES TERKUNCI · AKTIFKAN TIGA RELAI'); return; }
    this.player.teleport(32, 1.68, -22.2); this.player.yaw = 0; this.player.pitch = 0;
    this.state.discoveredAreas = [...new Set([...this.state.discoveredAreas, 'underground'])];
    this.state.checkpoint = { x: 38, y: 1.68, z: -16.4 }; this.ui.showToast('FASILITAS BAWAH TANAH · TEKANAN KRITIS'); this.#save();
  }

  #exitUnderground() {
    if (!this.state.undergroundOpen) { this.ui.showToast('HATCH TERKUNCI DARI SISI INI'); return; }
    this.player.teleport(10.8, 1.68, -7.5); this.state.checkpoint = { x: 10.8, y: 1.68, z: -7.5 };
    this.ui.showToast('KEMBALI KE PERMUKAAN'); this.#save();
  }

  adjustValve(index, direction) {
    if (index < 0 || index > 2) return;
    this.state.valves[index] = (this.state.valves[index] + direction + 4) % 4;
    this.audio.radioTone(230 + this.state.valves[index] * 60, 0.07);
  }

  submitValves() {
    const correct = this.state.valves.every((value, index) => value === CORRECT_VALVES[index]);
    if (!correct) {
      document.getElementById('valve-feedback').textContent = 'TEKANAN TIDAK SEIMBANG · PERIKSA DIAGRAM';
      this.audio.radioStatic(); return;
    }
    this.state.undergroundOpen = true;
    this.ui.closeModal(false); this.#save();
    this.engine.pause();
    this.ui.showMessage('TEKANAN STABIL', 'Hatch terbuka', 'Pintu besi di ujung koridor terlepas. Panel akses di dekatnya menunggu kode empat digit.', 'LANJUTKAN', () => { this.ui.hideMessage(); this.engine.resume(); this.player.requestLock(); });
  }

  appendCode(digit) {
    if (!/^\d$/.test(digit) || this.codeInput.length >= 4) return;
    this.codeInput += digit; this.ui.updateCode(this.codeInput);
  }
  eraseCode() { this.codeInput = this.codeInput.slice(0, -1); this.ui.updateCode(this.codeInput); }

  submitCode() {
    if (this.codeInput !== FINAL_CODE) {
      document.getElementById('code-feedback').textContent = 'KODE DITOLAK · COBA LAGI'; this.codeInput = ''; this.ui.updateCode(this.codeInput); this.audio.radioStatic(); return;
    }
    this.state.finalCodeSolved = true; this.state.undergroundOpen = true;
    this.state.checkpoint = { x: 10.8, y: 1.68, z: -7.5 };
    this.codeInput = ''; this.ui.closeModal(false); this.#advanceChapter(5, 'KODE 0317 DITERIMA', 'Sistem membuka jalur servis menuju menara utama. Di sana, seseorang sedang menunggu di balik kaca.'); this.#save();
  }

  #enterTower() {
    if (!this.state.finalCodeSolved) { this.ui.showToast('RUANG MENARA TERKUNCI'); return; }
    this.player.teleport(0, 1.68, -100.2); this.player.yaw = 0; this.player.pitch = 0;
    this.state.discoveredAreas = [...new Set([...this.state.discoveredAreas, 'tower'])];
    this.state.checkpoint = { x: 0, y: 1.68, z: -100.2 }; this.#save(); this.ui.showToast('RUANG KONSOL · SINYAL TERAKHIR');
  }

  #openEndingChoice() {
    if (!this.state.finalCodeSolved) { this.ui.showToast('SISTEM BELUM SIAP'); return; }
    this.player.releaseLock(); this.ui.showEnding();
  }

  finish(choice) {
    if (!['transmit', 'sever'].includes(choice)) return;
    this.state.ending = choice; this.state.chapter = 5; this.#save();
    this.ui.closeModal(false);
    const allSecrets = this.state.secrets.length === SECRETS.length;
    const text = choice === 'transmit'
      ? (allSecrets ? 'Anda mengirim seluruh fragmen ke udara. Di antara suara statis, terdengar nama-nama yang pernah hilang dari daftar operator. Lalu radio di rumah-rumah sekitar menyala bersamaan.' : 'Sinyal meninggalkan menara. Beberapa detik kemudian, semua radio di lembah menjawab dengan suara yang sama. Anda tidak tahu apakah mereka meminta tolong atau sedang memanggil orang berikutnya.')
      : (allSecrets ? 'Anda memutus pemancar dan membawa kelima fragmen keluar. Pagi tiba tanpa suara radio. Di saku Anda, rekaman terakhir masih berputar, meski alat pemutarnya tidak memiliki baterai.' : 'Anda memutus kabel utama. Suara itu berhenti. Saat fajar tiba, stasiun terlihat kosong. Di buku jaga, nama Anda sudah tertulis untuk shift berikutnya.');
    this.engine.pause();
    this.ui.showMessage(choice === 'transmit' ? 'ENDING · SIARAN TERKIRIM' : 'ENDING · SUMBER DIPUTUS', allSecrets ? 'ARSIP TERUNGKAP' : 'REKAMAN SELESAI', text, 'KEMBALI KE MENU', () => this.returnToMenu());
  }

  #advanceChapter(chapter, title, copy) {
    this.state.chapter = chapter; this.state.discoveredAreas = [...new Set([...this.state.discoveredAreas, chapter === 2 ? 'control-room' : chapter === 3 ? 'forest' : chapter === 4 ? 'underground' : 'tower-route'])];
    this.engine?.pause();
    this.ui.showMessage(`BAB ${String(chapter).padStart(2, '0')} · ${CAMPAIGN[chapter - 1].name}`, title, copy, 'LANJUTKAN', () => { this.ui.hideMessage(); this.engine?.resume(); this.player?.requestLock(); this.#updateHud(true); });
    this.#save(); this.#updateHud(true);
  }

  #caught() {
    if (!this.inGame || this.ui.activeModal) return;
    this.player.releaseLock(); this.engine.pause(); this.state.deathCount++;
    const point = this.state.checkpoint || { x: 0, y: 1.68, z: 10.8 };
    this.player.teleport(point.x, point.y, point.z);
    this.creature.state = 'search'; this.creature.attackCooldown = 5;
    this.#save();
    this.ui.showMessage('SINyal TERPUTUS', 'Anda ditemukan.', 'Dunia menghitam. Saat Anda membuka mata, suara hujan kembali terdengar. Stasiun belum selesai dengan Anda.', 'COBA LAGI', () => { this.ui.hideMessage(); this.engine.resume(); this.player.requestLock(); });
  }

  #onLightning(event) {
    if (!this.inGame || !this.ambientLight) return;
    const duration = event.detail?.duration || 0.18;
    this.ambientLight.intensity = 2.8;
    const flash = document.getElementById('weather-flash');
    flash.style.opacity = '0.36';
    window.setTimeout(() => { if (this.ambientLight) this.ambientLight.intensity = 0.32; flash.style.opacity = '0'; }, duration * 1000);
  }

  updateSetting(key, value) {
    this.settings[key] = value; this.saves.saveSettings(this.settings);
    if (key === 'quality') this.engine?.renderer?.setQuality(value);
    if (key === 'sensitivity' || key === 'invertY') { if (this.player) this.player.settings = this.settings; }
    if (key === 'volume') this.audio.setVolume(value);
  }

  resume() {
    this.ui.closeModal(false); this.engine?.resume(); this.player?.requestLock();
  }

  returnToMenu() {
    this.inGame = false;
    this.player?.dispose(); this.creature?.deactivate(); this.audio.dispose(); this.engine?.dispose();
    this.player = this.creature = this.builder = this.engine = null;
    this.ui.hideHUD(); this.ui.hideMessage(); this.ui.modalLayer.classList.add('hidden');
    this.ui.showScreen('boot-screen');
    document.getElementById('continue-button').classList.toggle('hidden', !this.saves.hasSave());
  }

  #save() { if (this.state) { this.state.elapsedSeconds = this.elapsed; this.saves.save(this.state); } }

  dispose() {
    this.returnToMenu();
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('freq:lightning', this._onLightning);
  }
}
