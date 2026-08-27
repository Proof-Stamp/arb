import { useState } from 'react';
import { MAX_V0_FILE_BYTES, sha256Blob } from './lib/hash';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isPreparing, setIsPreparing] = useState(false);

  async function handleCreate(): Promise<void> {
    if (!file) return;

    setError('');
    setHash('');
    setIsPreparing(true);

    try {
      setHash(await sha256Blob(file));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to prepare this file.');
    } finally {
      setIsPreparing(false);
    }
  }

  function handleFileChange(nextFile: File | null): void {
    setFile(nextFile);
    setHash('');
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

        <button className="primary" type="button" onClick={handleCreate} disabled={!file || isPreparing}>
          {isPreparing ? 'Preparing ProofStamp…' : 'Create ProofStamp'}
        </button>

        {hash ? (
          <div className="prepared" aria-live="polite">
            <div className="prepared-heading">
              <span className="status-mark" aria-hidden="true">✓</span>
              <div>
                <strong>File prepared locally</strong>
                <p>
                  This preview stops before the blockchain transaction. Your file has not left this
                  browser.
                </p>
              </div>
            </div>

            <details>
              <summary>Technical details</summary>
              <div className="result">
                <span>SHA-256 / file fingerprint</span>
                <code>{hash}</code>
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
          <span>Only the proof fingerprint will be recorded publicly.</span>
        </div>
        <div>
          <strong>Verifiable</strong>
          <span>The final proof will be independently checkable on Arbitrum.</span>
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
