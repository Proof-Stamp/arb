import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @zerodev/sdk uses Node's EventEmitter API in its EIP-1193 provider.
      // Force the browser-compatible npm implementation when bundling with Vite.
      events: 'events/',
    },
  },
});
