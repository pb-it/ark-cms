class ApiController {

    _origin;

    constructor(origin) {
        this._origin = origin;
    }

    async reloadModels() {
        app.controller.setLoadingState(true);
        var url = this._origin + "/system/reload";
        await WebClient.request("GET", url);
        app.controller.setLoadingState(false);
        return Promise.resolve();
    }

    async restartApi() {
        app.controller.setLoadingState(true);
        var url = this._origin + "/system/restart";
        await WebClient.request("GET", url);
        //TODO: sleep?
        app.controller.setLoadingState(false);
        return Promise.resolve();
    }

}