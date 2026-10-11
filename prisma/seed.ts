import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// Khởi tạo Driver Adapter cho PostgreSQL
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.info('🌱 Đang seed dữ liệu mẫu...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.borrowItem.deleteMany();
  await prisma.borrowRecord.deleteMany();
  await prisma.bookCopy.deleteMany();
  await prisma.book.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const librarianPassword = await bcrypt.hash('Librarian@123', 12);
  const readerPassword = await bcrypt.hash('Reader@123', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@library.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      phone: '0900000001',
      role: 'ADMIN',
      status: 'ACTIVE',
      qrCode: 'ADMIN-QR-001',
    },
  });

  const librarian = await prisma.user.create({
    data: {
      email: 'librarian@library.com',
      password: librarianPassword,
      firstName: 'Thu',
      lastName: 'Thư',
      phone: '0900000002',
      role: 'LIBRARIAN',
      status: 'ACTIVE',
      qrCode: 'LIBRARIAN-QR-001',
    },
  });

  const reader = await prisma.user.create({
    data: {
      email: 'reader@library.com',
      password: readerPassword,
      firstName: 'Nguyễn',
      lastName: 'Văn Độc Giả',
      phone: '0900000003',
      role: 'READER',
      status: 'ACTIVE',
      qrCode: 'READER-QR-001',
    },
  });

  console.info('Created users:', { admin: admin.email, librarian: librarian.email, reader: reader.email });

  // Create categories
  const catIT = await prisma.category.create({
    data: { name: 'Công nghệ thông tin', slug: 'cong-nghe-thong-tin', description: 'Sách lập trình, AI, Cloud, v.v.' },
  });

  const catBus = await prisma.category.create({
    data: { name: 'Kinh tế & Quản trị', slug: 'kinh-te-quan-tri', description: 'Sách kinh doanh, khởi nghiệp, tài chính' },
  });

  console.info('Created categories:', [catIT.name, catBus.name]);

  // Create books
  const book1 = await prisma.book.create({
    data: {
      isbn: '978-604-1-23456-1',
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      publisher: 'Prentice Hall',
      publishedYear: 2008,
      description: 'Sách kinh điển về viết code sạch và dễ bảo trì.',
      price: 250000,
      totalCopies: 3,
      availableCopies: 3,
      categoryId: catIT.id,
    },
  });

  const book2 = await prisma.book.create({
    data: {
      isbn: '978-604-1-23456-2',
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      author: 'Erich Gamma et al.',
      publisher: 'Addison-Wesley',
      publishedYear: 1994,
      description: 'Các mẫu thiết kế hướng đối tượng phổ biến.',
      price: 320000,
      totalCopies: 2,
      availableCopies: 2,
      categoryId: catIT.id,
    },
  });

  console.info('Created books:', [book1.title, book2.title]);

  // Create book copies
  await prisma.bookCopy.createMany({
    data: [
      { bookId: book1.id, barcode: 'BC-CC-001', shelfLocation: 'IT-A1-01', status: 'AVAILABLE' },
      { bookId: book1.id, barcode: 'BC-CC-002', shelfLocation: 'IT-A1-02', status: 'AVAILABLE' },
      { bookId: book1.id, barcode: 'BC-CC-003', shelfLocation: 'IT-A1-03', status: 'AVAILABLE' },
      { bookId: book2.id, barcode: 'BC-DP-001', shelfLocation: 'IT-B2-01', status: 'AVAILABLE' },
      { bookId: book2.id, barcode: 'BC-DP-002', shelfLocation: 'IT-B2-02', status: 'AVAILABLE' },
    ],
  });

  console.info('🌱 Seed dữ liệu thành công!');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });