import { describe, expect, it } from 'vitest';
import { MAX_V0_FILE_BYTES, sha256ArrayBuffer, sha256Blob } from './hash';

const encoder = new TextEncoder();

function buffer(text: string): ArrayBuffer {
  return encoder.encode(text).buffer as ArrayBuffer;
}

describe('sha256ArrayBuffer', () => {
  it('matches the SHA-256 test vector for an empty input', async () => {
    await expect(sha256ArrayBuffer(buffer(''))).resolves.toBe(
      '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('matches the SHA-256 test vector for abc', async () => {
    await expect(sha256ArrayBuffer(buffer('abc'))).resolves.toBe(
      '0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});

describe('file size limit', () => {
  it('is capped at 25 MB for the V0 prototype', () => {
    expect(MAX_V0_FILE_BYTES).toBe(25 * 1024 * 1024);
  });

  it('rejects files larger than the limit before reading their bytes', async () => {
    const oversizedBlob = {
      size: MAX_V0_FILE_BYTES + 1,
      arrayBuffer: () => {
        throw new Error('arrayBuffer should not be called for oversized files');
      },
    } as unknown as Blob;

    await expect(sha256Blob(oversizedBlob)).rejects.toThrow(
      'This V0 prototype supports files up to 25 MB.',
    );
  });
});
