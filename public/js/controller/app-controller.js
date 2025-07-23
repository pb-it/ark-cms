class AppController {

    _apps;

    constructor() {
        this._apps = [];
    }

    getApps() {
        return this._apps;
    }

    addApp(app) {
        this._apps.push(app);
    }
}