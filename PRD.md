# Product Requirements Document (PRD)

## Library Management System (LMS)

**Phiên bản:** 1.0-draft  
**Ngày:** 2026-10-11  
**Trạng thái:** Draft — đồ án môn học, cần xác nhận các câu hỏi mở  
**Quy mô:** Đồ án học tập, triển khai demo với dữ liệu giới hạn  
**Thời gian dự kiến:** 8 tuần / 4 milestones  

> Tài liệu này được xây dựng từ `PROJECT_PLAN.md`. Những nội dung chưa được xác nhận được đánh dấu là `TBD` hoặc được nêu trong mục **Open Questions**.

## 1. Executive Summary

### Problem Statement

Quy trình quản lý thư viện thủ công hoặc phân tán gây khó khăn trong việc tra cứu sách, kiểm soát bản sao vật lý, xử lý mượn/trả, theo dõi quá hạn và thu tiền phạt. Thủ thư cũng thiếu công cụ quét mã nhanh, nhắc hạn tự động và báo cáo thống kê đáng tin cậy.

### Proposed Solution

LMS là nền tảng web quản lý toàn bộ vòng đời sách và giao dịch thư viện. Hệ thống cung cấp catalog công khai, đặt mượn, mượn/trả tại quầy bằng QR/Barcode, tính phạt tự động, email nền, dashboard báo cáo và phân quyền Reader, Librarian, Admin.

### Product Vision

Tạo một hệ thống thư viện số hóa ở quy mô đồ án môn học, đủ hoàn chỉnh để trình diễn các nghiệp vụ chính, thể hiện kiến thức về phân tích yêu cầu, thiết kế cơ sở dữ liệu, xây dựng API, giao diện và triển khai thử nghiệm.

### Academic & Project Goals

- Thể hiện đầy đủ quy trình phân tích, thiết kế, lập trình và kiểm thử một hệ thống web.
- Xây dựng được các nghiệp vụ cốt lõi của thư viện: người dùng, sách, mượn/trả và tiền phạt.
- Có một số tính năng nâng cao để minh họa năng lực kỹ thuật: QR/Barcode, email tự động và báo cáo.
- Có sản phẩm demo ổn định, tài liệu kỹ thuật và video/kịch bản trình bày.

### Success Criteria / KPIs

| KPI | Mục tiêu MVP |
|---|---:|
| Luồng nghiệp vụ cốt lõi hoạt động | 100% kịch bản demo chính |
| Tỷ lệ endpoint quan trọng được kiểm thử | >= 70% endpoint MVP |
| Thời gian checkout tại quầy | <= 5 giây trong môi trường demo |
| Lỗi race condition khi mượn bản sao cuối | 0 trong test mô phỏng |
| Tài liệu và kịch bản demo | Hoàn thành trước khi nghiệm thu |

## 2. Product Scope

### In Scope

- Authentication, refresh token và RBAC.
- Quản lý người dùng, vai trò và trạng thái tài khoản.
- Quản lý thể loại, đầu sách và bản sao vật lý.
- Tra cứu, tìm kiếm, lọc và xem tình trạng sách.
- Đặt mượn, checkout tại quầy, trả sách và gia hạn.
- Tính, thu, miễn giảm và tra cứu tiền phạt.
- QR/Barcode cho độc giả và bản sao sách.
- Background jobs cho nhắc hạn, đánh dấu quá hạn và hết hạn đặt mượn.
- Dashboard báo cáo và xuất Excel/PDF.
- Audit log cho các thao tác nhạy cảm.
- Deploy thử nghiệm backend và PostgreSQL trên Render hoặc môi trường tương đương.

### Out of Scope

- Ứng dụng mobile native.
- Thanh toán online qua ngân hàng/ví điện tử trong MVP.
- Tích hợp RFID.
- Liên thông với hệ thống thư viện bên ngoài.
- Hệ thống đề xuất sách bằng AI.
- OCR hoặc tự động nhận diện tình trạng sách bằng hình ảnh.

### MVP Scope

MVP gồm authentication/RBAC, catalog, book copies, mượn/trả, reservation 24 giờ, gia hạn, fine engine, QR/Barcode checkout, email nhắc hạn, báo cáo cơ bản và deploy demo. Các tính năng nâng cao có thể giản lược nếu ảnh hưởng tiến độ đồ án.

