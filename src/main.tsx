import 'reflect-metadata';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './mobile-progress';
import './brand-tokens.css';
import './styles.css';

const STALE_CHUNK_RELOAD_KEY = 'proofstamp:stale-chunk-reload';

// A user can keep an older Vite bundle open while Cloudflare switches to a
// newer deployment. If that older bundle later requests a lazy-loaded chunk
// that no longer exists at the stable Pages URL, Vite emits this event.
// Reload once so the browser receives the current deployment manifest.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();

  if (sessionStorage.getItem(STALE_CHUNK_RELOAD_KEY)) return;

  sessionStorage.setItem(STALE_CHUNK_RELOAD_KEY, '1');
  window.location.reload();
});

// A successful page load clears the one-shot guard after startup. Keeping the
// marker briefly prevents a persistent network/server failure from causing a
// reload loop.
window.setTimeout(() => {
  sessionStorage.removeItem(STALE_CHUNK_RELOAD_KEY);
}, 5000);

const root = document.getElementById('root');

if (!root) {
  throw new Error('Application root element was not found.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
