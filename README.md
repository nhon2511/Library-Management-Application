# 📚 Library Management System (LMS)

> **Hệ thống Quản lý Thư viện Số hóa Toàn diện (Full-Stack Web Application)**  
> Giải pháp số hóa quy trình vận hành thư viện hiện đại: Tra cứu Catalog trực tuyến, Đặt mượn trước (Reservation), Mượn/Trả tại quầy bằng mã QR/Barcode, Tự động tính phí phạt (Fine Engine), Nhắc hạn qua Email tự động (Cron Jobs), Báo cáo thống kê trực quan (Dashboard & Export Excel/PDF) và Nhật ký kiểm toán (Audit Log).

---

## 📖 Mục lục

1. [Giới thiệu tổng quan](#-1-giới-thiệu-tổng-quan)
2. [Kiến trúc hệ thống & Công nghệ sử dụng](#-2-kiến-trúc-hệ-thống--công-nghệ-sử-dụng)
3. [Tính năng theo phân quyền (RBAC)](#-3-tính-năng-theo-phân-quyền-rbac)
4. [Thiết kế Cơ sở dữ liệu (ERD)](#-4-thiết-kế-cơ-sở-dữ-liệu-erd)
5. [Quy tắc nghiệp vụ cốt lõi (Business Rules)](#-5-quy-tắc-nghiệp-vụ-cốt-lõi-business-rules)
6. [Cấu trúc thư mục dự án (Full-Stack)](#-6-cấu-trúc-thư-mục-dự-án-full-stack)
7. [Hướng dẫn cài đặt & Khởi chạy](#-7-hướng-dẫn-cài-đặt--khởi-chạy)
8. [Làm việc nhóm & Đồng bộ Cơ sở dữ liệu (Database Sync)](#-8-làm-việc-nhóm--đồng-bộ-cơ-sở-dữ-liệu-database-sync)
9. [Hướng dẫn sử dụng hệ thống & Tài khoản mẫu](#-9-hướng-dẫn-sử-dụng-hệ-thống--tài-khoản-mẫu)
10. [Tài liệu API (RESTful API Reference)](#-10-tài-liệu-api-restful-api-reference)
11. [Kiểm thử & Triển khai đám mây (Cloud Deployment)](#-11-kiểm-thử--triển-khai-đám-mây-cloud-deployment)

---

## 🎯 1. Giới thiệu tổng quan

**Library Management System (LMS)** được thiết kế nhằm giải quyết bài toán quản lý thư viện thủ công hoặc phân tán, giúp kết nối xuyên suốt giữa **Độc giả (Reader)**, **Thủ thư (Librarian)** và **Quản trị viên (Admin)**:

- **Đối với Độc giả:** Dễ dàng tra cứu kho sách theo thời gian thực, xem vị trí kệ sách, đặt giữ chỗ trực tuyến 24h, gia hạn sách đang mượn, theo dõi lịch sử mượn trả và tra cứu phí phạt cá nhân kèm mã định danh QR.
- **Đối với Thủ thư:** Tối ưu tốc độ giao dịch tại quầy (Checkout/Return $\le 5$ giây) thông qua quét mã QR Độc giả và Barcode từng bản sao vật lý (`BookCopy`), tự động hóa việc đánh giá tình trạng sách trả và thu phí phạt.
- **Đối với Quản trị viên:** Kiểm soát toàn diện cấu hình quy định thư viện (`SystemSetting`), quản lý nhân sự, phê duyệt miễn giảm phí phạt (`Waive Fine`), theo dõi KPI vận hành và truy vết mọi thao tác nhạy cảm qua `AuditLog`.

---

## 🏗️ 2. Kiến trúc hệ thống & Công nghệ sử dụng

### Sơ đồ Kiến trúc Tổng thể

```mermaid
flowchart LR
    subgraph Client["🖥️ Frontend Client (Vercel)"]
        UI["React / Next.js + Tailwind CSS"]
        Scanner["QR / Barcode Scanner (html5-qrcode)"]
        Charts["Analytics Dashboard (Recharts)"]
    end

    subgraph Server["⚙️ Backend API Server (Render / Railway)"]
        API["Express.js v5 REST API"]
        Auth["Auth & RBAC Middleware (JWT)"]
        Cron["Background Jobs (node-cron)"]
        Export["Export Engine (ExcelJS / PDFKit)"]
    end

    subgraph Cloud["☁️ Cloud Services"]
        DB[("PostgreSQL (Neon Serverless)")]
        Mail["Email Service (Resend / Nodemailer)"]
        Media["Cloud Storage (Cloudinary)"]
    end

    UI <-->|"HTTPS / JSON + HttpOnly Cookie"| API
    Scanner --> UI
    Charts --> UI
    API --> Auth
    Auth --> DB
    Cron --> DB
    Cron --> Mail
    Export --> API
    API --> Media
```

### Tech Stack Chi tiết

| Phân hệ | Công nghệ & Thư viện | Mục đích sử dụng |
|---|---|---|
| **Frontend** | React.js (Vite) / Next.js, TypeScript | Giao diện người dùng SPA/SSR cho Reader, Librarian, Admin |
| **UI & Styling** | Tailwind CSS, Shadcn UI, Lucide Icons | Thiết kế giao diện hiện đại, Responsive trên mọi thiết bị |
| **State & Form** | TanStack Query, Axios, React Hook Form + Zod | Quản lý trạng thái server, tự động làm mới JWT Token, đồng bộ validation |
| **QR / Barcode** | `html5-qrcode`, `qrcode` | Quét mã vạch sách/mã QR độc giả qua Camera hoặc máy quét USB |
| **Backend Core** | Node.js (v18+), Express.js v5, TypeScript 6 | Xử lý RESTful API, nghiệp vụ thư viện và bảo mật |
| **Database & ORM** | PostgreSQL (Neon Cloud), Prisma ORM v7 | Quản lý dữ liệu quan hệ, Transaction chống Race Condition |
| **Auth & Security** | JWT (Access + Refresh Cookie), `bcryptjs`, Helmet, CORS, Rate Limit | Xác thực đa tầng, phân quyền RBAC, chống Brute-force & XSS/CSRF |
| **Automation & Export** | `node-cron`, Nodemailer / Resend, ExcelJS, PDFKit | Tự động nhắc hạn/hủy đặt sách, gửi email thông báo, xuất báo cáo Excel/PDF |
| **Testing & Quality** | Jest, Supertest, ESLint, Prettier | Kiểm thử Unit/Integration/E2E và đảm bảo chất lượng mã nguồn |
| **Cloud & DevOps** | Neon (DB), Render/Railway (Backend), Vercel (Frontend) | Triển khai đám mây CI/CD tự động |

---

## 🛡️ 3. Tính năng theo phân quyền (RBAC)

| Nhóm tính năng | Chi tiết chức năng | Reader | Librarian | Admin |
|---|---|:---:|:---:|:---:|
| **Xác thực & Hồ sơ** | Đăng ký, Đăng nhập, Refresh Token, Cập nhật Profile, Mã QR cá nhân | ✅ | ✅ | ✅ |
| **Tra cứu Catalog** | Tìm kiếm sách (Title, Author, ISBN), lọc theo Danh mục & Trạng thái, xem kệ sách | ✅ | ✅ | ✅ |
| **Đặt mượn & Gia hạn** | Đặt trước sách khả dụng (giữ chỗ 24h), Gia hạn sách đang mượn, Xem lịch sử cá nhân | ✅ | — | — |
| **Quản lý Kho sách** | CRUD Thể loại (`Category`), Đầu sách (`Book`), Bản sao vật lý (`BookCopy`) & Barcode | — | ✅ | ✅ |
| **Mượn / Trả tại quầy** | Quét QR/Barcode để Checkout nhiều sách, Xử lý trả sách & cập nhật tình trạng vật lý | — | ✅ | ✅ |
| **Quản lý Phí phạt** | Xem danh sách phí phạt, Xác nhận thu tiền phạt (`Settle Fine`) | Cá nhân | ✅ | ✅ |
| **Miễn giảm Phí phạt** | Phê duyệt miễn giảm phí phạt (`Waive Fine`) kèm lý do bắt buộc | — | — | ✅ |
| **Báo cáo & Xuất file** | Xem Dashboard KPI, Top sách mượn nhiều, Xuất báo cáo Excel (Streaming) & PDF | — | ✅ | ✅ |
| **Quản trị Hệ thống** | Quản lý tài khoản Độc giả & Thủ thư, Cấu hình `SystemSetting`, Xem `AuditLog` | — | — | ✅ |

---

## 🗄️ 4. Thiết kế Cơ sở dữ liệu (ERD)

```mermaid
erDiagram
    User ||--o{ BorrowRecord : "mượn sách (Reader)"
    User ||--o{ BorrowRecord : "xử lý (Librarian)"
    User ||--o{ Fine : "chịu phạt"
    User ||--o{ AuditLog : "thực hiện"
    Category ||--o{ Book : "phân loại"
    Book ||--o{ BookCopy : "có bản sao vật lý"
    BorrowRecord ||--|{ BorrowItem : "bao gồm"
    BookCopy ||--o{ BorrowItem : "được gán vào"
    BorrowRecord ||--o{ Fine : "phát sinh phạt"

    User {
        string id PK
        string email UK
        string password
        string firstName
        string lastName
        enum role "READER | LIBRARIAN | ADMIN"
        enum status "ACTIVE | SUSPENDED | INACTIVE"
        string qrCode UK
    }

    Category {
        string id PK
        string name UK
        string slug UK
        string description
    }

    Book {
        string id PK
        string isbn UK
        string title
        string author
        float price
        int totalCopies
        int availableCopies
        string categoryId FK
        boolean isDeleted
    }

    BookCopy {
        string id PK
        string barcode UK
        string bookId FK
        string shelfLocation
        enum status "AVAILABLE | RESERVED | BORROWED | DAMAGED | LOST"
        string condition
    }

    BorrowRecord {
        string id PK
        string userId FK
        string librarianId FK
        enum status "RESERVED | BORROWED | RETURNED | CANCELLED | OVERDUE"
        datetime borrowDate
        datetime dueDate
        datetime returnDate
        int renewCount
        datetime expiresAt
    }

    BorrowItem {
        string id PK
        string borrowRecordId FK
        string bookCopyId FK
        enum status "BORROWED | RETURNED | LOST | DAMAGED"
        datetime returnDate
        string returnCondition
    }

    Fine {
        string id PK
        string userId FK
        string borrowRecordId FK
        enum type "OVERDUE | DAMAGE | LOSS"
        enum status "UNPAID | PAID | WAIVED"
        float amount
        float paidAmount
        string waivedBy
        string waivedReason
    }

    SystemSetting {
        string id PK
        string key UK
        string value
        string dataType
    }

    AuditLog {
        string id PK
        string actorId FK
        string action
        string entity
        string entityId
        json details
        string ipAddress
    }
```

---

## ⚙️ 5. Quy tắc nghiệp vụ cốt lõi (Business Rules)

Hệ thống áp dụng chặt chẽ các quy tắc nghiệp vụ thư viện (có thể tùy chỉnh linh hoạt qua bảng `SystemSetting` hoặc mặc định trong `src/utils/constants.ts`):

| Mã quy tắc | Tên quy tắc | Chi tiết thiết lập mặc định |
|---|---|---|
| **BR-01** | **Hạn mức mượn tối đa** | Mỗi độc giả được mượn tối đa **5 cuốn sách** cùng lúc (`MAX_BORROW_LIMIT = 5`). |
| **BR-02** | **Thời hạn giữ chỗ đặt trước** | Phiếu đặt trước (`RESERVED`) có hiệu lực **24 giờ**. Quá hạn hệ thống tự động chuyển sang `CANCELLED` và hoàn trả bản sao về `AVAILABLE`. |
| **BR-03** | **Quy định gia hạn sách** | Tối đa **2 lần** gia hạn cho mỗi phiếu mượn, mỗi lần cộng thêm **7 ngày** (chỉ áp dụng khi phiếu chưa quá hạn và tài khoản hợp lệ). |
| **BR-04** | **Thời gian ân hạn (Grace Period)** | Ân hạn **1 ngày** sau `dueDate` trước khi bắt đầu tính phạt quá hạn. |
| **BR-05** | **Công thức phạt quá hạn** | $\text{Overdue Fine} = \text{Số ngày trễ} \times 5.000\text{ VNĐ/ngày/cuốn}$. |
| **BR-06** | **Trần phí phạt quá hạn (Fine Cap)** | Tổng phí phạt quá hạn của một cuốn sách không vượt quá **150% giá bìa** (`price * 1.5`). |
| **BR-07** | **Phí đền bù hư hỏng / mất sách** | • Hư hỏng nhẹ: **20%** giá sách<br>• Hư hỏng nặng: **50%** giá sách<br>• Làm mất sách: **100%** giá sách + **20.000 VNĐ** phí xử lý |
| **BR-08** | **Điều kiện tự động chặn mượn mới** | Độc giả có tổng phí phạt chưa thanh toán **> 50.000 VNĐ** hoặc đang giữ sách quá hạn **> 14 ngày** sẽ bị chặn đặt mượn/checkout mới. |
| **BR-09** | **Chống xung đột (Concurrency Control)** | Mọi giao dịch đặt sách và checkout đều thực thi trong **Database Transaction** kèm kiểm tra trạng thái tức thời để đảm bảo không bao giờ âm tồn kho hoặc trùng bản sao. |

---

## 📂 6. Cấu trúc thư mục dự án (Full-Stack)

```text
Library-Management-Application/
├── prisma/                        # Quản lý Schema, Migration & Seed Database
│   ├── migrations/                # Lịch sử phiên bản cơ sở dữ liệu
│   ├── schema.prisma              # Định nghĩa 9 thực thể và các Enums
│   └── seed.ts                    # Script khởi tạo dữ liệu mẫu chuẩn hóa
├── src/                           # Backend Source Code (Node.js + Express + TS)
│   ├── config/                    # Cấu hình Environment & Prisma Postgres Adapter
│   ├── jobs/                      # Background Cron Jobs (Nhắc hạn, Quá hạn, Hủy giữ chỗ 24h)
│   ├── middlewares/               # Auth JWT, RBAC, Rate Limiter, Zod Validator, Error Handler
│   ├── modules/                   # Kiến trúc Modular theo từng miền nghiệp vụ
│   │   ├── auth/                  # Đăng ký, Đăng nhập, Refresh Token, Logout
│   │   ├── user/                  # Hồ sơ người dùng, Quản lý độc giả & nhân sự
│   │   ├── category/              # Quản lý danh mục thể loại sách
│   │   ├── book/                  # Quản lý đầu sách & tìm kiếm Catalog
│   │   ├── book-copy/             # Quản lý bản sao vật lý, vị trí kệ & Barcode
│   │   ├── borrow/                # Đặt trước, Checkout tại quầy, Gia hạn & Trả sách
│   │   ├── fine/                  # Tính toán phí phạt, Thu tiền & Miễn giảm
│   │   ├── report/                # Thống kê KPI Dashboard & Xuất báo cáo Excel/PDF
│   │   └── audit-log/             # Truy vết lịch sử thao tác hệ thống
│   ├── services/                  # Dịch vụ tích hợp (Email Resend/Nodemailer, QR Generator)
│   ├── types/                     # Khai báo kiểu dữ liệu toàn cục
│   ├── utils/                     # ApiError, ApiResponse, AsyncHandler, Constants, Logger
│   ├── app.ts                     # Cấu hình Express Application & Routes
│   └── server.ts                  # Khởi chạy HTTP Server & Graceful Shutdown
├── frontend/                      # Frontend Source Code (React / Next.js + Tailwind CSS)
│   ├── public/                    # Tài nguyên tĩnh
│   ├── src/
│   │   ├── api/                   # Axios Client & Interceptors (Auto Refresh Token)
│   │   ├── components/            # UI Components dùng chung, QR/Barcode Scanner, Charts
│   │   ├── layouts/               # Reader Layout, Librarian/Admin Dashboard Layout
│   │   ├── pages/                 # Các màn hình: Catalog, My Loans, Checkout Desk, Fines, Reports...
│   │   ├── hooks/                 # Custom React Hooks & Auth Context
│   │   └── utils/                 # Helper định dạng tiền tệ, ngày tháng
│   └── package.json
├── tests/                         # Bộ kiểm thử tự động (Unit, Integration & Concurrency Tests)
├── .env.example                   # File mẫu cấu hình biến môi trường
├── PRD.md                         # Tài liệu đặc tả yêu cầu sản phẩm chi tiết
├── prisma.config.ts               # Cấu hình Prisma v7
├── package.json
└── tsconfig.json
```

---

## 🛠️ 7. Hướng dẫn cài đặt & Khởi chạy

### 1. Yêu cầu môi trường
- **Node.js:** `>= 18.x` (Khuyến nghị `v20 LTS`)
- **PostgreSQL:** `>= 15.x` (Local hoặc Cloud Database như **Neon PostgreSQL**)
- **Trình quản lý gói:** `npm` hoặc `pnpm`

### 2. Cài đặt và Cấu hình Backend

```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Tạo file biến môi trường từ file mẫu
cp .env.example .env
```

Cập nhật các thông số trong file `.env`:
```env
# Server
PORT=3000
NODE_ENV=development

# Database (PostgreSQL Local hoặc Neon Cloud URL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/library_management?schema=public"

# JWT Secrets
JWT_ACCESS_SECRET="your-access-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-in-production"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS (URL của Frontend)
CORS_ORIGIN="http://localhost:5173"

# Email Service (Resend / Nodemailer SMTP)
RESEND_API_KEY="re_xxxxxxxxxxxx"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 3. Khởi tạo Cơ sở dữ liệu & Seed dữ liệu mẫu

```bash
# Sinh Prisma Client
npm run db:generate

# Chạy Migration tạo bảng trên PostgreSQL
npm run db:migrate

# Nạp dữ liệu mẫu (Tài khoản Admin/Librarian/Reader, Danh mục, Sách & Bản sao Barcode)
npm run db:seed
```

### 4. Khởi chạy ứng dụng

```bash
# Chạy Backend ở chế độ Development (http://localhost:3000)
npm run dev

# Mở giao diện quản lý dữ liệu trực quan Prisma Studio (tùy chọn)
npm run db:studio
```

> Khi khởi chạy kèm phân hệ **Frontend** (`frontend/`):
> ```bash
> cd frontend
> npm install
> npm run dev
> ```
> Giao diện người dùng sẽ hoạt động tại `http://localhost:5173`.

### 5. Danh sách các lệnh NPM Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy Backend ở chế độ development (tự động reload với `tsx watch`) |
| `npm run build` | Biên dịch mã nguồn TypeScript sang JavaScript tại thư mục `dist/` |
| `npm start` | Khởi chạy bản build Production (`node dist/server.js`) |
| `npm run lint` | Kiểm tra chất lượng mã nguồn với ESLint |
| `npm run lint:fix` | Tự động sửa các lỗi quy chuẩn ESLint |
| `npm run format` | Định dạng mã nguồn tự động với Prettier |
| `npm run db:generate` | Sinh Prisma Client từ `prisma/schema.prisma` |
| `npm run db:migrate` | Tạo và chạy migration trong môi trường phát triển |
| `npm run db:deploy` | Triển khai migration lên cơ sở dữ liệu Production |
| `npm run db:seed` | Nạp dữ liệu mẫu từ `prisma/seed.ts` |
| `npm run db:studio` | Khởi chạy công cụ quản trị dữ liệu Prisma Studio |
| `npm run db:reset` | Xóa sạch cơ sở dữ liệu, chạy lại migration và seed từ đầu |

---

## 🤝 8. Làm việc nhóm & Đồng bộ Cơ sở dữ liệu (Database Sync)

Để tất cả thành viên trong nhóm đều chạy được dự án ngay lập tức và **đồng bộ dữ liệu Database 100% theo thời gian thực** (người này thêm sách, đặt mượn hoặc tạo phiếu phạt thì người kia thấy ngay), dự án sử dụng mô hình **Shared Cloud Database trên [Neon PostgreSQL](https://neon.tech)**.

### 🌐 Bước 1: Trưởng nhóm (Leader) khởi tạo Cloud Database chung (Chỉ làm 1 lần duy nhất)

1. Truy cập [Neon.tech](https://neon.tech), đăng nhập và tạo một Project mới (ví dụ: `library-management`).
2. Tại màn hình Dashboard của Neon, copy chuỗi kết nối **Connection String** (bật chế độ `Pooled connection`), có dạng:
   ```env
   DATABASE_URL="postgresql://neondb_owner:xxxxxx@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
   ```
3. Dán chuỗi này vào file `.env` trên máy của Leader, sau đó chạy 3 lệnh sau để tạo toàn bộ bảng và nạp dữ liệu mẫu lên Cloud:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```
4. Gửi chuỗi `DATABASE_URL` (hoặc file `.env`) cho các thành viên trong nhóm qua kênh chat nội bộ (**Lưu ý:** Tuyệt đối không commit file `.env` lên GitHub).

---

### 👥 Bước 2: Các thành viên trong nhóm kết nối và chạy dự án

Mỗi thành viên sau khi `git clone` dự án về máy cá nhân **không cần cài đặt PostgreSQL dưới máy**, chỉ cần làm theo 3 bước:

1. Tạo file `.env` tại thư mục gốc (copy từ `.env.example`):
   ```bash
   cp .env.example .env
   ```
2. Mở file `.env` và dán chuỗi `DATABASE_URL` của Neon Cloud mà Leader đã cung cấp vào.
3. Mở Terminal và chạy:
   ```bash
   # 1. Cài đặt thư viện
   npm install

   # 2. Sinh Prisma Client khớp với Schema
   npm run db:generate

   # 3. Khởi chạy Server (Dữ liệu đã có sẵn trên Cloud, dùng được ngay!)
   npm run dev
   ```

---

### 🔄 Bước 3: Quy trình đồng bộ khi có thành viên thay đổi cấu trúc bảng (`schema.prisma`)

Khi một thành viên trong nhóm cần thêm bảng hoặc sửa cột trong `prisma/schema.prisma`:

1. **Người sửa Schema:**
   - Chỉnh sửa file `prisma/schema.prisma`.
   - Chạy lệnh tạo migration để cập nhật lên Cloud DB:
     ```bash
     npx prisma migrate dev --name <ten_thay_doi>
     ```
   - Commit và `git push` cả file `prisma/schema.prisma` lẫn thư mục `prisma/migrations/` vừa sinh ra lên GitHub.
2. **Các thành viên còn lại sau khi `git pull`:**
   - Chỉ cần chạy lại lệnh sinh Prisma Client để code TypeScript dưới máy nhận diện cột/bảng mới:
     ```bash
     npm install
     npm run db:generate
     ```

> [!CAUTION]
> **Quy tắc quan trọng khi cả nhóm dùng chung Cloud Database:**
> - **KHÔNG tự ý chạy `npm run db:reset` hoặc `npm run db:seed`** khi các thành viên khác đang làm việc, vì script `prisma/seed.ts` có cơ chế làm sạch bảng (`deleteMany`) sẽ xóa mất dữ liệu mà các bạn khác trong nhóm đang test.
> - Chỉ chạy `npm run db:seed` khi cả nhóm thống nhất muốn **khôi phục lại bộ dữ liệu mẫu ban đầu**.

### 📊 Bảng tóm tắt lệnh nhanh cho các thành viên

| Tình huống | Lệnh cần chạy | Giải thích |
|---|---|---|
| **Mới `git clone` dự án về lần đầu** | `npm install` $\rightarrow$ `npm run db:generate` $\rightarrow$ `npm run dev` | Kết nối thẳng vào Cloud DB chung và chạy ngay |
| **Vừa `git pull` code mới từ nhóm về** | `npm install` $\rightarrow$ `npm run db:generate` | Đồng bộ thư viện và cập nhật kiểu dữ liệu Prisma |
| **Vừa sửa file `prisma/schema.prisma`** | `npx prisma migrate dev --name <ten_migration>` | Đẩy thay đổi cấu trúc bảng lên Cloud DB và tạo file migration |
| **Muốn xem/sửa dữ liệu trực quan trên bảng** | `npm run db:studio` | Mở giao diện quản lý dữ liệu tại `http://localhost:5555` |

---

## 🔑 9. Hướng dẫn sử dụng hệ thống & Tài khoản mẫu

### 1. Tài khoản & Dữ liệu mẫu (Seed Data)

Trên Database đã được nạp sẵn bộ tài khoản theo 3 vai trò và các bản sao sách vật lý để mọi thành viên đăng nhập và kiểm thử ngay:

#### Tài khoản thử nghiệm theo phân quyền (RBAC)
| Vai trò (Role) | Email đăng nhập | Mật khẩu | Mã định danh QR (`qrCode`) | Quyền hạn chính |
|---|---|---|---|---|
| **Quản trị viên (`ADMIN`)** | `admin@library.com` | `Admin@123` | `ADMIN-QR-001` | Toàn quyền hệ thống, cấu hình tham số, miễn giảm phạt (`Waive Fine`), xem `AuditLog` |
| **Thủ thư (`LIBRARIAN`)** | `librarian@library.com` | `Librarian@123` | `LIBRARIAN-QR-001` | Quản lý sách/bản sao, quét QR/Barcode mượn trả tại quầy, thu tiền phạt, xuất báo cáo |
| **Độc giả (`READER`)** | `reader@library.com` | `Reader@123` | `READER-QR-001` | Tra cứu sách, đặt trước (giữ chỗ 24h), gia hạn sách, xem lịch sử mượn & phí phạt cá nhân |

#### Dữ liệu Sách & Mã vạch Bản sao (`Barcode`)
| Đầu sách | Mã ISBN | Mã vạch Bản sao (`BookCopy`) | Vị trí kệ (`shelfLocation`) |
|---|---|---|---|
| **Clean Code: A Handbook of Agile Software Craftsmanship** | `978-604-1-23456-1` | `BC-CC-001`, `BC-CC-002`, `BC-CC-003` | `IT-A1-01` $\rightarrow$ `IT-A1-03` |
| **Design Patterns: Elements of Reusable Object-Oriented Software** | `978-604-1-23456-2` | `BC-DP-001`, `BC-DP-002` | `IT-B2-01` $\rightarrow$ `IT-B2-02` |

---

### 2. Hướng dẫn luồng sử dụng thực tế (End-to-End Workflow)

#### 📘 Luồng 1: Dành cho Độc giả (`READER`)
1. **Đăng nhập:** Sử dụng tài khoản `reader@library.com` (`Reader@123`) tại màn hình Login hoặc gọi `POST /api/v1/auth/login` để nhận `accessToken`.
2. **Tra cứu kho sách:** Tìm kiếm sách theo tên, tác giả, ISBN hoặc lọc theo danh mục tại trang Catalog (`GET /api/v1/books`). Xem số lượng bản sao khả dụng (`availableCopies`) và vị trí kệ (`shelfLocation`).
3. **Đặt mượn trước trực tuyến (Reservation):**
   - Chọn cuốn sách còn bản sao `AVAILABLE` và nhấn **Đặt trước** (`POST /api/v1/borrows/reserve`).
   - Hệ thống tự động khóa 1 bản sao sang trạng thái `RESERVED` và giữ chỗ trong vòng **24 giờ**.
4. **Gia hạn sách đang mượn:**
   - Truy cập mục **Sách đang mượn** (`GET /api/v1/borrows/my`), nhấn **Gia hạn** (`POST /api/v1/borrows/:id/renew`) để cộng thêm **7 ngày** (tối đa 2 lần gia hạn nếu chưa quá hạn).

#### 📗 Luồng 2: Dành cho Thủ thư tại quầy giao dịch (`LIBRARIAN`)
1. **Đăng nhập:** Sử dụng tài khoản `librarian@library.com` (`Librarian@123`).
2. **Xuất sách cho mượn tại quầy (Counter Checkout):**
   - Mở màn hình **Quầy Mượn/Trả (Checkout Desk)** hoặc gọi `POST /api/v1/borrows/checkout`.
   - Quét hoặc nhập mã QR của Độc giả: `READER-QR-001`.
   - Quét hoặc nhập mã Barcode trên cuốn sách vật lý: ví dụ `BC-CC-001`.
   - Xác nhận Checkout $\rightarrow$ Trạng thái bản sao chuyển sang `BORROWED`, số lượng `availableCopies` tự động giảm đi 1.
3. **Nhận sách trả & Tự động tính phạt (Book Return & Fine Engine):**
   - Khi độc giả mang sách trả, thủ thư quét Barcode hoặc chọn phiếu mượn (`POST /api/v1/borrows/:id/return`).
   - Chọn tình trạng sách trả về: nguyên vẹn (`GOOD`), hư hỏng nhẹ/nặng (`DAMAGED`) hoặc báo mất (`LOST`).
   - Nếu trả trễ sau thời gian ân hạn 1 ngày hoặc sách hư hỏng/mất, hệ thống **tự động sinh phiếu phạt (`Fine`)** theo đúng công thức quy định.
4. **Thu tiền phạt:**
   - Truy cập danh sách phí phạt (`GET /api/v1/fines`), chọn phiếu phạt `UNPAID` và xác nhận thu tiền (`PATCH /api/v1/fines/:id/settle`).

#### 📕 Luồng 3: Dành cho Quản trị viên (`ADMIN`)
1. **Đăng nhập:** Sử dụng tài khoản `admin@library.com` (`Admin@123`).
2. **Phê duyệt miễn giảm phí phạt (`Waive Fine`):**
   - Với các trường hợp đặc biệt cần miễn phạt, Admin gọi `PATCH /api/v1/fines/:id/waive` kèm theo lý do miễn giảm bắt buộc (`waivedReason`).
3. **Giám sát & Kiểm toán (`Audit Logs` & `Reports`):**
   - Xem thống kê tổng quan tại Dashboard (`GET /api/v1/reports/overview`), xuất file báo cáo Excel/PDF.
   - Tra cứu lịch sử mọi thao tác nhạy cảm (ai đã xóa sách, ai đã miễn phạt, vào thời gian nào, IP nào) tại `GET /api/v1/audit-logs`.

---

### 3. Hướng dẫn kiểm thử nhanh API (Postman / Thunder Client / cURL)

Khi kiểm thử các API yêu cầu xác thực (`Authenticated`), thực hiện theo 2 bước:
1. Gọi API Đăng nhập để lấy `accessToken`:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@library.com", "password": "Admin@123"}'
   ```
2. Copy giá trị `data.accessToken` từ JSON phản hồi và truyền vào Header `Authorization` của các request tiếp theo:
   ```http
   Authorization: Bearer <accessToken_của_bạn>
   ```

---

## 📋 10. Tài liệu API (RESTful API Reference)

### Chuẩn định dạng Phản hồi (Standard Response Contract)
Tất cả API đều trả về cấu trúc JSON đồng nhất:
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

### Bảng tổng hợp các Endpoints chính (`/api/v1`)

| Phân hệ | Method | Endpoint | Phân quyền | Chức năng |
|---|---|---|---|---|
| **System** | `GET` | `/healthz` | Public | Kiểm tra trạng thái hoạt động của Server & Database |
| **System** | `GET` | `/api/v1` | Public | Thông tin phiên bản API |
| **Auth** | `POST` | `/api/v1/auth/register` | Public | Đăng ký tài khoản Độc giả mới |
| **Auth** | `POST` | `/api/v1/auth/login` | Public | Đăng nhập, cấp `accessToken` và Cookie `refreshToken` |
| **Auth** | `POST` | `/api/v1/auth/refresh` | Public (Cookie) | Cấp mới `accessToken` từ Refresh Token |
| **Auth** | `POST` | `/api/v1/auth/logout` | Authenticated | Đăng xuất và xóa phiên làm việc |
| **Users** | `GET` | `/api/v1/users/me` | Authenticated | Xem hồ sơ cá nhân và mã QR định danh |
| **Users** | `PATCH` | `/api/v1/users/me` | Authenticated | Cập nhật thông tin cá nhân |
| **Users** | `GET` | `/api/v1/users` | `LIBRARIAN`, `ADMIN` | Tìm kiếm, lọc danh sách người dùng |
| **Users** | `PATCH` | `/api/v1/users/:id/status` | `LIBRARIAN`, `ADMIN` | Khóa / Mở khóa tài khoản người dùng |
| **Categories** | `GET` | `/api/v1/categories` | Public | Lấy danh sách toàn bộ thể loại sách |
| **Categories** | `GET` | `/api/v1/categories/:id` | Public | Xem chi tiết thể loại |
| **Categories** | `POST` | `/api/v1/categories` | `LIBRARIAN`, `ADMIN` | Thêm thể loại mới |
| **Categories** | `PATCH` | `/api/v1/categories/:id` | `LIBRARIAN`, `ADMIN` | Cập nhật thể loại |
| **Categories** | `DELETE` | `/api/v1/categories/:id` | `LIBRARIAN`, `ADMIN` | Xóa thể loại |
| **Books** | `GET` | `/api/v1/books` | Public | Tìm kiếm, lọc, phân trang danh mục đầu sách |
| **Books** | `GET` | `/api/v1/books/:id` | Public | Xem chi tiết đầu sách và số lượng khả dụng |
| **Books** | `POST` | `/api/v1/books` | `LIBRARIAN`, `ADMIN` | Tạo đầu sách mới (hỗ trợ khởi tạo kèm bản sao) |
| **Books** | `PATCH` | `/api/v1/books/:id` | `LIBRARIAN`, `ADMIN` | Cập nhật thông tin đầu sách |
| **Books** | `DELETE` | `/api/v1/books/:id` | `LIBRARIAN`, `ADMIN` | Xóa mềm đầu sách (`Soft Delete`) |
| **Book Copies** | `GET` | `/api/v1/books/:bookId/copies` | `LIBRARIAN`, `ADMIN` | Danh sách các bản sao vật lý của một đầu sách |
| **Book Copies** | `POST` | `/api/v1/books/:bookId/copies` | `LIBRARIAN`, `ADMIN` | Nhập thêm bản sao vật lý mới theo số lượng |
| **Book Copies** | `GET` | `/api/v1/copies/barcode/:barcode` | `LIBRARIAN`, `ADMIN` | Quét / Tra cứu nhanh bản sao bằng mã `barcode` |
| **Book Copies** | `PATCH` | `/api/v1/copies/:id` | `LIBRARIAN`, `ADMIN` | Cập nhật vị trí kệ, tình trạng hoặc trạng thái bản sao |
| **Borrows** | `POST` | `/api/v1/borrows/reserve` | `READER` | Đặt mượn sách trực tuyến (giữ chỗ 24 giờ) |
| **Borrows** | `POST` | `/api/v1/borrows/:id/renew` | `READER` | Gia hạn phiếu mượn đang hoạt động |
| **Borrows** | `GET` | `/api/v1/borrows/my` | `READER` | Tra cứu lịch sử mượn trả cá nhân |
| **Borrows** | `POST` | `/api/v1/borrows/checkout` | `LIBRARIAN`, `ADMIN` | Xuất sách tại quầy bằng mã QR/Barcode |
| **Borrows** | `POST` | `/api/v1/borrows/:id/return` | `LIBRARIAN`, `ADMIN` | Nhận sách trả, ghi nhận tình trạng & tự động tính phạt |
| **Fines** | `GET` | `/api/v1/fines` | Authenticated | Danh sách phiếu phạt (Độc giả xem cá nhân, Thủ thư/Admin xem tất cả) |
| **Fines** | `PATCH` | `/api/v1/fines/:id/settle` | `LIBRARIAN`, `ADMIN` | Xác nhận thu tiền phạt |
| **Fines** | `PATCH` | `/api/v1/fines/:id/waive` | `ADMIN` | Miễn giảm phí phạt (yêu cầu lý do & lưu Audit Log) |
| **Reports** | `GET` | `/api/v1/reports/overview` | `LIBRARIAN`, `ADMIN` | Thống kê KPI tổng quan Dashboard |
| **Reports** | `GET` | `/api/v1/reports/export/excel` | `LIBRARIAN`, `ADMIN` | Xuất báo cáo vận hành / tài chính ra file Excel |
| **Reports** | `GET` | `/api/v1/reports/export/pdf` | `LIBRARIAN`, `ADMIN` | Xuất phiếu mượn / biên lai thu phạt ra file PDF |
| **Audit Logs** | `GET` | `/api/v1/audit-logs` | `ADMIN` | Tra cứu nhật ký kiểm toán hệ thống |

---

## 🚀 11. Kiểm thử & Triển khai đám mây (Cloud Deployment)

### Kịch bản Kiểm thử Trọng tâm (Acceptance & Concurrency Testing)
1. **Chống Race Condition khi mượn bản sao cuối:** Khi chỉ còn `1` bản sao `AVAILABLE`, nếu 2 yêu cầu Checkout diễn ra đồng thời, chỉ `1` giao dịch thành công và giao dịch còn lại nhận mã `HTTP 409 Conflict`, đảm bảo `availableCopies` không bao giờ âm.
2. **Tự động tính phí phạt (Fine Engine):** Kiểm thử đầy đủ các trường hợp trả đúng hạn, trả trong thời gian ân hạn (1 ngày), trả quá hạn vượt trần 150% giá sách, trả sách hư hỏng nhẹ/nặng và báo mất sách.
3. **Kiểm soát phân quyền (RBAC):** Đảm bảo `READER` không thể truy cập các API quản trị/thủ thư và chỉ `ADMIN` mới có quyền miễn giảm phí phạt hoặc xem `AuditLog`.

### Hướng dẫn Triển khai lên Cloud (Production)
1. **Database (Neon Serverless PostgreSQL):**
   - Khởi tạo project trên [Neon.tech](https://neon.tech) và lấy chuỗi kết nối `DATABASE_URL` (có bật `sslmode=require`).
2. **Backend (Render / Railway):**
   - Kết nối GitHub Repository.
   - **Build Command:** `npm install && npm run db:generate && npm run db:deploy && npm run build`
   - **Start Command:** `npm start`
   - Thiết lập các biến môi trường (`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`) và cấu hình Health Check Path tại `/healthz`.
3. **Frontend (Vercel / Netlify):**
   - Kết nối thư mục `frontend/`, cấu hình biến `VITE_API_URL` trỏ về địa chỉ Backend trên Render/Railway và kích hoạt tự động deploy.

---

## 📄 Giấy phép (License)

Dự án phục vụ mục đích học tập và nghiên cứu (Đồ án môn học Điện toán Đám mây / Công nghệ Phần mềm). Phát hành theo giấy phép **ISC License**.
