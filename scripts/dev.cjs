const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

//const viteProcess = spawn('node_modules/.bin/vite', ['build', '--watch', '--mode', 'development'], {
//    stdio: 'inherit',
//    shell: true,
//});

/** @type {() => Promise<import('child_process').ChildProcess>} */
function startViteProcess() {
    return new Promise((resolve, reject) => {
        const command = {
            windows: {
                cmd: '.\\node_modules\\.bin\\vite.cmd',
                args: [
                    '--strictPort',
                    '--host', '0.0.0.0',
                    '--port', '5070',
                    '--mode', 'development',
                ],
            },
            posix: {
                cmd: './node_modules/.bin/vite',
                args: [
                    '--strictPort',
                    '--host', '0.0.0.0',
                    '--port', '5070',
                    '--mode', 'development',
                ],
            },
        }
        const isWindows = process.platform === 'win32';
        const viteProcess = spawn(
            isWindows ? command.windows.cmd : command.posix.cmd,
            isWindows ? command.windows.args : command.posix.args,
            {
                stdio: 'inherit',
                shell: true,
            }
        );

        viteProcess.on('spawn', () => {
            resolve(viteProcess);
        });
    });
}

/** @type {() => Promise<import('child_process').ChildProcess>} */
function startBackendProcess() {
    return new Promise((resolve, reject) => {
        const backendProcess = spawn('python', ['backend/main.py', '--port', '5080'], {
            stdio: 'inherit',
            shell: true,
        });

        backendProcess.on('spawn', () => {
            resolve(backendProcess);
        });
    });
}

/**
 * @param {import('child_process').ChildProcess} process
 */
const waitForProcess = (process) => {
    return new Promise((resolve) => {
        process.on('exit', resolve);
    });
};

/**
 * @returns {Promise<void>}
 */
async function checkBackendHealth() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5080,
            path: '/ws',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            if (res.statusCode === 200) {
                resolve();
            } else {
                reject(new Error('Backend health check failed with status code: ' + res.statusCode));
            }
        });

        req.on('error', (e) => {
            reject(new Error('Backend health check failed'));
        });

        req.end();
    });
}

async function main() {
    // Start the backend process and wait for it to be ready
    const backendProcess = await startBackendProcess();
    while (true) {
        try {
            await checkBackendHealth();
            break;
        } catch (e) {
            if (backendProcess.exitCode !== null) {
                console.log('Backend process has exited');
                process.exit(1);
            }
            console.log(`Waiting for backend to start: ${e.message}`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
    // Start the vite process for development
    const viteProcess = await startViteProcess();

    // Wait for any of the processes to exit
    await Promise.race([
        waitForProcess(backendProcess),
        waitForProcess(viteProcess),
    ]);

    // Kill the other process
    if (backendProcess.exitCode === null) {
        backendProcess.kill('SIGINT');
    }
    if (viteProcess.exitCode === null) {
        viteProcess.kill('SIGINT');
    }

    console.log('All processes have exited');
    process.exit(0);
}

main()


