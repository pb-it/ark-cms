class State {

    static getStateFromUrl(url) {
        var state;

        if (!url)
            url = window.location;

        if (url.pathname === '/')
            state = new State();
        else if (url.pathname.startsWith("/data/")) {
            state = new State();
            var path = url.pathname.substring(6);
            var parts = path.split('/');
            if (parts.length > 0) {
                state.typeString = parts[0];
                if (parts.length == 1) {
                    state.action = null; //ActionEnum.read;
                } else if (parts.length == 2) {
                    var part = parts[1];
                    if (isNaN(part)) {
                        if (part === "new")
                            state.action = ActionEnum.create;
                        else
                            throw new Error("invalid url");
                    } else {
                        state.id = parseInt(parts[1]);
                        state.action = ActionEnum.read;
                    }
                } else if (parts.length == 3) {
                    var part = parts[1];
                    if (!isNaN(part)) {
                        state.id = parseInt(parts[1]);
                        if (parts[2] === "edit")
                            state.action = ActionEnum.update;
                        else
                            throw new Error("invalid url");
                    }
                } else
                    throw new Error("invalid url");
            }

            var index = url.href.indexOf("#");//window.location.serach starts with questionmark
            if (index >= 0) {
                path = url.href.substring(0, index);
                state.anchor = url.href.substring(index + 1);
            } else
                path = url.href;

            index = path.indexOf("?");
            if (index >= 0) {
                path.substring(index + 1).split("&").forEach(function (part) {
                    if (part.startsWith("_")) {
                        if (part.startsWith("_sort="))
                            state.sort = decodeURIComponent(part.substring("_sort=".length));
                        else if (part.startsWith("_limit="))
                            state.limit = decodeURIComponent(part.substring("_limit=".length));
                        else if (part.startsWith("_filter=")) {
                            var filter = { "query": decodeURIComponent(part.substring("_filter=".length)) };
                            if (state.filters && state.filters.length > 0)
                                state.filters.push(filter)
                            else
                                state.filters = [filter];
                        }
                        else if (part.startsWith("_search="))
                            state.search = decodeURIComponent(part.substring("_search=".length));
                    }
                    else {
                        if (state.where)
                            state.where = `${state.where}&${decodeURIComponent(part)}`;
                        else
                            state.where = decodeURIComponent(part);
                    }
                });
            }
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
        if (state && state.typeString) {
            url = "/data/" + state.typeString;
            if (state.action) {
                switch (state.action) {
                    case ActionEnum.create:
                        url += "/new";
                        break;
                    case ActionEnum.read:
                        if (state.id)
                            url += "/" + state.id
                        break;
                    case ActionEnum.update:
                        if (state.id)
                            url += "/" + state.id + "/edit";
                        break;
                    case ActionEnum.delete:
                        //TODO:
                        break;
                    default:
                }
            } else {
                if (state.id)
                    url += "/" + state.id
            }

            var purl = "";
            if (state.where)
                purl += "&" + state.where;
            if (state.sort)
                purl += "&_sort=" + encodeURIComponent(state.sort);
            if (state.limit)
                purl += "&_limit=" + state.limit;
            if (state.filters && state.filters.length > 0) {
                for (var filter of state.filters) {
                    if (typeof filter.query === 'string' || filter.query instanceof String)
                        purl += "&_filter=" + encodeURIComponent(filter.query);
                    else
                        purl += "&_filter=[Object]"; //JSON.stringify(state.filter)
                }
            }

            if (state.search)
                purl += "&_search=" + encodeURIComponent(state.search);
            if (purl.length > 0)
                url = `${url}?${purl.substring(1)}`;
        } else
            url = "/";
        return url;
    }

    name;

    path;
    typeString;
    action;
    id;
    data;

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

        this.typeString = data.typeString;
        this.action = data.action;
        this.id = data.id;
        this.data = data.data;

        this.where = data.where;
        this.sort = data.sort;
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
}
