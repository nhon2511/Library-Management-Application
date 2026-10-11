# Báo cáo Tiến độ & Kế hoạch Chi tiết Dự án Library Management System

*Ngày xuất báo cáo:* 11/10/2026 23:29:25

---

## 1. Báo cáo Tiến độ Đã hoàn thành (Done)

Toàn bộ Backend Core & Production-Ready Architecture đã hoàn thiện và kiểm thử thành công trên Cloud Database (**Neon PostgreSQL**):
- **Modular Architecture:** Chia tách rõ ràng các module (uth, user, category, ook, ook-copy, orrow, ine, eport, udit-log).
- **Tech Stack:** Node.js, TypeScript, Express.js, Prisma ORM (v7), PostgreSQL (Neon), Zod, JWT.
- **Bảo mật & Tiện ích:** Rate Limiter, Helmet, CORS, Global Error Handler, Zod Validation, RBAC (READER, LIBRARIAN, ADMIN).
- **Nghiệp vụ cốt lõi:** Đăng nhập/Đăng ký (Access + Refresh Token qua HttpOnly Cookie), Quản lý danh mục, Sách, Bản sao & Barcode (LIB-...), Quy trình mượn/trả/gia hạn sách, Tính toán tiền phạt tự động, Quản lý thanh toán/miễn giảm phạt, Báo cáo thống kê Dashboard, và API Root (/api/v1).

---

## 2. Kế hoạch Phát triển Chi tiết (1.5 tháng tới / 6 tuần)

### 🟢 Giai đoạn 1: Xây dựng giao diện Frontend (Tuần 1 & Tuần 2)
**Công nghệ đề xuất:** React.js (Vite) / Next.js, Tailwind CSS, Lucide Icons, React Hook Form + Zod.

#### Tuần 1: Khung giao diện & Module Xác thực (Auth) & Độc giả (Reader View)
- [ ] Khởi tạo dự án Frontend, cấu hình Tailwind CSS, Router, và Axios Client.
- [ ] Giao diện Đăng nhập (/login) và Đăng ký tài khoản (/register) khớp với Zod schema.
- [ ] Giao diện Reader Dashboard: Tra cứu Catalog sách (tìm kiếm, lọc danh mục, phân trang), chi tiết sách, lịch sử mượn cá nhân (/my-borrows), và danh sách tiền phạt (/fines).

#### Tuần 2: Giao diện Quản trị & Thủ thư (Librarian / Admin Dashboard)
- [ ] Thiết lập Protected Routes phân quyền theo Role (ADMIN, LIBRARIAN, READER).
- [ ] Quản lý danh mục & Catalog sách (Thêm, sửa, xóa, thêm bản sao và vị trí kệ).
- [ ] Giao diện Checkout & Return Desk: Thủ thư quét/nhập Barcode để cho mượn và trả sách (tự động hiển thị tiền phạt).
- [ ] Quản lý thu tiền phạt (Settle) và miễn giảm phạt (Waive).
- [ ] Trang Dashboard thống kê tổng quan (Recharts / Chart.js) và Audit Logs dành cho Admin.

---

### 🟡 Giai đoạn 2: Tích hợp hệ thống & Tính năng nâng cao (Tuần 3 & Tuần 4)

#### Tuần 3: Tích hợp API & Quản lý Token (State Management)
- [ ] Cấu hình Axios Interceptors: Tự động đính kèm Bearer Token và tự động gọi API /api/v1/auth/refresh khi token hết hạn (401).
- [ ] Kết nối hoàn chỉnh các form tạo/sửa/xóa với backend kèm Toast notifications.
- [ ] Tích hợp quét Barcode/QR Code qua camera (html5-qrcode) hoặc máy quét USB cầm tay.

#### Tuần 4: Tính năng bổ trợ & Trải nghiệm người dùng (UX Optimization)
- [ ] Tích hợp **Nodemailer / Resend** ở Backend để gửi email xác nhận đặt sách và nhắc nhở hạn trả.
- [ ] Tự động sinh mã QR đại diện cho mã định danh người dùng hiển thị trên Profile để thủ thư quét nhanh.
- [ ] Tối ưu hóa UI/UX: Skeleton Loading, Responsive trên mọi thiết bị.

---

### 🟠 Giai đoạn 3: Kiểm thử, Deployment & Báo cáo đồ án (Tuần 5 & Tuần 6)

#### Tuần 5: Kiểm thử toàn diện (Testing) & Sửa lỗi (Bug Fixing)
- [ ] Viết Unit & Integration Tests (Jest & Supertest) cho quy trình mượn trả, tính tiền phạt và phân quyền API.
- [ ] Kiểm thử End-to-End (E2E) từ góc nhìn Reader -> Librarian -> Admin.
- [ ] Rà soát lỗi, tối ưu truy vấn Prisma và bảo mật.

#### Tuần 6: Triển khai sản phẩm (Cloud Deployment) & Hoàn thiện tài liệu
- [ ] **Cloud Deployment:** Database trên **Neon** (đã sẵn sàng), Backend lên **Render/Railway**, Frontend lên **Vercel/Netlify**.
- [ ] **Tài liệu đồ án:** Vẽ sơ đồ ERD, Sequence Diagram luồng nghiệp vụ, soạn thảo slide thuyết trình và chuẩn bị kịch bản demo bảo vệ đồ án.