### Future Scope / Không bắt buộc trong đồ án

- Thanh toán online.
- Mobile/PWA offline mode.
- RFID self-checkout.
- Recommendation engine.
- Đồng bộ nhiều chi nhánh thư viện.
- Notification qua SMS hoặc push notification.

### Project Constraints

- Đây là đồ án môn học, không phải hệ thống triển khai cho thư viện thật.
- Nhóm phát triển có quy mô nhỏ và thời gian thực hiện khoảng 8 tuần.
- Ưu tiên tính đúng đắn của nghiệp vụ, khả năng demo và chất lượng báo cáo hơn khả năng mở rộng lớn.
- Có thể dùng mock hoặc sandbox cho email, cloud storage và dữ liệu mẫu.
- Không yêu cầu SLA production, high availability, multi-region hoặc tải đồng thời lớn.

### Assumptions

- Thư viện sử dụng một cơ sở dữ liệu PostgreSQL chính.
- Mỗi bản sao vật lý có một barcode duy nhất.
- Người dùng Reader có email hợp lệ để nhận thông báo.
- Việc thu tiền phạt trong MVP được xác nhận thủ công bởi Librarian.
- Frontend chưa được chốt framework; React/Next.js là đề xuất.
- Các giá trị quy định mặc định trong tài liệu kế hoạch có thể cấu hình ở mức đơn giản.

## 3. User Personas & Roles

### Reader

Độc giả, sinh viên hoặc bạn đọc có nhu cầu tra cứu, đặt mượn, theo dõi sách đang giữ, gia hạn và xem tiền phạt.

### Librarian

Nhân sự vận hành thư viện: quản lý catalog, kiểm tra bản sao, checkout/return, xử lý tiền phạt và xem báo cáo vận hành.

### Admin

Người quản trị hệ thống: quản lý nhân sự, cấu hình quy định, miễn giảm tiền phạt, xem audit log và báo cáo tổng hợp.

### RBAC Matrix

| Tính năng | Reader | Librarian | Admin |
|---|:---:|:---:|:---:|
| Đăng ký/đăng nhập/profile | ✓ | ✓ | ✓ |
| Tra cứu catalog | ✓ | ✓ | ✓ |
| Đặt mượn/gia hạn | ✓ | — | — |
| Quản lý đầu sách/bản sao | — | ✓ | ✓ |
| Checkout/return tại quầy | — | ✓ | ✓ |
| Xem và xử lý tiền phạt | Cá nhân | ✓ | ✓ |
| Miễn giảm tiền phạt | — | — | ✓ |
| Quản lý Librarian | — | — | ✓ |
| Cấu hình hệ thống | — | — | ✓ |
| Báo cáo/xuất dữ liệu | — | ✓ | ✓ |
| Audit logs | — | — | ✓ |

## 4. User Journeys & User Stories

### Journey: Tra cứu và đặt mượn

1. Reader đăng nhập.
2. Reader tìm sách theo tiêu đề, tác giả, ISBN hoặc thể loại.
3. Hệ thống hiển thị số bản sao khả dụng.
4. Reader chọn đặt mượn.
5. Hệ thống kiểm tra hạn mức, trạng thái tài khoản và tồn kho.
6. Hệ thống tạo reservation có thời hạn 24 giờ và gửi thông báo.

**User story:** As a Reader, I want to reserve an available book so that I can collect it at the library counter.

**Acceptance criteria:**

- Không cho đặt mượn khi tài khoản bị khóa.
- Không cho đặt mượn khi vượt hạn mức sách.
- Reservation được gán trạng thái `RESERVED` và thời hạn nhận.
- Reservation quá 24 giờ không nhận sẽ tự động chuyển `CANCELLED`.
- Số lượng khả dụng được cập nhật nhất quán.

### Journey: Checkout bằng QR/Barcode

1. Librarian quét QR của Reader.
2. Hệ thống hiển thị trạng thái tài khoản và sách đang giữ.
3. Librarian quét barcode của một hoặc nhiều bản sao.
4. Hệ thống kiểm tra trạng thái từng bản sao.
5. Librarian xác nhận giao sách.
6. Hệ thống tạo giao dịch trong một transaction.

