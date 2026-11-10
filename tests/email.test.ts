import { afterAll, describe, expect, it, jest } from '@jest/globals';

describe('Email service', () => {
  const original = {
    host: process.env.SMTP_HOST,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  };

  afterAll(() => {
    for (const [key, value] of Object.entries({
      SMTP_HOST: original.host,
      SMTP_USER: original.user,
      SMTP_PASS: original.pass,
      SMTP_FROM: original.from,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    jest.unmock('nodemailer');
  });

  it('sends checkout confirmation through SMTP and escapes book titles', async () => {
    const sent: Array<{ to: string; from: string; html: string }> = [];
    jest.doMock('nodemailer', () => ({
      __esModule: true,
      default: {
        createTransport: () => ({
          sendMail: async (message: { to: string; from: string; html: string }) => {
            sent.push(message);
            return {};
          },
        }),
      },
    }));
    process.env.SMTP_HOST = 'localhost';
    process.env.SMTP_USER = 'test-user';
    process.env.SMTP_PASS = 'test-only';
    process.env.SMTP_FROM = 'library@test.local';
    const { sendCheckoutConfirmation } = await import('../src/services/email.service');
    await sendCheckoutConfirmation('reader@test.local', 'Reader', [
      { title: '<script>alert(1)</script>', dueDate: new Date('2026-11-10T00:00:00Z') },
    ]);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('reader@test.local');
    expect(sent[0].from).toBe('library@test.local');
    expect(sent[0].html).toContain('&lt;script&gt;');
    expect(sent[0].html).not.toContain('<script>');
  });
});
