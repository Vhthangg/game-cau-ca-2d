# THIẾT KẾ MỞ RỘNG — GAME CÂU CÁ 2D "CÂU CÁ AO LÀNG"

> Phiên bản 2.0 — Tài liệu thiết kế chi tiết cho các đợt mở rộng sau MVP.
> Ngày: 06/10/2026. Trạng thái: bản thảo thiết kế, chờ duyệt trước khi code.

## 1. TRIẾT LÝ MỞ RỘNG

Ba nguyên tắc bất di bất dịch cho mọi nội dung mới:

1. **Mỗi map = một bài học kỹ thuật thật.** Người chơi mở map mới là học được một kiểu câu mới ngoài đời (câu đáy dòng chảy, lure suối, câu lục xa bờ, câu iso...).
2. **Mỗi loài cá = một tính cách riêng.** Pattern cắn phao, giờ ăn, mồi ưa thích, độ khó bo cá đều khác nhau — tra cứu được như "từ điển cá thật".
3. **Mode giải trí tách khỏi mode học.** "Trốn vợ đi câu" là mode hài riêng, không trộn lẫn với mode học nghiêm túc để giữ uy tín "dạy câu thật".

Thứ tự ưu tiên nội dung: Map sông quê → Mode Trốn vợ → Map hồ → Map đập → Map suối → Map cửa sông.

---

## 2. HỆ THỐNG MAP (6 MAP)

### 2.1. Map 1: Ao làng ✅ (đã có trong MVP)

- Vai trò: map tutorial, dạy câu đài cơ bản.
- 8 loài: rô phi, diêu hồng, chép, trê, rô đồng, sặc, cá chim, tai tượng.
- Giữ nguyên, chỉ bổ sung thêm 2 điểm câu trong đợt mở rộng (Bờ tre, Bèo tây).

### 2.2. Map 2: Sông quê — "Bài học dòng chảy"

- **Mở khóa:** câu được 15 con ở Ao làng HOẶC đạt cấp Cần thủ 2.
- **Địa hình:** sông rộng 30–50m, dòng chảy vừa, có gầm cầu, bãi bồi, bụi rậm ven bờ.
- **Kỹ thuật mới dạy:** câu đáy trong dòng chảy — chọn chì nặng vừa đủ giữ mồi chạm đáy mà không bị trôi; đọc dòng nước (chỗ nước quẩn = cá tụ).
- **Cơ chế đặc biệt:** độ xiết dòng thay đổi theo "mưa trong game" — sau mưa 2h, dòng xiết hơn, cá ăn mạnh hơn 30% nhưng chì nhẹ bị trôi.
- **Khung giờ vàng:** 5h–7h sáng, 16h–18h chiều.
- **3 điểm câu:**
  | Điểm | Đặc điểm | Cá đặc trưng |
  |---|---|---|
  | Bến đò | Nước nông 1–2m, dòng êm | rô phi, thác lác, cá he |
  | Gầm cầu | Hố sâu 4–6m, nước quẩn | trê, ngạnh, lăng |
  | Bãi bồi | Dòng xiết, đáy cát | basa, tra, cá chày sông |
- **8 loài mới:** ngạnh, thác lác, basa, lăng, tra, cá he, bống tượng, cá chốt.

### 2.3. Map 3: Suối núi — "Bài học tàng hình"

- **Mở khóa:** cấp Cần thủ 4.
- **Địa hình:** suối trong vắt, đá tảng, thác nhỏ; cá nhỏ (0.1–0.5kg) nhưng cực nhanh và nhát.
- **Kỹ thuật mới dạy:** câu lure siêu nhẹ (UL) — rê mồi giả qua kẽ đá; **quy tắc bóng người**: đứng sai vị trí (bóng đổ xuống nước) cá bỏ chạy 30 giây.
- **Cơ chế đặc biệt:** "độ cảnh giác" — mỗi lần quăng hụt +20% cảnh giác của cả điểm câu, phải đổi điểm hoặc chờ.
- **Loài (6):** chạch suối, bống suối, chày suối, cá lấu, cá niên, cá mương.

