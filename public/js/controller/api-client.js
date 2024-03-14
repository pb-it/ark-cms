class ApiClient {

    _baseUrl;
    _version;
    _dataPath;

    constructor(baseUrl) {
        this._baseUrl = baseUrl;
        this._dataPath = "/api/data/";
    }

    setVersion(version) {
        this._version = version;
        this._dataPath = `/api/data/${this._version}/`;
    }

    getDataPath() {
        return this._dataPath;
    }

    async request(method, resource, options, data) {
        if (!options)
            options = { 'withCredentials': true };
        else
            options['withCredentials'] = true;
        return HttpClient.request(method, this._baseUrl + resource, options, data);
    }

    async requestData(method, resource, options, data) {
        var res;
        if (!options)
            options = { 'withCredentials': true };
        else
            options['withCredentials'] = true;
        const response = await HttpClient.request(method, this._baseUrl + this._dataPath + resource, options, data);
        if (response) {
            if (method == 'GET')
                res = JSON.parse(response)['data'];
            else if (method == 'DELETE') // empty or 'OK'
                res = response;
            else
                res = JSON.parse(response);
        }
        return res;
    }
}