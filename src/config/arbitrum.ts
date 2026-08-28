import { arbitrumSepolia } from 'viem/chains';

export const ARBITRUM_SEPOLIA_CHAIN = arbitrumSepolia;
export const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

export const EAS_CONTRACT_ADDRESS = '0x2521021fc8BF070473E1e1801D3c7B4aB701E1dE' as const;
export const EAS_SCHEMA_REGISTRY_ADDRESS = '0x45CB6Fa0870a8Af06796Ac15915619a0f22cd475' as const;

// Deployment values are pinned to the official EAS contracts repository commit
// reviewed during bootstrap. If these values ever change, update them deliberately
// and document why.
export const EAS_DEPLOYMENT_SOURCE_COMMIT =
  'e6e970286ff18bbdfc5d8eff2742c5ece46040e4' as const;