### 2.4. Map 4: Hồ tự nhiên — "Bài học cân phao chuẩn"

- **Mở khóa:** cấp Cần thủ 6.
- **Địa hình:** hồ rộng 200m, sâu 3–8m, có đảo bèo giữa hồ.
- **Kỹ thuật mới dạy:** cân phao chuẩn (mini-game cân phao: kéo-thả chì lá, đọc phao chìm/nổi, đạt "cân 4 câu 2"); câu lục xa bờ (mở khóa dòng cần lục).
- **Cơ chế đặc biệt:** mini-game **cân phao** bắt buộc trước khi câu ở hồ — làm sai thì tỉ lệ hụt +40%. Có "Sân tập cân phao" luyện miễn phí.
- **Khung giờ vàng:** 6h–9h sáng (mè ăn nổi), chiều tối (chép, trắm).
- **Loài (8):** mè trắng, mè hoa, mè vinh, trắm cỏ, chép khủng, vền, diếc, tai tượng hồ.

### 2.5. Map 5: Đập thủy điện — "Bài học săn cá khủng"

- **Mở khóa:** cấp Cần thủ 8 + sở hữu cần carbon trở lên.
- **Địa hình:** lòng đập sâu 10–20m, dòng xoáy, kè đá.
- **Kỹ thuật mới dạy:** câu ngâm đáy sâu (chì 50–100g, chờ lâu), bo cá khủng (giữ lực 2–3 phút, cá có 3 đợt giãy mạnh).
- **Cơ chế đặc biệt:** cá ở đây từ 5–30kg — cần yếu hơn "chuẩn" thì tỉ lệ đứt dây 80%. Mỗi con cá khủng câu được đều ghi vào "Bảng vàng" cá nhân.
- **Loài (6):** cá hô, tra dầu, trắm đen, lăng đuôi đỏ, còm, nheo.

### 2.6. Map 6: Cửa sông / ven biển — "Bài học thủy triều"

- **Mở khóa:** cấp Cần thủ 10.
- **Địa hình:** nước lợ, bãi sú vẹt, cầu cảng; **thủy triều lên/xuống theo giờ thật** — nước lên cá vào gần bờ, nước xuống cá ra xa.
- **Kỹ thuật mới dạy:** câu iso (phao iso, mồi tôm), câu lure biển (thìa, popper lúc bình minh).
- **Cơ chế đặc biệt:** lịch thủy triều hiển thị trong game; câu sai con nước thì tỉ lệ cắn -50%.
- **Loài (8):** chẽm (vược), mú, cá kèo, cá đối, cá hồng, cá bớp, cá hanh, cá giò.

---

## 3. DANH MỤC 36 LOÀI CÁ

Mỗi loài có "thẻ hồ sơ thật": tập tính, mồi, kỹ thuật, pattern cắn phao, khung giờ. Dưới đây là bảng tổng hợp (★ = độ khó 1–5).

