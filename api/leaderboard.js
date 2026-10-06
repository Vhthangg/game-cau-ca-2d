/* ===== API Bảng xếp hạng — Vercel serverless + Vercel Blob =====
 * GET  /api/leaderboard → { top: [{name, score, bigFish, level, updatedAt}] } (top 10)
 * POST /api/leaderboard {name, score, bigFish, level} → { ok, rank, top }
 * Lưu vào blob "leaderboard.json" (JSON), giữ top 100.
 * Thiếu BLOB_READ_WRITE_TOKEN → 503 { error: 'offline' } (chế độ offline, game vẫn chơi).
 */
'use strict';

const { list, put } = require('@vercel/blob');

const PATHNAME = 'leaderboard.json';
const TOP_N = 10;
const MAX_KEEP = 100;
const MAX_SCORE = 100000000; // 100 triệu — chặn điểm gian lận

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
      .filter(e => e && typeof e.name === 'string' && Number.isFinite(Number(e.score)))
      .map(e => ({
        name: String(e.name).slice(0, 20),
        score: Math.floor(Number(e.score)),
        bigFish: Number(e.bigFish) || 0,
        level: Math.floor(Number(e.level) || 0),
        updatedAt: Number(e.updatedAt) || 0,
      }))
      .slice(0, MAX_KEEP);
  } catch (e) { return []; }
}

async function handler(req, res) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return send(res, 503, { error: 'offline' });
  try {
    if (req.method === 'GET') {
      const board = await readBoard(token);
      board.sort((a, b) => b.score - a.score);
      return send(res, 200, { top: board.slice(0, TOP_N) });
    }
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
      body = body || {};
      const name = cleanName(body.name);
      const score = Number(body.score);
      if (!name) return send(res, 400, { error: 'bad_name' });
      if (!Number.isFinite(score) || score <= 0 || score > MAX_SCORE)
        return send(res, 400, { error: 'bad_score' });
      const entry = {
        name,
        score: Math.floor(score),
        bigFish: Math.round(cleanNum(body.bigFish, 1000) * 100) / 100,
        level: Math.floor(cleanNum(body.level, 999)),
        updatedAt: Date.now(),
      };
      // Đọc → merge → ghi (upsert theo tên, chỉ giữ điểm cao nhất)
      const board = await readBoard(token);
      const ix = board.findIndex(e => e.name === name);
      if (ix >= 0) {
        if (entry.score > board[ix].score) board[ix] = entry;
      } else {
        board.push(entry);
      }
      board.sort((a, b) => b.score - a.score);
      const trimmed = board.slice(0, MAX_KEEP);
      await put(PATHNAME, JSON.stringify({ updated: Date.now(), entries: trimmed }),
        { access: 'public', contentType: 'application/json', token, addRandomSuffix: false });
      const rank = trimmed.findIndex(e => e.name === name) + 1;
      return send(res, 200, { ok: true, rank, top: trimmed.slice(0, TOP_N) });
    }
    return send(res, 405, { error: 'method' });
  } catch (e) {
    return send(res, 500, { error: 'server' });
  }
}

module.exports = handler;
// Export cho unit test (node) — Vercel chỉ dùng module.exports(req, res)
module.exports._test = { cleanName, cleanNum, readBoard, send, PATHNAME, TOP_N, MAX_KEEP, MAX_SCORE };
