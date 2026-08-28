# Cloudflare Pages deployment

ProofStamp via Arbitrum is a static Vite application deployed on Cloudflare Pages.

## Current public testnet origin

```text
https://arbitrum-testnet.proofstamp.org/
```

The custom domain is the stable testnet entry point. Temporary `*.pages.dev` deployments are useful for branch previews but should not be treated as interchangeable passkey origins.

## Build

- Framework preset: React (Vite)
- Build command: `npm run build`
- Output directory: `dist`
- Node.js: 22 (`.nvmrc`)
- Production branch after merge: `main`

`public/_redirects` provides the SPA fallback. `public/_headers` sets baseline security headers, prevents stale HTML caching, disables caching for the local ProofStamp seal, and allows immutable caching for hashed Vite assets.

## Public environment variables

Never put secrets in `VITE_*` values. They are embedded in browser JavaScript.

- `VITE_ZERODEV_PROJECT_ID` — required ZeroDev browser project ID
- `VITE_ZERODEV_RP_ID` — optional explicit WebAuthn relying-party ID
- `VITE_ARBITRUM_SEPOLIA_RPC_URL` — optional public RPC override

The ZeroDev project ID is not a secret. Sponsorship controls are the security boundary.

## ZeroDev

For the deployed origin:

1. allow the exact web origin in the ZeroDev project ACL,
2. enable Arbitrum Sepolia,
3. restrict sponsorship to the EAS contract/function used by ProofStamp,
4. apply request/rate and spend limits.

Do not use an unrestricted sponsor-all policy for a public deployment.

## Passkey domain

WebAuthn credentials are scoped to the relying-party ID.

For the stable custom domain, choose and keep the RP ID deliberately. Branch previews on `*.pages.dev` should be treated as separate test environments rather than as a place to create durable user passkeys.

See [passkeys.md](passkeys.md) for the compatibility observations from prototype testing.

## Current testnet flow

```text
Create:
file
→ SHA-256 locally
→ passkey
→ sponsored transaction
→ EAS Content Hash attestation
→ direct EAS read-back and validation
→ ProofStamp receipt

Check:
original file + Proof ID
→ SHA-256 file locally
→ direct EAS getAttestation
→ schema validation
→ compare on-chain contentHash with local SHA-256
```

V0 reuses the existing revocable EAS `bytes32 contentHash` schema with UID `0xdf4c41ea0f6263c72aa385580124f41f2898d3613e86c50519fc3cfd7ff13ad4`. No custom schema registration is required for V0.

The app is intentionally static. There is no ProofStamp application database or file-upload API in this prototype.
