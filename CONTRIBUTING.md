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

This prototype does not require paid GitHub Actions. Run the checks above locally before submitting changes. Cloudflare Pages provides the deployment build check for the hosted testnet app.

## Project rules

- Never commit secrets or private credentials.
- Never put secrets in `VITE_*` environment variables. Vite exposes them to the browser.
- Keep file hashing local to the user's device.
- Avoid storing filenames, personal information, or unnecessary metadata on-chain.
- Treat blockchain proof as evidence of existence and byte integrity, not as proof of truth.
- Prefer standard, inspectable protocol primitives over custom cryptography or unnecessary smart contracts.
- Add tests for cryptographic encoding and verification behavior.

For security-sensitive changes, explain the trust boundary and failure mode in the pull request.

## Review before commit

Do not commit based only on the code change looking plausible. Review the actual result first.

Before each commit:

1. inspect the complete final diff,
2. run the relevant build/tests where feasible,
3. visually inspect UI or image changes at the real rendered size,
4. verify asset paths, URLs, domains, and environment assumptions,
5. confirm that no unrelated files changed,
6. only then commit and open/update the pull request.

For documentation-only changes, the same rule applies: verify links, paths, diagrams, commands, addresses, and claims against the current implementation before committing.
