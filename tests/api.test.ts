import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import app from '../src/app';
import prisma from '../src/config/database';
import {
  cleanupTestData,
  createTestBook,
  createTestUser,
  login,
  testPassword,
  testPrefix,
} from './test-utils';
import * as emailService from '../src/services/email.service';
import { cleanupExpiredReservations } from '../src/jobs/reservation-cleanup.job';
import { matchesImageSignature } from '../src/middlewares/upload.middleware';
import ExcelJS from 'exceljs';
import { cleanupRefreshSessions } from '../src/jobs/refresh-session-cleanup.job';

jest.setTimeout(30000);

describe('Core API', () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let librarian: Awaited<ReturnType<typeof createTestUser>>;
  let reader: Awaited<ReturnType<typeof createTestUser>>;
  let adminToken: string;
  let librarianToken: string;
  let readerToken: string;

  beforeAll(async () => {
    admin = await createTestUser('ADMIN');
    librarian = await createTestUser('LIBRARIAN');
    reader = await createTestUser('READER');
    adminToken = await login(admin.email);
    librarianToken = await login(librarian.email);
    readerToken = await login(reader.email);
  });

  afterAll(async () => {
    await prisma.systemSetting.deleteMany({ where: { key: 'MAX_BORROW_LIMIT' } });
    await prisma.systemSetting.deleteMany({ where: { key: 'LOAN_DAYS' } });
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it('registers a reader with QR, refreshes and invalidates tokens on logout', async () => {
    const email = `${testPrefix}-registered@test.local`;
    const registered = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: testPassword, firstName: 'New', lastName: 'Reader' });
    expect(registered.status).toBe(201);
    expect(registered.body.data.qrCode).toMatch(/^READER-/);
    expect(registered.body.data.password).toBeUndefined();

    const signedIn = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: testPassword });
    expect(signedIn.status).toBe(200);
    const cookie = signedIn.headers['set-cookie'];
    const refreshed = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);
    expect(refreshed.status).toBe(200);
    expect((await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie)).status).toBe(
      401,
    );
    const rotatedCookie = refreshed.headers['set-cookie'];
    expect(
      (await request(app).post('/api/v1/auth/refresh').set('Cookie', rotatedCookie)).status,
    ).toBe(200);
    const token = signedIn.body.data.accessToken as string;
    expect(
      (await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${token}`))
        .status,
    ).toBe(200);
    expect(
      (await request(app).get('/api/v1/users/me').set('Authorization', `Bearer ${token}`)).status,
    ).toBe(401);
    expect((await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie)).status).toBe(
      401,
    );
  });

  it('allows only one concurrent use of a refresh token', async () => {
    const signedIn = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: reader.email, password: testPassword });
    const cookie = signedIn.headers['set-cookie'];
    const responses = await Promise.all([
      request(app).post('/api/v1/auth/refresh').set('Cookie', cookie),
      request(app).post('/api/v1/auth/refresh').set('Cookie', cookie),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 401]);
  });

  it('keeps separate device sessions valid until logout', async () => {
    const first = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: reader.email, password: testPassword });
    const second = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: reader.email, password: testPassword });
    expect(
      (await request(app).post('/api/v1/auth/refresh').set('Cookie', first.headers['set-cookie']))
        .status,
    ).toBe(200);
    expect(
      (await request(app).post('/api/v1/auth/refresh').set('Cookie', second.headers['set-cookie']))
        .status,
    ).toBe(200);
    expect(
      (await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${readerToken}`))
        .status,
    ).toBe(200);
    expect(
      (await request(app).post('/api/v1/auth/refresh').set('Cookie', second.headers['set-cookie']))
        .status,
    ).toBe(401);
    readerToken = await login(reader.email);
  });

  it('removes expired refresh sessions', async () => {
    const expired = await prisma.refreshSession.create({
      data: {
        userId: reader.id,
        tokenHash: `${testPrefix}-expired`,
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    expect(await cleanupRefreshSessions()).toBeGreaterThanOrEqual(1);
    expect(await prisma.refreshSession.findUnique({ where: { id: expired.id } })).toBeNull();
  });

  it('enforces profile, QR and admin RBAC', async () => {
    const profile = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${readerToken}`);
    expect(profile.status).toBe(200);
    expect(profile.body.data.qrCode).toBeTruthy();
    expect(
      (
        await request(app)
          .get(`/api/v1/users/${admin.id}/qrcode`)
          .set('Authorization', `Bearer ${readerToken}`)
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .get(`/api/v1/users/${reader.id}/qrcode`)
          .set('Authorization', `Bearer ${librarianToken}`)
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get('/api/v1/system-settings')
          .set('Authorization', `Bearer ${readerToken}`)
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .patch(`/api/v1/users/${reader.id}/status`)
          .set('Authorization', `Bearer ${librarianToken}`)
          .send({ status: 'SUSPENDED' })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .get('/api/v1/system-settings')
          .set('Authorization', `Bearer ${adminToken}`)
      ).status,
    ).toBe(200);
  });

  it('validates pagination and protects book/category changes', async () => {
    expect((await request(app).get('/api/v1/books?page=-1')).status).toBe(400);
    expect((await request(app).get('/api/v1/books?sortBy=password')).status).toBe(400);
    expect(
      (
        await request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${readerToken}`)
          .send({ name: 'Forbidden' })
      ).status,
    ).toBe(403);
    const fixture = await createTestBook();
    expect((await request(app).get(`/api/v1/books/${fixture.book.id}`)).status).toBe(200);
    expect(
      (
        await request(app)
          .delete(`/api/v1/books/${fixture.book.id}`)
          .set('Authorization', `Bearer ${librarianToken}`)
      ).status,
    ).toBe(200);
    expect((await request(app).get(`/api/v1/books/${fixture.book.id}`)).status).toBe(404);
  });

  it('creates, updates and deletes categories and books', async () => {
    const name = `${testPrefix}-catalog`;
    const category = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ name });
    expect(category.status).toBe(201);
    const categoryId = category.body.data.id as string;
    expect(
      (
        await request(app)
          .patch(`/api/v1/categories/${categoryId}`)
          .set('Authorization', `Bearer ${librarianToken}`)
          .send({ description: 'Catalog fixture' })
      ).status,
    ).toBe(200);
    const book = await request(app)
      .post('/api/v1/books')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({
        isbn: `${testPrefix}-api-isbn`,
        title: 'API book',
        author: 'QA Author',
        price: 100,
        categoryId,
      });
    expect(book.status).toBe(201);
    const bookId = book.body.data.id as string;
    expect(
      (
        await request(app)
          .patch(`/api/v1/books/${bookId}`)
          .set('Authorization', `Bearer ${librarianToken}`)
          .send({ title: 'Updated API book' })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .delete(`/api/v1/books/${bookId}`)
          .set('Authorization', `Bearer ${librarianToken}`)
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .delete(`/api/v1/categories/${categoryId}`)
          .set('Authorization', `Bearer ${librarianToken}`)
      ).status,
    ).toBe(409);
  });

  it('rejects fractional VND prices', async () => {
    const response = await request(app)
      .post('/api/v1/books')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({
        isbn: `${testPrefix}-fractional`,
        title: 'Fractional price',
        author: 'QA',
        price: 10.5,
        categoryId: 'unused',
      });
    expect(response.status).toBe(400);
  });

  it('rejects cover upload when Cloudinary is unavailable', async () => {
    if (process.env.CLOUDINARY_CLOUD_NAME) return;
    const response = await request(app)
      .post('/api/v1/books')
      .set('Authorization', `Bearer ${librarianToken}`)
      .attach('coverImage', Buffer.from('not an image'), 'cover.png');
    expect(response.status).toBe(400);
  });

  it('checks the actual image signature before upload', () => {
    const file = (mimetype: string, buffer: Buffer) =>
      ({ mimetype, buffer }) as Express.Multer.File;
    expect(
      matchesImageSignature(file('image/png', Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))),
    ).toBe(true);
    expect(matchesImageSignature(file('image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0x00])))).toBe(
      true,
    );
    expect(matchesImageSignature(file('image/webp', Buffer.from('RIFF0000WEBP')))).toBe(true);
    expect(matchesImageSignature(file('image/png', Buffer.from('not an image')))).toBe(false);
  });

  it('updates settings with audit and rejects invalid values', async () => {
    const path = '/api/v1/system-settings/MAX_BORROW_LIMIT';
    expect(
      (
        await request(app)
          .patch(path)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ value: -1 })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .patch('/api/v1/system-settings/LOAN_DAYS')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ value: 0 })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .patch('/api/v1/system-settings/LOAN_DAYS')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ value: 500 })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .patch('/api/v1/system-settings/FINE_CAP_PERCENTAGE')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ value: 3 })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .patch(path)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ value: 6 })
      ).status,
    ).toBe(200);
    const item = await prisma.systemSetting.findUniqueOrThrow({
      where: { key: 'MAX_BORROW_LIMIT' },
    });
    expect(item.value).toBe('6');
    expect(
      await prisma.auditLog.count({
        where: { actorId: admin.id, action: 'UPDATE_SYSTEM_SETTING' },
      }),
    ).toBeGreaterThan(0);
  });

  it('checks out, renews and returns a copy once', async () => {
    jest.spyOn(emailService, 'sendCheckoutConfirmation').mockResolvedValue(undefined);
    const fixture = await createTestBook();
    const checkout = await request(app)
      .post('/api/v1/borrows/checkout')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ userId: reader.id, copyBarcodes: [fixture.copies[0].barcode] });
    expect(checkout.status).toBe(201);
    expect(emailService.sendCheckoutConfirmation).toHaveBeenCalledTimes(1);
    const recordId = checkout.body.data.id as string;
    expect(
      (
        await request(app)
          .post(`/api/v1/borrows/${recordId}/renew`)
          .set('Authorization', `Bearer ${readerToken}`)
      ).status,
    ).toBe(200);
    const body = { items: [{ bookCopyId: fixture.copies[0].id, condition: 'GOOD' }] };
    expect(
      (
        await request(app)
          .post(`/api/v1/borrows/${recordId}/return`)
          .set('Authorization', `Bearer ${librarianToken}`)
          .send(body)
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .post(`/api/v1/borrows/${recordId}/return`)
          .set('Authorization', `Bearer ${librarianToken}`)
          .send(body)
      ).status,
    ).toBe(400);
  });

  it('uses the configured loan duration at checkout', async () => {
    jest.spyOn(emailService, 'sendCheckoutConfirmation').mockResolvedValue(undefined);
    await request(app)
      .patch('/api/v1/system-settings/LOAN_DAYS')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ value: 21 });
    const fixture = await createTestBook();
    const checkout = await request(app)
      .post('/api/v1/borrows/checkout')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ userId: reader.id, copyBarcodes: [fixture.copies[0].barcode] });
    expect(checkout.status).toBe(201);
    const days =
      (new Date(checkout.body.data.dueDate).getTime() -
        new Date(checkout.body.data.borrowDate).getTime()) /
      86400000;
    expect(days).toBeGreaterThan(20.9);
    expect(days).toBeLessThan(21.1);
    await prisma.systemSetting.delete({ where: { key: 'LOAN_DAYS' } });
  });

  it('rejects one of two concurrent renewals without losing days', async () => {
    const dueDate = new Date(Date.now() + 14 * 86400000);
    const record = await prisma.borrowRecord.create({
      data: { userId: reader.id, status: 'BORROWED', dueDate },
    });
    const renew = () =>
      request(app)
        .post(`/api/v1/borrows/${record.id}/renew`)
        .set('Authorization', `Bearer ${readerToken}`);
    const responses = await Promise.all([renew(), renew()]);
    const successes = responses.filter((response) => response.status === 200).length;
    expect(successes).toBeGreaterThanOrEqual(1);
    expect(responses.every((response) => [200, 409].includes(response.status))).toBe(true);
    const updated = await prisma.borrowRecord.findUniqueOrThrow({ where: { id: record.id } });
    expect(updated.renewCount).toBe(successes);
    expect(updated.dueDate!.getTime() - dueDate.getTime()).toBe(successes * 7 * 86400000);
    if (successes === 1) expect((await renew()).status).toBe(200);
  });

  it('streams an Excel report that remains readable', async () => {
    const response = await request(app)
      .get('/api/v1/reports/export/excel')
      .set('Authorization', `Bearer ${librarianToken}`)
      .buffer(true)
      .parse((stream, callback) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => callback(null, Buffer.concat(chunks)));
        stream.on('error', callback);
      });
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('spreadsheetml.sheet');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(response.body);
    expect(workbook.worksheets[0].getRow(1).getCell(2).value).toBe('Mã phiếu');
    expect(workbook.worksheets[0].rowCount).toBeGreaterThan(1);
  });

  it('supports partial returns across multiple copies', async () => {
    jest.spyOn(emailService, 'sendCheckoutConfirmation').mockResolvedValue(undefined);
    const fixture = await createTestBook({ copies: 2 });
    const checkout = await request(app)
      .post('/api/v1/borrows/checkout')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ userId: reader.id, copyBarcodes: fixture.copies.map((copy) => copy.barcode) });
    expect(checkout.status).toBe(201);
    const recordId = checkout.body.data.id as string;
    const first = await request(app)
      .post(`/api/v1/borrows/${recordId}/return`)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ items: [{ bookCopyId: fixture.copies[0].id, condition: 'GOOD' }] });
    expect(first.status).toBe(200);
    expect(first.body.data.status).toBe('BORROWED');
    const second = await request(app)
      .post(`/api/v1/borrows/${recordId}/return`)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ items: [{ bookCopyId: fixture.copies[1].id, condition: 'GOOD' }] });
    expect(second.status).toBe(200);
    expect(second.body.data.status).toBe('RETURNED');
  });

  it('blocks renewal after due date and deletion of borrowed books', async () => {
    const fixture = await createTestBook();
    const record = await prisma.borrowRecord.create({
      data: {
        userId: reader.id,
        status: 'BORROWED',
        dueDate: new Date(Date.now() - 86400000),
        items: { create: { bookCopyId: fixture.copies[0].id } },
      },
    });
    await prisma.bookCopy.update({
      where: { id: fixture.copies[0].id },
      data: { status: 'BORROWED' },
    });
    expect(
      (
        await request(app)
          .post(`/api/v1/borrows/${record.id}/renew`)
          .set('Authorization', `Bearer ${readerToken}`)
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .delete(`/api/v1/books/${fixture.book.id}`)
          .set('Authorization', `Bearer ${librarianToken}`)
      ).status,
    ).toBe(409);
  });

  it('claims a copy for only one concurrent checkout', async () => {
    jest.spyOn(emailService, 'sendCheckoutConfirmation').mockResolvedValue(undefined);
    const anotherReader = await createTestUser('READER');
    const fixture = await createTestBook();
    const checkout = (userId: string) =>
      request(app)
        .post('/api/v1/borrows/checkout')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ userId, copyBarcodes: [fixture.copies[0].barcode] });
    const responses = await Promise.all([checkout(reader.id), checkout(anotherReader.id)]);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(
      (await prisma.book.findUniqueOrThrow({ where: { id: fixture.book.id } })).availableCopies,
    ).toBe(0);
  });

  it('settles or waives a fine only once with the correct role', async () => {
    const paid = await prisma.fine.create({
      data: { userId: reader.id, type: 'OVERDUE', amount: 10000 },
    });
    const waived = await prisma.fine.create({
      data: { userId: reader.id, type: 'DAMAGE', amount: 20000 },
    });
    expect(
      (
        await request(app)
          .patch(`/api/v1/fines/${paid.id}/settle`)
          .set('Authorization', `Bearer ${readerToken}`)
          .send({ paymentMethod: 'CASH' })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .patch(`/api/v1/fines/${paid.id}/settle`)
          .set('Authorization', `Bearer ${librarianToken}`)
          .send({ paymentMethod: 'CASH' })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .patch(`/api/v1/fines/${paid.id}/settle`)
          .set('Authorization', `Bearer ${librarianToken}`)
          .send({ paymentMethod: 'CASH' })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .patch(`/api/v1/fines/${paid.id}/waive`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ reason: 'Test' })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .patch(`/api/v1/fines/${waived.id}/waive`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ reason: 'Test' })
      ).status,
    ).toBe(200);
  });

  it('releases an expired reservation and restores availability', async () => {
    const fixture = await createTestBook();
    const reserved = await request(app)
      .post('/api/v1/borrows/reserve')
      .set('Authorization', `Bearer ${readerToken}`)
      .send({ bookId: fixture.book.id });
    expect(reserved.status).toBe(201);
    await prisma.borrowRecord.update({
      where: { id: reserved.body.data.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await cleanupExpiredReservations()).toBe(1);
    const book = await prisma.book.findUniqueOrThrow({ where: { id: fixture.book.id } });
    expect(book.availableCopies).toBe(1);
    expect(
      (await prisma.borrowRecord.findUniqueOrThrow({ where: { id: reserved.body.data.id } }))
        .status,
    ).toBe('CANCELLED');
  });
});
