/* global document, ResizeObserver */

(() => {
  const root = document.getElementById('ps-branded-demo');
  const q = (s) => root.querySelector(s);
  const buttons = [...root.querySelectorAll('[data-step]')];
  const original = '18714e8fe0b77abba8767969e2b4907a36708b8132a746c1e55be674dc0a829d';
  const edited = 'dd80eee257d0d2c778ea212156b45cc360fa90e2a0a189adb0469f4ce1b57ed7';
  const grouped = (h) => h.match(/.{1,16}/g).join('\n');
  const states = [
    ['File prepared locally', 'The hash is ready. The original file is not uploaded.', 'prepared'],
    [
      'Your example ProofStamp is ready',
      'The browser reads and validates the public record. Keep the original file and its .txt receipt.',
      'recorded',
    ],
    [
      'Match · Same file bytes',
      'This file matches the hash recorded at the simulated time shown above.',
      'match',
    ],
    [
      'Mismatch · Different file bytes',
      'The edited copy has a different hash. The recorded hash and time stay the same.',
      'mismatch',
    ],
  ];
  function show(s) {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.step) === s)));
    q('#ps-message').textContent = s === 3 ? 'Refund denied.' : 'Refund approved.';
    q('#ps-message').parentElement.classList.toggle('is-edited', s === 3);
    q('#ps-copy-label').textContent = s === 3 ? 'Edited copy' : 'Original copy';
    q('#ps-local-digest').textContent = grouped(s === 3 ? edited : original);
    q('#ps-local-digest').classList.toggle('is-edited', s === 3);
    q('#ps-public-digest').textContent = s === 0 ? 'Not recorded yet' : grouped(original);
    q('#ps-record-time').textContent =
      s === 0 ? 'Not recorded yet' : '7 Oct 2026\n20:00 UTC · simulated';
    q('#ps-record-label').textContent = s === 0 ? 'Ready to record' : 'Recorded version';
    q('#ps-proof-marker').hidden = s === 0;
    q('#ps-arrow').textContent = s < 2 ? '→' : '←';
    if (root.getBoundingClientRect().width <= 580) q('#ps-arrow').textContent = s < 2 ? '↓' : '↑';
    q('#ps-path-label').textContent = s < 2 ? 'Hash only' : 'Read record';
    q('#ps-local-note').textContent =
      s === 1
        ? 'Passkey authorization · sponsored gas via ZeroDev'
        : s >= 2
          ? 'The browser hashes and compares locally.'
          : 'The original file stays on your device.';
    q('#ps-status').textContent = states[s][0];
    q('#ps-detail').textContent = states[s][1];
    q('.ps-result').dataset.result = states[s][2];
  }
  let selected = 0;
  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      selected = Number(b.dataset.step);
      show(selected);
    }),
  );
  new ResizeObserver(() => show(selected)).observe(root);
  show(0);
})();
