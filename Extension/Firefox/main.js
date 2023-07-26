
let serverOkLock = false;

const serverUrl = 'http://localhost:56324/mangapresence';
const ServerStatusUrl = `${serverUrl}/status`;
const ServerArrayUrl = `${serverUrl}/filterArrays`;
const ServerHeartbeatUrl = `${serverUrl}/heartbeat`;
const ServerPageDataUrl = `${serverUrl}/pageData`;
const ServerStartUpUrl = 'http://localhost:56326/serverTray/startServer'

// Looppaa niin kauan kunnes serveri on kunnossa.

const checkServerStatus = async () => {
  if (!serverOkLock) {
    try {
      const response = await fetch(ServerStartUpUrl);
      if (response.ok) {
        console.log('Server is starting up');
        
        setTimeout(async () => {
          const statusResponse = await fetch(ServerStatusUrl);
          if (statusResponse.ok && !serverOkLock) {
            console.log('Server is OK');
            serverOkLock = true;
            elapsedTime = 0;
            startExtension();
          } else {
            elapsedTime += 5000;
            setTimeout(checkServerStatus, elapsedTime);
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Couldn't talk with localhost:", error);
      if (elapsedTime >= maxDuration) {
        console.log('Connection timeout. Server is not responding.');
        browser.alarms.create("serverCheck", { delayInMinutes: 5 });
        elapsedTime = 0;
      } else {
        elapsedTime += 5000;
        setTimeout(checkServerStatus, elapsedTime);
      }
    }
  }
};

const maxDuration = 2 * 60 * 1000;
let elapsedTime = 0;

checkServerStatus();

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "serverCheck") {
    checkServerStatus();
  }
});

// Tästä alaspäin on vain startextension hommia

async function startExtension() {
    try {
        await fetchArrays();

        serverHeartBeat();

        toggleEventListeners(true);

    } catch (error) {
        console.error(error);
        restoreDefault();
    }
}

let familiarArray = null;
let excludedSites = null;
async function fetchArrays() {
    const dummyUrl = { url: 'dummyUrlBecauseIamLazy' };
    try {
        const arrayResponse = await fetch(ServerArrayUrl, {
            method: 'POST'
        });
        console.log(arrayResponse);
        const arrayData = await arrayResponse.json();
        familiarArray = arrayData.Familiar;
        excludedSites = arrayData.Excluded;


        // Paska tapa tehä tämä muttakun ei millään jaksa tehä nytten checkkiä että onko familiararray ja excludedsitessä objectejä niissä find methodeissa.
        // Pitää Korjata seuraavassa versiossa.
        
        if (familiarArray.length === 0) {
            familiarArray.push(dummyUrl);
        }

        if (excludedSites.length === 0) {
           excludedSites.push(dummyUrl);
        }


        return { familiarArray, excludedSites };
    } catch (error) {
        console.error('Failed to fetch arrays', error);
        return { familiarArray: [dummyUrl], excludedSites: [dummyUrl] };
    }
}

// Tarkistetaan aina välillä onko serveri toiminnassa
async function serverHeartBeat() {
    const Heartbeat_5 = 2.5 * 60 * 1000;
    try {
        const response = await fetch(ServerHeartbeatUrl);
        if (response.ok) {
            console.log('Server is OK');
            setTimeout(serverHeartBeat, Heartbeat_5);
        }
    } catch (error) {
        console.error('Heartbeat error:', error);
        restoreDefault();
    }
}

// Käytetään kun tabi vaihtuu.
async function executeContentScript(tabId) {
  try {
    await browser.tabs.executeScript(tabId, {
      file: 'contentScript.js'
    });
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
  switch (message.action) {
    case 'PageData':
      const data = message.extractedData;
      const { type, title, chEp, url, imageKey, imageText, WatchTogether } = data;
      if (oldUrl !== url || oldChEp !== chEp) {
          const jsonObject = {
              type: type,
              title: title,
              chapter: chEp,
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
            console.log('Page data sent successfully');
        } else {
            console.error('Failed to send data');
        }
    } catch (error) {
        console.error('Caught an error while trying to post pagedata.', error);
        restoreDefault();
    }
}

// Piti tehä että poistaa vanhan ja että on tommonen lukko tuossa kun se teki niitä kokoajan lisää ja lisää.
let isMessageListenerActive = false;

function toggleMessageListener(enable) {
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
    if (changeInfo.status === "complete" && tab.url) {
        checkTabUrl(tab.url, tab.id);
    }
};

// Kun clickkaa toista tabiä listeneri
function getCurrentTab() {
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
  const blackListKeywords = [ "profile", "register", "login", "account", "password", "creditcard", "checkout", "account_settings", "personal_info", "private", "confidential", "secure", "payment", "admin_panel", "dashboard", "auth", "signin", "signup", "sign_up", "sign_in", "signout", "sign_out", "billing", "credit_card", "change_password", "reset_password", "account_info", "bank_account", "auth_token", "session", "api_key", "token", "access_token", "client_secret", "client_id", "password_reset", "password_change", "oauth", "unauthorized", "restricted", "forbidden", "disabled"  ];
  const forbiddenKeyword = blackListKeywords.find(forbidden => url.toLowerCase().includes(forbidden.toLowerCase()));

  if (!forbiddenKeyword) {
    if (!excludedSites.find(ex => url.includes(ex.url)) && 0 < familiarArray.length) {
      const parsedUrl = new URL(url);
      // Ottaa top domainin pois
      const matchResult = parsedUrl.hostname.match(/\.?([^.]+)\.\w{2,3}(?:\.\w{2})?$/);
      if (matchResult) {
        const domain = matchResult[1];
        // Kattoo onko siinä hostnamessa manga tai anime.
        if (domain.includes("manga") || domain.includes("anime") || familiarArray.find(site => url.startsWith(site.url))) {
          executeContentScript(tabId);
        }
      } else if (familiarArray.find(site => url.startsWith(site.url))) {
        executeContentScript(tabId);
      }
    }
  } else {
    console.warn(`Skipping scraping due to potential sensitive information. Forbidden keyword "${forbiddenKeyword}" detected in the URL.`);
  }
}

// Pistää kaikki kiinni menee takasin alkuun. Ei nakkaa erroia niin se errori pitää nakata sielä missä käytät tätä
function restoreDefault() {
  browser.alarms.create("serverCheck", { delayInMinutes: 5 });
  toggleEventListeners(false);
  toggleMessageListener(false);
  serverOkLock = false;
  familiarArray = null;
  excludedSites = null;
  return;
}

function toggleEventListeners(enable) {
  if (enable) {
    browser.tabs.onUpdated.addListener(onUpdatedHandler);
    browser.tabs.onActivated.addListener(onActivatedHandler);
  } else if (!enable) {
    browser.tabs.onUpdated.removeListener(onUpdatedHandler);
    browser.tabs.onActivated.removeListener(onActivatedHandler);
  }
}