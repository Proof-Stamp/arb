import { zeroDevWallet } from '@zerodev/wallet-react';
import { createConfig, http } from 'wagmi';
import { ARBITRUM_SEPOLIA_CHAIN } from './config/arbitrum';
import { createEs256PasskeyStamper } from './es256PasskeyStamper';

export const ZERO_DEV_PROJECT_ID = import.meta.env.VITE_ZERODEV_PROJECT_ID?.trim() ?? '';
export const ZERO_DEV_RP_ID = import.meta.env.VITE_ZERODEV_RP_ID?.trim() ?? '';
export const ARBITRUM_SEPOLIA_RPC_URL =
  import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL?.trim() ||
  'https://sepolia-rollup.arbitrum.io/rpc';

export const IS_ZERODEV_CONFIGURED = ZERO_DEV_PROJECT_ID.length > 0;

const effectiveRpId =
  ZERO_DEV_RP_ID || (typeof window !== 'undefined' ? window.location.hostname : '');

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
        ...(effectiveRpId
          ? {
              rpId: effectiveRpId,
              // Windows Hello can prefer RS256 when both RS256 and ES256 are
              // advertised. The current ZeroDev/Turnkey registration path
              // rejects the resulting RSA credential after Windows has already
              // created it. Restrict registration to ES256/P-256 while keeping
              // Turnkey's normal assertion/signing behavior.
              passkeyStamper: createEs256PasskeyStamper({ rpId: effectiveRpId }),
            }
          : {}),
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
