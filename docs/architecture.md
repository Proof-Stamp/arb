# Architecture

This document describes the current ProofStamp via Arbitrum Sepolia prototype as implemented in this repository.

The design goal is narrow: hash a file locally, record only its fingerprint on a public chain, and let another person verify the original file without trusting a ProofStamp server.

## System view

```text
                         ┌──────────────────────────┐
                         │     Cloudflare Pages     │
                         │  static Vite application │
                         └────────────┬─────────────┘
                                      │ serves JS/CSS/HTML
                                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                         User browser                             │
│                                                                  │
│  React UI                                                        │
│   ├── Web Crypto SHA-256                                         │
│   ├── local .txt receipt read/write                              │
│   ├── ZeroDev passkey wallet                                     │
│   └── Viem/Wagmi public RPC client                               │
└───────────────┬──────────────────────────────┬───────────────────┘
                │                              │
                │ passkey + sponsored write    │ direct RPC read
                ▼                              ▼
       ┌─────────────────┐            ┌────────────────────┐
       │     ZeroDev     │            │ Arbitrum Sepolia   │
       │ wallet/sponsor  │───────────>│                    │
       └─────────────────┘ transaction│  EAS               │
                                      │  SchemaRegistry    │
                                      └────────────────────┘

No ProofStamp application backend, database, or file-upload service is required.
```

## Component map

| Component | Responsibility |
| --- | --- |
| `src/App.tsx` | Main create/check UX, local receipt handling, local file hashing during verification, result presentation |
| `src/BlockchainFlow.tsx` | Passkey registration/login, sponsored EAS transaction, transaction receipt parsing, direct post-write attestation validation |
| `src/WalletProviders.tsx` | Wagmi and TanStack Query providers for the wallet flow |
| `src/wagmi.ts` | ZeroDev connector and Arbitrum Sepolia RPC transport |
| `src/lib/hash.ts` | SHA-256 over exact file bytes using Web Crypto |
| `src/lib/eas/schema.ts` | EAS schema UID, encoding, decoding, and schema semantics |
| `src/lib/eas/write.ts` | EAS `attest` calldata |
| `src/lib/eas/client.ts` | Direct EAS `getAttestation` and SchemaRegistry `getSchema` reads |
| `src/config/arbitrum.ts` | Chain ID and pinned EAS deployment addresses |
| `public/_headers` | Browser/security/cache headers for Cloudflare Pages |
| `public/_redirects` | SPA fallback |

## Create sequence

```text
User
 │
 │ choose file
 ▼
Browser
 │
 │ SHA-256 exact bytes with Web Crypto
 ▼
32-byte fingerprint
 │
 │ create/use passkey
 ▼
ZeroDev wallet
 │
 │ sponsored transaction to EAS.attest(...)
 ▼
Arbitrum Sepolia / EAS
 │
 │ transaction receipt + Attested event
 ▼
Browser
 │
 │ extract UID
 │ getAttestation(UID)
 │ validate schema + recipient + non-revocable + contentHash
 ▼
ProofStamp recorded
 │
 ├── show transaction link
 ├── copy receipt
 └── download <name>_proofstamp.txt
```

The application does not treat a transaction hash alone as success. It waits for the receipt, extracts the EAS UID, reads the attestation back, and verifies that the individual attestation is non-revocable and that the recorded value matches the locally prepared SHA-256.

## Verification sequence

```text
Original file                     ProofStamp receipt
     │                                  │
     │ local SHA-256                    │ extract Proof ID / EAS UID
     ▼                                  ▼
local fingerprint                 attestation UID
     │                                  │
     └──────────────┬───────────────────┘
                    ▼
           EAS getAttestation(UID)
                    │
                    ├── UID exists
                    ├── schema is ProofStamp Content Hash schema
                    ├── recipient is zero address
                    ├── record is not revoked
                    └── decode bytes32 contentHash
                    │
                    ▼
           compare with local SHA-256
                    │
             ┌──────┴──────┐
             ▼             ▼
          verified       mismatch
```

