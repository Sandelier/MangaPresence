let serverOkLock = false;

const serverUrl = 'http://localhost:56324/mangapresence';
const ServerStatusUrl = `${serverUrl}/status`;
const ServerArrayUrl = `${serverUrl}/filterArrays`;
const ServerHeartbeatUrl = `${serverUrl}/heartbeat`;
const ServerPageDataUrl = `${serverUrl}/pageData`;
const ServerUpdateArray = `${serverUrl}/updateArray`;
const ServerPresenceClose = `${serverUrl}/closeRPC`;
const ServerStartUpUrl = 'http://localhost:56326/serverTray/startServer'




// Listens to tabs always if it hasnt connected to server and tries to start up the server.
let isTabServerListenerActive = false;
const tabListenerStartServer = () => { 
	console.log("tabListenerStartServer", isTabServerListenerActive);
	if (!isTabServerListenerActive) {
		isTabServerListenerActive = true;
		checkServer();
	}
};

chrome.tabs.onActivated.addListener(tabListenerStartServer);
chrome.tabs.onUpdated.addListener(tabListenerStartServer);

const maxRetries = 5;
let retryCount = 0;

// Checks if server is on and tries to start it up.
async function checkServer() {
	console.log("checkServer activated");
	if (!serverOkLock && retryCount < maxRetries) {
		try {
			const startupResponse = await fetch(ServerStartUpUrl);
			console.log("startUpResponse", startupResponse)
			if (startupResponse.ok) {
				console.log('Server is starting up');
				setTimeout(async () => {
					try {
						const response = await fetch(ServerStatusUrl);
						if (response.ok && !serverOkLock) {
							console.log('Server is OK');
							serverOkLock = true;
							retryCount = 0;
							isTabServerListenerActive = false;
							chrome.tabs.onActivated.removeListener(tabListenerStartServer);
							chrome.tabs.onUpdated.removeListener(tabListenerStartServer);
							startExtension();
	
						} else {
							retryCount++;
							checkServer();
						}
						isTabServerListenerActive = false;
					} catch (error) {
						console.error("Couldn't talk with the server:", error);
						isTabServerListenerActive = false;
					}
				}, 2000);
			}
		} catch (error) {
			console.error("Couldn't talk with the server:", error);
			isTabServerListenerActive = false;
		}
	} else {
		retryCount = 0;
		isTabServerListenerActive = false;
	}
}

// From down here everything is startextension stuff.

async function startExtension() {
	try {
		console.log("Starting extension");

		await fetchArrays();

		serverHeartBeat();

		toggleEventListeners(true);
		toggleMessageListener(true);

		getCurrentTab().then(tabs => {
			const currentTab = tabs[0];
			if (currentTab.status === "complete" && currentTab.url) {
				checkTabUrl(currentTab.url, currentTab.id);
			}
		});
	} catch (error) {
		console.error(error);
		restoreDefault();
	}
}


let arrays = {
	familiarArray: [],
	excludedSites: [],
	preferences: []
}

async function fetchArrays() {
	try {
		const arrayResponse = await fetch(ServerArrayUrl, {
			method: 'POST'
		});
		const arrayData = await arrayResponse.json();
		arrays.familiarArray = arrayData.Familiar;

		for (const obj of arrays.familiarArray) {
			if (obj.useFamiliarArrayOnly !== undefined) {
			  console.log('useFamiliarArrayOnly:', obj.useFamiliarArrayOnly);
			}
			if (obj.displayLookingState !== undefined) {
			  console.log('displayLookingState:', obj.displayLookingState);
			}
		}

		arrays.excludedSites = arrayData.Excluded;
		arrays.preferences = arrayData.Preferences;
		console.info('Fetced arrays.');
    } catch (error) {
        console.error('Failed to fetch arrays', error);
		restoreDefault();
    }
}

// Checking every once in a while if server is working.
async function serverHeartBeat() {
	const Heartbeat_5 = 60 * 1000;
	try {
		const response = await fetch(ServerHeartbeatUrl);
		if (response.ok) {
			console.log('Server is OK');
			setTimeout(serverHeartBeat, Heartbeat_5);
		} else {
			console.error('Heartbeat response was not ok', response);
			restoreDefault();
		}
	} catch (error) {
		console.error('Heartbeat error:', error);
		restoreDefault();
	}
}


let contentScriptInjected = false;
async function executeContentScript(tabId) {
  try {
	console.log("Executing content script"); //
    if (!contentScriptInjected) {
      await chrome.tabs.executeScript(tabId, {
        file: 'contentScript.js'
      });
      contentScriptInjected = true;
    }

    await chrome.tabs.sendMessage(tabId, {
      action: 'PageData',
      familiarArray: arrays.familiarArray
    });
  } catch (error) {
    console.error('Failed to execute content script:', error);
    restoreDefault();
  }
}

let oldUrl = "";
let oldChEp = "";
let timerId;
const automaticSearchTime = 35 * 1000;

