# ⚡ Chuyển Tiền Nhanh 24/7 - Tạo & Chia Sẻ Link Kèm Mã VietQR Tức Thì

> **Chuyển Tiền Nhanh (QR Fast)** là nền tảng web hiện đại giúp tạo và chia sẻ liên kết chuyển khoản ngân hàng kèm mã VietQR (chuẩn Napas 24/7). Mỗi lần nhấn tạo, hệ thống sinh ra một **đường link chứa ký tự mã hóa ngẫu nhiên** duy nhất, bảo mật và tương thích với hơn 50 ngân hàng tại Việt Nam cùng các ví điện tử hàng đầu.

🌐 **Trang web chính thức:** [chuyentiennhanh.vercel.app](https://chuyentiennhanh.vercel.app/)  
📦 **Kho mã nguồn GitHub:** [github.com/tghip26/qrfast](https://github.com/tghip26/qrfast)

[![Website](https://img.shields.io/badge/Website-chuyentiennhanh.vercel.app-00F5A0?style=for-the-badge&logo=vercel)](https://chuyentiennhanh.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-tghip26%2Fqrfast-0099FF?style=for-the-badge&logo=github)](https://github.com/tghip26/qrfast)

---

## ✨ Điểm Nổi Bật & Tính Năng Chính

- 🔀 **Link mã hóa ngẫu nhiên (Randomized Encrypted Slugs):** Mỗi lần tạo mã, thuật toán kết hợp khóa ngẫu nhiên (cryptographic salt) và con dấu thời gian (timestamp) để sinh ra đường dẫn URL hoàn toàn độc nhất vô nhị. Người nhận mở link là xem được ngay thông tin chuyển khoản mà không cần lưu cơ sở dữ liệu cồng kềnh.
- 🏦 **Hỗ trợ hơn 50 ngân hàng Việt Nam:** Tích hợp đầy đủ danh mục ngân hàng theo chuẩn Napas (Vietcombank, MB, Techcombank, VPBank, ACB, BIDV, VietinBank, TPBank, VIB, Sacombank, Timo, Cake, Viettel Money,...). Tự động cập nhật logo và thông tin mới nhất từ API VietQR.
- 📱 **Tương thích 100% các App Ngân Hàng:** Quét được trên tất cả ứng dụng mobile banking và ví MoMo, ZaloPay, VNPT Money.
- 💵 **Hỗ trợ số tiền & dịch tự động sang chữ:** Nhập số tiền chuyển khoản với các phím tắt nhanh (+50k, +100k, +200k, +500k, +1tr, +2tr, +5tr) và tự động dịch thành chữ tiếng Việt (ví dụ: *Năm trăm nghìn đồng*) giúp tránh nhầm lẫn.
- 📋 **Trang thanh toán tối ưu cho người nhận:**
  - Sao chép 1 chạm số tài khoản, số tiền và nội dung chuyển khoản với hiệu ứng rung/thông báo trực quan.
  - Phím tắt mở nhanh ứng dụng ngân hàng hoặc tải ảnh mã QR chất lượng cao về máy.
- 🌓 **Giao diện chuẩn Fintech:** Hỗ trợ đầy đủ Dark Mode (chế độ tối thời thượng) và Light Mode (chế độ sáng trang nhã), thiết kế kính mờ (glassmorphism), hiệu ứng chuyển động mượt mà.
- 📜 **Lịch sử liên kết tự động (Local Storage):** Quản lý các liên kết đã tạo trực tiếp trên trình duyệt của bạn, dễ dàng chia sẻ lại bất kỳ lúc nào.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** React 19, Vite 8
- **Styling:** Vanilla CSS Custom Design System (Glassmorphism, CSS Custom Properties, Responsive Layout)
- **Icons:** Lucide React
- **QR Generation:** Chuẩn VietQR API & Fallback Client-side QRCode engine
- **Hiệu ứng:** Canvas Confetti

---

## 🚀 Cài Đặt & Chạy Cục Bộ

1. **Clone mã nguồn về máy:**
   ```bash
   git clone https://github.com/tghip26/qrfast.git
   cd qrfast
   ```

2. **Cài đặt thư viện:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Khởi chạy máy chủ phát triển:**
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại: `http://localhost:5173/`

4. **Đóng gói phiên bản phát hành (Production Build):**
   ```bash
   npm run build
   ```

---

## 🌐 Hướng Dẫn Triển Khai (Deployment)

### 1. Triển khai lên Vercel (Khuyên dùng)
1. Đăng nhập vào [Vercel](https://vercel.com/).
2. Nhấn **Add New Project** và chọn kho mã nguồn `tghip26/qrfast`.
3. Vercel sẽ tự động phát hiện cấu hình Vite, nhấn **Deploy**.

### 2. Triển khai lên GitHub Pages
Dự án sử dụng cơ chế định tuyến băm (`#/p/<token>`) nên có thể triển khai tĩnh trực tiếp lên GitHub Pages mà không sợ lỗi 404 khi người dùng tải lại trang:
1. Thêm cấu hình `base: './'` trong `vite.config.js`.
2. Chạy `npm run build` và đẩy thư mục `dist` lên nhánh `gh-pages` hoặc dùng GitHub Actions.

---

## 🔒 Bảo Mật & Quyền Riêng Tư

- Ứng dụng **không thu thập** mật khẩu, mã PIN, mã OTP hay thông tin bảo mật ngân hàng của người dùng.
- Đường link mã hóa hoạt động độc lập trên phía client, bảo đảm an toàn dữ liệu và quyền riêng tư tối đa.

---

## 📄 Bản Quyền

Dự án được phân phối dưới giấy phép [MIT License](LICENSE).
Được phát triển bởi [Tg Hip](https://github.com/tghip26).
