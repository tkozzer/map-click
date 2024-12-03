/** @type {import('vite').UserConfig} */
const config = {
    root: '.',
    server: {
        port: 3000,
        host: true
    },
    build: {
        outDir: 'dist'
    }
};

export default config; 