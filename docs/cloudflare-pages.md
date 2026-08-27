# Cloudflare Pages deployment

This app is designed to be deployed as a static Vite site on Cloudflare Pages.

## Testnet preview

For the current private test branch use:

- Production branch: `feat/bootstrap-arbitrum-v0`
- Framework preset: React (Vite)
- Build command: `npm run build`
- Build output directory: `dist`

Before launch, switch production back to `main` after the reviewed PR is merged.

The repository includes `.nvmrc` with Node.js 22, `public/_redirects` for SPA fallback, and `public/_headers` for baseline response headers.

## Environment variables

Do not add secrets to variables prefixed with `VITE_`. Vite embeds them into browser JavaScript.

Public client configuration:

- `VITE_ARBITRUM_SEPOLIA_RPC_URL`: optional public RPC override
- `VITE_ZERODEV_PROJECT_ID`: ZeroDev project identifier used by the browser wallet connector
- `VITE_ZERODEV_RP_ID`: optional explicit WebAuthn relying-party ID

The ZeroDev project ID is client-visible configuration, not a secret. Sponsorship safety must come from ZeroDev gas policies, not from trying to hide this value.

## ZeroDev preview setup

In the ZeroDev dashboard:

1. Create a project with Arbitrum Sepolia enabled.
2. Add the exact Cloudflare preview origin to the project's ACL allowlist.
3. Configure a gas sponsorship policy for Arbitrum Sepolia.
4. Add `VITE_ZERODEV_PROJECT_ID` to the Cloudflare Pages project and redeploy.

For early testnet work, a broad policy may be used briefly. Before the repository or app is public, restrict sponsorship to the expected ProofStamp contracts and apply rate / spend limits.

## Custom domain and passkeys

Passkeys are scoped to a WebAuthn RP ID. A passkey created on a temporary `*.pages.dev` hostname should be treated as disposable testnet state.

Before real production users create passkeys:

1. attach the intended ProofStamp custom domain,
2. set `VITE_ZERODEV_RP_ID` deliberately if subdomain sharing is required,
3. add the final origin to the ZeroDev ACL,
4. do not change the RP ID afterwards unless users are expected to register new passkeys.

## Current preview scope

The browser flow is wired for:

```text
choose file
→ SHA-256 locally
→ passkey
→ sponsored ZeroDev transaction
→ EAS attestation
→ Proof ID + Arbitrum transaction receipt
```

The EAS write is intentionally blocked until the canonical ProofStamp schema is present on Arbitrum Sepolia. The schema remains `bytes32 contentHash`, zero resolver, non-revocable.
