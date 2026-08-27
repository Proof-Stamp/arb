# ProofStamp via Arbitrum

Create independently verifiable evidence for a file without uploading the file itself.

**Testnet preview:** https://arb-1gv.pages.dev/

> **Status:** Arbitrum Sepolia testnet preview. Experimental software, not a production service.

## How it works

```text
choose file
→ SHA-256 locally in the browser
→ passkey
→ sponsored Arbitrum Sepolia transaction
→ EAS content-hash attestation
→ direct on-chain read-back
→ ProofStamp receipt
```

The original file stays on the user's device. The app records its SHA-256 fingerprint, then verifies the new attestation directly from Ethereum Attestation Service before reporting success.

The **Check** flow is independent of the creation wallet. A verifier chooses the original file and either uploads the saved ProofStamp `.txt` receipt or pastes its Proof ID. The browser hashes the file locally, reads EAS directly, and compares the fingerprints.

## What is public

Only proof data is intended to be public. V0 records the SHA-256 content hash through EAS. The blockchain also exposes normal transaction metadata such as the attester address, transaction hash, block and timestamp.

ProofStamp does not put the original filename or file contents on-chain.

A public hash is not anonymous: someone who already has a candidate file can hash it and test for a match. Repeated attestations from the same address may also be correlated. See [PRIVACY.md](PRIVACY.md).

## Testnet configuration

| Item | Value |
| --- | --- |
| Network | Arbitrum Sepolia |
| Chain ID | `421614` |
| EAS | `0x2521021fc8BF070473E1e1801D3c7B4aB701E1dE` |
| SchemaRegistry | `0x45CB6Fa0870a8Af06796Ac15915619a0f22cd475` |
| EAS schema | `bytes32 contentHash` |
| Schema UID | `0xdf4c41ea0f6263c72aa385580124f41f2898d3613e86c50519fc3cfd7ff13ad4` |
| Revocable | `true` |

V0 reuses the standard EAS **Content Hash** schema. ProofStamp-specific non-revocable semantics can be introduced later without changing the SHA-256 file-fingerprint format.

The SHA-256 digest is stored as the exact 32 bytes of `contentHash`. It is not re-hashed with Keccak and is not encoded as UTF-8 hexadecimal text.

## Stack

- React + TypeScript + Vite
- Cloudflare Pages
- Arbitrum Sepolia
- Ethereum Attestation Service (EAS)
- ZeroDev for passkey wallet access and constrained gas sponsorship
- Viem / Wagmi for EVM reads and transactions

There is no ProofStamp application database or file-upload API in this V0.

## Development

Requires Node.js 22+ and npm.

```bash
npm install
npm run dev
```

Before a PR:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

Public browser configuration is documented in [.env.example](.env.example). Never put secrets in `VITE_*` variables; Vite embeds them in browser JavaScript.

Cloudflare deployment notes are in [docs/cloudflare-pages.md](docs/cloudflare-pages.md).

## Project documents

- [Security](SECURITY.md)
- [Privacy](PRIVACY.md)
- [Disclaimer](DISCLAIMER.md)
- [Contributing](CONTRIBUTING.md)
- [MIT License](LICENSE)
- [ProofStamp name and branding](TRADEMARKS.md)

## Scope

A ProofStamp can provide evidence that a particular file fingerprint was recorded on a public blockchain at a particular time. It does **not** prove authorship, ownership, truth, authenticity, legality, or when the underlying content was originally created. See [DISCLAIMER.md](DISCLAIMER.md).
