/* ===== Câu Cá Ao Làng — state machine & gameplay ===== */
(function () {
'use strict';

const cv = document.getElementById('game');
const ctx = cv.getContext('2d');

/* ---------- Lưu trữ ---------- */
const SAVE_KEY = 'cauCaAoLang_v1';
function defaultSave() {
  return { money: START_MONEY, rods: ['tre'], rod: 'tre', giun: 5, cam: 0, bait: 'giun',
           muted: false, totalFish: 0, caughtAo: 0, map: 'ao', quests: null };
}
let S;
try { S = Object.assign(defaultSave(), JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); }
catch (e) { S = defaultSave(); }
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function rod() { return RODS.find(r => r.id === S.rod) || RODS[0]; }
// Cấp cần thủ: floor(tổng cá đã câu / 10) + 1, tối đa 15
function level() { return Math.min(15, Math.floor((S.totalFish || 0) / 10) + 1); }
function mapUnlocked(id) {
  if (id === 'ao') return true;
  if (id === 'song') return (S.caughtAo || 0) >= 15 || level() >= 2;
  return false;
}
Sfx.muted = !!S.muted;

/* ---------- Trạng thái game ---------- */
let phase = 'MENU';           // MENU PREPARE SHOP HELP DIG CAST WAIT BITE STRIKE FIGHT RESULT
let tG = 0, lastTs = 0;       // thời gian toàn cục
let fx = 0, fy = 0;           // vị trí phao
let waitT = 0;                // đếm ngược chờ cắn
let fish = null, biteT = 0;   // cá đang cắn
let strike = null;            // {pos, dur, zc, zw}
let fight = null;             // {tension, prog, zt, amp, speed, zw, zc, surge, fill, breakT, slackT, surgeT}
let holding = false;          // đang giữ để bo cá
let splashes = [];            // hạt nước
let hint = null;              // chữ gợi ý trên canvas
let lastPrice = 0, lastWeight = 0;
let toastTimer = null;
let spot = null;              // điểm câu sông quê đang chọn (object RIVER_SPOTS)
let session = { weather: 'nang', golden: false }; // thời tiết & giờ vàng của phiên câu

/* ---------- DOM helper ---------- */
const $ = id => document.getElementById(id);
const screens = ['scr-menu', 'scr-prepare', 'scr-shop', 'scr-help', 'scr-dig', 'pop-result', 'scr-map', 'scr-quest'];
function show(id) {
  screens.forEach(s => $(s).classList.toggle('hidden', s !== id));
  $('hud').classList.toggle('hidden', !(id === null && isFishing()));
}
function isFishing() {
  return ['SPOT', 'CAST', 'WAIT', 'BITE', 'STRIKE', 'FIGHT', 'RESULT'].includes(phase);
}
let toastToken = 0;
function toast(msg, ms) {
  const el = $('toast');
  const tk = ++toastToken;
  el.textContent = msg;
  el.classList.remove('hidden');
  // ép reflow để transition opacity chạy lại khi toast liên tiếp
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (tk !== toastToken) return;
    el.classList.remove('show');
    setTimeout(() => { if (tk === toastToken) el.classList.add('hidden'); }, 240);
  }, ms || 1800);
}
function updateHUD() {
  $('hud-money').textContent = '💰 ' + fmt(S.money);
  $('hud-level').textContent = '⭐ Cấp ' + level();
  $('hud-map').textContent = mapName(S.map);
  const w = $('hud-weather');
  if (isFishing()) {
    w.classList.remove('hidden');
    w.textContent = (session.weather === 'mua' ? '🌧️ Vừa mưa' : '☀️ Nắng') + (session.golden ? ' ⚡GIỜ VÀNG' : '');
  } else w.classList.add('hidden');
  $('hud-giun').textContent = '🪱 ' + S.giun;
  $('hud-cam').textContent = '🟤 ' + S.cam;
  $('hud-rod').textContent = '🎣 ' + rod().name;
  $('menu-money').textContent = fmt(S.money);
  $('menu-level').textContent = 'Cấp ' + level();
  updateQuestBadge();
}

/* ---------- Màn hình ---------- */
function enterMenu() { phase = 'MENU'; show('scr-menu'); ensureDailyQuests(); updateHUD(); }
function enterHelp() { phase = 'HELP'; show('scr-help'); }
function enterShop() { phase = 'SHOP'; show('scr-shop'); renderShop(); }

