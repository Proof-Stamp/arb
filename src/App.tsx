import { useLoginPasskey, useRegisterPasskey } from '@zerodev/wallet-react';
import { useState } from 'react';
import { parseEventLogs, zeroAddress, type Hex } from 'viem';
import { useAccount, useSendTransaction } from 'wagmi';
import { ARBITRUM_SEPOLIA_CHAIN_ID } from './config/arbitrum';
import { createArbitrumSepoliaPublicClient, readEasAttestation, readProofStampSchema } from './lib/eas/client';
import {
  decodeProofStampData,
  PROOFSTAMP_SCHEMA,
  PROOFSTAMP_SCHEMA_RESOLVER,
  PROOFSTAMP_SCHEMA_REVOCABLE,
  PROOFSTAMP_SCHEMA_UID,
} from './lib/eas/schema';
import {
  createProofStampAttestCalldata,
  EAS_ATTESTED_EVENT_ABI,
  EAS_CONTRACT_ADDRESS,
  getArbiscanTransactionUrl,
} from './lib/eas/write';
import { MAX_V0_FILE_BYTES, sha256Blob, type Sha256Hex } from './lib/hash';
import { ARBITRUM_SEPOLIA_RPC_URL, IS_ZERODEV_CONFIGURED } from './wagmi';

