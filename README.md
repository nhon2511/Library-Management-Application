# Library Management Application

Backend Express 5 + TypeScript + Prisma/PostgreSQL, frontend React/Vite. API ở `/api/v1`.

## Chức năng hiện có

- Đăng ký, đăng nhập, refresh token, hồ sơ và mã QR; RBAC cho READER, LIBRARIAN, ADMIN.
- Refresh token được xoay một lần dùng, lưu phiên theo từng thiết bị; token cũ bị từ chối sau refresh. Logout vô hiệu hóa toàn bộ phiên của tài khoản.
- Danh mục, sách, bản sao, đặt mượn, checkout tại quầy, trả từng bản sao và gia hạn.
- Thu hoặc miễn phạt, audit log, dashboard và xuất Excel.
- ADMIN có trang quản lý người dùng và cấu hình quy định thư viện. Các quy định số trong `SystemSetting` được áp dụng cho nghiệp vụ mượn trả.
- Giá sách và khoản phạt dùng số nguyên VNĐ; `LOAN_DAYS` trong SystemSetting quyết định hạn trả lúc checkout. Excel được xuất theo từng lô để giới hạn bộ nhớ.
- Job hủy đặt mượn hết hạn, đánh dấu quá hạn và gửi nhắc hạn qua SMTP.
- Upload bìa qua Cloudinary khi được cấu hình.

**Chưa triển khai:** xuất PDF, quản lý role của nhân sự qua UI/API, hàng đợi email bền vững. Email xác nhận checkout gửi sau khi giao dịch database hoàn tất; lỗi SMTP được ghi log an toàn nhưng hiện không có cơ chế retry.

## Cài đặt local

Yêu cầu Node.js 22+, PostgreSQL và npm. Chạy tại thư mục gốc:

```bash
npm ci
cd frontend && npm ci && cd ..
cp .env.example .env
```

Điền `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` trong `.env`. Dùng hai chuỗi JWT đủ dài và khác nhau. `.env` đã được ignore; không commit file này. Cấu hình `CORS_ORIGIN` theo URL frontend.

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Frontend chạy riêng: `cd frontend && npm run dev`. Vite mặc định tại `http://localhost:5173`, backend mặc định cổng 3000. Health check: `GET /healthz`.

### Migration và seed

`prisma/migrations/20261110000000_initial` là migration khởi tạo; migration kế tiếp thêm phiên refresh và chuyển tiền sang số nguyên VNĐ. Trên database mới, dùng `npm run db:deploy`. Khi sửa schema trong môi trường phát triển, dùng `npm run db:migrate` để tạo migration tiếp theo; kiểm tra SQL trước khi áp dụng ở môi trường triển khai. Không dùng `db:reset` trên dữ liệu cần giữ.

Nếu database hiện hữu đã có schema tương đương migration khởi tạo nhưng chưa có bảng lịch sử Prisma Migrate, **sao lưu và so sánh schema trước**, sau đó dùng `npx prisma migrate resolve --applied 20261110000000_initial` để baseline. Chỉ sau bước đó mới chạy `npm run db:deploy`. Migration tiền sẽ dừng nếu phát hiện giá trị lẻ VNĐ, số âm hoặc vượt giới hạn; cần xử lý dữ liệu và duyệt cách quy đổi trước khi chạy lại. Không tự đánh dấu migration mới là đã áp dụng.

Sau khi triển khai bảng phiên refresh, người dùng có refresh token từ phiên bản cũ cần đăng nhập lại. Đảm bảo backend đã áp dụng migration trước khi khởi động mã mới.

Seed chỉ chạy khi `NODE_ENV` khác `production`, không xóa dữ liệu và có thể chạy lại. Seed tạo danh mục/sách/bản sao mẫu còn thiếu. Muốn tạo ADMIN local, cấu hình đồng thời `SEED_ADMIN_EMAIL` và `SEED_ADMIN_PASSWORD` trước khi chạy seed. Seed không tạo sẵn mật khẩu mẫu.

### SMTP và Cloudinary

Trong production, cấu hình `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`; `SMTP_SECURE=true` cho TLS trực tiếp, hoặc `false` cho STARTTLS. Ứng dụng fail-fast nếu thiếu cấu hình SMTP production. Môi trường phát triển có thể dùng Ethereal test account khi không cấu hình SMTP.