**Acceptance criteria:**

- Mã Reader và barcode phải tồn tại.
- Không thể checkout bản sao không ở trạng thái khả dụng/reserved hợp lệ.
- Transaction bị rollback nếu một bản sao không hợp lệ.
- Trạng thái bản sao chuyển thành `BORROWED`.
- Giao dịch thành công tạo due date và lưu Librarian xử lý.

### Journey: Trả sách và xử lý phạt

**User story:** As a Librarian, I want to record returned books and their physical condition so that inventory and fines remain accurate.

**Acceptance criteria:**

- Ghi nhận ngày trả và tình trạng từng bản sao.
- Trả đúng hạn không tạo overdue fine.
- Trả quá hạn tạo fine theo cấu hình hiện hành.
- Mất/hỏng sách tạo fine theo mức độ thiệt hại.
- Bản sao được cập nhật về `AVAILABLE`, `DAMAGED` hoặc `LOST`.

### Các user stories bổ sung

- As a Reader, I want to renew an eligible loan so that I have more time to finish reading.
- As a Reader, I want to see my fines so that I know what I owe.
- As a Librarian, I want to manage book copies so that physical inventory matches the system.
- As an Admin, I want to configure borrowing rules so that the system follows current library policy.
- As an Admin, I want to view audit logs so that sensitive operations are traceable.
- As a Librarian, I want to export reports so that I can reconcile operations and finance.

## 5. Functional Requirements

### FR-01: Authentication & Authorization

- Đăng ký bằng email, mật khẩu, họ tên và số điện thoại.
- Đăng nhập trả access token và refresh token HTTP-only cookie.
- Refresh token rotation; logout phải vô hiệu hóa session tương ứng.
- Mật khẩu phải hash bằng bcrypt hoặc thuật toán tương đương.
- Middleware xác thực và kiểm tra role cho từng route.
- Tài khoản `SUSPENDED` không được tạo reservation mới.

### FR-02: User Management

- Reader được xem và cập nhật profile của chính mình.
- Librarian/Admin được tìm kiếm danh sách Reader.
- Librarian/Admin có thể khóa hoặc mở khóa Reader theo quyền.
- Admin có thể tạo, cập nhật và phân quyền Librarian.
- Các thao tác thay đổi quyền phải ghi AuditLog.

### FR-03: Catalog & Book Management

- Catalog công khai hỗ trợ tìm kiếm theo title, author, ISBN và category.
- Hỗ trợ phân trang, lọc theo trạng thái khả dụng và sắp xếp.
- Librarian/Admin có thể CRUD category và book.
- Book phải có ISBN duy nhất, title, author, category và price.
- Không xóa vật lý sách đang có ràng buộc mượn; dùng soft delete hoặc chặn xóa.

### FR-04: Book Copy & Barcode

- Mỗi `BookCopy` có barcode duy nhất.
- Có shelf location và trạng thái: `AVAILABLE`, `RESERVED`, `BORROWED`, `DAMAGED`, `LOST`.
- Cho phép thêm nhiều bản sao theo quantity.
- Hệ thống tự cập nhật `totalCopies` và `availableCopies`.
- Sinh/hiển thị QR hoặc barcode để in và quét.

### FR-05: Borrowing & Reservation

- Reader có thể đặt một đầu sách nếu còn bản sao và đủ điều kiện.
- Reservation mặc định hết hạn sau 24 giờ.
- Checkout tại quầy có thể xử lý một hoặc nhiều bản sao.
- Mỗi giao dịch lưu Reader, Librarian, thời điểm mượn và due date.
- Hệ thống phải dùng transaction và điều kiện trạng thái để chống race condition.

### FR-06: Return & Renewal

- Librarian ghi nhận trả toàn bộ hoặc từng bản sao theo thiết kế được chốt.
- Reader được gia hạn tối đa 2 lần, mỗi lần thêm 7 ngày, nếu chưa quá hạn và không có reservation ưu tiên.
- Hệ thống không cho gia hạn khi tài khoản bị khóa hoặc còn điều kiện vi phạm.
- Mọi thay đổi phải cập nhật trạng thái bản sao và số lượng khả dụng.

