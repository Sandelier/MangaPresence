const SysTray = require('systray').default;
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const http = require('http');
const path = require('path');
const { exec } = require('child_process');


const fileName = __filename;

const currentVersion = "v.2.0.2";

// Lock file functions that checks if program is already open and also checking if the file is stale
const lockFilePath = 'app.lock';

function checkAndCreateLockFile() {
	if (fs.existsSync(lockFilePath)) {
		const lockFileContent = fs.readFileSync(lockFilePath, 'utf8');
		const pid = parseInt(lockFileContent, 10);
		if (!isNaN(pid) && processExists(pid)) {
			console.error({ fileName }, 'Another instance of the program is already running.');
			process.exit(0);
		} else {
			fs.rmSync(lockFilePath);
		}
	}

	fs.writeFileSync(lockFilePath, process.pid.toString());
}

function processExists(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		return false;
	}
}

function deleteLockFile() {
	fs.unlink(lockFilePath, (err) => {
		if (err) {
			console.error({ fileName }, 'Error deleting file.', err);
			return;
		}
	});
}

checkAndCreateLockFile();
process.on('exit', deleteLockFile);


let serverProcess;
// Getting platform icon. Linux and max uses png and windows ico.
const platform = os.platform();
const iconPath = platform === 'win32' ? path.join(__dirname, '../', 'icon', 'icon.ico') : path.join(__dirname, '../', 'icon', 'icon.png');

// Puts the image to base64
function encodeImageToBase64(imagePath) {
	const imageBuffer = fs.readFileSync(imagePath);
	const base64String = imageBuffer.toString('base64');
	return base64String;
}


const base64Icon = encodeImageToBase64(iconPath);
const menuConfig = {
	icon: base64Icon,
	title: "MangaPresence",
	tooltip: "MangaPresence Server",
	items: [
	{
		title: "Start",
		tooltip: "Start server",
		checked: false,
		enabled: true,
	},
	{
		title: "Stop",
		tooltip: "Stop server",
		checked: false,
		enabled: false,
	},
	{
		title: "Reload",
		tooltip: "Reload server",
		checked: false,
		enabled: false,
	},
	{
		title: "Exit",
		tooltip: "Exit program",
		checked: false,
		enabled: true,
	},
	{
		title: "Check Updates",
		tooltip: "Check Updates",
		checked: false,
		enabled: true,
	},
	{
		title: "Update",
		tooltip: "Update",
		checked: false,
		enabled: false,
	}],
};

const systray = new SysTray({
	menu: menuConfig,
	debug: false,
	copyDir: true,
});

let newestRelease = "https://github.com/Sandelier/MangaPresence/releases/latest";
systray.onClick((action) => {
	switch (action.seq_id) {
		case 0:
			startServer();
			break;
		case 1:
			stopServer();
			break;
		case 2:
			reloadServer();
			break;
		case 3:
			stopServer();
			systray.kill();
			break;
		case 4:
			updateMenuItem(false, false, 4);
			checkNewestRelease();
			break;
		case 5:
			if (os.platform() === 'win32') {
				exec(`start ${newestRelease}`);
			} else if (os.platform() === 'darwin') {
				exec(`open ${newestRelease}`);
			} else {
				exec(`xdg-open ${newestRelease}`);
			}
			break;
	}
});

// Checks if there is new releases.
async function checkNewestRelease() {
	try {
		const response = await fetch('https://api.github.com/repos/Sandelier/MangaPresence/releases/latest', {
			method: 'GET',
			headers: {
				'User-Agent': 'Node.js'
			}
	});
		const latestRelease = await response.json();
	  	if (latestRelease !== null && latestRelease.tag_name !== undefined) {
			if (currentVersion !== latestRelease.tag_name) {
				console.log(`A new version (${latestRelease.tag_name}) is available. You are using ${currentVersion}.`);
				updateMenuItem(false, true, 5);
			} else {
				console.log(`You are using the latest version (${currentVersion}).`);
			}
		} else {
			console.log(`Unable to fetch the latest version information.`);
		}
	} catch (error) {
		console.error('Error checking for updates:', error.message);
	}

	updateMenuItem(false, true, 4);
}

// Helper method to update menu items easily.
function updateMenuItem(checked, enabled, seq_id) {

	const item = menuConfig.items[seq_id];
	item.checked = checked;
	item.enabled = enabled;

	systray.sendAction({
		type: 'update-item',
		item,
		seq_id,
	});
}

let isServerRunning = false;

function startServer() {
	if (!isServerRunning) {
		isServerRunning = true;

		serverProcess = childProcess.fork(path.join(__dirname, 'main.js'), [], { windowsHide: true });
		serverProcess.on('exit', (code, signal) => {
			console.log("Serverprocessi loppuu");
			isServerRunning = false;
			updateMenuItem(false, true, 0);
			updateMenuItem(false, false, 1);
			updateMenuItem(false, false, 2);
		});

		updateMenuItem(true, false, 0);
		updateMenuItem(false, true, 1);
		updateMenuItem(false, true, 2);
	}
}

function reloadServer() {
	if (serverProcess) {
		stopServer();
		startServer();
	}
}

function stopServer() {
	if (serverProcess) {
		serverProcess.kill();
		serverProcess = null;
		isServerRunning = false;

		// Start, stop, reload
		updateMenuItem(false, true, 0);
		updateMenuItem(false, false, 1);
		updateMenuItem(false, false, 2);
	}
}

// This is used so that we can start child process right in here without needing user input.
let startupServer;

function createStartupServer() {
	startupServer = http.createServer((req, res) => {
		console.log("Start up server");
		if (req.method === 'GET' && req.url === '/serverTray/startServer') {
			if (!isServerRunning) {
				startServer();
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('Server started successfully.');
			} else {
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('Server is already running.');
			}
		} else {
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.end('Not found.');
		}
	});

	const port = 56326;
	startupServer.listen(port, 'localhost', () => {
		console.log(`Extension server running at http://localhost:${port}/`);
	});
}

createStartupServer();