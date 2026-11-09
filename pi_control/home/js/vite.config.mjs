import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../static/js'),
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'app.tsx'),
      name: 'MalinaApp',
      formats: ['iife'],
      fileName: () => 'app.js',
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
});
