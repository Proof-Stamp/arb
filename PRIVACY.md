# Privacy

_Last updated: August 27, 2026_

This notice describes the current ProofStamp via Arbitrum testnet application in this repository.

## What stays on your device

The application reads the file you choose in your browser and calculates its SHA-256 fingerprint locally. The original file is not uploaded to a ProofStamp application server by the create or check flow.

When you use a downloaded ProofStamp `.txt` receipt in Check, that receipt is also read locally by the browser.

ProofStamp does not receive your device PIN or biometric data. Those remain part of your device/browser authenticator flow.

## What becomes public

Creating a ProofStamp intentionally creates a public blockchain record. V0 publishes the file's SHA-256 fingerprint as EAS `contentHash`. Normal blockchain data associated with the transaction is also public, including the attester address, transaction hash, block, timestamp and EAS attestation UID.

The original filename and file contents are not intentionally written on-chain by this application.

Public blockchain records may be effectively permanent even if an attestation is later marked revoked.

## Important hash privacy property

A SHA-256 fingerprint does not reveal the file by itself, but it is not a secrecy mechanism. Anyone who already has a candidate file can hash that file and test whether its fingerprint matches a public ProofStamp.

Transactions made from the same attester address may also be correlated with one another.

## Third-party infrastructure

The current application uses third-party infrastructure to operate:

- Cloudflare Pages serves the web application.
- ZeroDev provides passkey wallet infrastructure and sponsored transaction services.
- Arbitrum RPC infrastructure is used to read and write public blockchain data.
- Ethereum Attestation Service contracts store and expose the public attestation.

Those services may process ordinary network and service metadata under their own terms and privacy practices. This repository does not control their independent processing.

## ProofStamp application data

This V0 repository does not include a ProofStamp user database, account database, analytics system, or file-upload API. Browser configuration values such as the ZeroDev project ID are public client configuration, not secrets.

## Contact

Questions about this notice can be sent to `info@proofstamp.org`.
