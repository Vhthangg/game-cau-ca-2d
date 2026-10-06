# 🎣 Câu Cá Ao Làng

Game 2D câu cá "Việt Nam hóa" — bản MVP chơi ngay trên trình duyệt.
Dạy người mới học câu thật qua từng thao tác: chọn cần, chọn mồi, quăng cần,
đọc phao theo từng loài cá, bắt nhịp giật cần, bo cá.

## Chạy thử

**Không cần cài gì cả.** Mở file `index.html` bằng trình duyệt là chơi được ngay
(offline hoàn toàn, không CDN, không build step).

Hoặc chạy local server để test như môi trường deploy:

```bash
cd game-cau-ca-2d
npx serve .
# hoặc: python3 -m http.server 8000
```

## Deploy lên Vercel

Vì đây là web tĩnh (HTML/CSS/JS thuần), deploy rất đơn giản:

1. Push thư mục này lên GitHub repo `game-cau-ca-2d`.
2. Vào [vercel.com](https://vercel.com) → Add New → Project → Import repo.
3. Framework Preset để **Other**, không cần Build Command / Output Directory.
4. Deploy → có link chơi ngay.

## Cấu trúc file

```
game-cau-ca-2d/
├── index.html      # Khung trang + các màn hình (menu, chuẩn bị, map, nhiệm vụ, shop, ...)
├── style.css       # Giao diện phong cách quê Việt (design tokens)
├── js/
│   ├── config.js   # Dữ liệu: 6 loại cần, 16 loài cá, 2 map, điểm câu, nhiệm vụ ngày
│   ├── audio.js    # Âm thanh WebAudio (bíp cắn câu, dính cá, bán cá...)
│   ├── art.js      # Vẽ ao làng + sông quê, cần, phao, cá bằng canvas vector
│   └── game.js     # State machine: MENU→PREPARE→MAP→SPOT→CAST→WAIT→BITE→STRIKE→FIGHT→RESULT→SHOP
├── docs/
│   └── thiet-ke-mo-rong.md  # Tài liệu thiết kế mở rộng v2.0
└── README.md
```

## Gameplay

### MVP (ao làng)
1. **Chuẩn bị:** chọn cần (tre → trúc → composite → carbon), chọn mồi.
   Giun đất miễn phí nhưng phải **đào tay** qua mini-game (20 giây).
2. **Quăng cần:** chạm vào mặt nước. Cần xịn quăng xa hơn — chỗ xa có cá to.
3. **Chờ cắn:** mỗi loài cá có pattern rung phao riêng
   (rô phi nhấp 2 cái rồi kéo chìm, trê rung mạnh liên tục...).
4. **Bắt nhịp:** nhấn đúng lúc kim vào vùng xanh (1,5 giây).
5. **Bo cá:** giữ để kéo / thả để nhả, giữ kim trong vùng xanh.
   Căng quá đứt dây, lỏng quá tuột cá.
6. **Bán cá** lấy tiền nâng cần. Tiến trình lưu tự động (localStorage).

### Đợt 1 — Sông quê 🌊
- **Chọn map** sau khi chuẩn bị: Ao làng (mặc định) / Sông quê
  (mở khóa khi câu 15 con ở ao làng **hoặc** đạt cấp cần thủ 2).
- **3 điểm câu** trên sông: Bến đò (dễ, dòng êm), Gầm cầu (vừa, hố sâu),
  Bãi bồi (khó, dòng xiết). Mỗi điểm có cá đặc trưng riêng.
- **Dòng chảy:** mồi nhẹ ở chỗ xiết bị trôi → tỉ lệ cắn giảm 40%.
  Dùng cám (nặng hơn giun) hoặc đổi điểm câu.
- **Thời tiết:** mỗi phiên 25% "vừa mưa xong" → cá ăn mạnh (+30%).
- **Giờ vàng:** 5–7h sáng và 16–18h (giờ thật) → tỉ lệ cắn +25%.
- **8 loài cá sông mới:** ngạnh, thác lác, basa, lăng, tra, cá he,
  bống tượng, cá chốt — mỗi loài pattern cắn riêng.
- **Cần máy (spinning):** 2.4m (6.000đ, cấp 2) và 3.0m bạo lực
  (30.000đ, cấp 8). Dùng được ở cả ao và sông.
- **Cấp cần thủ:** = floor(tổng cá đã câu / 10) + 1 (tối đa 15),
  mở khóa map và cần mới.
- **Nhiệm vụ ngày:** 3 nhiệm vụ ngẫu nhiên mỗi ngày (pool 9 loại),
  làm xong nhận thưởng tiền/mồi.

## 16 loài cá

### Ao làng (8)
| Cá | Cân nặng | Giá/kg | Độ khó bo |
|---|---|---|---|
| Rô phi | 0,2–0,8 kg | 30.000đ | ⭐ |
| Rô đồng | 0,1–0,4 kg | 35.000đ | ⭐ |
| Cá sặc | 0,1–0,3 kg | 40.000đ | ⭐ |
| Diêu hồng | 0,3–1,2 kg | 45.000đ | ⭐⭐ |
| Cá chép | 0,5–2,5 kg | 60.000đ | ⭐⭐ |
| Cá chim | 0,5–2,0 kg | 55.000đ | ⭐⭐⭐ |
| Cá trê | 0,4–3,0 kg | 70.000đ | ⭐⭐⭐ |
| Tai tượng | 0,8–4,0 kg | 80.000đ | ⭐⭐⭐⭐ |

### Sông quê (8, Đợt 1)
| Cá | Cân nặng | Giá/kg | Mồi ưa thích | Độ khó bo |
|---|---|---|---|---|
| Cá ngạnh | 0,5–3,0 kg | 60.000đ | Giun | ⭐⭐⭐ |
| Cá thác lác | 0,3–1,2 kg | 70.000đ | Giun | ⭐⭐ |
| Cá basa | 1,0–6,0 kg | 40.000đ | Cám | ⭐⭐ |
| Cá lăng | 1,0–8,0 kg | 65.000đ | Giun | ⭐⭐⭐⭐ |
| Cá tra | 1,0–5,0 kg | 35.000đ | Cám | ⭐⭐ |
| Cá he | 0,2–0,8 kg | 30.000đ | Cám | ⭐ |
| Bống tượng | 0,2–1,0 kg | 75.000đ | Giun | ⭐⭐ |
| Cá chốt | 0,1–0,5 kg | 25.000đ | Giun | ⭐ |

## Gắn link affiliate (cho admin)

Các nút **"🛒 Mua ngoài đời"** trong Cửa hàng hiện là placeholder.
Khi click sẽ hiện tooltip *"admin sẽ gắn link affiliate tại đây"*.

Để gắn link thật, sửa trong `js/game.js` — tìm class `aff-link`
trong hàm `renderShop()`, thay `<a href="#">` bằng URL affiliate
(Shopee/Lazada/TikTok Shop) của từng sản phẩm, ví dụ:

```html
<a href="https://shopee.vn/...?affiliate_id=xxx" target="_blank" class="aff-link">🛒 Mua ngoài đời</a>
```

## Roadmap mở rộng (theo bản thiết kế 36 trang)

### Đợt 1 ✅ (đã xong)
- [x] Map Sông quê: 3 điểm câu, dòng chảy, thời tiết, giờ vàng
- [x] 8 loài cá sông mới (ngạnh, thác lác, basa, lăng, tra, cá he, bống tượng, cá chốt)
- [x] Cần máy spinning (2.4m / 3.0m bạo lực)
- [x] Cấp độ cần thủ + Nhiệm vụ ngày

### Đợt 2 ✅ — Trốn vợ đi câu 😎
- **Chọn chế độ** ở menu chính: "🎣 Câu tự do" / "😎 Trốn vợ đi câu".
- **Chuyến đi:** vợ đặt giờ giới nghiêm ngẫu nhiên 17h–19h (giờ game;
  1 phút thật = 15 phút game, đồng hồ hiện trên HUD).
- **Thanh Nghi ngờ (0–100):** +10 đi câu giờ lạ (sau 21h), +15 mỗi 30 phút
  về trễ, +10 tiêu >5.000đ đồ câu/ngày, +40 nói dối bị phát hiện,
  +5 bán cá giấu vợ. Về đúng giờ -5 + danh hiệu "Chồng ngoan".
- **Cuộc gọi bất ngờ (60%/chuyến):** vợ gọi "Đang ở đâu đấy?!" —
  5 giây chọn: nói thật (+10 nghi ngờ, +1 Chân thành) hoặc nói dối
  ("Đang họp!" — 70% qua, 30% bị soi → trả lời câu hỏi mẹo, sai +40).
- **3 lựa chọn sau khi câu được cá** (mỗi lựa chọn 1 câu hài ngẫu nhiên):
  💰 Bán ngay (+tiền, +5 nghi ngờ), 🎁 Mang về nịnh vợ (vào giỏ),
  🙏 Phóng sinh (+1 Phúc đức).
- **Về nhà:** dâng cá cho vợ (-8/con, tối đa -30/chuyến, +10 Hạnh phúc/con),
  mini-game "Vào bếp" 30s (thắng -20 nghi ngờ), shop "Quà cho vợ"
  (trà sữa/hoa/son/túi xách tăng Hạnh phúc).
- **Phúc đức:** đủ 10 điểm → buff "🍀 Cá lớn phù hộ" 1 giờ (+15% gặp cá to).
- **Cấm câu:** nghi ngờ ≥ 80 → cấm 2 ngày thật (menu hiện đếm ngược);
  đủ 5 Chân thành được xin tha một lần.
- **Nhiệm vụ tuần:** T7–CN ở nhà với vợ → nghi ngờ reset về 20
  + mở khóa Sông quê sớm (tự đánh giá vào đầu tuần).
- Danh hiệu hài: Chồng ngoan, Vua giờ giới nghiêm, Người phóng sinh,
  Chồng quốc dân...

### Tiếp theo
- [ ] Mini-game cân phao, chọn điểm câu (ao làng)
- [ ] Thêm map: suối, hồ, đập thủy điện, cửa sông
- [ ] Thêm kỹ thuật: câu lure, câu lục, câu iso
- [x] Chế độ "Trốn vợ đi câu" 😎 (Đợt 2)
- [ ] Công thức trộn mồi, thời tiết/giờ cắn câu
- [ ] Bảng xếp hạng, sự kiện giải câu cuối tuần