| # | Loài | Map | Mồi ưa thích | Kỹ thuật | Pattern cắn | Cân nặng | Giá/kg | ★ |
|---|---|---|---|---|---|---|---|---|
| 1 | Rô phi | Ao làng | Giun, cám | Câu đài | Nhấp 2 nhịp rồi kéo chìm | 0.3–1.5kg | 25đ | 1 |
| 2 | Diêu hồng | Ao làng | Cám thơm | Câu đài cân 4 câu 2 | Rung nhẹ rồi lôi ngang | 0.5–2kg | 35đ | 2 |
| 3 | Chép | Ao làng | Khoai lang ủ chua | Lăng xê đáy | Nhấp nhả 3–4 lần rồi chìm | 0.5–3kg | 40đ | 2 |
| 4 | Trê | Ao làng, Sông | Giun, dế | Câu đáy đêm | Rung mạnh liên tục rồi kéo | 0.5–4kg | 45đ | 2 |
| 5 | Rô đồng | Ao làng | Giun | Câu đài | Chìm phao rất nhanh | 0.1–0.4kg | 20đ | 1 |
| 6 | Sặc | Ao làng | Cơm nguội | Phao nhỏ nhạy | Nhấp nhẹ liên tục | 0.1–0.3kg | 15đ | 1 |
| 7 | Cá chim | Ao làng | Cám tanh | Giật mạnh, dây khỏe | Kéo phao đi xéo | 0.5–2.5kg | 50đ | 3 |
| 8 | Tai tượng | Ao làng, Hồ | Rau củ | Câu lửng | Đẩy phao lên rồi chìm | 1–5kg | 55đ | 3 |
| 9 | Ngạnh | Sông | Giun to | Câu đêm đáy sâu | Rung 2 nhịp mạnh rồi im → kéo | 0.5–3kg | 60đ | 3 |
| 10 | Thác lác | Sông | Tép | Câu rìa dòng | Nhấp 1 cái rồi lôi | 0.3–1.2kg | 70đ | 2 |
| 11 | Basa | Sông | Cám | Câu đáy dòng chảy | Chìm từ từ | 1–6kg | 40đ | 2 |
| 12 | Lăng | Sông | Cá con | Câu ngâm | Kéo mạnh một phát | 1–8kg | 65đ | 4 |
| 13 | Tra | Sông | Cám | Câu đáy | Rung đều rồi chìm | 1–5kg | 35đ | 2 |
| 14 | Cá he | Sông | Bột, cám | Câu phao | Nhấp nhẹ | 0.2–0.8kg | 30đ | 1 |
| 15 | Bống tượng | Sông | Tép, giun | Câu đáy nhẹ | Hút phao xuống nhanh | 0.2–1kg | 75đ | 2 |
| 16 | Cá chốt | Sông | Giun nhỏ | Câu đáy | Rung lăn tăn | 0.1–0.5kg | 25đ | 1 |
| 17 | Chạch suối | Suối | Giun nhỏ | Câu kẽ đá | Giật cục 2 cái | 0.1–0.4kg | 80đ | 3 |
| 18 | Bống suối | Suối | Tép nhỏ | Lure UL | Đớp mồi giả khi rê qua | 0.05–0.2kg | 60đ | 3 |
| 19 | Chày suối | Suối | Côn trùng giả | Fly/lure nhẹ | Nhảy lên đớp | 0.1–0.6kg | 70đ | 4 |
| 20 | Cá niên | Suối | Giun | Câu đài ngắn | Chìm nhanh | 0.1–0.5kg | 65đ | 2 |
| 21 | Cá mương | Suối | Bột | Câu phao nhỏ | Rỉa mồi | 0.05–0.3kg | 40đ | 2 |
| 22 | Cá lấu | Suối | Tép | Câu đáy | Kéo nhẹ | 0.2–0.8kg | 75đ | 3 |
| 23 | Mè trắng | Hồ | Mồi chua nổi lửng | Bắt nhịp phao đẩy lên | Đẩy phao lên cao | 1–6kg | 30đ | 3 |
| 24 | Mè hoa | Hồ | Mồi chua | Câu lửng | Đẩy phao + rung | 2–10kg | 35đ | 4 |
| 25 | Mè vinh | Hồ | Mồi chua | Câu đài đàn | Nhấp liên tục | 0.3–1kg | 25đ | 2 |
| 26 | Trắm cỏ | Hồ | Rau muống, sắn | Câu đáy lặng | Chìm chậm, chắc | 2–12kg | 50đ | 3 |
| 27 | Vền | Hồ | Cám | Câu đài | Nhấp 2 nhịp | 0.3–1.5kg | 30đ | 2 |
| 28 | Diếc | Hồ | Giun nhỏ | Phao tăm | Tăm phao lăn tăn | 0.1–0.5kg | 35đ | 2 |
| 29 | Cá hô | Đập | Cám, ốc | Câu ngâm đáy sâu | Kéo như xe tải | 10–30kg | 120đ | 5 |
| 30 | Tra dầu | Đập | Cám tanh | Câu đáy sâu | Chìm mạnh | 5–20kg | 90đ | 5 |
| 31 | Trắm đen | Đập, Hồ | Ốc | Câu lục xa bờ | Hút phao mất hút | 5–25kg | 110đ | 5 |
| 32 | Lăng đuôi đỏ | Đập | Cá con | Câu ngâm đêm | Giật mạnh 3 đợt | 3–15kg | 100đ | 5 |
| 33 | Còm | Đập | Ốc | Câu sâu | Nhấp rồi kéo | 1–5kg | 70đ | 3 |
| 34 | Nheo | Đập | Lòng gà | Câu đêm | Kéo xéo | 2–10kg | 85đ | 4 |
| 35 | Chẽm (vược) | Cửa sông | Mồi giả, tôm | Lure bình minh | Táp mồi mặt nước | 1–8kg | 95đ | 4 |
| 36 | Mú | Cửa sông | Mồi sống | Câu đáy rạn | Hút mạnh vào hang | 1–6kg | 110đ | 4 |
| 37 | Cá kèo | Cửa sông | Giun đất | Câu đáy bùn | Rỉa nhẹ | 0.05–0.2kg | 90đ | 2 |
| 38 | Cá đối | Cửa sông | Bột | Câu phao xa | Nhấp đều | 0.3–1.5kg | 55đ | 2 |
| 39 | Cá hồng | Cửa sông | Tôm | Câu iso | Kéo ngang | 0.5–3kg | 80đ | 3 |
| 40 | Cá bớp | Cửa sông | Cá con | Câu đáy | Nuốt sâu, kéo mạnh | 2–10kg | 100đ | 4 |