/* ---------- Chọn map ---------- */
function renderMapSelect() {
  $('map-list').innerHTML = MAPS.map(m => {
    const un = mapUnlocked(m.id);
    return '<div class="card map-card' + (un ? '' : ' locked') + '" data-map="' + m.id + '">' +
      '<span class="map-icon">' + (un ? m.icon : '🔒') + '</span>' +
      '<div class="card-title">' + m.name + '</div>' +
      '<div class="card-desc">' + m.desc + '</div>' +
      (un ? '' : '<div class="lock-line">🔒 Mở khóa: câu 15 con ở ao làng hoặc đạt cấp 2</div>') +
      '</div>';
  }).join('');
}
function enterMapSelect() { phase = 'MAP'; show('scr-map'); renderMapSelect(); }

/* ---------- Vào phiên câu ---------- */
function enterFish(mapId) {
  S.map = mapId; spot = null; save();
  // Thời tiết ngẫu nhiên mỗi phiên: 25% vừa mưa xong → cá ăn mạnh
  session.weather = Math.random() < 0.25 ? 'mua' : 'nang';
  session.golden = isGoldenHour();
  if (session.weather === 'mua') setTimeout(() => toast('🌧️ Trời vừa tạnh mưa — cá đang ăn mạnh!'), 600);
  if (session.golden) setTimeout(() => toast('⚡ GIỜ VÀNG câu cá! Tỉ lệ cắn tăng.'), 1400);
  if (mapId === 'song') {
    phase = 'SPOT'; show(null); updateHUD();
    hint = 'Chạm vào 1 trong 3 điểm câu!';
  } else {
    enterCast();
  }
}

/* ---------- Nhiệm vụ ngày ---------- */
function ensureDailyQuests() {
  const t = todayStr();
  if (S.quests && S.quests.date === t) return;
  // Chọn ngẫu nhiên 3 nhiệm vụ khác nhau từ pool
  const pool = QUEST_POOL.slice();
  const items = [];
  for (let i = 0; i < QUESTS_PER_DAY && pool.length; i++) {
    const q = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    items.push({ qid: q.qid, progress: 0, done: false, claimed: false, set: [] });
  }
  S.quests = { date: t, items };
  save();
}
function questDef(qid) { return QUEST_POOL.find(q => q.qid === qid); }
function questRewardText(q) {
  const r = q.reward, parts = [];
  if (r.money) parts.push(fmt(r.money));
  if (r.cam) parts.push(r.cam + ' cám');
  if (r.giun) parts.push(r.giun + ' giun');
  return parts.join(' + ');
}
// Ghi nhận sự kiện cho nhiệm vụ. kind: catch | sell | miss
function questEvent(kind, d) {
  ensureDailyQuests();
  d = d || {};
  let changed = false, completed = null;
  S.quests.items.forEach(it => {
    if (it.done) return;
    const q = questDef(it.qid);
    const adv = n => { it.progress = Math.min(q.target, it.progress + n); changed = true; };
    switch (q.type) {
      case 'catch_any':     if (kind === 'catch') adv(1); break;
      case 'catch_species': if (kind === 'catch' && d.fishId === q.species) adv(1); break;
      case 'big_fish':      if (kind === 'catch' && d.weight >= q.minW) adv(1); break;
      case 'use_baits':
        if (kind === 'catch' && !it.set.includes(d.bait)) { it.set.push(d.bait); adv(1); }
        break;
      case 'spots':
        if (kind === 'catch' && d.map === 'song' && d.spot && !it.set.includes(d.spot)) { it.set.push(d.spot); adv(1); }
        break;
      case 'catch_map':     if (kind === 'catch' && d.map === q.map) adv(1); break;
      case 'sell':          if (kind === 'sell') adv(1); break;
      case 'streak':
        if (kind === 'catch') adv(1);
        else if (kind === 'miss') { if (it.progress > 0) { it.progress = 0; changed = true; } }
        break;
    }
    if (!it.done && it.progress >= q.target) { it.done = true; changed = true; completed = q; }
  });
  if (changed) save();
  if (completed) { Sfx.caught(); toast('🎯 Hoàn thành: ' + completed.text + ' — vào Nhiệm vụ nhận thưởng!'); }
  updateQuestBadge();
}
function updateQuestBadge() {
  ensureDailyQuests();
  const n = S.quests.items.filter(it => it.done && !it.claimed).length;
  const b = $('quest-badge');
  if (b) { b.textContent = n; b.classList.toggle('hidden', n === 0); }
}
function renderQuests() {
  ensureDailyQuests();
  $('quest-list').innerHTML = S.quests.items.map(it => {
    const q = questDef(it.qid);
    const pct = Math.round(it.progress / q.target * 100);
    let btn;
    if (it.claimed) btn = '<button class="btn small" disabled>Đã nhận ✓</button>';
    else if (it.done) btn = '<button class="btn small" data-qclaim="' + it.qid + '">🎁 Nhận thưởng</button>';
    else btn = '<button class="btn small" disabled>Chưa xong</button>';
    return '<div class="card quest-card' + (it.done ? ' done' : '') + (it.claimed ? ' claimed' : '') + '">' +
      '<div class="card-title">🎯 ' + q.text + '</div>' +
      '<div class="qbar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="qprog">Tiến độ: ' + it.progress + '/' + q.target + '</div>' +
      '<div class="qreward">Thưởng: ' + questRewardText(q) + '</div>' + btn + '</div>';
  }).join('');
}
function enterQuest() { phase = 'QUEST'; show('scr-quest'); renderQuests(); }
function claimQuest(qid) {
  const it = S.quests.items.find(x => x.qid === qid);
  if (!it || !it.done || it.claimed) return;
  const r = questDef(qid).reward;
  if (r.money) S.money += r.money;
  if (r.cam) S.cam += r.cam;
  if (r.giun) S.giun += r.giun;
  it.claimed = true; save();
  Sfx.sell(); toast('🎁 Nhận thưởng: ' + questRewardText(questDef(qid)) + '!');
  renderQuests(); updateHUD();
}

