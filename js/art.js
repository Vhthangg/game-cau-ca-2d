/* ===== Mỹ thuật: vẽ ao làng, cần, phao, cá bằng vector canvas ===== */
'use strict';

const Art = (function () {
  // Đám bèo cố định (tạo 1 lần, dùng seed ổn định)
  const duckweed = [];
  (function () {
    let s = 1234567;
    const sr = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 26; i++) {
      duckweed.push({ x: 60 + sr() * 840, y: 215 + sr() * 225, r: 8 + sr() * 16, n: 5 + Math.floor(sr() * 6) });
    }
  })();
  const clouds = [
    { x: 120, y: 60, s: 1.0, v: 6 }, { x: 480, y: 40, s: 1.4, v: 9 }, { x: 760, y: 95, s: 0.8, v: 5 },
  ];
  const grassTufts = [];
  (function () {
    let s = 7654321;
    const sr = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 40; i++) grassTufts.push({ x: 20 + sr() * 920, y: 470 + sr() * 60 });
  })();
  // Bèo + cỏ cho layout dọc portrait (540x960)
  const duckweedP = [];
  (function () {
    let s = 987654;
    const sr = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 22; i++) {
      duckweedP.push({ x: 40 + sr() * 460, y: 235 + sr() * 430, r: 8 + sr() * 14, n: 5 + Math.floor(sr() * 6) });
    }
  })();
  const grassTuftsP = [];
  (function () {
    let s = 456789;
    const sr = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 30; i++) grassTuftsP.push({ x: 20 + sr() * 500, y: 760 + sr() * 170 });
  })();

  function rr(ctx, x, y, w, h, r) { // chữ nhật bo góc
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ===== Hệ thống "tâm trạng bầu trời": gradient + nắng/mưa/đêm theo giờ thực =====
  // hour: 0..23.99 (giờ thực của máy), golden: giờ vàng ghi đè, weather: 'nang'|'mua'
  const STARS = [];
  (function () {
    let s = 24681357;
    const sr = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) STARS.push({ x: sr(), y: sr() * 0.6, r: 0.6 + sr() * 1.6, tw: sr() * 6.28 });
  })();
  function moodFor(hour, golden, weather) {
    let m;
    if (golden) m = 'golden';
    else if (hour >= 5 && hour < 7) m = 'dawn';
    else if (hour >= 7 && hour < 16) m = 'day';
    else if (hour >= 16 && hour < 18) m = 'golden';
    else if (hour >= 18 && hour < 19.5) m = 'dusk';
    else m = 'night';
    return { mood: m, wet: weather === 'mua' };
  }
  // sky: gradient trời; sun: vị trí tương đối + màu (null = vẽ mặt trăng); water: gradient nước
  const MOODS = {
    dawn:   { sky: ['#7fb0e0', '#eec39a', '#ffe0ae'], sun: { x: 0.82, y: 0.55, c: '#fff3c4', glow: 'rgba(255,214,140,' }, water: ['#4a9db5', '#357f96', '#256b7e'], cloud: { a: 0.92, tint: '#ffe8d6' }, star: 0, shimmer: 'rgba(255,214,150,' },
    day:    { sky: ['#a8d8f0', '#ffe6b3', '#ffd98a'], sun: { x: 0.875, y: 0.39, c: '#fff3c4', glow: 'rgba(255,225,130,' }, water: ['#3d9db0', '#2a8296', '#1d6b80'], cloud: { a: 0.85, tint: '#ffffff' }, star: 0, shimmer: 'rgba(255,240,190,' },
    golden: { sky: ['#5f7fc4', '#e08a5f', '#ffcf7d'], sun: { x: 0.78, y: 0.62, c: '#ffe9a8', glow: 'rgba(255,170,90,' }, water: ['#3f8fa5', '#2a6f85', '#1d5a6e'], cloud: { a: 0.9, tint: '#ffd9b0' }, star: 0, shimmer: 'rgba(255,170,100,' },
    dusk:   { sky: ['#3d4e7d', '#a05a7d', '#e8956d'], sun: { x: 0.5, y: 0.78, c: '#ffb37d', glow: 'rgba(255,140,90,' }, water: ['#2c5f78', '#1f4a60', '#16394c'], cloud: { a: 0.7, tint: '#d9a0b8' }, star: 0.25, shimmer: 'rgba(255,150,110,' },
    night:  { sky: ['#0b1e3a', '#12294d', '#1d3f66'], sun: null, water: ['#16324a', '#10293d', '#0b1f30'], cloud: { a: 0.22, tint: '#5a6f8f' }, star: 1, shimmer: 'rgba(220,230,245,' },
  };
  const _gc = {}; // cache gradient theo mood + kích thước
  function _grad(key, make) {
    if (!_gc[key]) {
      if (Object.keys(_gc).length > 48) for (const k in _gc) delete _gc[k];
      _gc[key] = make();
    }
    return _gc[key];
  }
  function drawCloudTint(ctx, x, y, s, tint) {
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
    ctx.arc(x + 24 * s, y - 8 * s, 26 * s, 0, Math.PI * 2);
    ctx.arc(x + 52 * s, y, 20 * s, 0, Math.PI * 2);
    ctx.arc(x + 26 * s, y + 8 * s, 24 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  // Vẽ bầu trời hoàn chỉnh: gradient + sao + mặt trời/mặt trăng + mây + chim + cầu vồng
  function drawSky(ctx, W, skyB, t, M) {
    const P = MOODS[M.mood] || MOODS.day;
    ctx.fillStyle = _grad('sky|' + M.mood + '|' + W + 'x' + skyB, () => {
      const g = ctx.createLinearGradient(0, 0, 0, skyB);
      g.addColorStop(0, P.sky[0]); g.addColorStop(0.62, P.sky[1]); g.addColorStop(1, P.sky[2]);
      return g;
    });
    ctx.fillRect(0, 0, W, skyB);
    if (P.star > 0) {
      for (const s of STARS) {
        const a = P.star * (0.3 + 0.7 * Math.abs(Math.sin(t * 1.4 + s.tw)));
        ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
        ctx.fillRect(s.x * W, s.y * skyB, s.r, s.r);
      }
    }
    if (M.mood === 'night') {
      const mx = W * 0.8, my = skyB * 0.32;
      const mg = ctx.createRadialGradient(mx, my, 6, mx, my, 64);
      mg.addColorStop(0, 'rgba(244,241,222,.95)'); mg.addColorStop(0.3, 'rgba(230,228,200,.4)'); mg.addColorStop(1, 'rgba(230,228,200,0)');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, 64, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#f4f1de'; ctx.beginPath(); ctx.arc(mx, my, 20, 0, 6.29); ctx.fill();
      ctx.fillStyle = 'rgba(190,185,160,.55)';
      ctx.beginPath(); ctx.arc(mx - 6, my - 4, 4, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.arc(mx + 5, my + 6, 3, 0, 6.29); ctx.fill();
    } else {
      const sx = W * P.sun.x, sy = skyB * P.sun.y;
      const sg = ctx.createRadialGradient(sx, sy, 8, sx, sy, 70);
      sg.addColorStop(0, P.sun.glow + '1)'); sg.addColorStop(0.35, P.sun.glow + '.55)'); sg.addColorStop(1, P.sun.glow + '0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, 70, 0, 6.29); ctx.fill();
      ctx.fillStyle = P.sun.c; ctx.beginPath(); ctx.arc(sx, sy, 22, 0, 6.29); ctx.fill();
    }
    clouds.forEach(c => {
      const x = ((c.x + t * c.v) % (W + 320)) - 160;
      ctx.save(); ctx.globalAlpha = P.cloud.a;
      drawCloudTint(ctx, x, c.y * (skyB / 200), c.s, P.cloud.tint);
      ctx.restore();
    });
    if (M.mood !== 'night') {
      ctx.strokeStyle = M.mood === 'dusk' ? 'rgba(40,30,50,.7)' : 'rgba(60,70,90,.65)';
      ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const bx = ((t * 14 + i * 330) % (W + 120)) - 60;
        const by = skyB * (0.22 + i * 0.09) + Math.sin(t * 2 + i) * 4;
        const flap = Math.sin(t * 6 + i * 2) * 3;
        ctx.beginPath();
        ctx.moveTo(bx - 9, by); ctx.quadraticCurveTo(bx - 4, by - 4 - flap, bx, by);
        ctx.quadraticCurveTo(bx + 4, by - 4 - flap, bx + 9, by);
        ctx.stroke();
      }
    }
    if (M.wet && (M.mood === 'day' || M.mood === 'dawn' || M.mood === 'golden')) {
      ctx.save(); ctx.globalAlpha = 0.32; ctx.lineWidth = 7;
      const cols = ['#ef5350', '#ff9800', '#ffee58', '#66bb6a', '#42a5f5'];
      cols.forEach((col, i) => {
        ctx.strokeStyle = col;
        ctx.beginPath(); ctx.arc(W * 0.24, skyB + 40, 120 - i * 8, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      });
      ctx.restore();
    }
  }
  // Bờ xa: dải sương + hàng cây + mái nhà quê (khói bếp) + bụi tre 2 bên
  function drawHouse(ctx, x, y, s, t, night) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = night ? '#3a3f45' : '#f3e9d2';
    ctx.fillRect(-26, -26, 52, 26);
    ctx.fillStyle = night ? '#5a3226' : '#a14a2e';
    ctx.beginPath(); ctx.moveTo(-34, -24); ctx.lineTo(0, -48); ctx.lineTo(34, -24); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = night ? '#3c2118' : '#7c3520'; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(i * 12, -44 + Math.abs(i) * 4); ctx.lineTo(i * 12, -26); ctx.stroke();
    }
    ctx.fillStyle = night ? '#ffd76a' : '#5d4037';
    ctx.fillRect(-8, -18, 16, 12);
    ctx.strokeStyle = night ? '#3c2118' : '#7c3520'; ctx.lineWidth = 2;
    ctx.strokeRect(-8, -18, 16, 12);
    for (let i = 0; i < 3; i++) {
      const p = ((t * 0.22 + i / 3) % 1);
      ctx.fillStyle = night ? 'rgba(200,200,200,.22)' : 'rgba(255,255,255,.5)';
      ctx.beginPath(); ctx.arc(20 + Math.sin(p * 5 + i) * 6, -54 - p * 32, 3.5 + p * 5, 0, 6.29); ctx.fill();
    }
    ctx.restore();
  }
  function drawFarBank(ctx, W, baseY, t, M) {
    const night = M.mood === 'night', dusk = M.mood === 'dusk';
    const treeC = night ? '#1d3a26' : (dusk ? '#2c4a30' : '#3e6b34');
    const treeC2 = night ? '#24452e' : (dusk ? '#36583a' : '#4c7d3e');
    ctx.fillStyle = night ? 'rgba(120,150,180,.10)' : 'rgba(255,255,255,.26)';
    ctx.fillRect(0, baseY - 48, W, 22);
    ctx.fillStyle = treeC;
    ctx.beginPath(); ctx.ellipse(W / 2, baseY - 22, W * 0.54, 34, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = treeC2;
    ctx.beginPath(); ctx.ellipse(W * 0.2, baseY - 30, W * 0.27, 26, 0, 0, 6.29); ctx.fill();
    ctx.beginPath(); ctx.ellipse(W * 0.8, baseY - 28, W * 0.27, 28, 0, 0, 6.29); ctx.fill();
    const hs = Math.max(0.7, W / 960);
    drawHouse(ctx, W * 0.32, baseY - 26, hs, t, night);
    drawHouse(ctx, W * 0.66, baseY - 24, hs * 0.85, t + 2.3, night);
    const bl = Math.max(0.7, W / 960);
    drawBamboo(ctx, 70 * bl, baseY - 3, 120 * bl, 18 * bl);
    drawBamboo(ctx, 105 * bl, baseY, 140 * bl, -12 * bl);
    drawBamboo(ctx, W - 105 * bl, baseY, 140 * bl, 12 * bl);
    drawBamboo(ctx, W - 70 * bl, baseY - 3, 120 * bl, -14 * bl);
  }
  // Mặt nước: gradient theo mood + vệt phản chiếu lấp lánh + gợn sóng đậm dần về gần
  function drawWater(ctx, x, y, w, h, t, M, opt) {
    opt = opt || {};
    const P = MOODS[M.mood] || MOODS.day;
    ctx.fillStyle = _grad('w|' + M.mood + '|' + w + 'x' + h, () => {
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, P.water[0]); g.addColorStop(0.55, P.water[1]); g.addColorStop(1, P.water[2]);
      return g;
    });
    ctx.fillRect(x, y, w, h);
    const sx = x + w * (M.mood === 'night' ? 0.8 : P.sun.x);
    const shimW = 30 + Math.sin(t * 2.3) * 9;
    const sg = ctx.createLinearGradient(0, y, 0, y + h);
    sg.addColorStop(0, P.shimmer + '.28)'); sg.addColorStop(1, P.shimmer + '0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.ellipse(sx, y + h * 0.45, shimW, h * 0.42, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = P.shimmer + '.18)';
    for (let i = 0; i < 5; i++) {
      const yy = y + h * (0.2 + i * 0.16);
      const ww = shimW * (0.5 + 0.5 * Math.abs(Math.sin(t * 3 + i * 1.7)));
      ctx.fillRect(sx - ww / 2, yy, ww, 3);
    }
    const rows = opt.rows || 7;
    for (let i = 0; i < rows; i++) {
      const yy = y + (h / rows) * (i + 0.7);
      const near = rows === 1 ? 1 : i / (rows - 1);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.10 + near * 0.22).toFixed(2) + ')';
      ctx.lineWidth = 1 + near * 1.5;
      ctx.beginPath();
      const step = opt.river ? 20 : 24;
      for (let xx = x; xx <= x + w; xx += step) {
        const yo = Math.sin(xx * 0.03 + t * (1.2 + i * 0.18) + i * 2) * (2 + near * 3);
        xx === x ? ctx.moveTo(xx, yy + yo) : ctx.lineTo(xx, yy + yo);
      }
      ctx.stroke();
    }
    if (opt.river) {
      ctx.strokeStyle = 'rgba(255,255,255,.30)'; ctx.lineWidth = 3;
      for (let i = 0; i < 10; i++) {
        const yy = y + 20 + ((i * 53) % Math.max(1, h - 40));
        const xx = x + ((i * 173 + t * 130) % (w + 160)) - 80;
        ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 34, yy); ctx.stroke();
      }
    }
  }
  // Phủ tối khi chập tối/đêm để cả scene chìm vào không khí đêm (vẽ trước lớp UI)
  function dimForMood(ctx, W, H, M) {
    if (M.mood === 'night') { ctx.fillStyle = 'rgba(8,18,38,.34)'; ctx.fillRect(0, 0, W, H); }
    else if (M.mood === 'dusk') { ctx.fillStyle = 'rgba(50,25,60,.14)'; ctx.fillRect(0, 0, W, H); }
  }
  // Bóng đổ theo mood: dài xiên lúc bình minh/hoàng hôn, ngắn lúc trưa, mờ lúc đêm
  // x,y: điểm chân vật thể; w: bề rộng vật thể
  function drawGroundShadow(ctx, x, y, w, mood) {
    let len, alpha, dx;
    if (mood === 'night') { len = w * 0.7; alpha = 0.13; dx = 0; }
    else if (mood === 'dawn') { len = w * 2.6; alpha = 0.20; dx = -w * 1.5; }
    else if (mood === 'golden' || mood === 'dusk') { len = w * 2.6; alpha = 0.20; dx = w * 1.5; }
    else { len = w * 0.9; alpha = 0.24; dx = w * 0.3; } // day
    ctx.save();
    ctx.translate(x + dx, y); ctx.scale(1, 0.26);
    ctx.fillStyle = 'rgba(12,22,18,' + alpha + ')';
    ctx.beginPath(); ctx.ellipse(0, 0, len / 2, w / 2, 0, 0, 6.29); ctx.fill();
    ctx.restore();
  }
  // Mưa: sợi mưa xiên theo gió + gợn sóng chỗ chạm mặt nước (thuần hàm của t, không cần state)
  // wy,wh: vùng mặt nước để vẽ gợn
  function drawRain(ctx, t, W, H, wy, wh) {
    const N = 70, spd = 640, len = 26;
    ctx.strokeStyle = 'rgba(200,220,240,.42)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const x = ((i * 97.3) % (W + 80)) - 40 + Math.sin(t * 0.8 + i) * 6;
      const y = ((i * 53.7 + t * spd) % (H + 60)) - 30;
      ctx.moveTo(x, y); ctx.lineTo(x - 6, y + len);
    }
    ctx.stroke();
    const NR = 22;
    for (let i = 0; i < NR; i++) {
      const rx = ((i * 173.3) % W);
      const ry = wy + ((i * 61.7) % Math.max(1, wh));
      const pr = ((t * 1.8 + i * 0.37) % 1);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.38 * (1 - pr)).toFixed(2) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(rx, ry, 4 + pr * 16, 2 + pr * 7, 0, 0, 6.29); ctx.stroke();
    }
  }

  function drawBamboo(ctx, bx, by, h, lean) {
    // bx,by: gốc; h: chiều cao; lean: độ nghiêng
    const segs = 6, sw = 9;
    ctx.save();
    ctx.strokeStyle = '#4e7a3a'; ctx.lineWidth = sw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + lean * 0.4, by - h * 0.6, bx + lean, by - h);
    ctx.stroke();
    // đốt tre
    ctx.strokeStyle = '#3c5f2c'; ctx.lineWidth = 2;
    for (let i = 1; i < segs; i++) {
      const yy = by - (h / segs) * i, xx = bx + lean * (i / segs) * (i / segs);
      ctx.beginPath(); ctx.moveTo(xx - sw / 2, yy); ctx.lineTo(xx + sw / 2, yy); ctx.stroke();
    }
    // lá tre ở ngọn
    const tx = bx + lean, ty = by - h;
    ctx.fillStyle = '#5d8f46';
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.35;
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(16, 0, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawCloud(ctx, x, y, s) {
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
    ctx.arc(x + 24 * s, y - 8 * s, 26 * s, 0, Math.PI * 2);
    ctx.arc(x + 52 * s, y, 20 * s, 0, Math.PI * 2);
    ctx.arc(x + 26 * s, y + 8 * s, 24 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dac diem rieng tung loai de ca khong "na na" nhau
  const FISH_FEAT = {
    'tre-fish': { whiskers: 1, slim: 1.25 }, 'lang-song': { whiskers: 1, slim: 1.2 }, 'nganh': { whiskers: 1 },
    'chep': { bigScales: 1, redTail: 1 }, 'tai-tuong': { bigScales: 1, deep: 1.18 },
    'ro-phi': { stripes: 1 }, 'ro-dong': { stripes: 1, slim: 1.2 },
    'chim': { deep: 1.38 }, 'dieu-hong': { deep: 1.12 },
    'basa': { fork: 1, silver: 1 }, 'tra': { fork: 1, silver: 1 },
    'thac-lac': { slim: 1.5 }, 'bong-tuong': { spots: 1, bigHead: 1 },
    'sac': { spots: 1 }, 'ca-he': { silver: 1, slim: 1.15 }, 'ca-chot': { slim: 1.25 },
  };
  function drawFishIcon(ctx, fish, x, y, s) {
    // Ve ca nhin ngang, s = chieu dai than
    ctx.save(); ctx.translate(x, y);
    const feat = FISH_FEAT[fish.id] || {};
    const c = fish.color;
    const bodyH = s * 0.17 * (feat.deep || 1) / (feat.slim || 1);
    // duoi (ca da tron duoi che sau, ca chep duoi do)
    ctx.fillStyle = feat.redTail ? '#c0392b' : c;
    ctx.beginPath(); ctx.moveTo(-s * 0.42, 0);
    const fork = feat.fork ? 0.30 : 0.20;
    ctx.lineTo(-s * 0.62, -s * fork); ctx.lineTo(-s * 0.55, 0); ctx.lineTo(-s * 0.62, s * fork);
    ctx.closePath(); ctx.fill();
    // than
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.45, bodyH, 0, 0, Math.PI * 2); ctx.fill();
    // vay lung
    ctx.beginPath(); ctx.moveTo(-s * 0.1, -bodyH * 0.9);
    ctx.lineTo(s * 0.08, -bodyH * 0.9 - s * 0.15); ctx.lineTo(s * 0.2, -bodyH * 0.85);
    ctx.closePath(); ctx.fill();
    // bung sang (ca da tron/bac bung sang hon)
    ctx.fillStyle = feat.silver ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.25)';
    ctx.beginPath(); ctx.ellipse(s * 0.05, bodyH * 0.42, s * 0.32, bodyH * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    // vay: to (chep/tai tuong) hoac vua
    ctx.strokeStyle = 'rgba(0,0,0,.20)'; ctx.lineWidth = 1;
    if (feat.bigScales) {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.arc(i * s * 0.16, 0, s * 0.14, -0.9, 0.9); ctx.stroke();
      }
    } else {
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.arc(i * s * 0.11, 0, s * 0.10, -0.9, 0.9); ctx.stroke();
      }
    }
    // soc dung (ho ro)
    if (feat.stripes) {
      ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 2.5;
      for (let i = -1; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(i * s * 0.12, -bodyH * 0.8); ctx.lineTo(i * s * 0.12, bodyH * 0.8); ctx.stroke();
      }
    }
    // dom (sac/bong)
    if (feat.spots) {
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      const dots = [[-0.15, -0.2], [0.05, 0.25], [0.2, -0.25], [-0.28, 0.15]];
      dots.forEach(d => { ctx.beginPath(); ctx.arc(d[0] * s, d[1] * bodyH * 2, 3.2, 0, 6.29); ctx.fill(); });
    }
    // rau (ho ca da tron: tre/lang/nganh)
    if (feat.whiskers) {
      ctx.strokeStyle = 'rgba(30,30,35,.85)'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      const mx = s * 0.44, my = bodyH * 0.25;
      [[0.5, -0.5], [0.75, -0.15], [0.75, 0.35], [0.5, 0.7]].forEach(w => {
        ctx.beginPath(); ctx.moveTo(mx, my);
        ctx.quadraticCurveTo(mx + s * 0.10, my + w[1] * s * 0.10, mx + s * 0.16, my + w[1] * s * 0.16);
        ctx.stroke();
      });
    }
    // mat (bong tuong dau to mat loi)
    const es = feat.bigHead ? 1.25 : 1;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s * 0.32, -bodyH * 0.25, s * 0.045 * es, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(s * 0.335, -bodyH * 0.25, s * 0.022 * es, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // --- Đồ đựng cá (mode Trốn vợ): xô ghẻ/thùng câu trên bờ, rọng lưới thả ở mép nước ---
  // x,y: điểm đặt. Vẽ tại đúng tọa độ game.js truyền sang để khớp vùng chạm.
  // load: tỉ lệ tải kg/cap — vẽ vết rách lưới khi rọng quá tải nặng.
  function drawContainer(ctx, t, id, x, y, load) {
    if (id === 'ro') {
      // RỌNG ĐỰNG CÁ Ryoma (keepnet vành tròn): ống lưới ĐỎ cao, đai vải in họa tiết ở đầu.
      const bob = Math.sin(t * 2.2) * 4;        // lập lờ theo sóng
      const sway = Math.sin(t * 1.3) * 6;       // ống lưới đung đưa nhẹ
      const my = y + bob;                       // miệng rọng (mặt nước)
      const LEN = 118;                          // chiều dài ống lưới
      const topW = 58, botW = 44;
      // thân ống lưới ĐỎ: hình thang thuôn, lưới đỏ mờ cho thấy cá bên trong
      ctx.fillStyle = 'rgba(198,52,48,0.62)';
      ctx.beginPath();
      ctx.moveTo(x - topW / 2, my);
      ctx.quadraticCurveTo(x - topW / 2 + sway * 0.4, my + LEN * 0.5, x - botW / 2 + sway, my + LEN);
      ctx.lineTo(x + botW / 2 + sway, my + LEN);
      ctx.quadraticCurveTo(x + topW / 2 + sway * 0.4, my + LEN * 0.5, x + topW / 2, my);
      ctx.closePath(); ctx.fill();
      // mắt lưới đỏ mịn (chéo, dày hơn bản cũ cho ra chất lưới Ryoma)
      ctx.strokeStyle = 'rgba(150,28,26,0.55)'; ctx.lineWidth = 1;
      for (let d = -6; d <= 6; d++) {
        ctx.beginPath(); ctx.moveTo(x + d * 10, my + 4); ctx.lineTo(x + d * 10 - 20 + sway, my + LEN - 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + d * 10, my + 4); ctx.lineTo(x + d * 10 + 20 + sway, my + LEN - 4); ctx.stroke();
      }
      // 3 vành kim loại tròn giữa thân ống (đặc trưng rọng vành tròn)
      [0.34, 0.6, 0.85].forEach(p => {
        const wy = my + LEN * p, ww = (topW + (botW - topW) * p) / 2;
        ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(x + sway * p, wy, ww, 6.5, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(x + sway * p, wy - 1.5, ww, 5, 0, Math.PI, Math.PI * 2); ctx.stroke();
      });
      // đáy lưới tròn khép
      ctx.fillStyle = 'rgba(150,28,26,0.85)';
      ctx.beginPath(); ctx.ellipse(x + sway, my + LEN, botW / 2, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#eceff1'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x + sway, my + LEN, botW / 2, 8, 0, 0, Math.PI * 2); ctx.stroke();
      // bóng cá bên trong khi có cá
      if (load > 0.01) {
        ctx.fillStyle = 'rgba(60,10,10,0.5)';
        for (let i = 0; i < 3; i++) {
          const fy = my + LEN * (0.3 + i * 0.22), fx = x + Math.sin(t * 3 + i * 2) * 8 + sway * 0.5;
          ctx.beginPath(); ctx.ellipse(fx, fy, 9, 4, 0.2 * Math.sin(t * 2 + i), 0, Math.PI * 2); ctx.fill();
        }
      }
      // vết rách lưới khi quá tải nặng (>120%)
      if (load > 1.2) {
        ctx.strokeStyle = 'rgba(255,235,230,0.9)'; ctx.lineWidth = 1.5;
        const ry = my + LEN * 0.55, rx = x - 12 + sway * 0.5;
        ctx.beginPath(); ctx.moveTo(rx, ry);
        ctx.lineTo(rx + 8, ry + 8); ctx.lineTo(rx - 2, ry + 14); ctx.lineTo(rx + 10, ry + 22);
        ctx.stroke();
      }
      // miệng rọng: vành kim loại tròn
      ctx.fillStyle = 'rgba(120,20,18,0.9)';
      ctx.beginPath(); ctx.ellipse(x, my, 29, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#eceff1'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(x, my, 31, 10, 0, 0, Math.PI * 2); ctx.stroke();
      // ĐAI VẢI đầu rọng in họa tiết (mặt trời + sóng xanh) — nổi trên mặt nước
      const cw = 62, ch = 24, cx = x - cw / 2, cy = my - ch - 6;
      ctx.fillStyle = '#d63c34'; rr(ctx, cx, cy, cw, ch, 4); ctx.fill();
      ctx.strokeStyle = '#8f1d18'; ctx.lineWidth = 2; rr(ctx, cx, cy, cw, ch, 4); ctx.stroke();
      // mặt trời vàng trên đai vải
      ctx.fillStyle = '#ffca28';
      ctx.beginPath(); ctx.arc(cx + 16, cy + 10, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8f00';
      ctx.beginPath(); ctx.arc(cx + 16, cy + 10, 7, Math.PI * 0.7, Math.PI * 1.6); ctx.fill();
      // sóng xanh dưới chân đai vải
      ctx.strokeStyle = '#1565c0'; ctx.lineWidth = 2.5;
      for (let wv = 0; wv < 3; wv++) {
        ctx.beginPath();
        ctx.arc(cx + 14 + wv * 16, cy + ch - 2, 6, Math.PI, 0);
        ctx.stroke();
      }
      ctx.strokeStyle = '#0d47a1'; ctx.lineWidth = 1.5;
      for (let wv = 0; wv < 3; wv++) {
        ctx.beginPath();
        ctx.arc(cx + 22 + wv * 16, cy + ch - 2, 6, Math.PI, 0);
        ctx.stroke();
      }
      // chữ hiệu nhỏ trên đai vải
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('RYOMA', cx + 44, cy + 11);
      // dây buộc về phía bờ + cọc cắm
      ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x + 20, my - 6);
      ctx.quadraticCurveTo(x + 52, my - 44, x + 78, my - 34); ctx.stroke();
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(x + 74, my - 52, 7, 22);
      return;
    }
    if (id === 'thung') {
      // THÙNG CÂU ĐÀI Rice Fishing: thùng ngọc lam, nắp đen, khung tựa lưng,
      // khay mồi tròn bên hông, 4 chân chống kim loại, giá cắm cần.
      const sway = Math.sin(t * 1.8) * 1.5;
      // 4 chân chống kim loại (2 cặp trước/sau)
      ctx.strokeStyle = '#9aa5ad'; ctx.lineWidth = 3;
      [[-26, -10], [26, -10], [-22, 10], [22, 10]].forEach(([lx, lz]) => {
        ctx.beginPath(); ctx.moveTo(x + lx, y - 8); ctx.lineTo(x + lx + lz * 0.2 + sway, y + 8); ctx.stroke();
        ctx.fillStyle = '#616161';
        ctx.beginPath(); ctx.ellipse(x + lx + lz * 0.2 + sway, y + 8, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
      });
      // thân thùng NGỌC LAM
      ctx.fillStyle = '#27b3a4'; rr(ctx, x - 32, y - 56, 64, 48, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.18)'; rr(ctx, x - 32, y - 56, 20, 48, 6); ctx.fill(); // vệt sáng cạnh
      ctx.strokeStyle = '#14766d'; ctx.lineWidth = 2; rr(ctx, x - 32, y - 56, 64, 48, 6); ctx.stroke();
      // nẹp trắng dưới nắp
      ctx.fillStyle = '#eceff1'; ctx.fillRect(x - 32, y - 58, 64, 4);
      // nắp ĐEN + khóa cài trước
      ctx.fillStyle = '#21242a'; rr(ctx, x - 34, y - 72, 68, 15, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x - 30, y - 71, 60, 3);
      ctx.strokeStyle = '#101216'; ctx.lineWidth = 2; rr(ctx, x - 34, y - 72, 68, 15, 5); ctx.stroke();
      ctx.fillStyle = '#424a54'; rr(ctx, x - 6, y - 68, 12, 9, 2); ctx.fill();   // khóa cài
      ctx.strokeStyle = '#101216'; ctx.lineWidth = 1.5; rr(ctx, x - 6, y - 68, 12, 9, 2); ctx.stroke();
      // logo nhỏ trên thân thùng
      ctx.fillStyle = '#0d3b37'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Rice Fishing', x + 6, y - 26);
      ctx.strokeStyle = '#0d3b37'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x - 18, y - 30, 6, 0, Math.PI * 2); ctx.stroke(); // vòng logo
      // KHUNG TỰA LƯNG phía sau: 2 thanh vàng-đen + đệm tựa đen
      ctx.strokeStyle = '#3a3f45'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x + 14, y - 70); ctx.lineTo(x + 14, y - 108); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 30, y - 70); ctx.lineTo(x + 30, y - 108); ctx.stroke();
      ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 14, y - 70); ctx.lineTo(x + 14, y - 108); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 30, y - 70); ctx.lineTo(x + 30, y - 108); ctx.stroke();
      ctx.fillStyle = '#21242a'; rr(ctx, x + 8, y - 120, 30, 14, 6); ctx.fill(); // đệm tựa
      ctx.strokeStyle = '#101216'; ctx.lineWidth = 2; rr(ctx, x + 8, y - 120, 30, 14, 6); ctx.stroke();
      // KHAY MỒI tròn bên hông: cọc kim loại + 2 khay hổ phách
      ctx.strokeStyle = '#9aa5ad'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x - 32, y - 60); ctx.lineTo(x - 44, y - 96); ctx.stroke();
      ctx.fillStyle = 'rgba(245,166,35,0.75)';
      ctx.beginPath(); ctx.ellipse(x - 48, y - 98, 13, 5, -0.15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b97a1a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(x - 48, y - 98, 13, 5, -0.15, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(245,166,35,0.6)';
      ctx.beginPath(); ctx.ellipse(x - 40, y - 90, 11, 4.5, -0.15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b97a1a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(x - 40, y - 90, 11, 4.5, -0.15, 0, Math.PI * 2); ctx.stroke();
      // giá cắm cần bên hông phải
      ctx.strokeStyle = '#424a54'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x + 32, y - 56); ctx.lineTo(x + 38, y - 78); ctx.stroke();
      ctx.fillStyle = '#21242a';
      ctx.beginPath(); ctx.arc(x + 38, y - 80, 4, 0, Math.PI * 2); ctx.fill();
      return;
    }
    // Xô ghẻ mặc định: xô tôn cũ màu xám, hơi móp
    ctx.fillStyle = '#9e9e9e';
    ctx.beginPath();
    ctx.moveTo(x - 19, y - 34); ctx.lineTo(x + 19, y - 34);
    ctx.lineTo(x + 14, y); ctx.lineTo(x - 14, y);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#616161'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - 19, y - 34); ctx.lineTo(x + 19, y - 34); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.15)';
    ctx.beginPath(); ctx.ellipse(x - 6, y - 16, 6, 9, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#616161'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y - 34, 19, Math.PI, 0); ctx.stroke();
  }
  // Xô đỏ trang trí cũ (mode tự do) — giữ nguyên hình dáng quen thuộc
  function drawDecoBucket(ctx, x, y) {
    ctx.fillStyle = '#c62828'; rr(ctx, x, y, 34, 30, 4); ctx.fill();
    ctx.strokeStyle = '#7f0000'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x + 17, y, 17, Math.PI, 0); ctx.stroke();
  }

  // Vẽ toàn cảnh. v = {t, map, float, rodBend, splashes, strike, fight, castHint, maxCastX, hint, spots, spotHint, W, H}
  function drawScene(ctx, t, v) {
    const W = v.W || 960, H = v.H || 540;
    if (H > W) { drawPortraitScene(ctx, t, v, W, H); return; }
    if (v.map === 'song') { drawRiverScene(ctx, t, v); return; }
    // Landscape 960x540 (W,H đã có từ v)

    const sky = v.sky || { mood: 'day', wet: false };
    drawSky(ctx, W, 200, t, sky);

    drawFarBank(ctx, W, 195, t, sky);
    // bờ đất xa
    ctx.fillStyle = '#8a6f4d'; ctx.fillRect(0, 188, W, 16);

    drawWater(ctx, 0, 202, W, 263, t, sky, { rows: 7 });

    // bèo tấm
    duckweed.forEach(d => {
      const wob = Math.sin(t * 1.5 + d.x) * 2;
      ctx.fillStyle = 'rgba(46,125,50,.85)';
      for (let i = 0; i < d.n; i++) {
        const a = (i / d.n) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(d.x + Math.cos(a) * d.r + wob, d.y + Math.sin(a) * d.r * 0.5, 5, 3.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    // lá sen + hoa sen
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath(); ctx.ellipse(330, 400, 34, 12, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(700, 300, 28, 10, -0.15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f8bbd0';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath(); ctx.ellipse(700 + Math.cos(a) * 9, 288 + Math.sin(a) * 9, 8, 4.5, a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#fdd835'; ctx.beginPath(); ctx.arc(700, 288, 5, 0, Math.PI * 2); ctx.fill();

    // --- Bờ gần (chỗ người chơi đứng) ---
    ctx.fillStyle = '#9c7b54'; ctx.fillRect(0, 460, W, 80);
    ctx.fillStyle = '#7d5f3e'; ctx.fillRect(0, 460, W, 8);
    grassTufts.forEach(g => {
      ctx.strokeStyle = '#5d8f46'; ctx.lineWidth = 2;
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.quadraticCurveTo(g.x + k * 4, g.y - 8, g.x + k * 7, g.y - 12); ctx.stroke();
      }
    });
    // cái xô đỏ (mode tự do) / đồ đựng cá (mode Trốn vợ)
    if (v.container) drawContainer(ctx, t, v.container.id, v.container.x, v.container.y, v.container.load);
    else drawDecoBucket(ctx, 690, 492);
    // cần thủ đứng trên bờ ao
    if (v.angler) drawAnglerLand(ctx, v.angler.x, v.angler.y);
    // bóng đổ theo giờ (mặt trời/mặt trăng)
    if (v.angler) drawGroundShadow(ctx, v.angler.x, v.angler.y + 4, 46, sky.mood);
    if (v.container) drawGroundShadow(ctx, v.container.x, v.container.y + 6, 44, sky.mood);
    else drawGroundShadow(ctx, 690, 500, 30, sky.mood);

    dimForMood(ctx, W, H, sky);
    if (sky.wet) drawRain(ctx, t, W, H, 202, 263);
    drawOverlay(ctx, t, v);
  }

  // --- Sông quê: mỗi điểm câu có layout riêng, cần thủ đứng đúng điểm đã chọn ---
  function drawBridge(ctx) {
    ctx.fillStyle = '#9e9e9e'; ctx.fillRect(380, 138, 200, 24);
    ctx.fillStyle = '#757575'; ctx.fillRect(380, 138, 200, 6);
    ctx.fillStyle = '#8d8d8d';
    ctx.fillRect(425, 162, 18, 120); ctx.fillRect(537, 162, 18, 120); // trụ cầu
    ctx.strokeStyle = '#616161'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(380, 138); ctx.lineTo(580, 138); ctx.stroke();
    for (let x = 390; x <= 570; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 138); ctx.lineTo(x, 122); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(380, 122); ctx.lineTo(580, 122); ctx.stroke();
  }
  function drawRiverScene(ctx, t, v) {
    const W = 960, H = 540;
    const sky = v.sky || { mood: 'day', wet: false };
    const decor = (v.spotLayout && v.spotLayout.decor) || 'overview';
    drawSky(ctx, W, 190, t, sky);
    drawFarBank(ctx, W, 185, t, sky);
    if (decor === 'gamcau' || decor === 'overview') drawBridge(ctx);
    drawWater(ctx, 0, 185, W, 270, t, sky, { rows: 7, river: true });
    // --- Bờ gần theo điểm câu ---
    if (decor === 'baiboi') {
      ctx.fillStyle = '#d9c08a'; ctx.fillRect(0, 452, W, 88);      // bãi cát bồi
      ctx.fillStyle = '#c4a76f'; ctx.fillRect(0, 452, W, 8);
      drawReeds(ctx, t);
    } else if (decor === 'bendo') {
      ctx.fillStyle = '#9c7b54'; ctx.fillRect(0, 452, W, 88);      // bờ đất bến đò
      ctx.fillStyle = '#7d5f3e'; ctx.fillRect(0, 452, W, 8);
      drawWharf(ctx, t);                                          // cọc gỗ + thuyền nan
    } else if (decor === 'gamcau') {
      ctx.fillStyle = '#8a8a7a'; ctx.fillRect(0, 452, W, 88);      // bờ bê tông gầm cầu
      ctx.fillStyle = '#6f6f62'; ctx.fillRect(0, 452, W, 8);
      ctx.fillStyle = 'rgba(30,30,45,.22)'; ctx.fillRect(380, 185, 200, 270); // bóng râm gầm cầu
    } else {
      ctx.fillStyle = '#7a9a4e'; ctx.fillRect(0, 452, 560, 88);
      ctx.fillStyle = '#d9c08a'; ctx.fillRect(560, 452, 400, 88);
      ctx.fillStyle = '#6b8a42'; ctx.fillRect(0, 452, 560, 8);
      ctx.fillStyle = '#c4a76f'; ctx.fillRect(560, 452, 400, 8);
    }
    if (decor !== 'baiboi') grassTufts.forEach(g => {
      if (decor === 'overview' && g.x > 560) return;
      ctx.strokeStyle = '#5d8f46'; ctx.lineWidth = 2;
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.quadraticCurveTo(g.x + k * 4, g.y - 8, g.x + k * 7, g.y - 12); ctx.stroke();
      }
    });
    // cái xô đỏ (mode tự do) / đồ đựng cá (mode Trốn vợ)
    if (v.container) drawContainer(ctx, t, v.container.id, v.container.x, v.container.y, v.container.load);
    else drawDecoBucket(ctx, 690, 492);
    // --- Cần thủ đứng đúng điểm đã chọn ---
    if (v.angler && decor !== 'overview') drawAnglerLand(ctx, v.angler.x, v.angler.y);
    // bóng đổ theo giờ
    if (v.angler && decor !== 'overview') drawGroundShadow(ctx, v.angler.x, v.angler.y + 4, 46, sky.mood);
    if (v.container) drawGroundShadow(ctx, v.container.x, v.container.y + 6, 44, sky.mood);
    else drawGroundShadow(ctx, 690, 500, 30, sky.mood);
    // --- Điểm câu (phase chọn điểm): tên + mô tả + gợi ý cá ---
    (v.spots || []).forEach(s => {
      const pr = (t * 1.6) % 1;
      ctx.strokeStyle = 'rgba(255,235,59,' + (1 - pr * 0.7) + ')'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(s.x, s.y, 30 + pr * 14, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(20,35,28,.75)';
      ctx.beginPath(); ctx.arc(s.x, s.y, 26, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#4dd0e1'; ctx.lineWidth = 3;
      const n = 1 + Math.round(s.flow * 2);
      for (let i = 0; i < n; i++) {
        const wy = s.y - 8 + i * 9;
        ctx.beginPath(); ctx.arc(s.x, wy, 7, 0.3, Math.PI - 0.3); ctx.stroke();
      }
      pill(ctx, s.name, s.x, s.y - 54);
      // mô tả + gợi ý cá
      ctx.font = '13px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const l1 = s.desc || '', l2 = '🎯 ' + (s.fish || '');
      const w1 = ctx.measureText(l1).width, w2 = ctx.measureText(l2).width;
      const bw = Math.max(w1, w2) + 24;
      ctx.fillStyle = 'rgba(20,35,28,.78)';
      rr(ctx, s.x - bw / 2, s.y + 34, bw, 44, 10); ctx.fill();
      ctx.fillStyle = '#ffe9b8'; ctx.fillText(l1, s.x, s.y + 48);
      ctx.fillStyle = '#a5d6a7'; ctx.fillText(l2, s.x, s.y + 66);
    });
    if (v.spotHint) pill(ctx, v.spotHint, 480, 60);

    dimForMood(ctx, W, H, sky);
    if (sky.wet) drawRain(ctx, t, W, H, 190, 260);
    drawOverlay(ctx, t, v);
  }

  // --- Cần thủ đội nón lá (portrait). x,y: vị trí chân ---
  // --- Can thu doi non la (portrait). x,y: vi tri chan ---
  function drawAngler(ctx, x, y) {
    // chan
    ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 9, y - 50); ctx.lineTo(x - 11, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 9, y - 50); ctx.lineTo(x + 11, y); ctx.stroke();
    // than (ao ba ba xanh) + co ao
    ctx.fillStyle = '#4e7a3a'; rr(ctx, x - 17, y - 96, 34, 50, 9); ctx.fill();
    ctx.fillStyle = '#3c5f2c'; rr(ctx, x - 17, y - 96, 34, 12, 6); ctx.fill();
    ctx.strokeStyle = '#33592a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 6, y - 96); ctx.lineTo(x, y - 88); ctx.lineTo(x + 6, y - 96); ctx.stroke();
    // khuy ao
    ctx.fillStyle = '#33592a';
    ctx.beginPath(); ctx.arc(x, y - 78, 2, 0, 6.29); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 68, 2, 0, 6.29); ctx.fill();
    // tay cam can (huong len phai)
    ctx.strokeStyle = '#f1c27d'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(x + 12, y - 80); ctx.lineTo(x + 40, y - 100); ctx.stroke();
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(x + 40, y - 100, 6, 0, Math.PI * 2); ctx.fill();
    // dau
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(x, y - 108, 14, 0, Math.PI * 2); ctx.fill();
    // non la: van dan nan tre
    ctx.fillStyle = '#d9b95c';
    ctx.beginPath(); ctx.moveTo(x - 28, y - 114); ctx.lineTo(x + 28, y - 114); ctx.lineTo(x, y - 138); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#a8893a'; ctx.lineWidth = 1.5;
    // nan doc
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(x + i * 5.5, y - 137 + Math.abs(i) * 1.6); ctx.lineTo(x + i * 11, y - 114); ctx.stroke();
    }
    // van ngang (vong tron dong tam)
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 28 + i * 8, y - 114 - i * 0.5);
      ctx.quadraticCurveTo(x, y - 118 - i * 9, x + 28 - i * 8, y - 114 - i * 0.5);
      ctx.stroke();
    }
    ctx.strokeStyle = '#8a6f2e'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - 28, y - 114); ctx.lineTo(x, y - 138); ctx.lineTo(x + 28, y - 114); ctx.stroke();
    // quai non
    ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 20, y - 113); ctx.quadraticCurveTo(x - 24, y - 100, x - 12, y - 96); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 20, y - 113); ctx.quadraticCurveTo(x + 24, y - 100, x + 12, y - 96); ctx.stroke();
  }

  // Can thu ti le nho cho landscape (0.72) — portrait giu nguyen
  function drawAnglerLand(ctx, x, y) {
    ctx.save(); ctx.translate(x, y); ctx.scale(0.72, 0.72); ctx.translate(-x, -y);
    drawAngler(ctx, x, y); ctx.restore();
  }
  // Coc go ben do + thuyen nan
  function drawWharf(ctx, t) {
    ctx.fillStyle = '#6d4c41';
    for (const px of [90, 150, 210]) {
      ctx.fillRect(px - 7, 400, 14, 100);
      ctx.fillStyle = '#5d4037'; ctx.fillRect(px - 7, 400, 14, 10); ctx.fillStyle = '#6d4c41';
    }
    ctx.fillStyle = '#8d6e63'; ctx.fillRect(70, 430, 170, 14);
    // thuyen nan troi nhe
    const bx = 300 + Math.sin(t * 0.7) * 6, by = 445 + Math.sin(t * 1.1) * 3;
    ctx.fillStyle = '#a1887f';
    ctx.beginPath(); ctx.ellipse(bx, by, 46, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath(); ctx.ellipse(bx, by - 3, 34, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(bx + i * 12, by - 10); ctx.lineTo(bx + i * 14, by + 4); ctx.stroke();
    }
  }
  // Lau say bai boi
  function drawReeds(ctx, t) {
    for (const rx of [620, 700, 790, 870]) {
      for (let k = 0; k < 5; k++) {
        const sw = Math.sin(t * 1.2 + rx + k) * 4;
        ctx.strokeStyle = k % 2 ? '#7a9a4e' : '#5d8f46'; ctx.lineWidth = 3;
        const h = 46 + (k * 13) % 30;
        ctx.beginPath(); ctx.moveTo(rx + k * 7 - 14, 470); ctx.quadraticCurveTo(rx + k * 7 - 14 + sw, 470 - h / 2, rx + k * 7 - 14 + sw * 1.6, 470 - h); ctx.stroke();
        if (k % 3 === 0) {
          ctx.fillStyle = '#8d6e63';
          ctx.beginPath(); ctx.ellipse(rx + k * 7 - 14 + sw * 1.6, 470 - h - 6, 4, 9, 0.1, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }

  // --- Scene dọc portrait (W=540, H=960): bờ + cần thủ trên, mặt nước lớn ở giữa ---
  function drawPortraitScene(ctx, t, v, W, H) {
    const river = v.map === 'song';
    const wtop = 195, wbot = 730; // mặt nước

    const sky = v.sky || { mood: 'day', wet: false };
    drawSky(ctx, W, 150, t, sky);

    drawFarBank(ctx, W, 190, t, sky);
    ctx.fillStyle = '#8a6f4d'; ctx.fillRect(0, 184, W, 13);

    const pdecor = (v.spotLayout && v.spotLayout.decor) || 'overview';
    if (river && (pdecor === 'gamcau' || pdecor === 'overview')) {
      // cầu bê tông bắc ngang mặt nước
      ctx.fillStyle = '#9e9e9e'; ctx.fillRect(170, 196, 200, 22);
      ctx.fillStyle = '#757575'; ctx.fillRect(170, 196, 200, 6);
      ctx.fillStyle = '#8d8d8d';
      ctx.fillRect(215, 218, 16, 110); ctx.fillRect(325, 218, 16, 110);
      ctx.strokeStyle = '#616161'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(170, 196); ctx.lineTo(370, 196); ctx.stroke();
      for (let x = 182; x <= 362; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 196); ctx.lineTo(x, 182); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(170, 182); ctx.lineTo(370, 182); ctx.stroke();
    }
    if (river && pdecor === 'bendo') {
      // cọc gỗ bến đò (bản portrait)
      ctx.fillStyle = '#6d4c41';
      for (const px of [70, 120, 170]) { ctx.fillRect(px - 6, 640, 12, 90); }
      ctx.fillStyle = '#8d6e63'; ctx.fillRect(50, 660, 150, 12);
      const bx = 400 + Math.sin(t * 0.7) * 5;
      ctx.fillStyle = '#a1887f';
      ctx.beginPath(); ctx.ellipse(bx, 690, 40, 11, 0, 0, Math.PI * 2); ctx.fill();
    }

    drawWater(ctx, 0, wtop, W, wbot - wtop, t, sky, { rows: 9, river: river });
    if (!river) {
      // bèo tấm
      duckweedP.forEach(d => {
        const wob = Math.sin(t * 1.5 + d.x) * 2;
        ctx.fillStyle = 'rgba(46,125,50,.85)';
        for (let i = 0; i < d.n; i++) {
          const a2 = (i / d.n) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(d.x + Math.cos(a2) * d.r + wob, d.y + Math.sin(a2) * d.r * 0.5, 5, 3.4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      // lá sen + hoa sen
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath(); ctx.ellipse(150, 645, 30, 11, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f8bbd0';
      for (let i = 0; i < 6; i++) {
        const a2 = (i / 6) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath(); ctx.ellipse(390 + Math.cos(a2) * 8, 420 + Math.sin(a2) * 8, 7, 4, a2, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#fdd835'; ctx.beginPath(); ctx.arc(390, 420, 4.5, 0, Math.PI * 2); ctx.fill();
    }


    // --- Điểm câu sông (phase SPOT): vòng tròn TO dễ chạm ---
    (v.spots || []).forEach(s => {
      const pr = (t * 1.6) % 1;
      ctx.strokeStyle = 'rgba(255,235,59,' + (1 - pr * 0.7) + ')'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(s.x, s.y, 40 + pr * 16, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(20,35,28,.75)';
      ctx.beginPath(); ctx.arc(s.x, s.y, 34, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#4dd0e1'; ctx.lineWidth = 3;
      const n = 1 + Math.round(s.flow * 2);
      for (let i = 0; i < n; i++) {
        const wy = s.y - 10 + i * 11;
        ctx.beginPath(); ctx.arc(s.x, wy, 8, 0.3, Math.PI - 0.3); ctx.stroke();
      }
      pill(ctx, s.name, s.x, s.y - 74);
      ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const l1 = s.desc || '', l2 = '🎯 ' + (s.fish || '');
      const bw = Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width) + 20;
      ctx.fillStyle = 'rgba(20,35,28,.78)';
      rr(ctx, s.x - bw / 2, s.y + 40, bw, 40, 9); ctx.fill();
      ctx.fillStyle = '#ffe9b8'; ctx.fillText(l1, s.x, s.y + 52);
      ctx.fillStyle = '#a5d6a7'; ctx.fillText(l2, s.x, s.y + 68);
    });
    if (v.spotHint) pill(ctx, v.spotHint, W / 2, 120);

    // --- Bờ gần: cần thủ đội nón lá + xô ---
    ctx.fillStyle = river ? '#7a9a4e' : '#9c7b54'; ctx.fillRect(0, wbot, W, H - wbot);
    ctx.fillStyle = river ? '#6b8a42' : '#7d5f3e'; ctx.fillRect(0, wbot, W, 8);
    grassTuftsP.forEach(g => {
      ctx.strokeStyle = '#5d8f46'; ctx.lineWidth = 2;
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.quadraticCurveTo(g.x + k * 4, g.y - 8, g.x + k * 7, g.y - 12); ctx.stroke();
      }
    });
    if (v.angler) drawAngler(ctx, v.angler.x, v.angler.y); else drawAngler(ctx, 150, 915);
    // cái xô đỏ (mode tự do) / đồ đựng cá (mode Trốn vợ)
    if (v.container) drawContainer(ctx, t, v.container.id, v.container.x, v.container.y, v.container.load);
    else drawDecoBucket(ctx, 420, 868);
    // bóng đổ theo giờ
    drawGroundShadow(ctx, v.angler ? v.angler.x : 150, (v.angler ? v.angler.y : 915) + 4, 46, sky.mood);
    if (v.container) drawGroundShadow(ctx, v.container.x, v.container.y + 6, 44, sky.mood);
    else drawGroundShadow(ctx, 420, 876, 30, sky.mood);

    dimForMood(ctx, W, H, sky);
    if (sky.wet) drawRain(ctx, t, W, H, 200, 525);
    drawOverlay(ctx, t, v);
  }

  // --- Lop phu dung chung: can, phao, hat nuoc, goi y, thanh nhip/luc ---
  // v: {float, rodBend, rodType ('dai'|'may'), splashes, biteFlash, fightFish, ...}
  function drawOverlay(ctx, t, v) {
    const W = v.W || 960, H = v.H || 540, P = H > W; // P: portrait
    // --- Bong ca duoi nuoc khi dang bo (giay giua) ---
    const ff = v.fightFish;
    if (ff && ff.show) {
      const wig = Math.sin(t * 18) * 12;
      ctx.fillStyle = 'rgba(10,25,30,.38)';
      ctx.beginPath(); ctx.ellipse(ff.x + wig, ff.y + 20, 26 * ff.s, 9 * ff.s, 0.15 * Math.sin(t * 9), 0, 6.29); ctx.fill();
      ctx.fillStyle = 'rgba(10,25,30,.25)';
      ctx.beginPath(); ctx.ellipse(ff.x + wig - 30 * ff.s, ff.y + 22, 10 * ff.s, 6 * ff.s, 0.5, 0, 6.29); ctx.fill();
    }
    // --- Can cau + day + phao ---
    const f = v.float;
    if (f && f.show) {
      const bx = (v.rodBase && v.rodBase.x) || (P ? 190 : 150);
      const by = (v.rodBase && v.rodBase.y) || (P ? 815 : 528); // goc can = tay can thu
      // dau can cong theo luc bo
      const bend = v.rodBend || 0;
      const tx = bx + (f.x - bx) * 0.78;
      const ty = by + (f.y - by) * 0.78 - bend * 60;
      const midX = (bx + tx) / 2, midY = (by + ty) / 2 + bend * 20;
      ctx.strokeStyle = '#6d4c41'; ctx.lineCap = 'round';
      ctx.lineWidth = P ? 11 : 9;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(midX, midY, tx, ty); ctx.stroke();
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = P ? 6 : 5;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(midX, midY, tx, ty); ctx.stroke();
      // can may: khoen dan day + o quay may cau
      if (v.rodType === 'may') {
        ctx.strokeStyle = '#37474f'; ctx.lineWidth = 2.5;
        for (let i = 1; i <= 3; i++) {
          const q = i / 4, gx = bx + (tx - bx) * q, gy = by + (ty - by) * q + bend * 8 * q;
          ctx.beginPath(); ctx.arc(gx, gy + 4, 3.5, 0, 6.29); ctx.stroke();
        }
        ctx.fillStyle = '#455a64';
        ctx.beginPath(); ctx.arc(bx + 16, by - 2, 9, 0, 6.29); ctx.fill();
        ctx.fillStyle = '#263238';
        ctx.beginPath(); ctx.arc(bx + 16, by - 2, 4, 0, 6.29); ctx.fill();
        ctx.strokeStyle = '#263238'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(bx + 16, by - 2); ctx.lineTo(bx + 28, by + 6); ctx.stroke();
        ctx.fillStyle = '#78909c'; ctx.beginPath(); ctx.arc(bx + 28, by + 6, 3, 0, 6.29); ctx.fill();
      }
      // day cau
      ctx.strokeStyle = 'rgba(240,240,240,.75)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo((tx + f.x) / 2, (ty + f.y) / 2 + 14, f.x, f.y - 14);
      ctx.stroke();
      // gon nuoc lan quanh phao
      const fs = P ? 1.5 : 1;
      const py = f.y + (f.dy || 0);
      for (let i = 0; i < 2; i++) {
        const pr = ((t * (v.biteFlash ? 2.2 : 0.9) + i * 0.5) % 1);
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.42 * (1 - pr)).toFixed(2) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(f.x, py + 4, (10 + pr * 26) * fs, (5 + pr * 12) * fs, 0, 0, 6.29); ctx.stroke();
      }
      // phao (portrait: phong to 1.5x cho de nhin) + bong duoi nuoc
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      ctx.beginPath(); ctx.ellipse(f.x, py + 16, 10 * fs, 4 * fs, 0, 0, 6.29); ctx.fill();
      ctx.save(); ctx.translate(f.x, py); ctx.scale(fs, fs); ctx.rotate(f.tilt || 0);
      ctx.fillStyle = '#f5f5f5'; rr(ctx, -4.5, -14, 9, 26, 4); ctx.fill();
      ctx.fillStyle = '#d32f2f'; rr(ctx, -4.5, -14, 9, 11, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; rr(ctx, -4.5, -14, 3.5, 26, 2); ctx.fill();
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, -22); ctx.stroke();
      ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.arc(0, -23, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // vong bao can
      if (v.biteFlash) {
        const pr = ((t * 3) % 1);
        ctx.strokeStyle = 'rgba(255,60,60,' + (1 - pr) + ')'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(f.x, f.y, (12 + pr * 26) * fs, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // --- Hat nuoc ban ---
    (v.splashes || []).forEach(p => {
      ctx.strokeStyle = 'rgba(255,255,255,' + p.a + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
    });
    // --- Giọt nước bắn lên (có trọng lực, giới hạn số lượng ở game.js) ---
    (v.drops || []).forEach(p => {
      ctx.fillStyle = 'rgba(215,238,255,' + Math.max(0, Math.min(0.9, p.a)).toFixed(2) + ')';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 1.6, 0, 0, 6.29); ctx.fill();
    });
    // --- Gợn sóng lan rộng (mồi chạm nước, quanh phao, mưa) ---
    (v.ripples || []).forEach(p => {
      ctx.strokeStyle = 'rgba(255,255,255,' + (p.a * 0.55).toFixed(2) + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.45, 0, 0, 6.29); ctx.stroke();
    });

    // --- Goi y quang can ---
    if (v.castHint) {
      const topY = P ? 195 : (v.map === 'song' ? 225 : 205), botY = P ? 730 : (v.map === 'song' ? 435 : 460);
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(v.maxCastX, topY); ctx.lineTo(v.maxCastX, botY); ctx.stroke();
      ctx.setLineDash([]);
      pill(ctx, 'Chạm vào mặt nước để quăng cần', P ? W / 2 : 480, P ? 120 : 60);
    }
    if (v.hint) pill(ctx, v.hint, P ? W / 2 : 480, P ? 176 : 60);

    // --- Thanh bat nhip ---
    if (v.strike) drawStrikeBar(ctx, v.strike, W, H);
    // --- Thanh bo ca ---
    if (v.fight) drawFightBar(ctx, v.fight, W, H);
  }

  function pill(ctx, text, x, y) {
    ctx.font = 'bold 17px system-ui, sans-serif';
    const w = ctx.measureText(text).width + 36;
    ctx.fillStyle = 'rgba(20,35,28,.85)';
    rr(ctx, x - w / 2, y - 18, w, 36, 18); ctx.fill();
    ctx.fillStyle = '#ffe9b8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + 1);
  }

  function drawStrikeBar(ctx, s, W, H) {
    if (H > W) {
      // Portrait: thanh ngang bản lớn giữa mặt nước
      const bx = 40, by = 596, bw = W - 80, bh = 56;
      ctx.fillStyle = 'rgba(20,35,28,.9)'; rr(ctx, bx - 10, by - 10, bw + 20, bh + 20, 12); ctx.fill();
      ctx.fillStyle = '#37474f'; rr(ctx, bx, by, bw, bh, 8); ctx.fill();
      const zx = bx + (s.zc - s.zw / 2) * bw, zwpx = s.zw * bw;
      ctx.fillStyle = '#4caf50'; rr(ctx, zx, by, zwpx, bh, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3;
      rr(ctx, zx, by, zwpx, bh, 8); ctx.stroke();
      const nx = bx + s.pos * bw;
      ctx.fillStyle = '#ffeb3b'; ctx.fillRect(nx - 7, by - 10, 14, bh + 20);
      ctx.strokeStyle = '#212121'; ctx.lineWidth = 3; ctx.strokeRect(nx - 7, by - 10, 14, bh + 20);
      pill(ctx, 'Nhấn khi kim vào vùng xanh!', W / 2, 548);
      return;
    }
    const bx = 220, by = 446, bw = 520, bh = 38;
    ctx.fillStyle = 'rgba(20,35,28,.88)'; rr(ctx, bx - 8, by - 8, bw + 16, bh + 16, 10); ctx.fill();
    ctx.fillStyle = '#37474f'; rr(ctx, bx, by, bw, bh, 6); ctx.fill();
    // vùng xanh — tương phản cao, viền trắng để dễ nhận biết
    const zx = bx + (s.zc - s.zw / 2) * bw, zwpx = s.zw * bw;
    ctx.fillStyle = '#4caf50'; rr(ctx, zx, by, zwpx, bh, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2;
    rr(ctx, zx, by, zwpx, bh, 6); ctx.stroke();
    // kim — dày 10px, viền đậm, dễ nhìn cả trên mobile
    const nx = bx + s.pos * bw;
    ctx.fillStyle = '#ffeb3b'; ctx.fillRect(nx - 5, by - 8, 10, bh + 16);
    ctx.strokeStyle = '#212121'; ctx.lineWidth = 2; ctx.strokeRect(nx - 5, by - 8, 10, bh + 16);
    pill(ctx, 'Nhấn khi kim vào vùng xanh!', 480, 408);
  }

  function drawFightBar(ctx, f, W, H) {
    if (H > W) {
      // Portrait: thanh lực dọc bên phải + tiến trình ngang phía trên
      const bx = W - 80, by = 250, bw = 46, bh = 340;
      ctx.fillStyle = 'rgba(20,35,28,.9)'; rr(ctx, bx - 10, by - 10, bw + 20, bh + 20, 12); ctx.fill();
      const grad = ctx.createLinearGradient(0, by + bh, 0, by);
      grad.addColorStop(0, '#43a047'); grad.addColorStop(0.7, '#ffb300'); grad.addColorStop(1, '#e53935');
      ctx.fillStyle = grad; rr(ctx, bx, by, bw, bh, 8); ctx.fill();
      const zy = by + bh - (f.zc + f.zw / 2) * bh, zh = f.zw * bh;
      ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(ctx, bx - 5, zy, bw + 10, zh, 8); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; rr(ctx, bx - 5, zy, bw + 10, zh, 8); ctx.stroke();
      const ny = by + bh - f.tension * bh;
      ctx.fillStyle = '#212121'; ctx.fillRect(bx - 10, ny - 5, bw + 20, 10);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(bx - 10, ny - 5, bw + 20, 10);
      // tiến trình bo cá
      const px = 40, py = 200, pw = W - 80, ph = 26;
      ctx.fillStyle = 'rgba(20,35,28,.88)'; rr(ctx, px - 10, py - 10, pw + 20, ph + 20, 12); ctx.fill();
      ctx.fillStyle = '#37474f'; rr(ctx, px, py, pw, ph, 8); ctx.fill();
      const pg1 = ctx.createLinearGradient(px, 0, px + pw, 0);
      pg1.addColorStop(0, '#29b6f6'); pg1.addColorStop(1, '#00e5ff');
      ctx.fillStyle = pg1; rr(ctx, px, py, Math.max(ph, pw * f.prog), ph, 8); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(ctx, px + 3, py + 3, Math.max(0, pw * f.prog - 6), 6, 3); ctx.fill();
      ctx.font = '20px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('\ud83d\udc1f', px + pw * f.prog, py + ph / 2 + 1);
      pill(ctx, 'Giữ để kéo — thả để nhả, đừng để đứt dây!', W / 2, 150);
      return;
    }
    // thanh lực dọc bên phải — rộng hơn để dễ đọc trên mobile
    const bx = 876, by = 120, bw = 44, bh = 300;
    ctx.fillStyle = 'rgba(20,35,28,.88)'; rr(ctx, bx - 8, by - 8, bw + 16, bh + 16, 10); ctx.fill();
    const grad = ctx.createLinearGradient(0, by + bh, 0, by);
    grad.addColorStop(0, '#43a047'); grad.addColorStop(0.7, '#ffb300'); grad.addColorStop(1, '#e53935');
    ctx.fillStyle = grad; rr(ctx, bx, by, bw, bh, 6); ctx.fill();
    // vùng an toàn — nền trắng mờ đậm + viền trắng dày, nổi bật trên gradient
    const zy = by + bh - (f.zc + f.zw / 2) * bh, zh = f.zw * bh;
    ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(ctx, bx - 4, zy, bw + 8, zh, 6); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; rr(ctx, bx - 4, zy, bw + 8, zh, 6); ctx.stroke();
    // kim lực — dày, viền trắng để luôn thấy rõ
    const ny = by + bh - f.tension * bh;
    ctx.fillStyle = '#212121'; ctx.fillRect(bx - 8, ny - 4, bw + 16, 8);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(bx - 8, ny - 4, bw + 16, 8);
    // tiến trình bo cá
    const px = 220, py = 96, pw = 520, ph = 26;
    ctx.fillStyle = 'rgba(20,35,28,.85)'; rr(ctx, px - 8, py - 8, pw + 16, ph + 16, 10); ctx.fill();
    ctx.fillStyle = '#37474f'; rr(ctx, px, py, pw, ph, 6); ctx.fill();
    const pg2 = ctx.createLinearGradient(px, 0, px + pw, 0);
    pg2.addColorStop(0, '#29b6f6'); pg2.addColorStop(1, '#00e5ff');
    ctx.fillStyle = pg2; rr(ctx, px, py, Math.max(ph, pw * f.prog), ph, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(ctx, px + 3, py + 3, Math.max(0, pw * f.prog - 6), 6, 3); ctx.fill();
    ctx.font = '20px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('\ud83d\udc1f', px + pw * f.prog, py + ph / 2 + 1);
    pill(ctx, 'Giữ để kéo — thả để nhả, đừng để đứt dây!', 480, 52);
  }

  // ===== Mini-game đào giun: vườn đất =====
  // o: { W,H,t,worms,hoes,parts,marks,decor,bucket }
  // worm: { x,y,born,ph,caught,fly } ; hoe: { x,y,t0,dur,struck,worm }
  function wormHead(w, t) {
    const age = t - w.born;
    const grow = Math.max(0, Math.min(1, (age - 0.10) / 0.25));
    const len = 34 * grow, segs = 7;
    const i = segs;
    return {
      x: w.x + Math.sin(t * 9 + w.ph + i * 0.75) * 5 * (i / segs),
      y: w.y - (i + 1) * (len / segs),
    };
  }
  function drawDigGarden(ctx, o) {
    const W = o.W, H = o.H, t = o.t, portrait = H > W;
    const soilY = portrait ? 120 : 78;
    const sky = o.sky || { mood: 'day', wet: false };
    drawSky(ctx, W, soilY + 30, t, sky);

    // --- Nền đất ---
    const soil = ctx.createLinearGradient(0, soilY, 0, H);
    soil.addColorStop(0, '#9c7a5f'); soil.addColorStop(1, '#7a5b44');
    ctx.fillStyle = soil; ctx.fillRect(0, soilY, W, H - soilY);
    // luống xới: rãnh đất uốn lượn tự nhiên
    for (let rI = 0; rI * 52 < H - soilY; rI++) {
      const y0 = soilY + 26 + rI * 52;
      ctx.fillStyle = 'rgba(93,64,45,.5)';
      ctx.beginPath();
      for (let x = 0; x <= W; x += 24) {
        const yo = y0 + Math.sin(x * 0.02 + rI * 1.7) * 7;
        x === 0 ? ctx.moveTo(x, yo) : ctx.lineTo(x, yo);
      }
      for (let x = W; x >= 0; x -= 24) {
        const yo = y0 + 10 + Math.sin(x * 0.02 + rI * 1.7) * 7;
        ctx.lineTo(x, yo);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,235,200,.10)';
      ctx.beginPath();
      for (let x = 0; x <= W; x += 24) {
        const yo = y0 + 12 + Math.sin(x * 0.02 + rI * 1.7) * 7;
        x === 0 ? ctx.moveTo(x, yo) : ctx.lineTo(x, yo);
      }
      for (let x = W; x >= 0; x -= 24) {
        const yo = y0 + 16 + Math.sin(x * 0.02 + rI * 1.7) * 7;
        ctx.lineTo(x, yo);
      }
      ctx.closePath(); ctx.fill();
    }

    // vân đất
    const dc = o.decor || {};
    for (const d of (dc.dots || [])) {
      ctx.fillStyle = d.l ? 'rgba(0,0,0,.10)' : 'rgba(255,240,210,.10)';
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.29); ctx.fill();
    }
    // ụ đất trang trí
    for (const m of (dc.mounds || [])) {
      ctx.fillStyle = '#6d4c41';
      ctx.beginPath(); ctx.ellipse(m.x, m.y, m.r, m.r * 0.45, 0, 0, 6.29); ctx.fill();
      ctx.fillStyle = 'rgba(255,235,200,.12)';
      ctx.beginPath(); ctx.ellipse(m.x - m.r * 0.25, m.y - m.r * 0.14, m.r * 0.5, m.r * 0.2, 0, 0, 6.29); ctx.fill();
    }
    // sỏi
    for (const p of (dc.pebbles || [])) {
      ctx.fillStyle = '#9e9e9e';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 6.29); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.beginPath(); ctx.ellipse(p.x - p.rx * 0.3, p.y - p.ry * 0.3, p.rx * 0.4, p.ry * 0.35, 0, 0, 6.29); ctx.fill();
    }
    // cỏ dại
    for (const g of (dc.weeds || [])) {
      ctx.strokeStyle = '#558b2f'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (let b = -2; b <= 2; b++) {
        ctx.beginPath(); ctx.moveTo(g.x, g.y);
        ctx.quadraticCurveTo(g.x + b * 4 * g.s, g.y - 10 * g.s, g.x + b * 6 * g.s, g.y - 16 * g.s);
        ctx.stroke();
      }
    }
    // hàng rào tre trên mép vườn
    const postY = soilY + 6;
    ctx.fillStyle = '#7a5c2e';
    ctx.fillRect(0, postY - 26, W, 7); ctx.fillRect(0, postY - 12, W, 7);
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(0, postY - 26, W, 2);
    for (let x = 24; x < W; x += 92) {
      ctx.fillStyle = '#8a6d3b'; rr(ctx, x - 6, postY - 44, 12, 52, 5); ctx.fill();
      ctx.fillStyle = '#6b5228';
      ctx.fillRect(x - 6, postY - 30, 12, 3); ctx.fillRect(x - 6, postY - 16, 12, 3);
    }
    // cây chuối 2 góc
    for (const bx of [26, W - 26]) {
      ctx.strokeStyle = '#4e7a3a'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx, soilY + 2); ctx.lineTo(bx, soilY - 34); ctx.stroke();
      ctx.fillStyle = '#66a34e';
      for (let l = 0; l < 4; l++) {
        const a = -0.5 - l * 0.5 + (bx < W / 2 ? 0 : 2.2);
        ctx.save(); ctx.translate(bx, soilY - 34); ctx.rotate(a);
        ctx.beginPath(); ctx.ellipse(34, 0, 36, 11, 0, 0, 6.29); ctx.fill(); ctx.restore();
      }
    }
    // --- Xô đựng giun ---
    const bk = o.bucket;
    ctx.save();
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.moveTo(bk.x - 20, bk.y - 16); ctx.lineTo(bk.x + 20, bk.y - 16);
    ctx.lineTo(bk.x + 15, bk.y + 18); ctx.lineTo(bk.x - 15, bk.y + 18);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(bk.x - 20, bk.y - 16); ctx.lineTo(bk.x + 20, bk.y - 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bk.x - 17, bk.y - 2); ctx.lineTo(bk.x + 17, bk.y - 2); ctx.stroke();
    ctx.strokeStyle = '#78909c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(bk.x, bk.y - 16, 20, Math.PI, 0); ctx.stroke();
    ctx.restore();
    // --- Giun ---
    for (const w of (o.worms || [])) {
      const age = t - w.born;
      if (w.caught) { // bị cuốc hất bay vào xô
        const fp = Math.min(1, (t - w.fly) / 0.5);
        const sx = w.x, syw = w.y - 16;
        const mx = (sx + bk.x) / 2, my = Math.min(syw, bk.y) - 130;
        const ix = (1 - fp) * (1 - fp) * sx + 2 * (1 - fp) * fp * mx + fp * fp * bk.x;
        const iy = (1 - fp) * (1 - fp) * syw + 2 * (1 - fp) * fp * my + fp * fp * bk.y;
        ctx.save(); ctx.globalAlpha = 1 - fp * 0.6;
        ctx.translate(ix, iy); ctx.rotate(fp * 5);
        ctx.strokeStyle = '#ef9aa5'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-10, 6); ctx.quadraticCurveTo(0, -8, 10, 4); ctx.stroke();
        ctx.restore();
        continue;
      }
      // ụ đất đội lên trước
      if (age < 0.22) {
        const g = Math.min(1, age / 0.15);
        ctx.fillStyle = '#6d4c41';
        ctx.beginPath(); ctx.ellipse(w.x, w.y, 14 * g, 7 * g, 0, 0, 6.29); ctx.fill();
      }
      const grow = Math.max(0, Math.min(1, (age - 0.10) / 0.25));
      if (grow <= 0) continue;
      const len = 34 * grow, segs = 7;
      ctx.lineCap = 'round';
      for (let i = segs; i >= 1; i--) {
        const f0 = (i - 1) / segs, f1 = i / segs;
        const x0 = w.x + Math.sin(t * 9 + w.ph + (i - 1) * 0.75) * 5 * f0;
        const y0 = w.y - i * (len / segs);
        const x1 = w.x + Math.sin(t * 9 + w.ph + i * 0.75) * 5 * f1;
        const y1 = w.y - (i + 1) * (len / segs);
        ctx.strokeStyle = (i % 2 === 0) ? '#d67b88' : '#ef9aa5';
        ctx.lineWidth = 7 - (i / segs) * 4;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
      const hd = wormHead(w, t);
      ctx.fillStyle = '#d16a7a';
      ctx.beginPath(); ctx.arc(hd.x, hd.y, 4.2, 0, 6.29); ctx.fill();
    }
    // --- Cây cuốc bổ xuống ---
    for (const h of (o.hoes || [])) {
      const p = (t - h.t0) / h.dur;
      if (p < 0 || p > 1.15) continue;
      let ang;
      if (p < 0.55) { const q = p / 0.55; ang = -1.05 + (0.30 + 1.05) * q * q; }
      else { const q = Math.min(1, (p - 0.55) / 0.45); ang = 0.30 + (-0.25 - 0.30) * q; }
      const px = h.x, py = h.y - 110, hl = 118;
      const ex = px + Math.sin(ang) * hl, ey = py + Math.cos(ang) * hl;
      ctx.save();
      ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke();
      // lưỡi cuốc
      ctx.translate(ex, ey); ctx.rotate(ang + 0.5);
      ctx.fillStyle = '#78909c';
      ctx.beginPath();
      ctx.moveTo(-4, 0); ctx.lineTo(16, 0); ctx.lineTo(22, 26); ctx.lineTo(2, 26);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#546e7a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }
    // --- Hạt đất văng ---
    for (const pt of (o.parts || [])) {
      const a = Math.max(0, 1 - pt.life / pt.max);
      ctx.save(); ctx.globalAlpha = a;
      ctx.translate(pt.x, pt.y); ctx.rotate(pt.rot);
      ctx.fillStyle = pt.c; ctx.fillRect(-pt.sz / 2, -pt.sz / 2, pt.sz, pt.sz);
      ctx.restore();
    }
    // --- Vết cuốc bổ hụt ---
    for (const m of (o.marks || [])) {
      const q = (t - m.t0) / m.dur;
      if (q < 0 || q > 1) continue;
      ctx.save(); ctx.globalAlpha = 0.7 * (1 - q);
      ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        const a = -0.9 + k * 0.9;
        ctx.beginPath(); ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x + Math.cos(a) * 16, m.y + Math.sin(a) * 10 + 4);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  return { drawScene, drawFishIcon, drawDigGarden, wormHead, moodFor };
})();
