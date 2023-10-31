

// Messages that are sent are:
// updateArray, getArray, getAllArrays, getUrl, isServerOn
function sendPopupMessage(type, element, arrayName, updatedData) {
    let messageTemplate = {
        action: 'PopupScript',
        content: {
            type: type
        }
    };

    if (element) {
        messageTemplate.content.element = element;
    }

    if (arrayName) {
        messageTemplate.content.arrayName = arrayName;
    }

    if (type === 'updateArray' && updatedData) {
        messageTemplate.content.updatedArray = updatedData;
    }

    if (messageTemplate.content.type) {
        chrome.runtime.sendMessage(messageTemplate);
    }
}

// Arrays variable is created in getDataFromDom.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.to === 'popup') {
        const content = message.data;
        switch (content.type) {
            case 'getUrl':
                const url = content.data;
                const eleNum = content.element.element.number;
                const which = content.element.element.which;
                handleUrlButtons(url, eleNum, which);
                break;
            case 'isServerOn':
                isServerOn = content.data;
                if (isServerOn == true) {
                    sendPopupMessage('getAllArrays');
                    document.getElementById('overlay-server-off').style.display = 'none';
                    document.getElementById('overlay-server-on').style.display = 'flex';
                }
                break;
            case 'array':
                handleRequestedArray(content);
                break;
            case 'allArrays':
                handleRequestedArray(content);
                break;
            default:
                console.warn(`Unknown type received. 
                \nContent: ${JSON.stringify(content)},  
                \nMessage: ${JSON.stringify(message)}`);
                break;
        }
    }
});

let isServerOn = false;
document.addEventListener("DOMContentLoaded", function() {
	const intervalId = setInterval(function() {
		if (!isServerOn) {
			sendPopupMessage('isServerOn');
		}
		else {
			clearInterval(intervalId);
		}
	}, 1000);
});



//const arrays = {
//  familiarArray: [],
//  excludedSites: [],
//  preferences: []
//};

function handleRequestedArray(data) {
	switch (data.arrayName) {
		case 'familiarArray':
			arrays.familiarArray.data = data.data;
			setContent('familiarArray', familiarArrayTemplate, arrays.familiarArray.data).style.display = 'block';
			break;
		case 'excludedSites':
			arrays.excludedSites.data = data.data;
			setContent('excludedSites', excludedSitesTemplate, arrays.excludedSites.data);
			break;
		case 'preferences':
			arrays.preferences.data = data.data;
			setContent('preferences', preferencesTemplate, arrays.preferences.data);
			break;
		case 'All':

			arrays.preferences.data = data.data.preferences;
			arrays.familiarArray.data = data.data.familiarArray;
			arrays.excludedSites.data = data.data.excludedSites;

			setContent('familiarArray', familiarArrayTemplate, arrays.familiarArray.data).style.display = 'block';
			setContent('excludedSites', excludedSitesTemplate, arrays.excludedSites.data);
			setContent('preferences', preferencesTemplate, arrays.preferences.data);


			break;
		default:
			console.warn(`Unknown arrayName given to handleRequestedArray. ${JSON.stringify(data)}`);
			break;
	}
}




document.addEventListener("visibilitychange", function () {
	// Just sending the array to background script if it has been modified.
	for (const key in arrays) {
		if (arrays.hasOwnProperty(key) && arrays[key].modified) {
			console.log(arrays[key].data);
			sendPopupMessage('updateArray', null, key, arrays[key].data);
		}
	}
});