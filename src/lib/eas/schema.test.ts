import { describe, expect, it } from 'vitest';
import { zeroAddress } from 'viem';
import {
  PROOFSTAMP_SCHEMA,
  PROOFSTAMP_SCHEMA_RESOLVER,
  PROOFSTAMP_SCHEMA_REVOCABLE,
  PROOFSTAMP_SCHEMA_UID,
  decodeProofStampData,
  encodeProofStampData,
} from './schema';

const ABC_SHA256 = '0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' as const;

describe('ProofStamp EAS schema', () => {
  it('uses the minimal immutable V1 schema', () => {
    expect(PROOFSTAMP_SCHEMA).toBe('bytes32 contentHash');
    expect(PROOFSTAMP_SCHEMA_RESOLVER).toBe(zeroAddress);
    expect(PROOFSTAMP_SCHEMA_REVOCABLE).toBe(false);
    expect(PROOFSTAMP_SCHEMA_UID).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('encodes the exact SHA-256 bytes as a single bytes32 value', () => {
    expect(encodeProofStampData(ABC_SHA256)).toBe(ABC_SHA256);
  });

  it('round-trips the content hash without re-hashing it', () => {
    expect(decodeProofStampData(encodeProofStampData(ABC_SHA256))).toBe(ABC_SHA256);
  });

  it('rejects values that are not exactly 32 bytes', () => {
    expect(() => encodeProofStampData('0x1234')).toThrow(/exactly 32 bytes/);
  });
});