*(Vượt 36 để có dự phòng cân bằng — khi chốt sẽ chọn 36 chính thức.)*

---

## 4. HỆ THỐNG CẦN CÂU MỞ RỘNG

### 4.1. Triết lý

Mỗi **kỹ thuật câu** có một dòng cần riêng — người chơi học kỹ thuật mới thì phải sắm cần mới (đúng như ngoài đời). Trong mỗi dòng cần có 3–4 tier từ rẻ đến xịn.

### 4.2. Chỉ số cần (áp dụng cho mọi cần)

| Chỉ số | Ý nghĩa trong game |
|---|---|
| Độ cứng (H) | Chịu được cá to đến đâu; cần mềm bo cá to dễ đứt |
| Độ nhạy | Vùng xanh thanh bắt nhịp rộng/hẹp |
| Tầm quăng | Khoảng cách quăng tối đa trên map |
| Độ bền dây | Số lần bo cá trước khi phải thay dây (chi phí bảo trì) |
| Tốc độ trang bị lại | Thời gian chờ giữa 2 lần quăng |

### 4.3. Các dòng cần

**A. Cần đài** (map Ao làng, Hồ) — cần tay không máy
| Cần | Dài | Chỉ số (Cứng/Nhạy/Quăng/Bền) | Giá | Mở khóa |
|---|---|---|---|---|
| Cần tre | 3.6m | 1 / 1 / 40m / 5 lần | Miễn phí (vô hạn, trang bị lại 30s) | Mặc định |
| Cần trúc | 3.6m | 2 / 2 / 45m / 10 | 500đ | Cấp 1 |
| Cần composite 4.5m | 4.5m | 3 / 3 / 60m / 20 | 2.000đ | Cấp 3 |
| Cần carbon 5.4m | 5.4m | 4 / 4 / 80m / 40 | 8.000đ | Cấp 5 |
| Cần carbon 6.3m | 6.3m | 5 / 5 / 100m / 80 | 25.000đ | Cấp 7 |

