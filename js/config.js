/* ===== Cấu hình dữ liệu game: cần, mồi, cá ===== */
'use strict';

// 3 chỉ số: cast = tầm quăng (0..1), sense = độ nhạy cắn (0..1), line = độ bền dây (0..1)
const RODS = [
  { id: 'tre',       name: 'Cần tre',       price: 0,    cast: 0.55, sense: 0.30, line: 0.40,
    desc: 'Cần tre truyền thống. Quăng gần, tín hiệu mờ.' },
  { id: 'truc',      name: 'Cần trúc',      price: 500,  cast: 0.66, sense: 0.44, line: 0.54,
    desc: 'Nhẹ và dẻo hơn tre, quăng xa hơn.' },
  { id: 'composite', name: 'Cần composite', price: 2000, cast: 0.80, sense: 0.60, line: 0.70,
    desc: 'Cứng cáp, tín hiệu cắn rõ ràng.' },
  { id: 'carbon',    name: 'Cần carbon',    price: 8000, cast: 0.97, sense: 0.80, line: 0.92,
    desc: 'Hàng xịn của đại lão. Quăng xa, nhạy, khỏe.' },
];

// pattern cắn: nhap2 | nhap3 | nhap1 | chimcham | day | dotngot | rung | loi
// diff: độ khó bo cá (0..1). w: trọng số xuất hiện. big: cá to, thích chỗ xa.
const FISH = [
  { id: 'ro-phi',    name: 'Rô phi',    min: 0.2, max: 0.8, price: 30000, pattern: 'nhap2',    diff: 0.25, w: 3, color: '#5b7fa6', big: false },
  { id: 'ro-dong',   name: 'Rô đồng',   min: 0.1, max: 0.4, price: 35000, pattern: 'nhap3',    diff: 0.20, w: 3, color: '#7a8c5f', big: false },
  { id: 'sac',       name: 'Cá sặc',    min: 0.1, max: 0.3, price: 40000, pattern: 'chimcham', diff: 0.15, w: 3, color: '#c2a15a', big: false },
  { id: 'dieu-hong', name: 'Diêu hồng', min: 0.3, max: 1.2, price: 45000, pattern: 'nhap1',    diff: 0.30, w: 2, color: '#d4697e', big: false },
  { id: 'chep',      name: 'Cá chép',   min: 0.5, max: 2.5, price: 60000, pattern: 'day',      diff: 0.45, w: 2, color: '#c98a3d', big: false },
  { id: 'chim',      name: 'Cá chim',   min: 0.5, max: 2.0, price: 55000, pattern: 'dotngot',  diff: 0.55, w: 2, color: '#8e8e93', big: true  },
  { id: 'tre-fish',  name: 'Cá trê',    min: 0.4, max: 3.0, price: 70000, pattern: 'rung',     diff: 0.50, w: 1, color: '#4a4a52', big: true  },
  { id: 'tai-tuong', name: 'Tai tượng', min: 0.8, max: 4.0, price: 80000, pattern: 'loi',      diff: 0.70, w: 1, color: '#6d7f5e', big: true  },
];

const BAITS = {
  giun: { name: 'Giun đất', wait: [4, 12] },   // thời gian chờ cắn (giây)
  cam:  { name: 'Cám câu',  wait: [2.5, 7] },
};
const CAM_PRICE = 100;   // 100đ / gói
const CAM_PACK = 10;     // 10 viên / gói
const START_MONEY = 200;

function fmt(n) { return Math.round(n).toLocaleString('vi-VN') + 'đ'; }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function rnd(a, b) { return a + Math.random() * (b - a); }
