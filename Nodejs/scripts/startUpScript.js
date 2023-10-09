const { spawn } = require('child_process');
const path = require('path');

const serverTray = path.join(__dirname, 'serverTray.js');
const nodeExecutable = process.execPath;

// Just starts up the serverTray. If no arguments is given then it will launch it in hidden mode and otherwise it will launch it with shell.
if (process.argv.length > 2) {
    // Have to add the command into double quotes or otherwise it cant handle spaces in the path.
    const command = `"${nodeExecutable}" "${serverTray}"`;
    spawn(command, [], {
        stdio: 'ignore',
        shell: true,
        detached: true,
    });
} else {
    spawn(nodeExecutable, [serverTray], {
        stdio: 'ignore',
        detached: true,
    });
}


process.exit();