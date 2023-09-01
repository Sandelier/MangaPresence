
browser.runtime.onMessage.addListener(message => {
	if (message.action === 'PageData') {
		const familiarArray = message.familiarArray;
		const extractedData = checkFamiliar(familiarArray);

		browser.runtime.sendMessage({ action: "PageData", extractedData })
			.catch(error => console.info('Error sending message to background script:', error));
	}
});


function sendConsoleMessage(type, content) {
	browser.runtime.sendMessage({ action: "Console", type, content })
		.catch(error => console.error('Error sending console message to background script:', error));
}

function checkFamiliar(familiarArray) {
	const url = window.location.href;
	const foundItem = familiarArray.find(item => url.startsWith(item.url));
	const { displayLookingState } = familiarArray.find(item => 'displayLookingState' in item) || {};

	if (foundItem) {
		return scrapeFamiliarPage(foundItem, url, displayLookingState);
	} else {
		return scrapeUnknownPage(url, displayLookingState);
	}
}

function scrapeFamiliarPage(foundItem, url, displayLookingState) {
	const { scrapeInfo, imageKey, imageText, Watch2Token } = foundItem;
	const { Title, Installment } = scrapeInfo;


	const title = findElementFromSelector(Title, 'title');

	let chEp = findElementFromSelector(Installment, 'chapter or episode');
	if (!chEp) {
		const chaEpiObj = getChaEpi(url);
		if (chaEpiObj) {
		  chEp = chaEpiObj;
		} else {
		  chEp = null;
		}
	} else {

		let matched = '';
		const match = url.match(/(ep|ch|chap|episode|chapter|vol|volume)-([\d.]+)/i);
		if (match) {
			matched = match[1].toLowerCase();
			if (matched === 'ch' || matched === 'chap' || matched === 'chapter') {
				matched = 'Ch';
			} else if (matched === 'vol' || matched === 'volume') {
				matched = 'Vol';
			} else if (matched === 'episode' || matched === 'ep') {
				matched = 'Ep';
			}
		}

		chEp = {
			count: chEp,
			matched,
		};
	}

	const type = getTypeFromUrl(url);


	const imageKeyOrDefault = imageKey && imageKey.length > 0 ? imageKey : 'default';

	const imageTextOrDefault = imageText && imageText.length > 0 ? imageText : 'default';

	const WatchTogether = Watch2Token && url.includes(Watch2Token) ? true : false;

	if (chEp === null && displayLookingState === false) {
		sendConsoleMessage("info", "Looking state detected. Ignoring site");
		return false;
	}

	return {
		type,
		title,
		chEp,
		url,
		imageKey: imageKeyOrDefault,
		imageText: imageTextOrDefault,
		WatchTogether
	};
}

function findElementFromSelector(selectors, selectorName) {
	if (selectors) {
		for (const selector of selectors) {
			element = document.querySelector(selector);
			if (element) {
				element = checkForSensitiveInformation(element, selectorName);
			   	if (element) {
					return element;
			   	}
			}
		}
	}
	return null;
}

function checkForSensitiveInformation(element, selectorName) {
	if (!element) {
		sendConsoleMessage('warn',
			`The page ${selectorName} is being retrieved using default methods since the familiar list query selector could not find any ${selectorName}.`);
		return null;
	}

	if (element.tagName.toLowerCase() === 'form') {
		sendConsoleMessage('warn', `Skipping query due to potential sensitive information. It's a <form> element.`);
		return null;
	}

	const attributes = Array.from(element.attributes).map(attr => attr.name.toLowerCase());
	if (attributes.includes('username') || attributes.includes('password')) {
		sendConsoleMessage('warn',
			`Skipping query due to potential sensitive information. "username" or "password" attribute detected in the ${selectorName} element.`);
		return null;
	}

	return element.textContent.trim();
}



// This function might fail in some websites but it works most of the times.
function scrapeUnknownPage(url, displayLookingState) {
	const type = getTypeFromUrl(url);

	let title = getTitle();

	let chEp = getChaEpi(url);
	if (chEp && chEp.count <= 0) {
		chEp = null;
	}

	const imageKey = 'default';
	const imageText = 'default';

	const WatchTogether = false;

	if (chEp.count === null && displayLookingState === false) {
		return false;
	}

	return { type, title, chEp, url, imageKey, imageText, WatchTogether };
}

function getChaEpi(url) {
	const match = url.match(/(ep|ch|chap|episode|chapter|vol|volume)-([\d.]+)/i);
	if (match) {

		let matched = match[1].toLowerCase();
		if (matched === 'ch' || matched === 'chap' || matched === 'chapter') {
			matched = 'Ch';
		} else if (matched === 'vol' || matched === 'volume') {
			matched = 'Vol';
		} else if (matched === 'episode' || matched === 'ep') {
			matched = 'Ep';
		}
		return { count: parseFloat(match[2]), matched};
	}
	return null;
}

function getTypeFromUrl(url) {
    const reversedUrl = [...url].reverse().join("");
    const lowerReversedUrl = reversedUrl.toLowerCase();
    if (lowerReversedUrl.includes("agnam")) {
        return "manga";
    } else if (reversedUrl.includes("emina")) {
        return "anime";
    } else if (lowerReversedUrl.includes("awhnam")) {
        return "manhwa";
    } else if (lowerReversedUrl.includes("auhnam")) {
        return "manhua";
    } else {
        return null;
    }
}

function getTitle() {
	let title = document.title;
	const delimiter = "Anime|Manga|Manhua|Manwha-|vol|chapter|episode";
	const regex = new RegExp(delimiter, "i");
	const splitArray = title.split(regex);
	title = splitArray[0].replace(/\bwatch\b|\bread\b|\bEnglish\b|\bSubbed\b|\bDubbed\b/gi, '').trim();
	return title;
}