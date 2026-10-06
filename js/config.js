/* ===== Cấu hình dữ liệu game: cần, mồi, cá, map, nhiệm vụ ===== */
'use strict';

// Cần: cast = tầm quăng (0..1), sense = độ nhạy cắn (0..1), line = độ bền dây (0..1)
// type: 'dai' | 'may' — dòng cần. reqLevel: cấp cần thủ tối thiểu để mua.
const RODS = [
  { id: 'tre',       name: 'Cần tre',       type: 'dai', price: 0,    cast: 0.55, sense: 0.30, line: 0.40, reqLevel: 1,
    desc: 'Cần tre truyền thống. Quăng gần, tín hiệu mờ.' },
  { id: 'truc',      name: 'Cần trúc',      type: 'dai', price: 25000,   cast: 0.66, sense: 0.44, line: 0.54, reqLevel: 1,
    desc: 'Nhẹ và dẻo hơn tre, quăng xa hơn.' },
  { id: 'composite', name: 'Cần composite', type: 'dai', price: 100000,  cast: 0.80, sense: 0.60, line: 0.70, reqLevel: 1,
    desc: 'Cứng cáp, tín hiệu cắn rõ ràng.' },
  { id: 'carbon',    name: 'Cần carbon',    type: 'dai', price: 600000, cast: 0.97, sense: 0.80, line: 0.92, reqLevel: 1,
    desc: 'Hàng xịn của đại lão. Quăng xa, nhạy, khỏe.' },
  { id: 'may24',     name: 'Cần máy 2.4m',  type: 'may', price: 250000,  cast: 0.85, sense: 0.60, line: 0.75, reqLevel: 2,
    desc: 'Cần spinning đa năng. Quăng xa, khỏe, hợp câu sông.' },
  { id: 'may30',     name: 'Cần máy 3.0m bạo lực', type: 'may', price: 1500000, cast: 0.95, sense: 0.40, line: 0.95, reqLevel: 8,
    desc: 'Hàng săn cá khủng. Rất cứng rất khỏe, hơi kém nhạy.' },
];