The receipt is intentionally not authoritative for the file hash. It is only a portable way to carry the Proof ID. Verification recomputes the original file fingerprint and reads the public attestation directly.

## On-chain representation

The prototype uses the EAS schema:

```text
bytes32 contentHash
```

Schema UID:

```text
0xdf4c41ea0f6263c72aa385580124f41f2898d3613e86c50519fc3cfd7ff13ad4
```

The SHA-256 digest is stored as its exact 32 bytes. It is not Keccak-hashed again and is not stored as an ASCII/UTF-8 hex string.

The reused EAS Content Hash schema is registered as revocable, but ProofStamp creation sets each individual attestation to `revocable: false`. The post-write read-back verifies that policy before showing success. The Check flow also treats any record with a nonzero revocation time as invalid.

## Trust boundaries

### ProofStamp application

Trusted to deliver the frontend code the user is running. It is not trusted to store or later reproduce the user's file because the current application has no file-upload API or application database.

### Browser

Calculates SHA-256 locally and handles local receipt files. A compromised browser or device can compromise the user's local result.

### ZeroDev and passkey infrastructure

Used for passkey wallet access and sponsored transaction submission. A failure here can prevent creation. It is not required for the independent Check path once a Proof ID exists.

### Arbitrum Sepolia RPC

Used to submit/read public blockchain data. The Check flow reads EAS through an RPC endpoint rather than trusting a ProofStamp database or an explorer UI.

### EAS contracts

Hold the attestation record that the verifier checks. Contract addresses and the schema UID are pinned in source.

## Data boundaries

| Data | Location |
| --- | --- |
| Original file bytes | User device |
| Original filename | Local UI/receipt naming only; not intentionally written on-chain |
| SHA-256 fingerprint | Local browser and public EAS attestation |
| Proof ID / EAS UID | Public chain and saved receipt |
| Attester address | Public chain |
| Transaction hash/block/time | Public chain |
| Passkey private material / device PIN / biometrics | Authenticator/provider boundary, not requested by ProofStamp |
| ProofStamp user/account database | None in this prototype |

A public file hash is not a secrecy mechanism. Anyone who already has a candidate file can calculate its hash and test whether it matches the public record.

## Failure behavior

The prototype fails closed for the important verification checks:

- If the configured EAS schema cannot be read or does not match the pinned schema properties, creation stops.
- If the sponsored transaction fails, no success is shown.
- If the transaction succeeds but the expected EAS UID cannot be found in logs, no success is shown.
- If the read-back attestation does not match the UID/schema/recipient/non-revocable policy/hash expected by the app, no success is shown.
- During Check, a missing or malformed Proof ID is rejected.
- During Check, a revoked attestation is treated as invalid.
- During Check, a different file produces a different local SHA-256 and fails comparison.

## Passkey compatibility

Passkeys are an onboarding mechanism, not part of the proof format.

In prototype testing, the ZeroDev passkey flow completed successfully with a compatible authenticator. On the tested Windows setup, Windows Hello produced an RS256 credential and the ZeroDev/underlying passkey service returned `500 external_service_error` during registration. An ES256-only frontend experiment caused the platform flow to fall back to an external USB security key, so that workaround was not shipped.

See [passkeys.md](passkeys.md).

## Deployment

The stable testnet origin is:

```text
https://arbitrum-testnet.proofstamp.org/
```

Cloudflare Pages serves the static build. Branding is served from local repository assets, including `public/proofstamp-seal.png`; the app does not depend on another ProofStamp site for its logo. Branch previews may use temporary `*.pages.dev` origins and must be treated as separate WebAuthn origins/RP-ID contexts.

See [cloudflare-pages.md](cloudflare-pages.md).

## Scope

This architecture proves byte integrity against a public timestamped attestation. It does not establish whether the file is truthful, authentic, lawful, owned by the attester, or originally created at the attestation time.
