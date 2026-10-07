/* ===== API Bảng xếp hạng đa thành tựu — Vercel serverless + Vercel Blob =====
 * GET  /api/leaderboard?cat=caught|released|wife|biggest&win=day|week|all
 *      → { cat, win, top: [{name, level, value, unit, bigName?}] } (top 10)
 *        caught   = câu được nhiều nhất (con)      | win: ngày / tuần / mọi thời đại
 *        released = phóng sinh nhiều nhất (con)    | win: ngày / tuần / mọi thời đại
 *        wife     = dâng vợ nhiều nhất (con)       | win: ngày / tuần / mọi thời đại
 *        biggest  = thủy quái to nhất (kg)         | chỉ mọi thời đại
 * POST /api/leaderboard {name, level, score,
 *        day,dc,dr,dw, week,wc,wr,ww, tc,rel,wife, bigKg,bigName}
 *      → { ok, rank, top } (rank/top theo cat/win của query, mặc định caught/all)
 *      Upsert theo tên: day/week counters ghi đè khi key mới hơn, max-merge khi cùng key;
 *      cumulative (score/tc/rel/wife) và bigKg lấy max.
 *      Tương thích POST cũ {name, score, bigFish, level} → bigFish map sang bigKg.
 * Lưu vào blob "leaderboard.json" (JSON), giữ tối đa 100 entries.
 * Thiếu BLOB_READ_WRITE_TOKEN → 503 { error: 'offline' } (chế độ offline, game vẫn chơi).
 */
'use strict';

const { list, put } = require('@vercel/blob');

const PATHNAME = 'leaderboard.json';
const TOP_N = 10;
const MAX_KEEP = 100;
const MAX_SCORE = 100000000; // 100 triệu — chặn điểm gian lận
const MAX_CNT = 10000000;    // 10 triệu — chặn counter gian lận
const MAX_KG = 1000;         // cá 1 tấn là kịch trần

// Hạng mục → field sort theo kỳ. biggest chỉ có mọi thời đại.
const CATS = {
  caught:   { day: 'dc', week: 'wc', all: 'tc',    unit: 'con' },
  released: { day: 'dr', week: 'wr', all: 'rel',   unit: 'con' },
  wife:     { day: 'dw', week: 'ww', all: 'wife',  unit: 'con' },
  biggest:  { all: 'bigKg', unit: 'kg' },
};

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

