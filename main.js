(async () => {
    function inject() {
        sessionStorage.api_sources = JSON.stringify({
            'atlas': chrome.runtime.getURL('images/atlas.png'),
            'icon': chrome.runtime.getURL('images/icon128.png'),
            'rgb_lamp': chrome.runtime.getURL('images/rgb_lamp.png'),
            'purple_arrow': chrome.runtime.getURL('images/purple_arrow.png'),
            'purple_diagonal_arrow': chrome.runtime.getURL('images/purple_diagonal_arrow.png'),
        });
        window.document.close();
        window.document.open();
        window.document.write(`<head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="google" content="notranslate"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light only"><title>X Arrows</title><link rel="icon" type="image/x-icon" href="res/favicon.png"><link rel="stylesheet" href="style.css"></head><body><div id="root"></div><script src="${chrome.runtime.getURL('modified_bundle.js')}" async></script><script src="${chrome.runtime.getURL('fapi.js')}" async></script><script src="${chrome.runtime.getURL('dlc_mod.js')}" async></script></body>`);
    }
    try {
        inject();
        // alert("DLC Injected");
    } catch (e) {
        console.error(e);
        // alert("DLC Injection failed");
    }
})();