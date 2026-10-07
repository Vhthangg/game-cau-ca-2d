/* ===== Câu Cá Ao Làng — state machine & gameplay ===== */
(function () {
'use strict';

const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const $ = id => document.getElementById(id);

/* ---------- Dual-layout: landscape 960x540 / portrait 540x960 ---------- */
const L = { W: 960, H: 540, portrait: false };
// Tọa độ điểm câu sông quê theo layout (portrait: ánh xạ tuyến tính giữ nguyên vị trí tương đối)
RIVER_SPOTS.forEach(s => {
  s.px = Math.round(s.x / 960 * 540);
  s.py = Math.round(195 + (s.y - 185) / 270 * 535);
});
function spotPos(s) { return L.portrait ? { x: s.px, y: s.py } : { x: s.x, y: s.y }; }
function castMinX() { return L.portrait ? 30 : 60; }
function castRange() { return L.portrait ? 480 : 840; }
function fitPortraitCanvas() {
  if (!L.portrait) { cv.style.width = ''; cv.style.height = ''; return; }
  const wrap = $('wrap'), hud = $('hud'), bar = $('action-bar');
  const barH = bar.classList.contains('hidden') ? 0 : bar.offsetHeight;
  const availW = wrap.clientWidth;
  const availH = Math.max(200, wrap.clientHeight - hud.offsetHeight - barH);
  const scale = Math.min(availW / L.W, availH / L.H);
  cv.style.width = Math.floor(L.W * scale) + 'px';
  cv.style.height = Math.floor(L.H * scale) + 'px';
}
function updateLayout() {
  const p = window.innerHeight >= window.innerWidth;
  const oW = L.W, oH = L.H;
  L.portrait = p;
  L.W = p ? 540 : 960;
  L.H = p ? 960 : 540;
  if (oW !== L.W || oH !== L.H) {
    cv.width = L.W; cv.height = L.H;
    // Xoay giữa chừng: giữ nguyên vị trí tương đối của phao & hạt nước
    const sx = L.W / oW, sy = L.H / oH;
    fx *= sx; fy *= sy;
    splashes.forEach(s => { s.x *= sx; s.y *= sy; });
    // Mini-game đào giun: remap giun/cuốc/hạt theo layout mới + vẽ lại vườn
    if (typeof digS !== 'undefined' && digS) {
      for (const arr of [digS.worms, digS.hoes, digS.parts, digS.marks])
        arr.forEach(o => { o.x *= sx; o.y *= sy; });
      digS.decor = makeDigDecor();
    }
  }
  document.body.classList.toggle('is-portrait', p);
  updateActionBar();
  fitPortraitCanvas();
}
window.addEventListener('resize', updateLayout);
window.addEventListener('orientationchange', updateLayout);

/* ---------- Lưu trữ ---------- */
const SAVE_KEY = 'cauCaAoLang_v1';
function defaultSave() {
  return { money: START_MONEY, bait: 'giun',
           // Kho ở nhà (không giới hạn) + Túi đi câu (giới hạn theo BAG_CAPS)
           store: null, bag: null, rodSeq: 1,
           muted: false, totalFish: 0, caughtAo: 0, caughtSong: 0, map: 'ao', quests: null, mode: 'free',
           // Đợt 2: Trốn vợ đi câu
           suspicion: 0, sincerity: 0, happiness: 0, merit: 0, totalMerit: 0, buffUntil: 0,
           banUntil: '', spendDay: null, basket: [], weekEntries: {}, weekEval: '',
           wifeApproved: false, titles: [], lateCount: 0,
           // Bảng xếp hạng
           totalEarned: 0, biggestFish: 0, playerName: '', lbSent: 0,
           // Hệ thống đồ đựng cá (mode Trốn vợ): câu ở bờ KHÔNG bán ngay,
           // chỉ "Cho vào đồ đựng" — về nhà mới Bán/Dâng/Nấu. (Tự do giữ nguyên.)
           containers: ['xo'], activeContainer: 'xo', keptFish: [],
           // Thanh thể lực: tốn khi quăng/đào/bo/nấu; hết (=0) thì ăn đồ hoặc chờ hồi
           stamina: 100, staminaTs: 0 };
}
let S;
try { S = Object.assign(defaultSave(), JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); }
catch (e) { S = defaultSave(); }
// Tương thích save cũ: đồ đựng chưa có / đang chọn loại chưa sở hữu
if (!Array.isArray(S.containers) || !S.containers.length) S.containers = ['xo'];
if (!containerById(S.activeContainer) || !S.containers.includes(S.activeContainer))
  S.activeContainer = S.containers[S.containers.length - 1];
if (!Array.isArray(S.keptFish)) S.keptFish = [];
// Di trú giỏ cá cũ (S.basket) sang đồ đựng
if (Array.isArray(S.basket) && S.basket.length && !S.keptFish.length) {
  S.keptFish = S.basket.map(f => ({ fishId: f.fishId, name: f.name, weight: f.weight, price: f.price }));
}
S.basket = [];
// Tương thích save cũ: thể lực mặc định đầy, timestamp hồi phục = bây giờ
if (S.stamina == null) S.stamina = STAMINA.max;
if (!S.staminaTs) S.staminaTs = Date.now();
// Di trú kho đồ + túi đi câu (cần: string[] -> [{iid,id,cond}]; giun/cam/food -> store)
migrateStoreBag();
regenStamina(); // hồi thể lực theo thời gian thực kể từ lần chơi trước
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
/* ---------- Kho ở nhà + Túi đi câu + Độ bền cần ---------- */
function migrateStoreBag() {
  // Kho: store = { rods: [{iid,id,cond}], giun, cam, food: {} }
  if (!S.store || !Array.isArray(S.store.rods)) {
    const oldRods = Array.isArray(S.rods) ? S.rods : ['tre'];
    S.store = {
      rods: oldRods.map((id, i) => ({ iid: 'r' + (i + 1), id: String(id), cond: 100 })),
      giun: S.giun || 0, cam: S.cam || 0,
      food: (S.food && typeof S.food === 'object') ? S.food : {},
    };
    S.rodSeq = oldRods.length + 1;
  }
  // Vá cond cho save dở dang
  S.store.rods.forEach(r => { if (r.cond == null) r.cond = 100; });
  // Túi: bag = { rods: [iid], activeRod: iid, giun, cam, food: {} }
  if (!S.bag || !Array.isArray(S.bag.rods)) {
    const rids = S.store.rods.slice(0, BAG_CAPS.rods).map(r => r.iid);
    S.bag = { rods: rids, activeRod: rids[0] || null,
      giun: Math.min(BAG_CAPS.giun, S.store.giun),
      cam: Math.min(BAG_CAPS.camGoi * CAM_PACK, S.store.cam), food: {} };
    for (const f of FOODS) S.bag.food[f.id] = Math.min(BAG_CAPS.foodEach, (S.store.food[f.id] || 0));
    S.store.giun -= S.bag.giun; S.store.cam -= S.bag.cam;
    for (const f of FOODS) S.store.food[f.id] = (S.store.food[f.id] || 0) - S.bag.food[f.id];
  }
  // Dọn field cũ (đã chuyển vào store)
  delete S.rods; delete S.rod; delete S.giun; delete S.cam; delete S.food;
  // Trụ 2: vá mồi cao cấp cho save cũ (không mất đồ đang có)
  ['moiU', 'deChui', 'lure'].forEach(k => {
    if (S.store[k] == null) S.store[k] = 0;
    if (S.bag[k] == null) S.bag[k] = 0;
  });
  save();
}
function rodInst(iid) { return (S.store.rods || []).find(r => r.iid === iid); }
function activeRodInst() {
  return rodInst(S.bag && S.bag.activeRod) || S.store.rods[0] || { iid: null, id: 'tre', cond: 100 };
}
function rodDef(id) { return RODS.find(r => r.id === id) || RODS[0]; }
function rod() { return rodDef(activeRodInst().id); }
function rodName(inst) { return rodDef(inst.id).name; }
// Kho đồ đang dùng: lúc đi câu = túi, ở nhà = kho
function inv() { return isFishing() ? S.bag : S.store; }
function repairCost(def, cond) {
  if (def.id === 'tre') return 0;
  return Math.round(def.price * (100 - cond) / 100 * 0.3);
}
function condColor(c) { return c > 50 ? '#66bb6a' : (c > 25 ? '#ffa726' : '#e53935'); }
function condBar(c, w) {
  return '<span class="condbar"' + (w ? ' style="width:' + w + 'px"' : '') + '><i style="width:' +
    Math.max(0, Math.round(c)) + '%;background:' + condColor(c) + '"></i></span>';
}
// Hao mòn cần đang cầm
function wearRod(n) {
  const inst = activeRodInst();
  if (!inst || !inst.iid) return;
  inst.cond = Math.max(0, (inst.cond == null ? 100 : inst.cond) - n);
  save(); updateHUD();
  if (inst.cond <= 25 && !rodWarned) {
    rodWarned = true; Sfx.fail();
    toast('⚠️ ' + rodName(inst) + ' sắp hỏng! (' + Math.round(inst.cond) + '%) — về sửa hoặc mang cần dự phòng.');
  }
}
// true = vừa gãy (caller dừng hành động hiện tại)
function checkRodBreak(ctx) {
  const inst = activeRodInst();
  if (inst && inst.iid && (inst.cond == null ? 100 : inst.cond) <= 0) { breakRod(ctx); return true; }
  return false;
}
function breakRod(ctx) {
  const inst = activeRodInst(), def = rodDef(inst.id);
  S.store.rods = S.store.rods.filter(r => r.iid !== inst.iid);
  S.bag.rods = S.bag.rods.filter(i => i !== inst.iid);
  Sfx.fail();
  if (inst.id === 'tre') {
    const ni = { iid: 'r' + (S.rodSeq++), id: 'tre', cond: 100 };
    S.store.rods.unshift(ni); S.bag.rods.unshift(ni.iid); S.bag.activeRod = ni.iid;
    save(); updateHUD(); renderPrepareSafe();
    toast('💥 Cần tre gãy rồi! Bố thương, cho cây tre mới tinh 🥰' + (ctx === 'fight' ? ' Cá xổng mất...' : ''));
    return;
  }
  save();
  if (S.bag.rods.length) {
    S.bag.activeRod = S.bag.rods[0]; save(); updateHUD();
    toast('💥 GÃY CẦN ' + def.name + '! May có cần dự phòng trong túi 🎒' + (ctx === 'fight' ? ' Cá xổng mất...' : ''));
  } else {
    updateHUD();
    toast('💥 GÃY CẦN ' + def.name + '! Hết cần dự phòng — về nhà thôi...');
    setTimeout(() => { if (isFishing()) { returnBagToStore(); enterPrepare(); } }, 2000);
  }
}
// Đổi cần đang cầm (khi mang 2 cần)
function switchRod() {
  if (S.bag.rods.length < 2) return;
  const i = S.bag.rods.indexOf(S.bag.activeRod);
  S.bag.activeRod = S.bag.rods[(i + 1) % S.bag.rods.length];
  save(); updateHUD(); Sfx.click();
  toast('🎣 Đã chuyển sang ' + rod().name + '.');
}
// Đóng/mở cần trong túi (tối đa BAG_CAPS.rods)
function packRod(iid) { // true: đổi túi thành công, false: bị chặn
  const b = S.bag, ix = b.rods.indexOf(iid);
  if (ix >= 0) {
    if (b.rods.length <= 1) { toast('Phải mang theo ít nhất 1 cần!'); Sfx.fail(); return false; }
    b.rods.splice(ix, 1);
    if (b.activeRod === iid) b.activeRod = b.rods[0];
  } else {
    if (b.rods.length >= BAG_CAPS.rods) { toast('🎒 Túi chỉ đựng được ' + BAG_CAPS.rods + ' cần! (túi 2 ngăn)'); Sfx.fail(); return false; }
    b.rods.push(iid);
    if (!b.activeRod) b.activeRod = iid;
  }
  save(); Sfx.click(); renderPrepare();
  return true;
}
// Stepper mồi/đồ ăn trong túi (giới hạn nắp túi + tồn kho)
function bagStep(kind, d) { // kind: 'giun' (±1) | 'camGoi' (±1 gói = CAM_PACK viên)
  if (kind === 'giun') {
    const cur = S.bag.giun || 0, avail = (S.store.giun || 0) + cur;
    const nv = Math.max(0, Math.min(BAG_CAPS.giun, avail, cur + d));
    S.bag.giun = nv; S.store.giun -= (nv - cur);
  } else if (kind === 'camGoi') {
    const cur = S.bag.cam || 0, avail = (S.store.cam || 0) + cur;
    const nv = Math.max(0, Math.min(BAG_CAPS.camGoi * CAM_PACK, avail, cur + d * CAM_PACK));
    S.bag.cam = nv; S.store.cam -= (nv - cur);
  } else { // Trụ 2: 'moiU' | 'deChui' | 'lure' (±1 đơn vị)
    const cur = S.bag[kind] || 0, avail = (S.store[kind] || 0) + cur;
    const nv = Math.max(0, Math.min(BAG_CAPS[kind], avail, cur + d));
    S.bag[kind] = nv; S.store[kind] = (S.store[kind] || 0) - (nv - cur);
  }
  save(); Sfx.click(); renderPrepare();
}
function bagFoodStep(id, d) {
  S.bag.food = S.bag.food || {}; S.store.food = S.store.food || {};
  const cur = S.bag.food[id] || 0, avail = (S.store.food[id] || 0) + cur;
  const nv = Math.max(0, Math.min(BAG_CAPS.foodEach, avail, cur + d));
  S.bag.food[id] = nv; S.store.food[id] = (S.store.food[id] || 0) - (nv - cur);
  save(); Sfx.click(); renderPrepare();
}
function bagStepper(kind, icon, name, bq, bmax, unit, storeQ) {
  return '<div class="card"><div class="card-title">' + icon + ' ' + name + '</div>' +
    '<div class="bag-step"><button class="btn small" data-act="bagstep" data-kind="' + kind + '" data-d="-1">−</button>' +
    '<b>' + bq + ' ' + unit + '</b>' +
    '<button class="btn small" data-act="bagstep" data-kind="' + kind + '" data-d="1">+</button></div>' +
    '<div class="card-desc">Tối đa ' + bmax + ' ' + unit + ' · Kho còn ' + storeQ + '</div></div>';
}
// Về nhà: đồ thừa trong túi trả về kho
function returnBagToStore() {
  S.store.giun += S.bag.giun || 0; S.bag.giun = 0;
  S.store.cam += S.bag.cam || 0; S.bag.cam = 0;
  ['moiU', 'deChui', 'lure'].forEach(k => { // Trụ 2: mồi cao cấp
    S.store[k] = (S.store[k] || 0) + (S.bag[k] || 0); S.bag[k] = 0;
  });
  S.store.food = S.store.food || {}; S.bag.food = S.bag.food || {};
  for (const f of FOODS) { S.store.food[f.id] = (S.store.food[f.id] || 0) + (S.bag.food[f.id] || 0); S.bag.food[f.id] = 0; }
  save();
}
function renderPrepareSafe() { try { if (phase === 'PREPARE') renderPrepare(); } catch (e) {} }
/* ---------- Hệ thống đồ đựng cá (mode Trốn vợ) ---------- */
function contDef() { return containerById(S.activeContainer); }
function keptCount() { return (S.keptFish || []).length; }
function keptValue() { return (S.keptFish || []).reduce((a, f) => a + (f.price || 0), 0); }
// Tổng kg đang giữ + tỉ lệ tải (theo KG — luật mới). contFull cũ theo số con đã bỏ.
function keptKg() { return (S.keptFish || []).reduce((a, f) => a + (f.weight || 0), 0); }
function contLoad() { return contLoadKg(keptKg(), contDef().cap); }
// Vị trí vẽ + vùng chạm của đồ đựng (khớp Art.drawContainer)
function containerPos() {
  const c = contDef();
  if (c.place === 'water') return L.portrait ? { x: 455, y: 250, r: 46 } : { x: 830, y: 250, r: 46 };
  return L.portrait ? { x: 400, y: 890, r: 40 } : { x: 690, y: 512, r: 40 };
}
// Cấp cần thủ: floor(tổng cá đã câu / 10) + 1, tối đa 15
function level() { return Math.min(15, Math.floor((S.totalFish || 0) / 10) + 1); }

/* ---------- Thanh thể lực ---------- */
let stamWarned = false;  // cảnh báo thể lực thấp 1 lần mỗi chuyến
let rodWarned = false;   // cảnh báo cần sắp hỏng 1 lần mỗi chuyến
let stamRegenT = 0;
let ambT = 0; // đếm giờ cập nhật ambient theo mood
// Hồi phục theo thời gian thực: +1 mỗi STAMINA.regenSec giây, tối đa STAMINA.max.
// Tính từ staminaTs (lần cập nhật cuối) nên thoát game quay lại vẫn được hồi.
function regenStamina() {
  const now = Date.now();
  if (!S.staminaTs) S.staminaTs = now;
  const cur = S.stamina == null ? STAMINA.max : S.stamina;
  if (cur >= STAMINA.max) { S.staminaTs = now; return; }
  const elapsed = now - S.staminaTs;
  if (elapsed >= STAMINA.regenSec * 1000) {
    const add = Math.floor(elapsed / (STAMINA.regenSec * 1000));
    S.stamina = Math.min(STAMINA.max, cur + add);
    S.staminaTs += add * STAMINA.regenSec * 1000;
    save(); updateHUD();
  }
}
// Trừ n thể lực. Trả false nếu đã hết (=0) — caller tự toast + chặn hành động.
function drainStamina(n) {
  regenStamina();
  if ((S.stamina || 0) <= 0) return false;
  S.stamina = Math.max(0, (S.stamina || 0) - n);
  if (!S.staminaTs) S.staminaTs = Date.now();
  save(); updateHUD();
  checkStamWarn();
  return true;
}
function checkStamWarn() {
  if ((S.stamina || 0) <= STAMINA.warnAt && !stamWarned && (isFishing() || phase === 'DIG')) {
    stamWarned = true;
    toast('⚠️ Thể lực thấp! Về nhà nghỉ ngơi kẻo kiệt sức...');
    Sfx.fail();
  }
}
function stamFillColor(v) { return v > 50 ? '#66bb6a' : (v > STAMINA.warnAt ? '#ffca28' : '#ef5350'); }
function mapUnlocked(id) {
  if (id === 'ao') return true;
  if (id === 'song') return S.wifeApproved || (S.caughtAo || 0) >= 15 || level() >= 2;
  if (id === 'dampha') return level() >= 6 || (S.caughtSong || 0) >= 25;
  return false;
}
Sfx.muted = !!S.muted;

/* ---------- Đợt 2: Trốn vợ — helpers ---------- */
function addSuspicion(n, why) {
  S.suspicion = clamp((S.suspicion || 0) + n, 0, WIFE.maxSuspicion);
  if (why) toast((n > 0 ? '😒 +' : '😒 ') + n + ' nghi ngờ — ' + why);
  save(); updateHUD();
  checkBan();
}
function addTitle(t) {
  if (!S.titles.includes(t)) { S.titles.push(t); save(); toast('🏅 Danh hiệu mới: ' + t + '!'); }
}
function banned() { return S.banUntil && todayStr() <= S.banUntil; }
function banDaysLeft() {
  if (!banned()) return 0;
  const a = todayStr().split('-').map(Number), b = S.banUntil.split('-').map(Number);
  const ms = new Date(b[0], b[1] - 1, b[2]) - new Date(a[0], a[1] - 1, a[2]);
  return Math.max(1, Math.round(ms / 864e5) + 1);
}
function checkBan() {
  if ((S.suspicion || 0) >= 80 && !banned()) {
    S.banUntil = addDaysStr(todayStr(), WIFE.banDays);
    save();
    toast('🚫 Vợ phát hiện! BỊ CẤM CÂU ' + WIFE.banDays + ' ngày!');
    Sfx.fail();
  }
}
function buffActive() { return S.buffUntil && Date.now() < S.buffUntil; }
function mondayStr(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.getFullYear() + '-' + (x.getMonth() + 1) + '-' + x.getDate();
}
// Nhiệm vụ tuần: "Cuối tuần ở nhà với vợ" — đánh giá vào đầu tuần (T2–T4)
function ensureWeekly() {
  const now = new Date(), dow = now.getDay(), w = mondayStr(now);
  if (S.weekEval === w) return;
  if (dow >= 1 && dow <= 3) {
    const satStr = addDaysStr(todayStr(), -((dow + 1) % 7));
    const sunStr = addDaysStr(todayStr(), -(dow % 7 === 0 ? 7 : dow));
    const clean = !(S.weekEntries[satStr] || S.weekEntries[sunStr]);
    if (clean) {
      S.suspicion = 20;
      S.wifeApproved = true;
      addTitle('Chồng quốc dân');
      setTimeout(() => toast('📅 Cuối tuần ở nhà ngoan! Vợ duyệt: nghi ngờ về 20, mở khóa Sông quê! 🎉'), 800);
    }
    S.weekEval = w; save();
  }
  // Dọn entries cũ hơn 21 ngày
  const cut = addDaysStr(todayStr(), -21);
  Object.keys(S.weekEntries).forEach(k => { if (k < cut) delete S.weekEntries[k]; });
}
function fmtClock(mins) {
  const h = Math.floor(mins / 60) % 24, m = Math.floor(mins % 60);
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

/* ---------- Thủy triều ở đầm phá (Trụ 2) ----------
   Chu kỳ ~6h giờ game (1m thực = 15m game → 0.25 phút game/giây thực).
   Nước lớn: cá cắn mạnh hơn (+25%, trừ cua biển). Nước ròng: cắn kém (−20%)
   nhưng cua biển +15% và dễ gặp hơn. */
function gameMinNow() {
  if (S.mode === 'wife' && trip) return trip.gameMin;
  return Date.now() / 4000;
}
// → { phase: 'len'|'dung'|'rong', name, icon, bite: hệ số nhân wait, level: 0..1 mực nước }
function tideState() {
  const c = (((gameMinNow() % 360) + 360) % 360); // 360 phút game / chu kỳ
  if (c < 140) return { phase: 'len',  name: 'Nước lớn',  icon: '🌊', bite: 0.8, level: c / 140 };
  if (c < 180) return { phase: 'dung', name: 'Nước đứng', icon: '🌀', bite: 1,   level: 1 };
  if (c < 320) return { phase: 'rong', name: 'Nước ròng', icon: '🏖️', bite: 1.2,  level: 1 - (c - 180) / 140 };
  return { phase: 'dung', name: 'Nước đứng', icon: '🌀', bite: 1, level: 0 };
}
/* ---------- Trạng thái game ---------- */
let phase = 'MENU';           // MENU PREPARE SHOP HELP DIG CAST WAIT BITE STRIKE FIGHT RESULT
let tG = 0, lastTs = 0;       // thời gian toàn cục
let fx = 0, fy = 0;           // vị trí phao
let waitT = 0;                // đếm ngược chờ cắn
let fish = null, biteT = 0;   // cá đang cắn
let strike = null;            // {pos, dur, zc, zw}
let fight = null;             // {tension, prog, zt, amp, speed, zw, zc, surge, fill, breakT, slackT, surgeT}
let holding = false;          // đang giữ để bo cá
let splashes = [];            // hạt nước (vòng tròn lan)
let ripples = [];             // gợn sóng lan rộng (ellipse trên mặt nước)
let drops = [];               // giọt nước bắn lên, có trọng lực (tối đa 80)
// Bắn giọt nước tại (x,y): n giọt, vận tốc ngang ±spread, vy lên -260..-60
function spawnDrops(x, y, n, spread) {
  for (let i = 0; i < n; i++) {
    if (drops.length >= 80) drops.shift();
    drops.push({ x: x + rnd(-8, 8), y: y, vx: rnd(-spread, spread), vy: rnd(-260, -60),
                 r: rnd(1.6, 3.4), life: rnd(0.35, 0.7), a: 0.9 });
  }
}
let hint = null;              // chữ gợi ý trên canvas
let lastPrice = 0, lastWeight = 0;
let toastTimer = null;
let spot = null;              // điểm câu sông quê đang chọn (object RIVER_SPOTS)
let session = { weather: 'nang', golden: false }; // thời tiết & giờ vàng của phiên câu
let trip = null;              // Đợt 2: chuyến "trốn vợ" — {gameMin, deadline, elapsed, callAt, willCall, called, resumePhase}
let homeConfirmT = 0;         // đếm ngược xác nhận "về nhà" khi quá giờ
let riskT = 0, overWarned = false, contShakeT = 0; // rủi ro đồ đựng: roll định kỳ, cảnh báo quá tải, rung rọng
let lastClockMin = -1;        // phút game đã hiển thị trên HUD (tránh ghi DOM mỗi frame)
let lastTidePhase = '';         // pha thủy triều đã hiển thị (đầm phá)

/* ---------- DOM helper ---------- */
const screens = ['scr-menu', 'scr-prepare', 'scr-shop', 'scr-help', 'scr-dig', 'pop-result', 'scr-map', 'scr-quest',
  'scr-call', 'scr-wifehome', 'scr-kitchen', 'scr-leaderboard', 'scr-name', 'scr-container', 'scr-food'];
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
  $('hud-map').textContent = S.map === 'dampha' ? '🦀 Đầm phá' : mapName(S.map);
  const w = $('hud-weather');
  if (isFishing()) {
    w.classList.remove('hidden');
    w.textContent = (session.weather === 'mua' ? '🌧️ Vừa mưa' : '☀️ Nắng') + (session.golden ? ' ⚡ Giờ vàng' : '');
  } else w.classList.add('hidden');
  // Chip thủy triều (chỉ ở đầm phá lúc đang câu)
  const td = $('hud-tide');
  if (isFishing() && S.map === 'dampha') {
    td.classList.remove('hidden');
    const ts = tideState();
    td.textContent = ts.icon + ' ' + ts.name;
  } else td.classList.add('hidden');
  $('hud-giun').textContent = '🪱 ' + inv().giun;
  $('hud-cam').textContent = '🟤 ' + (inv().cam || 0);
  (function () {
    const inst = activeRodInst(), c = inst.cond == null ? 100 : inst.cond;
    $('hud-rod').innerHTML = '🎣 ' + rod().name + ' ' + condBar(c, 44);
  })();
  $('btn-rod-switch').classList.toggle('hidden', !(isFishing() && S.bag.rods.length > 1));
  // Thanh thể lực (lúc đi câu, đào giun, ở nhà)
  regenStamina();
  const sv = Math.round(S.stamina == null ? STAMINA.max : S.stamina);
  const scol = stamFillColor(sv);
  $('hud-stam-n').textContent = sv;
  const sfill = $('hud-stam-fill');
  sfill.style.width = sv + '%'; sfill.style.background = scol;
  $('hud-stamina').classList.toggle('hot', sv <= STAMINA.warnAt);
  const dstam = $('dig-stam'); if (dstam) dstam.textContent = sv;
  const mstam = $('menu-stam');
  if (mstam) {
    mstam.textContent = sv;
    const mf = $('menu-stam-fill'); if (mf) { mf.style.width = sv + '%'; mf.style.background = scol; }
  }
  const wstam = $('wh-stam');
  if (wstam) {
    wstam.textContent = sv;
    const wf = $('wh-stam-fill'); if (wf) { wf.style.width = sv + '%'; wf.style.background = scol; }
  }
  // Đợt 2: HUD mode Trốn vợ
  const wife = S.mode === 'wife' && (trip || isFishing());
  $('hud-clock').classList.toggle('hidden', !wife);
  $('hud-susp').classList.toggle('hidden', !wife);
  if (wife && trip) {
    $('hud-clock').textContent = '🕐 ' + fmtClock(trip.gameMin);
    lastClockMin = Math.floor(trip.gameMin);
    const sp = $('hud-susp');
    sp.textContent = '😒 ' + (S.suspicion || 0);
    sp.classList.toggle('hot', (S.suspicion || 0) >= 60);
  }
  $('hud-buff').classList.toggle('hidden', !buffActive());
  // Đồ đựng cá (mode Trốn vợ, khi đang đi câu)
  const hc = $('hud-container');
  const showCont = S.mode === 'wife' && (trip || isFishing());
  hc.classList.toggle('hidden', !showCont);
  if (showCont) {
    hc.innerHTML = contDef().icon + ' ' + keptKg().toFixed(1) + '/' + contDef().cap + 'kg';
    hc.classList.toggle('hot', contLoad() > 1);
  }
  $('menu-money').textContent = fmt(S.money);
  $('menu-level').textContent = 'Cấp ' + level();
  // Dòng trạng thái vợ con trên menu
  const wl = $('menu-wife-line');
  wl.classList.remove('hidden');
  $('menu-susp').textContent = S.suspicion || 0;
  $('menu-happy').textContent = S.happiness || 0;
  $('menu-sincere').textContent = S.sincerity || 0;
  // Cấm câu
  const bn = $('ban-notice'), wb = $('btn-to-wife'), pd = $('btn-pardon');
  if (banned()) {
    bn.classList.remove('hidden');
    bn.textContent = '🚫 BỊ CẤM CÂU — còn ' + banDaysLeft() + ' ngày! Vợ đang giận, đừng dại mà đi lén...';
    wb.disabled = true;
    pd.classList.toggle('hidden', (S.sincerity || 0) < 5);
    renderBribe();
  } else {
    bn.classList.add('hidden');
    wb.disabled = false;
    pd.classList.add('hidden');
    $('bribe-panel').classList.add('hidden');
  }
  updateQuestBadge();
}

/* ---------- Màn hình ---------- */
function enterMenu() { phase = 'MENU'; trip = null; S.mode = S.mode || 'free'; show('scr-menu'); ensureDailyQuests(); ensureWeekly(); updateHUD(); }
function enterHelp() { phase = 'HELP'; show('scr-help'); }
function enterShop() { phase = 'SHOP'; show('scr-shop'); renderShop(); }

/* ---------- Đợt 2: Chọn chế độ & bắt đầu chuyến trốn vợ ---------- */
function startWifeTrip() {
  if (banned()) { toast('🚫 Đang bị cấm câu! Còn ' + banDaysLeft() + ' ngày.'); Sfx.fail(); return; }
  S.mode = 'wife';
  trip = {
    gameMin: WIFE.startHour * 60,
    deadline: Math.round(rnd(WIFE.deadlineMin, WIFE.deadlineMax) / 30) * 30,
    elapsed: 0, willCall: Math.random() < 0.6, called: false,
    callAt: rnd(120, 360), resumePhase: null,
  };
  S.keptFish = []; // đầu chuyến: đồ đựng trống
  riskT = 0; overWarned = false; contShakeT = 0; stamWarned = false; rodWarned = false;
  if (!S.containers.includes(S.activeContainer)) S.activeContainer = S.containers[S.containers.length - 1];
  S.weekEntries[todayStr()] = true;
  save();
  const h = new Date().getHours();
  setTimeout(() => {
    toast('😎 Chuyến đi bắt đầu! Vợ dặn: về trước ' + fmtClock(trip.deadline) + ' đấy!');
  }, 300);
  if (h >= 21 || h < 4) {
    setTimeout(() => addSuspicion(10, 'đi câu giờ lạ thế này?!'), 1400);
  }
  setTimeout(() => toast('Nhấn 🏠 trên thanh trạng thái để về nhà bất cứ lúc nào!'), 2600);
  enterPrepare();
}

/* ---------- Chọn map ---------- */
function renderMapSelect() {
  $('map-list').innerHTML = MAPS.map(m => {
    const un = mapUnlocked(m.id);
    return '<div class="card map-card' + (un ? '' : ' locked') + '" data-map="' + m.id + '">' +
      '<span class="map-icon">' + (un ? m.icon : '🔒') + '</span>' +
      '<div class="card-title">' + m.name + '</div>' +
      '<div class="card-desc">' + m.desc + '</div>' +
      (un ? '' : '<div class="lock-line">' + mapLockText(m.id) + '</div>') +
      '</div>';
  }).join('');
}
function enterMapSelect() { phase = 'MAP'; show('scr-map'); renderMapSelect(); }

/* ---------- Vào phiên câu ---------- */
function enterFish(mapId) {
  S.map = mapId; spot = null; save();
  stamWarned = false; rodWarned = false;
  // Thời tiết ngẫu nhiên mỗi phiên: 25% vừa mưa xong → cá ăn mạnh
  session.weather = Math.random() < 0.25 ? 'mua' : 'nang';
  session.golden = isGoldenHour();
  if (session.weather === 'mua') setTimeout(() => toast('🌧️ Trời vừa tạnh mưa — cá đang ăn mạnh!'), 600);
  if (session.golden) setTimeout(() => toast('⚡ Giờ vàng câu cá! Tỉ lệ cắn tăng.'), 1400);
  if (mapId === 'song' || mapId === 'dampha') {
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
  if (r.cam) S.store.cam += r.cam;
  if (r.giun) S.store.giun += r.giun;
  it.claimed = true; save();
  Sfx.sell(); toast('🎁 Nhận thưởng: ' + questRewardText(questDef(qid)) + '!');
  renderQuests(); updateHUD();
}

function statBar(lbl, v) {
  return '<div class="stat"><span class="lbl">' + lbl + '</span><div class="bar"><i style="width:' +
    Math.round(v * 100) + '%"></i></div></div>';
}

function rodCard(r, forShop) {
  const insts = S.store.rods.filter(x => x.id === r.id);
  const owned = insts.length > 0;
  const locked = level() < (r.reqLevel || 1);
  const typeTag = r.type === 'may' ? ' <span class="count">[máy]</span>' : ' <span class="count">[đài]</span>';
  let btn, extra = '';
  if (locked) btn = '<button class="btn small" disabled>🔒 Cấp ' + r.reqLevel + ' mở khóa</button>';
  else if (!owned) btn = '<button class="btn small" data-act="buyrod" data-id="' + r.id + '"' +
    (S.money < r.price ? ' disabled' : '') + '>Mua ' + fmt(r.price) + '</button>';
  else {
    const worst = insts.reduce((a, b) => (a.cond < b.cond ? a : b));
    const wc = Math.round(worst.cond), cost = repairCost(r, worst.cond);
    extra = '<div class="stat"><span class="lbl">Tình trạng</span><div class="bar"><i style="width:' + wc +
      '%;background:' + condColor(worst.cond) + '"></i></div></div>' +
      '<div class="card-desc">Đang có ' + insts.length + ' cây — cây mòn nhất còn ' + wc + '%.</div>';
    btn = cost > 0
      ? '<button class="btn small" data-act="repairrod" data-id="' + r.id + '"' +
        (S.money < cost ? ' disabled' : '') + '>🔧 Sửa ' + fmt(cost) + '</button>'
      : '<button class="btn small" disabled>✨ Mới tinh</button>';
  }
  return '<div class="card' + (owned ? ' owned' : '') + '">' +
    '<div class="card-title">🎣 ' + r.name + typeTag + '</div>' +
    '<div class="card-desc spec-line">' + r.spec + '</div>' +
    statBar('Tầm quăng', r.cast) + statBar('Độ nhạy', r.sense) + statBar('Sức chịu', r.line) +
    '<div class="card-desc">' + r.desc + '</div>' + extra + btn +
    (forShop ? '<br><a href="#" class="aff-link" data-item="' + r.name + '">🛒 Mua ngoài đời</a>' : '') + '</div>';
}

function renderPrepare() {
  $('prep-money').textContent = '💰 ' + fmt(S.money);
  // --- Túi đi câu: chạm thẻ cần để cho vào / bỏ ra (tối đa 2) ---
  $('bag-rods').innerHTML = S.store.rods.map(inst => {
    const r = rodDef(inst.id), packed = S.bag.rods.includes(inst.iid);
    const active = S.bag.activeRod === inst.iid, c = Math.round(inst.cond == null ? 100 : inst.cond);
    return '<div class="card' + (packed ? ' selected' : '') + '" data-act="packrod" data-id="' + inst.iid + '">' +
      '<div class="card-title">🎣 ' + r.name +
      (active ? ' <span class="count">đang cầm</span>' : '') + (packed && !active ? ' <span class="count">🎒 dự phòng</span>' : '') + '</div>' +
      '<div class="card-desc spec-line">' + r.spec + '</div>' +
      '<div class="stat"><span class="lbl">Tình trạng</span><div class="bar"><i style="width:' + c +
      '%;background:' + condColor(inst.cond) + '"></i></div></div>' +
      '<div class="card-desc">' + (packed ? 'Chạm để bỏ ra khỏi túi' : 'Chạm để cho vào túi') + '</div></div>';
  }).join('') || '<p class="kept-empty">Chưa có cần nào!</p>';
  // --- Túi: mồi & đồ ăn (chỉ hiện món đang sở hữu, chưa có thì ẩn) ---
  const camGoiBag = Math.floor((S.bag.cam || 0) / CAM_PACK);
  const camGoiMax = Math.min(BAG_CAPS.camGoi, Math.floor(((S.store.cam || 0) + (S.bag.cam || 0)) / CAM_PACK));
  const giunHas = (S.store.giun || 0) + (S.bag.giun || 0) > 0;
  const camHas = (S.store.cam || 0) + (S.bag.cam || 0) > 0;
  let items = '';
  if (giunHas) items += bagStepper('giun', '🪱', 'Giun đất', S.bag.giun || 0,
    Math.min(BAG_CAPS.giun, (S.store.giun || 0) + (S.bag.giun || 0)), 'con', (S.store.giun || 0) + ' con');
  if (camHas) items += bagStepper('camGoi', '🟤', 'Cám câu', camGoiBag, camGoiMax, 'gói', Math.floor((S.store.cam || 0) / CAM_PACK) + ' gói');
  // Trụ 2: mồi cao cấp trong túi (chỉ hiện món đang sở hữu)
  const premBag = [
    { key: 'moiU',   icon: '🧪', name: 'Mồi ủ lên men',  unit: 'gói' },
    { key: 'deChui', icon: '🦗', name: 'Dế chũi',        unit: 'con' },
    { key: 'lure',   icon: '🐟', name: 'Mồi giả (lure)', unit: 'cái' },
  ];
  for (const p of premBag) {
    if ((S.store[p.key] || 0) + (S.bag[p.key] || 0) <= 0) continue;
    const bq = S.bag[p.key] || 0, sq = S.store[p.key] || 0;
    const mx = Math.min(BAG_CAPS[p.key], sq + bq);
    items += bagStepper(p.key, p.icon, p.name, bq, mx, p.unit, sq + ' ' + p.unit);
  }
  for (const f of FOODS) {
    const bq = (S.bag.food || {})[f.id] || 0;
    const sq = ((S.store.food || {})[f.id] || 0);
    if (sq + bq <= 0) continue; // chưa sở hữu thì ẩn
    const mx = Math.min(BAG_CAPS.foodEach, sq + bq);
    items += '<div class="card"><div class="card-title">' + f.icon + ' ' + f.name + '</div>' +
      '<div class="bag-step"><button class="btn small" data-act="bagfoodstep" data-id="' + f.id + '" data-d="-1">−</button>' +
      '<b>' + bq + ' cái</b>' +
      '<button class="btn small" data-act="bagfoodstep" data-id="' + f.id + '" data-d="1">+</button></div>' +
      '<div class="card-desc">Tối đa ' + mx + ' cái · Kho còn ' + sq + '</div></div>';
  }
  if (!items) items = '<p class="kept-empty">🎒 Chưa có mồi/đồ ăn nào — đi đào giun hoặc vào Cửa hàng mua nhé!</p>';
  $('bag-items').innerHTML = items;
  // --- Kho ở nhà (chỉ liệt kê món đang có) ---
  const sp = [];
  if ((S.store.giun || 0) > 0) sp.push('🪱 Giun: <b>' + S.store.giun + '</b> con');
  if ((S.store.cam || 0) > 0) sp.push('🟤 Cám: <b>' + S.store.cam + '</b> viên');
  if ((S.store.moiU || 0) > 0) sp.push('🧪 Mồi ủ: <b>' + S.store.moiU + '</b> gói');
  if ((S.store.deChui || 0) > 0) sp.push('🦗 Dế chũi: <b>' + S.store.deChui + '</b> con');
  if ((S.store.lure || 0) > 0) sp.push('🐟 Lure: <b>' + S.store.lure + '</b> cái');
  for (const f of FOODS) { const q = ((S.store.food || {})[f.id] || 0); if (q > 0) sp.push(f.icon + ' ' + f.name + ': <b>' + q + '</b>'); }
  if (S.store.rods.length > 0) sp.push('🎣 Cần: <b>' + S.store.rods.length + '</b> cây');
  $('store-summary').innerHTML = sp.length ? sp.join(' · ') : 'Kho trống trơn — vào Cửa hàng sắm đồ đi câu nào! 🎣';
  // --- Mồi đang chọn (lấy trong túi) ---
  // Lure cần cần máy: nếu đang chọn lure mà không còn cần máy trong túi → về giun
  if (!baitUsable(S.bait)) { S.bait = 'giun'; save(); }
  $('bait-giun-count').textContent = 'x' + (S.bag.giun || 0);
  $('bait-cam-count').textContent = 'x' + (S.bag.cam || 0);
  $('bait-mou-count').textContent = 'x' + (S.bag.moiU || 0);
  $('bait-dechui-count').textContent = 'x' + (S.bag.deChui || 0);
  $('bait-lure-count').textContent = 'x' + (S.bag.lure || 0);
  $('cam-desc').textContent = fmt(CAM_PRICE) + ' / gói ' + CAM_PACK + ' viên — cá cắn nhanh hơn';
  $('btn-buy-cam-prep').textContent = 'Mua ' + fmt(CAM_PRICE);
  $('btn-buy-cam-prep').disabled = (S.money || 0) < CAM_PRICE;
  // Mồi cao cấp (Trụ 2)
  $('mou-desc').textContent = fmt(MOIU_PRICE) + ' / gói — cá ăn cám (chép, diêu hồng...) mê mồi ủ +40%';
  $('btn-buy-mou-prep').textContent = 'Mua ' + fmt(MOIU_PRICE);
  $('btn-buy-mou-prep').disabled = (S.money || 0) < MOIU_PRICE;
  $('dechui-desc').textContent = fmt(DECHUI_PRICE) + ' / con — cá săn mồi (trê, vược, chẽm...) +50%';
  $('btn-buy-dechui-prep').textContent = 'Mua ' + fmt(DECHUI_PRICE);
  $('btn-buy-dechui-prep').disabled = (S.money || 0) < DECHUI_PRICE;
  $('lure-desc').textContent = fmt(LURE_PRICE) + ' / cái — dùng MÃI không hao, chỉ cần máy. Cá săn mồi +35%';
  $('btn-buy-lure-prep').textContent = 'Mua ' + fmt(LURE_PRICE);
  $('btn-buy-lure-prep').disabled = (S.money || 0) < LURE_PRICE ||
    ((S.store.lure || 0) + (S.bag.lure || 0)) >= 1;
  ['giun', 'cam', 'moi-u', 'de-chui', 'lure'].forEach(b => {
    const card = $('card-' + (b === 'moi-u' ? 'mou' : (b === 'de-chui' ? 'dechui' : b)));
    if (card) card.classList.toggle('selected', S.bait === b);
  });
  const baitOk = hasBait(S.bait) && baitUsable(S.bait);
  const hasRod = S.bag.rods.length > 0;
  $('btn-go-fish').disabled = !baitOk || !hasRod;
  const hintEl = $('prep-nobait-hint');
  hintEl.classList.toggle('hidden', baitOk && hasRod);
  hintEl.textContent = !hasRod ? '⚠️ Chưa cho cần vào túi! Chạm thẻ cần ở trên.'
    : (!baitOk ? '⚠️ Hết mồi trong túi! Chỉnh số lượng ở trên hoặc đào thêm giun.' : '');
  $('btn-dig').textContent = digLabel();
  $('btn-dig').disabled = digsLeft() <= 0 || (S.stamina || 0) <= 0;
  // Đồ đựng cá (chỉ mode Trốn vợ): chọn trong số đã sở hữu
  const wifeMode = S.mode === 'wife';
  $('prep-cont-title').classList.toggle('hidden', !wifeMode);
  const cl = $('container-list');
  cl.classList.toggle('hidden', !wifeMode);
  if (wifeMode) {
    cl.innerHTML = S.containers.map(id => {
      const c = containerById(id), using = S.activeContainer === id;
      return '<div class="card' + (using ? ' selected' : '') + '" data-cont="' + id + '">' +
        '<span class="cont-icon">' + c.icon + '</span>' +
        '<div class="card-title">' + c.name + '</div>' +
        '<div class="card-desc">' + c.desc + (using ? '<br><b>Đang mang theo</b>' : '') + '</div></div>';
    }).join('');
  }
}
function enterPrepare() { phase = 'PREPARE'; show('scr-prepare'); renderPrepare(); }

function renderShop() {
  $('shop-money').textContent = '💰 ' + fmt(S.money);
  $('shop-rods').innerHTML = RODS.map(r => rodCard(r, true)).join('');
  $('shop-baits').innerHTML =
    '<div class="card"><div class="card-title">🟤 Cám câu <span class="count">x' + S.store.cam + '</span></div>' +
    '<div class="card-desc">' + fmt(CAM_PRICE) + ' / gói ' + CAM_PACK + ' viên — cá cắn nhanh hơn giun.</div>' +
    '<button class="btn small" data-act="buycam"' + (S.money < CAM_PRICE ? ' disabled' : '') + '>Mua ' + fmt(CAM_PRICE) + '</button>' +
    '<br><a href="#" class="aff-link" data-item="Cám câu">🛒 Mua ngoài đời</a></div>' +
    '<div class="card"><div class="card-title">🪱 Giun đất <span class="count">x' + S.store.giun + '</span></div>' +
    '<div class="card-desc">Miễn phí — tự tay đào mới có! Còn ' + digsLeft() + '/' + DIG.perDay + ' lượt hôm nay.</div>' +
    '<button class="btn small" data-act="dig"' + (digsLeft() <= 0 || (S.stamina || 0) <= 0 ? ' disabled' : '') + '>' + digLabel() + '</button></div>' +
    // Trụ 2: mồi cao cấp
    '<div class="card"><div class="card-title">🧪 Mồi ủ lên men <span class="count">x' + (S.store.moiU || 0) + '</span></div>' +
    '<div class="card-desc">' + fmt(MOIU_PRICE) + ' / gói — cá ăn cám (chép, diêu hồng, basa, tra...) cắn nhanh +40%.</div>' +
    '<button class="btn small" data-act="buymou"' + (S.money < MOIU_PRICE ? ' disabled' : '') + '>Mua ' + fmt(MOIU_PRICE) + '</button></div>' +
    '<div class="card"><div class="card-title">🦗 Dế chũi <span class="count">x' + (S.store.deChui || 0) + '</span></div>' +
    '<div class="card-desc">' + fmt(DECHUI_PRICE) + ' / con — mồi sống thơm nức, cá săn mồi (trê, lóc, vược, chẽm...) +50%.</div>' +
    '<button class="btn small" data-act="buydechui"' + (S.money < DECHUI_PRICE ? ' disabled' : '') + '>Mua ' + fmt(DECHUI_PRICE) + '</button></div>' +
    '<div class="card"><div class="card-title">🐟 Mồi giả (lure) <span class="count">x' + ((S.store.lure || 0) + (S.bag.lure || 0)) + '</span></div>' +
    '<div class="card-desc">' + fmt(LURE_PRICE) + ' / cái — dùng MÃI không hao! Chỉ dùng được với cần máy. Cá săn mồi +35%.</div>' +
    '<button class="btn small" data-act="buylure"' + (S.money < LURE_PRICE || ((S.store.lure || 0) + (S.bag.lure || 0)) >= 1 ? ' disabled' : '') + '>Mua ' + fmt(LURE_PRICE) + '</button></div>';
  // Đồ đựng cá (mode Trốn vợ) — xô ghẻ mặc định đã có
  $('shop-containers').innerHTML = CONTAINERS.filter(c => c.price > 0).map(c => {
    const owned = S.containers.includes(c.id);
    const btn = owned
      ? '<button class="btn small" disabled>Đã sở hữu ✓</button>'
      : '<button class="btn small" data-act="buycontainer" data-id="' + c.id + '"' +
        (S.money < c.price ? ' disabled' : '') + '>Mua ' + fmt(c.price) + '</button>';
    return '<div class="card' + (owned ? ' owned' : '') + '">' +
      '<span class="cont-icon">' + c.icon + '</span>' +
      '<div class="card-title">' + c.name + '</div>' +
      '<div class="card-desc">' + c.desc + '</div>' + btn + '</div>';
  }).join('');
  // 🍱 Thực phẩm: hồi thể lực ngay cả khi đang câu
  $('shop-food').innerHTML = FOODS.map(f => {
    const qty = ((S.store.food || {})[f.id]) || 0;
    return '<div class="card"><span class="cont-icon">' + f.icon + '</span>' +
      '<div class="card-title">' + f.name + ' <span class="count">x' + qty + '</span></div>' +
      '<div class="card-desc">+' + f.gain + ' ⚡ — ' + f.desc + '</div>' +
      '<button class="btn small" data-act="buyfood" data-id="' + f.id + '"' +
        (S.money < f.price ? ' disabled' : '') + '>Mua ' + fmt(f.price) + '</button></div>';
  }).join('');
}

/* ---------- Mini-game đào giun ---------- */
let digTimers = [];
// Số lượt đào còn lại trong ngày (giới hạn độ khó — giun không còn vô hạn)
function digsLeft() {
  const t = todayStr();
  if (!S.digDay || S.digDay.date !== t) S.digDay = { date: t, count: 0 };
  return Math.max(0, DIG.perDay - S.digDay.count);
}
function digLabel() { return '⛏️ Đào giun (' + digsLeft() + '/' + DIG.perDay + ')'; }
// --- Mini-game đào giun: vườn đất trên canvas (không còn lưới ô) ---
let digS = null;
function digSoilY() { return L.portrait ? 120 : 78; }
function digBucket() { return { x: L.W - 58, y: digSoilY() + 48 }; }
function makeDigDecor() {
  const W = L.W, H = L.H, sy = digSoilY(), R = Math.random;
  const d = { dots: [], pebbles: [], weeds: [], mounds: [] };
  for (let i = 0; i < 90; i++) d.dots.push({ x: 10 + R() * (W - 20), y: sy + 8 + R() * (H - sy - 16), r: 1 + R() * 2.2, l: R() < 0.5 });
  for (let i = 0; i < 7; i++) d.pebbles.push({ x: 20 + R() * (W - 40), y: sy + 30 + R() * (H - sy - 60), rx: 5 + R() * 7, ry: 4 + R() * 5 });
  for (let i = 0; i < 10; i++) d.weeds.push({ x: 16 + R() * (W - 32), y: sy + 24 + R() * (H - sy - 48), s: 0.7 + R() * 0.7 });
  for (let i = 0; i < 5; i++) d.mounds.push({ x: 30 + R() * (W - 60), y: sy + 40 + R() * (H - sy - 80), r: 10 + R() * 10 });
  return d;
}
function digSpawn() {
  if (!digS || phase !== 'DIG') return;
  const maxAge = DIG.activeMs / 1000;
  const active = digS.worms.filter(w => !w.caught && (tG - w.born) < maxAge);
  if (active.length >= 6) return;
  const W = L.W, H = L.H, sy = digSoilY();
  const yMax = H - (L.portrait ? 140 : 90);
  for (let k = 0; k < 8; k++) {
    const x = 36 + Math.random() * (W - 72);
    const y = sy + 56 + Math.random() * Math.max(40, yMax - sy - 56);
    if (x > W - 130 && y < sy + 120) continue; // tránh xô đựng
    if (active.every(w => Math.hypot(w.x - x, w.y - y) > 70)) {
      digS.worms.push({ x, y, born: tG, ph: Math.random() * 6.28, caught: false, fly: 0 });
      return;
    }
  }
}
function digTap(p) {
  if (!digS || phase !== 'DIG') return;
  if ((S.stamina || 0) <= 0) { toast('😮‍💨 Hết thể lực! Ăn gì đó hoặc nghỉ một lát...'); Sfx.fail(); return; }
  Sfx.init();
  const r = cv.getBoundingClientRect();
  const hitR = Math.max(46, 48 / (r.width / L.W)); // ≥48px vật lý
  const maxAge = DIG.activeMs / 1000;
  let best = null, bd = 1e9;
  for (const w of digS.worms) {
    if (w.caught) continue;
    const age = tG - w.born;
    if (age < 0.08 || age > maxAge) continue;
    const h = Art.wormHead(w, tG);
    const d = Math.hypot(p.x - h.x, p.y - h.y);
    if (d < hitR && d < bd) { bd = d; best = w; }
  }
  if (best) {
    best.caught = true; best.fly = tG;
    const got = DIG.minYield + Math.floor(Math.random() * (DIG.maxYield - DIG.minYield + 1));
    digS.dug += got; $('dig-count').textContent = digS.dug;
    digS.hoes.push({ x: p.x, y: p.y, t0: tG, dur: 0.38, struck: false });
    drainStamina(got); // mỗi con giun đào được −1 thể lực
    Sfx.dig();
  } else {
    digS.hoes.push({ x: p.x, y: p.y, t0: tG, dur: 0.38, struck: false });
    digS.marks.push({ x: p.x, y: p.y, t0: tG, dur: 0.7 });
    Sfx.click();
  }
}
function digUpdate(dt) {
  const s = digS; if (!s || phase !== 'DIG') return;
  const maxAge = DIG.activeMs / 1000;
  for (const h of s.hoes) {
    const p = (tG - h.t0) / h.dur;
    if (!h.struck && p >= 0.55) {
      h.struck = true;
      for (let i = 0; i < 10; i++) { // đất văng tung tóe
        const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 160;
        s.parts.push({
          x: h.x, y: h.y, vx: Math.cos(a) * sp, vy: -80 - Math.random() * 160,
          life: 0, max: 0.5 + Math.random() * 0.3, sz: 2.5 + Math.random() * 3.5,
          rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 12,
          c: ['#8d6e63', '#6d4c41', '#a1887f'][i % 3],
        });
      }
    }
  }
  s.hoes = s.hoes.filter(h => (tG - h.t0) < h.dur + 0.1);
  for (const pt of s.parts) { pt.life += dt; pt.vy += 1100 * dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.rot += pt.vr * dt; }
  s.parts = s.parts.filter(p => p.life < p.max);
  s.marks = s.marks.filter(m => (tG - m.t0) < m.dur);
  s.worms = s.worms.filter(w => w.caught ? (tG - w.fly) < 0.5 : (tG - w.born) < maxAge);
}
function enterDig(fromShop) {
  if (digsLeft() <= 0) { toast('😮‍💨 Tay đã mỏi, mai đào tiếp nhé! (tối đa ' + DIG.perDay + ' lượt/ngày)'); return; }
  if ((S.stamina || 0) <= 0) { toast('😮‍💨 Hết thể lực! Ăn gì đó hoặc nghỉ một lát...'); Sfx.fail(); return; }
  S.digDay.count++; save();
  $('dig-left').textContent = 'Lượt đào còn lại hôm nay: ' + digsLeft() + '/' + DIG.perDay;
  phase = 'DIG'; show('scr-dig');
  $('dig-from-shop').value = fromShop ? '1' : '';
  digS = { dug: 0, timeLeft: DIG.time, worms: [], hoes: [], parts: [], marks: [], decor: makeDigDecor() };
  $('dig-time').textContent = digS.timeLeft; $('dig-count').textContent = digS.dug;
  const pop = setInterval(digSpawn, DIG.popMs);
  const tick = setInterval(() => {
    if (!digS) { clearInterval(tick); return; }
    digS.timeLeft--; $('dig-time').textContent = Math.max(0, digS.timeLeft);
    if (digS.timeLeft <= 0) endDig();
  }, 1000);
  function endDig() {
    clearInterval(pop); clearInterval(tick);
    const dug = digS ? digS.dug : 0; digS = null;
    if (dug > 0) { S.store.giun += dug; save(); toast('Đào được ' + dug + ' con giun! 🪱'); }
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
  if ((S.map === 'song' || S.map === 'dampha') && spot) {
    const w = L.portrait ? spot.pwx : spot.wx, h = L.portrait ? spot.pwy : spot.wy;
    return x >= w[0] && x <= w[1] && y >= h[0] && y <= h[1];
  }
  if (L.portrait) return x >= 30 && x <= 510 && y >= 205 && y <= 720;
  if (S.map === 'song') return x >= 60 && x <= 900 && y >= 230 && y <= 430;
  return x >= 60 && x <= 900 && y >= 215 && y <= 445;
}
// Vị trí chân cần thủ theo map/điểm (cần thủ ĐỨNG ĐÚNG điểm đã chọn)
function anglerPos() {
  if ((S.map === 'song' || S.map === 'dampha') && spot)
    return L.portrait ? { x: spot.pax, y: spot.pay } : { x: spot.ax, y: spot.ay };
  return L.portrait ? { x: 150, y: 912 } : { x: 110, y: 530 };
}

function doCast(x, y) {
  if (!waterBounds(x, y)) { toast('Chạm vào mặt nước để quăng cần!'); return; }
  if (!drainStamina(STAMINA.cast)) { toast('😮‍💨 Hết thể lực! Ăn gì đó hoặc nghỉ một lát...'); Sfx.fail(); return; }
  if (checkRodBreak('cast')) return; // cần đã mòn hết -> gãy
  const maxX = castMinX() + rod().cast * castRange();
  if (x > maxX) { x = maxX; toast('Cần của bạn chỉ quăng tới đây!'); }
  fx = x; fy = y; hint = null;
  Sfx.waterPlip(); // "bõm" khi mồi chạm nước
  splashes.push({ x: fx, y: fy, r: 6, a: 0.9 });
  ripples.push({ x: fx, y: fy, r: 8, a: 0.8 });
  // Chọn sẵn con cá sẽ cắn để áp hệ số mồi ưa thích / thời tiết / giờ vàng / dòng chảy / thủy triều
  fish = pickFish();
  let mult = 1;
  const mods = [];
  const bm = baitBiteMult(fish, S.bait);
  if (bm < 1) { mult *= bm; mods.push(BAITS[S.bait].name); }
  if (session.weather === 'mua') { mult *= 0.7; mods.push('sau mưa'); }
  if (session.golden) { mult *= 0.8; mods.push('giờ vàng'); }
  if ((S.map === 'song' || S.map === 'dampha') && spot) {
    const drift = spot.flow - BAITS[S.bait].w;
    if (drift > 0.25) {
      mult *= 1.67; // tỉ lệ cắn giảm ~40%
      hint = '⚠️ Dòng xiết! Mồi bị trôi — tỉ lệ cắn giảm.';
      toast('⚠️ Dòng xiết! Hãy dùng mồi nặng hơn hoặc đổi điểm câu.');
    }
  }
  // Trụ 2: thủy triều ở đầm phá
  if (S.map === 'dampha') {
    const td = tideState();
    let tm = td.bite;
    if (td.phase === 'len' && fish.id === 'cua') tm = 1;        // cua không hưởng nước lớn
    else if (td.phase === 'rong' && fish.id === 'cua') tm = 0.87; // cua +15% lúc nước ròng
    if (tm !== 1) { mult *= tm; mods.push(td.icon + ' ' + td.name); }
  }
  const wt = BAITS[S.bait].wait;
  waitT = rnd(wt[0], wt[1]) * mult;
  phase = 'WAIT';
  wearRod(1); // quăng cần -1 độ bền
}

// Hệ số mồi ưa thích: hệ số nhân thời gian chờ cắn (nhỏ hơn = cắn nhanh hơn).
// +25% đúng mồi → ×0.8 · mồi ủ cho cá ăn cám +40% → ×0.71
// dế chũi cho cá săn mồi +50% → ×0.67 · lure cho cá săn mồi +35% → ×0.74
function baitBiteMult(fish, bait) {
  if (!fish || !bait) return 1;
  if (fish.bait === bait) return 0.8;
  if (bait === 'moi-u' && fish.bait === 'cam') return 0.71;
  if (bait === 'de-chui' && fish.pred) return 0.67;
  if (bait === 'lure' && fish.pred) return 0.74;
  return 1;
}
function pickFish() {
  const pool = FISH.filter(f => f.map === S.map);
  const distFrac = (fx - castMinX()) / castRange(); // 0 gần .. 1 xa
  let total = 0;
  const ws = pool.map(f => {
    let w = f.w * ((distFrac > 0.65 && f.big) ? 2.5 : 1);
    // Điểm câu sông/đầm phá: cá đặc trưng của điểm dễ gặp hơn
    if ((S.map === 'song' || S.map === 'dampha') && spot && spot.fish.includes(f.id)) w *= 2.5;
    // Đợt 2: buff "Cá lớn phù hộ" từ phóng sinh — cá to dễ gặp hơn 15%
    if (buffActive() && f.big) w *= 1.15;
    // Trụ 2: nước ròng ở đầm phá — cua biển ra kiếm ăn, dễ gặp gấp đôi
    if (S.map === 'dampha' && f.id === 'cua' && tideState().phase === 'rong') w *= 2;
    total += w; return w;
  });
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) return pool[i]; }
  return pool[0];
}

function startBite() {
  biteT = 0;
  // Tốn mồi trong túi — mồi giả (lure) KHÔNG hao; không để số lượng âm
  if (S.bait !== 'lure') {
    const k = baitKey(S.bait);
    inv()[k] = Math.max(0, (inv()[k] || 0) - 1);
  }
  save(); updateHUD();
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
    // --- Pattern mới cho cá đầm phá (Trụ 2) ---
    case 'vuocnhanh': // vược: nhấp nhanh 3 nhịp mạnh rồi kéo
      dy = dip(t, 0.12, 0.24, 12) + dip(t, 0.36, 0.48, 12) + dip(t, 0.60, 0.72, 12) + ramp(t, 0.85, 1.2, 24);
      tilt = ramp(t, 0.85, 1.2, 0.55); break;
    case 'chemnhay': // chẽm: nhấp 1 cái, NHẢY đột biến rồi lôi sâu
      dy = dip(t, 0.25, 0.40, 10) + dip(t, 0.55, 0.63, 17) + ramp(t, 0.80, 1.2, 30);
      tilt = ramp(t, 0.80, 1.2, 0.75); break;
    case 'cuai': // cua biển: chìm chậm ì ì rồi ghì đều
      dy = Math.sin(t * 14) * 3 + ramp(t, 0.30, 1.2, 20); tilt = ramp(t, 0.30, 1.2, 0.3); break;
    case 'giondai': // chép giòn: đẩy phao lên rồi kéo dai khỏe
      dy = (t < 0.50 ? -10 * Math.sin(Math.PI * t / 0.50) : 0) + ramp(t, 0.55, 1.2, 22);
      tilt = ramp(t, 0.55, 1.2, 0.45); break;
  }
  return { dy, tilt };
}

function startStrike() {
  const r = rod();
  // Cá khó (diff cao): vùng xanh hẹp hơn, thanh chạy nhanh hơn
  const zw = clamp(0.16 + r.sense * 0.24 - fish.diff * 0.12, 0.08, 0.40);
  const dur = Math.max(1.0, 1.5 - fish.diff * 0.6);
  let zc = rnd(0.30, 0.78);
  zc = clamp(zc, zw / 2 + 0.03, 1 - zw / 2 - 0.03);
  strike = { pos: 0, dur, zc, zw };
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
  drainStamina(STAMINA.strikeMiss); // giật hụt −1
  questEvent('miss');
  afterAttempt();
}

function startFight() {
  if (checkRodBreak('fight')) { fight = null; afterAttempt(); return; } // gãy lúc vào bo -> mất cá
  const r = rod(), d = fish.diff;
  // Cá khó: giãy mạnh hơn (amp, speed, surge), vùng an toàn hẹp hơn, lên cá chậm hơn
  fight = {
    tension: 0.35, prog: 0, zt: 0,
    amp: 0.12 + d * 0.20,
    speed: 1.8 + d * 2.6,
    zw: clamp(0.34 - d * 0.18 + r.line * 0.08, 0.14, 0.44),
    zc: 0.5, surge: 0, diff: d,
    fill: 0.20 + r.line * 0.10,
    breakT: 0, slackT: 0, surgeT: rnd(0.8, 1.6),
    surgeMag: 0.15 + d * 0.20, surgeTR: [0.8, 1.8], jump: false,
  };
  // Trụ 2: kiểu kéo dây riêng của từng loài (pull)
  const pull = fish.pull;
  if (pull === 'nhanh') {        // vược: giãy nhanh nhiều đợt ngắn liên tục
    fight.amp = 0.16 + d * 0.22; fight.speed = 2.6 + d * 3.0;
    fight.surgeMag = 0.22 + d * 0.26; fight.surgeTR = [0.4, 0.9];
  } else if (pull === 'nhay') {  // chẽm: ít đợt nhưng mỗi đợt nhảy mạnh đột biến
    fight.amp = 0.10 + d * 0.18; fight.speed = 2.0 + d * 2.4;
    fight.surgeMag = 0.30 + d * 0.32; fight.surgeTR = [1.4, 2.6]; fight.jump = true;
  } else if (pull === 'i') {     // cua: ì đáy, kéo chậm nặng, tension ổn định cao
    fight.amp = 0.06 + d * 0.10; fight.speed = 1.1 + d * 1.3;
    fight.surgeMag = 0.06 + d * 0.10; fight.surgeTR = [1.6, 2.8];
    fight.fill = 0.15 + r.line * 0.08;
  } else if (pull === 'dai') {   // chép giòn: kéo đều khỏe dai
    fight.amp = 0.12 + d * 0.20; fight.speed = 1.7 + d * 2.2;
    fight.surgeMag = 0.12 + d * 0.18; fight.surgeTR = [1.0, 2.0];
    fight.fill = 0.15 + r.line * 0.09;
  }
  phase = 'FIGHT';
  Sfx.reelStart(); // máy câu bắt đầu rít
}

function fightWin() {
  Sfx.caught();
  Sfx.reelStop(); // dừng tiếng máy rít
  spawnDrops(fx, fy, 10, 130); // bắt được: nước bắn tung tóe
  Sfx.waterPlip();
  const w = rnd(fish.min, fish.max);
  lastWeight = Math.round(w * 100) / 100;
  lastPrice = Math.round(lastWeight * fish.price);
  // Bo cá thắng: −(6 + round(diff×8)) — cá càng khó càng mệt
  drainStamina(6 + Math.round(fish.diff * 8));
  wearRod(3 + Math.round(fish.diff * 6)); // bo thắng mòn cần theo độ khó cá
  // Đếm cá cho cấp độ & mở khóa map
  S.totalFish = (S.totalFish || 0) + 1;
  if (S.map === 'ao') S.caughtAo = (S.caughtAo || 0) + 1;
  if (S.map === 'song') S.caughtSong = (S.caughtSong || 0) + 1; // mở khóa đầm phá
  if (lastWeight > (S.biggestFish || 0)) S.biggestFish = lastWeight; // BXH: cá to nhất
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
  // Mode Trốn vợ: 2 lựa chọn — Cho vào đồ đựng (về nhà mới bán/dâng/nấu) hoặc Phóng sinh.
  // (Chế độ Câu tự do giữ nguyên: bán ngay ở bờ.)
  const wife = S.mode === 'wife';
  $('res-row-free').classList.toggle('hidden', wife);
  $('res-row-wife').classList.toggle('hidden', !wife);
  if (wife) renderWifeResult();
  $('res-row-wife-done').classList.add('hidden');
  $('res-funny').classList.add('hidden');
  $('res-funny').textContent = '';
  show('pop-result');
  burstConfetti($('pop-result').querySelector('.panel'));
}
// Cập nhật nút "Cho vào đồ đựng" theo sức chứa còn lại
function renderWifeResult() {
  // Luật sức chứa theo KG: thùng đầy cứng (disable), rọng/xô cho nhồi quá tải kèm rủi ro
  const c = contDef(), kg = keptKg(), load = contLoad();
  const btn = $('btn-wife-keep');
  btn.innerHTML = c.icon + ' Cho vào ' + c.name + ' (' + kg.toFixed(1) + '/' + c.cap + 'kg)';
  btn.classList.remove('danger');
  if (c.id === 'thung') {
    const over = kg + lastWeight > c.cap + 1e-9;
    btn.disabled = over;
    if (over) toast('🧰 Thùng câu đã đầy — không nhét thêm được!');
  } else {
    btn.disabled = false;
    if (load > 1) {
      btn.classList.add('danger');
      btn.textContent += ' ⚠️';
    }
  }
}
// --- Rủi ro quá tải đồ đựng (mode Trốn vợ) ---
// Roll MỖI LẦN cho cá vào khi đã vượt tải; cộng roll nhẹ mỗi 30s lúc WAIT (contRiskIdle).
function contRiskOnKeep(c) {
  const load = contLoad();
  if (load <= 1) return;
  if (!overWarned) {
    overWarned = true;
    toast(c.id === 'ro' ? '⚠️ Rọng đã quá tải! Nhồi thêm có thể VỠ TOANG, xổng hết cá...'
                        : '⚠️ Xô đã quá tải! Cá khỏe có thể nhảy ra ngoài...');
    Sfx.fail();
  }
  if (c.id === 'ro') {
    if (Math.random() < roBreakChance(load)) breakBasket();
  } else if (c.id === 'xo') {
    if (contRiskLevel('xo', load) === 'jump-many') jumpOut(Math.min(S.keptFish.length, 2 + (Math.random() < 0.5 ? 1 : 0)), true);
    else if (Math.random() < xoJumpChance(load)) jumpOut(1, false);
  }
}
function contRiskIdle() {
  const c = contDef(), load = contLoad();
  if (load <= 1 || c.id === 'thung') return;
  if (Math.random() >= contIdleChance(c.id, load)) return;
  if (c.id === 'ro') breakBasket();
  else jumpOut(1, false);
}
function breakBasket() {
  const n = keptCount();
  S.keptFish = []; contShakeT = 1.2; save(); updateHUD();
  toast('💥 Rọng vỡ toang! ' + n + ' con cá xổng hết rồi...');
  Sfx.fail();
}
function jumpOut(n, certain) {
  const picks = pickJumpers(S.keptFish || [], n);
  if (!picks.length) return;
  const idx = {};
  picks.forEach(p => { idx[p.i] = 1; });
  const gone = picks.map(p => p.f);
  S.keptFish = (S.keptFish || []).filter((f, i) => !idx[i]);
  save(); updateHUD();
  toast('🐟 ' + (certain ? 'Xô chật quá! ' : '') +
    gone.map(f => f.name + ' ' + f.weight.toFixed(2) + 'kg').join(', ') + ' nhảy ra khỏi xô!');
  if (Sfx.splash) Sfx.splash();
}
function showFunny(text) {
  const f = $('res-funny');
  f.textContent = text;
  f.classList.remove('hidden');
  $('res-row-wife').classList.add('hidden');
  $('res-row-wife-done').classList.remove('hidden');
}
function fightLost(msg) {
  Sfx.fail(); Sfx.reelStop(); fight = null; toast(msg);
  drainStamina(STAMINA.fightLost); // bo thua −4
  wearRod(2); // bo thua −2 độ bền
  questEvent('miss');
  afterAttempt();
}

// Sau mỗi lần giật/bo: kiểm tra còn mồi không
function afterAttempt() {
  updateHUD();
  if (hasBait(S.bait)) { enterCast(); return; }
  // Tự đổi sang loại mồi còn trong túi (ưu tiên giun → cám → mồi cao cấp)
  const order = ['giun', 'cam', 'moi-u', 'de-chui', 'lure'];
  const other = order.find(b => b !== S.bait && hasBait(b) && baitUsable(b));
  if (other) {
    S.bait = other; save();
    toast('Hết mồi! Đã chuyển sang ' + BAITS[other].name + '.');
    enterCast();
  } else {
    toast('Hết mồi! Về chuẩn bị thêm.');
    enterPrepare();
  }
}
// Còn mồi này trong túi không? (lure không hao nên chỉ cần đang sở hữu)
function hasBait(b) { return (inv()[baitKey(b)] || 0) > 0; }
// Mồi này có dùng được với cần đang cầm không? (lure chỉ cần máy)
function baitUsable(b) {
  if (b !== 'lure') return true;
  return S.bag.rods.some(iid => { const r = rodInst(iid); return r && rodDef(r.id).type === 'may'; });
}

/* ---------- Đợt 2: Về nhà ---------- */
function confirmGoHome() {
  if (!trip) { enterMenu(); return; }
  const lateMin = Math.max(0, trip.gameMin - trip.deadline);
  if (lateMin <= 0) { goWifeHome(); return; }
  const pen = Math.floor(lateMin / 30) * 15;
  if (homeConfirmT > 0) { goWifeHome(); return; }
  homeConfirmT = 6;
  toast('⏰ Đã quá giờ ' + Math.round(lateMin) + ' phút! Nhấn 🏠 lần nữa để về (+' + pen + ' nghi ngờ)');
  Sfx.fail();
  updateHUD();
}
function goWifeHome() {
  const lateMin = trip ? Math.max(0, trip.gameMin - trip.deadline) : 0;
  if (lateMin > 0) {
    const blocks = Math.floor(lateMin / 30);
    S.lateCount = (S.lateCount || 0) + 1;
    if (S.lateCount >= 3) addTitle('Vua giờ giới nghiêm');
    addSuspicion(blocks * 15, 'về trễ ' + Math.round(lateMin) + ' phút');
  } else {
    S.suspicion = Math.max(0, (S.suspicion || 0) - 5);
    addTitle('Chồng ngoan');
    toast('🏠 Về đúng giờ! Vợ gật gù: "Hôm nay ngoan đấy" 😌');
  }
  returnBagToStore();
  trip = null; homeConfirmT = 0;
  save();
  phase = 'WIFEHOME';
  show('scr-wifehome');
  renderWifeHome();
  updateHUD();
}
function renderWifeHome() {
  $('wh-susp').textContent = S.suspicion || 0;
  $('wh-happy').textContent = S.happiness || 0;
  $('wh-titles').innerHTML = (S.titles && S.titles.length)
    ? S.titles.map(t => '<span class="title-badge">🏅 ' + t + '</span>').join('')
    : '<span class="subtitle">Chưa có danh hiệu — cố lên!</span>';
  const b = S.keptFish || [];
  const cap = contDef().cap;
  $('wh-kept-n').textContent = keptKg().toFixed(1);
  $('wh-kept-cap').textContent = cap + ' kg';
  $('wh-kept').innerHTML = b.length
    ? b.map(f => '<div class="card"><div class="card-title">🐟 ' + f.name + '</div>' +
      '<div class="card-desc">' + f.weight.toFixed(2) + ' kg — trị giá ' + fmt(f.price) + '</div></div>').join('')
    : '<p class="subtitle">Đồ đựng trống — ra bờ câu thêm rồi mang về nhé!</p>';
  const hasFish = b.length > 0;
  $('btn-sell-kept').disabled = !hasFish;
  $('btn-offer-fish').disabled = !hasFish;
  $('btn-kitchen').disabled = !hasFish;
  $('wh-gifts').innerHTML = WIFE_GIFTS.map(g =>
    '<div class="card"><div class="card-title">' + g.icon + ' ' + g.name + '</div>' +
    '<div class="card-desc">' + g.desc + '</div>' +
    '<button class="btn small" data-gift="' + g.id + '"' + (S.money < g.price ? ' disabled' : '') +
    '>Mua ' + fmt(g.price) + '</button></div>').join('');
  $('wh-weekly').innerHTML = '<b>📅 Cuối tuần ở nhà với vợ</b><br>' +
    'T7 &amp; CN không vào mode Trốn vợ → nghi ngờ reset về 20 + mở khóa Sông quê!<br>' +
    '<span class="subtitle">Tự động đánh giá vào đầu tuần.' +
    (S.wifeApproved ? ' ✅ Đã được vợ duyệt!' : '') + '</span>';
}
function offerFish() {
  const b = S.keptFish || [];
  if (!b.length) { toast('Đồ đựng trống trơn, dâng gì bây giờ? 😅'); return; }
  const n = b.length;
  const down = Math.min(30, n * 8);
  S.suspicion = Math.max(0, (S.suspicion || 0) - down);
  S.happiness = clamp((S.happiness || 0) + n * 10, 0, 100);
  S.keptFish = [];
  save();
  toast('🎁 ' + funny(FUNNY_GIFT) + ' (-' + down + ' nghi ngờ)');
  Sfx.caught();
  if ((S.happiness || 0) >= 80) addTitle('Chồng quốc dân');
  renderWifeHome(); updateHUD();
}
// Bán hết cá trong đồ đựng (chỉ ở nhà mới được bán — luật mode Trốn vợ)
function sellKept() {
  const b = S.keptFish || [];
  if (!b.length) { toast('Chưa có con cá nào để bán!'); return; }
  const total = b.reduce((a, f) => a + (f.price || 0), 0);
  S.money += total;
  S.totalEarned = (S.totalEarned || 0) + total;
  b.forEach(() => questEvent('sell'));
  S.keptFish = [];
  save();
  Sfx.sell();
  lbAfterSell(); // gửi điểm BXH ngầm
  flyMoney('+' + fmt(total));
  addSuspicion(5, 'tiền bán cá giấu ở đâu?');
  toast('💰 ' + funny(FUNNY_SELL, { price: fmt(total) }));
  renderWifeHome(); updateHUD();
}
function buyWifeGift(id) {
  const gf = WIFE_GIFTS.find(x => x.id === id);
  if (!gf || S.money < gf.price) return;
  S.money -= gf.price;
  S.happiness = clamp((S.happiness || 0) + gf.happy, 0, 100);
  save(); Sfx.sell();
  toast('🎁 ' + gf.desc);
  if ((S.happiness || 0) >= 80) addTitle('Chồng quốc dân');
  renderWifeHome(); updateHUD();
}
/* Mini-game "Vào bếp" — bấm đúng 4 nguyên liệu trong 30s.
   Cần ít nhất 1 con cá trong đồ đựng; thắng thì "nấu" 1 con (trừ khỏi keptFish). */
function enterKitchen() {
  if (!(S.keptFish || []).length) { toast('Cần ít nhất 1 con cá trong đồ đựng để nấu! 🐟'); Sfx.fail(); return; }
  phase = 'KITCHEN'; show('scr-kitchen');
  const items = KITCHEN_GOOD.concat(KITCHEN_BAD).sort(() => Math.random() - 0.5);
  const grid = $('kitchen-grid'); grid.innerHTML = '';
  let found = 0, timeLeft = KITCHEN_TIME, over = false;
  $('kit-time').textContent = timeLeft;
  items.forEach(ic => {
    const c = document.createElement('div');
    c.className = 'kit-cell'; c.textContent = ic;
    c.onclick = () => {
      if (over) return;
      if (KITCHEN_GOOD.includes(ic) && !c.classList.contains('done')) {
        c.classList.add('done'); found++; Sfx.click();
        if (found >= KITCHEN_GOOD.length) endKitchen('win');
      } else if (!c.classList.contains('done')) {
        c.classList.add('wrong');
        timeLeft = Math.max(0, timeLeft - 3); $('kit-time').textContent = timeLeft;
        Sfx.fail();
        setTimeout(() => c.classList.remove('wrong'), 400);
      }
    };
    grid.appendChild(c);
  });
  const tick = setInterval(() => {
    timeLeft--; $('kit-time').textContent = timeLeft;
    if (timeLeft <= 0) endKitchen('fail');
  }, 1000);
  function endKitchen(res) {
    if (over) return; over = true;
    clearInterval(tick);
    if (res === 'win') {
      const cooked = (S.keptFish || []).shift(); // nấu 1 con cá trong đồ đựng
      S.suspicion = Math.max(0, (S.suspicion || 0) - 20);
      drainStamina(STAMINA.kitchen); // nấu ăn thắng −5
      save();
      toast('👨‍🍳 Nấu ăn thành công! Món "' + (cooked ? cooked.name : 'cá') + ' kho tộ" — vợ ăn khen ngon (-20 nghi ngờ) 😋');
      Sfx.caught();
    } else if (res === 'fail') {
      toast('👨‍🍳 Cháy nồi rồi! Vợ: "Thôi để đấy..." 😅');
      Sfx.fail();
    }
    updateHUD();
    phase = 'WIFEHOME'; show('scr-wifehome'); renderWifeHome();
  }
  $('btn-kitchen-end').onclick = () => { Sfx.init(); Sfx.click(); endKitchen('quit'); };
}

/* ---------- Đồ đựng cá: popup xem + chạm trong scene ---------- */
// Popup xem cá đang giữ — chạm vào xô/rọng/thùng trong scene (mode Trốn vợ)
function enterContainer() {
  const c = contDef(), b = S.keptFish || [], kg = keptKg(), load = contLoad();
  const pct = Math.min(100, Math.round(load * 100));
  $('cont-title').innerHTML = c.icon + ' ' + c.name;
  $('cont-sub').textContent = 'Đang giữ ' + kg.toFixed(1) + '/' + c.cap + ' kg' +
    (load > 1 ? ' ⚠️ QUÁ TẢI!' : '') +
    (c.place === 'water' ? ' — rọng ngập dưới nước, cá sống khỏe 🐟' : ' — để trên bờ');
  const fill = $('cont-fill');
  if (fill) {
    fill.style.width = pct + '%';
    fill.classList.toggle('over', load > 1);
  }
  const warn = $('cont-warn');
  if (warn) {
    warn.classList.toggle('hidden', load <= 1);
    if (load > 1) warn.textContent = c.id === 'ro'
      ? '⚠️ Rọng quá tải — nhồi thêm có thể VỠ, xổng hết cá!'
      : '⚠️ Xô quá tải — cá khỏe có thể nhảy ra ngoài!';
  }
  $('cont-list').innerHTML = b.length
    ? b.map(f => '<div class="kept-row"><span class="kept-ico">🐟</span>' +
      '<span class="kept-who"><b>' + escHtml(f.name) + '</b>' +
      '<small>' + f.weight.toFixed(2) + ' kg</small></span>' +
      '<span class="kept-price">' + fmt(f.price) + '</span></div>').join('')
    : '<p class="kept-empty">Chưa có con cá nào — quăng cần đi bạn ơi! 🎣';
  $('cont-total').textContent = b.length ? 'Tổng giá trị ước tính: ' + fmt(keptValue()) : '';
  show('scr-container');
}

/* ---------- Input ---------- */
function canvasPos(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * L.W, y: (e.clientY - r.top) / r.height * L.H };
}
function onPress(e) {
  Sfx.init();
  // Chạm vào đồ đựng cá trong scene (mode Trốn vợ, lúc rảnh tay: CAST/WAIT)
  if (S.mode === 'wife' && (phase === 'CAST' || phase === 'WAIT')) {
    const p = canvasPos(e);
    const cp = containerPos();
    const rr = cv.getBoundingClientRect();
    const hitR = Math.max(cp.r, 48 / (rr.width / L.W)); // ≥48px vật lý
    if (Math.hypot(p.x - cp.x, p.y - cp.y) < hitR) { enterContainer(); return; }
  }
  if (phase === 'SPOT') {
    const p = canvasPos(e);
    // Vùng chạm co giãn theo tỉ lệ hiển thị: đảm bảo ≥48px vật lý trên mobile
    const rr = cv.getBoundingClientRect();
    const hitR = Math.max(60, 48 / (rr.width / L.W));
    const arr = spotsFor(S.map);
    const s = arr.find(s => { const sp = spotPos(s); return Math.hypot(p.x - sp.x, p.y - sp.y) < hitR; });
    if (s) {
      spot = s; Sfx.click();
      toast('Đã chọn: ' + s.name + ' — ' + s.desc);
      enterCast();
    } else toast('Chạm vào 1 trong 3 điểm câu!');
  }
  else if (phase === 'CAST') { const p = canvasPos(e); doCast(p.x, p.y); }
  else if (phase === 'DIG') { const p = canvasPos(e); digTap(p); }
  else if (phase === 'BITE') startStrike();       // nhấn sớm: vào luôn thanh nhịp
  else if (phase === 'STRIKE') { Sfx.click(); strikeJudge(); }
  else if (phase === 'FIGHT') holding = true;
}
function onRelease() { holding = false; }

