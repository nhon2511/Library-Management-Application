import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import app from '../src/app';
import prisma from '../src/config/database';
import { cleanupTestData, createTestBook, createTestUser, login } from './test-utils';

jest.setTimeout(30000);

describe('POST /api/v1/borrows/reserve concurrency', () => {
  let firstReader: Awaited<ReturnType<typeof createTestUser>>;
  let secondReader: Awaited<ReturnType<typeof createTestUser>>;
  let bookId: string;
  let firstToken: string;
  let secondToken: string;

  beforeAll(async () => {
    firstReader = await createTestUser('READER');
    secondReader = await createTestUser('READER');
    const fixture = await createTestBook({ copies: 1 });
    bookId = fixture.book.id;
    firstToken = await login(firstReader.email);
    secondToken = await login(secondReader.email);
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it('allows exactly one reservation for the only available copy', async () => {
    const responses = await Promise.all([
      request(app)
        .post('/api/v1/borrows/reserve')
        .set('Authorization', `Bearer ${firstToken}`)
        .send({ bookId }),
      request(app)
        .post('/api/v1/borrows/reserve')
        .set('Authorization', `Bearer ${secondToken}`)
        .send({ bookId }),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);

    const book = await prisma.book.findUniqueOrThrow({ where: { id: bookId } });
    const copy = await prisma.bookCopy.findFirstOrThrow({ where: { bookId } });
    expect(book.availableCopies).toBe(0);
    expect(book.availableCopies).toBeGreaterThanOrEqual(0);
    expect(copy.status).toBe('RESERVED');
  });
});
