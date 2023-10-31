

// Used for setContent to know what data is missing from user provided data. In example if installment is missing in familiarArray then its empty entry installment is added to entry.

const preferencesTemplate = {
  "Idle": {
    "details": "",
    "state": "",
    "buttons": [
      { "label": "", "url": "" },
      { "label": "", "url": "" }
    ]
  },
  "Looking": {
    "details": "",
    "state": "",
    "buttons": [
      { "label": "", "url": "" },
      { "label": "", "url": "" }
    ]
  },
  "Manga": {
    "Reading": {
      "details": "",
      "state": "",
      "buttons": [
        { "label": "", "url": "" },
        { "label": "", "url": "" }
      ]
    }
  },
  "Anime": {
    "Watching": {
      "details": "",
      "state": "",
      "buttons": [
        { "label": "", "url": "" },
        { "label": "", "url": "" }
      ]
    },
    "Watching in room": {
      "details": "",
      "state": "",
      "buttons": [
        { "label": "", "url": "" },
        { "label": "", "url": "" }
      ]
    }
  }
}

const familiarArrayTemplate = {
  "url": "",
  "scrapeInfo": {
      "Title": [
          ""
      ],
      "Installment": [
          ""
      ]
  },
  "Watch2Token": "",
  "imageKey": "",
  "imageText": "",
  "Type": ""
};

const boolConfigTemplate = {
  "useFamiliarArrayOnly": false,
  "displayLookingState": false
}

const excludedSitesTemplate = {
  url: ''
};