cv.addEventListener('pointerdown', onPress);
window.addEventListener('pointerup', onRelease);
window.addEventListener('pointercancel', onRelease);
cv.addEventListener('contextmenu', e => e.preventDefault());

/* ---------- Cụm nút thao tác portrait (dưới canvas) ---------- */
// Portrait: nút bấm to cho ngón tay cái, mirror thao tác chạm canvas theo phase
function actionCfg() {
  switch (phase) {
    case 'CAST':
      return { label: '🎣 Quăng nhanh (−2⚡)', fn: () => doCast(castMinX() + castRange() * 0.55, L.portrait ? 460 : 330) };
    case 'WAIT':
      return { label: '🔄 Thu cần', fn: () => enterCast('Chạm vào mặt nước để quăng lại!') };
    case 'BITE':
      return { label: '⚡ GIẬT NGAY!', fn: () => startStrike() };
    case 'STRIKE':
      return { label: '🎯 Nhấn đúng nhịp!', fn: () => { strikeJudge(); } };
    case 'FIGHT':
      return { label: '💪 Giữ để bo cá', hold: true };
    default:
      return null;
  }
}
let abKey = '';
function updateActionBar() {
  const bar = $('action-bar'), btn = $('btn-action');
  if (!bar || !btn) return;
  const anyScreen = !!document.querySelector('#ui .screen:not(.hidden)');
  const cfg = (L.portrait && isFishing() && !anyScreen) ? actionCfg() : null;
  const key = (cfg ? '1' : '0') + '|' + phase + '|' + ((S.stamina || 0) <= 0 ? '0' : '1');
  if (key === abKey) return;
  abKey = key;
  bar.classList.toggle('hidden', !cfg);
  if (!cfg) { fitPortraitCanvas(); return; }
  btn.textContent = cfg.label;
  btn.disabled = phase === 'CAST' && (S.stamina || 0) <= 0; // hết thể lực: không quăng được
  if (cfg.hold) {
    btn.onclick = null;
    btn.onpointerdown = e => { e.preventDefault(); Sfx.init(); holding = true; };
  } else {
    btn.onpointerdown = null;
    btn.onclick = () => { Sfx.init(); Sfx.click(); cfg.fn(); };
  }
  btn.oncontextmenu = e => e.preventDefault();
  fitPortraitCanvas();
}
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
bindClick('btn-to-prepare', () => { S.mode = 'free'; save(); enterPrepare(); });
bindClick('btn-to-wife', startWifeTrip);
bindClick('btn-pardon', () => {
  if ((S.sincerity || 0) >= 5 && banned()) {
    S.sincerity -= 5; S.banUntil = ''; S.suspicion = 50; save();
    toast('🙏 Vợ nguôi giận! Nhưng đừng tái phạm... (nghi ngờ về 50)');
    Sfx.caught(); updateHUD();
  }
});
/* ---------- Chuộc lỗi khi bị cấm câu: dùng tiền nịnh vợ ---------- */
function renderBribe() {
  const p = $('bribe-panel');
  if (!banned()) { p.classList.add('hidden'); return; }
  p.classList.remove('hidden');
  $('bribe-days').textContent = banDaysLeft();
  $('bribe-susp').textContent = S.suspicion || 0;
  $('bribe-list').innerHTML = BRIBE_GIFTS.map(g =>
    '<div class="card"><div class="card-title">' + g.icon + ' ' + g.name + '</div>' +
    '<div class="card-desc">' + g.desc + '</div>' +
    '<button class="btn small" data-bribe="' + g.id + '"' + (S.money < g.price ? ' disabled' : '') +
    '>Tặng ' + fmt(g.price) + '</button></div>').join('');
  $('bribe-hint').classList.toggle('hidden', S.money >= BRIBE_GIFTS[0].price);
}
function buyBribe(id) {
  const g = BRIBE_GIFTS.find(x => x.id === id);
  if (!g || !banned()) return;
  if (S.money < g.price) { toast('Không đủ tiền mua ' + g.name + '! 😅'); Sfx.fail(); return; }
  S.money -= g.price;
  S.suspicion = Math.max(0, (S.suspicion || 0) - g.down);
  S.happiness = clamp((S.happiness || 0) + (g.happy || 0), 0, 100);
  save(); Sfx.sell();
  toast('💝 ' + funny(FUNNY_BRIBE) + ' (-' + g.down + ' nghi ngờ)');
  if ((S.suspicion || 0) < 80 && banned()) {
    S.banUntil = ''; save();
    toast('🎉 Vợ nguôi giận rồi! Được đi câu tiếp — nhớ về sớm đấy!');
    Sfx.caught();
  }
  renderBribe(); updateHUD();
}
bindClick('btn-to-quest', enterQuest);
bindClick('btn-food', enterFood);
bindClick('btn-rod-switch', () => switchRod());
bindClick('btn-to-shop', enterShop);
bindClick('btn-to-help', enterHelp);
bindClick('btn-help-back', enterMenu);
bindClick('btn-prep-back', enterMenu);
bindClick('btn-shop-back', enterMenu);
bindClick('btn-quest-back', enterMenu);
bindClick('btn-map-back', enterPrepare);
bindClick('btn-go-fish', () => enterMapSelect());
bindClick('btn-home', () => {
  if (isFishing()) returnBagToStore(); // đồ thừa trả về kho
  if (S.mode === 'wife' && trip && isFishing()) confirmGoHome();
  else enterMenu();
});
bindClick('btn-offer-fish', offerFish);
bindClick('btn-sell-kept', sellKept);
bindClick('btn-cont-close', () => show(null));
bindClick('btn-food-close', () => show(null));
bindClick('btn-kitchen', enterKitchen);
bindClick('btn-wh-end', enterMenu);
bindClick('btn-dig', () => enterDig(false));
bindClick('btn-buy-cam-prep', () => buyCam());
bindClick('btn-buy-mou-prep', () => { if (buyPremiumBait('moi-u')) renderPrepare(); });
bindClick('btn-buy-dechui-prep', () => { if (buyPremiumBait('de-chui')) renderPrepare(); });
bindClick('btn-buy-lure-prep', () => { if (buyPremiumBait('lure')) renderPrepare(); });
// So tien bay len khi ban duoc ca
function flyMoney(txt) {
  try {
    const d = document.createElement('div');
    d.className = 'fly-money'; d.textContent = txt;
    $('ui').appendChild(d);
    setTimeout(() => d.remove(), 1250);
  } catch (e) {}
}
// Confetti an mung khi len ca
function burstConfetti(panel) {
  if (!panel) return;
  try {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cols = ['#f9a825', '#43a047', '#42a5f5', '#ec407a', '#ffeb3b', '#ab47bc'];
    for (let i = 0; i < 14; i++) {
      const c = document.createElement('i'); c.className = 'confetti';
      c.style.left = (18 + Math.random() * 64) + '%';
      c.style.background = cols[i % cols.length];
      c.style.animationDelay = (Math.random() * 0.18) + 's';
      panel.appendChild(c);
      setTimeout(() => c.remove(), 1500);
    }
  } catch (e) {}
}
bindClick('btn-sell', () => {
  S.money += lastPrice; S.totalEarned = (S.totalEarned || 0) + lastPrice; save(); Sfx.sell();
  questEvent('sell');
  lbAfterSell(); // gửi điểm BXH ngầm
  flyMoney('+' + fmt(lastPrice));
  toast('Đã bán cá +' + fmt(lastPrice) + '!');
  $('pop-result').classList.add('hidden');
  afterAttempt();
});
// Mode Trốn vợ: cho cá vào đồ đựng (KHÔNG bán ngay ở bờ — về nhà mới Bán/Dâng/Nấu)
// Cho cá vào đồ đựng (dùng chung cho nút UI và test)
function keepFishToContainer() {
  // Thùng: tải cứng — không nhồi thêm. Rọng/Xô: cho nhồi quá tải nhưng roll rủi ro.
  const c = contDef();
  if (c.id === 'thung' && keptKg() + lastWeight > c.cap + 1e-9) {
    toast('🧰 Thùng câu đã đầy — không nhét thêm được!'); Sfx.fail(); return false;
  }
  S.keptFish.push({ fishId: fish.id, name: fish.name, weight: lastWeight, price: lastPrice });
  save();
  updateHUD();
  showFunny(funny(FUNNY_KEEP, { cont: c.name }));
  contRiskOnKeep(c);
  return true;
}
bindClick('btn-wife-keep', keepFishToContainer);
bindClick('btn-wife-release', () => {
  S.merit = (S.merit || 0) + 1;
  S.totalMerit = (S.totalMerit || 0) + 1;
  save();
  if (S.merit >= 10) {
    S.merit -= 10;
    S.buffUntil = Date.now() + 3600 * 1000;
    save();
    toast('🍀 Đủ 10 Phúc đức! "Cá lớn phù hộ" — 1 giờ tới dễ gặp cá to hơn!');
  }
  if (S.totalMerit >= 20) addTitle('Người phóng sinh');
  showFunny(funny(FUNNY_RELEASE));
});
bindClick('btn-wife-continue', () => {
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
  Music.setMuted(Sfx.muted);   // tắt/mở cả nhạc nền lẫn hiệu ứng
  Sfx.applyMute();             // dừng mọi loop (dế/ếch/mưa/máy rít/chuông) khi tắt tiếng
  $('btn-mute').textContent = Sfx.muted ? '🔇' : '🔊';
});
$('btn-mute').textContent = Sfx.muted ? '🔇' : '🔊';

