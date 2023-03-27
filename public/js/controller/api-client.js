class ApiClient {

    _baseUrl;

    constructor(baseUrl) {
        this._baseUrl = baseUrl;
    }

    async request(method, resource, data) {
        return HttpClient.request(method, this._baseUrl + resource, { 'withCredentials': true }, data);
    }

    async requestJson(resource) {
        var obj;
        var response = await this.request('GET', resource);
        if (response)
            obj = JSON.parse(response);
        return obj;
    }
}