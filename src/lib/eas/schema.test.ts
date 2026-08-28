import { describe, expect, it } from 'vitest';
import { zeroAddress } from 'viem';
import {
  PROOFSTAMP_ATTESTATION_REVOCABLE,
  PROOFSTAMP_SCHEMA,
  PROOFSTAMP_SCHEMA_RESOLVER,
  PROOFSTAMP_SCHEMA_REVOCABLE,
  PROOFSTAMP_SCHEMA_UID,
  computeProofStampSchemaUid,
  decodeProofStampData,
  encodeProofStampData,
} from './schema';

const ABC_SHA256 = '0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' as const;

describe('ProofStamp EAS schema', () => {
  it(
    'pins the standard revocable EAS Content Hash schema and non-revocable ProofStamp policy',
    () => {
      expect(PROOFSTAMP_SCHEMA).toBe('bytes32 contentHash');
      expect(PROOFSTAMP_SCHEMA_RESOLVER).toBe(zeroAddress);
      expect(PROOFSTAMP_SCHEMA_REVOCABLE).toBe(true);
      expect(PROOFSTAMP_ATTESTATION_REVOCABLE).toBe(false);
      expect(PROOFSTAMP_SCHEMA_UID).toBe(
        '0xdf4c41ea0f6263c72aa385580124f41f2898d3613e86c50519fc3cfd7ff13ad4',
      );
      expect(computeProofStampSchemaUid()).toBe(PROOFSTAMP_SCHEMA_UID);
    },
  );

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
