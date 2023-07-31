const http = require('http');
const { updatePresence } = require('./discordPresence');
const DiscordRPC = require('discord-rpc');

let rateTimer = false;
const rateDuration = 15000;
let rateStartTime;
let heartBeatId;


async function createHttpServer(excludedArray, familiarArray, preferences, logger, clientId) {
	try {
		rpcInstance = await connenctToRpcAgain(clientId);
		const server = http.createServer((req, res) => {
			if (req.method === 'GET' && req.url === '/mangapresence/status') {
				sendResponse(res, 200, 'text/plain', 'OK');
			} else if (req.method === 'GET' && req.url === '/mangapresence/heartbeat') {
				handleHeartbeatRequest(req, res, server, logger);
			} else if (req.method === 'POST' && req.url === '/mangapresence/pageData') {
				const isRPCworking = handlePageDataRequest(req, res, logger, preferences, clientId);
				if (!isRPCworking) {
					server.close();
				}
			} else if (req.method === 'POST' && req.url === '/mangapresence/filterArrays') {
				handleFilterArraysRequest(req, res, excludedArray, familiarArray);
			} else if (req.method === 'GET' && req.url === '/mangapresence/closeRPC') {
				console.log("Closing RPC");
				if (rpcInstance) {
					rpcInstance.destroy();
					rpcInstance = null;
				}
			} else {
				sendResponse(res, 404, 'text/plain', 'Not found');
			}
		});

		const port = 56324;
		server.listen(port, 'localhost', () => {
			console.log(`Server running at http://localhost:${port}/`);
		});
	} catch (error) {
		console.error('Error trying to connect to RPC. Check if your clientId is correct.', clientId, " Also check if discord is running");
		logger.error({ fileName }, 'Error trying to connect to RPC. Check if your clientId is correct. Also check if discord is running', error);
	}
}

function sendResponse(res, statusCode, contentType, message, logToConsole = true) {
	res.statusCode = statusCode;
	res.setHeader('Content-Type', contentType);
	res.end(message);

	if (logToConsole) {
		console.log(`Response - Status: ${statusCode}, Message: ${message}`);
	}
}

function handleHeartbeatRequest(req, res, server, logger) {
	clearTimeout(heartBeatId);
	heartBeatId = setTimeout(() => {
		console.log("Server closing due to inactivity.");
		server.close(() => {
			const fileName = __filename;
			logger.info({ fileName }, 'Server was closed due to inactivity.');
			throw new Error('Server closed due to inactivity');
		});
	}, 3 * (60 * 1000));
	sendResponse(res, 200, 'text/plain', 'Ok');
}

let rpcInstance = null;
async function handlePageDataRequest(req, res, logger, preferences, clientId) {
    let data = '';
    req.on('data', (chunk) => {
        data = chunk;
    });

    req.on('end', async () => {
        if (!rateTimer) {
            const parsedData = JSON.parse(data);

            // Tuo falsen jos vanha details ja vanha state on sama kuin nykysessä pagessa niin ei tuhlaa ratelimittii.

            if (rpcInstance === null) {
                rpcInstance = await connenctToRpcAgain(clientId);
            }

            if (rpcInstance != null) {
                const useRateTimer = updatePresence(rpcInstance, parsedData, logger, preferences);

                if (useRateTimer) {
                    rateTimer = true;

                    setTimeout(() => {
                        rateTimer = false;
                    }, rateDuration);

                    rateStartTime = Date.now();

                    sendResponse(res, 200, 'text/plain', 'Presence päivitetty');
                } else {
                    sendResponse(res, 204, 'text/plain', 'Updated page dosent have any additional content.');
                }
                return true;
            } else {
                return false;
            }
        } else {
            const timeLeft = Math.floor(rateDuration - (Date.now() - rateStartTime)) / 1000;
            sendResponse(res, 429, 'text/plain', `Too many requests. Wait: ${timeLeft} seconds.`);
        }
    });
}

async function connenctToRpcAgain(clientId) {
	console.log("Connecting again to RPC");
	const RPC = new DiscordRPC.Client({ transport: 'ipc' });
	try {
		await RPC.login({ clientId });
		return RPC;
	} catch (error) {
		console.error('Error trying to connect to RPC. Check if your clientId is correct.', clientId, " Also check if discord is running");
		logger.error({ fileName }, 'Error trying to connect to RPC. Check if your clientId is correct. Also check if discord is running', error);
		return null;
	}
}

function handleFilterArraysRequest(req, res, excludedArray, familiarArray) {
	const response = {
		Familiar: familiarArray,
		Excluded: excludedArray
	};
	sendResponse(res, 200, 'application/json', JSON.stringify(response), false);
}

module.exports = { createHttpServer };