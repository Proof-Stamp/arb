import { type ComponentType, useState } from 'react';
import { zeroAddress, type Hex } from 'viem';
import { ARBITRUM_SEPOLIA_CHAIN_ID } from './config/arbitrum';
import { readEasAttestation } from './lib/eas/client';
import { decodeProofStampData, PROOFSTAMP_SCHEMA_UID } from './lib/eas/schema';
import { getArbiscanTransactionUrl } from './lib/eas/write';
import { MAX_V0_FILE_BYTES, sha256Blob, type Sha256Hex } from './lib/hash';
import './receipt-actions.css';

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

interface CheckResult {
  uid: `0x${string}`;
  fileHash: Sha256Hex;
  recordedHash: Sha256Hex;
  recordedAt: string;
  attester: string;
  matches: boolean;
  revoked: boolean;
}

type BlockchainFlowComponent = ComponentType<BlockchainFlowProps>;
type ToolTab = 'create' | 'check';
type CopyStatus = 'idle' | 'copied';

const IS_ZERODEV_CONFIGURED =
  (import.meta.env.VITE_ZERODEV_PROJECT_ID?.trim() ?? '').length > 0;
const MAX_RECEIPT_FILE_BYTES = 256 * 1024;

const BUILD_COMMIT_SHA = __BUILD_COMMIT_SHA__.trim();
const BUILD_REFERENCE = BUILD_COMMIT_SHA === 'local' ? 'local' : BUILD_COMMIT_SHA.slice(0, 8);
const BUILD_COMMIT_URL =
  BUILD_COMMIT_SHA === 'local'
    ? 'https://github.com/Proof-Stamp/arb'
    : `https://github.com/Proof-Stamp/arb/commit/${BUILD_COMMIT_SHA}`;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isBytes32(value: string): value is `0x${string}` {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

function extractProofId(value: string): `0x${string}` | null {
  const trimmed = value.trim();
  if (isBytes32(trimmed)) return trimmed;

  const labelled = trimmed.match(
    /(?:Proof ID\s*\/\s*EAS UID|EAS UID|Proof ID)\s*:\s*(0x[0-9a-fA-F]{64})/i,
  )?.[1];

  return labelled && isBytes32(labelled) ? labelled : null;
}

function receiptToText(proof: ProofResult, hash: Sha256Hex): string {
  return [
    'ProofStamp via Arbitrum',
    'Testnet receipt',
    '',
    `Proof ID / EAS UID: ${proof.uid}`,
    `SHA-256 / file fingerprint: ${hash}`,
    `Recorded at: ${proof.recordedAt}`,
    'Network: Arbitrum Sepolia',
    `Chain ID: ${ARBITRUM_SEPOLIA_CHAIN_ID}`,
    `Block: ${proof.blockNumber.toString()}`,
    `Transaction: ${proof.transactionHash}`,
    `EAS schema: ${PROOFSTAMP_SCHEMA_UID}`,
    `Explorer: ${getArbiscanTransactionUrl(proof.transactionHash)}`,
    '',
    'Check this ProofStamp:',
    'Open the ProofStamp via Arbitrum app, choose the exact original file, open Check, then upload this receipt or paste it.',
    '',
    'The file was not uploaded. Only its SHA-256 fingerprint was recorded publicly.',
    'A ProofStamp can show that specific bytes were recorded at a time. It does not prove that the content itself is true or authentic.',
  ].join('\n');
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) throw new Error('Copy is not available in this browser.');
}

