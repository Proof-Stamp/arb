import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // @zerodev/sdk imports EventEmitter from Node's `events` module and
      // extends it at module scope. In a browser build Vite otherwise
      // externalizes the Node builtin, leaving EventEmitter undefined.
      // Point the exact bare import at the browser-compatible npm polyfill.
      { find: /^events$/, replacement: 'events/events.js' },
    ],
  },
});
