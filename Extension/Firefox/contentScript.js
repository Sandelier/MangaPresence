browser.runtime.onMessage.addListener(message => {
if (message.action === 'PageData') {
	const familiarArray = message.familiarArray;
  	const extractedData = checkFamiliar(familiarArray);

  	browser.runtime.sendMessage({ action: "PageData", extractedData })
		.catch(error => console.error('Error sending message to background script:', error));
}
});


function sendConsoleMessage(type, content) {
	browser.runtime.sendMessage({ action: "Console", type, content })
	  .catch(error => console.error('Error sending console message to background script:', error));
}

function checkFamiliar(familiarArray) {
	const url = window.location.href;
	const foundItem = familiarArray.find(item => url.startsWith(item.url));

	if(foundItem) {
		return scrapeFamiliarPage(foundItem, url);
	} else {
		return scrapeUnknownPage(url);
	}
}

function scrapeFamiliarPage(foundItem, url) {
	const { scrapeInfo, imageKey, imageText, Watch2Token } = foundItem;
	const { Title, Episode } = scrapeInfo;

	let title = null
	const titleElement = Title.map(selector => document.querySelector(selector)).find(Boolean);
	if (titleElement) {
		title = checkForSensitiveInformation(titleElement, 'title');
	}

	let chEp = Episode && Episode.length > 0 ? document.querySelector(Episode[0]) : getChaEpi(url);
	if (chEp) {
		chEp = checkForSensitiveInformation(chEp, 'chapter or episode');
	}

	chEp = chEp <= 0 ? null : chEp;

	const type = getTypeFromUrl(url);
    
    const imageKeyOrDefault = imageKey && imageKey.length > 0 ? imageKey : 'default';
	const imageTextOrDefault = imageText && imageText.length > 0 ? imageText : 'default';

	const WatchTogether = Watch2Token && url.includes(Watch2Token) ? true : false;
	return {
		type, title, chEp, url, 
        imageKey: imageKeyOrDefault, 
        imageText: imageTextOrDefault, 
        WatchTogether
	};
}

function checkForSensitiveInformation(element, selectorName) {
	if (!element) {
	  sendConsoleMessage('warn', `The page ${selectorName} is being retrieved using default methods since the familiar list query selector could not find any ${selectorName}.`);
	  return null;
	}
	
	if (element.tagName.toLowerCase() === 'form') {
	  sendConsoleMessage('warn', `Skipping query due to potential sensitive information. It's a <form> element.`);
	  return null;
	}
	
	const attributes = Array.from(element.attributes).map(attr => attr.name.toLowerCase());
	if (attributes.includes('username') || attributes.includes('password')) {
	  sendConsoleMessage('warn', `Skipping query due to potential sensitive information. "username" or "password" attribute detected in the ${selectorName} element.`);
	  return null;
	}
	
	return element.textContent.trim();
}

  

// Tämä funcktio saattaa kusta joissain sivustoissa mutta toimii yleensä.
function scrapeUnknownPage(url) {
    const type = getTypeFromUrl(url);

	let title = getTitle();

	let chEp = getChaEpi(url);
	chEp = chEp <= 0 ? null : chEp;

	const imageKey = 'default';
	const imageText = 'default';

	const WatchTogether = false;

	return { type, title, chEp, url, imageKey, imageText, WatchTogether };
}

function getChaEpi(url) {
	const match = url.match(/(ep|ch|chap|episode|chapter|vol|volume)-([\d.]+)/i);
	return match ? parseFloat(match[2]) : null;
}

function getTypeFromUrl(url) {
    const reversedUrl = [...url].reverse().join("");
    return reversedUrl.toLowerCase().includes("agnam") ? "manga" : reversedUrl.includes("emina") ? "anime" : null;
}

function getTitle() {
	let title = document.title;
	const delimiter = "Anime|Manga|-|vol|chapter|episode";
	const regex = new RegExp(delimiter, "i");
	const splitArray = title.split(regex);
	title = splitArray[0].replace(/\bwatch\b|\bread\b|\bEnglish\b|\bSubbed\b|\bDubbed\b/gi, '').trim();
	return title;
}