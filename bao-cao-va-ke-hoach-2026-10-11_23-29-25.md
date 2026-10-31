# Báo cáo tiến độ & kế hoạch dự án Library Management System

*Ngày cập nhật:* 01/11/2026

---

## 1. Tổng quan tiến độ

Backend core và frontend MVP đã được xây dựng trong cùng workspace. Backend dùng Node.js, TypeScript, Express, Prisma và PostgreSQL; frontend dùng React, Vite, TypeScript và Tailwind CSS.

Trạng thái hiện tại: **Backend core hoàn thành; Frontend MVP đã tích hợp các API hiện có; một số luồng cần endpoint backend bổ sung trước khi hoàn thiện đầy đủ.**

---

## 2. Hạng mục đã hoàn thành

### 2.1 Backend

- Modular architecture cho các module auth, user, category, book, book-copy, borrow, fine, report và audit-log.
- REST API với prefix `/api/v1` và response contract gồm `success`, `statusCode`, `message`, `data`, `pagination`.
- Authentication với access token, refresh token qua HttpOnly cookie và logout.
- RBAC cho `READER`, `LIBRARIAN` và `ADMIN`.
- Zod validation, rate limiter, Helmet, CORS và global error handler.
- Quản lý category, book, book copy và barcode.
- Reserve, checkout, return, renew và tính fine theo trạng thái/tình trạng bản sao.
- Settle fine cho Librarian/Admin, waive fine có lý do cho Admin và audit log cho thao tác miễn phạt.
- Report overview và audit log API.

### 2.2 Frontend

Frontend nằm trong thư mục `frontend/` và chạy độc lập bằng Vite.

- Auth flow: `/login`, `/register`, protected routes và role-based routes.
- Axios client tập trung, đọc `VITE_API_URL`, gửi credentials và tự refresh access token khi API trả 401.
- Reader flows:
  - `/reader/dashboard`
  - `/catalog`
  - `/books/:id`
  - `/reader/my-borrows`
  - `/reader/fines`
  - `/profile`
- Librarian/Admin flows:
  - `/operations`
  - `/manage/books`
  - `/manage/books/:id/copies`
  - `/manage/categories`
  - `/desk/checkout`
  - `/desk/return`
  - `/manage/fines`
  - `/reports`
  - `/audit-logs` cho Admin
- Có loading skeleton, empty state, filtered-empty state, error/retry state, permission state và success/error feedback.
- Checkout thủ công hỗ trợ tối đa 5 barcode mỗi phiên và chặn barcode trùng trong cùng phiên.
- UI responsive cho desktop/mobile, visible focus, label đầy đủ và hỗ trợ `prefers-reduced-motion`.
- Design direction được ghi tại `frontend/DESIGN.md`, theo hướng “quiet academic library”.
- Không sử dụng dữ liệu giả cho KPI, bảng hoặc biểu đồ.

---

## 3. Kiểm tra đã thực hiện

Trong thư mục `frontend/` đã chạy thành công:

```bash
npm run typecheck
npm run lint
npm run build
```

Đã kiểm tra rendered catalog ở dev server. Khi backend chưa chạy, giao diện hiển thị error/retry state thay vì tự tạo dữ liệu mẫu.

---

## 4. API mismatch và phần cần bổ sung

- Return desk chưa thể hoàn thiện lookup flow vì backend hiện chưa có endpoint tìm borrow record theo barcode hoặc endpoint lấy chi tiết phiếu mượn theo id.
- `/reports/overview` hiện chỉ trả về số tổng quan; chưa đủ dữ liệu cho top sách, overdue theo category và doanh thu fine. Frontend chỉ hiển thị các chỉ số API thực sự trả về.
- Chưa có endpoint export Excel/PDF.
- Camera QR/barcode chưa được bật vì backend chưa có scanner/session contract; checkout hiện hỗ trợ nhập mã thủ công.
- QR định danh người dùng chỉ hiển thị trạng thái/mã API trả về; backend chưa có endpoint sinh QR riêng.

Các phần trên không được frontend tự bịa endpoint hoặc dữ liệu. Cần thống nhất contract backend trước khi triển khai tiếp.

---

## 5. Kế hoạch tiếp theo

### Tuần 1 — Hoàn thiện tích hợp

- [ ] Bổ sung endpoint lookup borrow record cho return desk.
- [ ] Bổ sung response fine phát sinh sau return nếu cần hiển thị chi tiết hơn.
- [ ] Bổ sung endpoint report chi tiết và export nếu yêu cầu demo.
- [ ] Xác nhận contract sinh QR và scanner.

### Tuần 2 — Kiểm thử

- [ ] Unit/integration tests cho auth, RBAC, borrow, return và fine.
- [ ] E2E test cho Reader → Librarian → Admin.
- [ ] Kiểm tra responsive ở viewport mobile, tablet và desktop.
- [ ] Rà soát accessibility và error states.

### Tuần 3 — Deployment và tài liệu

- [ ] Deploy backend và frontend lên môi trường demo.
- [ ] Kiểm tra CORS, cookie, refresh token và biến môi trường production.
- [ ] Hoàn thiện ERD, sequence diagram, slide và kịch bản demo.

---

## 6. Cách chạy frontend local

```bash
cd frontend
npm install
npm run dev
```

Mặc định frontend chạy tại `http://localhost:5173`. API có thể cấu hình bằng biến môi trường `VITE_API_URL`, mặc định là `http://localhost:3000/api/v1`.
