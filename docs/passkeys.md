# Passkey compatibility notes

These are prototype test observations for ProofStamp via Arbitrum Sepolia. They are not a general WebAuthn compatibility matrix.

## Current approach

The application uses ZeroDev's passkey wallet connector and leaves WebAuthn algorithm negotiation to the browser/provider.

The normal user experience is intentionally:

```text
choose file
→ local SHA-256
→ create or use passkey
→ record on Arbitrum
```

No seed phrase, token balance, or manual gas payment is required in the intended flow.

## Observed working path

A compatible passkey authenticator completed the prototype flow successfully.

## Known Windows Hello issue

On the tested Windows setup, Windows Hello created an RS256 WebAuthn credential. Registration then failed in the ZeroDev/underlying passkey service with a server-side `500 external_service_error`.

The application maps that class of failure to user-facing copy that suggests trying another passkey or trying again, while keeping technical details available in the expandable error section.

This failure occurs during passkey setup. It does not change the local SHA-256 calculation or the independent Check flow.

## Why the frontend does not force ES256

An ES256-only diagnostic experiment was tested.

With ES256 forced, Windows Hello no longer completed as the normal platform authenticator and the browser fell back to an external USB security-key path. That is a worse user experience and is not a general fix.

For that reason, the production prototype does not override WebAuthn algorithm negotiation in the frontend.

## RP ID and preview domains

WebAuthn credentials are scoped to a relying-party ID.

The stable public testnet app is:

```text
https://arbitrum-testnet.proofstamp.org/
```

Temporary Cloudflare `*.pages.dev` previews should be treated as separate test environments. A passkey created for one RP-ID/origin context should not be assumed to work on another.

`VITE_ZERODEV_RP_ID` is public browser configuration. Set it deliberately for a stable deployment and never put secrets in a `VITE_*` variable.

## Troubleshooting

If passkey creation fails:

1. Expand **Technical details** and confirm the error is a passkey/provider failure rather than a blockchain write failure.
2. Try a different passkey provider/authenticator.
3. Confirm the current origin is allowed by the ZeroDev project configuration.
4. Confirm the configured RP ID is appropriate for the hostname.
5. Do not add frontend algorithm forcing as a compatibility workaround without testing the actual platform-authenticator result.

If a passkey is already registered but login fails, verify that the user is on the same intended RP-ID/origin context where the passkey was created.

## Security note

ProofStamp must never ask for a user's device PIN, biometric data, seed phrase, or private key. Those remain inside the browser/platform authenticator and wallet-provider boundaries.