// Chọn mồi (kể cả mồi cao cấp Trụ 2) — lure yêu cầu cần máy
function selectBait(b) {
  if (b === 'lure' && !baitUsable('lure')) {
    toast('🎣 Mồi giả chỉ dùng được với cần máy! (Daiwa Crossfire 2.4m trở lên)'); Sfx.fail(); return;
  }
  S.bait = b; save(); Sfx.click(); renderPrepare();
}
[['card-giun', 'giun'], ['card-cam', 'cam'], ['card-mou', 'moi-u'], ['card-dechui', 'de-chui'], ['card-lure', 'lure']]
  .forEach(pair => {
    $(pair[0]).addEventListener('click', e => {
      if (e.target.closest('button')) return;
      selectBait(pair[1]);
    });
  });

// Mua / trang bị (event delegation cho danh sách render động)
document.addEventListener('click', e => {
  const m = e.target.closest('[data-map]');
  if (m) {
    Sfx.init(); Sfx.click();
    const mapId = m.dataset.map;
    if (!mapUnlocked(mapId)) { toast(mapLockText(mapId)); return; }
    enterFish(mapId);
    return;
  }
  const q = e.target.closest('[data-qclaim]');
  if (q) { Sfx.init(); Sfx.click(); claimQuest(q.dataset.qclaim); return; }
  const gf = e.target.closest('[data-gift]');
  if (gf) { Sfx.init(); Sfx.click(); buyWifeGift(gf.dataset.gift); return; }
  const br = e.target.closest('[data-bribe]');
  if (br) { Sfx.init(); Sfx.click(); buyBribe(br.dataset.bribe); return; }
  // Chọn đồ đựng cá mang theo (màn hình chuẩn bị, mode Trốn vợ)
  const dc = e.target.closest('[data-cont]');
  if (dc && S.containers.includes(dc.dataset.cont)) {
    Sfx.init(); Sfx.click();
    S.activeContainer = dc.dataset.cont; save();
    toast('Đã chọn mang theo ' + contDef().name + '.');
    if (phase === 'PREPARE') renderPrepare();
    updateHUD();
    return;
  }
  const pk = e.target.closest('[data-act="packrod"]');
  if (pk) { Sfx.init(); Sfx.click(); packRod(pk.dataset.id); return; }
  const bs = e.target.closest('[data-act="bagstep"]');
  if (bs) { bagStep(bs.dataset.kind, parseInt(bs.dataset.d, 10) || 0); return; }
  const bf = e.target.closest('[data-act="bagfoodstep"]');
  if (bf) { bagFoodStep(bf.dataset.id, parseInt(bf.dataset.d, 10) || 0); return; }
  const b = e.target.closest('[data-act]');
  if (!b) return;
  Sfx.init(); Sfx.click();
  const act = b.dataset.act, id = b.dataset.id;
  if (act === 'buyrod') {
    const r = RODS.find(x => x.id === id);
    if (level() < (r.reqLevel || 1)) { toast('Cần đạt cấp ' + r.reqLevel + ' để mua cần này!'); }
    else if (S.money >= r.price) {
      S.money -= r.price;
      S.store.rods.push({ iid: 'r' + (S.rodSeq++), id: r.id, cond: 100 });
      save(); trackSpend(r.price);
      Sfx.sell(); toast('Đã mua ' + r.name + '! Vào Chuẩn bị để cho vào túi 🎒'); renderShop();
    }
  } else if (act === 'repairrod') {
    const r = RODS.find(x => x.id === id);
    const insts = S.store.rods.filter(x => x.id === id);
    if (insts.length) {
      const worst = insts.reduce((a, b) => (a.cond < b.cond ? a : b));
      const cost = repairCost(r, worst.cond);
      if (S.money < cost) { toast('Không đủ tiền sửa!'); Sfx.fail(); }
      else {
        S.money -= cost; worst.cond = 100; save();
        if (cost > 0) trackSpend(cost);
        Sfx.sell(); toast('🔧 Đã sửa ' + r.name + ' như mới!'); renderShop();
      }
    }
  } else if (act === 'buycam') {
    buyCam();
  } else if (act === 'buymou') {
    buyPremiumBait('moi-u');
  } else if (act === 'buydechui') {
    buyPremiumBait('de-chui');
  } else if (act === 'buylure') {
    buyPremiumBait('lure');
  } else if (act === 'dig') {
    enterDig(phase === 'SHOP');
  } else if (act === 'buycontainer') {
    const c = containerById(id);
    if (c.price > 0 && !S.containers.includes(id) && S.money >= c.price) {
      S.money -= c.price; S.containers.push(id); S.activeContainer = id; save();
      trackSpend(c.price);
      Sfx.sell(); toast('Đã mua ' + c.name + '!');
    }
  } else if (act === 'buyfood') {
    buyFood(id);
  } else if (act === 'eatfood') {
    eatFood(id);
  }
  if (phase === 'PREPARE') renderPrepare();
  if (phase === 'SHOP') renderShop();
  updateHUD();
});
function buyCam() {
  if (S.money >= CAM_PRICE) {
    S.money -= CAM_PRICE; S.store.cam += CAM_PACK; save();
    trackSpend(CAM_PRICE);
    Sfx.sell(); toast('Đã mua ' + CAM_PACK + ' viên cám!');
  } else toast('Không đủ tiền!');
}
// Trụ 2: mua mồi cao cấp (vào kho ở nhà, không giới hạn)
function buyPremiumBait(id) {
  const def = BAITS[id];
  if (!def) return false;
  const price = id === 'moi-u' ? MOIU_PRICE : (id === 'de-chui' ? DECHUI_PRICE : LURE_PRICE);
  if (S.money < price) { toast('Không đủ tiền!'); Sfx.fail(); return false; }
  if (id === 'lure' && ((S.store.lure || 0) + (S.bag.lure || 0)) >= 1) {
    toast('Đã có mồi giả rồi — dùng mãi không hết!'); return false;
  }
  S.money -= price;
  const k = baitKey(id);
  S.store[k] = (S.store[k] || 0) + 1;
  save(); trackSpend(price);
  Sfx.sell(); toast('Đã mua ' + def.name + '!');
  return true;
}
// 🍱 Thực phẩm hồi thể lực: mua trong shop, ăn bất cứ lúc nào (kể cả đang câu)
function foodQty(id) { return ((inv().food || {})[id]) || 0; }
function buyFood(id) {
  const f = FOODS.find(x => x.id === id);
  if (!f) return false;
  if (S.money < f.price) { toast('Không đủ tiền!'); Sfx.fail(); return false; }
  S.money -= f.price;
  S.store.food = S.store.food || {};
  S.store.food[id] = ((S.store.food[id] || 0)) + 1;
  save(); trackSpend(f.price);
  Sfx.sell(); toast('Đã mua ' + f.icon + ' ' + f.name + '!');
  return true;
}
// Popup ăn đồ hồi thể lực — mở từ nút 🍱 trên HUD lúc đang câu
function enterFood() {
  const rows = FOODS.map(f => {
    const q = foodQty(f.id);
    const btn = q > 0
      ? '<button class="btn small" data-act="eatfood" data-id="' + f.id + '">Ăn</button>'
      : '<button class="btn small" disabled>Hết</button>';
    return '<div class="kept-row"><span class="kept-ico">' + f.icon + '</span>' +
      '<span class="kept-who"><b>' + f.name + ' ×' + q + '</b>' +
      '<small>+' + f.gain + ' ⚡ thể lực</small></span>' + btn + '</div>';
  }).join('');
  $('food-list').innerHTML = rows || '<p class="kept-empty">Chưa có đồ ăn, vào shop mua nhé 🍱</p>';
  $('food-sub').textContent = '⚡ Thể lực hiện tại: ' + Math.round(S.stamina || 0) + '/' + STAMINA.max;
  show('scr-food');
}
function eatFood(id) {
  const f = FOODS.find(x => x.id === id);
  if (!f) return false;
  if (foodQty(id) <= 0) { toast('Hết ' + f.name + ' rồi!'); Sfx.fail(); return false; }
  inv().food[id]--;
  regenStamina();
  S.stamina = Math.min(STAMINA.max, (S.stamina || 0) + f.gain);
  S.staminaTs = Date.now();
  save(); Sfx.caught(); updateHUD();
  toast('+' + f.gain + ' ⚡ Ngon quá!');
  enterFood(); // vẽ lại popup (cập nhật số lượng + thể lực)
  return true;
}
// Đợt 2: theo dõi chi tiêu đồ câu trong ngày — quá 5.000đ → vợ lườm
function trackSpend(amount) {
  const t = todayStr();
  if (!S.spendDay || S.spendDay.date !== t) S.spendDay = { date: t, total: 0, flagged: false };
  S.spendDay.total += amount;
  if (S.spendDay.total > 50000 && !S.spendDay.flagged) {
    S.spendDay.flagged = true;
    save();
    addSuspicion(10, 'tiêu hơn 50.000đ đồ câu trong 1 ngày!');
  }
  save();
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
  // Mini-game đào giun: animation cuốc, hạt đất, giun bay vào xô
  if (phase === 'DIG') digUpdate(dt);
  // hạt nước
  for (let i = splashes.length - 1; i >= 0; i--) {
    const p = splashes[i];
    p.r += 70 * dt; p.a -= 1.6 * dt;
    if (p.a <= 0) splashes.splice(i, 1);
  }
  // gợn sóng lan rộng
  for (let i = ripples.length - 1; i >= 0; i--) {
    const p = ripples[i];
    p.r += 55 * dt; p.a -= 1.5 * dt;
    if (p.a <= 0) ripples.splice(i, 1);
  }
  // giọt nước bắn: trọng lực kéo xuống
  for (let i = drops.length - 1; i >= 0; i--) {
    const p = drops[i];
    p.vy += 1100 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    p.a = Math.max(0, Math.min(0.9, p.life * 2));
    if (p.life <= 0) drops.splice(i, 1);
  }
  // Đợt 2: đồng hồ game của chuyến trốn vợ (1 phút thật = 15 phút game)
  if (S.mode === 'wife' && trip && ['SPOT', 'CAST', 'WAIT'].includes(phase)) {
    trip.gameMin += dt * WIFE.gameMinPerRealSec * 60;
    trip.elapsed += dt;
    if (trip.willCall && !trip.called && trip.elapsed >= trip.callAt) triggerCall();
    // Nhắc khi sắp quá giờ
    if (!trip.warned && trip.gameMin >= trip.deadline - 30) {
      trip.warned = true;
      toast('⏰ Sắp đến giờ giới nghiêm (' + fmtClock(trip.deadline) + ')! Về sớm kẻo toang!');
      Sfx.bite();
    }
  }
  if (homeConfirmT > 0) { homeConfirmT -= dt; if (homeConfirmT <= 0) updateHUD(); }
  if (contShakeT > 0) contShakeT -= dt;
  if (phase === 'WAIT') {
    waitT -= dt;
    if (waitT <= 0) startBite();
    // Quá tải mà cứ ngâm cần: mỗi 30s roll rủi ro một lần (nhẹ hơn lúc nhồi cá)
    if (S.mode === 'wife' && trip) {
      riskT += dt;
      if (riskT >= 30) { riskT = 0; contRiskIdle(); }
    }
  } else if (phase === 'BITE') {
    biteT += dt;
    if (biteT >= 1.2) startStrike();
  } else if (phase === 'STRIKE') {
    strike.pos += dt / strike.dur;
    if (strike.pos >= 1) strikeMiss('Chậm tay! Hụt rồi.');
  } else if (phase === 'FIGHT') {
    const f = fight;
    f.zt += dt;
    // cá giãy: giật vùng an toàn ngẫu nhiên (cường độ & nhịp theo loài)
    f.surgeT -= dt;
    if (f.surgeT <= 0) {
      f.surge = rnd(-1, 1) * (f.surgeMag || (0.15 + (f.diff || 0) * 0.20));
      const tr = f.surgeTR || [0.8, 1.8];
      f.surgeT = rnd(tr[0], tr[1]);
      const sp = f.jump ? 9 : 5, dr = f.jump ? 9 : 4; // chẽm nhảy: nước bắn mạnh
      splashes.push({ x: fx + rnd(-24, 24), y: fy + rnd(-8, 8), r: sp, a: 0.9 });
      spawnDrops(fx + rnd(-20, 20), fy, dr, 90); // cá quẫy bắn nước
      Sfx.waterPlip();
    }
    f.surge *= Math.pow(0.25, dt); // giảm dần
    f.zc = clamp(0.5 + f.amp * Math.sin(f.zt * f.speed) + f.surge, f.zw / 2 + 0.02, 1 - f.zw / 2 - 0.02);
    // lực căng
    f.tension = clamp(f.tension + (holding ? 0.95 : -0.75) * dt, 0, 1);
    Sfx.reelUpdate(f.tension); // máy câu rít theo lực căng
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

/* ---------- Đợt 2: Cuộc gọi bất ngờ của vợ ---------- */
let callTimer = null, trickAnswers = [];
function renderCallAnswers(btns, secs, onTimeout) {
  const box = $('call-answers');
  box.innerHTML = '';
  btns.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn big';
    btn.textContent = b.t;
    btn.onclick = () => { Sfx.init(); Sfx.click(); clearInterval(callTimer); b.fn(); };
    box.appendChild(btn);
  });
  const bar = $('call-bar');
  let left = secs * 10;
  clearInterval(callTimer);
  callTimer = setInterval(() => {
    left--;
    bar.style.width = Math.max(0, left / (secs * 10) * 100) + '%';
    if (left <= 0) { clearInterval(callTimer); onTimeout(); }
  }, 100);
}
function triggerCall() {
  if (!trip || phase === 'CALL') return;
  trip.called = true;
  trip.resumePhase = phase;
  phase = 'CALL';
  show('scr-call');
  Sfx.phoneRing(); // chuông "Vợ gọi" dồn dập
  $('call-title').textContent = '📱 Vợ đang gọi...';
  const ct = $('call-text');
  ct.textContent = '"Đang ở đâu đấy?!"';
  ct.className = 'call-text';
  renderCallAnswers([
    { t: '🙏 Nói thật: "Anh đang câu cá..."', fn: () => resolveCall('truth') },
    { t: '😅 Nói dối: "Anh đang họp!"', fn: () => resolveCall('lie') },
  ], 5, () => resolveCall('truth', true));
}
function resolveCall(choice, timeout) {
  clearInterval(callTimer);
  if (choice === 'truth') {
    S.sincerity = (S.sincerity || 0) + 1;
    save();
    if (timeout) addSuspicion(10, 'ấp úng là có tật!');
    else { addSuspicion(10, 'thành thật khai báo'); toast('🙏 Nói thật lòng! Vợ: "Biết điều đấy" (+1 Chân thành)'); }
    resumeFromCall();
  } else if (Math.random() < 0.7) {
    toast('😎 Qua mặt thành công! Tim đập 120 nhưng mặt vẫn tỉnh bơ.');
    Sfx.caught();
    resumeFromCall();
  } else {
    // Bị soi → câu hỏi mẹo
    const q = TRICK_QS[Math.floor(Math.random() * TRICK_QS.length)];
    trickAnswers = q.answers.slice().sort(() => Math.random() - 0.5);
    $('call-title').textContent = '🔍 Vợ nheo mắt...';
    const ct = $('call-text');
    ct.textContent = '"' + q.q + '"';
    ct.className = 'call-text call-q';
    renderCallAnswers(
      trickAnswers.map(a => ({ t: a.t, fn: () => resolveTrick(a.ok) })),
      5, () => resolveTrick(false));
  }
}
function resolveTrick(ok) {
  clearInterval(callTimer);
  if (ok) { toast('😅 Thoát nạn trong gang tấc! Vợ tạm tin.'); Sfx.caught(); }
  else { addSuspicion(40, 'nói dối bị phát hiện!'); Sfx.fail(); }
  resumeFromCall();
}
function resumeFromCall() {
  Sfx.phoneStop(); // dừng chuông khi nghe máy / hết giờ
  phase = (trip && trip.resumePhase) || 'CAST';
  show(null);
  updateHUD();
}

