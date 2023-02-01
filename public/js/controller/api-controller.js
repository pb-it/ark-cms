class ApiController {

    static getDefaultApiOrigin() {
        return "https://" + window.location.hostname;
    }

    _api;
    _info;

    constructor(api) {
        this._api = api;
    }

    getApiOrigin() {
        return this._api;
    }

    async fetchApiInfo() {
        this._info = null;
        this._info = await WebClient.fetchJson(this._api + "/sys/info?t=" + (new Date()).getTime()); // breaking cache
        return Promise.resolve(this._info);
    }

    getApiInfo() {
        return this._info;
    }

    async reloadModels() {
        var url = this._api + "/sys/reload";
        await WebClient.request("GET", url);
        return Promise.resolve();
    }

    async restartApi() {
        var url = this._api + "/sys/restart";
        await WebClient.request("GET", url);
        return Promise.resolve();
    }

    async waitApiReady() {
        var bReady = false;
        var i = 1;
        while (!bReady && i <= 10) {
            if (i > 1)
                await sleep(3000);
            try {
                await app.controller.getApiController().fetchApiInfo();
                bReady = true;
            } catch (error) {
                if (error && (error.status == 401 || error.status == 403))
                    bReady = true;
            }
            i++;
        }
        return Promise.resolve(bReady);
    }
}