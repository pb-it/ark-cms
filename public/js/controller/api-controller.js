class ApiController {

    static getDefaultApiOrigin() {
        return "https://" + window.location.hostname;
    }

    _api;
    _apiClient;
    _info;
    _session;
    _bAdministrator;

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

    async fetchSessionInfo() {
        this._session = null;
        this._session = await this._apiClient.requestJson("/sys/session?t=" + (new Date()).getTime());
        this._bAdministrator = false;
        if (this._session) {
            if (this._session['auth']) {
                if (this._session['user'] && this._session['user']['roles']) {
                    for (var role of this._session['user']['roles']) {
                        if (role == 'administrator') {
                            this._bAdministrator = true;
                            break;
                        }
                    }
                }
            } else
                this._bAdministrator = true;
        }
        return Promise.resolve(this._session);
    }

    getSessionInfo() {
        return this._session;
    }

    isAdministrator() {
        return this._bAdministrator;
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