interface ProofResult {
  uid: `0x${string}`;
  transactionHash: Hex;
  blockNumber: bigint;
  recordedAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function assertProofStampSchemaReady(): Promise<void> {
  const schema = await readProofStampSchema(ARBITRUM_SEPOLIA_RPC_URL);

  if (
    schema.uid.toLowerCase() !== PROOFSTAMP_SCHEMA_UID.toLowerCase() ||
    schema.schema !== PROOFSTAMP_SCHEMA ||
    schema.resolver.toLowerCase() !== PROOFSTAMP_SCHEMA_RESOLVER.toLowerCase() ||
    schema.revocable !== PROOFSTAMP_SCHEMA_REVOCABLE
  ) {
    throw new Error('The ProofStamp testnet schema is not registered yet.');
  }
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<Sha256Hex | null>(null);
  const [proof, setProof] = useState<ProofResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isPreparing, setIsPreparing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const { address, isConnected } = useAccount();
  const registerPasskey = useRegisterPasskey();
  const loginPasskey = useLoginPasskey();
  const sendTransaction = useSendTransaction();

  const isAuthenticating = registerPasskey.isPending || loginPasskey.isPending;

  async function handlePrepare(): Promise<void> {
    if (!file) return;

    setError('');
    setHash(null);
    setProof(null);
    setIsPreparing(true);

    try {
      setHash(await sha256Blob(file));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to prepare this file.');
    } finally {
      setIsPreparing(false);
    }
  }

  async function handlePasskey(mode: 'register' | 'login'): Promise<void> {
    setError('');

    try {
      if (mode === 'register') {
        await registerPasskey.mutateAsync();
      } else {
        await loginPasskey.mutateAsync();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to continue with this passkey.');
    }
  }

  async function handleRecord(): Promise<void> {
    if (!hash || !isConnected) return;

    setError('');
    setProof(null);
    setIsRecording(true);

    try {
      await assertProofStampSchemaReady();

      const transactionHash = await sendTransaction.sendTransactionAsync({
        chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
        to: EAS_CONTRACT_ADDRESS,
        data: createProofStampAttestCalldata(hash),
        value: 0n,
      });

      const publicClient = createArbitrumSepoliaPublicClient(ARBITRUM_SEPOLIA_RPC_URL);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: transactionHash });

      if (receipt.status !== 'success') {
        throw new Error('The blockchain transaction did not complete successfully.');
      }

      const events = parseEventLogs({
        abi: EAS_ATTESTED_EVENT_ABI,
        eventName: 'Attested',
        logs: receipt.logs,
      });
      const event = events.find(
        (candidate) => candidate.address.toLowerCase() === EAS_CONTRACT_ADDRESS.toLowerCase(),
      );
      const uid = event?.args.uid;

      if (!uid) {
        throw new Error('The ProofStamp transaction completed, but its proof ID was not found.');
      }

      const attestation = await readEasAttestation(uid, ARBITRUM_SEPOLIA_RPC_URL);
      const recordedHash = decodeProofStampData(attestation.data);

      if (
        attestation.uid.toLowerCase() !== uid.toLowerCase() ||
        attestation.schema.toLowerCase() !== PROOFSTAMP_SCHEMA_UID.toLowerCase() ||
        attestation.recipient.toLowerCase() !== zeroAddress.toLowerCase() ||
        attestation.revocable ||
        recordedHash.toLowerCase() !== hash.toLowerCase()
      ) {
        throw new Error('The recorded attestation did not match the prepared ProofStamp.');
      }

      setProof({
        uid,
        transactionHash,
        blockNumber: receipt.blockNumber,
        recordedAt: new Date(Number(attestation.time) * 1000).toLocaleString(),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create this ProofStamp.');
    } finally {
      setIsRecording(false);
    }
  }

  function handleFileChange(nextFile: File | null): void {
    setFile(nextFile);
    setHash(null);
    setProof(null);
    setError('');
  }

  return (
    <main className="shell">
      <header className="masthead">
        <a className="brand" href="/" aria-label="ProofStamp home">
          ProofStamp
        </a>
        <div className="masthead-meta">
          <span className="preview-badge">Testnet preview</span>
          <span className="network">Arbitrum Sepolia</span>
        </div>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Private file. Public proof.</p>
        <h1 id="page-title">Create proof for a file without uploading it.</h1>
        <p className="lede">
          Choose a file. ProofStamp prepares its cryptographic fingerprint in your browser. Your file
          stays on this device.
        </p>
      </section>

      <section className="card" aria-labelledby="create-title">
        <div className="card-heading">
          <div>
            <h2 id="create-title">Create a ProofStamp</h2>
            <p className="card-copy">Select one file to prepare its proof locally.</p>
          </div>
          <span className="privacy-note">Nothing is uploaded</span>
        </div>

        <label className="file-picker">
          <span>{file ? 'Choose a different file' : 'Choose file'}</span>
          <small>PDF, photo, document, or other file · up to {formatBytes(MAX_V0_FILE_BYTES)}</small>
          <input
            type="file"
            onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
          />
        </label>

        {file ? (
          <div className="file-summary" aria-live="polite">
            <strong>{file.name}</strong>
            <span>{formatBytes(file.size)}</span>
          </div>
        ) : null}

        {!hash ? (
          <button
            className="primary"
            type="button"
            onClick={handlePrepare}
            disabled={!file || isPreparing}
          >
            {isPreparing ? 'Preparing ProofStamp…' : 'Prepare ProofStamp'}
          </button>
        ) : null}

        {hash && !proof ? (
          <div className="prepared" aria-live="polite">
            <div className="prepared-heading">
              <span className="status-mark" aria-hidden="true">
                ✓
              </span>
              <div>
                <strong>File prepared locally</strong>
                <p>Your file has not left this browser.</p>
              </div>
            </div>

            {!IS_ZERODEV_CONFIGURED ? (
              <div className="next-step setup-note">
                <strong>Blockchain connection is not configured yet</strong>
                <p>This test build needs a ZeroDev project ID before passkey testing can begin.</p>
              </div>
            ) : !isConnected ? (
              <div className="next-step">
                <strong>Continue securely</strong>
                <p>
                  Your device will use a passkey. No seed phrase, token balance, or gas payment is
                  required.
                </p>
                <button
                  className="primary compact"
                  type="button"
                  disabled={isAuthenticating}
                  onClick={() => void handlePasskey('register')}
                >
                  {registerPasskey.isPending ? 'Creating passkey…' : 'Create a passkey'}
                </button>
                <button
                  className="secondary"
                  type="button"
                  disabled={isAuthenticating}
                  onClick={() => void handlePasskey('login')}
                >
                  {loginPasskey.isPending ? 'Using passkey…' : 'I already have a passkey'}
                </button>
              </div>
            ) : (
              <div className="next-step">
                <strong>Ready to record</strong>
                <p>Only the SHA-256 fingerprint will be placed in the public attestation.</p>
                <button
                  className="primary compact"
                  type="button"
                  disabled={isRecording || sendTransaction.isPending}
                  onClick={() => void handleRecord()}
                >
                  {isRecording || sendTransaction.isPending
                    ? 'Creating ProofStamp…'
                    : 'Create ProofStamp'}
                </button>
              </div>
            )}

            <details>
              <summary>Technical details</summary>
              <div className="result">
                <span>SHA-256 / file fingerprint</span>
                <code>{hash}</code>
                {address ? (
                  <>
                    <span>Attester address</span>
                    <code>{address}</code>
                  </>
                ) : null}
              </div>
            </details>
          </div>
        ) : null}

        {proof ? (
          <div className="prepared proof-complete" aria-live="polite">
            <div className="prepared-heading">
              <span className="status-mark" aria-hidden="true">
                ✓
              </span>
              <div>
                <strong>ProofStamp recorded</strong>
                <p>Recorded on Arbitrum Sepolia at {proof.recordedAt}.</p>
              </div>
            </div>

            <a
              className="blockchain-link"
              href={getArbiscanTransactionUrl(proof.transactionHash)}
              target="_blank"
              rel="noreferrer"
            >
              View on blockchain
            </a>

            <details>
              <summary>Technical details</summary>
              <div className="result">
                <span>Proof ID / EAS UID</span>
                <code>{proof.uid}</code>
                <span>SHA-256 / file fingerprint</span>
                <code>{hash}</code>
                <span>Transaction</span>
                <code>{proof.transactionHash}</code>
                <span>Block</span>
                <code>{proof.blockNumber.toString()}</code>
                <span>Network</span>
                <code>Arbitrum Sepolia · chain ID {ARBITRUM_SEPOLIA_CHAIN_ID}</code>
              </div>
            </details>
          </div>
        ) : null}

        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <section className="principles" aria-label="ProofStamp principles">
        <div>
          <strong>Private</strong>
          <span>The file stays on this device.</span>
        </div>
        <div>
          <strong>Minimal</strong>
          <span>Only the proof fingerprint is recorded publicly.</span>
        </div>
        <div>
          <strong>Verifiable</strong>
          <span>The proof can be independently checked on Arbitrum.</span>
        </div>
      </section>

      <footer>
        <p>
          A ProofStamp can show that specific bytes were recorded at a time. It does not prove that
          the content itself is true or authentic.
        </p>
      </footer>
    </main>
  );
}
