class State {

    static createSearchParamString(where, sort, limit, filters, search) {
        var str = "";
        if (where) {
            /*var parts = where.split('&');
            var index;
            for (var part of parts) {
                index = part.indexOf('=');
                if (index == -1)
                    str += '&' + part;
                else
                    str += '&' + part.substring(0, index) + '=' + encodeURIComponent(part.substring(index + 1));
            }*/
            str += "&" + where;
        }
        if (sort)
            str += "&_sort=" + encodeURI(sort); // preserve reserved characters($ & + , / : ; = ? @) - replaceAll('%', '%25');
        if (limit)
            str += "&_limit=" + limit;
        if (filters && filters.length > 0) {
            for (var filter of filters) {
                if (typeof filter.query === 'string' || filter.query instanceof String)
                    str += "&_filter=" + encodeURIComponent(filter.query);
                else
                    str += "&_filter=[Object]"; //JSON.stringify(state.filter)
            }
        }
        if (search)
            str += "&_search=" + encodeURIComponent(search);
        return str;
    }

    static getStateFromUrl(url) {
        if (!url)
            url = window.location;
        return State.getStateFromPath(url.pathname, url.search, url.hash); //url.href
    }

    static getStateFromPath(path, search, fragment) {
        var state;
        if (path === '/')
            state = new State();
        else if (path && path.startsWith("/data/")) {
            var spath = path.substring(6);
            state = new State();

            var index = spath.indexOf("#");
            if (index >= 0) {
                fragment = spath.substring(index + 1);
                spath = spath.substring(0, index);
            }
            if (fragment) {
                if (fragment.startsWith('#'))
                    fragment = fragment.substring(1);
                state.anchor = fragment;
            }
            index = spath.indexOf("?");
            if (index >= 0) {
                search = spath.substring(index + 1);
                spath = spath.substring(0, index);
            }

            var parts = spath.split('/');
            if (parts.length > 0) {
                state.typeString = parts[0];
                if (parts.length == 1) {
                    state.action = null; //ActionEnum.read;
                } else if (parts.length == 2) {
                    if (!isNaN(parts[1])) {
                        state.id = parseInt(parts[1]);
                        state.action = ActionEnum.read;
                    } else if (parts[1].indexOf(',') != -1) {
                        state.id = parts[1].split(',').map(Number);
                        state.action = ActionEnum.read;
                    } else {
                        if (parts[1] === "new")
                            state.action = ActionEnum.create;
                        else {
                            if (parts[1] === "count")
                                state.typeString = null;
                            state.customRoute = spath;
                        }
                    }
                } else if (parts.length == 3) {
                    if (!isNaN(parts[1])) {
                        state.id = parseInt(parts[1]);
                        if (parts[2] === "edit")
                            state.action = ActionEnum.update;
                        else
                            state.customRoute = spath;
                    } else
                        state.customRoute = spath; //throw new Error("invalid url");
                } else
                    state.customRoute = spath; //throw new Error("invalid url");
            }

            if (search) {
                if (search.startsWith("?"))
                    search = search.substring(1);

                if (state.customRoute)
                    state.customRoute += "?" + search;

                state['query'] = [];
                search.split("&").forEach(function (part) {
                    state['query'].push(part);
                    if (part.startsWith("_")) {
                        if (part.startsWith("_sort="))
                            state.sort = decodeURIComponent(part.substring("_sort=".length));
                        else if (part.startsWith("_limit="))
                            state.limit = parseInt(decodeURIComponent(part.substring("_limit=".length)), 10);
                        else if (part.startsWith("_filter=")) {
                            var filter = { "query": decodeURIComponent(part.substring("_filter=".length)) };
                            if (state.filters && state.filters.length > 0)
                                state.filters.push(filter)
                            else
                                state.filters = [filter];
                        }
                        else if (part.startsWith("_search="))
                            state.search = decodeURIComponent(part.substring("_search=".length));
                    } else {
                        if (state.where)
                            state.where = `${state.where}&${part}`;
                        else
                            state.where = part;
                    }
                });
            }
        } else {
            var customRoute = path;
            if (search) {
                if (search.startsWith('?'))
                    customRoute += search;
                else
                    customRoute += `?${search}`;
            }
            state = new State({ 'customRoute': customRoute });
        }
        return state;
    }

    /**
     * state id deserialized - object without methods
     * @param {*} state 
     * @returns 
     */
    static getUrlFromState(state) {
        var url;
        if (state) {
            if (state['customRoute'])
                url = state['customRoute'];
            else if (state.typeString) {
                url = "/data/" + state.typeString;
                var purl = "";

                if (state.action) {
                    switch (state.action) {
                        case ActionEnum.create:
                            url += "/new";
                            break;
                        case ActionEnum.read:
                            if (state['id']) {
                                if (Array.isArray(state['id']))
                                    purl += "&id_in=" + state['id'].join(',');
                                else
                                    url += "/" + state.id;
                            }
                            break;
                        case ActionEnum.update:
                            if (state['id'] && !Array.isArray(state['id']))
                                url += "/" + state['id'] + "/edit";
                            else
                                throw new Error('Invalid state!');
                            break;
                        case ActionEnum.delete:
                            //TODO:
                            break;
                        default:
                    }
                } else {
                    if (state['id']) {
                        if (Array.isArray(state['id']))
                            purl += "&id_in=" + state['id'].join(',');
                        else
                            url += "/" + state.id;
                    }
                }
                var tmp = State.createSearchParamString(state.where, state.sort, state.limit, state.filters, state.search);
                if (tmp)
                    purl += tmp;
                if (purl.length > 0)
                    url = `${url}?${purl.substring(1)}`;
            } else
                url = "/";
        } else
            url = "/";
        return url;
    }

    name;

    customRoute;

    typeString;
    action;
    id;
    data;

    query;
    where;
    sort;
    limit;

    filters;
    search;

    anchor;

    panelConfig;

    bIgnoreCache;

    constructor(data) {
        if (data)
            this.parseFromData(data);
    }

    parseFromData(data) {
        this.name = data.name;

        this.customRoute = data.customRoute;

        this.typeString = data.typeString;
        this.action = data.action;
        this.id = data.id;
        this.data = data.data;

        this.query = data.query;
        this.where = data.where;
        this.sort = data.sort;
        if (data.limit && typeof data.limit == 'string')
            this.limit = parseInt(data.limit, 10);
        else
            this.limit = data.limit;

        this.filters = data.filters;
        this.search = data.search;

        this.anchor = data.anchor;

        if (data.panelConfig) {
            this.panelConfig = new MediaPanelConfig();
            this.panelConfig.initPanelConfig(app.controller.getModelController().getModel(this.typeString), this.action, data.panelConfig);
        }

        this.bIgnoreCache = data.bIgnoreCache
    }

    getModel() {
        return app.controller.getModelController().getModel(this.typeString);
    }

    setQuery(arr) {
        this.query = arr;
        this.where = arr.join('&');
    }
}
