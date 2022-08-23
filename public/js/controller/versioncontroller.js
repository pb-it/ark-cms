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
                    this.viewUpdateInfo();
                    bSet = true;
                }
            } else {
                app.controller.getModalController().openPanelInModal(new TutorialPanel());
                bSet = true;
            }
            if (bSet)
                this.setAppVersion(this._appVersion);

            var ac = app.controller.getApiController();
            var info = await ac.fetchApiInfo();
            var appVersion = app.controller.getVersionController().getAppVersion();
            if (appVersion != info['version'])
                this.viewMissmatchInfo();
        }
        return Promise.resolve();
    }

    viewUpdateInfo() {
        var panel = new Panel();

        var $d = $('<div/>')
            .css({ 'padding': '10' });

        $d.append("<b>Info:</b><br/>");
        $d.append("You are now using version '" + this._appVersion + "' of this application.<br/><br/>");

        var $skip = $('<button>')
            .text('View Changelog')
            .click(async function (event) {
                event.stopPropagation();

                window.open('https://github.com/pb-it/wing-cms/blob/main/CHANGELOG.md');
            }.bind(this));
        $d.append($skip);
        var $ok = $('<button>')
            .text('OK')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                this.dispose();
                return Promise.resolve();
            }.bind(panel));
        $d.append($ok);

        panel.setContent($d);

        app.controller.getModalController().openPanelInModal(panel);
    }

    viewMissmatchInfo() {
        var panel = new Panel();

        var $d = $('<div/>')
            .css({ 'padding': '10' });

        $d.append("<b>Info:</b><br/>");
        $d.append("API and client version numbers missmatch! Consider updating the trailing application!<br/><br/>");

        var $ok = $('<button>')
            .text('OK')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                this.dispose();
                return Promise.resolve();
            }.bind(panel));
        $d.append($ok);

        panel.setContent($d);

        app.controller.getModalController().openPanelInModal(panel);
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