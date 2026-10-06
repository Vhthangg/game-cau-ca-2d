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
├── index.html      # Khung trang + các màn hình (menu, chuẩn bị, shop, ...)
├── style.css       # Giao diện phong cách quê Việt
├── js/
│   ├── config.js   # Dữ liệu: 4 loại cần, 8 loài cá, mồi, giá cả
│   ├── audio.js    # Âm thanh WebAudio (bíp cắn câu, dính cá, bán cá...)
│   ├── art.js      # Vẽ ao làng, cần, phao, cá bằng canvas vector
│   └── game.js     # State machine: MENU→PREPARE→CAST→WAIT→BITE→STRIKE→FIGHT→RESULT→SHOP
└── README.md
```

## Gameplay

1. **Chuẩn bị:** chọn cần (tre → trúc → composite → carbon), chọn mồi.
   Giun đất miễn phí nhưng phải **đào tay** qua mini-game (20 giây).
2. **Quăng cần:** chạm vào mặt nước. Cần xịn quăng xa hơn — chỗ xa có cá to.
3. **Chờ cắn:** mỗi loài cá có pattern rung phao riêng
   (rô phi nhấp 2 cái rồi kéo chìm, trê rung mạnh liên tục...).
4. **Bắt nhịp:** nhấn đúng lúc kim vào vùng xanh (1,5 giây).
5. **Bo cá:** giữ để kéo / thả để nhả, giữ kim trong vùng xanh.
   Căng quá đứt dây, lỏng quá tuột cá.
6. **Bán cá** lấy tiền nâng cần. Tiến trình lưu tự động (localStorage).

## 8 loài cá ao làng

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

- [ ] Mini-game cân phao, chọn điểm câu
- [ ] Thêm map: sông, suối, hồ, đập thủy điện, cửa sông
- [ ] Thêm kỹ thuật: câu lure, câu lục, câu iso
- [ ] Chế độ "Trốn vợ đi câu" 😄
- [ ] Công thức trộn mồi, thời tiết/giờ cắn câu
- [ ] Bảng xếp hạng, sự kiện giải câu cuối tuần