Upload bìa cần `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. File chỉ nhận JPEG, PNG hoặc WebP, tối đa 5 MB. Không cấu hình Cloudinary thì API từ chối multipart upload.

### Biến môi trường khác

`PORT`, `NODE_ENV`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `CORS_ORIGIN`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` có ví dụ trong `.env.example`. `TEST_DATABASE_URL` chỉ dùng cho test, phải trỏ tới PostgreSQL local với tên database kết thúc bằng `_test`.

## Kiểm tra

```bash
npm run build
npm run lint
npm run format:check
npm test
cd frontend && npm run build
```

Test integration ghi dữ liệu fixture rồi dọn dẹp. Tạo database `library_management_test` riêng, đặt `TEST_DATABASE_URL`, chạy migration trên database test trước khi chạy `npm test`. CI sử dụng PostgreSQL riêng và chạy các lệnh trên.

## API chính

- Auth: `/api/v1/auth/register`, `login`, `refresh`, `logout`.
- Users: `/api/v1/users/me`, `/api/v1/users`, `/api/v1/users/:id/qrcode`, `/api/v1/users/:id/status`.
- Catalog: `/api/v1/categories`, `/api/v1/books`, `/api/v1/books/:bookId/copies`.
- Borrowing: `/api/v1/borrows/reserve`, `checkout`, `:id/return`, `:id/renew`, `my`.
- Fines: `/api/v1/fines`, `:id/settle`, `:id/waive`.
- Reports: `/api/v1/reports/overview`, `top-books`, `monthly-trends`, `categories-ratio`, `export/excel`.
- ADMIN: `/api/v1/system-settings`, `/api/v1/audit-logs`.

Xem `src/modules/*/*.routes.ts` để biết method, validation và quyền truy cập chính xác.

## Triển khai Render + Vercel

1. Trên Render, tạo Blueprint từ `render.yaml`. Blueprint tạo web service và cron service **đều có tính phí**; cron chạy mỗi 15 phút. Web service dùng gói trả phí vì gói miễn phí của Render chặn cổng SMTP 465/587 và ngủ khi không có truy cập. Nhập `DATABASE_URL` của Neon và cấu hình SMTP cho cả hai service khi được hỏi. Đặt `CORS_ORIGIN` của web service bằng đúng origin HTTPS của Vercel (không có dấu `/` cuối). Web service chạy `db:deploy` ở bước pre-deploy; cron service xử lý đặt mượn hết hạn, phiếu quá hạn, phiên refresh hết hạn và email nhắc hạn. `TRUST_PROXY_HOPS=1` trên Render giúp rate limit dùng IP người dùng sau proxy. Không chạy `db:seed` trên production.
2. Trên Vercel, tạo project từ repository với **Root Directory = `frontend`**, Build Command = `npm run build`, Output Directory = `dist`. Đặt `VITE_API_URL=https://<render-web-domain>/api/v1` trong Environment Variables rồi deploy. Giá trị này được đóng vào bundle tại thời điểm build, nên phải redeploy sau khi đổi. `frontend/vercel.json` chuyển các đường dẫn SPA như `/profile` về `index.html`.
3. Sau khi có URL Vercel thật, cập nhật `CORS_ORIGIN` trên Render và redeploy web service. Nếu dùng hai domain mặc định `vercel.app` và `onrender.com`, refresh cookie production dùng `SameSite=None; Secure`; một số trình duyệt chặn cookie bên thứ ba. Để phiên đăng nhập ổn định hơn, dùng hai subdomain HTTPS cùng một site, ví dụ `app.example.com` và `api.example.com`, rồi đặt `COOKIE_SAME_SITE=strict` trên Render.
4. Kiểm tra `/healthz`, đăng ký/đăng nhập, refresh sau khi access token hết hạn, tải trực tiếp `/profile`, upload bìa (nếu đã thêm Cloudinary), và một lần chạy cron trong Render. Nếu dùng database Neon hiện tại, migration đã được baseline và áp dụng; với database khác đã có bảng nhưng chưa có lịch sử Prisma Migrate, làm theo mục **Migration và seed** trước khi khởi động.

`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` bắt buộc khi `NODE_ENV=production`. Nếu dùng cổng 465 với TLS trực tiếp, đặt `SMTP_SECURE=true` trên cả web service và cron service. Cloudinary là tùy chọn; muốn upload ảnh bìa thì thêm ba biến `CLOUDINARY_*` từ `.env.example` vào web service. Tài khoản ADMIN phải được tạo/cấp quyền trước khi sử dụng trang quản trị; seed mẫu không chạy trong production.
