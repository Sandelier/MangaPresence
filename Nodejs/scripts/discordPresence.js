let oldDomain = "";
let time = "";

// Updatettaa presencen
function updatePresence(RPC, data, logger) {
    let type = data.type;
    let title = data.title;
    let chapter = data.chapter;
    let siteUrl = data.url;
    let imageKey = data.imageKey;
    let imageText = data.imageText;
    let W2State = data.W2State;

    let activity = {
        details: title,
        state: 'Idle',
        startTimestamp: null,
        largeImageKey: imageKey,
        largeImageText: imageText,
        buttons: [
            { label: W2State ? 'Watch together' : 'Link', url: siteUrl },
        ],
    };
    // splittaa domainin pisteistä ja sitten kattoo mikä on isoin
    // Koska pisin on yleensä se oikea mutta tietenkin on jotain ääri tapauksia jossa se alku saattaa olla isompi kuin se oikea.
    const parsedUrl = new URL(siteUrl);
    const domain = parsedUrl.hostname.split('.');
    let longest = "";
    for (let i = 0; i < domain.length; i++) {
        if (longest.length < domain[i].length) {
            longest = domain[i];
        }
    }
    // Pistää sen starttimen uuestaan alkuun jos vaihat sivua kokonaan
    if (longest != oldDomain) {
        oldDomain = longest;
        time = Math.floor(Date.now() / 1000);
        activity.startTimestamp = time;
    } else {
        activity.startTimestamp = time;
    }
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
            console.log('titlematch[2]', titleMatch[2])
            console.log('titlematch[2]', titleMatchDomain[2])
            if (titleMatch[2].toLowerCase() === titleMatchDomain[2].toLowerCase()) {
                console.log("OK?", title, longest);
                title = longest;
                activity.details = title.charAt(0).toUpperCase() + title.slice(1);
            }
        }
    }

    if (title === null || title.length <= 2) {
        // Pistää sen splitatun domainin titleksi jos on nulli.
        longest = longest.charAt(0).toUpperCase() + longest.slice(1);
        activity.details = longest;
    }
    if (title === null && chapter === null) {
        activity.state = 'Idle';
    } else if (title !== null && !chapter) {
        activity.state = 'Looking';
    } else if (title !== null && chapter !== null) {
        if (type === 'manga') {
            activity.state = `Reading Ch ${chapter}`;
        } else if (type === 'anime') {
            if (W2State) {
                activity.state = `Watching in room Ep ${chapter}`;
            } else {
                activity.state = `Watching: Ep ${chapter}`;
            }
        }
    }
    console.log(activity);
    try {
        RPC.setActivity(activity);
    } catch (error) {
        const fileName = __filename;
        logger.error({ fileName }, 'Error occurred while trying to set activity', error);
    }
}

module.exports = {updatePresence};