### FR-07: Fine Management

- Fine type gồm `OVERDUE`, `DAMAGE`, `LOSS`.
- Fine status gồm `UNPAID`, `PAID`, `WAIVED`.
- Reader chỉ xem được fine của chính mình.
- Librarian xác nhận thu tiền và phương thức thu.
- Admin được miễn giảm fine; thao tác này bắt buộc có lý do và audit log.

### FR-08: QR/Barcode Scanning

- Client sử dụng camera thiết bị hoặc nhập mã thủ công khi camera không khả dụng.
- Mỗi lần quét phải có phản hồi thành công/thất bại rõ ràng.
- Không cho thêm mã trùng trong cùng phiên checkout.
- Không gửi dữ liệu nhạy cảm trong payload QR ngoài định danh cần thiết.

### FR-09: Background Jobs & Email

- Job nhắc hạn trước 2 ngày.
- Job đánh dấu giao dịch quá hạn và cập nhật fine theo quy định.
- Job hủy reservation quá 24 giờ.
- Job phải có logging, chống gửi trùng và có thể retry lỗi email.
- Dịch vụ email có thể là Resend, Nodemailer hoặc nhà cung cấp được chốt sau.

### FR-10: Dashboard & Export

- Dashboard hiển thị số sách, số bản sao, giao dịch đang mượn, quá hạn và tiền phạt.
- Báo cáo gồm top sách mượn nhiều, tỷ lệ quá hạn theo category và doanh thu tiền phạt.
- Export Excel dùng streaming để hạn chế tiêu thụ bộ nhớ.
- Export PDF cho phiếu mượn hoặc biên nhận phạt.
- Người dùng chỉ được export dữ liệu theo quyền.

### FR-11: Audit Logs

- Ghi nhận actor, action, entity liên quan, details, IP và timestamp.
- Bắt buộc audit cho thay đổi role, miễn phạt, thay đổi setting và thao tác xóa.
- Chỉ Admin được xem audit logs.

## 6. Business Rules

| Mã | Quy tắc |
|---|---|
| BR-01 | Hạn mức mượn mặc định là 5 sách/người, có thể cấu hình. |
| BR-02 | Reservation hết hạn sau 24 giờ nếu Reader chưa nhận sách. |
| BR-03 | Gia hạn tối đa 2 lần, mỗi lần mặc định 7 ngày. |
| BR-04 | Grace period mặc định là 1 ngày và cần được Admin xác nhận. |
| BR-05 | Overdue fine = số ngày tính phí × đơn giá/ngày. |
| BR-06 | Overdue fine không vượt quá 150% giá bìa theo cấu hình mặc định. |
| BR-07 | Hỏng nhẹ: 20% giá sách; hỏng nặng: 50%; mất: 100% + phí xử lý 20.000 VNĐ. |
| BR-08 | Nếu tổng fine chưa trả > 50.000 VNĐ hoặc quá hạn > 14 ngày, Reader bị chặn đặt mượn mới. |
| BR-09 | Số lượng available không được âm. |
| BR-10 | Không được có hai giao dịch hợp lệ cùng giữ một BookCopy. |

Các giá trị tiền, thời hạn và hạn mức phải được lưu trong `SystemSetting`, không hard-code trong business logic.

## 7. Non-Functional Requirements

### Performance — Mức phù hợp cho đồ án

- API catalog và profile phản hồi dưới 500ms với dữ liệu demo.
- Checkout hoàn tất dưới 5 giây sau khi nhận đủ mã hợp lệ.
- Export dữ liệu lớn phải streaming hoặc phân trang, không tải toàn bộ dataset vào memory.

### Security & Privacy — Mức cơ bản

- HTTPS ở production.
- Access token thời hạn ngắn; refresh token HTTP-only, Secure và SameSite phù hợp.
- Validate input bằng schema validation.
- Hash mật khẩu; không ghi mật khẩu/token vào log.
- Rate limit các endpoint login, refresh và public search.
- Áp dụng Helmet, CORS allowlist và nguyên tắc least privilege.
- Dữ liệu cá nhân chỉ được truy cập theo role và ownership.