// pattern cắn: nhap2 | nhap3 | nhap1 | chimcham | day | dotngot | rung | loi
//             nganh2 | loinhanh | rungdeu | nhapnhe | hut | runtan (mới cho cá sông)
// diff: độ khó bo cá (0..1). w: trọng số xuất hiện. big: cá to, thích chỗ xa.
// map: 'ao' | 'song'. bait: mồi ưa thích ('giun' | 'cam') — dùng đúng mồi tỉ lệ cắn +25%.
const FISH = [
  // --- Ao làng (MVP) ---
  { id: 'ro-phi',    name: 'Rô phi',    min: 0.2, max: 0.8, price: 7000, pattern: 'nhap2',    diff: 0.25, w: 3, color: '#5b7fa6', big: false, map: 'ao', bait: 'giun', escape: 0.25 },
  { id: 'ro-dong',   name: 'Rô đồng',   min: 0.1, max: 0.4, price: 8000, pattern: 'nhap3',    diff: 0.20, w: 3, color: '#7a8c5f', big: false, map: 'ao', bait: 'giun', escape: 0.12 },
  { id: 'sac',       name: 'Cá sặc',    min: 0.1, max: 0.3, price: 10000, pattern: 'chimcham', diff: 0.15, w: 3, color: '#c2a15a', big: false, map: 'ao', bait: 'giun', escape: 0.10 },
  { id: 'dieu-hong', name: 'Diêu hồng', min: 0.3, max: 1.2, price: 11000, pattern: 'nhap1',    diff: 0.30, w: 2, color: '#d4697e', big: false, map: 'ao', bait: 'cam', escape: 0.30 },
  { id: 'chep',      name: 'Cá chép',   min: 0.5, max: 2.5, price: 14000, pattern: 'day',      diff: 0.45, w: 2, color: '#c98a3d', big: false, map: 'ao', bait: 'cam', escape: 0.40 },
  { id: 'chim',      name: 'Cá chim',   min: 0.5, max: 2.0, price: 13000, pattern: 'dotngot',  diff: 0.55, w: 2, color: '#8e8e93', big: true,  map: 'ao', bait: 'cam', escape: 0.55 },
  { id: 'tre-fish',  name: 'Cá trê',    min: 0.4, max: 3.0, price: 17000, pattern: 'rung',     diff: 0.50, w: 1, color: '#4a4a52', big: true,  map: 'ao', bait: 'giun', escape: 0.65 },
  { id: 'tai-tuong', name: 'Tai tượng', min: 0.8, max: 4.0, price: 19000, pattern: 'loi',      diff: 0.70, w: 1, color: '#6d7f5e', big: true,  map: 'ao', bait: 'giun', escape: 0.55 },
  // --- Sông quê (Đợt 1) ---
  { id: 'nganh',      name: 'Cá ngạnh',   min: 0.5, max: 3.0, price: 14000, pattern: 'nganh2',   diff: 0.60, w: 2, color: '#8a6d3b', big: true,  map: 'song', bait: 'giun', escape: 0.60 },
  { id: 'thac-lac',   name: 'Cá thác lác',min: 0.3, max: 1.2, price: 17000, pattern: 'loinhanh', diff: 0.40, w: 2, color: '#b8c4a8', big: false, map: 'song', bait: 'giun', escape: 0.45 },
  { id: 'basa',       name: 'Cá basa',    min: 1.0, max: 6.0, price: 10000, pattern: 'chimcham', diff: 0.40, w: 2, color: '#9fb3c8', big: true,  map: 'song', bait: 'cam', escape: 0.45 },
  { id: 'lang-song',  name: 'Cá lăng',    min: 1.0, max: 8.0, price: 16000, pattern: 'dotngot',  diff: 0.75, w: 1, color: '#5a5a6e', big: true,  map: 'song', bait: 'giun', escape: 0.75 },
  { id: 'tra',        name: 'Cá tra',     min: 1.0, max: 5.0, price: 8000, pattern: 'rungdeu',  diff: 0.40, w: 2, color: '#7d8fa3', big: true,  map: 'song', bait: 'cam', escape: 0.50 },
  { id: 'ca-he',      name: 'Cá he',      min: 0.2, max: 0.8, price: 7000, pattern: 'nhapnhe',  diff: 0.20, w: 3, color: '#c9b458', big: false, map: 'song', bait: 'cam', escape: 0.18 },
  { id: 'bong-tuong', name: 'Bống tượng', min: 0.2, max: 1.0, price: 18000, pattern: 'hut',      diff: 0.40, w: 2, color: '#6b5b45', big: false, map: 'song', bait: 'giun', escape: 0.25 },
  { id: 'ca-chot',    name: 'Cá chốt',    min: 0.1, max: 0.5, price: 6000, pattern: 'runtan',    diff: 0.20, w: 3, color: '#8c8c88', big: false, map: 'song', bait: 'giun', escape: 0.15 },
];

// Mồi: wait = thời gian chờ cắn (giây), w = trọng lượng (mồi nặng ít bị trôi)
const BAITS = {
  giun: { name: 'Giun đất', wait: [4, 12],   w: 0.30 },
  cam:  { name: 'Cám câu',  wait: [2.5, 7],  w: 0.55 },
};
const CAM_PRICE = 500;   // 500đ / gói
const CAM_PACK = 10;     // 10 viên / gói
const START_MONEY = 200;

/* ===== Thanh thể lực =====
   max 100. Tốn: quăng cần −2, mỗi giun đào được −1, bo cá thắng −(6+round(diff×8)),
   bo thua −4, giật hụt −1, nấu ăn thắng −5. Hết (=0): không quăng/đào được.
   Hồi: +1 mỗi 2 phút thời gian thực; nút "Nghỉ ngơi" +40, tối đa 3 lần/ngày. */
const STAMINA = {
  max: 100, regenSec: 120, restGain: 40, restPerDay: 3, warnAt: 20,
  cast: 2, fightLost: 4, strikeMiss: 1, kitchen: 5,
};

