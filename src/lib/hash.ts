import type { Bytes32Hex } from './bytes32';

export type Sha256Hex = Bytes32Hex;

export const MAX_V0_FILE_BYTES = 25 * 1024 * 1024;

function bytesToHex(bytes: Uint8Array): Sha256Hex {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `0x${hex}`;
}

export async function sha256ArrayBuffer(data: ArrayBuffer): Promise<Sha256Hex> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(digest));
}

export async function sha256Blob(blob: Blob | null): Promise<Sha256Hex> {
  if (!blob) {
    throw new Error('No file is selected.');
  }

  if (blob.size > MAX_V0_FILE_BYTES) {
    throw new Error('This V0 prototype supports files up to 25 MB.');
  }

  return sha256ArrayBuffer(await blob.arrayBuffer());
}
