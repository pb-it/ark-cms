const APP_VERSION_IDENT = "appVersion";

class VersionController {

    static compatible(v1, v2) {
        var bCompatible = false;
        var arrV1;
        var arrV2;
        var index = v1.indexOf('-');
        if (index != -1)
            arrV1 = v1.substring(0, index).split('.');
        else
            arrV1 = v1.split('.');
        index = v2.indexOf('-');
        if (index != -1)
            arrV2 = v2.substring(0, index).split('.');
        else
            arrV2 = v2.split('.');
        if (arrV1.length == 3 && arrV2.length == 3) {
            try {
                var i1 = parseInt(arrV1[0], 10);
                var i2 = parseInt(arrV2[0], 10);
                bCompatible = ((parseInt(arrV1[0], 10) == parseInt(arrV2[0], 10)) &&
                    (parseInt(arrV1[1], 10) == parseInt(arrV2[1], 10)) &&
                    (parseInt(arrV1[2], 10) <= parseInt(arrV2[2], 10)));
            } catch (error) {
                throw new Error('Invalid version number detected');
            }
        } else
            throw new Error('Invalid version number detected');
        return bCompatible;
    }

    static viewNewVersionInfo(version) {
        var panel = new Panel();

        var $d = $('<div/>')
            .css({ 'padding': '10' });

        $d.append("<h2>Info</h2>");
        $d.append("You are now using version '" + version + "' of this application.<br/><br/>");

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

    static viewMissmatchInfo() {
        var panel = new Panel();

        var $d = $('<div/>')
            .css({ 'padding': '10' });

        $d.append("<h2>Info</h2>");
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

    static async checkForUpdates(current) {
        try {
            app.controller.setLoadingState(true);
            var url = 'https://raw.githubusercontent.com/pb-it/wing-cms/main/package.json';
            var response = await HttpClient.request('GET', url);
            var pkg = JSON.parse(response);
            var version = pkg['version'];
            if (version === current)
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

    _appVersion;

    constructor() {
    }

    async initVersionController() {
        var infoUrl = window.location.origin + "/cms/info";
        var response = await HttpClient.request('GET', infoUrl);
        var info = JSON.parse(response);
        this._appVersion = info['version'];
        if (this._appVersion) {
            var bSet = false;
            var last;
            if (window.localStorage)
                last = window.localStorage.getItem(APP_VERSION_IDENT);
            if (last) {
                if (last !== this._appVersion) {
                    VersionController.viewNewVersionInfo(this._appVersion);
                    bSet = true;
                }
            } else {
                app.controller.getModalController().openPanelInModal(new TutorialPanel());
                bSet = true;
            }
            if (bSet)
                this._setAppVersion(this._appVersion);

            var ac = app.controller.getApiController();
            var info = await ac.fetchApiInfo();
            this._bCompatible = VersionController.compatible(info['version'], this._appVersion);
            if (!this._bCompatible)
                VersionController.viewMissmatchInfo(); //TODO: throw error / block access
        }
        return Promise.resolve();
    }

    isCompatible() {
        return this._bCompatible;
    }

    async checkForUpdates() {
        return VersionController.checkForUpdates(this._appVersion);
    }

    getAppVersion() {
        return this._appVersion;
    }

    _setAppVersion(version) {
        if (window.localStorage) {
            if (version)
                window.localStorage.setItem(APP_VERSION_IDENT, version);
            else
                window.localStorage.setItem(APP_VERSION_IDENT, '');
        }
    }

    clearAppVersion() {
        if (window.localStorage)
            window.localStorage.removeItem(APP_VERSION_IDENT);
    }
}