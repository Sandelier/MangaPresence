const { spawn } = require('child_process');
const path = require('path');

const serverTray = path.join(__dirname, 'serverTray.js');

// Just starts up the serverTray. If no arguments is given then it will launch it in hidden mode and otherwise it will launch it with shell.
if (process.argv.length > 2) {
    spawn('node', [serverTray], {
        stdio: 'ignore',
        shell: true,
        detached: true,
    });
} else {
    spawn('node', [serverTray], {
        stdio: 'ignore',
        detached: true,
    });
}


process.exit();