function statBar(lbl, v) {
  return '<div class="stat"><span class="lbl">' + lbl + '</span><div class="bar"><i style="width:' +
    Math.round(v * 100) + '%"></i></div></div>';
}

function rodCard(r, forShop) {
  const owned = S.rods.includes(r.id), using = S.rod === r.id;
  const locked = level() < (r.reqLevel || 1);
  const typeTag = r.type === 'may' ? ' <span class="count">[máy]</span>' : ' <span class="count">[đài]</span>';
  let btn;
  if (using) btn = '<button class="btn small" disabled>Đang dùng</button>';
  else if (locked) btn = '<button class="btn small" disabled>🔒 Cấp ' + r.reqLevel + ' mở khóa</button>';
  else if (owned) btn = '<button class="btn small" data-act="equip" data-id="' + r.id + '">Dùng</button>';
  else btn = '<button class="btn small" data-act="buyrod" data-id="' + r.id + '"' +
    (S.money < r.price ? ' disabled' : '') + '>Mua ' + fmt(r.price) + '</button>';
  return '<div class="card' + (using ? ' selected' : '') + (owned ? ' owned' : '') + '">' +
    '<div class="card-title">🎣 ' + r.name + typeTag + '</div>' +
    statBar('Tầm quăng', r.cast) + statBar('Độ nhạy', r.sense) + statBar('Độ bền', r.line) +
    '<div class="card-desc">' + r.desc + '</div>' + btn +
    (forShop ? '<br><a href="#" class="aff-link" data-item="' + r.name + '">🛒 Mua ngoài đời</a>' : '') + '</div>';
}

function renderPrepare() {
  $('prep-money').textContent = '💰 ' + fmt(S.money);
  // Cần
  $('rod-list').innerHTML = RODS.map(r => rodCard(r, false)).join('');
  // Mồi
  $('bait-giun-count').textContent = 'x' + S.giun;
  $('bait-cam-count').textContent = 'x' + S.cam;
  $('card-giun').classList.toggle('selected', S.bait === 'giun');
  $('card-cam').classList.toggle('selected', S.bait === 'cam');
  const hasBait = (S.bait === 'giun' && S.giun > 0) || (S.bait === 'cam' && S.cam > 0);
  $('btn-go-fish').disabled = !hasBait;
  $('prep-nobait-hint').classList.toggle('hidden', hasBait);
}
function enterPrepare() { phase = 'PREPARE'; show('scr-prepare'); renderPrepare(); }

function renderShop() {
  $('shop-money').textContent = '💰 ' + fmt(S.money);
  $('shop-rods').innerHTML = RODS.map(r => rodCard(r, true)).join('');
  $('shop-baits').innerHTML =
    '<div class="card"><div class="card-title">🟤 Cám câu <span class="count">x' + S.cam + '</span></div>' +
    '<div class="card-desc">' + fmt(CAM_PRICE) + ' / gói ' + CAM_PACK + ' viên — cá cắn nhanh hơn giun.</div>' +
    '<button class="btn small" data-act="buycam"' + (S.money < CAM_PRICE ? ' disabled' : '') + '>Mua ' + fmt(CAM_PRICE) + '</button>' +
    '<br><a href="#" class="aff-link" data-item="Cám câu">🛒 Mua ngoài đời</a></div>' +
    '<div class="card"><div class="card-title">🪱 Giun đất <span class="count">x' + S.giun + '</span></div>' +
    '<div class="card-desc">Miễn phí — tự tay đào mới có!</div>' +
    '<button class="btn small" data-act="dig">⛏️ Đào giun</button></div>';
}

