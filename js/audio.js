/* ===== Âm thanh WebAudio: bíp đơn giản, không cần file ngoài ===== */
'use strict';

const Sfx = {
  ctx: null,
  muted: false,

  // Gọi trong lần chạm đầu tiên (trình duyệt yêu cầu gesture mới cho phát âm thanh)
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') { try { this.ctx.resume(); } catch (e) {} }
    } else {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      } catch (e) { this.ctx = null; }
    }
    // Nhạc nền khởi động cùng lần tương tác đầu tiên (đúng chính sách autoplay)
    if (this.ctx && !this.muted) { try { Music.start(this.ctx); } catch (e) {} }
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
  // Cuốc bổ xuống đất: "cụp" trầm
  dig()    { this.tone(140, 0.09, 'triangle', 0.14); this.tone(85, 0.13, 'sine', 0.12, 0.05); },
};

/* ===== Nhạc nền: Web Audio thuần, giai điệu ngũ cung gợi quê Việt Nam =====
   - Không file ngoài, loop liền mạch bằng lookahead scheduler
   - Chạy sau thao tác chạm/bấm đầu tiên; nút 🔊 tắt cả nhạc + hiệu ứng */
const Music = {
  ctx: null,
  gain: null,       // master gain riêng của nhạc (cân volume với SFX)
  timer: null,
  playing: false,   // flag cho test/debug
  bpm: 76,
  beat: 0,
  nextTime: 0,

  // Thang ngũ cung Đô: C D E G A (2 quãng 8)
  scale: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
  // Giai điệu: [beat bắt đầu, độ dài (beat), index nốt] — vòng 32 beat, có nốt nghỉ
  melody: [
    [0, 1, 2], [1, 1, 3], [2, 2, 4],
    [4, 1, 3], [5, 1, 2], [6, 2, 1],
    [8, 1, 0], [9, 1, 1], [10, 1, 2], [11, 1, 1],
    [12, 2, 0],                       // beat 14-15: nghỉ
    [16, 1, 2], [17, 1, 3], [18, 1, 4], [19, 1, 3],
    [20, 1, 4], [21, 1, 3], [22, 2, 2],
    [24, 1, 1], [25, 1, 2], [26, 1, 1], [27, 1, 0],
    [28, 2, 1], [30, 2, 0],
  ],
  // Hợp âm đệm mỗi 8 beat: [beat, [tần số]]
  chords: [
    [0,  [130.81, 196.00, 261.63]],  // C
    [8,  [110.00, 164.81, 220.00]],  // Am
    [16, [87.31, 130.81, 174.61]],   // F trầm ấm
    [24, [98.00, 146.83, 196.00]],   // G
  ],

  start(ctx) {
    if (this.playing) return;
    this.ctx = ctx || Sfx.ctx;
    if (!this.ctx) return;
    try {
      this.gain = this.ctx.createGain();
      this.gain.gain.value = 0.6;           // master nhạc: nhỏ hơn SFX
      this.gain.connect(this.ctx.destination);
      this.beat = 0;
      this.nextTime = this.ctx.currentTime + 0.15;
      this.timer = setInterval(() => this.tick(), 250);  // lookahead, nhẹ pin
      this.tick();
      this.startAmbience();
      this.playing = true;
    } catch (e) { this.playing = false; }
  },

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.ambNodes) {
      try {
        const t = this.ctx ? this.ctx.currentTime : 0;
        this.ambNodes.forEach(n => { try { n.stop(t); } catch (e) {} });
      } catch (e) {}
      this.ambNodes = null;
    }
    this.playing = false;
  },

  // Nút loa gọi hàm này: tắt thì dừng hẳn scheduler (đỡ tốn pin), bật thì chạy lại
  setMuted(m) {
    if (m) this.stop();
    else if (!Sfx.muted) { try { this.start(this.ctx); } catch (e) {} }
  },

  tick() {
    if (!this.ctx || !this.timer) return;
    const ahead = 1.0; // lên lịch trước 1 giây
    const beatDur = 60 / this.bpm;
    let guard = 0;
    while (this.nextTime < this.ctx.currentTime + ahead && guard++ < 64) {
      this.scheduleBeat(this.beat, this.nextTime, beatDur);
      this.beat = (this.beat + 1) % 32;
      this.nextTime += beatDur;
    }
  },

  scheduleBeat(beat, t0, beatDur) {
    for (const [b, len, deg] of this.melody) {
      if (b === beat) this.leadNote(this.scale[deg], t0, len * beatDur);
    }
    for (const [b, freqs] of this.chords) {
      if (b === beat) {
        for (const f of freqs) this.padNote(f, t0, 8 * beatDur);
      }
    }
  },

  // Nốt lead: triangle mềm + vibrato nhẹ kiểu đàn dân tộc
  leadNote(freq, t0, dur) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, t0);
    const lfo = ctx.createOscillator();       // vibrato
    lfo.type = 'sine'; lfo.frequency.value = 4.5;
    const lfoG = ctx.createGain(); lfoG.gain.value = freq * 0.006;
    lfo.connect(lfoG); lfoG.connect(o.frequency);
    const g = ctx.createGain();
    const vol = 0.16;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.07);
    g.gain.setValueAtTime(vol, t0 + Math.max(0.07, dur * 0.7));
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur + 0.25);
    o.connect(g); g.connect(this.gain);
    // bè trầm octave dưới cho ấm, rất nhỏ
    const sub = ctx.createOscillator();
    sub.type = 'sine'; sub.frequency.value = freq / 2;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t0);
    sg.gain.linearRampToValueAtTime(0.05, t0 + 0.1);
    sg.gain.linearRampToValueAtTime(0.0001, t0 + dur + 0.2);
    sub.connect(sg); sg.connect(this.gain);
    o.start(t0); o.stop(t0 + dur + 0.35);
    lfo.start(t0); lfo.stop(t0 + dur + 0.35);
    sub.start(t0); sub.stop(t0 + dur + 0.3);
  },

  // Pad: sine attack chậm, volume rất nhỏ
  padNote(freq, t0, dur) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine'; o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.035, t0 + 0.9);
    g.gain.setValueAtTime(0.035, t0 + dur - 1.2);
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.gain);
    o.start(t0); o.stop(t0 + dur + 0.1);
  },

  // Tiếng nước rì rào rất nhẹ: noise -> lowpass, LFO biên độ chậm như sóng
  startAmbience() {
    const ctx = this.ctx;
    const len = 2 * ctx.sampleRate;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {           // pink-ish noise đơn giản
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 420;
    const g = ctx.createGain(); g.gain.value = 0.012;
    const lfo = ctx.createOscillator();        // sóng lên xuống chậm
    lfo.type = 'sine'; lfo.frequency.value = 0.12;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.006;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    src.connect(lp); lp.connect(g); g.connect(this.gain);
    const t = ctx.currentTime;
    src.start(t); lfo.start(t);
    this.ambNodes = [src, lfo];
  },
};
