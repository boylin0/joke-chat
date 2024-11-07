const { spawn } = require('child_process');
const {loadEnv} = require('vite');

//const viteProcess = spawn('node_modules/.bin/vite', ['build', '--watch', '--mode', 'development'], {
//    stdio: 'inherit',
//    shell: true,
//});

const viteProcess = spawn('node_modules/.bin/vite',
    [  
        '--strictPort',
        '--port', '5070',
        '--mode', 'development',
    ], {
    stdio: 'inherit',
    shell: true,
});

viteProcess.on('close', (code) => {
    process.exit(code);
});

const backendProcess = spawn('python3', ['backend/main.py', '--port', '5080'], {
    stdio: 'inherit',
    shell: true,
});

backendProcess.on('close', (code) => {
    process.exit(code);
});
