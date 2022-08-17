class ApiController {

    _api;
    _origin;

    constructor(api) {
        this._api = api;
        if (this._api) {
            var url = new URL(this._api);
            this._origin = url.origin;
            /*if (this._api.endsWith('/'))
                oUrl = this._api.substr(0, this._api.length - 5);
            else
                oUrl = this._api.substr(0, this._api.length - 4);*/
        }
    }

    getApiOrigin() {
        return this._origin;
    }

    async getInfo() {
        return await WebClient.fetchJson(this._origin + "/system/info");
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