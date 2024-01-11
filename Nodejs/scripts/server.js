const http = require('http');
const { updatePresence, resetOldData } = require('./discordPresence');
const DiscordRPC = require('discord-rpc');
const fs = require('fs').promises;
const path = require('path');

let rateTimer = false;
const rateDuration = 15000;
let rateStartTime;
let heartBeatId;


// Defining them because we need to update them in handleUpdateArrayRequest
// Will most likely make it just that handleUpdateArrayRequest returns the array so we dont need to make these variables into global.
let excludedSites; 
let familiarArray;
let preferences;

async function createHttpServer(excluded, familiar, preferenceArray, clientId) {
	excludedSites = excluded;
	familiarArray = familiar;
	preferences = preferenceArray;

	try {
		rpcInstance = await connectToRpcAgain(clientId);
		const server = http.createServer((req, res) => {
			if (req.method === 'GET' && req.url === '/mangapresence/status') {
				console.log('Received status request');
				sendResponse(res, 200, 'text/plain', 'OK');
			} else if (req.method === 'GET' && req.url === '/mangapresence/heartbeat') {
				console.log('Received heartbeat request');
				handleHeartbeatRequest(req, res, server);
			} else if (req.method === 'POST' && req.url === '/mangapresence/pageData') {
				console.log('Received pageData request');
				const isRPCworking = handlePageDataRequest(req, res, preferences, clientId);
				if (!isRPCworking) {
					console.log('RPC is not working. Closing server.');
					server.close();
				}
			} else if (req.method === 'POST' && req.url === '/mangapresence/filterArrays') {
				console.log('Received filterArrays request');
				handleFilterArraysRequest(req, res, excludedSites, familiarArray, preferences);
			} else if (req.method === 'GET' && req.url === '/mangapresence/closeRPC') {
				console.log('Received closeRPC request. Closing RPC');
				if (rpcInstance) {
					rpcInstance.destroy();
					rpcInstance = null;
					resetOldData(); // Removes old state and details.
				}
			} else if (req.method === 'POST' && req.url === '/mangapresence/updateArray') {
				console.log('Received updateArray request');
				handleUpdateArrayRequest(req, res);
			} else {
				console.log('Received unknown request');
				sendResponse(res, 404, 'text/plain', 'Not found');
			}
		});

		const port = 56324;
		server.listen(port, 'localhost', () => {
			console.log(`Server running at http://localhost:${port}/`);
		});
	} catch (error) {
		console.error('Error trying to connect to RPC. Check if your clientId is correct.  Also check if discord is running', error);
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

function handleHeartbeatRequest(req, res, server ) {
	clearTimeout(heartBeatId);
	heartBeatId = setTimeout(() => {
		console.log("Server closing due to inactivity.");
		server.close(() => {
			throw new Error('Server closed due to inactivity');
		});
	}, 1 * (60 * 1000) + 10000);
	sendResponse(res, 200, 'text/plain', 'Ok');
}

let rpcInstance = null;
async function handlePageDataRequest(req, res, preferences, clientId) {
    let data = '';
    req.on('data', (chunk) => {
        data += chunk;
    });

    req.on('end', async () => {
        if (!rateTimer) {
            const parsedData = JSON.parse(data);

			// Returns false if old details and state is same as current page so that it dosent waste ratelimit.
            if (rpcInstance === null) {
                rpcInstance = await connectToRpcAgain(clientId);
            }

            if (rpcInstance != null) {
                const result = updatePresence(rpcInstance, parsedData, preferences);


                if (result.success == true) {
                    rateTimer = true;

                    setTimeout(() => {
                        rateTimer = false;
                    }, rateDuration);

                    rateStartTime = Date.now();

                    sendResponse(res, 200, 'text/plain', 'Presence updated', true);
                } else {
                    sendResponse(res, result.errorCode, 'text/plain', result.error, true);
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


async function handleUpdateArrayRequest(req, res) {
	let data = '';
    req.on('data', (chunk) => {
        data += chunk;
    });

	req.on('end', async () => {
		try {
			const parsedData = JSON.parse(data);
			const arrayName = parsedData.arrayName;
			const userUpdatedArray = parsedData.updatedArray;
			switch (arrayName) {
				case 'familiarArray':
					tryToCreateNewFile(arrayName, userUpdatedArray, res);
					familiarArray = userUpdatedArray;
					break;
				case 'excludedSites':
					tryToCreateNewFile(arrayName, userUpdatedArray, res);
					excludedSites = userUpdatedArray;
					break;
				case 'preferences':
					tryToCreateNewFile(arrayName, userUpdatedArray, res);
					preferences = userUpdatedArray;
					break;
				default:
					console.error(`Unknown array name given. ${arrayName}`);
					sendResponse(res, 404, 'text/plain', `Unknown array name given. ${arrayName}`);
					break;
			}
		} catch (error) {
			console.error(`Error parsing data to JSON for updateArray ${error}`);
			sendResponse(res, 500, 'text/plain', `Error parsing updated array into JSON.`);
		}
	});
}

async function tryToCreateNewFile(arrayname, userUpdatedArray, res) {
	const configFolderPath = path.join(path.dirname(process.execPath), '..', 'configs');
	const filePath = path.join(configFolderPath, `${arrayname}.json`);

	try {

		const currentContent = await readJSONFile(filePath);
		const isSameContent = JSON.stringify(currentContent) === JSON.stringify(userUpdatedArray);

		if (!isSameContent) {
			const newFilePath = path.join(configFolderPath, `${arrayname}1.json`);

			await renameFile(filePath, newFilePath);
		
			await createAndWriteJSON(filePath, userUpdatedArray);
	
			sendResponse(res, 200, 'application/json', JSON.stringify({ message: 'Successfully updated new array.', array: userUpdatedArray }, false));
		} else if (isSameContent == null) {
			sendResponse(res, 500, 'text/plain', 'Server encountered error while trying to read old json file.');
		} else {
			console.warn(`Not updating ${arrayname} because the content was same.`);
			sendResponse(res, 200, 'text/plain', `Not updating ${arrayname} since content was the same.`);
		}
	} catch (error) {
		console.error(`Error occured in tryToCreateNewFile while trying to read files. ${error}`);
		sendResponse(res, 500, 'text/plain', 'Error occured while handling new updated array');
	}
}

async function readJSONFile(filePath) {
	try {
		const fileContent = await fs.readFile(filePath, 'utf-8');
		return JSON.parse(fileContent);
	} catch (error) {
		console.error(`Error occured while reading old json file for ${filePath}. ${error}`);
		return null;
	}

}

async function renameFile(oldPath, newPath) {
	try {
	  	await fs.rename(oldPath, newPath);
		console.log(`Renamed: ${oldPath} to ${newPath}`);
	} catch (err) {
	  	console.error(`Error renaming file: ${err}`);
	}
}
  
async function createAndWriteJSON(filePath, data) {
	try {
		await fs.writeFile(filePath, JSON.stringify(data, null, 2));
		console.log(`Created and wrote JSON to: ${filePath}`);
	} catch (err) {
		console.error(`Error creating/writing JSON: ${err}`);
	}
}


async function connectToRpcAgain(clientId) {
	console.log("Connecting again to RPC");
	const RPC = new DiscordRPC.Client({ transport: 'ipc' });
	try {
		await RPC.login({ clientId });
		return RPC;
	} catch (error) {
		console.error('Error trying to connect to RPC. Check if your clientId is correct.  Also check if discord is running', error);
		return null;
	}
}

function handleFilterArraysRequest(req, res, excludedSites, familiarArray, preferencesArray) {
	const response = {
		Familiar: familiarArray,
		Excluded: excludedSites,
		Preferences: preferencesArray,
	};
	sendResponse(res, 200, 'application/json', JSON.stringify(response), false);
}

module.exports = { createHttpServer };