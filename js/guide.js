/* ===== 📖 Cẩm nang câu cá — rút gọn từ "Cẩm nang câu cá Việt Nam từ A–Z" =====
   Mỗi chủ đề là kiến thức câu THẬT cho người mới. Body là HTML thuần (h3/p/ul/li). */
const GUIDE_TOPICS = [
{
  id: 'tu-duy', icon: '🧠', title: 'Tư duy người câu — chuỗi quyết định',
  body: `<h3>Câu cá là một chuỗi quyết định</h3>
<p>Câu cá không phải hành động đơn giản kiểu "ném cần rồi chờ cá cắn". Người câu giỏi nghĩ theo một chuỗi mắt xích, sai một mắt xích là cả bộ đồ hoạt động không đúng:</p>
<p><b>Muốn câu cá gì</b> ↓ <b>Câu ở đâu</b> ↓ <b>Chọn phương pháp</b> ↓ <b>Chọn cần/máy</b> ↓ <b>Chọn dây &amp; rig</b> ↓ <b>Phao/chì/lưỡi</b> ↓ <b>Mồi</b> ↓ <b>Tìm tầng/đáy</b> ↓ <b>Chọn điểm</b> ↓ <b>Đọc tín hiệu</b> ↓ <b>Đóng &amp; dòng cá</b></p>
<h3>Ví dụ cho dễ hình dung</h3>
<ul>
<li>Câu rô phi ở hồ dịch vụ khác hẳn câu cá lóc trong ruộng — từ cần, mồi tới cách đọc tín hiệu đều khác.</li>
<li>Câu chép đáy hồ lớn khác câu chép bằng cần tay — khoảng cách và bộ đồ khác nhau hoàn toàn.</li>
<li>ISO ngoài ghềnh biển khác phao nước ngọt — phải tính dòng chảy và tầng nước.</li>
</ul>
<h3>Chuyện thuật ngữ</h3>
<p>Trong cộng đồng câu cá Việt Nam có nhiều cách gọi theo vùng miền, nhiều bài bán hàng trên mạng dùng thuật ngữ không thống nhất. Cẩm nang này ưu tiên <b>cách hiểu thực hành</b>: hiểu để làm được, không học vẹt tên gọi. Các thông số kích cỡ giữa các hãng cũng đừng coi là chuẩn tuyệt đối nhé!</p>`
},
{
  id: 'moi-truong', icon: '🗺️', title: '7 môi trường câu ở Việt Nam',
  body: `<h3>1. Ao làng, ao tự nhiên</h3>
<p>Bờ đất, nhiều cỏ/bèo/sen, đáy bùn; thường sâu khoảng <b>0,5–2,5 m</b> tùy ao. Cá thường gặp: rô đồng, rô phi, trê, chép, diếc, lóc, trắm (ao nuôi). Phương pháp: cần tay, câu đài, phao đơn giản, câu đáy nhẹ, lure cá lóc.</p>
<h3>2. Hồ dịch vụ</h3>
<p>Có vị trí ngồi câu rõ ràng, thường thả cá định kỳ — rất phổ biến với câu đài và săn cá hồ. Cá: chép, rô phi, diêu hồng, trắm, trôi, mè. Phương pháp: câu đài, câu lục, lăng xê, feeder, câu đơn.</p>
<h3>3. Hồ tự nhiên, hồ chứa, hồ thủy lợi/thủy điện</h3>
<p>Diện tích lớn, độ sâu thay đổi mạnh, cá phân bố thưa; <b>gió và địa hình đáy</b> rất quan trọng. Cá: chép, trắm, trôi, mè, lăng, nheo, rô phi. Phương pháp: spinning, lăng xê, feeder, lure, câu đáy, phao xa.</p>
<h3>4. Sông</h3>
<p><b>Dòng chảy là yếu tố quyết định.</b> Phải đọc mép dòng, xoáy, cửa cống, bãi bồi, chân cầu và vùng nước hồi. Cá: chép, trôi, trắm, ngạnh, lăng, trê, nheo, rô phi. Phương pháp: lăng xê, feeder, câu đáy, phao trôi, lure.</p>
<h3>5. Kênh, mương, ruộng</h3>
<p>Không gian nhỏ, nhiều cỏ/bèo/chướng ngại — rất đặc trưng vùng nông thôn. Cá: lóc, rô, trê, sặc, rô phi, chạch. Phương pháp: cần tre/cần tay, phao đơn giản, mồi sống, lure cá lóc.</p>
<h3>6. Đầm, phá, cửa sông</h3>
<p>Nước lợ, độ mặn và dòng thay đổi theo thủy triều. Cá: chẽm, đối, dìa, hanh, hồng, mú nhỏ, ngát. Phương pháp: lure, ISO, câu đáy, câu phao.</p>
<h3>7. Biển</h3>
<p>Gồm bờ cát, ghềnh đá, cầu cảng, cửa biển, tàu gần bờ và xa bờ. Phương pháp: surfcasting, ISO, jigging, popping, lure biển, câu đáy, trolling.</p>`
},
{
  id: 'can-tay', icon: '🎣', title: 'Cần tay & câu đài — bộ trục',
  body: `<h3>Cần tay truyền thống</h3>
<p>Chuỗi bộ đồ: <b>Cần</b> ↓ <b>Dây</b> ↓ <b>Phao</b> ↓ <b>Chì</b> ↓ <b>Lưỡi</b> ↓ <b>Mồi</b>. Không dùng máy câu. Cần có thể bằng tre/trúc, sợi thủy tinh hoặc carbon. Đây là hệ tốt nhất để người mới <b>hiểu trực tiếp quan hệ giữa phao, chì, lưỡi, mồi và độ sâu</b> — nhìn tận mắt, sờ tận tay.</p>
<h3>Câu đài</h3>
<p>Rất phổ biến ở hồ dịch vụ. Dây trục nối trực tiếp với đầu cần, không có máy. Thứ tự bộ trục từ trên xuống:</p>
<p><b>Đầu cần</b> ↓ <b>Dây trục</b> ↓ <b>Chặn phao</b> ↓ <b>Đế phao</b> ↓ <b>Chặn phao</b> ↓ <b>Chặn chì</b> ↓ <b>Chì lá</b> ↓ <b>Chặn chì</b> ↓ <b>Khóa số 8</b> ↓ <b>Dây thẻo</b> ↓ <b>Hai lưỡi</b></p>
<p>Đồ nghề đi kèm: cần đài, bộ trục, phao và hộp phao, dây thẻo/lưỡi, chì lá và kéo chì, gác cần, vợt, rọng cá, ghế/thùng câu, khay mồi, ô câu, hộp phụ kiện.</p>
<h3>Trục và thẻo — đừng nhầm!</h3>
<p><b>Dây trục</b> là dây chính. <b>Dây thẻo</b> nối từ khóa số 8 tới lưỡi, thường <b>nhỏ/yếu hơn trục</b>. Khi mắc đáy hoặc quá tải, mục tiêu là <b>thẻo đứt trước</b> để giảm nguy cơ mất cả phao, chì và trục — mất con cá còn hơn mất cả bộ đồ!</p>
<h3>Ba trạng thái hai lưỡi</h3>
<ul>
<li><b>Hai lưỡi lơ lửng:</b> câu tầng nước.</li>
<li><b>Một lưỡi chạm đáy:</b> câu sát đáy.</li>
<li><b>Hai lưỡi chạm/nằm đáy:</b> dùng khi cần ổn định mồi hoặc câu cá đáy tùy cấu hình.</li>
</ul>`
},
{
  id: 'can-phao', icon: '🎈', title: 'Cân phao & tìm đáy — chỉnh 4 câu 2',
  body: `<h3>Mục phao là gì?</h3>
<p>Ăng-ten phao thường chia thành các đoạn màu. Mỗi đoạn thường được gọi là một <b>mục</b>. "Nổi 4 mục" nghĩa là bốn đoạn trên ăng-ten nằm trên mặt nước.</p>
<h3>Bài nhập môn: chỉnh 4 – câu 2</h3>
<ul>
<li><b>Bước 1:</b> Chưa gắn mồi; để lưỡi không chạm đáy.</li>
<li><b>Bước 2:</b> Điều chỉnh lượng chì tới khi phao nổi khoảng <b>4 mục</b>.</li>
<li><b>Bước 3:</b> Gắn mồi — trọng lượng mồi làm phao chìm thêm.</li>
<li><b>Bước 4:</b> Dịch phao dần lên trên dây để tìm đáy.</li>
<li><b>Bước 5:</b> Khi đạt trạng thái mục tiêu (ví dụ khoảng <b>2 mục</b> nổi) và lưỡi/mồi có trạng thái đáy mong muốn, bắt đầu câu.</li>
</ul>
<p>"4–2" chỉ là <b>bài tập nhập môn, không phải công thức cố định</b>. Thực tế còn có: chỉnh cao câu thấp, chỉnh thấp câu cao, câu lửng, sát đáy, chì chạm đáy, chạy chì và nhiều cấu hình khác.</p>
<h3>Quy trình dò đáy cơ bản</h3>
<ul>
<li>Gắn chì dò đáy hoặc tạo tải đủ nặng.</li>
<li>Thả đúng điểm định câu.</li>
<li>Nếu phao chìm hoàn toàn, dịch phao lên.</li>
<li>Lặp lại đến khi đầu phao vừa xuất hiện.</li>
<li>Ghi nhận độ sâu và điều chỉnh lại rig theo kiểu câu.</li>
</ul>
<p>Nhớ kỹ: <b>nếu không biết độ sâu, bạn không biết mồi thực sự đang ở đâu</b> trong cột nước — câu mò thì hên xui lắm!</p>`
},
{
  id: 'can-may', icon: '⚙️', title: 'Cần máy — spinning, baitcasting, drag',
  body: `<h3>Spinning — bạn thân của người mới</h3>
<p>Máy spinning <b>nằm phía dưới cần</b>, dễ học, ít rối hơn baitcasting và dùng được cho nhiều kiểu câu. Lưu ý: <b>size máy chỉ mang tính tương đối</b> vì cách đánh số không hoàn toàn giống nhau giữa các hãng — đừng thấy số to là nghĩ máy khỏe!</p>
<h3>Baitcasting — chính xác nhưng khó tính</h3>
<p>Máy ngang <b>nằm trên cần</b>. Ưu điểm: kiểm soát mồi và độ chính xác tốt. Nhược điểm: người mới dễ <b>nổ cước/birdnest</b> (dây rối thành tổ chim). Ba nút phải hiểu:</p>
<ul>
<li><b>Spool tension:</b> kiểm soát độ tự do ban đầu của spool.</li>
<li><b>Brake:</b> hỗ trợ kiểm soát tốc độ spool khi ném.</li>
<li><b>Drag:</b> kiểm soát lực nhả dây khi cá kéo.</li>
</ul>
<h3>Drag — phanh hãm cứu cần</h3>
<p>Drag cho phép cá <b>kéo dây ra khi lực vượt ngưỡng</b>. Đây là cơ chế bảo vệ cả bộ đồ. <b>Khóa drag quá chặt</b> có thể làm đứt dây, bật lưỡi, rách miệng cá hoặc quá tải cần — lúc đó đừng trách con cá, trách mình siết phanh quá tay!</p>`
},
{
  id: 'lang-xe', icon: '🪝', title: 'Lăng xê & feeder',
  body: `<h3>Bộ đồ lăng xê / câu đáy</h3>
<p>Chuỗi: <b>Cần máy</b> ↓ <b>Máy spinning</b> ↓ <b>Dây chính</b> ↓ <b>Chì hoặc feeder</b> ↓ <b>Thẻo</b> ↓ <b>Lưỡi</b> ↓ <b>Mồi</b>. Người câu <b>ném bộ mồi/chì ra xa rồi chờ cá</b> — hợp với sông, hồ lớn, chỗ không với tới bằng cần tay.</p>
<h3>Đọc tín hiệu không cần phao</h3>
<p>Tín hiệu có thể đọc qua <b>đầu cần, chuông, báo cá điện tử hoặc độ căng dây</b> — không nhất thiết phải dùng phao. Các rig thường gặp:</p>
<ul>
<li><b>Chì cuối dây</b> — đơn giản, dễ làm.</li>
<li><b>Chì chạy</b> — chì trượt tự do trên dây, cá kéo ít cảm nhận được sức cản.</li>
<li><b>Feeder/lồng mồi</b> — vừa làm chì vừa mang mồi xả xuống.</li>
<li><b>Lưỡi đơn</b> — một số cấu hình nhiều lưỡi tùy phương pháp.</li>
</ul>
<h3>Feeder — dụ cá tới tận lưỡi</h3>
<p>Feeder đưa <b>thức ăn và lưỡi vào cùng một khu vực</b>. Các dạng thường gặp: cage feeder, method feeder và các lồng/chì chứa mồi. Dưới nước: feeder nằm đáy, mồi xả đang tan tạo vùng thức ăn, hookbait (mồi trên lưỡi) nằm sát vùng mồi — cá vào ăn xả thì kiểu gì cũng gặp lưỡi của bạn!</p>`
},
{
  id: 'lure', icon: '🐸', title: 'Câu lure — mồi giả, cá thật',
  body: `<h3>Nguyên lý</h3>
<p>Lure dùng <b>mồi giả</b> và người câu <b>chủ động tạo chuyển động</b> để mô phỏng cá con, ếch, côn trùng hoặc sinh vật bị thương — đánh vào bản năng săn mồi của cá. Chuỗi bộ đồ: <b>Cần</b> ↓ <b>Máy</b> ↓ <b>Dây PE</b> ↓ <b>Leader</b> ↓ <b>Snap</b> ↓ <b>Mồi giả</b>.</p>
<h3>Power và Action của cần</h3>
<ul>
<li><b>Power</b> thường gặp: UL, L, ML, M, MH, H, XH (từ siêu nhẹ tới siêu khỏe).</li>
<li><b>Fast action:</b> chủ yếu cong phần ngọn, phản hồi nhanh.</li>
<li><b>Moderate:</b> cong sâu hơn xuống thân cần.</li>
<li><b>Slow:</b> cong nhiều cả thân cần.</li>
</ul>
<h3>Nhóm mồi lure</h3>
<p>Minnow, crankbait, vibration, spoon, spinner, spinnerbait, chatterbait, jig, soft plastic/worm/shad, frog/nhái, popper, pencil, jerkbait. Ba trạng thái quan trọng phải nhớ: <b>Floating</b> (nổi), <b>Suspending</b> (lơ lửng), <b>Sinking</b> (chìm) — chọn sai tầng là cá không thèm ngó!</p>
<h3>Lure cá lóc — đặc sản đồng quê</h3>
<p>Địa hình thường gặp: ao sen, ruộng, kênh, bèo, cỏ ngập. Mồi phổ biến: <b>frog/nhái, soft frog, spinnerbait, soft plastic</b>. Bộ đồ phải xét khả năng <b>kéo cá khỏi chướng ngại</b> — lóc mắc câu là chui ngay vào bèo! Đường rê hợp lý: mép bèo, lỗ trống, cỏ ngập; tránh vùng nguy cơ mắc.</p>`
},
{
  id: 'luc', icon: '🎯', title: 'Câu lục — tỳ & bềnh',
  body: `<h3>Lục là gì?</h3>
<p><b>Lưỡi lục là cụm nhiều lưỡi</b> — một hệ câu riêng, cần tách khỏi lure. Trong cách gọi phổ biến có hai tín hiệu kinh điển: <b>"tỳ"</b> và <b>"bềnh"</b>.</p>
<h3>Lục tỳ</h3>
<p>Theo dõi <b>tín hiệu phao tụt</b> khi hệ dây/lưỡi bị tác động — cá chạm vào làm phao chìm xuống. Thấy tụt là đóng!</p>
<h3>Lục bềnh</h3>
<p>Theo dõi <b>phao nổi cao bất thường</b> khi tải dưới nước được nhấc/giảm — cá nâng cụm lưỡi lên làm phao bềnh lên. Thấy bềnh cũng đóng!</p>
<h3>Biến thể và form lưỡi</h3>
<p>Các biến thể thường được nhắc tới: <b>lục đầu cần, chân cọc, chà bèo, xa bờ, tỳ, bềnh</b>. Một số form lưỡi được gọi theo dân gian như <b>xoài, thúng, tay quỷ, lưỡi hái, mác, móng rồng</b> — cách gọi có thể khác nhau theo từng nhóm cần thủ, đừng hoang mang khi nghe tên lạ!</p>`
},
{
  id: 'iso', icon: '🌊', title: 'ISO & câu biển ven bờ',
  body: `<h3>ISO là gì?</h3>
<p>ISO dùng <b>cần dài nhiều khoen nhỏ, máy spinning, phao, dây, chì nhỏ, leader và lưỡi đơn</b>. Kỹ thuật chú trọng <b>đưa mồi theo dòng và tầng nước</b> — đứng ghềnh đá mà thả mồi trôi tự nhiên như mồi thật. Cần phân biệt với <b>surfcasting</b>, vốn thiên về ném xa từ bờ.</p>
<h3>Môi trường biển</h3>
<p>Câu biển gồm nhiều địa hình, mỗi nơi một kiểu chơi:</p>
<ul>
<li><b>Bờ cát</b> — surfcasting ném xa là vua.</li>
<li><b>Ghềnh đá</b> — sân nhà của ISO, chú ý an toàn sóng.</li>
<li><b>Cầu cảng, cửa biển</b> — nơi cá tụ theo dòng và ánh đèn.</li>
<li><b>Tàu gần bờ và xa bờ</b> — ra khơi săn cá lớn.</li>
</ul>
<h3>Các phương pháp biển</h3>
<p>Surfcasting, ISO, jigging, popping, lure biển, câu đáy, trolling — mỗi kiểu một bộ đồ và một kiểu cá. Người mới từ nước ngọt ra biển nhớ: <b>đồ câu biển phải chịu được nước mặn</b>, về là phải rửa ngay không là rỉ sét khóc không kịp!</p>`
},
{
  id: 'nhom-ca', icon: '🐟', title: 'Nhóm cá theo tập tính',
  body: `<h3>Biết cá thì mới dụ được cá</h3>
<p>Đừng học từng loài một cách rời rạc — hãy nhóm cá theo <b>tập tính ăn</b>, từ đó suy ra tầng nước và phương pháp:</p>
<ul>
<li><b>Ăn tạp/hiền</b> — chép, diếc, trôi, trắm cỏ, rô phi, diêu hồng. Sống ở đáy, sát đáy hoặc tầng tùy loài. Phương pháp gợi ý: câu đài, phao, feeder, câu đáy.</li>
<li><b>Ăn lọc</b> — mè trắng, mè hoa. Sống tầng giữa/trên tùy điều kiện. Phương pháp gợi ý: mồi xả, lồng mồi, phao/đáy theo kỹ thuật.</li>
<li><b>Săn mồi</b> — lóc, chẽm, măng. Phục kích ở mép cỏ/vật cản, tầng hoạt động. Phương pháp gợi ý: lure, mồi sống.</li>
<li><b>Đáy</b> — trê, lăng, nheo, ngạnh, chạch. Sống gần đáy, hốc/vật cản. Phương pháp gợi ý: câu đáy, lăng xê, mồi tự nhiên.</li>
</ul>
<h3>Hồ sơ một loài cá nên có gì?</h3>
<p>Khi tìm hiểu sâu một loài, hãy ghi đủ: tên phổ thông, tên vùng miền, môi trường sống, tầng nước, thức ăn, thời gian hoạt động, phản ứng với thời tiết, sức kéo, <b>kiểu chạy khi mắc câu</b>, mồi tự nhiên phù hợp, mồi bột/mồi giả phù hợp và <b>nguy cơ chui vật cản</b>. Biết trước cá chạy kiểu gì thì lúc bo cá không bị bất ngờ!</p>`
},
{
  id: 'diem-cau', icon: '📍', title: 'Chọn điểm & đọc mặt nước',
  body: `<h3>Cá không phân bố đều — chỗ này có, chỗ kia không</h3>
<ul>
<li><b>Sát bờ:</b> thức ăn rơi, côn trùng, cá nhỏ; đôi khi cá lớn cũng áp bờ khi yên tĩnh.</li>
<li><b>Bèo/sen:</b> bóng mát và nơi trú, hợp rô/lóc/trê — nhưng tăng nguy cơ mắc lưỡi.</li>
<li><b>Cây chìm/vật cản:</b> nơi trú tốt nhưng rủi ro mất lưỡi cao.</li>
<li><b>Mũi đất/mép dòng:</b> thay đổi dòng chảy, là đường di chuyển của cá.</li>
<li><b>Cửa nước:</b> thường có oxy và thức ăn trôi vào.</li>
<li><b>Mép sâu/drop-off:</b> đường tuần tra quan trọng của nhiều loài.</li>
<li><b>Vùng nước hồi sau vật cản:</b> dòng chậm lại, có thể giữ thức ăn.</li>
</ul>
<h3>Đọc mặt nước như đọc báo</h3>
<p>Các dấu hiệu đáng chú ý: <b>tăm/bọt, cá quẫy, cá con chạy, bèo chuyển động, dòng và mép dòng, màu nước, gió, côn trùng, chim săn cá</b>. Nhưng nhớ: <b>không phải mọi bong bóng đều là cá</b> — cần kết hợp vị trí, nhịp xuất hiện và chuyển động. Thấy tăm nổi đều đặn một chỗ mới đáng tin, bong bóng lác đác có khi chỉ là... bùn xì hơi!</p>`
},
{
  id: 'moi', icon: '🪱', title: 'Mồi — tự nhiên, mồi bột, mồi xả',
  body: `<h3>Mồi tự nhiên — rẻ, dễ kiếm, cá mê</h3>
<p>Giun, dế, sâu, tép/tôm, cá con, ốc, ngô, khoai, cơm/cám và các nguyên liệu địa phương. Đừng coi thường đồ nhà quê — nhiều khi con giun đào sau vườn hiệu quả hơn mồi mua đắt tiền!</p>
<h3>Mồi bột — khoa học trong viên mồi</h3>
<p>Mồi bột thường gồm <b>nền ngũ cốc/cám, nguồn đạm, hương</b> và thành phần điều chỉnh kết dính. Ba thuộc tính phải hiểu:</p>
<ul>
<li><b>Độ kết dính</b> — dính quá hay bở quá đều hỏng.</li>
<li><b>Tốc độ tan</b> — tan nhanh dụ cá tới mau, tan chậm giữ ổ lâu.</li>
<li><b>Mùi</b> — thứ gọi cá từ xa tới.</li>
</ul>
<h3>Mồi xả và mồi câu — hai vai khác nhau</h3>
<p><b>Mồi xả</b> có nhiệm vụ <b>gom/giữ cá</b> ở điểm câu; <b>mồi câu</b> nằm trên lưỡi để cá đớp. Hai loại có thể giống hoặc khác nhau tùy phương pháp. Minh họa dưới nước với ba viên mồi cùng kích thước: viên <b>quá khô vỡ sớm</b>, viên <b>phù hợp tan dần</b>, viên <b>quá dính gần như không tan</b> — chỉ viên ở giữa mới làm ăn được!</p>`
},
{
  id: 'day-luoi', icon: '🧵', title: 'Dây, lưỡi & nút buộc',
  body: `<h3>Dây Mono/Nylon</h3>
<p>Rẻ, dễ buộc, có độ đàn hồi — bạn thân của người mới. Nhược điểm: giãn và có <b>memory</b> (dây bị "nhớ" hình cuộn, bung ra xoắn).</p>
<h3>Dây PE/Braid (dây bện)</h3>
<p>Đường kính nhỏ so với sức chịu lực, <b>ít giãn, truyền cảm giác tốt</b> — cá nhấp nhẹ cũng biết. Cần chú ý: mài mòn, nút nối dây và nguy cơ <b>cắt tay</b> khi bo cá to!</p>
<h3>Dây Fluorocarbon</h3>
<p>Thường dùng làm <b>leader</b> nhờ khả năng chịu mài mòn và đặc tính quang học/chìm (khó bị cá phát hiện). Nhược điểm: cứng và đắt hơn nylon trong nhiều dòng sản phẩm.</p>
<h3>Lưỡi câu — đừng học theo số!</h3>
<p>Không nên dạy lưỡi chỉ theo số. Cần lưu: <b>gape</b> (độ mở), <b>shank</b> (thân lưỡi), độ dày dây lưỡi, <b>barb/barbless</b> (ngạnh/không ngạnh), eye (khoen), độ cong và loại lưỡi. Các loại: lưỡi đơn, circle hook, offset hook, treble, lưỡi chuyên dụng theo hệ câu.</p>
<h3>Phụ kiện nên biết mặt</h3>
<p>Phao, chì lá/chì hạt/chì giọt/chì trượt, stopper, swivel, snap, snap swivel, khóa số 8, anti-tangle, feeder, chuông/báo cá, rod holder, gác cần, vợt, rọng, kìm, kéo, line cutter, hộp thẻo, hộp lure, ghế, ô và áo phao.</p>
<h3>Nút buộc</h3>
<p>Các nút phổ biến: Improved Clinch, Palomar, Uni, Double Uni, FG, Snell. <b>Lộ trình hợp lý cho người mới: Uni → Palomar → Double Uni → FG.</b> Không cần ép học ngay nút khó nếu rig chưa yêu cầu — buộc chắc nút dễ còn hơn buộc ẩu nút khó!</p>`
},
{
  id: 'doc-phao', icon: '🛟', title: 'Đọc phao — 7 tín hiệu',
  body: `<h3>Phao là "mắt" của bạn dưới nước</h3>
<p>Bảy kiểu tín hiệu phao thường gặp:</p>
<ul>
<li><b>Rung/nhấp</b> — phao rung nhẹ, nhấp nhấp liên tục.</li>
<li><b>Tụt</b> — phao chìm xuống đột ngột.</li>
<li><b>Bềnh</b> — phao nổi cao bất thường.</li>
<li><b>Kéo ngang</b> — phao bị lôi đi ngang mặt nước.</li>
<li><b>Chìm từ từ</b> — phao lặn xuống chậm rãi.</li>
<li><b>Chìm mạnh</b> — phao mất hút trong nháy mắt.</li>
<li><b>Nằm ngang</b> — phao đổ ngang trên mặt nước.</li>
</ul>
<h3>Đừng vội đóng!</h3>
<p><b>Không phải tín hiệu nào cũng đóng cá.</b> Phao có thể phản ứng do cá nhỏ rỉa mồi, cá quệt dây, gió hoặc dòng nước. Bí quyết là quan sát <b>nhịp và biên độ</b>: tín hiệu của cá đang ăn thật thường dứt khoát và lặp lại có nhịp — còn phao "nhảy múa" lung tung thì nhiều khả năng là cá con phá đám! Người mới nên kiên nhẫn quan sát vài nhịp rồi hãy quyết định, vội vàng đóng hụt chỉ tổ mất mồi.</p>`
},
{
  id: 'dong-ca', icon: '💪', title: 'Đóng cá & dòng cá',
  body: `<h3>Đóng cá — mạnh không bằng đúng</h3>
<p><b>Đóng cá không đồng nghĩa giật càng mạnh càng tốt.</b> Lực cần phụ thuộc khoảng cách, độ giãn dây, lưỡi, cần và loài cá. Giật quá mạnh có thể <b>rách mép cá, bật lưỡi hoặc đứt thẻo</b> — bao công chờ đợi đổ sông đổ biển!</p>
<h3>Dòng cá (bo cá)</h3>
<p><b>Cần, dây và drag cùng hấp thụ năng lượng</b> của cá — ba anh em phải phối hợp. Khi cá lao: <b>giữ góc cần phù hợp</b> và để hệ thống làm việc, đừng cố ghì. Khi cá yếu: có thể <b>nâng cần rồi thu dây khi hạ cần</b> (kỹ thuật <b>pump &amp; reel</b>) tùy phương pháp. Độ cong cần phụ thuộc lực cá, power, action, góc cần và độ căng dây — <b>cá nhỏ đừng dòng như cá lớn</b>, mệt mình mệt cá!</p>
<h3>Dùng vợt đúng cách</h3>
<p>Cá nhỏ có thể nhấc lên nếu bộ đồ cho phép; cá vừa/lớn nên dùng vợt. Cách đúng: <b>đưa đầu cá vào vợt rồi nâng vợt lên</b>. Tuyệt đối <b>không nâng cá lớn bằng đầu cần</b> — gãy ngọn cần là khóc ròng!</p>
<h3>Rọng cá và sau khi câu</h3>
<p><b>Rọng/keepnet</b> dùng giữ cá sống trong nước trong buổi câu. Sau khi đưa cá lên: <b>tháo lưỡi an toàn</b> rồi quyết định giữ trong rọng hoặc thả lại theo mục đích và quy định tại điểm câu.</p>`
},
{
  id: 'thuat-ngu', icon: '📚', title: 'Thuật ngữ nhanh',
  body: `<h3>Nói chuyện với cần thủ không bị "quê"</h3>
<ul>
<li><b>Cần đài:</b> cần tay carbon dùng bộ trục nối trực tiếp, không máy.</li>
<li><b>Trục:</b> dây chính của bộ câu đài.</li>
<li><b>Thẻo:</b> đoạn dây nối lưỡi, thường nhỏ hơn trục.</li>
<li><b>Mục phao:</b> một đoạn màu trên ăng-ten phao.</li>
<li><b>Tìm đáy:</b> xác định độ sâu và vị trí đáy so với rig.</li>
<li><b>Drag:</b> cơ cấu nhả dây có kiểm soát trên máy câu.</li>
<li><b>Leader:</b> đoạn dây đầu nối giữa dây chính và mồi/lưỡi.</li>
<li><b>PE/Braid:</b> dây bện, ít giãn.</li>
<li><b>Lure:</b> câu bằng mồi giả, chủ động điều khiển mồi.</li>
<li><b>Feeder:</b> bộ phận mang mồi xả xuống gần lưỡi.</li>
<li><b>Lăng xê:</b> cách gọi phổ biến cho hệ cần máy ném bộ câu/mồi ra xa và chờ cá.</li>
<li><b>Lục:</b> hệ câu dùng cụm lưỡi lục, có các kỹ thuật tỳ/bềnh.</li>
<li><b>ISO:</b> hệ câu phao ven ghềnh/biển, chú trọng dòng và tầng nước.</li>
<li><b>Bo/dòng cá:</b> điều khiển cá sau khi mắc lưỡi cho tới khi đủ yếu để đưa lên.</li>
<li><b>Rọng:</b> lưới/keepnet giữ cá sống trong nước trong buổi câu.</li>
</ul>`
}
];
