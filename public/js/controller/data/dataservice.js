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
                        var dt;
                        var funcSort;
                        const dtc = app.getController().getDataTypeController();
                        if (dtc)
                            dt = dtc.getDataType(attr['dataType']);
                        if (dt)
                            funcSort = dt.getSortFunction();
                        if (funcSort)
                            funcSort(arr, parts[1]);
                        else {
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
            var model = app.getController().getModelController().getModel(typeString);
            if (model)
                sort = model.getModelDefaultsController().getDefaultSort();
            else
                throw new Error("Model '" + typeString + "' is not defined");
        }
        if (!id && !limit)
            limit = "-1";
        var tmp = State.createSearchParamString(where, sort, limit);
        if (tmp)
            query += tmp;
        if (query.length > 0)
            url += "?" + query.substring(1);
        return url;
    }

    static getUrlForObjects(objs) {
        var url;
        if (Array.isArray(objs)) {
            if (objs.length > 0) {
                var obj = objs[0];
                var typeString = obj.getTypeString();
                var model = obj.getModel();
                var def = model.getDefinition();
                var ids;
                var where;
                if (def['options']['increments']) {
                    ids = objs.map(function (x) {
                        return x.getData()['id'];
                    });
                } else {
                    var attributes = model.getModelAttributesController().getAttributes();
                    var prime = [];
                    for (var attr of attributes) {
                        if (attr['primary'])
                            prime.push(attr['name']);
                    }
                    if (prime.length == 1) {
                        var key = prime[0];
                        for (var item of objs) {
                            if (where)
                                where += "&" + key + "=" + item.getData()[key];
                            else
                                where = key + "=" + item.getData()[key];
                        }
                    } else
                        throw new Error('Failed to determine primary key!');
                }
                url = window.location.origin + "/data/" + DataService._getUrl(typeString, ids, where);
            } else
                throw new Error("Invalid data: Empty array");
        } else
            throw new Error("Invalid data: No array");
        return url;
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
        var tmp;
        var typeUrl;
        var sortlessUrl;
        var bSort = false;
        const model = app.getController().getModelController().getModel(typeString);
        var cache = this._cache.getModelCache(typeString);
        if (!cache) {
            if (model) {
                if (model.getDefinition()['options']['increments'])
                    cache = await this._cache.createModelCache(model);
            } else
                throw new Error('Unknown model \'' + typeString + '\'');
        }
        if (cache && !bIgnoreCache) {
            if (id) {
                tmp = cache.getEntry(id);
                if (tmp && (!Array.isArray(id) || id.length == tmp.length))
                    res = tmp;
            } else {
                typeUrl = DataService._getUrl(typeString, id, where, sort, limit);
                res = cache.getUrl(typeUrl);
                if (!res && sort) {
                    sortlessUrl = DataService._getUrl(typeString, id, where, null, limit);
                    res = cache.getUrl(sortlessUrl);
                    if (res)
                        bSort = true;
                }
                if (!res && !where) { //TODO: apply where - consider '_null='
                    res = await cache.getCompleteRecordSet();
                    if (res) {
                        if (sort)
                            bSort = true;
                    }
                }
            }
        }

        if (!res) {
            const bFullFetch = !id && !where && (!limit || limit == -1);
            const oFullFetch = model.getDefinition()['oFullFetch'];
            if (bFullFetch) {
                if (oFullFetch && oFullFetch['bConfirmation'] && !confirm('Continue fetching all \'' + typeString + '\'?'))
                    throw new Error('Aborted');
            }

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
                if (typeUrl) {
                    if (bFullFetch && oFullFetch && oFullFetch['paging']) {
                        typeUrl = [];
                        tmp = await this._apiClient.request("GET", this._apiClient.getDataPath() + DataService._getUrl(typeString, null, null, 'id:desc', 1));
                        if (tmp) {
                            var o = JSON.parse(tmp);
                            if (o['data'] && o['data'].length == 1) {
                                const last = o['data'][0]['id'];
                                var blockCount = Math.ceil(last / oFullFetch['paging']);
                                var start = 0;
                                var end;
                                var whereBlock;
                                for (var i = 0; i < blockCount; i++) {
                                    if (i > 0)
                                        start = i * oFullFetch['paging'];
                                    else
                                        start = 0;
                                    if (i == blockCount - 1)
                                        end = -1;
                                    else
                                        end = start + oFullFetch['paging'];
                                    if (start != 0)
                                        whereBlock = 'id_gt=' + start;
                                    else
                                        whereBlock = '';
                                    if (end != -1) {
                                        if (whereBlock)
                                            whereBlock += '&';
                                        whereBlock += 'id_lte=' + end;
                                    }
                                    typeUrl.push(DataService._getUrl(typeString, null, whereBlock, 'id:asc'));
                                }
                            }
                        }
                        bSort = true;
                    }
                } else {
                    typeUrl = DataService._getUrl(typeString, id, where, sort, limit);
                    if (sort)
                        sortlessUrl = DataService._getUrl(typeString, id, where, null, limit);
                }
            }

            var timestamp;
            if (Array.isArray(typeUrl)) {
                res = [];
                var response;
                var o;
                for (var url of typeUrl) {
                    response = await this._apiClient.request("GET", this._apiClient.getDataPath() + url);
                    if (response) {
                        o = JSON.parse(response);
                        if (!timestamp)
                            timestamp = o['timestamp'];
                        res = res.concat(o['data']);
                    }
                }
            } else {
                var response = await this._apiClient.request("GET", this._apiClient.getDataPath() + typeUrl);
                if (response) {
                    var o = JSON.parse(response);
                    timestamp = o['timestamp'];
                    res = o['data'];
                }
            }

            if (cache) {
                if (bFullFetch) {
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

            if (bSort || (id && Array.isArray(id) && sort)) {
                if (!sort)
                    sort = model.getModelDefaultsController().getDefaultSort();
                if (sort)
                    res = DataService.sortData(model, sort, [...res]);
            }

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
            default:
                throw new Error('Unknown action \'' + action + '\'');
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
                if (!cache) {
                    const model = app.getController().getModelController().getModel(typeString);
                    if (model)
                        cache = await this._cache.createModelCache(model);
                    else
                        throw new Error('Unknown model \'' + typeString + '\'');
                }
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