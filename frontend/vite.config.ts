import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
import proxyOptions from './proxyOptions';
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
        react(),
        tailwindcss()
    ],
	server: {
		port: 8080,
		host: '0.0.0.0',
		proxy: proxyOptions,
        allowedHosts: ['badmc.cooltrack.co']
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src')
		}
	},
	build: {
		outDir: '../cooltrack/public/frontend',
		emptyOutDir: true,
		target: 'es2015',
	},
});