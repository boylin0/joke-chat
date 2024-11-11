const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { watch } = require('fs');

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
            isWindows ? command.windows.cmd : command.windows.args,
            isWindows ? command.windows.args : command.posix.args,
            {
                shell: true,
            }
        );

        viteProcess.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        viteProcess.on('spawn', () => {
            resolve(viteProcess);
        });
    });
}

/** @type {() => Promise<import('child_process').ChildProcess>} */
function startBackendProcess() {
    return new Promise((resolve, reject) => {
        const backendProcess = spawn('python', ['backend/main.py', '--port', '5080'], {
        });

        backendProcess.stdout.on('data', (data) => {
            console.log(data.toString());
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
    // Start the vite process for development
    let viteProcess = await startViteProcess();
    let backendProcess = await startBackendProcess();
    while (true) {
        try {
            await checkBackendHealth();
            break;
        } catch (e) {
            console.log(`Waiting for backend to start: ${e.message}`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    // Watch backend directory for changes
    watch(path.resolve(__dirname, '../backend'), { recursive: true }, async (eventType, filename) => {
        if (eventType === 'change' && filename.endsWith('.py')) {
            console.log(`Python file changed: ${filename}`);

            // Kill existing backend process
            if (backendProcess) {
                backendProcess.kill();
                console.log('Restarting backend process')
            }

            // Start new backend process
            try {
                backendProcess = await startBackendProcess();
                while (true) {
                    try {
                        await checkBackendHealth();
                        break;
                    } catch (e) {
                        console.log(`Waiting for backend to start: ${e.message}`);
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                    }
                }
                console.log('Started new backend process');
            } catch (error) {
                console.error('Failed to start backend process:', error);
            }
        }
    });

}

// Handle process termination
process.on('SIGINT', () => {
    console.log('Received SIGINT. Cleaning up...');
    process.exit(0);
});

main().catch(error => {
    console.error('Error in main:', error);
    process.exit(1);
});
