let oldDomain = "";
let time = "";

let oldState = "";
let oldDetails;

const { URL } = require('url');

const fileName = __filename;



function setErrorResult(result, errorCode, errorMessage, success = false) {
	result.success = success;
	result.errorCode = errorCode;
	result.error = errorMessage;
}

function updatePresence(RPC, data, preferences) {
	let result = {
		success: false,
		errorCode: null,
		error: null,
	};

	let type = data.type;
	let title = data.title;
	let installment = data.installment;
	let siteUrl = data.url;
	let W2State = data.W2State;

	if (!siteUrl) {
		console.error({ fileName }, 'Site url was not defined');
		setErrorResult(result, 400, 'Site url was not defined');
		return result;
	}

	let activity = {
		details: null,
		state: null,
		startTimestamp: null,
		largeImageKey: data.imageKey,
		largeImageText: data.imageText,
	};

	// Hakee hostnamen
	const longest = createLongest(siteUrl);

	title = adjustTitle(title, longest);

	const prefsMap = { title, installment, siteUrl };

	const currentState = checkCurrentState(title, installment, type, W2State, prefsMap, preferences);

	const newActivity = getActivityForState(preferences, prefsMap, currentState, installment, title, siteUrl);
	if (!newActivity) {
		setErrorResult(result, 404, 'Server was unable to resolve an activity/state');
		return result;
	}

	activity.details = newActivity.details;
	activity.state = newActivity.state;

	if (newActivity.buttons != null) {
		activity.buttons = newActivity.buttons;
	}

	// Jos ei oo tullu mitään uutta niin ei tuhlaa rateLimittii
	if (oldDetails == activity.details && oldState == activity.state) {
		setErrorResult(result, 204, 'Not updating because no new content was found.', false);
		return result;
	}

	console.log(activity);

	activity.startTimestamp = setTime(activity.details);

	try {
		RPC.setActivity(activity);
		oldState = activity.state;
		setErrorResult(result, 200, null, true);
		return result;
	} catch (error) {
		setErrorResult(result, 500, 'Error occurred while trying to set activity');
		return result;
	}
}



// Kattoo mikä state on ja hakee sen activityn getActivity functionista ja returnaa sen.
function getActivityForState(preferences, prefsMap, state, installment, title) {
	switch (state) {
		case 'Idle':
			return getActivity(preferences, prefsMap, "Idle", null);

		case 'Looking':
			delete prefsMap.installment;
			return getActivity(preferences, prefsMap, "Looking", title);

		case 'Reading':
			return getActivity(preferences.Manga.Reading, prefsMap, `Reading Ch ${installment}`, title);

		case 'Watching In Room':
			return getActivity(preferences.Anime["Watching in room"], prefsMap, `Watching in room Ep ${installment}`, title);

		case 'Watching':
			return getActivity(preferences.Anime.Watching, prefsMap, `Watching: Ep ${installment}`, title);

		default:
			console.error("Unable to detect state in", );
			return null;
	}
}

// Alottaa ajastimen uuestaan jos details on eri.
function setTime(details) {
	if (details != oldDetails) {
		oldDetails = details;
		time = Math.floor(Date.now() / 1000);
	}
	return time;
}

// splittaa domainin pisteistä ja sitten kattoo mikä on isoin
// Koska pisin on yleensä se oikea mutta tietenkin on jotain ääri tapauksia jossa se alku saattaa olla isompi kuin se oikea.
function createLongest(siteUrl) {
	const parsedUrl = new URL(siteUrl);
	const domain = parsedUrl.hostname.split('.');
	let longest = "";
	for (let i = 0; i < domain.length; i++) {
		if (longest.length < domain[i].length) {
			longest = domain[i];
		}
	}
	return longest;
}

