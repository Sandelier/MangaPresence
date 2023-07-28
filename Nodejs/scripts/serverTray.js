const SysTray = require('systray').default;
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const pino = require('pino');
const http = require('http');
const path = require('path');


const logStream = fs.createWriteStream('logfile.txt', { flags: 'a' });
const logger = pino({ timestamp: pino.stdTimeFunctions.isoTime }, logStream);
const fileName = __filename;

// Lock file funcktioita jolla katotaan onko programmi jo käynnissä ja myöskin kattoo jos on vaan "stale" tiedosto
const lockFilePath = 'app.lock';

function checkAndCreateLockFile() {
  if (fs.existsSync(lockFilePath)) {
    const lockFileContent = fs.readFileSync(lockFilePath, 'utf8');
    const pid = parseInt(lockFileContent, 10);
    if (!isNaN(pid) && processExists(pid)) {
      logger.error({ fileName }, 'Another instance of the program is already running.');
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
      logger.error({ fileName }, 'Error deleting file.', err);
      return;
    }
  });
}

checkAndCreateLockFile();
process.on('exit', deleteLockFile);


let serverProcess;
// Pitää hankkia mikä platformi koska linuxi ja macci käyttää pngtä ja windowsi ico kuvaa
const platform = os.platform();
const iconPath = platform === 'win32' ? path.join(__dirname, '../' , 'icon', 'icon.ico') : path.join(__dirname, '../' , 'icon', 'icon.png');

// Tyhjentää login kun käynnistää ja tekee uuen
const logFile = "logfile.txt";
if (fs.existsSync(logFile)) {
  fs.truncateSync(logFile);
} else {
  fs.writeFileSync(logFile, '');
}


// Pistää sen kuvan base64 
function encodeImageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64String = imageBuffer.toString('base64');
  return base64String;
}


const base64Icon = encodeImageToBase64(iconPath);
// Tehään se tray ja pistetään start, stop ja exitti
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
      title: "Config",
      title: "Config files",
      checked: false,
      enabled: true,
    },
    {
      title: "Exit",
      tooltip: "Exit program",
      checked: false,
      enabled: true,
    },
  ],
};

const systray = new SysTray({
  menu: menuConfig,
  debug: false,
  copyDir: true,
});

// Pistetään configgi kiinni jos ei oo argumentti consoleShown
// Timeoutti pitää ola koska systray ei tykkää jos suoraan updatetat sitä. Tää on kyllä huono ratkasu että pitäs keksiä joku parempi myöhemmin
setTimeout(function() {
  if (process.argv[2] !== "ConsoleShown") {
    updateMenuItem(false, false, 3);
  }
}, 500);

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
      openConfig();
      break;
    case 4:
      stopServer();
      systray.kill();
      break;
  }
});

// Ottaa menuConfig.item[?], true ja falset ja seq_id
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
      logger.warn({ fileName }, `Child process exited with code ${code}`);
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

// Aukasee sen configsit toisessa terminaalissa niin toimii vaikka tää serverTray on hidden consolena.

let isConfigRunning = false;
function openConfig() {
  if (!isConfigRunning) {
    isConfigRunning = true;

    const scriptPath = path.join(__dirname, 'ConfigModify', 'configModifyGui.js');
    const configChild = childProcess.fork(scriptPath, [], { windowsHide: true });
    updateMenuItem(true, false, 3);

    configChild.on('exit', (code, signal) => {
      updateMenuItem(false, true, 3);
      isConfigRunning = false;
    });
  }
}

// Tätä käytetään jotta voidaan käynnistää child processi suoran täältä niin käyttäjän ei tarvii käynnistää ite.
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