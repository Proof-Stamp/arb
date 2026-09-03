import type { Hex } from 'viem';
import { ARBITRUM_SEPOLIA_CHAIN_ID } from '../config/arbitrum';
import { isBytes32Hex } from './bytes32';
import { PROOFSTAMP_SCHEMA_UID } from './eas/schema';
import { getArbiscanTransactionUrl } from './eas/write';
import type { Sha256Hex } from './hash';

export interface ProofStampReceiptProof {
  uid: `0x${string}`;
  transactionHash: Hex;
  blockNumber: bigint;
  recordedAt: string;
}

export function extractProofId(value: string): `0x${string}` | null {
  const trimmed = value.trim();
  if (isBytes32Hex(trimmed)) return trimmed;

  const labelled = trimmed.match(
    /(?:Proof ID\s*\/\s*EAS UID|EAS UID|Proof ID)\s*:\s*(0x[0-9a-fA-F]{64})/i,
  )?.[1];

  return labelled && isBytes32Hex(labelled) ? labelled : null;
}

export function receiptToText(proof: ProofStampReceiptProof, hash: Sha256Hex): string {
  return [
    'ProofStamp͘ via Arbitrum',
    'Testnet receipt',
    '',
    `Proof ID / EAS UID: ${proof.uid}`,
    `SHA-256 / file fingerprint: ${hash}`,
    `Recorded at: ${proof.recordedAt}`,
    'Network: Arbitrum Sepolia',
    `Chain ID: ${ARBITRUM_SEPOLIA_CHAIN_ID}`,
    `Block: ${proof.blockNumber.toString()}`,
    `Transaction: ${proof.transactionHash}`,
    `EAS schema: ${PROOFSTAMP_SCHEMA_UID}`,
    `Explorer: ${getArbiscanTransactionUrl(proof.transactionHash)}`,
    '',
    'Check this ProofStamp:',
    'Open the ProofStamp via Arbitrum app, choose the exact original file, open Check, then upload this receipt or paste it.',
    '',
    'The file was not uploaded. Only its SHA-256 fingerprint was recorded publicly.',
    'A ProofStamp can show that specific bytes were recorded at a time. It does not prove that the content itself is true or authentic.',
  ].join('\n');
}
