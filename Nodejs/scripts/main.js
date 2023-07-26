const DiscordRPC = require('discord-rpc');
const fs = require('fs');
const { createHttpServer } = require('./server');
const pino = require('pino');

const logStream = fs.createWriteStream('logfile.txt', { flags: 'a' });
const logger = pino({ timestamp: pino.stdTimeFunctions.isoTime }, logStream);
const fileName = __filename;

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      const emptyData = '[]';
      fs.writeFileSync(filePath, emptyData, 'utf8');
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        logger.error({ fileName }, 'Error occurred while trying to read.', filePath, err);
        console.log('Error occured while trying to read.', filePath, err);
        reject(err);
        return;
      }
      try {
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      } catch (error) {
        logger.error({ fileName }, 'Error occurred while trying to parse JSON.', filePath, error);
        reject(error);
      }
    });
  });
}

// Lukee tiedostot ja käynnistää RPC:n
// Sitten tekee http serverin
async function main() {
    try {
        const [excludedArray, jsonData, familiarArray] = await Promise.all([
            readFile('configs/excludedArray.json'),
            readFile('configs/clientId.json'),
            readFile('configs/familiarArray.json')
        ]);

        const clientId = jsonData.clientId;

        if (clientId && 10 < clientId.length) {
          const RPC = new DiscordRPC.Client({ transport: 'ipc' });
          try {
              await RPC.login({ clientId });
              createHttpServer(excludedArray, familiarArray, RPC, logger);
          } catch (error) {
              console.error('Error trying to connect to RPC. Check if your clientId is correct.', clientId, " Also check if discord is running");
              logger.error({ fileName }, 'Error trying to connect to RPC. Check if your clientId is correct. Also check if discord is running', error);
          }
        } else {
            logger.error({ fileName }, 'Clientid is too small. Clientid');
            console.error('Clientid is too small.');
        }
    } catch (error) {
        logger.error({ fileName }, 'Error occured', error);
        console.error(error);
    }
}

main();