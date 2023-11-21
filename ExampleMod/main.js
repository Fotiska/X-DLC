(async () => {
    function inject() {
        sessionStorage.examplemod_sources = JSON.stringify({
            'icon': chrome.runtime.getURL('icon128.png'),
        });
        let mod = window.document.createElement('script');
        mod.src = chrome.runtime.getURL('mod.js');
        window.document.body.appendChild(mod);
    }
    try {
        inject();
        // alert("DLC Injected");
    } catch (e) {
        console.error(e);
        // alert("DLC Injection failed");
    }
})();