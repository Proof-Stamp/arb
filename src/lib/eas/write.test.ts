import { describe, expect, it } from 'vitest';
import { decodeFunctionData, zeroAddress } from 'viem';
import { EAS_WRITE_ABI, createProofStampAttestCalldata } from './write';
import { PROOFSTAMP_SCHEMA_UID } from './schema';

const ABC_SHA256 = '0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' as const;

describe('ProofStamp EAS write encoding', () => {
  it('encodes the exact SHA-256 bytes into the EAS attest request', () => {
    const decoded = decodeFunctionData({
      abi: EAS_WRITE_ABI,
      data: createProofStampAttestCalldata(ABC_SHA256),
    });

    expect(decoded.functionName).toBe('attest');

    const [request] = decoded.args;
    expect(request.schema).toBe(PROOFSTAMP_SCHEMA_UID);
    expect(request.data.recipient).toBe(zeroAddress);
    expect(request.data.expirationTime).toBe(0n);
    expect(request.data.revocable).toBe(false);
    expect(request.data.value).toBe(0n);
    expect(request.data.data).toBe(ABC_SHA256);
  });
});
