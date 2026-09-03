import { describe, expect, it } from 'vitest';
import type { Hex } from 'viem';
import type { Sha256Hex } from './hash';
import { extractProofId, receiptToText } from './receipt';

const proofId = `0x${'1'.repeat(64)}` as `0x${string}`;
const transactionHash = `0x${'2'.repeat(64)}` as Hex;
const fileHash = `0x${'3'.repeat(64)}` as Sha256Hex;

const proof = {
  uid: proofId,
  transactionHash,
  blockNumber: 123456n,
  recordedAt: '2026-09-03T13:00:00.000Z',
};

describe('ProofStamp text receipts', () => {
  it('uses the approved ProofStamp͘ plain-text signature', () => {
    const receipt = receiptToText(proof, fileHash);

    expect(receipt.split('\n')[0]).toBe('ProofStamp͘ via Arbitrum');
    expect(receipt).toContain(`Proof ID / EAS UID: ${proofId}`);
    expect(receipt).toContain(`SHA-256 / file fingerprint: ${fileHash}`);
  });

  it('extracts the Proof ID from both new and legacy receipt headers', () => {
    const currentReceipt = receiptToText(proof, fileHash);
    const legacyReceipt = currentReceipt.replace(
      'ProofStamp͘ via Arbitrum',
      'ProofStamp via Arbitrum',
    );

    expect(extractProofId(currentReceipt)).toBe(proofId);
    expect(extractProofId(legacyReceipt)).toBe(proofId);
  });

  it('still accepts a directly pasted Proof ID', () => {
    expect(extractProofId(proofId)).toBe(proofId);
  });
});
