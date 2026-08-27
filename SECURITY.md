# Security

ProofStamp on Arbitrum is an early-stage experiment and is not ready for production use.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting for this repository when it is available. If private reporting is not available, contact the project maintainers privately before opening a public issue that contains exploitable details.

Do not include credentials, API secrets, private keys, passkey material, or other sensitive data in a public issue.

## Security model

The project is being designed around a small set of security boundaries:

- File bytes are processed locally in the browser and must not be uploaded by the stamping or verification flow.
- SHA-256 is calculated over the exact file bytes.
- Only explicitly defined proof data is written to a public blockchain.
- Values prefixed with `VITE_` are public browser configuration and must never contain secrets.
- Gas sponsorship must be constrained before public use.
- Verification should read the public attestation directly and must not rely on a ProofStamp backend.

A blockchain timestamp or attestation is evidence of a recorded hash. It is not proof that the underlying content is truthful or authentic.
