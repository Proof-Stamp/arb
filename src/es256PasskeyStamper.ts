import { getWebAuthnAttestation } from '@turnkey/http';
import { WebauthnStamper as TurnkeyWebauthnStamper } from '@turnkey/webauthn-stamper';
import type { PasskeyStamper } from '@zerodev/wallet-core';

function generateRandomBuffer(): ArrayBuffer {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes.buffer;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * ZeroDev's default WebAuthn registration advertises both ES256 and RS256.
 * Some Windows Hello installations prefer RS256 when both are offered. The
 * credential is then created locally, but the current ZeroDev/Turnkey wallet
 * registration path can fail server-side, leaving an orphaned passkey.
 *
 * ProofStamp needs a P-256 credential, so advertise ES256 only during
 * registration. Existing passkey assertions still use Turnkey's standard
 * WebAuthn stamper.
 */
export async function createEs256PasskeyStamper({
  rpId,
}: {
  rpId: string;
}): Promise<PasskeyStamper> {
  const inner = new TurnkeyWebauthnStamper({ rpId });

  return {
    async stamp(payload: string) {
      return inner.stamp(payload);
    },
    async clear() {},
    async register(options) {
      const challenge = generateRandomBuffer();
      const encodedChallenge = base64UrlEncode(challenge);
      const authenticatorUserId = generateRandomBuffer();

      const attestation = await getWebAuthnAttestation({
        publicKey: {
          rp: options.rp,
          challenge,
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          user: {
            id: authenticatorUserId,
            name: options.userName,
            displayName: options.userName,
          },
          authenticatorSelection: {
            residentKey: 'required',
            userVerification: 'preferred',
          },
        },
      });

      return { attestation, encodedChallenge };
    },
  };
}
