class RouteController {

    static CONFIG_ROUTES_IDENT = 'routes';

    _url;
    _routes;

    constructor() {
    }

    async init() {
        this._url = app.controller.getApiController().getApiOrigin() + "/api/_registry";
        var entry = await WebClient.fetchJson(this._url + '?key=routes');
        if (entry && entry.length == 1) {
            var value = entry[0]['value'];
            if (value)
                this._routes = JSON.parse(value);
        }
        return Promise.resolve();
    }

    async setRoutes(routes) {
        this._routes = routes;
        return WebClient.request("PUT", this._url, { 'key': 'routes', 'value': JSON.stringify(this._routes) });
    }

    getRoutes() {
        return this._routes;
    }

    getRoute(name) {
        var res;
        if (this._routes)
            res = this._routes.filter(function (x) { return x.name === name })[0];
        return res;
    }
}