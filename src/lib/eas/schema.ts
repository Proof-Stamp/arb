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
export const PROOFSTAMP_SCHEMA_REVOCABLE = false as const;

const PROOFSTAMP_SCHEMA_PARAMETERS = [{ name: 'contentHash', type: 'bytes32' }] as const;

export const PROOFSTAMP_SCHEMA_UID = keccak256(
  encodePacked(
    ['string', 'address', 'bool'],
    [PROOFSTAMP_SCHEMA, PROOFSTAMP_SCHEMA_RESOLVER, PROOFSTAMP_SCHEMA_REVOCABLE],
  ),
);

export function encodeProofStampData(contentHash: Sha256Hex): Hex {
  assertBytes32Hex(contentHash, 'SHA-256 content hash');
  return encodeAbiParameters(PROOFSTAMP_SCHEMA_PARAMETERS, [contentHash]);
}

export function decodeProofStampData(data: Hex): Bytes32Hex {
  const [contentHash] = decodeAbiParameters(PROOFSTAMP_SCHEMA_PARAMETERS, data);
  assertBytes32Hex(contentHash, 'Decoded content hash');
  return contentHash;
}