/* ---------- Mini-game đào giun ---------- */
let digTimers = [];
function enterDig(fromShop) {
  phase = 'DIG'; show('scr-dig');
  $('dig-from-shop').value = fromShop ? '1' : '';
  let dug = 0, timeLeft = 20;
  const grid = $('dig-grid'); grid.innerHTML = '';
  const cells = [];
  for (let i = 0; i < 16; i++) {
    const c = document.createElement('div');
    c.className = 'dig-cell'; c.textContent = '🟤';
    grid.appendChild(c); cells.push(c);
  }
  $('dig-time').textContent = timeLeft; $('dig-count').textContent = dug;
  const pop = setInterval(() => {
    const free = cells.filter(c => !c.classList.contains('active'));
    if (!free.length) return;
    const c = free[Math.floor(Math.random() * free.length)];
    c.classList.add('active'); c.textContent = '🪱';
    setTimeout(() => { c.classList.remove('active'); c.textContent = '🟤'; }, 950);
  }, 620);
  const tick = setInterval(() => {
    timeLeft--; $('dig-time').textContent = timeLeft;
    if (timeLeft <= 0) endDig();
  }, 1000);
  grid.onclick = e => {
    const c = e.target.closest('.dig-cell');
    if (c && c.classList.contains('active')) {
      const got = 2 + Math.floor(Math.random() * 4); // 2-5 con
      dug += got; $('dig-count').textContent = dug;
      c.classList.remove('active'); c.textContent = '🟤';
      Sfx.click();
    }
  };
  function endDig() {
    clearInterval(pop); clearInterval(tick);
    if (dug > 0) { S.giun += dug; save(); toast('Đào được ' + dug + ' con giun! 🪱'); }
    else toast('Chưa đào được con nào...');
    updateHUD();
    if ($('dig-from-shop').value === '1') enterShop(); else enterPrepare();
  }
  $('btn-dig-end').onclick = () => { Sfx.click(); endDig(); };
  digTimers = [pop, tick];
}

/* ---------- Luồng câu cá ---------- */
function enterCast(msg) {
  phase = 'CAST'; show(null); updateHUD();
  hint = msg || null;
}
function waterBounds(x, y) {
  if (S.map === 'song') return x >= 60 && x <= 900 && y >= 230 && y <= 430;
  return x >= 60 && x <= 900 && y >= 215 && y <= 445;
}

function doCast(x, y) {
  if (!waterBounds(x, y)) { toast('Chạm vào mặt nước để quăng cần!'); return; }
  const maxX = 60 + rod().cast * 840;
  if (x > maxX) { x = maxX; toast('Cần của bạn chỉ quăng tới đây!'); }
  fx = x; fy = y; hint = null;
  Sfx.splash();
  splashes.push({ x: fx, y: fy, r: 6, a: 0.9 });
  // Chọn sẵn con cá sẽ cắn để áp hệ số mồi ưa thích / thời tiết / giờ vàng / dòng chảy
  fish = pickFish();
  let mult = 1;
  const mods = [];
  if (fish.bait === S.bait) { mult *= 0.8; }
  if (session.weather === 'mua') { mult *= 0.7; mods.push('sau mưa'); }
  if (session.golden) { mult *= 0.8; mods.push('giờ vàng'); }
  if (S.map === 'song' && spot) {
    const drift = spot.flow - BAITS[S.bait].w;
    if (drift > 0.25) {
      mult *= 1.67; // tỉ lệ cắn giảm ~40%
      hint = '⚠️ Dòng xiết! Mồi bị trôi — tỉ lệ cắn giảm.';
      toast('⚠️ Dòng xiết! Hãy dùng mồi nặng hơn hoặc đổi điểm câu.');
    }
  }
  const wt = BAITS[S.bait].wait;
  waitT = rnd(wt[0], wt[1]) * mult;
  phase = 'WAIT';
}

function pickFish() {
  const pool = FISH.filter(f => f.map === S.map);
  const distFrac = (fx - 60) / 840; // 0 gần .. 1 xa
  let total = 0;
  const ws = pool.map(f => {
    let w = f.w * ((distFrac > 0.65 && f.big) ? 2.5 : 1);
    // Điểm câu sông: cá đặc trưng của điểm dễ gặp hơn
    if (S.map === 'song' && spot && spot.fish.includes(f.id)) w *= 2.5;
    total += w; return w;
  });
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) return pool[i]; }
  return pool[0];
}