function render() {
  // Tam trang bau troi theo gio thuc + gio vang + thoi tiet phien cau
  const _nd = new Date();
  const skyM = Art.moodFor(_nd.getHours() + _nd.getMinutes() / 60, session.golden, session.weather);
  // Mini-game đào giun: vẽ vườn đất trên canvas chính
  if (phase === 'DIG' && digS) {
    Art.drawDigGarden(ctx, {
      W: L.W, H: L.H, t: tG, sky: skyM,
      worms: digS.worms, hoes: digS.hoes, parts: digS.parts, marks: digS.marks,
      decor: digS.decor, bucket: digBucket(),
    });
    return;
  }
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
  const ap = anglerPos(), ak = L.portrait ? 1 : 0.72; // tỉ lệ vẽ cần thủ
  Art.drawScene(ctx, tG, {
    W: L.W, H: L.H,
    map: S.map, sky: skyM, rodType: rod().type,
    spotLayout: ((S.map === 'song' || S.map === 'dampha') && spot) ? { decor: spot.decor } : null,
    tide: S.map === 'dampha' ? { lvl: tideState().level } : null,
    angler: ap, rodBase: { x: ap.x + 40 * ak, y: ap.y - 100 * ak },
    fightFish: phase === 'FIGHT' ? { show: true, x: fx, y: fy, s: (fish && fish.big) ? 1.5 : 1 } : null,
    // Đồ đựng cá (mode Trốn vợ): vẽ xô/thùng câu trên bờ, rọng lưới ở mép nước
    container: (function () {
      if (S.mode !== 'wife' || !isFishing()) return null;
      const cp = containerPos();
      const shx = contShakeT > 0 ? Math.sin(tG * 40) * 7 * contShakeT : 0;
      return { id: S.activeContainer, x: cp.x + shx, y: cp.y, load: contLoad() };
    })(),
    float: showFloat ? { x: fx, y: fy, show: true, dy: fdy, tilt } : { show: false },
    rodBend, splashes, drops, ripples, biteFlash,
    castHint: phase === 'CAST',
    maxCastX: castMinX() + rod().cast * castRange(),
    hint: (phase === 'CAST' || phase === 'WAIT' || phase === 'BITE') ? phaseHint : null,
    strike: phase === 'STRIKE' ? strike : null,
    fight: phase === 'FIGHT' ? { tension: fight.tension, zc: fight.zc, zw: fight.zw, prog: Math.min(fight.prog, 1) } : null,
    spots: phase === 'SPOT' ? spotsFor(S.map).map(s => {
      const p = spotPos(s);
      return {
        x: p.x, y: p.y, name: s.name, flow: s.flow, desc: s.desc,
        fish: s.fish.map(fid => { const f = FISH.find(x => x.id === fid); return f ? f.name : fid; }).join(', ')
      };
    }) : null,
    spotHint: phase === 'SPOT' ? hint : null,
  });
}

