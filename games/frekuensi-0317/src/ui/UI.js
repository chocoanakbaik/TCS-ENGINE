import { CAMPAIGN, NOTES, SECRETS } from '../content.js';

const $ = (id) => document.getElementById(id);

export class GameUI {
  constructor(game) {
    this.game = game;
    this.activeModal = null;
    this.lastModal = null;
    this.modalLayer = $('modal-layer');
    this._bindStatic();
  }

  _bindStatic() {
    $('start-button').addEventListener('click', () => this.showScreen('intro-screen'));
    $('continue-button').addEventListener('click', () => this.game.launch(true));
    $('enter-station').addEventListener('click', () => this.game.launch(false));
    $('settings-button').addEventListener('click', () => this.openSettings());
    $('credits-button').addEventListener('click', () => this.openModal('credits-modal'));
    $('resume-button').addEventListener('click', () => this.game.resume());
    $('pause-settings').addEventListener('click', () => this.openSettings('pause-modal'));
    $('quit-button').addEventListener('click', () => this.game.returnToMenu());
    document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => this.closeModal(true)));
    $('freq-down').addEventListener('click', () => this.game.adjustFrequency(-0.1));
    $('freq-up').addEventListener('click', () => this.game.adjustFrequency(0.1));
    $('frequency-slider').addEventListener('input', event => this.game.setFrequency(Number(event.target.value)));
    $('tune-submit').addEventListener('click', () => this.game.submitFrequency());
    $('code-submit').addEventListener('click', () => this.game.submitCode());
    $('valve-submit').addEventListener('click', () => this.game.submitValves());
    $('ending-send').addEventListener('click', () => this.game.finish('transmit'));
    $('ending-cut').addEventListener('click', () => this.game.finish('sever'));
    $('message-button').addEventListener('click', () => this.game.onMessageContinue?.());
    $('quality-select').addEventListener('change', event => this.game.updateSetting('quality', event.target.value));
    $('sensitivity-slider').addEventListener('input', event => this.game.updateSetting('sensitivity', Number(event.target.value)));
    $('volume-slider').addEventListener('input', event => this.game.updateSetting('volume', Number(event.target.value)));
    $('invert-y').addEventListener('change', event => this.game.updateSetting('invertY', event.target.checked));
  }

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(el => el.classList.toggle('active', el.id === id));
  }

  showHUD() {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    $('hud').classList.remove('hidden');
    $('boot-screen').classList.remove('active');
  }

  hideHUD() { $('hud').classList.add('hidden'); }

  openModal(id, previous = null) {
    this.game.player?.releaseLock();
    this.activeModal = id;
    this.lastModal = previous;
    this.modalLayer.classList.remove('hidden');
    this.modalLayer.querySelectorAll('.modal').forEach(el => el.classList.toggle('hidden', el.id !== id));
  }

  closeModal(restorePointer = false) {
    const closingModal = this.activeModal;
    this.modalLayer.classList.add('hidden');
    this.modalLayer.querySelectorAll('.modal').forEach(el => el.classList.add('hidden'));
    const previous = this.lastModal;
    this.activeModal = null;
    this.lastModal = null;
    if (previous) this.openModal(previous);
    else {
      if (closingModal === 'pause-modal') this.game.engine?.resume();
      if (restorePointer && this.game.player && this.game.inGame) this.game.player.requestLock();
    }
  }

  openSettings(previous = null) {
    const settings = this.game.settings;
    $('quality-select').value = settings.quality;
    $('sensitivity-slider').value = settings.sensitivity;
    $('volume-slider').value = settings.volume;
    $('invert-y').checked = settings.invertY;
    this.openModal('settings-modal', previous);
  }

  updateHUD(state, player, chapter, objective, elapsed) {
    $('chapter-number').textContent = `CH ${String(chapter.id).padStart(2, '0')}`;
    $('chapter-name').textContent = chapter.name;
    $('objective-text').textContent = objective;
    $('battery-value').textContent = `${Math.round(player.battery)}%`;
    $('battery-bar').style.width = `${player.battery}%`;
    $('signal-status').textContent = state.radioAligned ? 'SIGNAL TERKUNCI' : state.generatorOn ? 'SINYAL LEMAH' : 'NO SIGNAL';
    $('clock').textContent = this.formatClock(elapsed);
    $('inventory-items').innerHTML = [
      ...state.fuses.map(() => '<span title="Sekring keramik">▰</span>'),
      ...(state.batteries > 0 ? Array.from({length: Math.min(3,state.batteries)}, () => '<span title="Baterai">▣</span>') : [])
    ].join('') || '<span class="empty-slot">—</span>';
    $('noise-label').textContent = player.hidden ? 'TERSEMBUNYI' : player.noiseLevel > 0.8 ? 'LANGKAH KERAS' : player.noiseLevel > 0.2 ? 'LANGKAH TERDENGAR' : 'LANGKAH TENANG';
    document.querySelector('.noise-bars').classList.toggle('active', player.noiseLevel > 0.2);
  }

  formatClock(elapsed) {
    const seconds = Math.floor(elapsed);
    const total = 3 * 3600 + 17 * 60 + seconds;
    const h = Math.floor(total / 3600) % 24;
    const m = Math.floor(total / 60) % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  setPrompt(interaction, hidden = false) {
    $('interact-prompt').classList.toggle('hidden', hidden || !interaction);
    if (interaction) $('interact-text').textContent = interaction.label.toUpperCase();
  }

  journal(state) {
    const notes = NOTES.filter(note => state.notes.includes(note.id));
    $('note-date').textContent = `JURNAL OPERATOR · ${notes.length}/${NOTES.length} DOKUMEN`;
    $('note-title').textContent = 'CATATAN YANG DITEMUKAN';
    const body = $('note-body');
    body.innerHTML = notes.length ? notes.map(note => `<article class="journal-entry"><small>${note.date} · CH ${note.chapter}</small><strong>${this.escape(note.title)}</strong><p>${this.escape(note.body)}</p></article>`).join('') : '<p>Belum ada catatan yang ditemukan. Periksa meja, rak, pos relai, dan ruangan yang jarang dikunjungi.</p>';
    this.openModal('note-modal');
  }

  openNote(note) {
    $('note-date').textContent = note.date;
    $('note-title').textContent = note.title;
    $('note-body').textContent = note.body;
    this.openModal('note-modal');
  }

  openRadio(frequency, target) {
    this.updateRadio(frequency, target);
    $('radio-feedback').textContent = 'Putar kenop hingga garis sinyal berimpit.';
    this.openModal('radio-modal');
  }

  updateRadio(frequency, target) {
    $('frequency-value').textContent = frequency.toFixed(1);
    $('frequency-slider').value = String(frequency);
    const pos = Math.max(0, Math.min(100, (frequency - 88) / 20 * 100));
    const targetPos = Math.max(0, Math.min(100, (target - 88) / 20 * 100));
    $('tuner-marker').style.left = `${pos}%`;
    $('tuner-target').style.left = `${targetPos}%`;
    const clarity = Math.max(0, 100 - Math.abs(frequency - target) * 8.5);
    $('radio-feedback').textContent = `KEJERNIHAN SINYAL ${Math.round(clarity)}%`;
  }

  openCode(title, hint) {
    $('code-title').textContent = title;
    $('code-hint').textContent = hint;
    $('code-display').textContent = '_ _ _ _';
    $('code-feedback').textContent = '';
    $('code-grid').innerHTML = '';
    for (let i = 0; i <= 9; i++) {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = String(i);
      button.addEventListener('click', () => this.game.appendCode(String(i)));
      $('code-grid').appendChild(button);
    }
    const erase = document.createElement('button'); erase.type='button'; erase.textContent='⌫'; erase.addEventListener('click',()=>this.game.eraseCode()); $('code-grid').appendChild(erase);
    this.openModal('code-modal');
  }

  updateCode(code) { $('code-display').textContent = code.padEnd(4, '_').split('').join(' '); }

  openValves(values) {
    const labels = ['KATUP BARAT', 'KATUP UTARA', 'KATUP SELATAN'];
    $('valve-list').innerHTML = values.map((value, index) => `<div class="valve-row"><span>${labels[index]}</span><button data-valve="${index}" data-dir="-1">−</button><b>${value} / 3</b><button data-valve="${index}" data-dir="1">+</button></div>`).join('');
    $('valve-list').querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.valve); const direction = Number(button.dataset.dir);
      this.game.adjustValve(index, direction); this.openValves(this.game.state.valves);
    }));
    this.openModal('valve-modal');
  }

  showMessage(kicker, title, copy, button = 'LANJUTKAN', callback = null) {
    $('message-kicker').textContent = kicker;
    $('message-title').textContent = title;
    $('message-copy').textContent = copy;
    $('message-button').textContent = button;
    this.game.onMessageContinue = callback;
    $('screen-message').classList.remove('hidden');
    this.game.player?.releaseLock();
  }

  hideMessage() { $('screen-message').classList.add('hidden'); }
  showPause() { this.openModal('pause-modal'); }
  showEnding() { this.openModal('ending-modal'); }

  showThreat(active) { $('threat-warning').classList.toggle('hidden', !active); }

  showToast(text) {
    const el = $('journal-toast'); el.textContent = text; el.classList.remove('hidden');
    clearTimeout(this._toastTimer); this._toastTimer = setTimeout(() => el.classList.add('hidden'), 2800);
  }

  showInteractError(text) {
    $('radio-feedback').textContent = text;
  }

  escape(text) {
    return String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
}
