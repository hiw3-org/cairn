import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [
        nodePolyfills({
          // Enable polyfills for specific globals and modules
          globals: {
            Buffer: true,
            global: true,
            process: true,
          },
          // Whether to polyfill specific node built-in modules
          protocolImports: true,
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.REACT_APP_PRIVY_APP_ID': JSON.stringify(env.REACT_APP_PRIVY_APP_ID),
        global: 'globalThis',
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          buffer: 'buffer',
        }
      }
    };
});
