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

  // Vẽ toàn cảnh. v = {t, float, rodBend, splashes, strike, fight, castHint, maxCastX, hint}
  function drawScene(ctx, t, v) {
    const W = 960, H = 540;

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

    // --- Cần câu + dây + phao ---
    const f = v.float;
    if (f && f.show) {
      const bx = 150, by = 528; // gốc cần
      // đầu cần cong theo lực bo
      const bend = v.rodBend || 0;
      const tx = bx + (f.x - bx) * 0.78;
      const ty = by + (f.y - by) * 0.78 - bend * 60;
      ctx.strokeStyle = '#6d4c41'; ctx.lineCap = 'round';
      ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo((bx + tx) / 2, (by + ty) / 2 + bend * 20, tx, ty); ctx.stroke();
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo((bx + tx) / 2, (by + ty) / 2 + bend * 20, tx, ty); ctx.stroke();
      // dây câu
      ctx.strokeStyle = 'rgba(240,240,240,.75)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo((tx + f.x) / 2, (ty + f.y) / 2 + 14, f.x, f.y - 14);
      ctx.stroke();
      // phao
      const py = f.y + (f.dy || 0);
      ctx.save(); ctx.translate(f.x, py); ctx.rotate(f.tilt || 0);
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
        ctx.beginPath(); ctx.arc(f.x, f.y, 12 + pr * 26, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // --- Hạt nước bắn ---
    (v.splashes || []).forEach(p => {
      ctx.strokeStyle = 'rgba(255,255,255,' + p.a + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
    });

    // --- Gợi ý quăng cần ---
    if (v.castHint) {
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(v.maxCastX, 205); ctx.lineTo(v.maxCastX, 460); ctx.stroke();
      ctx.setLineDash([]);
      pill(ctx, 'Chạm vào mặt nước để quăng cần', 480, 60);
    }
    if (v.hint) pill(ctx, v.hint, 480, 60);

    // --- Thanh bắt nhịp ---
    if (v.strike) drawStrikeBar(ctx, v.strike);
    // --- Thanh bo cá ---
    if (v.fight) drawFightBar(ctx, v.fight);
  }

  function pill(ctx, text, x, y) {
    ctx.font = 'bold 17px system-ui, sans-serif';
    const w = ctx.measureText(text).width + 36;
    ctx.fillStyle = 'rgba(20,35,28,.85)';
    rr(ctx, x - w / 2, y - 18, w, 36, 18); ctx.fill();
    ctx.fillStyle = '#ffe9b8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + 1);
  }

  function drawStrikeBar(ctx, s) {
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

  function drawFightBar(ctx, f) {
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

  return { drawScene, drawFishIcon };
})();
