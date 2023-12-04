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
        return Promise.resolve(this._session);
    }

    getSessionInfo() {
        return this._session;
    }

    async reloadModels() {
        await this._apiClient.request("GET", "/sys/reload");
        return Promise.resolve();
    }

    async restartApi(bWaitReady) {
        var res = 1;
        await this._apiClient.request("GET", "/sys/restart");
        if (bWaitReady) {
            await sleep(5000);
            var bReady = await this.waitApiReady(5, 3000);
            if (!bReady) {
                await sleep(2000);
                bReady = await this.waitApiReady(5, 2000);
                if (!bReady) {
                    await sleep(1000);
                    bReady = await this.waitApiReady(5, 1000);
                }
            }
            if (bReady)
                res = 0;
        } else
            res = 0;
        return Promise.resolve(res);
    }

    async waitApiReady(retries = 10, delay = 3000) {
        var bReady = false;
        var tmp;
        var i = 1;
        while (!bReady && i <= retries) {
            if (i > 1)
                await sleep(delay);
            try {
                tmp = await this.fetchApiInfo();
                console.log(tmp);
                if (tmp['state'] === 'running')
                    bReady = true;
            } catch (error) {
                if (error instanceof HttpError && error['response']) {
                    console.log(error);
                    if (error instanceof HttpError && error['response'] && (error['response']['status'] == 401 || error['response']['status'] == 403))
                        bReady = true;
                }
            }
            i++;
        }
        return Promise.resolve(bReady);
    }
}