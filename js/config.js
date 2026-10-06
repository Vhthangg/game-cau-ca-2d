/* ===== Cấu hình dữ liệu game: cần, mồi, cá, map, nhiệm vụ ===== */
'use strict';

// Cần: cast = tầm quăng (0..1), sense = độ nhạy cắn (0..1), line = độ bền dây (0..1)
// type: 'dai' | 'may' — dòng cần. reqLevel: cấp cần thủ tối thiểu để mua.
const RODS = [
  { id: 'tre',       name: 'Cần tre',       type: 'dai', price: 0,    cast: 0.55, sense: 0.30, line: 0.40, reqLevel: 1,
    desc: 'Cần tre truyền thống. Quăng gần, tín hiệu mờ.' },
  { id: 'truc',      name: 'Cần trúc',      type: 'dai', price: 500,  cast: 0.66, sense: 0.44, line: 0.54, reqLevel: 1,
    desc: 'Nhẹ và dẻo hơn tre, quăng xa hơn.' },
  { id: 'composite', name: 'Cần composite', type: 'dai', price: 2000, cast: 0.80, sense: 0.60, line: 0.70, reqLevel: 1,
    desc: 'Cứng cáp, tín hiệu cắn rõ ràng.' },
  { id: 'carbon',    name: 'Cần carbon',    type: 'dai', price: 8000, cast: 0.97, sense: 0.80, line: 0.92, reqLevel: 1,
    desc: 'Hàng xịn của đại lão. Quăng xa, nhạy, khỏe.' },
  { id: 'may24',     name: 'Cần máy 2.4m',  type: 'may', price: 6000, cast: 0.85, sense: 0.60, line: 0.75, reqLevel: 2,
    desc: 'Cần spinning đa năng. Quăng xa, khỏe, hợp câu sông.' },
  { id: 'may30',     name: 'Cần máy 3.0m bạo lực', type: 'may', price: 30000, cast: 0.95, sense: 0.40, line: 0.95, reqLevel: 8,
    desc: 'Hàng săn cá khủng. Rất cứng rất khỏe, hơi kém nhạy.' },
];

// pattern cắn: nhap2 | nhap3 | nhap1 | chimcham | day | dotngot | rung | loi
//             nganh2 | loinhanh | rungdeu | nhapnhe | hut | runtan (mới cho cá sông)
// diff: độ khó bo cá (0..1). w: trọng số xuất hiện. big: cá to, thích chỗ xa.
// map: 'ao' | 'song'. bait: mồi ưa thích ('giun' | 'cam') — dùng đúng mồi tỉ lệ cắn +25%.
const FISH = [
  // --- Ao làng (MVP) ---
  { id: 'ro-phi',    name: 'Rô phi',    min: 0.2, max: 0.8, price: 30000, pattern: 'nhap2',    diff: 0.25, w: 3, color: '#5b7fa6', big: false, map: 'ao', bait: 'giun' },
  { id: 'ro-dong',   name: 'Rô đồng',   min: 0.1, max: 0.4, price: 35000, pattern: 'nhap3',    diff: 0.20, w: 3, color: '#7a8c5f', big: false, map: 'ao', bait: 'giun' },
  { id: 'sac',       name: 'Cá sặc',    min: 0.1, max: 0.3, price: 40000, pattern: 'chimcham', diff: 0.15, w: 3, color: '#c2a15a', big: false, map: 'ao', bait: 'giun' },
  { id: 'dieu-hong', name: 'Diêu hồng', min: 0.3, max: 1.2, price: 45000, pattern: 'nhap1',    diff: 0.30, w: 2, color: '#d4697e', big: false, map: 'ao', bait: 'cam' },
  { id: 'chep',      name: 'Cá chép',   min: 0.5, max: 2.5, price: 60000, pattern: 'day',      diff: 0.45, w: 2, color: '#c98a3d', big: false, map: 'ao', bait: 'cam' },
  { id: 'chim',      name: 'Cá chim',   min: 0.5, max: 2.0, price: 55000, pattern: 'dotngot',  diff: 0.55, w: 2, color: '#8e8e93', big: true,  map: 'ao', bait: 'cam' },
  { id: 'tre-fish',  name: 'Cá trê',    min: 0.4, max: 3.0, price: 70000, pattern: 'rung',     diff: 0.50, w: 1, color: '#4a4a52', big: true,  map: 'ao', bait: 'giun' },
  { id: 'tai-tuong', name: 'Tai tượng', min: 0.8, max: 4.0, price: 80000, pattern: 'loi',      diff: 0.70, w: 1, color: '#6d7f5e', big: true,  map: 'ao', bait: 'giun' },
  // --- Sông quê (Đợt 1) ---
  { id: 'nganh',      name: 'Cá ngạnh',   min: 0.5, max: 3.0, price: 60000, pattern: 'nganh2',   diff: 0.60, w: 2, color: '#8a6d3b', big: true,  map: 'song', bait: 'giun' },
  { id: 'thac-lac',   name: 'Cá thác lác',min: 0.3, max: 1.2, price: 70000, pattern: 'loinhanh', diff: 0.40, w: 2, color: '#b8c4a8', big: false, map: 'song', bait: 'giun' },
  { id: 'basa',       name: 'Cá basa',    min: 1.0, max: 6.0, price: 40000, pattern: 'chimcham', diff: 0.40, w: 2, color: '#9fb3c8', big: true,  map: 'song', bait: 'cam' },
  { id: 'lang-song',  name: 'Cá lăng',    min: 1.0, max: 8.0, price: 65000, pattern: 'dotngot',  diff: 0.75, w: 1, color: '#5a5a6e', big: true,  map: 'song', bait: 'giun' },
  { id: 'tra',        name: 'Cá tra',     min: 1.0, max: 5.0, price: 35000, pattern: 'rungdeu',  diff: 0.40, w: 2, color: '#7d8fa3', big: true,  map: 'song', bait: 'cam' },
  { id: 'ca-he',      name: 'Cá he',      min: 0.2, max: 0.8, price: 30000, pattern: 'nhapnhe',  diff: 0.20, w: 3, color: '#c9b458', big: false, map: 'song', bait: 'cam' },
  { id: 'bong-tuong', name: 'Bống tượng', min: 0.2, max: 1.0, price: 75000, pattern: 'hut',      diff: 0.40, w: 2, color: '#6b5b45', big: false, map: 'song', bait: 'giun' },
  { id: 'ca-chot',    name: 'Cá chốt',    min: 0.1, max: 0.5, price: 25000, pattern: 'runtan',    diff: 0.20, w: 3, color: '#8c8c88', big: false, map: 'song', bait: 'giun' },
];

// Mồi: wait = thời gian chờ cắn (giây), w = trọng lượng (mồi nặng ít bị trôi)
const BAITS = {
  giun: { name: 'Giun đất', wait: [4, 12],   w: 0.30 },
  cam:  { name: 'Cám câu',  wait: [2.5, 7],  w: 0.55 },
};
const CAM_PRICE = 100;   // 100đ / gói
const CAM_PACK = 10;     // 10 viên / gói
const START_MONEY = 200;

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
function isGoldenHour() { const h = new Date().getHours(); return (h >= 5 && h < 7) || (h >= 16 && h < 18); }