### Reliability & Operations — Mức demo

- Có `/healthz` kiểm tra kết nối database.
- Graceful shutdown khi nhận SIGTERM/SIGINT.
- Migration production dùng `prisma migrate deploy`.
- Có hướng dẫn backup thủ công hoặc export database trước khi nghiệm thu.
- Background jobs phải có idempotency và logging.

### Maintainability

- TypeScript strict mode.
- Tách controller, service, repository/data access và validation.
- API response thống nhất.
- Có OpenAPI/Swagger hoặc Postman collection.

## 8. Technical Requirements

### Architecture Overview

Frontend web gọi REST API backend. Backend Express/Node.js xử lý authentication, RBAC và business services; Prisma truy cập PostgreSQL. Background jobs chạy theo lịch để minh họa xử lý quá hạn, reservation và email. Cloudinary và Render là các dịch vụ triển khai thử nghiệm, có thể thay bằng local/mock trong quá trình phát triển.

### Proposed Stack

- Backend: Node.js, TypeScript, Express.
- ORM/database: Prisma, PostgreSQL.
- Validation: Zod.
- Authentication: JWT access token + refresh token rotation.
- Password hashing: bcryptjs.
- Jobs/email: node-cron + Resend/Nodemailer.
- QR scanning: html5-qrcode; QR generation bằng qrcode.
- Export: ExcelJS và PDFKit.
- Hosting demo: Render; frontend có thể dùng Vercel/Netlify/Render Static Site hoặc chạy local khi trình bày.

### Core Data Flow: Checkout

1. Authenticate Librarian.
2. Decode Reader QR và các BookCopy barcode.
3. Validate Reader status, borrowing limit và copy status.
4. Mở database transaction.
5. Kiểm tra/cập nhật BookCopy có điều kiện trạng thái.
6. Tạo BorrowRecord và BorrowItem.
7. Cập nhật counters của Book.
8. Commit; nếu lỗi, rollback toàn bộ.
9. Trả response chuẩn và ghi audit log.

### Concurrency

Phải dùng transaction với kiểm tra trạng thái ngay tại thời điểm update. Nếu bản sao đã bị giao dịch khác lấy, API trả HTTP 409 và không tạo giao dịch dở dang.

### API Response Contract

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Thao tác thành công",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## 9. Data Model

| Entity | Mục đích | Ràng buộc chính |
|---|---|---|
| User | Người dùng và role | email unique, role, status |
| Category | Phân loại sách | name và slug unique |
| Book | Metadata đầu sách | ISBN unique, category bắt buộc |
| BookCopy | Bản sao vật lý | barcode unique, status |
| BorrowRecord | Phiếu mượn | user, librarian, status, dates |
| BorrowItem | Sách trong phiếu | unique borrowRecord + bookCopy |
| Fine | Khoản phạt | amount, type, status, user |
| SystemSetting | Quy định hệ thống | key unique |
| AuditLog | Lịch sử thao tác | actor, action, details, timestamp |

Các foreign key phải có index phù hợp. Không cascade delete dữ liệu lịch sử quan trọng nếu việc đó làm mất khả năng audit hoặc đối soát.

