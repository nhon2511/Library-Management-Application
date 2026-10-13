# AGENTS.md

## Phạm vi

Đây là backend hệ thống quản lý thư viện, xây dựng bằng Express 5, TypeScript và Prisma với PostgreSQL. Các hướng dẫn trong file này áp dụng cho toàn bộ repository.

## Công nghệ và cấu trúc

- Runtime: Node.js; mã nguồn TypeScript strict, biên dịch ra `dist/`.
- HTTP API: Express 5, REST API dưới prefix `/api/v1`.
- Database: PostgreSQL qua Prisma; schema nguồn là `prisma/schema.prisma`.
- Validation: Zod.
- Auth/security: JWT, cookie, Helmet, CORS, rate limiting và RBAC.
- Entry points:
  - `src/server.ts`: khởi động HTTP server, validate environment và graceful shutdown.
  - `src/app.ts`: tạo Express app, middleware, health check và đăng ký routes.
- `src/modules/<module>/`: mỗi module thường gồm `*.routes.ts`, `*.controller.ts`, `*.service.ts` và `*.schema.ts`.
- `src/middlewares/`: middleware dùng chung như authentication, authorization, validation và error handling.
- `src/config/`: cấu hình ứng dụng và Prisma client.
- `src/utils/`: lỗi API, response chuẩn hóa, logger, async handler và constants.
- `prisma/seed.ts`: dữ liệu seed; không đặt logic domain mới trong file này.

## Skill nội bộ

Các skill dự án nằm trong `.agents/skills/` và bổ sung quy trình chuyên biệt cho agent:

- `backend-review`: review kiến trúc, TypeScript, validation, lỗi và chất lượng backend.
- `api-feature`: thêm hoặc sửa endpoint theo module, schema, controller và service.
- `prisma-workflow`: thay đổi Prisma schema, migration, query và seed an toàn.
- `security-review`: kiểm tra auth, RBAC, secrets, data exposure và các lỗi bảo mật backend.
- `testing`: thiết kế/bổ sung test; lưu ý hiện dự án chưa có test runner.
- `bug-fix`: tái hiện, tìm nguyên nhân, sửa lỗi tối thiểu và kiểm tra regression.
- `release-check`: kiểm tra build, lint, format, Prisma, cấu hình và diff trước merge/deploy.

Khi task phù hợp với một skill, đọc `SKILL.md` tương ứng trước khi thực hiện. Skill không thay thế các quy tắc chung trong file này.

## Quy trình xử lý request

Route nhận request và áp dụng middleware theo thứ tự phù hợp (thường là `authenticate`, `authorize`, `validate`), sau đó gọi controller. Controller nên mỏng, dùng `asyncHandler`, lấy input từ request và trả response qua `ApiResponse`. Business logic và truy vấn Prisma đặt trong service. Lỗi nghiệp vụ dùng các lớp trong `src/utils/api-error.ts` để được `errorHandler` chuyển thành response thống nhất.

## Quy ước code

- Dùng TypeScript strict; không vô hiệu hóa kiểm tra kiểu để né lỗi. Giữ mã không có unused locals/parameters.
- Dùng `async/await`, không tự viết `try/catch` trong controller nếu chỉ để chuyển lỗi; hãy dùng `asyncHandler`.
- Controller không chứa truy vấn Prisma hoặc business logic phức tạp.
- Input từ body/query/params phải được kiểm tra bằng schema Zod trước khi vào service.
- Dùng Prisma client dùng chung từ `src/config/database.ts`; không khởi tạo `PrismaClient` mới trong module.
- Dùng `ApiResponse` cho response thành công và `ApiError`/các lớp con cho lỗi dự kiến.
- Khi thêm endpoint cần cân nhắc authentication, RBAC, rate limit và quyền truy cập dữ liệu.
- Giữ soft-delete nhất quán với các entity có cờ `isDeleted`; không xóa cứng nếu nghiệp vụ hiện tại không yêu cầu.
- Tên file hiện dùng kebab-case cho tên module nhiều từ (`book-copy`) và hậu tố theo vai trò (`.routes.ts`, `.controller.ts`, `.service.ts`, `.schema.ts`).
- Format bằng Prettier: 2 spaces, single quotes, semicolon, trailing commas và print width 100. Dùng LF.
- Không commit secrets hoặc file `.env`; cập nhật `.env.example` khi thêm biến môi trường mới.
- Comment nên giải thích lý do hoặc ràng buộc nghiệp vụ, không lặp lại điều code đã thể hiện.

## Lệnh thường dùng

```bash
npm install                 # cài dependencies
npm run dev                 # chạy dev server với tsx watch
npm run build               # kiểm tra TypeScript và build vào dist/
npm start                   # chạy bản build
npm run lint                # lint src/
npm run lint:fix            # tự sửa lỗi lint có thể sửa được
npm run format              # format mã nguồn
npm run format:check        # kiểm tra format
npm run db:generate         # generate Prisma Client
npm run db:migrate          # tạo/apply migration khi phát triển
npm run db:deploy           # apply migration cho môi trường deploy
npm run db:seed             # chạy seed
npm run db:studio           # mở Prisma Studio
```

Repository hiện chưa có script test hoặc test suite được phát hiện. Khi thêm behavior mới, nên bổ sung test phù hợp trước khi mở rộng thay đổi.

## Database và environment

- Sao chép `.env.example` thành `.env` cho máy local và điền `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` cùng các biến cần thiết.
- Sau khi sửa `prisma/schema.prisma`, chạy `npm run db:generate` và tạo migration bằng `npm run db:migrate`.
- Không dùng `npm run db:reset` trừ khi đã xác nhận rõ vì lệnh này có thể xóa và tạo lại dữ liệu local.
- Không log JWT, mật khẩu, connection string hoặc dữ liệu cá nhân nhạy cảm.
- Không sửa trực tiếp file trong `dist/`; đó là output build.

## Kiểm tra trước khi hoàn tất thay đổi

Chạy tối thiểu các lệnh liên quan đến phần đã sửa:

```bash
npm run build
npm run lint
npm run format:check
```

Nếu thay đổi Prisma, kiểm tra thêm generate/migration phù hợp. Nếu thay đổi API, xác nhận status code, shape response, validation, quyền truy cập và behavior khi lỗi.

## Git

- Commit hiện dùng Conventional Commits, ví dụ `feat: ...`, `fix: ...`, `docs: ...`.
- Giữ mỗi commit tập trung vào một mục đích; không đưa file build, `.env` hoặc thay đổi không liên quan vào commit.
- Trước khi sửa, kiểm tra `git status` và bảo toàn các thay đổi chưa commit của người dùng.
