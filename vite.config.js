// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       '/api': 'http://localhost:5000',
//       '/orderbook': {
//         target: 'ws://localhost:5000',
//         ws: true
//       }
//     }
//   }
// })

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',      // Expose to network
    port: 5175,           // Fixed port
    strictPort: true,     // Don't allow auto-port change
    proxy: {              // Optional: keep your proxy setup
      '/api': 'http://localhost:5000',
      '/orderbook': {
        target: 'ws://localhost:5000',
        ws: true
      }
    }
  }
});
