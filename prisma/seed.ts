import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const cover = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&q=85`;

const bookDefinitions = [
  [
    '978-604-1-00001-1',
    'Clean Code',
    'Robert C. Martin',
    'Công nghệ thông tin',
    'IT-A1-01',
    cover('photo-1515879218367-8466d910aaa4'),
  ],
  [
    '978-604-1-00002-8',
    'Design Patterns',
    'Erich Gamma et al.',
    'Công nghệ thông tin',
    'IT-A1-02',
    cover('photo-1555066931-4365d14bab8c'),
  ],
  [
    '978-604-1-00003-5',
    'The Pragmatic Programmer',
    'David Thomas',
    'Công nghệ thông tin',
    'IT-A1-03',
    cover('photo-1461749280684-dccba630e2f6'),
  ],
  [
    '978-604-1-00004-2',
    'Artificial Intelligence: A Modern Approach',
    'Stuart Russell',
    'Công nghệ thông tin',
    'IT-A2-01',
    cover('photo-1485827404703-89b55fcc595e'),
  ],
  [
    '978-604-1-00005-9',
    'Computer Networking',
    'Andrew S. Tanenbaum',
    'Công nghệ thông tin',
    'IT-A2-02',
    cover('photo-1558494949-ef010cbdcc31'),
  ],
  [
    '978-604-1-00006-6',
    'Sapiens',
    'Yuval Noah Harari',
    'Khoa học & Xã hội',
    'KH-B1-01',
    cover('photo-1532012197267-da84d127e765'),
  ],
  [
    '978-604-1-00007-3',
    'A Brief History of Time',
    'Stephen Hawking',
    'Khoa học & Xã hội',
    'KH-B1-02',
    cover('photo-1532094349884-543bc11b234d'),
  ],
  [
    '978-604-1-00008-0',
    'Cosmos',
    'Carl Sagan',
    'Khoa học & Xã hội',
    'KH-B1-03',
    cover('photo-1446776811953-b23d57bd21aa'),
  ],
  [
    '978-604-1-00009-7',
    'The Selfish Gene',
    'Richard Dawkins',
    'Khoa học & Xã hội',
    'KH-B2-01',
    cover('photo-1535378917042-10a22c95931a'),
  ],
  [
    '978-604-1-00010-3',
    'Thinking, Fast and Slow',
    'Daniel Kahneman',
    'Kinh tế & Quản trị',
    'KT-C1-01',
    cover('photo-1556761175-b413da4baf72'),
  ],
  [
    '978-604-1-00011-0',
    'Good to Great',
    'Jim Collins',
    'Kinh tế & Quản trị',
    'KT-C1-02',
    cover('photo-1552664730-d307ca884978'),
  ],
  [
    '978-604-1-00012-7',
    'The Lean Startup',
    'Eric Ries',
    'Kinh tế & Quản trị',
    'KT-C1-03',
    cover('photo-1553877522-43269d4ea984'),
  ],
  [
    '978-604-1-00013-4',
    'Rich Dad Poor Dad',
    'Robert Kiyosaki',
    'Kinh tế & Quản trị',
    'KT-C2-01',
    cover('photo-1554224155-6726b3ff858f'),
  ],
  [
    '978-604-1-00014-1',
    'Atomic Habits',
    'James Clear',
    'Kỹ năng sống',
    'KN-D1-01',
    cover('photo-1499750310107-5fef28a66643'),
  ],
  [
    '978-604-1-00015-8',
    'Deep Work',
    'Cal Newport',
    'Kỹ năng sống',
    'KN-D1-02',
    cover('photo-1499750310107-5fef28a66643'),
  ],
  [
    '978-604-1-00016-5',
    'The Power of Now',
    'Eckhart Tolle',
    'Kỹ năng sống',
    'KN-D1-03',
    cover('photo-1500534623283-312aadd485b7'),
  ],
  [
    '978-604-1-00017-2',
    'Pride and Prejudice',
    'Jane Austen',
    'Văn học',
    'VH-E1-01',
    cover('photo-1544947950-fa07a98d237f'),
  ],
  [
    '978-604-1-00018-9',
    'The Great Gatsby',
    'F. Scott Fitzgerald',
    'Văn học',
    'VH-E1-02',
    cover('photo-1512820790803-83ca734da794'),
  ],
  [
    '978-604-1-00019-6',
    'Norwegian Wood',
    'Haruki Murakami',
    'Văn học',
    'VH-E1-03',
    cover('photo-1495446815901-a7297e633e8d'),
  ],
  [
    '978-604-1-00020-2',
    'One Hundred Years of Solitude',
    'Gabriel García Márquez',
    'Văn học',
    'VH-E2-01',
    cover('photo-1543002588-bfa74002ed7e'),
  ],
] as const;

async function main() {
  console.info('🌱 Đang seed dữ liệu mẫu...');

  await prisma.auditLog.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.borrowItem.deleteMany();
  await prisma.borrowRecord.deleteMany();
  await prisma.bookCopy.deleteMany();
  await prisma.book.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const [adminPassword, librarianPassword, readerPassword] = await Promise.all([
    bcrypt.hash('Admin@123', 12),
    bcrypt.hash('Librarian@123', 12),
    bcrypt.hash('Reader@123', 12),
  ]);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@library.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      phone: '0900000001',
      role: 'ADMIN',
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
      qrCode: 'LIBRARIAN-QR-001',
    },
  });

  const readers = await Promise.all(
    Array.from({ length: 5 }, (_, index) =>
      prisma.user.create({
        data: {
          email: `reader${index + 1}@library.local`,
          password: readerPassword,
          firstName: `Độc giả ${index + 1}`,
          lastName: 'Thư viện',
          phone: `09000000${10 + index}`,
          role: 'READER',
          qrCode: `READER-QR-00${index + 1}`,
        },
      }),
    ),
  );

  const categoryNames = [...new Set(bookDefinitions.map((book) => book[3]))];
  const categories = await Promise.all(
    categoryNames.map((name) =>
      prisma.category.create({
        data: {
          name,
          slug: name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/&/g, 'va')
            .replace(/\s+/g, '-'),
          description: `Sách thuộc nhóm ${name}`,
        },
      }),
    ),
  );
  const categoryByName = new Map(categories.map((category) => [category.name, category]));

  const books = [];
  for (const [isbn, title, author, categoryName, shelfLocation, coverImageUrl] of bookDefinitions) {
    const category = categoryByName.get(categoryName);
    if (!category) throw new Error(`Thiếu category ${categoryName}`);

    const book = await prisma.book.create({
      data: {
        isbn,
        title,
        author,
        publisher: 'Library Press',
        publishedYear: 2000,
        description: `Tài liệu tham khảo: ${title}`,
        coverImageUrl,
        price: 180000,
        totalCopies: 2,
        availableCopies: 2,
        categoryId: category.id,
      },
    });
    await prisma.bookCopy.createMany({
      data: [
        {
          bookId: book.id,
          barcode: `LIB-${isbn.slice(-5)}-01`,
          shelfLocation: `${shelfLocation}-01`,
        },
        {
          bookId: book.id,
          barcode: `LIB-${isbn.slice(-5)}-02`,
          shelfLocation: `${shelfLocation}-02`,
        },
      ],
    });
    books.push(book);
  }

  const now = new Date();
  const normalDueDate = new Date(now);
  normalDueDate.setDate(normalDueDate.getDate() + 10);
  const overdueDueDate = new Date(now);
  overdueDueDate.setDate(overdueDueDate.getDate() - 5);
  const borrowDate = new Date(now);
  borrowDate.setDate(borrowDate.getDate() - 12);

  const borrowedCopies = await prisma.bookCopy.findMany({
    where: { bookId: { in: books.slice(0, 5).map((book) => book.id) } },
    orderBy: { barcode: 'asc' },
  });
  const records = [];
  for (let index = 0; index < 5; index += 1) {
    const isOverdue = index >= 3;
    const copy = borrowedCopies[index];
    const record = await prisma.borrowRecord.create({
      data: {
        userId: readers[index].id,
        librarianId: librarian.id,
        status: isOverdue ? 'OVERDUE' : 'BORROWED',
        borrowDate,
        dueDate: isOverdue ? overdueDueDate : normalDueDate,
        items: { create: { bookCopyId: copy.id, status: 'BORROWED' } },
      },
    });
    await prisma.bookCopy.update({ where: { id: copy.id }, data: { status: 'BORROWED' } });
    await prisma.book.update({
      where: { id: copy.bookId },
      data: { availableCopies: { decrement: 1 } },
    });
    records.push(record);
  }

  await prisma.fine.create({
    data: {
      userId: readers[3].id,
      borrowRecordId: records[3].id,
      type: 'OVERDUE',
      amount: 25000,
      reason: 'Phạt quá hạn chưa thanh toán',
    },
  });
  await prisma.fine.create({
    data: {
      userId: readers[4].id,
      borrowRecordId: records[4].id,
      type: 'OVERDUE',
      status: 'PAID',
      amount: 15000,
      paidAmount: 15000,
      paidAt: now,
      paymentMethod: 'CASH',
      reason: 'Phạt quá hạn đã thanh toán',
    },
  });

  console.info('Seed thành công:', {
    admin: admin.email,
    librarian: librarian.email,
    readers: readers.length,
    categories: categories.length,
    books: books.length,
    activeBorrows: 3,
    overdueBorrows: 2,
  });
}

main()
  .catch((error) => {
    console.error('Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