**B. Cần lure** (map Suối, Cửa sông) — cần máy ngang/dọc + mồi giả
| Cần | Loại | Chỉ số | Giá | Mở khóa |
|---|---|---|---|---|
| Cần lure UL | Ultra-light | 1 / 5 / 30m / 10 | 3.000đ | Cấp 4 (mở map Suối) |
| Cần lure L | Light | 2 / 4 / 45m / 20 | 8.000đ | Cấp 6 |
| Cần lure M | Medium | 3 / 3 / 60m / 30 | 18.000đ | Cấp 8 |
| Cần lure MH biển | Medium-heavy | 4 / 3 / 80m / 50 | 40.000đ | Cấp 10 (mở map Cửa sông) |

**C. Cần lục** (map Hồ, Đập) — câu xa bờ, phao lục
| Cần | Chỉ số | Giá | Mở khóa |
|---|---|---|---|
| Cần lục composite | 3 / 2 / 120m / 20 | 12.000đ | Cấp 6 |
| Cần lục carbon | 5 / 4 / 150m / 50 | 35.000đ | Cấp 8 |

**D. Cần iso** (map Cửa sông)
| Cần | Chỉ số | Giá | Mở khóa |
|---|---|---|---|
| Cần iso 5.3m | 3 / 4 / 70m / 30 | 20.000đ | Cấp 10 |

**E. Cần máy (spinning) đa năng** (map Sông, Đập)
| Cần | Chỉ số | Giá | Mở khóa |
|---|---|---|---|
| Cần máy 2.4m | 3 / 3 / 70m / 30 | 6.000đ | Cấp 2 (mở map Sông) |
| Cần máy 3.0m bạo lực | 5 / 2 / 90m / 60 | 30.000đ | Cấp 8 (săn cá khủng) |

**F. Cần đặc biệt**
| Cần | Đặc điểm | Cách sở hữu |
|---|---|---|
| Cần tre "huyền thoại" | Skin tre mạ đồng, chỉ số = cần trúc | Thành tựu "Người giữ hồn quê" (câu 100 con bằng cần tre) |
| **Cần mạ vàng** | Chỉ số max mọi dòng, hiệu ứng lấp lánh, quăng có vệt sáng | Thành tựu cuối "Đại lão" (hoàn thành mọi map + 36 loài) — KHÔNG bán bằng tiền |

### 4.4. Quy tắc cân bằng

- Cần xịn không bao giờ đảm bảo dính cá — chỉ nới rộng "cửa sổ kỹ năng" (vùng xanh rộng hơn, quăng xa hơn). Kỹ năng người chơi vẫn quyết định 70%.
- Cần tre luôn dùng được ở mọi map (yếu nhưng vui) — giữ đúng tinh thần "cần tre vô hạn" của bản gốc.

---

## 5. CHẾ ĐỘ CHƠI

### 5.1. Tự do ✅ (đã có)

Câu thoải mái, không giới hạn giờ — mode học và thư giãn chính.

### 5.2. ⭐ TRỐN VỢ ĐI CÂU (mode chủ lực mới)

> Mode hài riêng biệt. Thông điệp ngầm: cân bằng gia đình — không cổ xúy nói dối ngoài đời.

**Luật chơi cốt lõi:**

| Yếu tố | Chi tiết |
|---|---|
| **Thanh Nghi ngờ** (0–100) | Tăng khi: đi câu giờ lạ (+10), về trễ mỗi 30 phút (+15), tiêu >5.000đ đồ câu/ngày (+10), bị phát hiện nói dối (+40). Giảm khi: mang cá về nấu ăn (-20, mini-game "vào bếp" 30s), làm việc nhà (-15, mini-game rửa bát/lau nhà), ở nhà trọn 1 ngày (-30). Nghi ngờ ≥ 80 → bị "cấm câu" 2 ngày trong game. |
| **Giờ giới nghiêm** | Mỗi chuyến đi, vợ đặt giờ về (ví dụ 18h). Về đúng giờ: Nghi ngờ -5, thưởng "chồng ngoan". Về trễ: mỗi 30 phút +15 Nghi ngờ, NHƯNG ở lại thêm = cơ hội gặp cá khủng (khung giờ vàng tối) — đánh đổi rủi ro/phần thưởng rõ ràng, người chơi tự cân. |
| **Cuộc gọi bất ngờ** | Ngẫu nhiên giữa buổi câu, vợ gọi: "Đang ở đâu đấy?". Mini-game 5 giây chọn câu trả lời: (a) Nói thật "đang câu cá" → +10 Nghi ngờ nhưng +1 "Chân thành" (đủ 5 Chân thành = xóa 1 lần cấm); (b) Nói dối trơn ("đang họp!") → qua được thì không sao, nhưng có 30% bị "soi" qua mini-game phụ "tìm sơ hở" (vợ hỏi vặn 1 câu mẹo) — trả lời sai +40 Nghi ngờ. |
| **Nhiệm vụ tuần** | Ví dụ "Cuối tuần này ở nhà đưa vợ đi chợ". Hoàn thành → tuần sau vợ "duyệt" cho đi map xịn (mở khóa sớm 1 map) + Nghi ngờ reset về 20. Bỏ qua 2 tuần liên tiếp → Nghi ngờ +30. |
| **Thang "Hạnh phúc gia đình"** | Song song với Nghi ngờ: cho vợ ăn cá ngon, tặng quà (mua bằng tiền game) tăng Hạnh phúc → mở skin, danh hiệu "Chồng quốc dân". |

**Phần thưởng mode:** danh hiệu hài ("Thánh lén", "Vua giờ giới nghiêm"), skin cần câu, và cá đặc biệt chỉ cắn khi... đi lén (cá "may mắn" hiếm).

### 5.3. Giải đấu cuối tuần

- Mỗi cuối tuần (giờ thật): 1 map được chọn, thi câu con cá nặng nhất trong 30 phút.
- Bảng xếp hạng tuần (giả lập AI + bạn bè sau này), thưởng tiền game + cúp.
- Không tốn mồi thật của người chơi (mồi giải đấu do BTC phát) — công bằng.

### 5.4. Nhiệm vụ ngày

- 3 nhiệm vụ/ngày, ví dụ: "Câu 3 con rô phi", "Câu được cá trên 2kg", "Thử 1 loại mồi mới".
- Thưởng: tiền, mồi miễn phí, điểm kinh nghiệm.
- Mục đích: lý do quay lại mỗi ngày (retention).

### 5.5. Sân tập

- Luyện miễn phí, không tốn mồi, không được tiền: tập cân phao, tập bắt nhịp (chọn pattern loài bất kỳ), tập bo cá (chọn độ khó).
- Mỗi kỹ thuật có "chứng chỉ" khi đạt điểm cao — khoe được.

---

## 6. MỒI & PHỤ KIỆN MỞ RỘNG

### 6.1. Mồi tự nhiên (kiếm bằng mini-game, đúng tinh thần bản gốc)

| Mồi | Cách kiếm | Hợp với |
|---|---|---|
| Giun đất ✅ | Đào (mini-game chọc ô đất, 20s) | Đa số cá ao/sông |
| Dế | Mini-game "bắt dế đêm" (soi đèn, click nhanh) | Trê, ngạnh, cá quả |
| Tép | Mini-game "vớt tép" (vợt theo bầy) | Thác lác, bống, cá hồng |
| Ốc | Nhặt ở bờ (click, giới hạn/ngày) | Trắm đen, còm |
| Châu chấu | Bắt ở bãi cỏ | Chày suối, rô đồng mùa mưa |

### 6.2. Mồi trộn (học công thức thật)

Người chơi tự trộn theo công thức, trộn đúng tỉ lệ tăng 20–40% tỉ lệ cắn đúng loài mục tiêu:

