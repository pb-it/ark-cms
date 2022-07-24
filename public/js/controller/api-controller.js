class ApiController {

    _origin;

    constructor(origin) {
        this._origin = origin;
    }

    async reloadModels() {
        this.setLoadingState(true);
        var url = this._origin + "/system/reload";
        await WebClient.request("GET", url);
        this.setLoadingState(false);
        return Promise.resolve();
    }

    async restartApi() {
        this.setLoadingState(true);
        var url = this._origin + "/system/restart";
        await WebClient.request("GET", url);
        //TODO: sleep?
        this.setLoadingState(false);
        return Promise.resolve();
    }

}