// Làm sạch tên: bỏ tag HTML, ký tự nguy hiểm, gọn khoảng trắng, tối đa 20 ký tự
function cleanName(v) {
  if (typeof v !== 'string') return '';
  return v.replace(/<[^>]*>/g, '')
    .replace(/[<>&"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20);
}
function cleanNum(v, max) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}
function round2(n) { return Math.round(Number(n) * 100) / 100; }

// Key ngày/tuần phía server (khớp format todayStr/mondayStr của client: '2026-10-7')
function dayKey(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
function weekKey(d) {
  d = d || new Date();
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.getFullYear() + '-' + (x.getMonth() + 1) + '-' + x.getDate();
}
// '2026-10-7' → 20261007 để so sánh mới/cũ
function keyNum(k) {
  const p = String(k || '').split('-').map(Number);
  if (p.length !== 3 || p.some(x => !Number.isFinite(x) || x <= 0)) return 0;
  return p[0] * 10000 + p[1] * 100 + p[2];
}

function blankEntry(name) {
  return {
    name, level: 0, updatedAt: 0, score: 0,
    day: '', dc: 0, dr: 0, dw: 0,
    week: '', wc: 0, wr: 0, ww: 0,
    tc: 0, rel: 0, wife: 0,
    bigKg: 0, bigName: '', bigAt: 0,
  };
}

// Gộp day/week counters: key gửi lên mới hơn → ghi đè; cùng key → lấy max từng counter;
// key cũ hơn (đồng hồ client lệch) → giữ nguyên phía server.
function mergeWin(e, wk, fields, inc) {
  const ik = inc[wk], ek = e[wk];
  if (ik && keyNum(ik) > keyNum(ek)) {
    e[wk] = ik;
    fields.forEach(f => { e[f] = inc[f]; });
  } else if (ik && ik === ek) {
    fields.forEach(f => { e[f] = Math.max(e[f] || 0, inc[f] || 0); });
  }
}

function normEntry(e) {
  return {
    name: String(e.name).slice(0, 20),
    level: Math.floor(Number(e.level) || 0),
    updatedAt: Number(e.updatedAt) || 0,
    score: Math.floor(Number(e.score) || 0),
    day: String(e.day || ''), dc: Math.floor(Number(e.dc) || 0),
    dr: Math.floor(Number(e.dr) || 0), dw: Math.floor(Number(e.dw) || 0),
    week: String(e.week || ''), wc: Math.floor(Number(e.wc) || 0),
    wr: Math.floor(Number(e.wr) || 0), ww: Math.floor(Number(e.ww) || 0),
    tc: Math.floor(Number(e.tc) || 0), rel: Math.floor(Number(e.rel) || 0),
    wife: Math.floor(Number(e.wife) || 0),
    bigKg: Number(e.bigKg != null ? e.bigKg : e.bigFish) || 0,
    bigName: String(e.bigName || '').slice(0, 20),
    bigAt: Number(e.bigAt) || 0,
  };
}

async function readBoard(token) {
  try {
    const { blobs } = await list({ prefix: PATHNAME, token });
    const b = blobs.find(x => x.pathname === PATHNAME);
    if (!b) return [];
    const r = await fetch(b.url, { cache: 'no-store' });
    if (!r.ok) return [];
    const data = await r.json();
    const arr = Array.isArray(data) ? data : data.entries;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(e => e && typeof e.name === 'string')
      .map(normEntry)
      .slice(0, MAX_KEEP);
  } catch (e) { return []; }
}

async function writeBoard(board, token) {
  await put(PATHNAME, JSON.stringify({ updated: Date.now(), entries: board }),
    { access: 'public', contentType: 'application/json', token, addRandomSuffix: false });
}

// Chuẩn hóa cat/win từ query; biggest ép về all
function normCatWin(q) {
  q = q || {};
  const cat = CATS[q.cat] ? q.cat : 'caught';
  let win = q.win === 'week' ? 'week' : (q.win === 'all' ? 'all' : 'day');
  if (cat === 'biggest') win = 'all';
  return { cat, win };
}

function topFor(board, cat, win) {
  const field = CATS[cat][win];
  const dk = dayKey(), wk = weekKey();
  let arr = board;
  if (win === 'day') arr = arr.filter(e => e.day === dk);
  else if (win === 'week') arr = arr.filter(e => e.week === wk);
  arr = arr
    .filter(e => (e[field] || 0) > 0)
    .sort((a, b) => (b[field] || 0) - (a[field] || 0))
    .slice(0, TOP_N);
  return arr.map(e => {
    const row = { name: e.name, level: e.level, value: round2(e[field] || 0), unit: CATS[cat].unit };
    if (cat === 'biggest') row.bigName = e.bigName || '';
    return row;
  });
}

function parseBody(req) {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  return body || {};
}

async function handler(req, res) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return send(res, 503, { error: 'offline' });
  try {
    const q = req.query || {};
    if (req.method === 'GET') {
      const { cat, win } = normCatWin(q);
      const board = await readBoard(token);
      return send(res, 200, { cat, win, top: topFor(board, cat, win) });
    }
    if (req.method === 'POST') {
      const body = parseBody(req);
      const name = cleanName(body.name);
      if (!name) return send(res, 400, { error: 'bad_name' });
      // Tương thích POST cũ: bigFish → bigKg
      const inc = {
        level: Math.floor(cleanNum(body.level, 999)),
        score: Math.floor(cleanNum(body.score, MAX_SCORE)),
        day: String(body.day || ''),
        dc: Math.floor(cleanNum(body.dc, MAX_CNT)),
        dr: Math.floor(cleanNum(body.dr, MAX_CNT)),
        dw: Math.floor(cleanNum(body.dw, MAX_CNT)),
        week: String(body.week || ''),
        wc: Math.floor(cleanNum(body.wc, MAX_CNT)),
        wr: Math.floor(cleanNum(body.wr, MAX_CNT)),
        ww: Math.floor(cleanNum(body.ww, MAX_CNT)),
        tc: Math.floor(cleanNum(body.tc, MAX_CNT)),
        rel: Math.floor(cleanNum(body.rel, MAX_CNT)),
        wife: Math.floor(cleanNum(body.wife, MAX_CNT)),
        bigKg: round2(cleanNum(body.bigKg != null ? body.bigKg : body.bigFish, MAX_KG)),
        bigName: cleanName(body.bigName),
      };
      const board = await readBoard(token);
      let e = board.find(x => x.name === name);
      if (!e) { e = blankEntry(name); board.push(e); }
      mergeWin(e, 'day', ['dc', 'dr', 'dw'], inc);
      mergeWin(e, 'week', ['wc', 'wr', 'ww'], inc);
      ['score', 'tc', 'rel', 'wife'].forEach(f => { e[f] = Math.max(e[f] || 0, inc[f] || 0); });
      e.level = inc.level || e.level;
      if (inc.bigKg > (e.bigKg || 0)) { e.bigKg = inc.bigKg; e.bigName = inc.bigName || e.bigName; e.bigAt = Date.now(); }
      e.updatedAt = Date.now();
      const trimmed = board.slice(0, MAX_KEEP);
      await writeBoard(trimmed, token);
      const { cat, win } = normCatWin(q);
      const top = topFor(trimmed, cat, win);
      const rank = top.findIndex(r => r.name === name) + 1;
      return send(res, 200, { ok: true, rank, cat, win, top });
    }
    return send(res, 405, { error: 'method' });
  } catch (e) {
    return send(res, 500, { error: 'server' });
  }
}

module.exports = handler;
// Export cho unit test (node) — Vercel chỉ dùng module.exports(req, res)
module.exports._test = { cleanName, cleanNum, round2, dayKey, weekKey, keyNum, blankEntry, mergeWin, normEntry, normCatWin, topFor, CATS, PATHNAME, TOP_N, MAX_KEEP, MAX_SCORE, MAX_CNT, MAX_KG };
