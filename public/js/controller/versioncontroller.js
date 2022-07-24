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

    async checkForUpdates() {
        try {
            app.controller.setLoadingState(true);
            var url = 'https://raw.githubusercontent.com/pb-it/wing-cms/main/package.json';
            var pkg = await WebClient.fetchJson(url);
            var version = pkg['version'];
            if (version === this._appVersion)
                alert('You are up to date');
            else
                alert("Version '" + version + "' available");
        } catch (error) {
            app.controller.showError(error);
        } finally {
            app.controller.setLoadingState(false);
        }
        return Promise.resolve();
    }

    getAppVersion() {
        return this._appVersion;
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