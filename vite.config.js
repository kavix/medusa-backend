const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')

module.exports = defineConfig({
    plugins: [react()],
    root: './frontend',
    build: {
        outDir: '../dist',
        emptyOutDir: true
    },
    server: {
        proxy: {
            '/login': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    }
})