# Cloudflare Pages deployment

This app is designed to be deployed as a static Vite site on Cloudflare Pages.

## First preview

Connect the GitHub repository `Proof-Stamp/arb` to Cloudflare Pages and use:

- Production branch: `main`
- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`

The repository includes `.nvmrc` with Node.js 22, `public/_redirects` for SPA fallback, and `public/_headers` for baseline response headers.

Keep production on `main`. Cloudflare Pages can create preview deployments for non-production branches such as `feat/bootstrap-arbitrum-v0`, which lets the testnet app be reviewed in the browser without merging it.

## Environment variables

Do not add secrets to variables prefixed with `VITE_`. Vite embeds them into browser JavaScript.

Current optional public configuration:

- `VITE_ARBITRUM_SEPOLIA_RPC_URL`: optional public RPC override
- `VITE_ZERODEV_PROJECT_ID`: planned public ZeroDev project identifier

Any future secret needed for sponsorship policy enforcement must run server-side, for example in a narrowly scoped Cloudflare Function or Worker, and must never be exposed as a `VITE_*` variable.

## Custom domain and passkeys

Do not treat the temporary `*.pages.dev` preview hostname as the long-term passkey relying-party domain. Before real production users create passkeys, attach the intended ProofStamp custom domain and configure the passkey RP ID deliberately.

## Current preview scope

The current browser preview supports local file selection and SHA-256 preparation only. It does not yet submit an EAS attestation or write to Arbitrum. The UI states this after the local step completes.
