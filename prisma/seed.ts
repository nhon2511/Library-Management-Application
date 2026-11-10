import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'node:crypto';
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
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed dữ liệu mẫu không được chạy trong production');
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (Boolean(adminEmail) !== Boolean(adminPassword)) {
    throw new Error('Cần cấu hình đồng thời SEED_ADMIN_EMAIL và SEED_ADMIN_PASSWORD');
  }
  if (adminEmail && adminPassword) {
    const bcrypt = await import('bcryptjs');
    await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        password: await bcrypt.default.hash(adminPassword, 12),
        firstName: 'System',
        lastName: 'Admin',
        role: 'ADMIN',
        qrCode: `ADMIN-${randomUUID()}`,
      },
      update: {},
    });
  }

  const categoryByName = new Map<string, string>();
  for (const name of new Set(bookDefinitions.map((book) => book[3]))) {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, 'va')
      .replace(/\s+/g, '-');
    const category = await prisma.category.upsert({
      where: { slug },
      create: { name, slug, description: `Sách thuộc nhóm ${name}` },
      update: {},
    });
    categoryByName.set(name, category.id);
  }

  for (const [isbn, title, author, categoryName, shelfLocation, coverImageUrl] of bookDefinitions) {
    const categoryId = categoryByName.get(categoryName);
    if (!categoryId) throw new Error('Thiếu category trong dữ liệu mẫu');
    const book = await prisma.book.upsert({
      where: { isbn },
      create: {
        isbn,
        title,
        author,
        categoryId,
        coverImageUrl,
        publisher: 'Library Press',
        publishedYear: 2000,
        description: `Tài liệu tham khảo: ${title}`,
        price: 180000,
      },
      update: {},
    });
    for (let index = 1; index <= 2; index += 1) {
      const barcode = `LIB-${isbn.slice(-5)}-${String(index).padStart(2, '0')}`;
      const existing = await prisma.bookCopy.findUnique({ where: { barcode } });
      if (!existing) {
        await prisma.$transaction(async (tx) => {
          await tx.bookCopy.create({
            data: {
              bookId: book.id,
              barcode,
              shelfLocation: `${shelfLocation}-${String(index).padStart(2, '0')}`,
            },
          });
          await tx.book.update({
            where: { id: book.id },
            data: { totalCopies: { increment: 1 }, availableCopies: { increment: 1 } },
          });
        });
      }
    }
  }

  console.info('Seed dữ liệu mẫu hoàn tất');
}

main()
  .catch((error) => {
    console.error('Seed thất bại', { name: error instanceof Error ? error.name : 'UnknownError' });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
