/* ===== Âm thanh WebAudio: bíp đơn giản, không cần file ngoài ===== */
'use strict';

const Sfx = {
  ctx: null,
  muted: false,

  // Gọi trong lần chạm đầu tiên (trình duyệt yêu cầu gesture mới cho phát âm thanh)
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    } catch (e) { this.ctx = null; }
  },

  // Một nốt bíp
  tone(freq, dur, type, vol, delay) {
    if (this.muted || !this.ctx) return;
    type = type || 'sine'; vol = vol || 0.15; delay = delay || 0;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  },

  click()  { this.tone(600, 0.07, 'square', 0.06); },
  // Cá cắn: 2 tiếng nhấp
  bite()   { this.tone(880, 0.09, 'square', 0.10); this.tone(880, 0.09, 'square', 0.10, 0.14); },
  // Giật trúng: âm vút lên
  hooked() { this.tone(520, 0.08, 'sawtooth', 0.08); this.tone(780, 0.10, 'sawtooth', 0.08, 0.09); },
  // Hụt / đứt / tuột: âm trầm xuống
  fail()   { this.tone(220, 0.18, 'sawtooth', 0.08); this.tone(160, 0.22, 'sawtooth', 0.08, 0.12); },
  // Bắt được cá: 3 nốt vui
  caught() { this.tone(523, 0.10, 'triangle', 0.12); this.tone(659, 0.10, 'triangle', 0.12, 0.11); this.tone(784, 0.16, 'triangle', 0.12, 0.22); },
  // Bán cá: tiếng "keng" tiền
  sell()   { this.tone(1320, 0.08, 'square', 0.07); this.tone(1760, 0.14, 'square', 0.07, 0.09); },
  // Tõm nước
  splash() { this.tone(300, 0.12, 'sine', 0.10); this.tone(180, 0.15, 'sine', 0.08, 0.06); },
};
