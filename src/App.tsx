import { type ComponentType, useState } from 'react';
import type { Hex } from 'viem';
import { ARBITRUM_SEPOLIA_CHAIN_ID } from './config/arbitrum';
import { getArbiscanTransactionUrl } from './lib/eas/write';
import { MAX_V0_FILE_BYTES, sha256Blob, type Sha256Hex } from './lib/hash';

interface ProofResult {
  uid: `0x${string}`;
  transactionHash: Hex;
  blockNumber: bigint;
  recordedAt: string;
}

interface BlockchainFlowProps {
  hash: Sha256Hex;
  onProof: (proof: ProofResult) => void;
  onError: (message: string) => void;
}

type BlockchainFlowComponent = ComponentType<BlockchainFlowProps>;

const IS_ZERODEV_CONFIGURED =
  (import.meta.env.VITE_ZERODEV_PROJECT_ID?.trim() ?? '').length > 0;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<Sha256Hex | null>(null);
  const [proof, setProof] = useState<ProofResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isPreparing, setIsPreparing] = useState(false);
  const [isLoadingBlockchain, setIsLoadingBlockchain] = useState(false);
  const [BlockchainFlow, setBlockchainFlow] = useState<BlockchainFlowComponent | null>(null);

  async function handlePrepare(): Promise<void> {
    if (!file) return;

    setError('');
    setHash(null);
    setProof(null);
    setBlockchainFlow(null);
    setIsPreparing(true);

    try {
      setHash(await sha256Blob(file));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to prepare this file.');
    } finally {
      setIsPreparing(false);
    }
  }

  async function handleLoadBlockchain(): Promise<void> {
    setError('');
    setIsLoadingBlockchain(true);

    try {
      const module = await import('./BlockchainFlow');
      setBlockchainFlow(() => module.BlockchainFlow);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? `Unable to load the blockchain connection: ${caught.message}`
          : 'Unable to load the blockchain connection.',
      );
    } finally {
      setIsLoadingBlockchain(false);
    }
  }

  function handleFileChange(nextFile: File | null): void {
    setFile(nextFile);
    setHash(null);
    setProof(null);
    setBlockchainFlow(null);
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
            ) : BlockchainFlow ? (
              <BlockchainFlow hash={hash} onProof={setProof} onError={setError} />
            ) : (
              <div className="next-step">
                <strong>Continue securely</strong>
                <p>
                  Load the passkey connection only when you are ready. The file remains on this device.
                </p>
                <button
                  className="primary compact"
                  type="button"
                  disabled={isLoadingBlockchain}
                  onClick={() => void handleLoadBlockchain()}
                >
                  {isLoadingBlockchain ? 'Loading secure connection…' : 'Continue with passkey'}
                </button>
              </div>
            )}

            <details>
              <summary>Technical details</summary>
              <div className="result">
                <span>SHA-256 / file fingerprint</span>
                <code>{hash}</code>
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
          the content itself is true or authentic. · Build reference:{' '}
          <a
            href="https://github.com/Proof-Stamp/arb/commit/fe5f0713a05e2975ac6916cdbd18e58101753ec1"
            target="_blank"
            rel="noreferrer"
          >
            <code>fe5f0713</code>
          </a>
        </p>
      </footer>
    </main>
  );
}
