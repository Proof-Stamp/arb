import {
  decodeAbiParameters,
  encodeAbiParameters,
  encodePacked,
  keccak256,
  zeroAddress,
  type Hex,
} from 'viem';
import { assertBytes32Hex, type Bytes32Hex } from '../bytes32';
import type { Sha256Hex } from '../hash';

export const PROOFSTAMP_SCHEMA = 'bytes32 contentHash' as const;
export const PROOFSTAMP_SCHEMA_RESOLVER = zeroAddress;
// V0 reuses the standard EAS Content Hash schema. A ProofStamp-specific
// non-revocable schema can be introduced later without changing the file hash format.
export const PROOFSTAMP_SCHEMA_REVOCABLE = true as const;
export const PROOFSTAMP_SCHEMA_UID =
  '0xdf4c41ea0f6263c72aa385580124f41f2898d3613e86c50519fc3cfd7ff13ad4' as const;

const PROOFSTAMP_SCHEMA_PARAMETERS = [{ name: 'contentHash', type: 'bytes32' }] as const;

export function computeProofStampSchemaUid(): Hex {
  return keccak256(
    encodePacked(
      ['string', 'address', 'bool'],
      [PROOFSTAMP_SCHEMA, PROOFSTAMP_SCHEMA_RESOLVER, PROOFSTAMP_SCHEMA_REVOCABLE],
    ),
  );
}

export function encodeProofStampData(contentHash: Sha256Hex): Hex {
  assertBytes32Hex(contentHash, 'SHA-256 content hash');
  return encodeAbiParameters(PROOFSTAMP_SCHEMA_PARAMETERS, [contentHash]);
}

export function decodeProofStampData(data: Hex): Bytes32Hex {
  const [contentHash] = decodeAbiParameters(PROOFSTAMP_SCHEMA_PARAMETERS, data);
  assertBytes32Hex(contentHash, 'Decoded content hash');
  return contentHash;
}