function handleMessage(message) {
	console.info("Handling message", message); 
	switch (message.action) {
		case 'PageData':
			const data = message.extractedData;
			if (data != false) {
				const { Type, title, chEp, url, imageKey, imageText, WatchTogether } = data;
				if (oldUrl !== url || oldChEp !== chEp) {
					const jsonObject = {
						type: Type,
						title: title,
						installment: chEp,
						url: url,
						imageKey: imageKey,
						imageText: imageText,
						W2State: WatchTogether
					};
					sendPageData(jsonObject, url, chEp);
				}
				clearTimeout(timerId);
				timerId = setTimeout(() => {
					getCurrentTab().then(tabs => {
						const currentTab = tabs[0];
						if (currentTab && currentTab.status === "complete" && currentTab.url) {
							checkTabUrl(currentTab.url, currentTab.id);
						}
					});
				}, automaticSearchTime);
			}
			break;
		case 'Console':
			switch (message.type) {
				case 'warn':
					console.warn(message.content);
					break;
				case 'info':
					console.info(message.content);
					break;
				default:
					console.error('Unknown console message type');
					break;
			}
			break;
		case 'PopupScript':
			handlePopupMessages(message.content);
			break;
		case 'PopupContentScriptRes':
			oldTab = '';
			sendPopupMessage(message.action, message);
			break;
		default:
			console.error('Unknown message');
			break;
	}
}

// Popup html script
function handlePopupMessages(content) {


	switch (content.type) {
		case 'isServerOn':
			sendPopupMessage(content.type, {type: 'isServerOn', data: serverOkLock});
			break;
		case 'updateArray':
			if (content.arrayName) {
				updateServerArray(content.arrayName, content.updatedArray);
			} else {
				console.error('Arrayname is missing from updateArray.');
			}
			break;
		case 'getArray':
			if (content.arrayName) {
				sendPopupMessage('array', {type: 'array', arrayName: content.arrayName, data: arrays[content.arrayName]});
			} else {
				console.error('Arrayname is missing from getArray.');
			}
			break;
		case 'getAllArrays':
			sendPopupMessage('allArray', {type: 'allArrays', arrayName: 'All', data: arrays});
			break;
		case 'getUrl':
			executePopupScript('getUrl', content);
			break;
		default:
			console.error(`Unknown action. ${action}`);
			break;
	}
}



let popupScriptInjected = false;
let oldTab;

async function executePopupScript(type, element) {
	try {
	  console.log("Executing popup script", type, element);
	  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
	  if (!popupScriptInjected || oldTab != activeTab.id) {

		popupScriptInjected = true;
		oldTab = activeTab.id;
  
		chrome.tabs.sendMessage(activeTab.id, {
			action: 'PopupRequest',
			type: type,
			element: element
		});

		}
	} catch (error) {
	  console.error('Failed to execute popup script:', error);
	}
}

/* Sends the updated array nd if its successfull it starts using it. */
async function updateServerArray(arrayName, updatedArray) {
	try {
		const response = await fetch(ServerUpdateArray, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({'arrayName': arrayName, 'updatedArray': updatedArray})
		});

		if (response.status === 200) {
			const responseMessage = await response.text();
			try {
				const contentType = response.headers.get('Content-Type');
				if (contentType.includes('application/json')) {
					const resmessage = JSON.parse(responseMessage);
					if (resmessage.message.startsWith('Success')) {
						const newUpdatedArray = resmessage.array;
						arrays[arrayName] = newUpdatedArray;
					} 
				} else {
					console.info(responseMessage);
				}
			} catch (error) {
				console.error(`Caught an error while trying to parse new array into json. ${error}`);
			}
		} else {
			const errorMessage = await response.text();
			console.error('Failed to send data', errorMessage);
		}
	} catch (error) {
		console.error('Caught error while trying to send updated arrays', error);
	}
}

function sendPopupMessage(action, message) {
	chrome.runtime.sendMessage({
		to: 'popup',
		action: action,
		data: message
	});
}

/* Content script */

async function sendPageData(jsonObject, url, chEp) {
	try {
		console.log("Sending page data"); //
		const response = await fetch(ServerPageDataUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(jsonObject)
		});

		switch (response.status) {
			case 429:
			  const tooMany = await response.text();
			  console.warn(tooMany);
			  break;
			case 200:
			  oldUrl = url;
			  oldChEp = chEp;
			  const responseMessage = await response.text();
			  console.log('Page data sent successfully', responseMessage);
			  break;
			case 204:
			  console.log('Page data sent successfully but not updating because no new content was found.');
			  break;
			default:
			  const errorMessage = await response.text();
			  console.error('Failed to send data', errorMessage);
		  }
	} catch (error) {
		console.error('Caught an error while trying to post pagedata.', error);
		restoreDefault();
	}
}

// Had to add an lock since previously everytime it was creating listeners uselessly.
let isMessageListenerActive = false;

function toggleMessageListener(enable) {
	console.log("TogglemessageListener", enable, isMessageListenerActive); //
	if (enable) {
		if (!isMessageListenerActive) {
			chrome.runtime.onMessage.addListener(handleMessage);
		}
	} else if (isMessageListenerActive) {
		chrome.runtime.onMessage.removeListener(handleMessage);
	}
	isMessageListenerActive = enable;
}

