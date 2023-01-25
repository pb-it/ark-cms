class DataService {

    static sortData(model, sort, arr) {
        if (arr) {
            var parts = sort.split(":");
            if (parts.length == 2) {
                var prop = parts[0];

                var mac = model.getModelAttributesController();
                var attr = mac.getAttribute(prop);

                switch (attr['dataType']) {
                    case 'timestamp':
                        if (parts[1] === "asc")
                            arr.sort(function (a, b) { return new Date(a[prop]) - new Date(b[prop]); });
                        else if (parts[1] === "desc")
                            arr.sort(function (a, b) { return new Date(b[prop]) - new Date(a[prop]); });
                        break;
                    case 'string':
                    case 'text':
                    case 'url':
                    case 'enumeration':
                    case 'json':
                        if (parts[1] === "asc")
                            arr.sort(function (a, b) {
                                if (a[prop] === "" || a[prop] === null) return 1;
                                if (b[prop] === "" || b[prop] === null) return -1;
                                if (a[prop] === b[prop]) return 0;
                                return a[prop].localeCompare(b[prop]);
                            });
                        else if (parts[1] === "desc")
                            arr.sort(function (a, b) {
                                if (a[prop] === "" || a[prop] === null) return 1;
                                if (b[prop] === "" || b[prop] === null) return -1;
                                if (a[prop] === b[prop]) return 0;
                                return b[prop].localeCompare(a[prop]);
                            });
                        break;
                    default:
                        if (parts[1] === "asc")
                            arr.sort(function (a, b) {
                                if (a[prop] === "" || a[prop] === null) return 1;
                                if (b[prop] === "" || b[prop] === null) return -1;
                                if (a[prop] === b[prop]) return 0;
                                return a[prop] - b[prop];
                            });
                        else if (parts[1] === "desc")
                            arr.sort(function (a, b) {
                                if (a[prop] === "" || a[prop] === null) return 1;
                                if (b[prop] === "" || b[prop] === null) return -1;
                                if (a[prop] === b[prop]) return 0;
                                return b[prop] - a[prop];
                            });
                }
            }
        }
        return arr;
    }

    static _getUrl(typeString, id, where, sort, limit) {
        var url = typeString;
        var query = "";
        var params;
        if (id) {
            if (Array.isArray(id)) {
                params = [];
                for (var i = 0; i < id.length; i++) {
                    params.push(`id=${id[i]}`);
                }
                query += "&" + params.join('&');
            } else
                url += "/" + id;
        }
        if (where)
            query += "&" + where;
        if (!id && !sort) {
            var model = app.controller.getModelController().getModel(typeString);
            if (model)
                sort = model.getModelDefaultsController().getDefaultSort();
            else
                throw new Error("Model '" + typeString + "' is not defined");
        }
        if (sort)
            query += "&_sort=" + sort;
        if (!id && !limit)
            limit = "-1";
        if (limit)
            query += "&_limit=" + limit;
        if (query.length > 0)
            url += "?" + query.substring(1);
        return url;
    }

    static getUrlForObjects(objs) {
        if (Array.isArray(objs)) {
            if (objs.length > 0) {
                var obj = objs[0];
                var typeString = obj.getTypeString();
                var ids = objs.map(function (x) {
                    return x.getData()['id'];
                });
            } else
                throw new Error("Invalid data: Empty array");
        } else
            throw new Error("Invalid data: No array");
        return window.location.origin + "/data/" + DataService._getUrl(typeString, ids);
    }

    _cache;

    constructor() {
        this._cache = new Cache();
    }

    getCache() {
        return this._cache;
    }

    async fetchDataByState(state) {
        return await this.fetchData(state.typeString, state.id, state.where, state.sort, state.limit, state.filters, state.search, state.bIgnoreCache);
    }

    async fetchData(typeString, id, where, sort, limit, filters, search, bIgnoreCache) {
        var res;
        var typeUrl;
        var sortlessUrl;
        var model = app.controller.getModelController().getModel(typeString);
        var cache = this._cache.getModelCache(typeString);

        if (bIgnoreCache)
            typeUrl = DataService._getUrl(typeString, id, where, sort, limit);
        else {
            var bSort = false;
            if (id) {
                res = cache.getEntry(id);
                if (Array.isArray(id) && id.length != res.length)
                    res = null;
            } else
                res = cache.getCompleteRecordSet();
            if (res) {
                if (where)
                    res = null; //TODO: apply where - consider '_null='

                if (sort)
                    bSort = true;
            }

            if (!res) {
                typeUrl = DataService._getUrl(typeString, id, where, sort, limit);
                res = cache.getUrl(typeUrl);
                if (!res && sort) {
                    sortlessUrl = DataService._getUrl(typeString, id, where, null, limit);
                    res = cache.getUrl(sortlessUrl);
                    if (res)
                        bSort = true;
                }
            }

            if (bSort)
                res = DataService.sortData(model, sort, res);

            if (res && limit && limit != -1 && res.length > limit)
                res = res.slice(0, limit);
        }

        if (!res) {
            res = await WebClient.fetchJson(app.controller.getApiController().getApiOrigin() + "/api/" + typeUrl);

            var cache = this._cache.getModelCache(typeString);
            if (!id && !where && (!limit || limit == -1)) {
                cache.setCompleteRecordSet(res, sort);
            } else {
                cache.cache(null, typeUrl, res);
                if (sortlessUrl)
                    cache.cache(null, sortlessUrl, res);
            }
        }

        if (filters && filters.length > 0) {
            for (var filter of filters) {
                if (typeof filter.query === 'string' || filter.query instanceof String) {
                    if (filter.query === '[Object]')
                        alert("cannot restore [Object] filter");
                    else if (filter.query.startsWith('{')) {
                        Filter.filterObj(res, new CrudObject(typeString, JSON.parse(filter.query)));
                    } else
                        res = Filter.filterStr(res, filter.query);
                } else {
                    res = Filter.filterObj(res, new CrudObject(typeString, filter.query));
                }
            }

            //TODO: fix sort which may have been destroyed by jpath filters with 'or' concatenation
            if (sort)
                res = DataService.sortData(model, sort, res);
        }

        if (search)
            res = Filter.filterStr(res, search);

        return Promise.resolve(res);
    }

    async fetchObjectById(typeString, id) {
        var res;
        var model = app.controller.getModelController().getModel(typeString);

        var data = await this.fetchData(typeString, id);

        if (data) {
            var C;
            var model = app.controller.getModelController().getModel(typeString);
            if (model.isCollection())
                C = CrudContainer;
            else
                C = CrudObject;

            if (Array.isArray(data)) {
                res = [];
                for (var item of data) {
                    res.push(new C(typeString, item));
                }
            } else
                res = new C(typeString, data);
        }
        return Promise.resolve(res);
    }

    async request(typeString, action, id, data) {
        var res;

        var method;
        switch (action) {
            case ActionEnum.create:
                method = "POST";
                break;
            case ActionEnum.read:
                method = "GET";
                break;
            case ActionEnum.update:
                method = "PUT";
                break;
            case ActionEnum.delete:
                method = "DELETE";
                break;
        }

        var typeUrl;
        if (id)
            typeUrl = typeString + "/" + id;
        else
            typeUrl = typeString;
        var url = app.controller.getApiController().getApiOrigin() + "/api/" + typeUrl;

        if (method && url) {
            var resp = await WebClient.request(method, url, data);
            if (resp) {
                var cache = this._cache.getModelCache(typeString);
                if (action == ActionEnum.delete) {
                    if (resp == "OK") //delete default 200 response text
                        cache.delete(id);
                    else
                        throw new Error("deleting record failed");
                } else {
                    res = JSON.parse(resp);
                    cache.cache(action, typeUrl, res);
                }
            } else
                throw new Error("request returned empty respose");
        }
        return Promise.resolve(res);
    }
}