function startBite() {
  biteT = 0;
  S[S.bait]--; save(); updateHUD();   // tốn 1 mồi
  phase = 'BITE';
  Sfx.bite();
  splashes.push({ x: fx, y: fy, r: 6, a: 0.9 });
}

// Animation phao theo pattern của từng loài (t = giây từ lúc cắn, 0..1.2)
function dip(t, t0, t1, depth) {
  if (t < t0 || t > t1) return 0;
  return depth * Math.sin(Math.PI * (t - t0) / (t1 - t0));
}
function ramp(t, t0, t1, depth) {
  if (t < t0) return 0; if (t > t1) return depth;
  return depth * (t - t0) / (t1 - t0);
}
function biteAnim(pattern, t) {
  let dy = 0, tilt = 0;
  switch (pattern) {
    case 'nhap2': // rô phi: nhấp 2 cái rồi kéo chìm
      dy = dip(t, 0.22, 0.38, 9) + dip(t, 0.58, 0.74, 9) + ramp(t, 0.9, 1.2, 24);
      tilt = ramp(t, 0.9, 1.2, 0.5); break;
    case 'nhap3': // rô đồng: nhấp nhanh 3 cái
      dy = dip(t, 0.12, 0.26, 8) + dip(t, 0.42, 0.56, 8) + dip(t, 0.72, 0.86, 8) + ramp(t, 1.0, 1.2, 14);
      break;
    case 'nhap1': // diêu hồng: nhấp 1 cái rồi chìm chậm
      dy = dip(t, 0.3, 0.52, 10) + ramp(t, 0.7, 1.2, 18); tilt = ramp(t, 0.7, 1.2, 0.3); break;
    case 'chimcham': // sặc: chìm từ từ
      dy = ramp(t, 0, 1.2, 18); break;
    case 'day': // chép: đẩy phao lên rồi kéo
      dy = (t < 0.55 ? -10 * Math.sin(Math.PI * t / 0.55) : 0) + ramp(t, 0.6, 1.2, 22);
      tilt = ramp(t, 0.6, 1.2, 0.4); break;
    case 'dotngot': // chim: kéo mạnh đột ngột
      dy = ramp(t, 0.75, 1.0, 26); tilt = ramp(t, 0.75, 1.0, 0.6); break;
    case 'rung': // trê: rung mạnh liên tục
      dy = Math.sin(t * 38) * 7; tilt = Math.sin(t * 30) * 0.3; break;
    case 'loi': // tai tượng: nhấp 1 cái rồi lôi chìm sâu
      dy = dip(t, 0.2, 0.36, 9) + ramp(t, 0.85, 1.2, 30);
      tilt = ramp(t, 0.85, 1.2, 0.7); break;
    // --- Pattern mới cho cá sông (Đợt 1) ---
    case 'nganh2': // ngạnh: rung 2 nhịp mạnh rồi im → kéo
      dy = dip(t, 0.2, 0.34, 13) + dip(t, 0.46, 0.6, 13) + ramp(t, 0.95, 1.2, 24);
      tilt = ramp(t, 0.95, 1.2, 0.5); break;
    case 'loinhanh': // thác lác: nhấp 1 cái rồi lôi nhanh
      dy = dip(t, 0.25, 0.4, 10) + ramp(t, 0.5, 0.95, 26);
      tilt = ramp(t, 0.5, 0.95, 0.55); break;
    case 'rungdeu': // tra: rung đều rồi chìm
      dy = Math.sin(t * 20) * 4 + ramp(t, 0.5, 1.2, 16); break;
    case 'nhapnhe': // cá he: nhấp nhẹ liên tục
      dy = dip(t, 0.15, 0.3, 5) + dip(t, 0.45, 0.6, 5) + dip(t, 0.75, 0.9, 5) + ramp(t, 1.0, 1.2, 12);
      break;
    case 'hut': // bống tượng: hút phao xuống nhanh
      dy = ramp(t, 0.4, 0.7, 24); tilt = ramp(t, 0.4, 0.7, 0.4); break;
    case 'runtan': // cá chốt: rung lăn tăn rồi chìm nhẹ
      dy = Math.sin(t * 30) * 3 + ramp(t, 0.6, 1.2, 12); break;
  }
  return { dy, tilt };
}

function startStrike() {
  const r = rod();
  const zw = clamp(0.16 + r.sense * 0.24 - fish.diff * 0.08, 0.10, 0.40);
  let zc = rnd(0.30, 0.78);
  zc = clamp(zc, zw / 2 + 0.03, 1 - zw / 2 - 0.03);
  strike = { pos: 0, dur: 1.5, zc, zw };
  phase = 'STRIKE';
}