| Công thức | Nguyên liệu | Hợp nhất |
|---|---|---|
| Cám thơm cơ bản ✅ | Cám cá + nước | Rô phi, diêu hồng |
| Khoai ủ chua | Khoai lang ủ 3 ngày + cám | Chép, mè |
| Mồi chua nổi | Cám + dấm + bông tuyết | Mè trắng/hoa |
| Mồi tanh đáy | Cám tanh + tép xay | Trê, ngạnh, lăng |

### 6.3. Mồi giả (cho cần lure, mòn dần theo lần quăng)

Thìa (spoon), nhái hơi, mồi mềm (soft plastic), popper, minnow. Mỗi loại có action bơi khác nhau khi rê.

### 6.4. Phụ kiện

| Phụ kiện | Tác dụng trong game |
|---|---|
| Phao (3 loại: thường/nhạy/siêu nhạy) | Phao nhạy → thấy pattern cắn rõ hơn (vùng xanh bắt nhịp rộng +10/20%) |
| Lưỡi (số 1–10) | Lưỡi đúng size cá mục tiêu → tỉ lệ dính +15%; sai size dễ sảy |
| Dây (nilon/PE) | PE khỏe hơn, chịu cá to; nilon rẻ |
| Chì (lá/viên, nhiều cỡ) | Dùng trong mini-game cân phao; chì nặng cho câu đáy dòng chảy |
| Vợt | Không có vợt mà câu cá >3kg → tỉ lệ tuột lúc vớt 50% |
| Thùng giữ cá sống | Cá sống bán giá ×1.5 so với cá ướp đá; không thùng → cá chết sau 2h |

---

## 7. KINH TẾ & TIẾN TRÌNH

### 7.1. Cấp độ Cần thủ (1–15)

Lên cấp bằng điểm kinh nghiệm (câu cá, hoàn thành nhiệm vụ, chứng chỉ sân tập). Mỗi cấp mở khóa map/cần/mồi mới — KHÔNG mở bằng tiền.

### 7.2. Tiền game (đ)

- Kiếm: bán cá (giá = kg × giá/kg × hệ số tươi: sống ×1.5, ướp đá ×1.0), thưởng nhiệm vụ/giải đấu.
- Tiêu: cần, mồi, phụ kiện, thay dây, vé giải đấu.
- Nguyên tắc: người chơi chăm chỉ 1–2 tuần mở được cần carbon đầu tiên; cần mạ vàng KHÔNG mua được bằng tiền.

### 7.3. Chống pay-to-win

- Tiền thật (IAP) chỉ mua: skin, trang trí ao, gói tiện ích (thêm ô túi) — KHÔNG bán cần xịn, không bán "tỉ lệ cắn".
- Nguồn thu chính của nhà phát hành: **link affiliate** đồ câu thật (xem GDD 36 trang).

---

## 8. LỘ TRÌNH TRIỂN KHAI (dự kiến 10 tuần)

| Đợt | Thời gian | Nội dung | Mục tiêu kiểm chứng |
|---|---|---|---|
| 1 | Tuần 1–2 | Map Sông quê + 8 loài mới + cần máy + nhiệm vụ ngày | Người chơi có lý do quay lại mỗi ngày |
| 2 | Tuần 3–4 | **Mode Trốn vợ đi câu** full (nghi ngờ, giờ giới nghiêm, cuộc gọi, nhiệm vụ tuần) | Mode hài được yêu thích, không gây phản cảm |
| 3 | Tuần 5–7 | Map Hồ + mini-game cân phao + cần lục + 8 loài hồ | Người chơi học được cân phao thật |
| 4 | Tuần 8–10 | Map Đập (cá khủng) + Map Suối (lure UL) + Map Cửa sông (thủy triều) + giải đấu cuối tuần | Hoàn thiện 6 map, 40 loài |

Mỗi đợt xong đều test với 10–20 cần thủ thật trước khi sang đợt tiếp theo.

---

*Hết tài liệu mở rộng v2.0 — chờ bạn duyệt để bắt đầu code Đợt 1.*