// Đào giun: time = giây mỗi lượt, popMs = khoảng cách giun trồi, activeMs = thời gian giun ở lại,
// yield = số giun mỗi lần chạm trúng, perDay = số lượt đào tối đa mỗi ngày (giới hạn độ khó)
const DIG = { time: 20, popMs: 800, activeMs: 650, minYield: 1, maxYield: 2, perDay: 3 };

// Map
const MAPS = [
  { id: 'ao',   name: 'Ao làng', icon: '🏡', desc: 'Ao quê yên bình — nơi học câu đài cơ bản.' },
  { id: 'song', name: 'Sông quê', icon: '🌊', desc: 'Dòng chảy, gầm cầu, bãi bồi — học câu đáy sông.' },
];
function mapName(id) { const m = MAPS.find(m => m.id === id); return m ? m.icon + ' ' + m.name : id; }

// Điểm câu ở sông quê: flow = độ xiết dòng (0..1)
const RIVER_SPOTS = [
  { id: 'bendo',  name: 'Bến đò',  x: 200, y: 335, flow: 0.2, desc: 'Nước nông 1–2m, dòng êm — dễ câu.',
    fish: ['ro-phi', 'thac-lac', 'ca-he'] },
  { id: 'gamcau', name: 'Gầm cầu', x: 480, y: 305, flow: 0.5, desc: 'Hố sâu 4–6m, nước quẩn — cá to trú.',
    fish: ['tre-fish', 'nganh', 'lang-song'] },
  { id: 'baiboi', name: 'Bãi bồi', x: 760, y: 350, flow: 0.8, desc: 'Dòng xiết, đáy cát — thử thách!',
    fish: ['basa', 'tra', 'bong-tuong', 'ca-chot'] },
];
function spotById(id) { return RIVER_SPOTS.find(s => s.id === id); }

// Nhiệm vụ ngày: type — catch_any | catch_species | big_fish | use_baits | spots | catch_map | sell | streak
const QUEST_POOL = [
  { qid: 'q_catch5',  text: 'Câu 5 con cá bất kỳ',                 type: 'catch_any',     target: 5, reward: { money: 500 } },
  { qid: 'q_rophi3',  text: 'Câu 3 con rô phi',                    type: 'catch_species', species: 'ro-phi', target: 3, reward: { money: 400 } },
  { qid: 'q_big2',    text: 'Câu được cá từ 2kg trở lên',          type: 'big_fish',      minW: 2, target: 1, reward: { money: 800 } },
  { qid: 'q_trybait', text: 'Câu bằng cả 2 loại mồi (giun và cám)', type: 'use_baits',     target: 2, reward: { cam: 10 } },
  { qid: 'q_2spots',  text: 'Câu ở 2 điểm khác nhau tại sông quê', type: 'spots',         target: 2, reward: { money: 600 } },
  { qid: 'q_river5',  text: 'Câu 5 con cá ở sông quê',             type: 'catch_map',     map: 'song', target: 5, reward: { money: 700 } },
  { qid: 'q_sell3',   text: 'Bán 3 con cá',                        type: 'sell',          target: 3, reward: { money: 300 } },
  { qid: 'q_streak3', text: 'Bo cá thành công 3 lần liên tiếp',    type: 'streak',        target: 3, reward: { money: 900 } },
  { qid: 'q_chep1',   text: 'Câu 1 con cá chép',                   type: 'catch_species', species: 'chep', target: 1, reward: { money: 500 } },
];
const QUESTS_PER_DAY = 3;