function strikeJudge() {
  const ok = Math.abs(strike.pos - strike.zc) <= strike.zw / 2;
  strike = null;
  if (ok) { Sfx.hooked(); startFight(); }
  else strikeMiss('Giật hụt! Mất mồi.');
}
function strikeMiss(msg) {
  Sfx.fail(); toast(msg);
  questEvent('miss');
  afterAttempt();
}

function startFight() {
  const r = rod(), d = fish.diff;
  fight = {
    tension: 0.35, prog: 0, zt: 0,
    amp: 0.10 + d * 0.16,
    speed: 1.6 + d * 2.2,
    zw: clamp(0.36 - d * 0.14 + r.line * 0.08, 0.16, 0.44),
    zc: 0.5, surge: 0,
    fill: 0.22 + r.line * 0.10,
    breakT: 0, slackT: 0, surgeT: rnd(0.8, 1.6),
  };
  phase = 'FIGHT';
}

function fightWin() {
  Sfx.caught();
  const w = rnd(fish.min, fish.max);
  lastWeight = Math.round(w * 100) / 100;
  lastPrice = Math.round(lastWeight * fish.price);
  // Đếm cá cho cấp độ & mở khóa map
  S.totalFish = (S.totalFish || 0) + 1;
  if (S.map === 'ao') S.caughtAo = (S.caughtAo || 0) + 1;
  save();
  questEvent('catch', { fishId: fish.id, weight: lastWeight, map: S.map, spot: spot && spot.id, bait: S.bait });
  fight = null; phase = 'RESULT';
  $('res-title').textContent = '🐟 Dính cá!';
  $('res-name').textContent = fish.name;
  $('res-weight').textContent = 'Cân nặng: ' + lastWeight.toFixed(2) + ' kg';
  $('res-price').textContent = 'Giá bán: ' + fmt(lastPrice);
  const rc = $('res-fish'), rx = rc.getContext('2d');
  rx.clearRect(0, 0, rc.width, rc.height);
  Art.drawFishIcon(rx, fish, 120, 65, 150);
  show('pop-result');
}
function fightLost(msg) {
  Sfx.fail(); fight = null; toast(msg);
  questEvent('miss');
  afterAttempt();
}

// Sau mỗi lần giật/bo: kiểm tra còn mồi không
function afterAttempt() {
  updateHUD();
  if (S[S.bait] > 0) { enterCast(); return; }
  const other = S.bait === 'giun' ? 'cam' : 'giun';
  if (S[other] > 0) {
    S.bait = other; save();
    toast('Hết mồi! Đã chuyển sang ' + BAITS[other].name + '.');
    enterCast();
  } else {
    toast('Hết mồi! Về chuẩn bị thêm.');
    enterPrepare();
  }
}

/* ---------- Input ---------- */
function canvasPos(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * 960, y: (e.clientY - r.top) / r.height * 540 };
}
function onPress(e) {
  Sfx.init();
  if (phase === 'SPOT') {
    const p = canvasPos(e);
    const s = RIVER_SPOTS.find(s => Math.hypot(p.x - s.x, p.y - s.y) < 60);
    if (s) {
      spot = s; Sfx.click();
      toast('Đã chọn: ' + s.name + ' — ' + s.desc);
      enterCast();
    } else toast('Chạm vào 1 trong 3 điểm câu!');
  }
  else if (phase === 'CAST') { const p = canvasPos(e); doCast(p.x, p.y); }
  else if (phase === 'BITE') startStrike();       // nhấn sớm: vào luôn thanh nhịp
  else if (phase === 'STRIKE') { Sfx.click(); strikeJudge(); }
  else if (phase === 'FIGHT') holding = true;
}
function onRelease() { holding = false; }

cv.addEventListener('pointerdown', onPress);
window.addEventListener('pointerup', onRelease);
window.addEventListener('pointercancel', onRelease);
cv.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'Enter') {
    if (['CAST', 'BITE', 'STRIKE', 'FIGHT'].includes(phase)) { e.preventDefault(); if (!e.repeat) onPress(e); }
  }
});
window.addEventListener('keyup', e => {
  if (e.code === 'Space' || e.code === 'Enter') onRelease();
});

