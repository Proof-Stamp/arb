import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const buildCommitSha = env.CF_PAGES_COMMIT_SHA || env.GITHUB_SHA || 'local';

  return {
    plugins: [react()],
    define: {
      __BUILD_COMMIT_SHA__: JSON.stringify(buildCommitSha),
    },
    resolve: {
      alias: [
        // @zerodev/sdk imports EventEmitter from Node's `events` module and
        // extends it at module scope. In a browser build Vite otherwise
        // externalizes the Node builtin, leaving EventEmitter undefined.
        // Point the exact bare import at the browser-compatible npm polyfill.
        { find: /^events$/, replacement: 'events/events.js' },
      ],
    },
  };
});
