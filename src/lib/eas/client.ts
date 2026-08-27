import { createPublicClient, http } from 'viem';
import {
  ARBITRUM_SEPOLIA_CHAIN,
  EAS_CONTRACT_ADDRESS,
  EAS_SCHEMA_REGISTRY_ADDRESS,
} from '../../config/arbitrum';
import { assertBytes32Hex, type Bytes32Hex } from '../bytes32';
import { EAS_READ_ABI, SCHEMA_REGISTRY_READ_ABI } from './abi';
import { PROOFSTAMP_SCHEMA_UID } from './schema';

export function createArbitrumSepoliaPublicClient(rpcUrl?: string) {
  const normalizedRpcUrl = rpcUrl?.trim();

  return createPublicClient({
    chain: ARBITRUM_SEPOLIA_CHAIN,
    transport: normalizedRpcUrl ? http(normalizedRpcUrl) : http(),
  });
}

export async function readEasAttestation(uid: Bytes32Hex, rpcUrl?: string) {
  assertBytes32Hex(uid, 'EAS attestation UID');
  const client = createArbitrumSepoliaPublicClient(rpcUrl);

  return client.readContract({
    address: EAS_CONTRACT_ADDRESS,
    abi: EAS_READ_ABI,
    functionName: 'getAttestation',
    args: [uid],
  });
}

export async function readProofStampSchema(rpcUrl?: string) {
  const client = createArbitrumSepoliaPublicClient(rpcUrl);

  return client.readContract({
    address: EAS_SCHEMA_REGISTRY_ADDRESS,
    abi: SCHEMA_REGISTRY_READ_ABI,
    functionName: 'getSchema',
    args: [PROOFSTAMP_SCHEMA_UID],
  });
}
