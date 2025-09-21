
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});