// When site is updated
const onUpdatedHandler = (tabId, changeInfo, tab) => {
	console.log("onUpdateHandler"); //
	if (changeInfo.status === "complete" && tab.url) {
		checkTabUrl(tab.url, tab.id);
	}
};

// When different tab is clicked
function getCurrentTab() {
    console.log("getCurrentTab");
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            resolve(tabs);
        });
    });
}

const onActivatedHandler = (activeInfo) => {
    getCurrentTab().then((tabs) => {
        const currentTab = tabs[0];
        if (currentTab.status === "complete" && currentTab.url) {
            checkTabUrl(currentTab.url, currentTab.id);
        }
    });
};

// I added this just in case so that it dosent try to scrape sensitive information.
function checkTabUrl(url, tabId) {
	const blackListKeywords = ["profile", "register", "login", "account", "password", "creditcard", "checkout", "account_settings", "personal_info", "private",
		"confidential", "secure", "payment", "admin_panel", "dashboard", "auth", "signin", "signup", "sign_up", "sign_in", "signout", "sign_out", "billing",
		"credit_card", "change_password", "reset_password", "account_info", "bank_account", "auth_token", "session", "api_key", "token", "access_token",
		"client_secret", "client_id", "password_reset", "password_change", "oauth", "unauthorized", "restricted", "forbidden", "disabled"
	];

	// Had to put this since previously there were false detections in example "Murim login" contained login which was blacklisted
	const contentIndicators = ["chapter", "episode", "ep", "ch", "chap", "vol", "volume"];
	const hasContentIndicator = contentIndicators.some(indicator => url.toLowerCase().includes(indicator.toLowerCase()));

	const forbiddenKeyword = blackListKeywords.find(forbidden => url.toLowerCase().includes(forbidden.toLowerCase()));
	console.log("Checking tab"); //
	if (!forbiddenKeyword || hasContentIndicator) {
		if ((!arrays.excludedSites || arrays.excludedSites.length === 0) || !arrays.excludedSites.find(ex => url.includes(ex.url))) {
			const parsedUrl = new URL(url);
			// Removes top domain
			const { useFamiliarArrayOnly } = arrays.familiarArray.find(item => 'useFamiliarArrayOnly' in item) || {};
			const matchResult = parsedUrl.hostname.match(/\.?([^.]+)\.\w{2,3}(?:\.\w{2})?$/);

			if (matchResult && useFamiliarArrayOnly === false) {
				const domain = matchResult[1];
				const domainKeywords = ["manga", "anime", "manhua", "manwha"];
				if (domainKeywords.some(keyWord => domain.includes(keyWord)) || (arrays.familiarArray && arrays.familiarArray.length > 0 && arrays.familiarArray.find(site => url.startsWith(site.url)))) {
					resetPresenceTimer();
					executeContentScript(tabId);
				} else {
					startPresenceTimer();
				}
			} else if (arrays.familiarArray && arrays.familiarArray.length > 0 && arrays.familiarArray.find(site => url.startsWith(site.url))) {
				resetPresenceTimer();
				executeContentScript(tabId);
			} else {
				startPresenceTimer();
			}
		} else {
			console.info('Site was found in excludedSites. Ignoring site.');
		}
	} else {
		console.warn(`Skipping scraping due to potential sensitive information. Forbidden keyword "${forbiddenKeyword}" detected in the URL.`);
	}
}

let presenceTimer = null;

function resetPresenceTimer() {
	if (presenceTimer) {
		console.log("Reseting presence timer"); //
		clearTimeout(presenceTimer);
		presenceTimer = null;
	}
}

async function startPresenceTimer() {
	if (!presenceTimer) {
		console.log("StartPresenceTimer"); //
		presenceTimer = setTimeout(async () => {
			await closePresenceServer();
			presenceTimer = null;
		}, 30000);
	}
}

async function closePresenceServer() {
	try {
		console.log("Closing presence server"); //
		const response = await fetch(ServerPresenceClose);
		if (response.ok) {
			console.log('Discord presence is closed.');
		}
	} catch (error) {
		console.error('Heartbeat error:', error);
		restoreDefault();
	}
}

// Resets everything to defaults. Dosent throw error so you have to throw the error in the place where it happens.
function restoreDefault() {
	toggleEventListeners(false);
	toggleMessageListener(false);
	serverOkLock = false;
	arrays.familiarArray = null;
	arrays.excludedSites = null;
	isTabServerListenerActive = false;
	console.log("Restoring Defauls"); //

	chrome.tabs.onActivated.addListener(tabListenerStartServer);
	chrome.tabs.onUpdated.addListener(tabListenerStartServer);

	return;
}

function toggleEventListeners(enable) {
	console.log("toggleEventListeners", enable); //
	if (enable) {
		chrome.tabs.onUpdated.addListener(onUpdatedHandler);
		chrome.tabs.onActivated.addListener(onActivatedHandler);
	} else if (!enable) {
		chrome.tabs.onUpdated.removeListener(onUpdatedHandler);
		chrome.tabs.onActivated.removeListener(onActivatedHandler);
	}
}