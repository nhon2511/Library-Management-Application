import bcrypt from 'bcryptjs';
import { expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';

export const testPassword = 'Test@12345';
export const testPrefix = `qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export async function createTestUser(role: 'READER' | 'LIBRARIAN' | 'ADMIN') {
  const uniqueId = Math.random().toString(36).slice(2, 10);
  return prisma.user.create({
    data: {
      email: `${testPrefix}-${role.toLowerCase()}-${uniqueId}@test.local`,
      password: await bcrypt.hash(testPassword, 4),
      firstName: 'QA',
      lastName: role,
      role,
      qrCode: `${testPrefix}-${role}-${uniqueId}`,
    },
  });
}

export async function login(email: string): Promise<string> {
  const response = await request(app).post('/api/v1/auth/login').send({
    email,
    password: testPassword,
  });

  expect(response.status).toBe(200);
  return response.body.data.accessToken as string;
}

export async function cleanupTestData(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: testPrefix } },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  await prisma.auditLog.deleteMany({ where: { actorId: { in: userIds } } });

  const records = await prisma.borrowRecord.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const recordIds = records.map((record) => record.id);

  await prisma.fine.deleteMany({
    where: { OR: [{ borrowRecordId: { in: recordIds } }, { userId: { in: userIds } }] },
  });
  await prisma.borrowItem.deleteMany({ where: { borrowRecordId: { in: recordIds } } });
  await prisma.borrowRecord.deleteMany({ where: { id: { in: recordIds } } });

  const categories = await prisma.category.findMany({
    where: { slug: { startsWith: testPrefix } },
    select: { id: true },
  });
  const categoryIds = categories.map((category) => category.id);
  const books = await prisma.book.findMany({
    where: { categoryId: { in: categoryIds } },
    select: { id: true },
  });
  const bookIds = books.map((book) => book.id);

  await prisma.bookCopy.deleteMany({ where: { bookId: { in: bookIds } } });
  await prisma.book.deleteMany({ where: { id: { in: bookIds } } });
  await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

export async function createTestBook(options: { copies?: number; price?: number } = {}) {
  const fixtureId = Math.random().toString(36).slice(2, 10);
  const category = await prisma.category.create({
    data: {
      name: `${testPrefix}-category-${fixtureId}`,
      slug: `${testPrefix}-category-${fixtureId}`,
    },
  });
  const copies = options.copies ?? 1;
  const book = await prisma.book.create({
    data: {
      isbn: `${testPrefix}-isbn-${Math.random().toString(36).slice(2, 8)}`,
      title: `${testPrefix}-book`,
      author: 'QA Author',
      price: options.price ?? 100000,
      totalCopies: copies,
      availableCopies: copies,
      categoryId: category.id,
    },
  });
  const createdCopies = await Promise.all(
    Array.from({ length: copies }, (_, index) =>
      prisma.bookCopy.create({
        data: {
          bookId: book.id,
          barcode: `${testPrefix}-${fixtureId}-barcode-${index}`,
          shelfLocation: `QA-${index + 1}`,
        },
      }),
    ),
  );

  return { book, copies: createdCopies };
}