function adjustTitle(title, longest) {
	// Pistin tän tälleen koska en jaksa muuttaa contentScript.jssää ja pistää tarkastusta sinne.
	if (title == "") {
		title = null;
	}

	// Kattoo jos title on sama kuin domain jos siihen titleen vaan lisää manga tai anime.
	if (title && longest) {
		const titleCheckPattern = /^(anime|manga)?(.+?)(anime|manga)?$/i;
		const titleMatchDomain = longest.match(titleCheckPattern);
		const titleMatch = title.match(titleCheckPattern);
		if (titleMatch && titleMatchDomain) {
			if (titleMatch[2].toLowerCase() === titleMatchDomain[2].toLowerCase()) {
				console.log("OK?", title, longest);
				title = longest.charAt(0).toUpperCase() + longest.slice(1);
			}
		}
	}

	if (title === null || title.length <= 2) {
		// Pistää sen splitatun domainin titleksi jos on nulli.
		title = longest.charAt(0).toUpperCase() + longest.slice(1);
	}

	return title;
}

// Kattoo mikä state on.
function checkCurrentState(title, installment, type, W2State, prefsMap, preferences) {
	if (!type) {
		type = getPreference(preferences, "type", 'anime', prefsMap);
	}

	if (title === null && installment === null) {
		return 'Idle';
	} else if (title !== null && installment === null) {
		return 'Looking';
	} else if (title !== null && installment !== null) {
		if (type === 'manga') {
			return 'Reading';
		} else if (type === 'anime') {
			if (W2State) {
				return 'Watching In Room';
			} else {
				return 'Watching';
			}
		}
	}
}


function getActivity(preferences, prefsMap, defaultValue, title) {
	const state = getPreference(preferences, "state", `${defaultValue}`, prefsMap);
	const details = getPreference(preferences, "details", title, prefsMap);
	const buttons = getPreference(preferences, "buttons", [], prefsMap);

	return { state, details, buttons };
}

// Tuo stringin takasin johon on pistetty ne variable määrät.
function replaceVariables(string, prefsMap) {
	if (!prefsMap) return string;

	return string.replace(/\{(.*?)}/g, (match, variableName) => {
		const replacement = prefsMap[variableName] || match;
		console.log(`Replacing variable ${variableName} with ${replacement}`);
		return replacement;
	});
}

function getPreference(preferences, field, defaultValue, prefsMap) {

	if (!preferences || !field) {
		return null;
	}

	const prefValue = preferences[field];

	if (field === "buttons") {
		if (Array.isArray(prefValue)) {
			// Käy kattoon prefValuen buttonit ja kattoo onko labeli ja urlla kunnollisia jos on niin palauttaa ne buttonit. 
			const validButtons = prefValue.map((button) => {
				const label = replaceVariables(getPreference(button, "label", null, null), prefsMap);
				const url = replaceVariables(getPreference(button, "url", null, null), prefsMap);

				return { ...button, label: label, url: url, };
			}).filter((button) => {
				button.label = shortenLabel(button.label);
				return button.label && button.url && button.label.length > 0 && isValidURL(button.url);
			});

			return validButtons;
		} else {
			return null;
		}
	}

	if (typeof prefValue === "object") {
		const { state, details, type } = prefValue;
		return {
			state: state ? replaceVariables(state, prefsMap) : defaultValue !== undefined ? defaultValue : null,
			details: details ? replaceVariables(details, prefsMap) : defaultValue !== undefined ? defaultValue : null,
			type: type ? replaceVariables(details, prefsMap) : defaultValue !== undefined ? defaultValue : null,
		};
	} else if (prefValue && prefValue.length > 0) {
		console.log(`Replaced value:`, field);
		return replaceVariables(prefValue, prefsMap);
	} else {
		return defaultValue !== undefined ? defaultValue : null;
	}
}

// Presencessä ei voi olla yli 32 characterii.
function shortenLabel(label) {
	if (!label) {
		return "";
	}

	if (label.length <= 32) {
		return label;
	}

	const shortenLabel = label.substring(0, 32 - 3) + '...';
	return shortenLabel;
}

function isValidURL(urlString) {
	try {
		new URL(urlString);
		return true;
	} catch (error) {
		return false;
	}
}


module.exports = { updatePresence };