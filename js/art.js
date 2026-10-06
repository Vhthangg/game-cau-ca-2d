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

  function drawFishIcon(ctx, fish, x, y, s) {
    // Vẽ cá nhìn ngang, s = chiều dài thân
    ctx.save(); ctx.translate(x, y);
    const c = fish.color;
    ctx.fillStyle = c;
    // đuôi
    ctx.beginPath(); ctx.moveTo(-s * 0.42, 0);
    ctx.lineTo(-s * 0.62, -s * 0.20); ctx.lineTo(-s * 0.62, s * 0.20);
    ctx.closePath(); ctx.fill();
    // thân
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.45, s * 0.17, 0, 0, Math.PI * 2); ctx.fill();
    // vây lưng
    ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 0.15);
    ctx.lineTo(s * 0.08, -s * 0.30); ctx.lineTo(s * 0.2, -s * 0.14);
    ctx.closePath(); ctx.fill();
    // bụng sáng
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.beginPath(); ctx.ellipse(s * 0.05, s * 0.07, s * 0.32, s * 0.08, 0, 0, Math.PI * 2); ctx.fill();
    // vảy (vài đường cong)
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.arc(i * s * 0.11, 0, s * 0.10, -0.9, 0.9); ctx.stroke();
    }
    // mắt
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s * 0.32, -s * 0.04, s * 0.045, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(s * 0.335, -s * 0.04, s * 0.022, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Vẽ toàn cảnh. v = {t, map, float, rodBend, splashes, strike, fight, castHint, maxCastX, hint, spots, spotHint, W, H}
  function drawScene(ctx, t, v) {
    const W = v.W || 960, H = v.H || 540;
    if (H > W) { drawPortraitScene(ctx, t, v, W, H); return; }
    if (v.map === 'song') { drawRiverScene(ctx, t, v); return; }
    // Landscape 960x540 (W,H đã có từ v)

    // --- Trời chiều ---
    const sky = ctx.createLinearGradient(0, 0, 0, 200);
    sky.addColorStop(0, '#a8d8f0'); sky.addColorStop(0.7, '#ffe6b3'); sky.addColorStop(1, '#ffd98a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 200);
    // mặt trời
    const sg = ctx.createRadialGradient(840, 78, 8, 840, 78, 70);
    sg.addColorStop(0, 'rgba(255,246,200,1)'); sg.addColorStop(0.35, 'rgba(255,225,130,.9)'); sg.addColorStop(1, 'rgba(255,225,130,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(840, 78, 70, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(840, 78, 26, 0, Math.PI * 2); ctx.fill();
    // mây trôi
    clouds.forEach(c => {
      const x = ((c.x + t * c.v) % (W + 320)) - 160;
      drawCloud(ctx, x, c.y, c.s);
    });

    // --- Bờ xa: hàng cây + tre ---
    ctx.fillStyle = '#3e6b34';
    ctx.beginPath(); ctx.ellipse(480, 175, 520, 42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4c7d3e';
    ctx.beginPath(); ctx.ellipse(200, 168, 260, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(740, 170, 280, 32, 0, 0, Math.PI * 2); ctx.fill();
    // bụi tre 2 bên
    drawBamboo(ctx, 70, 195, 120, 18); drawBamboo(ctx, 105, 198, 140, -12); drawBamboo(ctx, 140, 196, 110, 8);
    drawBamboo(ctx, 830, 196, 130, -14); drawBamboo(ctx, 868, 198, 150, 10); drawBamboo(ctx, 905, 195, 115, -6);
    // bờ đất xa
    ctx.fillStyle = '#8a6f4d'; ctx.fillRect(0, 188, W, 16);

    // --- Mặt nước ---
    const wg = ctx.createLinearGradient(0, 200, 0, 465);
    wg.addColorStop(0, '#3d9db0'); wg.addColorStop(0.5, '#2a8296'); wg.addColorStop(1, '#1d6b80');
    ctx.fillStyle = wg; ctx.fillRect(0, 202, W, 263);
    // gợn sóng
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const yy = 225 + i * 34;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 24) {
        const yo = Math.sin(x * 0.03 + t * (1.2 + i * 0.18) + i * 2) * 4;
        x === 0 ? ctx.moveTo(x, yy + yo) : ctx.lineTo(x, yy + yo);
      }
      ctx.stroke();
    }
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
    // cái xô đỏ
    ctx.fillStyle = '#c62828'; rr(ctx, 690, 492, 34, 30, 4); ctx.fill();
    ctx.strokeStyle = '#7f0000'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(707, 492, 17, Math.PI, 0); ctx.stroke();

    drawOverlay(ctx, t, v);
  }

  // --- Sông quê: mặt sông rộng, dòng chảy, cầu, 3 điểm câu ---
  function drawRiverScene(ctx, t, v) {
    const W = 960, H = 540;

    // --- Trời sáng ---
    const sky = ctx.createLinearGradient(0, 0, 0, 190);
    sky.addColorStop(0, '#a5d6f5'); sky.addColorStop(1, '#e9f3da');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 190);
    ctx.fillStyle = '#fff6c9'; ctx.beginPath(); ctx.arc(150, 66, 24, 0, Math.PI * 2); ctx.fill();
    clouds.forEach(c => {
      const x = ((c.x + t * c.v) % (W + 320)) - 160;
      drawCloud(ctx, x, c.y, c.s);
    });

    // --- Bờ xa + cầu bê tông ---
    ctx.fillStyle = '#3e6b34';
    ctx.beginPath(); ctx.ellipse(480, 168, 520, 36, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4c7d3e';
    ctx.beginPath(); ctx.ellipse(140, 160, 180, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(830, 162, 190, 28, 0, 0, Math.PI * 2); ctx.fill();
    drawBamboo(ctx, 90, 185, 110, 14); drawBamboo(ctx, 880, 186, 120, -10);
    // mặt cầu
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

    // --- Mặt sông, dòng chảy trôi ngang ---
    const wg = ctx.createLinearGradient(0, 185, 0, 455);
    wg.addColorStop(0, '#45a3b8'); wg.addColorStop(0.5, '#2f8a9e'); wg.addColorStop(1, '#237182');
    ctx.fillStyle = wg; ctx.fillRect(0, 185, W, 270);
    ctx.strokeStyle = 'rgba(255,255,255,.30)'; ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const yy = 210 + i * 34;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 20) {
        const drift = ((x + t * (40 + i * 14)) % (W + 120)) - 60;
        const yo = Math.sin(drift * 0.05 + i * 1.7) * 4;
        x === 0 ? ctx.moveTo(x, yy + yo) : ctx.lineTo(x, yy + yo);
      }
      ctx.stroke();
    }
    // vệt dòng chảy chạy nhanh
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3;
    for (let i = 0; i < 10; i++) {
      const yy = 205 + ((i * 53) % 230);
      const xx = ((i * 173 + t * 130) % (W + 160)) - 80;
      ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 34, yy); ctx.stroke();
    }

    // --- Bờ gần: cỏ (trái) + bãi cát bồi (phải) ---
    ctx.fillStyle = '#7a9a4e'; ctx.fillRect(0, 452, 560, 88);
    ctx.fillStyle = '#d9c08a'; ctx.fillRect(560, 452, 400, 88);
    ctx.fillStyle = '#6b8a42'; ctx.fillRect(0, 452, 560, 8);
    ctx.fillStyle = '#c4a76f'; ctx.fillRect(560, 452, 400, 8);
    grassTufts.forEach(g => {
      if (g.x > 560) return;
      ctx.strokeStyle = '#5d8f46'; ctx.lineWidth = 2;
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.quadraticCurveTo(g.x + k * 4, g.y - 8, g.x + k * 7, g.y - 12); ctx.stroke();
      }
    });
    // cái xô đỏ
    ctx.fillStyle = '#c62828'; rr(ctx, 690, 492, 34, 30, 4); ctx.fill();
    ctx.strokeStyle = '#7f0000'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(707, 492, 17, Math.PI, 0); ctx.stroke();

    // --- Điểm câu (phase chọn điểm) ---
    (v.spots || []).forEach(s => {
      const pr = (t * 1.6) % 1;
      ctx.strokeStyle = 'rgba(255,235,59,' + (1 - pr * 0.7) + ')'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(s.x, s.y, 30 + pr * 14, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(20,35,28,.75)';
      ctx.beginPath(); ctx.arc(s.x, s.y, 26, 0, Math.PI * 2); ctx.fill();
      // số gợn sóng = độ xiết dòng
      ctx.strokeStyle = '#4dd0e1'; ctx.lineWidth = 3;
      const n = 1 + Math.round(s.flow * 2);
      for (let i = 0; i < n; i++) {
        const wy = s.y - 8 + i * 9;
        ctx.beginPath(); ctx.arc(s.x, wy, 7, 0.3, Math.PI - 0.3); ctx.stroke();
      }
      pill(ctx, s.name, s.x, s.y - 54);
    });
    if (v.spotHint) pill(ctx, v.spotHint, 480, 60);

    drawOverlay(ctx, t, v);
  }

  // --- Cần thủ đội nón lá (portrait). x,y: vị trí chân ---
  function drawAngler(ctx, x, y) {
    // chân
    ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 9, y - 50); ctx.lineTo(x - 11, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 9, y - 50); ctx.lineTo(x + 11, y); ctx.stroke();
    // thân (áo xanh)
    ctx.fillStyle = '#4e7a3a'; rr(ctx, x - 17, y - 96, 34, 50, 9); ctx.fill();
    ctx.fillStyle = '#3c5f2c'; rr(ctx, x - 17, y - 96, 34, 12, 6); ctx.fill();
    // tay cầm cần (hướng lên phải)
    ctx.strokeStyle = '#f1c27d'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(x + 12, y - 80); ctx.lineTo(x + 40, y - 100); ctx.stroke();
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(x + 40, y - 100, 6, 0, Math.PI * 2); ctx.fill();
    // đầu
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(x, y - 108, 14, 0, Math.PI * 2); ctx.fill();
    // nón lá
    ctx.fillStyle = '#d9b95c';
    ctx.beginPath(); ctx.moveTo(x - 28, y - 114); ctx.lineTo(x + 28, y - 114); ctx.lineTo(x, y - 138); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#a8893a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 28, y - 114); ctx.lineTo(x, y - 138); ctx.lineTo(x + 28, y - 114); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - 138); ctx.lineTo(x, y - 114); ctx.stroke();
  }

  // --- Scene dọc portrait (W=540, H=960): bờ + cần thủ trên, mặt nước lớn ở giữa ---
  function drawPortraitScene(ctx, t, v, W, H) {
    const river = v.map === 'song';
    const wtop = 195, wbot = 730; // mặt nước

    // --- Trời ---
    const sky = ctx.createLinearGradient(0, 0, 0, 150);
    sky.addColorStop(0, '#a8d8f0'); sky.addColorStop(0.7, '#ffe6b3'); sky.addColorStop(1, '#ffd98a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 150);
    const sg = ctx.createRadialGradient(430, 70, 8, 430, 70, 60);
    sg.addColorStop(0, 'rgba(255,246,200,1)'); sg.addColorStop(0.35, 'rgba(255,225,130,.9)'); sg.addColorStop(1, 'rgba(255,225,130,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(430, 70, 60, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(430, 70, 22, 0, Math.PI * 2); ctx.fill();
    clouds.forEach(c => {
      const x = (((c.x / 960 * W) + t * c.v) % (W + 200)) - 100;
      drawCloud(ctx, x, c.y * 0.9, c.s * 0.9);
    });

    // --- Bờ xa: hàng cây + tre ---
    ctx.fillStyle = '#3e6b34';
    ctx.beginPath(); ctx.ellipse(W / 2, 168, W * 0.55, 36, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4c7d3e';
    ctx.beginPath(); ctx.ellipse(W * 0.2, 160, W * 0.28, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(W * 0.8, 162, W * 0.28, 28, 0, 0, Math.PI * 2); ctx.fill();
    drawBamboo(ctx, 45, 190, 110, 14); drawBamboo(ctx, 78, 192, 128, -10);
    drawBamboo(ctx, W - 78, 192, 122, 10); drawBamboo(ctx, W - 45, 190, 108, -8);
    ctx.fillStyle = '#8a6f4d'; ctx.fillRect(0, 184, W, 13);

    if (river) {
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

    // --- Mặt nước lớn ---
    const wg = ctx.createLinearGradient(0, wtop, 0, wbot);
    if (river) { wg.addColorStop(0, '#45a3b8'); wg.addColorStop(0.5, '#2f8a9e'); wg.addColorStop(1, '#237182'); }
    else { wg.addColorStop(0, '#3d9db0'); wg.addColorStop(0.5, '#2a8296'); wg.addColorStop(1, '#1d6b80'); }
    ctx.fillStyle = wg; ctx.fillRect(0, wtop, W, wbot - wtop);
    // gợn sóng
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 2;
    const rows = 9;
    for (let i = 0; i < rows; i++) {
      const yy = wtop + 32 + i * ((wbot - wtop - 64) / (rows - 1));
      ctx.beginPath();
      for (let x = 0; x <= W; x += 20) {
        const yo = Math.sin(x * 0.035 + t * (1.2 + i * 0.18) + i * 2) * 4;
        x === 0 ? ctx.moveTo(x, yy + yo) : ctx.lineTo(x, yy + yo);
      }
      ctx.stroke();
    }
    if (river) {
      // vệt dòng chảy trôi
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const yy = wtop + 24 + ((i * 47) % (wbot - wtop - 48));
        const xx = ((i * 173 + t * 130) % (W + 160)) - 80;
        ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 30, yy); ctx.stroke();
      }
    } else {
      // bèo tấm
      duckweedP.forEach(d => {
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
      ctx.beginPath(); ctx.ellipse(150, 645, 30, 11, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f8bbd0';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath(); ctx.ellipse(390 + Math.cos(a) * 8, 420 + Math.sin(a) * 8, 7, 4, a, 0, 0, Math.PI * 2); ctx.fill();
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
    drawAngler(ctx, 150, 915);
    // cái xô đỏ
    ctx.fillStyle = '#c62828'; rr(ctx, 420, 868, 34, 30, 4); ctx.fill();
    ctx.strokeStyle = '#7f0000'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(437, 868, 17, Math.PI, 0); ctx.stroke();

    drawOverlay(ctx, t, v);
  }

  // --- Lớp phủ dùng chung: cần, phao, hạt nước, gợi ý, thanh nhịp/lực ---
  function drawOverlay(ctx, t, v) {
    const W = v.W || 960, H = v.H || 540, P = H > W; // P: portrait
    // --- Cần câu + dây + phao ---
    const f = v.float;
    if (f && f.show) {
      const bx = P ? 190 : 150, by = P ? 815 : 528; // gốc cần (portrait: tay cần thủ)
      // đầu cần cong theo lực bo
      const bend = v.rodBend || 0;
      const tx = bx + (f.x - bx) * 0.78;
      const ty = by + (f.y - by) * 0.78 - bend * 60;
      ctx.strokeStyle = '#6d4c41'; ctx.lineCap = 'round';
      ctx.lineWidth = P ? 11 : 9;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo((bx + tx) / 2, (by + ty) / 2 + bend * 20, tx, ty); ctx.stroke();
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = P ? 6 : 5;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo((bx + tx) / 2, (by + ty) / 2 + bend * 20, tx, ty); ctx.stroke();
      // dây câu
      ctx.strokeStyle = 'rgba(240,240,240,.75)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo((tx + f.x) / 2, (ty + f.y) / 2 + 14, f.x, f.y - 14);
      ctx.stroke();
      // phao (portrait: phóng to 1.5x cho dễ nhìn)
      const fs = P ? 1.5 : 1;
      const py = f.y + (f.dy || 0);
      ctx.save(); ctx.translate(f.x, py); ctx.scale(fs, fs); ctx.rotate(f.tilt || 0);
      ctx.fillStyle = '#f5f5f5'; rr(ctx, -4.5, -14, 9, 26, 4); ctx.fill();
      ctx.fillStyle = '#d32f2f'; rr(ctx, -4.5, -14, 9, 11, 4); ctx.fill();
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, -22); ctx.stroke();
      ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.arc(0, -23, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // vòng báo cắn
      if (v.biteFlash) {
        const pr = ((t * 3) % 1);
        ctx.strokeStyle = 'rgba(255,60,60,' + (1 - pr) + ')'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(f.x, f.y, (12 + pr * 26) * fs, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // --- Hạt nước bắn ---
    (v.splashes || []).forEach(p => {
      ctx.strokeStyle = 'rgba(255,255,255,' + p.a + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
    });

    // --- Gợi ý quăng cần ---
    if (v.castHint) {
      const topY = P ? 195 : (v.map === 'song' ? 225 : 205), botY = P ? 730 : (v.map === 'song' ? 435 : 460);
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(v.maxCastX, topY); ctx.lineTo(v.maxCastX, botY); ctx.stroke();
      ctx.setLineDash([]);
      pill(ctx, 'Chạm vào mặt nước để quăng cần', P ? W / 2 : 480, P ? 120 : 60);
    }
    if (v.hint) pill(ctx, v.hint, P ? W / 2 : 480, P ? 176 : 60);

    // --- Thanh bắt nhịp ---
    if (v.strike) drawStrikeBar(ctx, v.strike, W, H);
    // --- Thanh bo cá ---
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
      pill(ctx, 'NHẤN khi kim vào vùng xanh!', W / 2, 548);
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
    pill(ctx, 'NHẤN khi kim vào vùng xanh!', 480, 408);
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
      const px = 40, py = 200, pw = W - 80, ph = 22;
      ctx.fillStyle = 'rgba(20,35,28,.88)'; rr(ctx, px - 10, py - 10, pw + 20, ph + 20, 12); ctx.fill();
      ctx.fillStyle = '#37474f'; rr(ctx, px, py, pw, ph, 8); ctx.fill();
      ctx.fillStyle = '#29b6f6'; rr(ctx, px, py, pw * f.prog, ph, 8); ctx.fill();
      pill(ctx, 'GIỮ để kéo — THẢ để nhả. Đừng để đứt dây!', W / 2, 150);
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
    const px = 220, py = 96, pw = 520, ph = 20;
    ctx.fillStyle = 'rgba(20,35,28,.85)'; rr(ctx, px - 8, py - 8, pw + 16, ph + 16, 10); ctx.fill();
    ctx.fillStyle = '#37474f'; rr(ctx, px, py, pw, ph, 6); ctx.fill();
    ctx.fillStyle = '#29b6f6'; rr(ctx, px, py, pw * f.prog, ph, 6); ctx.fill();
    pill(ctx, 'GIỮ để kéo — THẢ để nhả. Đừng để đứt dây!', 480, 52);
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
    // --- Trời ---
    const sky = ctx.createLinearGradient(0, 0, 0, soilY + 30);
    sky.addColorStop(0, '#a5dcf5'); sky.addColorStop(1, '#e6f4df');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, soilY + 30);
    // mặt trời
    ctx.fillStyle = '#fff59d';
    ctx.beginPath(); ctx.arc(W - 64, 42, 26, 0, 6.29); ctx.fill();
    ctx.fillStyle = 'rgba(255,245,157,.35)';
    ctx.beginPath(); ctx.arc(W - 64, 42, 38, 0, 6.29); ctx.fill();
    // mây trôi nhẹ
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    for (let i = 0; i < 3; i++) {
      const cx = ((i * 220 + t * 8) % (W + 160)) - 80, cy = 30 + i * 22;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 34, 14, 0, 0, 6.29);
      ctx.ellipse(cx - 22, cy + 4, 22, 10, 0, 0, 6.29);
      ctx.ellipse(cx + 24, cy + 5, 24, 11, 0, 0, 6.29);
      ctx.fill();
    }
    // --- Nền đất ---
    const soil = ctx.createLinearGradient(0, soilY, 0, H);
    soil.addColorStop(0, '#9c7a5f'); soil.addColorStop(1, '#7a5b44');
    ctx.fillStyle = soil; ctx.fillRect(0, soilY, W, H - soilY);
    // luống xới: rãnh ngang
    ctx.fillStyle = 'rgba(93,64,45,.45)';
    for (let y = soilY + 26; y < H; y += 52) ctx.fillRect(0, y, W, 9);
    ctx.fillStyle = 'rgba(255,235,200,.10)';
    for (let y = soilY + 38; y < H; y += 52) ctx.fillRect(0, y, W, 4);
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

  return { drawScene, drawFishIcon, drawDigGarden, wormHead };
})();
