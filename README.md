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

## Stack

- React + TypeScript + Vite
- Cloudflare Pages
- Arbitrum Sepolia
- Ethereum Attestation Service (EAS)
- Viem for typed EVM reads and ABI encoding
- ZeroDev planned for passkey-based smart accounts and sponsored transactions

## Arbitrum Sepolia + EAS configuration

The V0 chain configuration is deliberately pinned in source code.

| Item | Value |
| --- | --- |
| Chain | Arbitrum Sepolia |
| Chain ID | `421614` |
| EAS | `0x2521021fc8BF070473E1e1801D3c7B4aB701E1dE` |
| SchemaRegistry | `0x45CB6Fa0870a8Af06796Ac15915619a0f22cd475` |

The deployment values were verified against the official `ethereum-attestation-service/eas-contracts` repository at commit `e6e970286ff18bbdfc5d8eff2742c5ece46040e4`.

The ProofStamp V1 EAS schema is intentionally minimal:

```text
bytes32 contentHash
```

Schema properties:

- resolver: zero address
- revocable: `false`
- expected schema UID: `0x5c5b8b295ff43c8e442be11d569e94a4cd5476f5e23df0f71bdd408df6b9649c`

The schema UID is derived deterministically using the same packed encoding and Keccak-256 rule as the EAS SchemaRegistry contract. The expected UID is pinned in source and the test suite independently recomputes it from the schema definition, resolver, and revocability flag.

The schema has not been registered by this repository yet. Registration is a separate, explicit maintainer action. Once registered with the values above, the returned UID must match the pinned value before we proceed.

### One-time schema registration

The repository contains a deliberately narrow registration script. It first recomputes the expected UID, checks the connected chain, and reads the SchemaRegistry. If the schema already exists and matches, it exits without sending a transaction.

Read-only check:

```bash
npm run schema:check
```

Optional RPC override:

```bash
ARBITRUM_SEPOLIA_RPC_URL=https://your-rpc.example npm run schema:check
```

To register the schema, use a dedicated funded **testnet maintainer wallet** and provide its private key only as a process environment variable:

```bash
PROOFSTAMP_MAINTAINER_PRIVATE_KEY=0x... npm run schema:register
```

Never put this private key in a `VITE_*` variable, `.env.example`, GitHub issue, PR, CI log, or committed file. The script verifies the resulting on-chain schema after the transaction and prints the Arbiscan transaction link and block number.

## Hash encoding rule

The browser-generated SHA-256 digest is already exactly 32 bytes. ProofStamp stores those exact bytes as `contentHash`.

It must **not** be hashed again, converted with Keccak-256, or encoded as the UTF-8 text of the hexadecimal string.

The unit tests enforce this rule using the standard SHA-256 value for `abc` and confirm that EAS encoding preserves the exact 32-byte digest.

## Current implementation

The bootstrap application currently includes:

- local SHA-256 hashing with the browser Web Crypto API
- known SHA-256 test vectors
- a temporary 100 MB V0 browser-hashing limit
- pinned Arbitrum Sepolia and official EAS contract configuration
- pinned, deterministic ProofStamp V1 schema identity
- exact `bytes32 contentHash` encoding and decoding tests
- direct Viem helpers for `EAS.getAttestation(uid)` and `SchemaRegistry.getSchema(uid)`
- guarded one-time EAS schema registration tooling for maintainers

Blockchain ProofStamp writes, passkeys, gas sponsorship, and receipt routes are not enabled yet.

## Independent verification architecture

The verification path is designed to read EAS directly rather than depend on an indexer or ProofStamp backend:

```text
file bytes
   ↓
local SHA-256
   ↓
contentHash
   ↓
Arbitrum Sepolia RPC
   ↓
EAS.getAttestation(uid)
   ↓
decode bytes32 contentHash
   ↓
compare
```

EAS explorers and blockchain explorers can be linked for convenience, but they are not intended to be the cryptographic verification dependency.

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

`VITE_ARBITRUM_SEPOLIA_RPC_URL` is an optional public RPC override. Do not put secrets in `VITE_*` variables. Vite embeds those values in browser JavaScript.

## Planned V0 milestones

1. Local SHA-256 hashing
2. Arbitrum Sepolia and EAS configuration
3. Register one immutable ProofStamp EAS schema
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
