# ProofStamp via Arbitrum

![ProofStamp via Arbitrum](docs/assets/proofstamp-arbitrum-readme.webp)

A small testnet prototype for creating independently verifiable evidence for a file without uploading the file itself.

**Live testnet app:** https://arbitrum-testnet.proofstamp.org/

> **Status:** prototype complete. This repository is a reference implementation on Arbitrum Sepolia, not a production service.

## What this prototype demonstrates

- Selecting a file immediately starts SHA-256 over the exact file bytes in the browser.
- The original file is not uploaded by the ProofStamp application.
- A passkey can be used instead of a seed phrase.
- The blockchain transaction can be sponsored so the user does not need testnet ETH.
- The SHA-256 fingerprint is recorded as an Ethereum Attestation Service (EAS) `bytes32 contentHash` attestation on Arbitrum Sepolia.
- Creation is reported as successful only after the app reads the attestation back from Arbitrum and validates it.
- Verification does not trust the saved receipt for the file hash. The receipt is used only to recover the Proof ID / EAS UID.
- The verifier hashes the original file locally, reads EAS directly from Arbitrum Sepolia, validates the schema, and compares the on-chain hash with the local hash.
- The deployed footer exposes a build reference linked to the source commit so a test build can be traced back to code.

There is no ProofStamp application database or file-upload API in this prototype.

## Create flow

```text
┌──────────────────┐
│ File on device   │
└────────┬─────────┘
         │ exact bytes
         ▼
┌──────────────────┐
│ Browser SHA-256  │
│ Web Crypto       │
└────────┬─────────┘
         │ 32-byte fingerprint
         ▼
┌──────────────────┐
│ Passkey wallet   │
│ via ZeroDev      │
└────────┬─────────┘
         │ sponsored transaction
         ▼
┌──────────────────┐
│ Arbitrum Sepolia │
│ EAS attestation  │
└────────┬─────────┘
         │ direct read-back + validation
         ▼
┌──────────────────┐
│ ProofStamp       │
│ .txt receipt     │
└──────────────────┘
```

After a successful write, the app extracts the EAS UID from the transaction logs, reads that attestation directly from Arbitrum Sepolia, and checks the UID, schema, recipient, revocability setting, and recorded SHA-256 before showing success.

Downloaded receipts use the filename pattern:

```text
<original-name-without-extension>_proofstamp.txt
```

## Check flow

```text
Original file ──> local SHA-256 ───────────────┐
                                               │
Saved receipt ──> Proof ID / EAS UID only ────┼──> EAS getAttestation
                                               │        │
                                               │        ▼
                                               └──> validate schema
                                                        │
                                                        ▼
                                              compare on-chain hash
                                              with local SHA-256
                                                        │
                                                        ▼
                                                verified / mismatch
```

The saved receipt is a convenience object, not the source of truth for the file hash. Any hash text inside the receipt is ignored during Check. The result is based on the selected file's locally recomputed SHA-256 and the EAS record identified by the Proof ID.

## How it is built

```text
Cloudflare Pages
     │
     │ serves static Vite build
     ▼
Browser: React + TypeScript
     │
     ├── Web Crypto ───────────────> local SHA-256
     ├── local receipt handling ───> .txt only
     ├── ZeroDev passkey wallet ───> sponsored write
     └── Viem public RPC ──────────> Arbitrum Sepolia
                                           │
                                           ▼
                                   Ethereum Attestation
                                   Service contracts

No ProofStamp backend
No ProofStamp database
No file upload service
```

The main implementation pieces are:

- [`src/App.tsx`](src/App.tsx) — create/check UX, receipt handling, local verification.
- [`src/BlockchainFlow.tsx`](src/BlockchainFlow.tsx) — passkey session, sponsored write, transaction receipt parsing, direct post-write validation.
- [`src/wagmi.ts`](src/wagmi.ts) — Arbitrum Sepolia transport and ZeroDev wallet connector.
- [`src/lib/hash.ts`](src/lib/hash.ts) — browser SHA-256 over exact file bytes.
- [`src/lib/eas/schema.ts`](src/lib/eas/schema.ts) — EAS schema constants and ABI encoding/decoding.
- [`src/lib/eas/write.ts`](src/lib/eas/write.ts) — EAS `attest` calldata and explorer URL.
- [`src/lib/eas/client.ts`](src/lib/eas/client.ts) — direct EAS and SchemaRegistry reads.

See [docs/architecture.md](docs/architecture.md) for the component and trust-boundary view.

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
| Max file size in V0 | 100 MB |

V0 reuses the standard EAS **Content Hash** schema. The SHA-256 digest is stored as the exact 32 bytes of `contentHash`. It is not re-hashed with Keccak and is not stored as UTF-8 hexadecimal text.

## Passkeys and current compatibility

The normal flow deliberately leaves WebAuthn algorithm negotiation to the browser and wallet provider.

Observed during prototype testing:

- A compatible passkey authenticator completed the ZeroDev flow successfully.
- Windows Hello on the tested Windows setup created an RS256 credential, after which the ZeroDev/underlying passkey service returned a `500 external_service_error`.
- A diagnostic ES256-only experiment caused Windows Hello to fall back to an external USB security key, so the application does **not** force ES256 in the frontend.

This is a passkey-provider compatibility limitation, not a failure of local hashing or on-chain verification. See [docs/passkeys.md](docs/passkeys.md).

## What is public

V0 intentionally publishes the SHA-256 fingerprint as EAS `contentHash`. Normal blockchain metadata is also public, including the attester address, transaction hash, block, timestamp, and EAS attestation UID.

The application does not intentionally put the original filename or file contents on-chain.

A public hash is not anonymous: someone who already has a candidate file can hash it and test for a match. Repeated attestations from the same address may also be correlated. See [PRIVACY.md](PRIVACY.md).

## Stack

- React + TypeScript + Vite
- Cloudflare Pages
- Arbitrum Sepolia
- Ethereum Attestation Service (EAS)
- ZeroDev for passkey wallet access and constrained gas sponsorship
- Viem / Wagmi for EVM reads and transactions

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

- [Architecture](docs/architecture.md)
- [Passkey compatibility notes](docs/passkeys.md)
- [Cloudflare Pages deployment](docs/cloudflare-pages.md)
- [Security](SECURITY.md)
- [Privacy](PRIVACY.md)
- [Disclaimer](DISCLAIMER.md)
- [Contributing](CONTRIBUTING.md)
- [MIT License](LICENSE)
- [ProofStamp name and branding](TRADEMARKS.md)

## Scope

A ProofStamp can provide evidence that a particular file fingerprint was recorded on a public blockchain at a particular time. It does **not** prove authorship, ownership, truth, authenticity, legality, or when the underlying content was originally created.

This repository is intentionally kept as a testnet reference implementation. Further product work should be driven by a concrete integration, partner, or production requirement rather than by adding complexity to the prototype.

See [DISCLAIMER.md](DISCLAIMER.md).