## 10. API Requirements

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Đăng ký Reader |
| POST | `/api/v1/auth/login` | Public | Đăng nhập |
| POST | `/api/v1/auth/refresh` | Public/session | Cấp access token mới |
| POST | `/api/v1/auth/logout` | Authenticated | Đăng xuất |
| GET | `/api/v1/users/me` | Authenticated | Xem profile |
| PATCH | `/api/v1/users/:id/status` | Librarian/Admin | Khóa/mở khóa tài khoản |
| GET | `/api/v1/books` | Public | Tìm kiếm catalog |
| GET | `/api/v1/books/:id` | Public | Chi tiết đầu sách |
| POST | `/api/v1/books` | Librarian/Admin | Tạo đầu sách |
| POST | `/api/v1/books/:id/copies` | Librarian/Admin | Thêm bản sao |
| POST | `/api/v1/borrows/reserve` | Reader | Đặt mượn |
| POST | `/api/v1/borrows/checkout` | Librarian/Admin | Checkout tại quầy |
| POST | `/api/v1/borrows/:id/return` | Librarian/Admin | Trả sách |
| POST | `/api/v1/borrows/:id/renew` | Reader | Gia hạn |
| GET | `/api/v1/borrows/my` | Reader | Lịch sử cá nhân |
| GET | `/api/v1/fines` | Librarian/Admin | Danh sách tiền phạt |
| PATCH | `/api/v1/fines/:id/settle` | Librarian/Admin | Xác nhận thu tiền |
| PATCH | `/api/v1/fines/:id/waive` | Admin | Miễn giảm |
| GET | `/api/v1/reports/overview` | Librarian/Admin | KPI tổng quan |
| GET | `/api/v1/reports/export/excel` | Librarian/Admin | Xuất Excel |
| GET | `/api/v1/reports/export/pdf` | Librarian/Admin | Xuất PDF |
| GET | `/api/v1/audit-logs` | Admin | Xem audit logs |
| GET | `/healthz` | Public/internal | Health check |

API phải định nghĩa validation, status code, pagination, error code và OpenAPI documentation trước khi frontend integration.

## 11. UI/UX Requirements

### Reader

- Login/Register.
- Catalog với search, filter, pagination.
- Book detail với số bản sao khả dụng và vị trí kệ.
- My Loans: đang mượn, quá hạn, lịch sử, nút renew.
- My Fines: khoản phạt, trạng thái, lịch sử thanh toán.
- Profile và QR cá nhân.

### Librarian

- Dashboard vận hành.
- Checkout scanner hỗ trợ camera và nhập thủ công.
- Return processing và ghi nhận condition.
- CRUD books, categories và book copies.
- Fine collection.
- Reports/export.

### Admin

- Dashboard tổng hợp.
- User/staff management.
- System settings.
- Fine waiver.
- Audit logs.

Tất cả màn hình phải có trạng thái loading, empty, error, success; các thao tác nhạy cảm phải có confirmation và hiển thị kết quả rõ ràng.

## 12. Acceptance Test Scenarios

### Đăng nhập

**Given** tài khoản active tồn tại  
**When** người dùng nhập đúng email và mật khẩu  
**Then** hệ thống trả access token, thiết lập refresh cookie và chuyển tới dashboard phù hợp role.

### Race condition

**Given** chỉ còn một BookCopy khả dụng  
**When** hai request checkout đồng thời  
**Then** chỉ một request thành công, request còn lại nhận HTTP 409 và database không có dữ liệu sai.

### Reservation expiry

**Given** reservation đã quá 24 giờ và chưa checkout  
**When** expiry job chạy  
**Then** reservation chuyển `CANCELLED`, bản sao trở về `AVAILABLE` và không bị gửi email trùng.

### Overdue fine

**Given** due date đã qua grace period  
**When** Reader trả sách  
**Then** fine được tính theo ngày trễ, đơn giá, fine cap và lưu ở trạng thái `UNPAID`.

### Account suspension

**Given** tổng fine chưa trả vượt ngưỡng hoặc sách quá hạn trên 14 ngày  
**When** hệ thống đánh giá điều kiện  
**Then** Reader không thể tạo reservation mới cho tới khi điều kiện được giải quyết.

### QR/Barcode

**Given** QR Reader và barcode BookCopy hợp lệ  
**When** Librarian quét và xác nhận checkout  
**Then** giao dịch được tạo, trạng thái copy đổi thành `BORROWED` và counters được cập nhật.

### Export

**Given** Librarian có quyền export  
**When** yêu cầu file Excel  
**Then** hệ thống trả file đúng định dạng, không vượt memory budget và không lộ dữ liệu ngoài phạm vi quyền.

## 13. Analytics & Success Metrics

