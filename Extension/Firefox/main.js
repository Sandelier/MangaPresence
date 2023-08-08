let serverOkLock = false;

const serverUrl = 'http://localhost:56324/mangapresence';
const ServerStatusUrl = `${serverUrl}/status`;
const ServerArrayUrl = `${serverUrl}/filterArrays`;
const ServerHeartbeatUrl = `${serverUrl}/heartbeat`;
const ServerPageDataUrl = `${serverUrl}/pageData`;
const ServerPresenceClose = `${serverUrl}/closeRPC`;
const ServerStartUpUrl = 'http://localhost:56326/serverTray/startServer'




// Kuuntelee aina täbi vaihoksia jos ei oo yhistäny serveriin ja koittaa käynnistää servun.
let isTabServerListenerActive = false;
const tabListenerStartServer = () => { 
	console.log("tabListenerStartServer", isTabServerListenerActive); //
	if (!isTabServerListenerActive) {
		isTabServerListenerActive = true;
		checkServer();
	}
};

browser.tabs.onActivated.addListener(tabListenerStartServer);
browser.tabs.onUpdated.addListener(tabListenerStartServer);

const maxRetries = 5;
let retryCount = 0;

// Kattoo onko serveri päällä ja koittaa käynnistää sitä.
async function checkServer() {
	console.log("checkServer activated"); //
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
							browser.tabs.onActivated.removeListener(tabListenerStartServer);
							browser.tabs.onUpdated.removeListener(tabListenerStartServer);
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

// Tästä alaspäin on vain startextension hommia

async function startExtension() {
	try {
		console.log("Starting extension"); //

		await fetchArrays();

		serverHeartBeat();

		toggleEventListeners(true);
		
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

let familiarArray = null;
let excludedSites = null;
async function fetchArrays() {
	try {
		const arrayResponse = await fetch(ServerArrayUrl, {
			method: 'POST'
		});
		console.log(arrayResponse);
		const arrayData = await arrayResponse.json();
		familiarArray = arrayData.Familiar;
		excludedSites = arrayData.Excluded;

		return { familiarArray, excludedSites };
	} catch (error) {
		console.error('Failed to fetch arrays', error);
		return { familiarArray: [{ url: null }], excludedSites: [{ url: null }] };
	}
}

// Tarkistetaan aina välillä onko serveri toiminnassa
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

// Käytetään kun tabi vaihtuu.
let contentScriptInjected = false;
async function executeContentScript(tabId) {
  try {
	console.log("Executing content script"); //
    if (!contentScriptInjected) {
      await browser.tabs.executeScript(tabId, {
        file: 'contentScript.js'
      });
      contentScriptInjected = true;
    }

    toggleMessageListener(true);

    await browser.tabs.sendMessage(tabId, {
      action: 'PageData',
      familiarArray: familiarArray
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
	console.log("Handling message", message); //
	switch (message.action) {
		case 'PageData':
			const data = message.extractedData;
			if (data != false) {
				const { type, title, chEp, url, imageKey, imageText, WatchTogether } = data;
				if (oldUrl !== url || oldChEp !== chEp) {
					const jsonObject = {
						type: type,
						title: title,
						installment: chEp,
						url: url,
						imageKey: imageKey,
						imageText: imageText,
						W2State: WatchTogether
					};
					sendPageData(jsonObject, url, chEp);
					toggleMessageListener(false);
				}
				clearTimeout(timerId);
				timerId = setTimeout(() => {
					getCurrentTab().then(tabs => {
						const currentTab = tabs[0];
						if (currentTab.status === "complete" && currentTab.url) {
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
		default:
			console.error('Unknown message');
			break;
	}
}

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

		if (response.status === 429) {
			const errorMessage = await response.text();
			console.warn(errorMessage);
		} else if (response.ok) {
			oldUrl = url;
			oldChEp = chEp;
			const responseMessage = await response.text();
			console.log('Page data sent successfully', responseMessage);
		} else {
			const errorMessage = await response.text();
			console.error('Failed to send data', errorMessage);
		}
	} catch (error) {
		console.error('Caught an error while trying to post pagedata.', error);
		restoreDefault();
	}
}

// Piti tehä että poistaa vanhan ja että on tommonen lukko tuossa kun se teki niitä kokoajan lisää ja lisää.
let isMessageListenerActive = false;

function toggleMessageListener(enable) {
	console.log("TogglemessageListener", enable, isMessageListenerActive); //
	if (enable) {
		if (!isMessageListenerActive) {
			browser.runtime.onMessage.addListener(handleMessage);
		}
	} else if (isMessageListenerActive) {
		browser.runtime.onMessage.removeListener(handleMessage);
	}
	isMessageListenerActive = enable;
}

// Kun päivittää sivun listeneri
const onUpdatedHandler = (tabId, changeInfo, tab) => {
	console.log("onUpdateHandler"); //
	if (changeInfo.status === "complete" && tab.url) {
		checkTabUrl(tab.url, tab.id);
	}
};

// Kun clickkaa toista tabiä listeneri
function getCurrentTab() {
	console.log("getCurrentTab"); //
	return browser.tabs.query({ active: true, currentWindow: true });
}

const onActivatedHandler = (activeInfo) => {
	getCurrentTab().then((tabs) => {
		const currentTab = tabs[0];
		if (currentTab.status === "complete" && currentTab.url) {
			checkTabUrl(currentTab.url, currentTab.id);
		}
	});
};

// Laitoin ihan varmuuden vuoksi ettei missään vaiheessa ota mitään sensitive informaatiota.
function checkTabUrl(url, tabId) {
	const blackListKeywords = ["profile", "register", "login", "account", "password", "creditcard", "checkout", "account_settings", "personal_info", "private",
		"confidential", "secure", "payment", "admin_panel", "dashboard", "auth", "signin", "signup", "sign_up", "sign_in", "signout", "sign_out", "billing",
		"credit_card", "change_password", "reset_password", "account_info", "bank_account", "auth_token", "session", "api_key", "token", "access_token",
		"client_secret", "client_id", "password_reset", "password_change", "oauth", "unauthorized", "restricted", "forbidden", "disabled"
	];
	const forbiddenKeyword = blackListKeywords.find(forbidden => url.toLowerCase().includes(forbidden.toLowerCase()));
	console.log("Checking tab"); //
	if (!forbiddenKeyword) {
		if ((!excludedSites || excludedSites.length === 0) || !excludedSites.find(ex => url.includes(ex.url))) {
			const parsedUrl = new URL(url);
			// Ottaa top domainin pois
			const { useFamiliarArrayOnly } = familiarArray.find(item => 'useFamiliarArrayOnly' in item) || {};
			const matchResult = parsedUrl.hostname.match(/\.?([^.]+)\.\w{2,3}(?:\.\w{2})?$/);

			if (matchResult && useFamiliarArrayOnly === false) {
				const domain = matchResult[1];
				if (domain.includes("manga") || domain.includes("anime") || (familiarArray && familiarArray.length > 0 && familiarArray.find(site => url.startsWith(site.url)))) {
					resetPresenceTimer();
					executeContentScript(tabId);
				} else {
					startPresenceTimer();
				}
			} else if (familiarArray && familiarArray.length > 0 && familiarArray.find(site => url.startsWith(site.url))) {
				resetPresenceTimer();
				executeContentScript(tabId);
			} else {
				startPresenceTimer();
			}
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

// Pistää kaikki kiinni menee takasin alkuun. Ei nakkaa erroria niin se errori pitää nakata sielä missä käytät tätä
function restoreDefault() {
	toggleEventListeners(false);
	toggleMessageListener(false);
	serverOkLock = false;
	familiarArray = null;
	excludedSites = null;
	isTabServerListenerActive = false;
	console.log("Restoring Defauls"); //

	browser.tabs.onActivated.addListener(tabListenerStartServer);
	browser.tabs.onUpdated.addListener(tabListenerStartServer);

	return;
}

function toggleEventListeners(enable) {
	console.log("toggleEventListeners", enable); //
	if (enable) {
		browser.tabs.onUpdated.addListener(onUpdatedHandler);
		browser.tabs.onActivated.addListener(onActivatedHandler);
	} else if (!enable) {
		browser.tabs.onUpdated.removeListener(onUpdatedHandler);
		browser.tabs.onActivated.removeListener(onActivatedHandler);
	}
}