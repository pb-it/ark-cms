class RouteController {

    _routes;

    constructor() {
    }

    async init() {
        this._routes = [];
        Promise.resolve();
    }

    getMatchingRoute(path) {
        var res;
        var match;
        if (this._routes) {
            for (var route of this._routes) {
                if (route['regex'] && route['fn']) {
                    match = new RegExp(route['regex'], 'ig').exec(path);
                    if (match) {
                        res = { 'route': route, 'match': match };
                        break;
                    }
                }
            }
        }
        return res;
    }

    addRoute(route) {
        if (route['regex'] && route['fn']) {
            this.deleteRoute(route);
            this._routes.push(route);
        }
    }

    deleteRoute(route) {
        if (route['regex']) {
            this._routes = this._routes.filter(function (x) {
                return x['regex'] !== route['regex'];
            });
        }
    }
}