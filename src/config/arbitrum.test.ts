import { describe, expect, it } from 'vitest';
import {
  ARBITRUM_SEPOLIA_CHAIN,
  ARBITRUM_SEPOLIA_CHAIN_ID,
  EAS_CONTRACT_ADDRESS,
  EAS_SCHEMA_REGISTRY_ADDRESS,
} from './arbitrum';

describe('Arbitrum Sepolia configuration', () => {
  it('pins the expected chain id', () => {
    expect(ARBITRUM_SEPOLIA_CHAIN.id).toBe(421614);
    expect(ARBITRUM_SEPOLIA_CHAIN_ID).toBe(421614);
  });

  it('pins the official EAS deployment addresses', () => {
    expect(EAS_CONTRACT_ADDRESS).toBe('0x2521021fc8BF070473E1e1801D3c7B4aB701E1dE');
    expect(EAS_SCHEMA_REGISTRY_ADDRESS).toBe('0x45CB6Fa0870a8Af06796Ac15915619a0f22cd475');
  });
});
