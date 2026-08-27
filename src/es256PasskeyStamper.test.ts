import { beforeEach, describe, expect, it, vi } from 'vitest';

const { attestationMock, stampMock, stamperArgs } = vi.hoisted(() => ({
  attestationMock: vi.fn(),
  stampMock: vi.fn(),
  stamperArgs: [] as unknown[],
}));

vi.mock('@turnkey/http', () => ({
  getWebAuthnAttestation: attestationMock,
}));

vi.mock('@turnkey/webauthn-stamper', () => ({
  WebauthnStamper: class {
    stamp = stampMock;

    constructor(config: unknown) {
      stamperArgs.push(config);
    }
  },
}));

import { createEs256PasskeyStamper } from './es256PasskeyStamper';

beforeEach(() => {
  attestationMock.mockReset().mockResolvedValue({
    attestationObject: 'attestation-object',
    clientDataJson: 'client-data-json',
    credentialId: 'credential-id',
  });
  stampMock.mockReset().mockResolvedValue({
    stampHeaderName: 'X-Stamp',
    stampHeaderValue: 'signed',
  });
  stamperArgs.length = 0;
});

describe('createEs256PasskeyStamper', () => {
  it('uses the configured RP ID for Turnkey assertions', async () => {
    await createEs256PasskeyStamper({ rpId: 'arbitrum-testnet.proofstamp.org' });

    expect(stamperArgs).toEqual([{ rpId: 'arbitrum-testnet.proofstamp.org' }]);
  });

  it('advertises only ES256 during passkey registration', async () => {
    const stamper = await createEs256PasskeyStamper({
      rpId: 'arbitrum-testnet.proofstamp.org',
    });

    await stamper.register({
      rp: {
        id: 'arbitrum-testnet.proofstamp.org',
        name: 'ZeroDev Wallet',
      },
      userName: 'ProofStamp test',
    });

    const publicKey = attestationMock.mock.calls[0]?.[0]?.publicKey;

    expect(publicKey.pubKeyCredParams).toEqual([{ type: 'public-key', alg: -7 }]);
    expect(publicKey.authenticatorSelection).toEqual({
      residentKey: 'required',
      userVerification: 'preferred',
    });
  });

  it('keeps Turnkey assertion signing unchanged', async () => {
    const stamper = await createEs256PasskeyStamper({
      rpId: 'arbitrum-testnet.proofstamp.org',
    });

    await expect(stamper.stamp('payload')).resolves.toEqual({
      stampHeaderName: 'X-Stamp',
      stampHeaderValue: 'signed',
    });
    expect(stampMock).toHaveBeenCalledWith('payload');
  });
});
