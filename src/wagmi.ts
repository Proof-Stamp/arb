import { zeroDevWallet } from '@zerodev/wallet-react';
import { createConfig, http } from 'wagmi';
import { ARBITRUM_SEPOLIA_CHAIN } from './config/arbitrum';

export const ZERO_DEV_PROJECT_ID = import.meta.env.VITE_ZERODEV_PROJECT_ID?.trim() ?? '';
export const ZERO_DEV_RP_ID = import.meta.env.VITE_ZERODEV_RP_ID?.trim() ?? '';
export const ARBITRUM_SEPOLIA_RPC_URL =
  import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL?.trim() ||
  'https://sepolia-rollup.arbitrum.io/rpc';

export const IS_ZERODEV_CONFIGURED = ZERO_DEV_PROJECT_ID.length > 0;

const connectors = IS_ZERODEV_CONFIGURED
  ? [
      zeroDevWallet({
        projectId: ZERO_DEV_PROJECT_ID,
        aaHost: 'https://rpc.zerodev.app',
        chains: [ARBITRUM_SEPOLIA_CHAIN],
        mode: '7702',
        // Do not initialize the remote wallet during page startup. A temporary
        // ACL/project configuration problem must not blank the entire app.
        // ZeroDev initializes lazily when the user starts passkey auth.
        autoInitialize: false,
        ...(ZERO_DEV_RP_ID ? { rpId: ZERO_DEV_RP_ID } : {}),
      }),
    ]
  : [];

export const wagmiConfig = createConfig({
  chains: [ARBITRUM_SEPOLIA_CHAIN],
  connectors,
  transports: {
    [ARBITRUM_SEPOLIA_CHAIN.id]: http(ARBITRUM_SEPOLIA_RPC_URL),
  },
});
