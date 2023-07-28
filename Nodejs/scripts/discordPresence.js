let oldDomain = "";
let time = "";

function updatePresence(RPC, data, logger, preferences) {
    let type = data.type;
    let title = data.title;
    let installment = data.installment;
    let siteUrl = data.url;
    let W2State = data.W2State;

    let activity = {
        details: null,
        state: null,
        startTimestamp: null,
        largeImageKey: data.imageKey,
        largeImageText: data.imageText,
        buttons: [
            { label: W2State ? 'Watch together' : 'Link', url: siteUrl },
        ],
    }
    
    // Hakee hostnamen
    const longest = createLongest(siteUrl);

    title = adjustTitle(title, longest);

    const currentState = checkCurrentState(title, installment, type, W2State);

    // Pistää sen starttimen uuestaan alkuun jos vaihat sivua kokonaan
    if (longest != oldDomain) {
        oldDomain = longest;
        time = Math.floor(Date.now() / 1000);
        activity.startTimestamp = time;
    } else {
        activity.startTimestamp = time;
    }


    const prefsMap = { title , installment };
    
    console.log("currentState:", currentState);
    switch (currentState) {
        case 'Idle':
            activity.state = getPreference(preferences, "state", "Idle", null);
            activity.details = getPreference(preferences, "details", null, null);
            break;

        case 'Looking':
            delete prefsMap[installment];
            activity.state = getPreference(preferences, "state", "Looking", prefsMap);
            activity.details = getPreference(preferences, "details", title, prefsMap);
            break;
            
        case 'Reading':
            activity.state = getPreference(preferences.Manga.Reading, "state", `Reading Ch ${installment}`, prefsMap);
            activity.details = getPreference(preferences.Manga.Reading, "details", title, prefsMap);
            break;
        
        case 'Watching In Room':
            activity.state = getPreference(preferences.Anime["Watching in room"], "state", `Watching in room Ep ${installment}`, prefsMap);
            activity.details = getPreference(preferences.Anime["Watching in room"], "details", title, prefsMap);
            break;
            
        case 'Watching':
            activity.state = getPreference(preferences.Anime.Watching, "state", `Watching: Ep ${installment}`, prefsMap);
            activity.details = getPreference(preferences.Anime.Watching, "details", title, prefsMap);
            break;
        default:
            activity.state = null;
            activity.details = null;
            console.log("Unable to detect state in", siteUrl, currentState);
            logger.error({ fileName }, 'Was unable to detect state in', siteUrl);
    }


    console.log(activity);
    try {
        RPC.setActivity(activity);
    } catch (error) {
        logger.error({ fileName }, 'Error occurred while trying to set activity', error);
    }
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

function checkCurrentState(title, installment, type, W2State) {
    if (title === null && installment === null) {
        return 'Idle';
    } else if (title !== null && !installment) {
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

// Tuo stringin takasin johon on pistetty ne variable määrät.
// variablet
// installment == chapterit / episodet
// title
function replaceVariables(string, prefsMap) {
    if (!prefsMap) return string;

    return string.replace(/\{(.*?)}/g, (match, variableName) => {
        return prefsMap[variableName] || match;
    });
}

function getPreference(preferences, field, defaultValue, prefsMap) {
    if (!preferences || !field) {
      return null;
    }
  
    const prefValue = preferences[field];
  
    if (typeof prefValue === "object") {
      const { state, details } = prefValue;
      return {
        state: state ? replaceVariables(state, prefsMap) : defaultValue !== undefined ? defaultValue : null,
        details: details ? replaceVariables(details, prefsMap) : defaultValue !== undefined ? defaultValue : null
      };
    } else if (prefValue && prefValue.length > 0) {
      return replaceVariables(prefValue, prefsMap);
    } else {
      return defaultValue !== undefined ? defaultValue : null;
    }
  }


module.exports = {updatePresence};