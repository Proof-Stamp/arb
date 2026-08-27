import { describe, expect, it } from 'vitest';
import { sha256ArrayBuffer } from './hash';

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