function downloadText(text: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ToolTab>('create');

  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<Sha256Hex | null>(null);
  const [proof, setProof] = useState<ProofResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isPreparing, setIsPreparing] = useState(false);
  const [isLoadingBlockchain, setIsLoadingBlockchain] = useState(false);
  const [BlockchainFlow, setBlockchainFlow] = useState<BlockchainFlowComponent | null>(null);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  const [checkFile, setCheckFile] = useState<File | null>(null);
  const [checkProofId, setCheckProofId] = useState('');
  const [checkReceiptName, setCheckReceiptName] = useState('');
  const [checkError, setCheckError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  async function handlePrepare(): Promise<void> {
    if (!file) return;

    setError('');
    setHash(null);
    setProof(null);
    setCopyStatus('idle');
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
    setCopyStatus('idle');
    setBlockchainFlow(null);
    setError('');
  }

  async function handleCopyProofStamp(): Promise<void> {
    if (!proof || !hash) return;

    setError('');
    try {
      await copyText(receiptToText(proof, hash));
      setCopyStatus('copied');
      window.setTimeout(() => setCopyStatus('idle'), 2500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to copy this ProofStamp.');
    }
  }

  function handleDownloadProofStamp(): void {
    if (!proof || !hash || !file) return;

    setError('');
    const safeFileName = file.name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').trim() || 'file';
    downloadText(receiptToText(proof, hash), `${safeFileName}_proofstamp.txt`);
  }

  function handleCheckFileChange(nextFile: File | null): void {
    setCheckFile(nextFile);
    setCheckResult(null);
    setCheckError('');
  }

  async function handleCheckReceiptFile(receiptFile: File | null): Promise<void> {
    if (!receiptFile) return;

    setCheckError('');
    setCheckResult(null);
    setCheckReceiptName('');

    if (receiptFile.size > MAX_RECEIPT_FILE_BYTES) {
      setCheckError('This ProofStamp receipt is unexpectedly large. Choose the saved .txt ProofStamp file.');
      return;
    }

    try {
      const receiptText = await receiptFile.text();
      if (!extractProofId(receiptText)) {
        throw new Error('This file does not contain a valid ProofStamp Proof ID.');
      }
      setCheckProofId(receiptText);
      setCheckReceiptName(receiptFile.name);
    } catch (caught) {
      setCheckError(caught instanceof Error ? caught.message : 'Unable to read this ProofStamp file.');
    }
  }

  async function handleCheck(): Promise<void> {
    if (!checkFile) return;

    const proofId = extractProofId(checkProofId);
    setCheckError('');
    setCheckResult(null);

    if (!proofId) {
      setCheckError('Upload a saved ProofStamp receipt or paste a valid Proof ID / EAS UID.');
      return;
    }

    setIsChecking(true);

    try {
      const fileHash = await sha256Blob(checkFile);
      const attestation = await readEasAttestation(proofId);

      if (attestation.uid.toLowerCase() !== proofId.toLowerCase()) {
        throw new Error('No attestation was found for this Proof ID on Arbitrum Sepolia.');
      }

      if (
        attestation.schema.toLowerCase() !== PROOFSTAMP_SCHEMA_UID.toLowerCase() ||
        attestation.recipient.toLowerCase() !== zeroAddress.toLowerCase()
      ) {
        throw new Error('This Proof ID is not a supported ProofStamp Content Hash attestation.');
      }

      const recordedHash = decodeProofStampData(attestation.data) as Sha256Hex;
      const revoked = attestation.revocationTime !== 0n;

      setCheckResult({
        uid: proofId,
        fileHash,
        recordedHash,
        recordedAt: new Date(Number(attestation.time) * 1000).toLocaleString(),
        attester: attestation.attester,
        matches: !revoked && recordedHash.toLowerCase() === fileHash.toLowerCase(),
        revoked,
      });
    } catch (caught) {
      setCheckError(caught instanceof Error ? caught.message : 'Unable to check this ProofStamp.');
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <main className="shell">
      <header className="masthead">
        <a className="brand" href="/" aria-label="ProofStamp home">
          <img
            className="brand-mark"
            src="https://email.proofstamp.org/proofstamp-seal.svg"
            width="46"
            height="46"
            alt=""
          />
          <span className="brand-copy">
            <strong>ProofStamp</strong>
            <small>via Arbitrum</small>
          </span>
        </a>
        <div className="masthead-meta">
          <span className="preview-badge">Testnet preview</span>
          <span className="network">Arbitrum Sepolia</span>
        </div>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <h1 id="page-title">Proof a file on Arbitrum.</h1>
        <p className="lede">No upload. No seed phrase. Your device does the math.</p>
      </section>

      <section className="tool-shell" aria-label="ProofStamp file tool">
        <div className="tabs" role="tablist" aria-label="Tool mode">
          <button
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === 'create'}
            aria-controls="create-panel"
            onClick={() => setActiveTab('create')}
          >
            Create
          </button>
          <button
            className={`tab ${activeTab === 'check' ? 'active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === 'check'}
            aria-controls="check-panel"
            onClick={() => setActiveTab('check')}
          >
            Check
          </button>
        </div>

        {activeTab === 'create' ? (
          <section id="create-panel" className="panel" role="tabpanel">
            <div className="card-heading">
              <div>
                <h2>Create a ProofStamp</h2>
                <p className="card-copy">Choose one file. Its fingerprint is prepared locally.</p>
              </div>
              <span className="privacy-note">Nothing is uploaded</span>
            </div>

            <label className="file-picker">
              <span className="picker-icon" aria-hidden="true">＋</span>
              <strong>{file ? 'Choose a different file' : 'Choose file'}</strong>
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
                  <span className="status-mark" aria-hidden="true">✓</span>
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
                    <p>Load the passkey connection only when you are ready. The file remains on this device.</p>
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

            {proof && hash ? (
              <div className="prepared proof-complete" aria-live="polite">
                <div className="prepared-heading">
                  <span className="status-mark" aria-hidden="true">✓</span>
                  <div>
                    <strong>ProofStamp recorded</strong>
                    <p>Recorded on Arbitrum Sepolia at {proof.recordedAt}.</p>
                  </div>
                </div>

                <div className="receipt-actions" aria-label="ProofStamp actions">
                  <a
                    className="receipt-action"
                    href={getArbiscanTransactionUrl(proof.transactionHash)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on blockchain
                  </a>
                  <button
                    className="receipt-action"
                    type="button"
                    onClick={() => void handleCopyProofStamp()}
                  >
                    {copyStatus === 'copied' ? 'Copied ✓' : 'Copy ProofStamp'}
                  </button>
                  <button
                    className="receipt-action"
                    type="button"
                    onClick={handleDownloadProofStamp}
                  >
                    Download ProofStamp
                  </button>
                </div>

                <p className="receipt-note">
                  Save the ProofStamp separately from the original file. You can upload the receipt in Check later.
                </p>

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

            {error ? <p className="error" role="alert">{error}</p> : null}
          </section>
        ) : (
          <section id="check-panel" className="panel" role="tabpanel">
            <div className="check-intro">
              <h2>Check a ProofStamp</h2>
              <p>
                Choose the original file, then upload its saved ProofStamp receipt or paste the Proof ID.
                Everything is read locally before the public Arbitrum attestation is checked.
              </p>
            </div>

            <label className="file-picker check-picker">
              <span className="picker-icon" aria-hidden="true">↑</span>
              <strong>{checkFile ? 'Choose a different file' : 'Choose original file'}</strong>
              <small>The file stays on this device.</small>
              <input
                type="file"
                onChange={(event) => handleCheckFileChange(event.target.files?.[0] ?? null)}
              />
            </label>

            {checkFile ? (
              <div className="file-summary" aria-live="polite">
                <strong>{checkFile.name}</strong>
                <span>{formatBytes(checkFile.size)}</span>
              </div>
            ) : null}

            <label className="file-picker check-picker">
              <span className="picker-icon" aria-hidden="true">＋</span>
              <strong>{checkReceiptName ? 'Choose a different ProofStamp file' : 'Upload ProofStamp file'}</strong>
              <small>Saved .txt receipt · read only on this device</small>
              <input
                type="file"
                accept=".txt,text/plain"
                onChange={(event) => void handleCheckReceiptFile(event.target.files?.[0] ?? null)}
              />
            </label>

            {checkReceiptName ? (
              <div className="file-summary" aria-live="polite">
                <strong>{checkReceiptName}</strong>
                <span>Receipt ready</span>
              </div>
            ) : null}

            <label className="field">
              <span>Or paste ProofStamp / Proof ID</span>
              <textarea
                rows={5}
                value={checkProofId}
                onChange={(event) => {
                  setCheckProofId(event.target.value);
                  setCheckReceiptName('');
                  setCheckResult(null);
                  setCheckError('');
                }}
                placeholder="Paste the saved ProofStamp receipt or 0x…"
              />
            </label>

            <button
              className="primary"
              type="button"
              disabled={!checkFile || !checkProofId.trim() || isChecking}
              onClick={() => void handleCheck()}
            >
              {isChecking ? 'Checking ProofStamp…' : 'Check ProofStamp'}
            </button>

            {checkResult ? (
              <div className={`check-result ${checkResult.matches ? 'success' : 'failure'}`} aria-live="polite">
                <span className="check-result-icon" aria-hidden="true">{checkResult.matches ? '✓' : '!'}</span>
                <div>
                  <h3>
                    {checkResult.matches
                      ? 'ProofStamp matches this file'
                      : checkResult.revoked
                        ? 'This ProofStamp was revoked'
                        : 'This file does not match'}
                  </h3>
                  <p>
                    {checkResult.matches
                      ? `The exact file fingerprint was recorded on Arbitrum Sepolia at ${checkResult.recordedAt}.`
                      : checkResult.revoked
                        ? 'The attestation exists, but it has been revoked and should not be treated as valid.'
                        : 'The file fingerprint does not match the fingerprint stored in this attestation.'}
                  </p>
                </div>
                <details>
                  <summary>Technical details</summary>
                  <div className="result">
                    <span>Proof ID / EAS UID</span>
                    <code>{checkResult.uid}</code>
                    <span>File SHA-256</span>
                    <code>{checkResult.fileHash}</code>
                    <span>Recorded SHA-256</span>
                    <code>{checkResult.recordedHash}</code>
                    <span>Attester</span>
                    <code>{checkResult.attester}</code>
                    <span>Network</span>
                    <code>Arbitrum Sepolia · chain ID {ARBITRUM_SEPOLIA_CHAIN_ID}</code>
                  </div>
                </details>
              </div>
            ) : null}

            {checkError ? <p className="error" role="alert">{checkError}</p> : null}
          </section>
        )}
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
          <span>Anyone can independently check the proof on Arbitrum.</span>
        </div>
      </section>

      <footer>
        <p>
          A ProofStamp can show that specific bytes were recorded at a time. It does not prove that
          the content itself is true or authentic. · Build reference:{' '}
          <a href={BUILD_COMMIT_URL} target="_blank" rel="noreferrer">
            <code>{BUILD_REFERENCE}</code>
          </a>
        </p>
      </footer>
    </main>
  );
}
