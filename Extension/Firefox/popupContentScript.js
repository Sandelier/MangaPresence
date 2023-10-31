

browser.runtime.onMessage.addListener(async (message) => {
    if (message.action === 'PopupRequest') {
        let response;

        if (message.type === 'getUrl') {
            response = window.location.href;
        }
        const element = message.element;
        browser.runtime.sendMessage({ action: "PopupContentScriptRes", type: message.type, data: response, element })
            .catch(error => console.info('Error sending message to the background script:', error));
    }
});