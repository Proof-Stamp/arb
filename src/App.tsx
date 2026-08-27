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
  const [isHashing, setIsHashing] = useState(false);

  async function handleHash(): Promise<void> {
    if (!file) return;

    setError('');
    setHash('');
    setIsHashing(true);

    try {
      setHash(await sha256Blob(file));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to hash this file.');
    } finally {
      setIsHashing(false);
    }
  }

  return (
    <main className="shell">
      <header className="masthead">
        <a className="brand" href="/" aria-label="ProofStamp home">
          ProofStamp
        </a>
        <span className="network">Arbitrum Sepolia · V0</span>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Private file. Public proof.</p>
        <h1 id="page-title">Create a proof without uploading your file.</h1>
        <p className="lede">
          Your browser calculates the SHA-256 fingerprint locally. Blockchain anchoring will be added
          in the next implementation step.
        </p>
      </section>

      <section className="card" aria-labelledby="hash-title">
        <div className="card-heading">
          <div>
            <p className="step">Step 1</p>
            <h2 id="hash-title">Hash a file locally</h2>
          </div>
          <span className="privacy-note">Nothing is uploaded</span>
        </div>

        <label className="file-picker">
          <span>Choose file</span>
          <input
            type="file"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setHash('');
              setError('');
            }}
          />
        </label>

        {file ? (
          <div className="file-summary" aria-live="polite">
            <strong>{file.name}</strong>
            <span>{formatBytes(file.size)}</span>
          </div>
        ) : (
          <p className="hint">V0 local-hashing limit: {formatBytes(MAX_V0_FILE_BYTES)}.</p>
        )}

        <button className="primary" type="button" onClick={handleHash} disabled={!file || isHashing}>
          {isHashing ? 'Calculating SHA-256…' : 'Calculate SHA-256'}
        </button>

        {hash ? (
          <div className="result" aria-live="polite">
            <span>SHA-256 / file fingerprint</span>
            <code>{hash}</code>
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
          <strong>Local</strong>
          <span>The file stays on this device.</span>
        </div>
        <div>
          <strong>Minimal</strong>
          <span>Only proof data will go on-chain.</span>
        </div>
        <div>
          <strong>Independent</strong>
          <span>Verification must not depend on ProofStamp staying online.</span>
        </div>
      </section>

      <footer>
        <p>
          A ProofStamp can prove that specific bytes were recorded at a time. It does not prove that
          the content is true or authentic.
        </p>
      </footer>
    </main>
  );
}