function fmt(n) { return Math.round(n).toLocaleString('vi-VN') + 'đ'; }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function rnd(a, b) { return a + Math.random() * (b - a); }
function todayStr() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function addDaysStr(ds, n) {
  const p = ds.split('-').map(Number);
  const d = new Date(p[0], p[1] - 1, p[2] + n);
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
function isGoldenHour() { const h = new Date().getHours(); return (h >= 5 && h < 7) || (h >= 16 && h < 18); }

/* ===== Hệ thống đồ đựng cá — chế độ Trốn vợ đi câu =====
   Luật: câu được cá ở mode vợ KHÔNG bán ngay ở bờ — chỉ "Cho vào đồ đựng"
   hoặc "Phóng sinh". Về nhà mới được Bán hết / Dâng vợ / Nấu ăn.
   (Chế độ Câu tự do giữ nguyên: bán ngay ở bờ.) */
// Đồ đựng cá (mode Trốn vợ) — sức chứa tính theo KG (cap), vì cá nhiều cỡ.
// Rọng: chứa nhiều nhất nhưng QUÁ TẢI có thể VỠ (vượt 150% tải → vỡ chắc chắn, xổng hết).
// Xô: quá tải cá KHỎE có thể NHẢY RA (vượt 130% → chắc chắn vài con nhảy, không xổng hết).
// Thùng câu: không bao giờ hỏng/xổng nhưng tải CỨNG — không nhồi thêm được.
const CONTAINERS = [
  { id: 'xo',    name: 'Xô ghẻ',   cap: 6,  price: 0,     place: 'bank',
    icon: '🪣', desc: 'Xô cũ mèm — để trên bờ. Chứa 6kg. Quá tải: cá khỏe có thể nhảy ra!' },
  { id: 'ro',    name: 'Rọng cá',  cap: 18, price: 40000,  place: 'water',
    icon: '🥅', desc: 'Rọng lưới thả cạnh bờ, ngập xuống nước — cá sống khỏe. Chứa 18kg. Quá tải: RỌNG CÓ THỂ VỠ, xổng hết cá!' },
  { id: 'thung', name: 'Thùng câu', cap: 30, price: 150000,  place: 'bank',
    icon: '🧰', desc: 'Thùng câu có nắp ngồi, để trên bờ. Chứa 30kg, không bao giờ hỏng — nhưng đầy là hết chỗ.' },
];
// ===== Rủi ro đồ đựng cá — hàm thuần (không DOM), test được bằng node =====
// load = tổng kg đang giữ / cap. Mọi công thức ghi rõ để dễ cân bằng.
function contLoadKg(keptKg, cap) { return cap > 0 ? keptKg / cap : 0; }
// Mức rủi ro hiện tại: 'ok' | 'risk' | 'break' (rọ ≥150%: vỡ chắc chắn)
//                      'jump-many' (xô ≥130%: chắc chắn vài con nhảy) | 'full' (thùng)
function contRiskLevel(id, load) {
  if (load <= 1) return 'ok';
  if (id === 'ro') return load >= 1.5 ? 'break' : 'risk';
  if (id === 'xo') return load >= 1.3 ? 'jump-many' : 'risk';
  return 'full';
}
// Tỉ lệ VỠ RỌNG khi cho thêm cá lúc quá tải. load≥1.5 → 1 (chắc chắn vỡ).
// Công thức: 10% + 160% × (độ vượt tải). Vd tải 110% → 26%, 125% → 50%, 140% → 74%.
function roBreakChance(load) {
  if (load >= 1.5) return 1;
  if (load <= 1) return 0;
  return Math.min(0.9, 0.10 + (load - 1) * 1.6);
}
// Tỉ lệ CÓ CÁ NHẢY KHỎI XÔ khi cho thêm cá lúc quá tải (mất 1 con khỏe nhất).
// Công thức: 15% + 200% × (độ vượt tải). Vd tải 110% → 35%, 120% → 55%.
function xoJumpChance(load) {
  if (load <= 1) return 0;
  return Math.min(0.85, 0.15 + (load - 1) * 2.0);
}
// Roll định kỳ mỗi 30s lúc WAIT khi đang quá tải — nhẹ hơn roll lúc cho cá vào.
function contIdleChance(id, load) {
  if (load <= 1) return 0;
  if (id === 'ro') return Math.min(0.5, (load - 1) * 0.8);
  if (id === 'xo') return Math.min(0.6, (load - 1) * 1.2);
  return 0;
}
function fishEscape(fishId) { const f = FISH.find(x => x.id === fishId); return f ? (f.escape || 0) : 0; }
// Chọn n con khỏe nhất để nhảy ra (escape cao nhất + nhiễu nhẹ cho tự nhiên)
function pickJumpers(kept, n) {
  return kept
    .map((f, i) => ({ f: f, i: i, s: (fishEscape(f.fishId) || 0) + Math.random() * 0.15 }))
    .sort((a, b) => b.s - a.s)
    .slice(0, Math.max(0, Math.min(n, kept.length)));
}
function containerById(id) { return CONTAINERS.find(c => c.id === id) || CONTAINERS[0]; }

// Câu hài khi cho cá vào đồ đựng (mode Trốn vợ)
const FUNNY_KEEP = [
  'Cho vào {cont}! Tối nay có cá kho tộ... à nhầm, để vợ quyết định 😄',
  '{cont} lại thêm 1 em! Đầy nhanh thế này vợ lại nghi... 🤫',
  'Vào {cont} nằm ngoan nhé, chiều về nhà mình tính tiếp 🐟',
  'Cất kỹ vào {cont} — đây là "hàng cấm" đấy nhé! 😎',
  '{cont} nặng thêm chút rồi! Tay nghề lên level 📈',
  'Em vào {cont} trước đi, anh câu thêm vài em nữa rồi về 🏠',
];

/* ===== Đợt 2: Trốn vợ đi câu ===== */

// Câu hài khi bán cá trong mode Trốn vợ ({price} = số tiền bán được)
const FUNNY_SELL = [
  'Bán được {price}! Vợ hỏi tiền đâu... bảo là thưởng chuyên cần công ty 😎',
  'Tiền bán cá giấu vào ví riêng — nghệ thuật quản lý tài chính gia đình 🎩',
  '+{price} vào quỹ đen! Vợ mà biết thì... thôi đừng để vợ biết 🤫',
  'Bán cá lấy tiền, tiền mua cần mới, cần mới câu cá to — vòng lặp hoàn hảo 🔄',
  'Con cá này đổi được {price} — đủ mua bó hoa chuộc lỗi sau 😅',
  'Bán ngay kẻo vợ thấy lại bảo mang về nấu... ơ mà nấu cũng ngon nhỉ? Thôi bán! 💸',
  'Tiền tươi thóc thật! Cất kỹ vào túi quần đùi huyền thoại 👖',
  '{price} về tay! Tối nay ngủ ngon, mai tính tiếp 😴',
];
// Câu hài khi mang cá về nịnh vợ
const FUNNY_GIFT = [
  'Để dành con này về nấu cho vợ — điểm cộng to đùng 😍',
  'Cá ngon phải để vợ ăn trước, đó là đạo lý làm chồng 🐟',
  'Mang về 1 con, vợ vui 1 tuần — đầu tư sinh lời nhất quả đất 📈',
  'Con này mà chiên giòn thì vợ quên luôn chuyện mình đi câu lén 🤤',
  '"Anh đi câu là để lo bữa tối cho em đó!" — câu này thuộc lòng rồi 💬',
  'Giỏ cá đầy là bằng chứng yêu thương, không phải bằng chứng trốn vợ 😇',
  'Vợ ăn ngon → chồng được đi câu tiếp. Triết lý đơn giản mà sâu sắc 🧠',
];
// Câu hài khi dùng tiền nịnh vợ lúc bị cấm câu
const FUNNY_BRIBE = [
  'Vợ cầm túi xách: "Tạm tha, lần sau còn nữa là biết tay!" 😏',
  'Trà sữa tới tay, vợ hết giận một nửa — nửa còn lại để dành 😌',
  '"Hoa đẹp như em... à nhầm, em đẹp như hoa!" — vợ cười rồi kìa 🌸',
  'Son mới thoa, vợ soi gương: "Cũng biết điều đấy!" 💄',
  'Túi xách xịn thế này thì... cấm câu còn 0 ngày nhé chồng 😎',
  'Vợ lườm: "Tiền ở đâu ra?" — "Tiền... tiết kiệm ăn sáng đó em!" 😅',
];
// Câu hài khi phóng sinh
const FUNNY_RELEASE = [
  'Thả em về với sông... kiếp sau đừng cắn câu anh nữa nhé 🙏',
  'Phóng sinh tích đức — mai cá to tự tìm đến 🍀',
  'Đi đi em, về kể với đàn cá là ở đây có ông chú tốt bụng 🐟',
  'Thả 1 con hôm nay, mai câu được 10 con — luật nhân quả của cần thủ ⚖️',
  'Nhẹ nhàng thôi... ừ, bơi đi, đừng quay đầu lại 👋',
  'Phóng sinh xong thấy lòng thanh thản — chắc vợ cũng đang vui ở nhà 😌',
  'Em tự do rồi! Nhớ rủ thêm bạn bè to con đến cắn câu anh nhé 😄',
];
function funny(arr, vars) {
  let s = arr[Math.floor(Math.random() * arr.length)];
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}

// Câu hỏi mẹo khi nói dối bị "soi" — answers: [{t, ok}]
const TRICK_QS = [
  { q: 'Thế sao mẹ nghe có tiếng nước ào ào?', answers: [
    { t: 'À... vòi nước công ty bị rò!', ok: false },
    { t: 'Em nghe nhầm đấy, anh đang ở quán cà phê!', ok: true } ] },
  { q: 'Họp gì mà có tiếng chim hót?', answers: [
    { t: 'Công ty mới lắp loa thiên nhiên cho đỡ stress!', ok: true },
    { t: 'À... anh mở YouTube tiếng chim cho dễ ngủ!', ok: false } ] },
  { q: 'Sao áo anh có mùi tanh thế?', answers: [
    { t: 'Trưa nay ăn cá kho, dính vào áo!', ok: true },
    { t: 'Mùi... nước hoa mới đó em!', ok: false } ] },
  { q: 'Đang họp sao lại thở gấp thế?', answers: [
    { t: 'Anh vừa chạy lên 5 tầng vì thang máy hỏng!', ok: true },
    { t: 'Họp căng thẳng quá em ạ!', ok: false } ] },
];

// Quà tặng vợ trong shop "Quà cho vợ"
const WIFE_GIFTS = [
  { id: 'tra-sua', icon: '🧋', name: 'Trà sữa',   price: 600,  happy: 10, desc: 'Vợ cười tít mắt! Hạnh phúc +10 😍' },
  { id: 'hoa',     icon: '💐', name: 'Bó hoa',     price: 1000, happy: 15, desc: 'Hoa đẹp như vợ! Hạnh phúc +15 🌸' },
  { id: 'son',     icon: '💄', name: 'Son môi',    price: 1600, happy: 20, desc: 'Vợ thoa son đi chơi với bạn! Hạnh phúc +20 💃' },
  { id: 'tui',     icon: '👜', name: 'Túi xách',   price: 4000, happy: 30, desc: 'Vợ ôm túi cười cả ngày! Hạnh phúc +30 🥰' },
];

// Quà chuộc lỗi khi bị cấm câu (trừ nghi ngờ — nghi ngờ < 80 là được gỡ cấm ngay)
const BRIBE_GIFTS = [
  { id: 'tra-sua', icon: '🧋', name: 'Trà sữa',   price: 600,  down: 3,  happy: 2, desc: 'Vợ bớt giận chút xíu! Nghi ngờ -3 😌' },
  { id: 'hoa',     icon: '💐', name: 'Bó hoa',     price: 1000, down: 6,  happy: 3, desc: 'Vợ mỉm cười! Nghi ngờ -6 🌸' },
  { id: 'son',     icon: '💄', name: 'Son môi',    price: 1600, down: 10, happy: 4, desc: 'Vợ hết giận kha khá! Nghi ngờ -10 💄' },
  { id: 'tui',     icon: '👜', name: 'Túi xách',   price: 4000, down: 25, happy: 8, desc: 'Vợ nguôi giận hẳn! Nghi ngờ -25 😍' },
];

// Nguyên liệu đúng cho mini-game "Vào bếp" (30s)
const KITCHEN_GOOD = ['🐟', '🥬', '🫚', '🧂'];
const KITCHEN_BAD  = ['🌶️', '🍋', '🧄', '🥥'];
const KITCHEN_TIME = 30;

const WIFE = {
  startHour: 15,            // chuyến bắt đầu lúc 15h giờ game
  deadlineMin: 17 * 60, deadlineMax: 19 * 60, // giờ giới nghiêm ngẫu nhiên
  gameMinPerRealSec: 0.25, // 1 phút thật = 15 phút game
  banDays: 2,
  maxSuspicion: 100,
};