- Số Reader active theo ngày/tháng.
- Số lượt tra cứu và tỷ lệ đặt mượn thành công.
- Tỷ lệ trả đúng hạn và quá hạn theo category.
- Book turnover rate.
- Top 10 sách được mượn nhiều nhất.
- Tổng fine phát sinh, đã thu và đã miễn.
- Thời gian trung bình xử lý checkout tại quầy.
- API latency, error rate và email delivery rate.

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Render free tier cold start/sleep | Trung bình | Có thể chạy local khi demo; ghi rõ giới hạn trong báo cáo |
| PostgreSQL connection pool cạn | Thấp | Giới hạn connection và dùng Prisma Client dùng chung |
| Migration làm lỗi dữ liệu demo | Cao | Backup database trước migration, review migration |
| Race condition khi mượn | Cao | Transaction, conditional update, integration test |
| Email vào spam hoặc thất bại | Trung bình | Resend/SendGrid, SPF/DKIM, retry và delivery log |
| Camera scanner không tương thích | Trung bình | Cho phép nhập barcode thủ công và kiểm thử nhiều browser |
| Sai quy tắc phạt | Cao | SystemSetting, unit test công thức và approval nghiệp vụ |
| Lộ dữ liệu cá nhân | Cao | RBAC, ownership checks, HTTPS, audit và không log secret |
| Export dataset lớn gây OOM | Trung bình | Streaming, giới hạn filter và load test |

## 15. Roadmap

### Milestone 1 — Tuần 1-2: Foundation

- Repository, TypeScript strict, lint/format.
- Prisma schema, migration và seed.
- Authentication, refresh token và RBAC.
- User/profile management.

### Milestone 2 — Tuần 3-4: Catalog & Circulation

- Categories, books, copies, barcode.
- Search/filter/pagination.
- Reservation, checkout, return và renewal.
- Transaction/concurrency tests.

### Milestone 3 — Tuần 5-6: Automation & Insights

- Fine engine và fine APIs.
- QR/Barcode scanner.
- Cron jobs và email templates.
- Dashboard, Excel/PDF export.

### Milestone 4 — Tuần 7-8: Integration & Demo

- Frontend integration.
- E2E test toàn bộ vòng đời.
- Swagger/Postman documentation.
- Kiểm thử luồng demo, health check, deployment thử nghiệm và nghiệm thu.

## 16. Definition of Done

- [ ] Tất cả Must-have user stories có acceptance criteria đạt.
- [ ] RBAC được kiểm thử cho cả quyền hợp lệ và không hợp lệ.
- [ ] Database migration chạy được ở local và môi trường demo.
- [ ] Không xảy ra race condition trong test đồng thời.
- [ ] Fine engine có unit test cho grace period, cap, damage và loss.
- [ ] QR/Barcode scanner có fallback nhập thủ công.
- [ ] Background jobs có logging, idempotency và retry phù hợp.
- [ ] API có validation, error response chuẩn và tài liệu Swagger/Postman.
- [ ] Có unit, integration và E2E test cho luồng chính.
- [ ] API phổ biến phản hồi ổn định với dữ liệu demo.
- [ ] Không có secret trong source code hoặc log.
- [ ] Môi trường demo có health check và graceful shutdown cơ bản.
- [ ] Có bản backup hoặc export database trước nghiệm thu.
- [ ] Có dữ liệu mẫu đủ cho kịch bản trình diễn; số lượng cụ thể là TBD theo nhóm.
- [ ] Tài liệu hướng dẫn cài đặt, vận hành và triển khai được cập nhật.

## 17. Open Questions

1. Đối tượng triển khai đầu tiên là thư viện trường học, thư viện công cộng hay thư viện doanh nghiệp?
2. Frontend chính thức dùng React, Next.js hay framework khác?
3. Thời hạn mượn mặc định là bao nhiêu ngày?
4. Grace period một ngày có áp dụng cho mọi loại sách không?
5. Thanh toán tiền phạt trong MVP chỉ ghi nhận thủ công hay cần tích hợp payment gateway?
6. Có cần hỗ trợ nhiều chi nhánh/kho sách ngay từ MVP không?
7. Quy trình xử lý trả sách từng item trong một phiếu có bắt buộc không?
8. Nhà cung cấp email chính thức là Resend, SendGrid hay SMTP nội bộ?
9. Nhóm có cần deploy demo trực tuyến hay chỉ chạy local khi bảo vệ?
10. Giảng viên yêu cầu những chức năng hoặc tiêu chí chấm điểm nào?
11. Ai là người duyệt thay đổi quy tắc phạt và system settings?

