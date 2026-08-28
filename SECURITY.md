# Security

ProofStamp via Arbitrum is experimental software running on Arbitrum Sepolia testnet. It should not be treated as a production security or legal service.

## Reporting a vulnerability

Please report security issues privately to `info@proofstamp.org`. Do not put exploit details, private keys, passkey material, credentials, or other sensitive data in a public issue.

## Security boundaries

- Original file bytes are hashed locally in the browser and are not uploaded by the ProofStamp application flow.
- SHA-256 is calculated over the exact file bytes.
- V0 writes only the EAS `bytes32 contentHash` payload as ProofStamp application data.
- Blockchain transaction metadata, including the attester address, is public.
- `VITE_*` values are public browser configuration and must never contain secrets.
- ZeroDev gas sponsorship is a security boundary and must remain constrained by contract/function allowlists, rate limits and spend limits.
- Successful creation is reported only after the app reads the EAS attestation back from Arbitrum and verifies the recorded hash.
- The Check flow reads EAS directly and does not depend on an EAS explorer or ProofStamp application backend.
- The saved `.txt` receipt is not trusted for the file hash during Check. It supplies the Proof ID / EAS UID; the original file is hashed again locally.

## Passkeys

Passkey authentication is provided through the browser/platform WebAuthn flow and ZeroDev. ProofStamp must never request a user's device PIN, biometric data, seed phrase, or private key.

WebAuthn credentials are scoped to their relying-party ID. Temporary `*.pages.dev` previews and the stable custom domain should be treated as distinct test contexts unless the RP-ID configuration deliberately says otherwise.

Prototype compatibility observations, including the tested Windows Hello RS256 registration failure and the decision not to force ES256 in the frontend, are documented in [docs/passkeys.md](docs/passkeys.md).

## Known privacy properties

A public SHA-256 hash can be candidate-tested by someone who already has a suspected file. Repeated transactions from the same attester address can also be correlated. See [PRIVACY.md](PRIVACY.md).

## Scope of the proof

A blockchain attestation is evidence that a hash was recorded. It is not proof that the underlying content is true, authentic, lawful, owned by the attester, or originally created at that time. See [DISCLAIMER.md](DISCLAIMER.md).