/* ---------- Nút bấm ---------- */
function bindClick(id, fn) { $(id).addEventListener('click', e => { Sfx.init(); Sfx.click(); fn(e); }); }
bindClick('btn-to-prepare', enterPrepare);
bindClick('btn-to-quest', enterQuest);
bindClick('btn-to-shop', enterShop);
bindClick('btn-to-help', enterHelp);
bindClick('btn-help-back', enterMenu);
bindClick('btn-prep-back', enterMenu);
bindClick('btn-shop-back', enterMenu);
bindClick('btn-quest-back', enterMenu);
bindClick('btn-map-back', enterPrepare);
bindClick('btn-go-fish', () => enterMapSelect());
bindClick('btn-home', enterMenu);
bindClick('btn-dig', () => enterDig(false));
bindClick('btn-buy-cam-prep', () => buyCam());
bindClick('btn-sell', () => {
  S.money += lastPrice; save(); Sfx.sell();
  questEvent('sell');
  toast('Đã bán cá +' + fmt(lastPrice) + '!');
  $('pop-result').classList.add('hidden');
  afterAttempt();
});
bindClick('btn-release', () => {
  toast('Đã thả cá về ao.');
  $('pop-result').classList.add('hidden');
  afterAttempt();
});
$('btn-mute').addEventListener('click', () => {
  Sfx.init();
  Sfx.muted = !Sfx.muted; S.muted = Sfx.muted; save();
  $('btn-mute').textContent = Sfx.muted ? '🔇' : '🔊';
});
$('btn-mute').textContent = Sfx.muted ? '🔇' : '🔊';

// Chọn mồi
$('card-giun').addEventListener('click', e => {
  if (e.target.closest('button')) return;
  S.bait = 'giun'; save(); Sfx.click(); renderPrepare();
});
$('card-cam').addEventListener('click', e => {
  if (e.target.closest('button')) return;
  S.bait = 'cam'; save(); Sfx.click(); renderPrepare();
});

// Mua / trang bị (event delegation cho danh sách render động)
document.addEventListener('click', e => {
  const m = e.target.closest('[data-map]');
  if (m) {
    Sfx.init(); Sfx.click();
    const mapId = m.dataset.map;
    if (!mapUnlocked(mapId)) { toast('🔒 Chưa mở khóa! Câu 15 con ở ao làng hoặc đạt cấp 2.'); return; }
    enterFish(mapId);
    return;
  }
  const q = e.target.closest('[data-qclaim]');
  if (q) { Sfx.init(); Sfx.click(); claimQuest(q.dataset.qclaim); return; }
  const b = e.target.closest('[data-act]');
  if (!b) return;
  Sfx.init(); Sfx.click();
  const act = b.dataset.act, id = b.dataset.id;
  if (act === 'buyrod') {
    const r = RODS.find(x => x.id === id);
    if (level() < (r.reqLevel || 1)) { toast('Cần đạt cấp ' + r.reqLevel + ' để mua cần này!'); }
    else if (S.money >= r.price) {
      S.money -= r.price; S.rods.push(r.id); S.rod = r.id; save();
      Sfx.sell(); toast('Đã mua ' + r.name + '!');
    }
  } else if (act === 'equip') {
    S.rod = id; save(); toast('Đã trang bị ' + rod().name + '.');
  } else if (act === 'buycam') {
    buyCam();
  } else if (act === 'dig') {
    enterDig(phase === 'SHOP');
  }
  if (phase === 'PREPARE') renderPrepare();
  if (phase === 'SHOP') renderShop();
  updateHUD();
});
function buyCam() {
  if (S.money >= CAM_PRICE) {
    S.money -= CAM_PRICE; S.cam += CAM_PACK; save();
    Sfx.sell(); toast('Đã mua ' + CAM_PACK + ' viên cám!');
  } else toast('Không đủ tiền!');
}
// Link affiliate (placeholder cho admin gắn sau)
document.addEventListener('click', e => {
  const a = e.target.closest('.aff-link');
  if (!a) return;
  e.preventDefault();
  Sfx.click();
  toast('🔗 "' + a.dataset.item + '": admin sẽ gắn link affiliate tại đây.');
});

