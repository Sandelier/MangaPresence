

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'PopupRequest') {
        let response;

        if (message.type === 'getUrl') {
            response = window.location.href;
        }

        const element = message.element;
        chrome.runtime.sendMessage({ action: "PopupContentScriptRes", type: message.type, data: response, element });
    }
});