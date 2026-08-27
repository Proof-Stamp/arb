# Contributing

Thanks for taking an interest in ProofStamp on Arbitrum.

The repository is intentionally small. Changes should preserve that simplicity unless additional complexity has a clear security or product benefit.

## Local development

Requirements:

- Node.js 22 or newer
- npm

Install and run:

```bash
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

## Project rules

- Never commit secrets or private credentials.
- Never put secrets in `VITE_*` environment variables. Vite exposes them to the browser.
- Keep file hashing local to the user's device.
- Avoid storing filenames, personal information, or unnecessary metadata on-chain.
- Treat blockchain proof as evidence of existence and byte integrity, not as proof of truth.
- Prefer standard, inspectable protocol primitives over custom cryptography or unnecessary smart contracts.
- Add tests for cryptographic encoding and verification behavior.

For security-sensitive changes, explain the trust boundary and failure mode in the pull request.
