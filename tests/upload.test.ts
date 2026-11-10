import { afterAll, describe, expect, it, jest } from '@jest/globals';
import { Writable } from 'node:stream';
import express from 'express';
import request from 'supertest';

describe('Book cover upload', () => {
  const original = {
    cloud: process.env.CLOUDINARY_CLOUD_NAME,
    key: process.env.CLOUDINARY_API_KEY,
    secret: process.env.CLOUDINARY_API_SECRET,
  };
  const uploadCalls: unknown[] = [];
  const destroyed: string[] = [];

  afterAll(() => {
    for (const [key, value] of Object.entries({
      CLOUDINARY_CLOUD_NAME: original.cloud,
      CLOUDINARY_API_KEY: original.key,
      CLOUDINARY_API_SECRET: original.secret,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    jest.unmock('cloudinary');
  });

  it('uploads a valid image and rejects forged image bytes', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-only';
    jest.doMock('cloudinary', () => ({
      v2: {
        config: () => undefined,
        uploader: {
          upload_stream: (
            options: unknown,
            callback: (
              error: Error | null,
              result?: { secure_url: string; public_id: string },
            ) => void,
          ) => {
            uploadCalls.push(options);
            return new Writable({
              write(_chunk, _encoding, done) {
                done();
              },
              final(done) {
                callback(null, {
                  secure_url: 'https://example.test/cover.png',
                  public_id: 'library/books/test-cover',
                });
                done();
              },
            });
          },
          destroy: async (publicId: string) => {
            destroyed.push(publicId);
          },
        },
      },
    }));
    const { uploadBookCover, removeUploadedCover } =
      await import('../src/middlewares/upload.middleware');
    const app = express();
    app.post('/upload', uploadBookCover, async (req, res) => {
      await removeUploadedCover(req.file);
      res.json({ path: req.file?.path, filename: req.file?.filename });
    });
    const valid = await request(app)
      .post('/upload')
      .attach('coverImage', Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]), {
        filename: 'cover.png',
        contentType: 'image/png',
      });
    expect(valid.status).toBe(200);
    expect(valid.body.path).toBe('https://example.test/cover.png');
    expect(destroyed).toEqual(['library/books/test-cover']);
    const invalid = await request(app)
      .post('/upload')
      .attach('coverImage', Buffer.from('not a png'), {
        filename: 'forged.png',
        contentType: 'image/png',
      });
    expect(invalid.status).toBe(400);
    expect(uploadCalls).toHaveLength(1);
  });
});
