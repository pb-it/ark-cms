const APP_VERSION_IDENT = "appVersion";

class VersionController {

    _appVersion;

    constructor() {
    }

    async initVersionController() {
        var infoUrl = window.location.origin + "/system/info";
        var info = await WebClient.fetchJson(infoUrl);
        this._appVersion = info['version'];
        if (this._appVersion) {
            var bSet = false;
            var last;
            if (window.localStorage)
                last = window.localStorage.getItem(APP_VERSION_IDENT);
            if (last) {
                if (last !== this._appVersion) {
                    ; //TODO: show changelog
                    bSet = true;
                }
            } else {
                app.controller.getModalController().openPanelInModal(new TutorialPanel());
                bSet = true;
            }
            if (bSet)
                this.setAppVersion(this._appVersion);
        }
        return Promise.resolve();
    }

    getAppVersion() {
        var version;
        if (window.localStorage)
            version = window.localStorage.getItem(APP_VERSION_IDENT);
        return version;
    }

    setAppVersion(version) {
        if (window.localStorage) {
            if (version)
                window.localStorage.setItem(APP_VERSION_IDENT, version);
            else
                window.localStorage.setItem(APP_VERSION_IDENT, '');
        }
    }
}