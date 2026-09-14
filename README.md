# Snapbox Studio — Korean Photobooth (Life 4 Cuts / Photoism Experience) ✦

Ứng dụng Web Photobooth chuyên nghiệp phong cách Hàn Quốc chạy 100% Client-side trên trình duyệt, không tốn chi phí máy chủ, bảo mật riêng tư tuyệt đối.

---

## ✨ Tính năng nổi bật đã nâng cấp

1. **Bố cục đa dạng (Layouts)**:
   - **1 ảnh**: Kiểu Polaroid nghệ thuật.
   - **2 ảnh**: Dải dọc đôi.
   - **3 ảnh**: Dải ba vintage.
   - **4 ảnh**: Dải dọc kinh điển 2x6 inch chuẩn Hàn Quốc (*Life Four Cuts*).
   - **4 ô**: Lưới vuông 2x2 hiện đại.
   - **6 ảnh**: Lưới 2x3 dạng bưu thiếp (postcard).
   - **8 ảnh**: Dải kép 2x4 (cặp dải photobooth để chia sẻ với bạn bè).
   - **9 ảnh**: Lưới 3x3 phong cách photocard / Instagram Feed.

2. **Tách nền AI thời gian thực (MediaPipe AI Selfie Segmentation)**:
   - Tách người khỏi nền phòng thực tế không cần phông xanh.
   - Thay nền với thư viện màu Pastel Studio, Gradient hoàng hôn, Cực quang hoặc Ảnh phong cảnh quán Cafe, phố Tokyo.
   - Hỗ trợ **Tải ảnh nền riêng** từ thiết bị.

3. **Bộ lọc màu K-Beauty & Film**:
   - *Tự nhiên (Natural)*
   - *✨ K-Beauty (Mịn da, sáng hồng chuẩn Idol)*
   - *🎞 Film 90s (Tone màu hoài niệm, tương phản retro)*
   - *🖤 Noir B&W (Đen trắng cổ điển)*
   - *🍑 Warm Peach (Ấm áp, ngọt ngào)*
   - *💜 Cyberpunk (Tím neon cá tính)*

4. **Thư viện Khung ảnh phong phú & Khung tự tạo (Custom Frame)**:
   - Các bộ sưu tập: *Y2K Cute*, *Vintage Film*, *Pastel/Minimal*, *Party/Kỷ niệm*, *K-Pop Edition*.
   - **Nút "+ Khung riêng"**: Tải trực tiếp file ảnh PNG/WebP có viền hoa văn trong suốt bạn tải từ Canva/Pinterest/Google hoặc tạo bằng AI (Midjourney/DALL-E) để lồng vào dải ảnh.

5. **Âm thanh & Hiệu ứng chân thực**:
   - Âm thanh đếm ngược bíp bíp sinh tự động qua Web Audio API.
   - Tiếng màn trập máy ảnh "Tách!" và hiệu ứng Flash trắng chớp sáng.
   - Tùy chỉnh đếm ngược: 3s, 5s, 8s, 10s.

6. **Trang trí & Cá nhân hóa**:
   - Đổi dòng chữ kỷ niệm tùy ý (Caption).
   - Tự động in ngày giờ chụp (Timestamp).
   - Bộ Sticker Emoji ngộ nghĩnh dán trực tiếp lên ảnh.

7. **Xuất ảnh chất lượng cao & Chia sẻ tiện lợi**:
   - Xuất file PNG sắc nét chuẩn 300 DPI sẵn sàng để in.
   - **Quét QR Mobile**: Quét camera điện thoại để tải ảnh về máy.
   - **In ảnh**: Tích hợp lệnh in trực tiếp ra máy in màu/máy in nhiệt photobooth.

---

## 🚀 Cách chạy thử trên máy tính (Local)

1. **Dùng VS Code Live Server**:
   - Mở thư mục này trong VS Code.
   - Cài extension `Live Server` rồi bấm chuột phải vào `index.html` chọn **"Open with Live Server"**.
2. **Hoặc dùng lệnh Node / Python**:
   ```bash
   # Cách 1: Python
   python -m http.server 8080

   # Cách 2: Node npx
   npx serve .
   ```
3. Mở trình duyệt tại `http://localhost:8080` (hoặc cổng tương ứng) và bấm Cho phép truy cập Camera.

---

## 🌐 Hướng dẫn Deploy lên mạng miễn phí (30 giây)

### Cách 1: Vercel (Khuyên dùng - nhanh nhất)
1. Đăng ký tài khoản tại [vercel.com](https://vercel.com).
2. Kéo thả thư mục dự án vào Vercel, hoặc đẩy lên GitHub rồi nhấn **Import**.
3. Không cần cài đặt gì thêm (Framework preset: `Other`, Root directory: `./`).
4. Nhấn **Deploy** -> Bạn sẽ nhận được link HTTPS miễn phí trọn đời (ví dụ: `snapbox-studio.vercel.app`).

### Cách 2: Netlify
1. Đăng ký tại [netlify.com](https://netlify.com).
2. Kéo thả toàn bộ thư mục `PHOTOBOTH` vào ô **"Drag and drop your site output folder here"**.
3. Hoàn tất ngay sau 5 giây!

> **Lưu ý quan trọng**: Trình duyệt di động (Chrome, Safari) bắt buộc trang web phải có **HTTPS** mới cho phép mở Camera. Cả Vercel và Netlify đều tự động cấp chứng chỉ HTTPS miễn phí.
