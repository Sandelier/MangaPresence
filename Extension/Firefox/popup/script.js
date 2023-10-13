


document.addEventListener("DOMContentLoaded", function () {
    const updateButton = document.getElementById("familiarArray");
    updateButton.addEventListener("click", function () {
        sendPopupMessage();
    });
});


const updated = [
  {
    "useFamiliarArrayOnly": false
  },
  {
    "displayLookingState": false
  },
  {
    "url": "https://www.anime-planet.com/",
    "scrapeInfo": {
      "Title": [
        "h1[itemprop=\"name\"]"
      ]
    },
    "imageKey": "animeplanet",
    "imageText": "Animeplanet"
  },
  {
    "url": "https://www.mangago.me/",
    "scrapeInfo": {
      "Title": [
        ".w-title h1",
        "a#series"
      ]
    },
    "imageKey": "mangago",
    "imageText": "Mangago"
  }
]

const contentContainer = document.getElementById('overlay-server-on');

function setContent() {
  updated.forEach(item => {
    const parentElement = document.createElement('div');

    const childrenContainer = document.createElement('div');

    for (const key in item) {
      const childElement = document.createElement('div');
      childElement.textContent = `${key}: ${JSON.stringify(item[key])}`;
      childrenContainer.appendChild(childElement);
    }

    parentElement.appendChild(childrenContainer);

    contentContainer.appendChild(parentElement);
  });
}



function sendPopupMessage() {
	browser.runtime.sendMessage({
		action: 'PopupScript',
		content: {
            type: 'updateArray',
            arrayName: 'familiarArray',
            updatedArray: updated,
        }
	});
}


browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.to === 'popup') {
        console.log(message);
    }
});