function loop(ts) {
  const dt = Math.min((ts - lastTs) / 1000 || 0, 0.05);
  lastTs = ts; tG += dt;
  update(dt);
  render();
  updateActionBar(); // đồng bộ cụm nút portrait theo phase (có cache, rẻ)
  // Thể lực hồi dần theo thời gian thực kể cả khi đang mở game
  stamRegenT += dt;
  if (stamRegenT >= 5) { stamRegenT = 0; regenStamina(); }
  // Trụ cột 1: ambient (dế/ếch/mưa) pha trộn theo mood, kiểm tra mỗi 4s
  ambT += dt;
  if (ambT >= 4) {
    ambT = 0;
    const _d = new Date();
    Sfx.setAmbient(Art.moodFor(_d.getHours() + _d.getMinutes() / 60, session.golden, session.weather), S.map);
  }
  // Đợt 2: cập nhật đồng hồ game trên HUD theo từng phút
  if (S.mode === 'wife' && trip && ! $('hud-clock').classList.contains('hidden')) {
    const cm = Math.floor(trip.gameMin);
    if (cm !== lastClockMin) {
      lastClockMin = cm;
      $('hud-clock').textContent = '🕐 ' + fmtClock(trip.gameMin);
    }
  }
  // Trụ 2: cập nhật chip thủy triều khi đổi pha
  if (isFishing() && S.map === 'dampha' && ! $('hud-tide').classList.contains('hidden')) {
    const tp = tideState().phase;
    if (tp !== lastTidePhase) {
      lastTidePhase = tp;
      const ts = tideState();
      $('hud-tide').textContent = ts.icon + ' ' + ts.name;
      toast(ts.icon + ' ' + ts.name + ' — mực nước đang thay đổi!');
    }
  }
  requestAnimationFrame(loop);
}

