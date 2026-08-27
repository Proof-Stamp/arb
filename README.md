# ProofStamp on Arbitrum

ProofStamp is an open-source experiment for creating independently verifiable proofs of digital files using local SHA-256 hashing and a public blockchain record.

This repository contains the Arbitrum implementation. Development starts on Arbitrum Sepolia.

> Status: early development. This repository is not ready for production use.

## Principles

- Files stay on the user's device.
- SHA-256 is calculated locally in the browser.
- Only proof data is recorded publicly.
- Verification should not depend on ProofStamp remaining online.
- A ProofStamp proves existence and integrity of specific bytes, not the truth or authenticity of their contents.

## Planned stack

- React + TypeScript + Vite
- Cloudflare Pages
- Arbitrum Sepolia
- Ethereum Attestation Service (EAS)
- ZeroDev for passkey-based smart accounts and sponsored transactions

Implementation details, security notes, local setup instructions, and deployment documentation will be added as the first vertical slice is built.
