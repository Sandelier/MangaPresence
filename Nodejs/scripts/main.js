const fs = require('fs');
const { createHttpServer } = require('./server');
const pino = require('pino');

const logStream = fs.createWriteStream('logfile.txt', { flags: 'a' });
const logger = pino({ timestamp: pino.stdTimeFunctions.isoTime }, logStream);
const fileName = __filename;

function readFile(filePath, init) {
	return new Promise((resolve, reject) => {
		if (!fs.existsSync(filePath)) {
			if (init) {
				fs.writeFileSync(filePath, JSON.stringify(init, null, 2), 'utf8');
			} else {
				const emptyData = '[]';
				fs.writeFileSync(filePath, emptyData, 'utf8');
			}
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

// Käytetään koska ennen jos yksi tiedosto kusi tuossa promise.allissa niin mitään ei ladattu.
async function readFileSafe(file, init) {
	try {
		return await readFile(file, init);
	} catch (error) {
		console.error(`Error while reading ${file}:`, error);
		return null;
	}
}

// Lukee tiedostot ja käynnistää RPC:n
// Sitten tekee http serverin
async function main() {
	try {
		const familInit = [{ "useFamiliarArrayOnly": false }];
		const [excludedArray, jsonData, familiarArray, preferences] = await Promise.all([
			readFileSafe('configs/excludedArray.json'),
			readFileSafe('configs/clientId.json'),
			readFileSafe('configs/familiarArray.json', familInit),
			readFileSafe('configs/preferences.json')
		]);

		const clientId = jsonData.clientId;

		if (clientId && 10 < clientId.length) {
			createHttpServer(excludedArray, familiarArray, preferences, logger, clientId);
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