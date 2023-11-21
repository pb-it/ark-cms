class ApiController {

    static getDefaultApiOrigin() {
        var url = "https://" + window.location.hostname;
        if (window.location.port)
            url += ':3002';
        return url;
    }

    _api;
    _apiClient;
    _info;
    _session;
    _bAdministrator;

    constructor(api) {
        if (api && api.endsWith('/'))
            this._api = api.substring(0, api.length - 1);
        else
            this._api = api;
    }

    async initApiController() {
        if (this._api && this._api.startsWith('http')) {
            this._apiClient = new ApiClient(this._api);
            var response = await HttpClient.request("GET", this._api + "/sys/info", { 'timeout': 5000, 'withCredentials': true });
            if (response) {
                try {
                    const info = JSON.parse(response);
                    if (info['api']) {
                        var version = info['api']['version'];
                        if (version)
                            this._apiClient.setVersion(version);
                    }
                } catch (error) {
                    throw new Error('Unparseable API response');
                }
            }
        } else
            throw new Error('Invalid API configured');
        return Promise.resolve();
    }

    getApiOrigin() {
        return this._api;
    }

    getApiClient() {
        return this._apiClient;
    }

    async fetchApiInfo() {
        this._info = null;
        var response = await this._apiClient.request("GET", "/sys/info?t=" + (new Date()).getTime()); // breaking cache
        if (response)
            this._info = JSON.parse(response);
        return Promise.resolve(this._info);
    }

    getApiInfo() {
        return this._info;
    }

    async fetchSessionInfo() {
        this._session = null;
        var response = await this._apiClient.request("GET", "/sys/session?t=" + (new Date()).getTime());
        if (response)
            this._session = JSON.parse(response);
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
                if (error instanceof HttpError && error['response']) {
                    if (error['response']['status'] == 401 || error['response']['status'] == 403)
                        bReady = true;
                }
            }
            i++;
        }
        return Promise.resolve(bReady);
    }
}