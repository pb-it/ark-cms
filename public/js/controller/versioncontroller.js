const APP_VERSION_IDENT = "appVersion";

class VersionController {

    static getVersion() {
        var version;
        if (window.localStorage)
            version = window.localStorage.getItem(APP_VERSION_IDENT);
        return version;
    }

    static setVersion(version) {
        if (window.localStorage) {
            if (version)
                window.localStorage.setItem(APP_VERSION_IDENT, version);
            else
                window.localStorage.setItem(APP_VERSION_IDENT, '');
        }
    }

    static checkVersion() {
        var current = app.getAppVersion();
        if (current) {
            var bSet = false;
            var last;
            if (window.localStorage)
                last = window.localStorage.getItem(APP_VERSION_IDENT);
            if (last) {
                if (last !== current) {
                    ; //TODO: show changelog
                    bSet = true;
                }
            } else {
                app.controller.getModalController().openPanelInModal(new TutorialPanel());
                bSet = true;
            }
            if (bSet)
                VersionController.setVersion(current);
        }
    }
}