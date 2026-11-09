import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import app from '../src/app';
import prisma from '../src/config/database';
import { cleanupTestData, createTestBook, createTestUser, login } from './test-utils';

jest.setTimeout(30000);

describe('Borrow return business rules', () => {
  let librarian: Awaited<ReturnType<typeof createTestUser>>;
  let librarianToken: string;

  beforeAll(async () => {
    librarian = await createTestUser('LIBRARIAN');
    librarianToken = await login(librarian.email);
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it('charges 5,000 VND per overdue day after one grace day', async () => {
    const reader = await createTestUser('READER');
    const { book, copies } = await createTestBook({ price: 100000 });
    const dueDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 1000);
    const record = await prisma.borrowRecord.create({
      data: {
        userId: reader.id,
        librarianId: librarian.id,
        status: 'BORROWED',
        borrowDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        dueDate,
        items: { create: { bookCopyId: copies[0].id, status: 'BORROWED' } },
      },
    });
    await prisma.bookCopy.update({ where: { id: copies[0].id }, data: { status: 'BORROWED' } });
    await prisma.book.update({ where: { id: book.id }, data: { availableCopies: 0 } });

    const response = await request(app)
      .post(`/api/v1/borrows/${record.id}/return`)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ items: [{ bookCopyId: copies[0].id, condition: 'GOOD' }] });

    expect(response.status).toBe(200);
    const fine = await prisma.fine.findFirstOrThrow({ where: { borrowRecordId: record.id } });
    expect(fine.type).toBe('OVERDUE');
    expect(fine.amount).toBe(5000);
  });

  it('charges 20 percent of book price for light damage', async () => {
    const reader = await createTestUser('READER');
    const { book, copies } = await createTestBook({ price: 100000 });
    const record = await prisma.borrowRecord.create({
      data: {
        userId: reader.id,
        librarianId: librarian.id,
        status: 'BORROWED',
        borrowDate: new Date(),
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        items: { create: { bookCopyId: copies[0].id, status: 'BORROWED' } },
      },
    });
    await prisma.bookCopy.update({ where: { id: copies[0].id }, data: { status: 'BORROWED' } });
    await prisma.book.update({ where: { id: book.id }, data: { availableCopies: 0 } });

    const response = await request(app)
      .post(`/api/v1/borrows/${record.id}/return`)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ items: [{ bookCopyId: copies[0].id, condition: 'LIGHT_DAMAGE' }] });

    expect(response.status).toBe(200);
    const fine = await prisma.fine.findFirstOrThrow({ where: { borrowRecordId: record.id } });
    expect(fine.type).toBe('DAMAGE');
    expect(fine.amount).toBe(20000);
  });
});