/* ---------- Vòng lặp chính ---------- */
function update(dt) {
  // hạt nước
  for (let i = splashes.length - 1; i >= 0; i--) {
    const p = splashes[i];
    p.r += 70 * dt; p.a -= 1.6 * dt;
    if (p.a <= 0) splashes.splice(i, 1);
  }
  if (phase === 'WAIT') {
    waitT -= dt;
    if (waitT <= 0) startBite();
  } else if (phase === 'BITE') {
    biteT += dt;
    if (biteT >= 1.2) startStrike();
  } else if (phase === 'STRIKE') {
    strike.pos += dt / strike.dur;
    if (strike.pos >= 1) strikeMiss('Chậm tay! Hụt rồi.');
  } else if (phase === 'FIGHT') {
    const f = fight;
    f.zt += dt;
    // cá giãy: giật vùng an toàn ngẫu nhiên
    f.surgeT -= dt;
    if (f.surgeT <= 0) {
      f.surge = rnd(-0.28, 0.28);
      f.surgeT = rnd(0.8, 1.8);
      splashes.push({ x: fx + rnd(-24, 24), y: fy + rnd(-8, 8), r: 5, a: 0.9 });
      Sfx.splash();
    }
    f.surge *= Math.pow(0.25, dt); // giảm dần
    f.zc = clamp(0.5 + f.amp * Math.sin(f.zt * f.speed) + f.surge, f.zw / 2 + 0.02, 1 - f.zw / 2 - 0.02);
    // lực căng
    f.tension = clamp(f.tension + (holding ? 0.95 : -0.75) * dt, 0, 1);
    const inZone = Math.abs(f.tension - f.zc) <= f.zw / 2;
    if (inZone) f.prog += f.fill * dt;
    // đứt dây / tuột cá
    if (f.tension >= 0.97) f.breakT += dt; else f.breakT = 0;
    if (f.tension <= 0.10) f.slackT += dt; else f.slackT = 0;
    if (f.breakT > 0.45) fightLost('Đứt dây! Cá chạy mất.');
    else if (f.slackT > 2.2) fightLost('Lỏng quá, cá tuột mất!');
    else if (f.prog >= 1) fightWin();
  }
}

function render() {
  // vị trí phao theo phase
  let fdy = 0, tilt = 0, showFloat = ['WAIT', 'BITE', 'STRIKE', 'FIGHT'].includes(phase);
  let biteFlash = false, rodBend = 0;
  if (phase === 'WAIT') { fdy = Math.sin(tG * 2.2) * 3; }
  else if (phase === 'BITE') { const a = biteAnim(fish.pattern, biteT); fdy = a.dy; tilt = a.tilt; biteFlash = true; rodBend = 0.1; }
  else if (phase === 'STRIKE') { const a = biteAnim(fish.pattern, 1.2); fdy = a.dy + Math.sin(tG * 30) * 3; tilt = a.tilt; biteFlash = true; rodBend = 0.25; }
  else if (phase === 'FIGHT') {
    fdy = 14 + Math.sin(tG * 24) * 5; tilt = 0.4;
    rodBend = 0.35 + fight.tension * 0.55; biteFlash = true;
  }
  // Gợi ý trực quan cho từng phase (không để người chơi đoán)
  let phaseHint = hint;
  if (phase === 'WAIT' && !phaseHint) phaseHint = 'Đang chờ cá cắn... 👀 nhìn phao!';
  if (phase === 'BITE') phaseHint = '⚡ Cá cắn! Nhấn ngay!';
  Art.drawScene(ctx, tG, {
    map: S.map,
    float: showFloat ? { x: fx, y: fy, show: true, dy: fdy, tilt } : { show: false },
    rodBend, splashes, biteFlash,
    castHint: phase === 'CAST',
    maxCastX: 60 + rod().cast * 840,
    hint: (phase === 'CAST' || phase === 'WAIT' || phase === 'BITE') ? phaseHint : null,
    strike: phase === 'STRIKE' ? strike : null,
    fight: phase === 'FIGHT' ? { tension: fight.tension, zc: fight.zc, zw: fight.zw, prog: Math.min(fight.prog, 1) } : null,
    spots: phase === 'SPOT' ? RIVER_SPOTS : null,
    spotHint: phase === 'SPOT' ? hint : null,
  });
}

function loop(ts) {
  const dt = Math.min((ts - lastTs) / 1000 || 0, 0.05);
  lastTs = ts; tG += dt;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

/* ---------- Khởi động ---------- */
$('dig-from-shop') || (function () {
  const inp = document.createElement('input');
  inp.type = 'hidden'; inp.id = 'dig-from-shop';
  document.body.appendChild(inp);
})();

// Hook cho test tự động — chỉ tồn tại khi mở với ?test=1, không ảnh hưởng gameplay
if (typeof location !== 'undefined' && location.search.indexOf('test=1') >= 0) {
  window.__test = {
    get phase() { return phase; },
    get S() { return S; },
    get fish() { return fish; },
    get strike() { return strike; },
    get fight() { return fight; },
    get spot() { return spot; },
    get session() { return session; },
    level, mapUnlocked, ensureDailyQuests, questEvent, pickFish,
    forceBite() { if (phase === 'WAIT') waitT = 0; },
    forceStrikeWin() { if (strike) strike.pos = strike.zc; },
    forceFightWin() { if (fight) fight.prog = 1; },
    selectSpot(i) { spot = RIVER_SPOTS[i]; },
  };
}

enterMenu();
requestAnimationFrame(loop);

})();
