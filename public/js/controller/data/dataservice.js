class DataService {

    static BLOCK_SIZE = 100;

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
        if (id) {
            if (Array.isArray(id))
                query += "&id_in=" + id.join(',');
            else
                url += "/" + id;
        }
        if (!id && !sort) {
            var model = app.controller.getModelController().getModel(typeString);
            if (model)
                sort = model.getModelDefaultsController().getDefaultSort();
            else
                throw new Error("Model '" + typeString + "' is not defined");
        }
        if (!id && !limit)
            limit = "-1";
        query += "&" + State.createSearchParamString(where, sort, limit);
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
    _apiClient;

    constructor() {
        this._cache = new Cache();
        this._apiClient = app.getController().getApiController().getApiClient();
    }

    getCache() {
        return this._cache;
    }

    async fetchDataByState(state) {
        var res = await this.fetchData(state.typeString, state.id, state.where, state.sort, state.limit, state.filters, state.search, state.bIgnoreCache);
        return Promise.resolve(res);
    }

    async fetchData(typeString, id, where, sort, limit, filters, search, bIgnoreCache) {
        var res;
        var typeUrl;
        var sortlessUrl;
        var model = app.controller.getModelController().getModel(typeString);
        var cache = this._cache.getModelCache(typeString);
        if (!cache)
            cache = await this._cache.createModelCache(typeString);

        if (bIgnoreCache)
            typeUrl = DataService._getUrl(typeString, id, where, sort, limit);
        else {
            var bSort = false;
            if (id) {
                res = cache.getEntry(id);
                if (Array.isArray(id) && id.length != res.length)
                    res = null;
            } else
                res = await cache.getCompleteRecordSet();
            if (res) {
                if (where)
                    res = null; //TODO: apply where - consider '_null='

                if (sort)
                    bSort = true;
            }

            if (!res) {
                if (id && id.length > DataService.BLOCK_SIZE) {
                    typeUrl = [];
                    var blockCount = Math.ceil(id.length / DataService.BLOCK_SIZE);
                    var ids = new Array(blockCount);
                    /*ids.fill()
                        .map(_ => id.splice(0, DataService.BLOCK_SIZE)); //splice destroys id array */
                    var start = 0;
                    var length = DataService.BLOCK_SIZE;
                    for (var i = 0; i < blockCount; i++) {
                        if (i > 0)
                            start = i * DataService.BLOCK_SIZE;
                        if (i == blockCount - 1)
                            length = id.length % DataService.BLOCK_SIZE;
                        ids[i] = new Array(length);
                        for (var j = 0; j < length; j++)
                            ids[i][j] = id[start + j];
                    }
                    for (var part of ids)
                        typeUrl.push(DataService._getUrl(typeString, part, where, sort, limit));
                } else {
                    typeUrl = DataService._getUrl(typeString, id, where, sort, limit);
                    res = cache.getUrl(typeUrl);
                    if (!res && sort) {
                        sortlessUrl = DataService._getUrl(typeString, id, where, null, limit);
                        res = cache.getUrl(sortlessUrl);
                        if (res)
                            bSort = true;
                    }
                }
            }
        }

        if (!res) {
            var timestamp;
            if (model.getDefinition()['bConfirmFullFetch'] && !id && !where && (!limit || limit == -1)) {
                if (!confirm('Continue fetching all \'' + typeString + '\'?'))
                    throw new Error('Aborted');
            }

            if (Array.isArray(typeUrl)) {
                res = [];
                for (var url of typeUrl) {
                    res = res.concat(await this._apiClient.requestData("GET", url));
                }
            } else {
                var response = await this._apiClient.request("GET", this._apiClient.getDataPath() + typeUrl);
                if (response) {
                    var o = JSON.parse(response);
                    timestamp = o['timestamp'];
                    res = o['data'];
                }
            }

            if (!id && !where && (!limit || limit == -1)) {
                await cache.setCompleteRecordSet(res, sort, timestamp);
            } else {
                if (Array.isArray(typeUrl)) {
                    await cache.cacheData(null, res);
                } else {
                    await cache.cacheData(typeUrl, res);
                    if (sortlessUrl)
                        await cache.cacheData(sortlessUrl, res);
                }
            }
        }

        if (res) {
            if (filters && filters.length > 0) {
                for (var filter of filters) {
                    if (typeof filter.query === 'string' || filter.query instanceof String) {
                        if (filter.query === '[Object]')
                            alert("cannot restore [Object] filter");
                        else if (filter.query.startsWith('{')) {
                            Filter.filterObj(res, new CrudObject(typeString, JSON.parse(filter.query)));
                        } else
                            res = Filter.filterStr(typeString, res, filter.query);
                    } else {
                        res = Filter.filterObj(res, new CrudObject(typeString, filter.query));
                    }
                }
            }

            if (search)
                res = Filter.filterStr(typeString, res, search);

            if (bSort)
                res = DataService.sortData(model, sort, [...res]);

            if (limit && limit != -1 && res.length > limit)
                res = res.slice(0, limit);
        }

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

        var resource;
        if (id)
            resource = typeString + "/" + id;
        else
            resource = typeString;

        if (method && resource) {
            var resp = await this._apiClient.requestData(method, resource, data);
            if (resp) {
                var cache = this._cache.getModelCache(typeString);
                if (!cache)
                    cache = await this._cache.createModelCache(typeString);
                if (action == ActionEnum.delete) {
                    if (resp == "OK") //delete default 200 response text
                        await cache.delete(id);
                    else
                        throw new Error("deleting record failed");
                } else
                    await cache.cacheData(resource, resp);
                res = resp;
            } else
                throw new Error("request returned empty respose");
        }
        return Promise.resolve(res);
    }
}