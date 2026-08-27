# ProofStamp on Arbitrum

ProofStamp is an open-source experiment for creating independently verifiable proofs of digital files using local SHA-256 hashing and a public blockchain record.

This repository contains the Arbitrum implementation. Development starts on **Arbitrum Sepolia**.

> **Status:** early development. This repository is not ready for production use.

## What ProofStamp does

The intended flow is simple:

1. A user selects a file.
2. The browser calculates SHA-256 over the exact file bytes.
3. Only the resulting proof data is anchored publicly.
4. A verifier can hash their copy of the file locally and compare it with the public record.

The file itself is not uploaded as part of the stamping or verification flow.

A ProofStamp is evidence that a specific hash was recorded at a particular blockchain state. It does **not** prove that the underlying content is truthful or authentic.

## Principles

- **Private file:** file bytes stay on the user's device.
- **Deterministic hash:** SHA-256 is calculated locally over the exact bytes.
- **Minimal public data:** avoid putting filenames, personal data, or unnecessary metadata on-chain.
- **Independent verification:** verification should not depend on ProofStamp remaining online.
- **No crypto UX requirement:** normal users should not need seed phrases, gas, or token balances.
- **Standard primitives:** prefer established protocols over custom cryptography or unnecessary smart contracts.

## Planned stack

- React + TypeScript + Vite
- Cloudflare Pages
- Arbitrum Sepolia
- Ethereum Attestation Service (EAS)
- ZeroDev for passkey-based smart accounts and sponsored transactions

The planned EAS V1 payload is deliberately small:

```text
bytes32 contentHash
```

The EAS attestation UID will be the canonical ProofStamp identifier. Transaction and block information will remain available for direct blockchain inspection.

## Current implementation

The bootstrap application currently implements the first trust boundary: **local SHA-256 hashing**.

- Hashing uses the browser Web Crypto API.
- The file is not uploaded.
- Known SHA-256 test vectors are included.
- The V0 browser-hashing limit is 100 MB while memory behavior is kept intentionally simple.
- Blockchain anchoring is not enabled yet.

## Development

Requirements:

- Node.js 22 or newer
- npm

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

## Cloudflare Pages

The app is static-first and designed to deploy directly from this repository.

- Build command: `npm run build`
- Build output: `dist`
- SPA fallback: `public/_redirects`
- Baseline response headers: `public/_headers`

A Content Security Policy will be added once the exact ZeroDev and Arbitrum RPC connections are known. It should be restrictive enough to be useful rather than added prematurely and then weakened to make the app work.

Do not put secrets in `VITE_*` variables. Vite embeds those values in browser JavaScript.

## Planned V0 milestones

1. Local SHA-256 hashing
2. Arbitrum Sepolia and EAS configuration
3. One immutable ProofStamp EAS schema
4. ZeroDev passkey account and constrained gas sponsorship
5. Create an EAS attestation containing the file hash
6. Receipt with EAS UID, transaction, block, network, and SHA-256
7. Independent `/verify` flow using a direct EAS contract read
8. Public-repository and security audit before launch

## Security

See [SECURITY.md](SECURITY.md).

The public hash and attester address have privacy implications. A party that already has a candidate file can hash it and test whether it matches a public ProofStamp, and repeated attestations from one address can be correlated. Those properties must be described accurately in the product UX.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
