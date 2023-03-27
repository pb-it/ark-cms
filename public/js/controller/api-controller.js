class ApiController {

    static getDefaultApiOrigin() {
        return "https://" + window.location.hostname;
    }

    _api;
    _info;
    _apiClient;

    constructor(api) {
        this._api = api;
        this._apiClient = new ApiClient(this._api);
    }

    getApiOrigin() {
        return this._api;
    }

    getApiClient() {
        return this._apiClient;
    }

    async fetchApiInfo() {
        this._info = null;
        this._info = await this._apiClient.requestJson("/sys/info?t=" + (new Date()).getTime()); // breaking cache
        return Promise.resolve(this._info);
    }

    getApiInfo() {
        return this._info;
    }

    async reloadModels() {
        await this._apiClient.request("GET", "/sys/reload");
        return Promise.resolve();
    }

    async restartApi() {
        await this._apiClient.request("GET", "/sys/restart");
        return Promise.resolve();
    }

    async waitApiReady() {
        var bReady = false;
        var i = 1;
        while (!bReady && i <= 10) {
            if (i > 1)
                await sleep(3000);
            try {
                await this.fetchApiInfo();
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