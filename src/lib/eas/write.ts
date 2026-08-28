import { encodeFunctionData, zeroAddress, type Hex } from 'viem';
import { EAS_CONTRACT_ADDRESS } from '../../config/arbitrum';
import type { Sha256Hex } from '../hash';
import {
  encodeProofStampData,
  PROOFSTAMP_SCHEMA_REVOCABLE,
  PROOFSTAMP_SCHEMA_UID,
} from './schema';

const ZERO_UID = `0x${'00'.repeat(32)}` as const;

export const EAS_WRITE_ABI = [
  {
    type: 'function',
    name: 'attest',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'request',
        type: 'tuple',
        components: [
          { name: 'schema', type: 'bytes32' },
          {
            name: 'data',
            type: 'tuple',
            components: [
              { name: 'recipient', type: 'address' },
              { name: 'expirationTime', type: 'uint64' },
              { name: 'revocable', type: 'bool' },
              { name: 'refUID', type: 'bytes32' },
              { name: 'data', type: 'bytes' },
              { name: 'value', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
] as const;

export const EAS_ATTESTED_EVENT_ABI = [
  {
    anonymous: false,
    type: 'event',
    name: 'Attested',
    inputs: [
      { indexed: true, name: 'recipient', type: 'address' },
      { indexed: true, name: 'attester', type: 'address' },
      { indexed: false, name: 'uid', type: 'bytes32' },
      { indexed: true, name: 'schemaUID', type: 'bytes32' },
    ],
  },
] as const;

export function createProofStampAttestCalldata(contentHash: Sha256Hex): Hex {
  return encodeFunctionData({
    abi: EAS_WRITE_ABI,
    functionName: 'attest',
    args: [
      {
        schema: PROOFSTAMP_SCHEMA_UID,
        data: {
          recipient: zeroAddress,
          expirationTime: 0n,
          revocable: PROOFSTAMP_SCHEMA_REVOCABLE,
          refUID: ZERO_UID,
          data: encodeProofStampData(contentHash),
          value: 0n,
        },
      },
    ],
  });
}

export function getArbiscanTransactionUrl(transactionHash: Hex): string {
  return `https://sepolia.arbiscan.io/tx/${transactionHash}`;
}

export { EAS_CONTRACT_ADDRESS };
