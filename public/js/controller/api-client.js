class ApiClient {

    _baseUrl;
    _version;
    _root;

    constructor(baseUrl) {
        this._baseUrl = baseUrl;
        this._root = this._baseUrl + "/api/";
    }

    setVersion(version) {
        this._version = version;
        this._root = `${this._baseUrl}/api/${this._version}/`;
    }

    getApiRoot() {
        return this._root;
    }

    async request(method, resource, data) {
        return HttpClient.request(method, this._baseUrl + resource, { 'withCredentials': true }, data);
    }

    async requestData(method, resource, data) {
        var res;
        var response = await HttpClient.request(method, this._root + resource, { 'withCredentials': true }, data);
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