/* ---------- Bảng xếp hạng (Vercel Blob, /api/leaderboard) ---------- */
const LB_URL = '/api/leaderboard';
const LB_MEDAL = ['🥇', '🥈', '🥉'];
function lbName() { return (S.playerName || '').trim(); }
function randomAnglerName() { return 'Cần thủ ' + Math.floor(100 + Math.random() * 900); }
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function enterLeaderboard() {
  phase = 'LB';
  show('scr-leaderboard');
  if (!lbName()) enterName(true); // lần đầu: hỏi tên trước
  else loadBoard();
}
// Nhập/đổi tên cần thủ. fromBoard=true: xong thì quay lại tải BXH.
let lbNameReturn = false;
function enterName(fromBoard) {
  lbNameReturn = !!fromBoard;
  $('lb-name-input').value = lbName() || randomAnglerName();
  show('scr-name');
  setTimeout(() => { try { $('lb-name-input').select(); } catch (e) {} }, 60);
}
async function loadBoard() {
  const st = $('lb-status'), list = $('lb-list'), me = $('lb-me');
  st.classList.remove('hidden');
  list.innerHTML = '<div class="lb-row skel"></div><div class="lb-row skel"></div><div class="lb-row skel"></div><div class="lb-row skel"></div><div class="lb-row skel"></div>';
  st.textContent = '⏳ Đang tải bảng xếp hạng...';
  me.classList.add('hidden');
  try {
    const r = await fetch(LB_URL, { cache: 'no-store' });
    if (!r.ok) throw new Error('http ' + r.status);
    const data = await r.json();
    renderBoard(data.top || []);
  } catch (e) {
    // Chế độ offline: báo nhẹ, game vẫn chơi bình thường
    st.textContent = '📡 Chưa kết nối được bảng xếp hạng — chơi tiếp nhé!';
  }
}
function renderBoard(top) {
  const st = $('lb-status'), list = $('lb-list'), me = $('lb-me');
  st.classList.add('hidden');
  const name = lbName();
  if (!top.length) {
    list.innerHTML = '<p class="subtitle">Chưa có ai trên bảng — bạn sẽ là người đầu tiên? 🎣</p>';
  } else {
    list.innerHTML = top.map((e, i) => {
      const isMe = e.name === name;
      const pos = LB_MEDAL[i] || ('<span class="lb-rank">' + (i + 1) + '</span>');
      return '<div class="lb-row' + (isMe ? ' lb-me-row' : '') + '">' +
        '<span class="lb-pos">' + pos + '</span>' +
        '<span class="lb-who"><b>' + escHtml(e.name) + '</b>' +
        '<small>⭐ Cấp ' + (e.level || 1) + ' • 🐟 ' + (Number(e.bigFish) || 0).toFixed(2) + ' kg</small></span>' +
        '<span class="lb-score">' + fmt(e.score) + '</span>' +
        '</div>';
    }).join('');
  }
  const mine = top.findIndex(e => e.name === name);
  me.classList.remove('hidden');
  me.innerHTML = '🎣 <b>' + escHtml(name) + '</b> — tổng đã kiếm: <b>' + fmt(S.totalEarned || 0) + '</b>' +
    ' • cá to nhất: <b>' + (Number(S.biggestFish) || 0).toFixed(2) + ' kg</b>' +
    (mine >= 0 ? ' • hạng <b>#' + (mine + 1) + '</b> 🏅' : '');
}
// Gửi điểm ngầm sau mỗi lần bán cá — chỉ gửi khi điểm cao hơn lần trước, thất bại bỏ qua lặng lẽ
let lbSending = false;
async function lbAfterSell() {
  const cur = S.totalEarned || 0;
  if (cur <= 0 || cur <= (S.lbSent || 0)) return;
  if (!lbName() || lbSending) return;
  lbSending = true;
  try {
    const r = await fetch(LB_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: lbName(), score: cur, bigFish: S.biggestFish || 0, level: level() }),
    });
    if (r.ok) { S.lbSent = cur; save(); }
  } catch (e) { /* offline: thử lại lần bán sau */ }
  lbSending = false;
}
bindClick('btn-to-leaderboard', enterLeaderboard);
bindClick('btn-lb-back', enterMenu);
bindClick('btn-lb-reload', () => loadBoard());
bindClick('btn-lb-name', () => enterName(false));
bindClick('btn-name-ok', () => {
  const v = $('lb-name-input').value.replace(/[<>&"']/g, '').trim().slice(0, 20);
  if (!v) { toast('Nhập tên đi bạn ơi!'); return; }
  S.playerName = v; save();
  if (lbNameReturn) { lbNameReturn = false; enterLeaderboard(); }
  else { enterMenu(); toast('Đã đổi tên thành ' + v + '!'); }
});

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
    get trip() { return trip; },
    level, mapUnlocked, ensureDailyQuests, questEvent, pickFish,
    addSuspicion, banned, banDaysLeft, buffActive, goWifeHome, offerFish,
    bribe(id) { buyBribe(id); },
    goHomeNow() { goWifeHome(); },
    startWife() { startWifeTrip(); },
    setSave(patch) { Object.assign(S, patch); save(); },
    ui() { renderWifeHome(); updateHUD(); },
    shop() { enterShop(); },
    setGameMin(m) { if (trip) trip.gameMin = m; },
    forceCall() { if (trip) { trip.called = false; trip.willCall = true; trip.callAt = 0; } },
    callAnswer(c) { if (phase === 'CALL') resolveCall(c); },
    trickAnswer(i) { if (phase === 'CALL' && trickAnswers[i]) resolveTrick(trickAnswers[i].ok); },
    trickCount() { return trickAnswers.length; },
    trickOkIndex() { return trickAnswers.findIndex(a => a.ok); },
    confirmHome() { confirmGoHome(); },
    kitchenWin() { // test: bấm đúng hết nguyên liệu
      document.querySelectorAll('#kitchen-grid .kit-cell').forEach(c => {
        if (KITCHEN_GOOD.includes(c.textContent) && !c.classList.contains('done')) c.click();
      });
    },
    forceBite() { if (phase === 'WAIT') waitT = 0; },
    forceStrikeWin() { if (strike) strike.pos = strike.zc; },
    forceFightWin() { if (fight) fight.prog = 1; },
    forceFightLost() { fightLost('Đứt dây! (test)'); },
    selectSpot(i) { spot = (spotsFor(S.map).length ? spotsFor(S.map) : RIVER_SPOTS)[i]; },
    enterSpot(i) { spot = (spotsFor(S.map).length ? spotsFor(S.map) : RIVER_SPOTS)[i]; enterCast(); },
    // Đồ đựng cá (test)
    cont() { return { containers: S.containers.slice(), active: S.activeContainer, kept: S.keptFish.slice(), cap: contDef().cap }; },    contKg() { return keptKg(); }, contLoad() { return contLoad(); },
    // Thể lực + đồ ăn (test)
    stam() { return { v: S.stamina, ts: S.staminaTs }; },
    setStam(v) { S.stamina = v; save(); updateHUD(); },
    setStamTs(ts) { S.staminaTs = ts; save(); },
    regen() { regenStamina(); return S.stamina; },
    food() { return Object.assign({}, inv().food); },
    buyFoodTest(id) { return buyFood(id); },
    eatFoodTest(id) { return eatFood(id); },
    openFood() { enterFood(); },
    castAt(x, y) { doCast(x, y); },
    digNow(fromShop) { enterDig(!!fromShop); },
    fishAt(mapId) { enterFish(mapId); },
    digWorms() { return (digS && digS.worms || []).filter(w => !w.caught).map(w => ({ x: w.x, y: w.y })); },
    digAt(x, y) { digTap({ x, y }); },
    dug() { return digS ? digS.dug : -1; },
    endDigNow() { if (digS) { const b = document.getElementById('btn-dig-end'); if (b) b.click(); } },
    setKept(arr) { S.keptFish = arr; save(); },
    sellKeptNow() { sellKept(); },
    openContainer() { enterContainer(); },
    keepTest(fishId, weight, price) { // test: giả lập câu được 1 con rồi cho vào đồ đựng
      const f = FISH.find(x => x.id === fishId) || FISH[0];
      fish = f; lastWeight = weight; lastPrice = (price == null ? Math.round(f.price * weight) : price);
      return keepFishToContainer();
    },
    // Độ bền cần + túi/kho (test)
    storeBag() { return { store: S.store, bag: S.bag, rodSeq: S.rodSeq }; },
    setBag(b) { S.bag = Object.assign({}, S.bag, b); save(); },
    setStore(st) { S.store = Object.assign({}, S.store, st); save(); },
    wearRod(n) { wearRod(n); },
    checkRodBreak(ctx) { return checkRodBreak(ctx); },
    repairCostOf(id, cond) { const r = RODS.find(x => x.id === id); return repairCost(r, cond); },
    rodCond() { const i = activeRodInst(); return i ? i.cond : null; },
    packRod(iid) { return packRod(iid); },
    bagStep(k, d) { bagStep(k, d); },
    bagFoodStep(id, d) { bagFoodStep(id, d); },
    returnBagToStore() { returnBagToStore(); },
    rodWarnedFlag() { return rodWarned; },
    spotsInfo() { return RIVER_SPOTS.map(x => ({ id: x.id, ax: x.ax, ay: x.ay, pax: x.pax, pay: x.pay, decor: x.decor })); },
    damphaSpotsInfo() { return DAMPH_SPOTS.map(x => ({ id: x.id, ax: x.ax, ay: x.ay, pax: x.pax, pay: x.pay, decor: x.decor })); },
    tide() { return tideState(); },
    fightInfo() { return fight ? { pull: fish.pull, surgeMag: fight.surgeMag, surgeTR: fight.surgeTR, jump: !!fight.jump, fill: fight.fill } : null; },
    baitMultFor(fishId, baitId) { const f = FISH.find(x => x.id === fishId); return baitBiteMult(f, baitId); },
    buyPremBait(id) { return buyPremiumBait(id); },
    baitInfo() { return { bait: S.bait, bag: { moiU: S.bag.moiU, deChui: S.bag.deChui, lure: S.bag.lure }, store: { moiU: S.store.moiU, deChui: S.store.deChui, lure: S.store.lure } }; },
    bagCaps() { return BAG_CAPS; },
    showPrepare() { enterPrepare(); },
    showShop() { enterShop(); },
  };
}

enterMenu();
updateLayout(); // chốt logical size canvas + body.is-portrait trước frame đầu
requestAnimationFrame(loop);

// Hook cho automated test (chỉ đọc state, không ảnh hưởng gameplay)
window.__dbg = {
  phase: () => phase,
  strike: () => strike ? { pos: strike.pos, zc: strike.zc, zw: strike.zw } : null,
  fight: () => fight ? { tension: fight.tension, zc: fight.zc } : null,
  lb: () => ({ name: lbName(), totalEarned: S.totalEarned || 0, lbSent: S.lbSent || 0,
               biggestFish: S.biggestFish || 0 }),
  dig: () => (typeof digS !== 'undefined' && digS ? {
    dug: digS.dug, timeLeft: digS.timeLeft,
    worms: digS.worms.filter(w => !w.caught).map(w => Art.wormHead(w, tG)),
    hoes: digS.hoes.length, parts: digS.parts.length,
  } : null),
};

})();
