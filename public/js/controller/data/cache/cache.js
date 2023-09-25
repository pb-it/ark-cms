class Cache {

    _controller;
    _modelCacheArr;
    _lastUpdate;

    constructor() {
        this._controller = app.getController();
        this._modelCacheArr = [];

        this._lastUpdate = new Date();
    }

    getModelCache(name) {
        var res;
        if (name)
            res = this._modelCacheArr[name];
        else
            res = { ...this._modelCacheArr };
        return res;
    }

    async createModelCache(name) {
        var model = this._controller.getModelController().getModel(name);
        if (!model)
            throw new Error('Unknown model \'' + name + '\'');
        var cache = new ModelCache(model);
        await cache.initCache();
        this._modelCacheArr[name] = cache;
        return Promise.resolve(cache);
    }

    async deleteModelCache(name) {
        if (name)
            delete this._modelCacheArr[name];
        else
            this._modelCacheArr = [];
        return Promise.resolve();
    }

    async getChanges(start) {
        var changes;
        if (!start)
            start = this._lastUpdate;
        if (start) {
            var apiClient = app.getController().getApiController().getApiClient();
            var response = await apiClient.request("GET", apiClient.getDataPath() + '_change?timestamp_gte=' + start.toISOString());
            if (response)
                changes = JSON.parse(response);
        }
        return Promise.resolve(changes);
    }

    async applyChanges(changes) {
        var timestamp;
        if (changes) {
            timestamp = changes['timestamp'];
            var data = changes['data'];
            if (data && data.length > 0) {
                var modelName;
                var model;
                var cache;
                var rs;
                var method;
                var id;
                var entry;
                var changed = {};
                var tmp;
                for (var change of data) {
                    modelName = change['model'];
                    model = this._controller.getModelController().getModel(modelName);
                    if (this._modelCacheArr[modelName])
                        cache = this._modelCacheArr[modelName];
                    else
                        cache = await this.createModelCache(modelName);
                    method = change['method'];
                    id = change['record_id'];
                    if (method == 'PUT') {
                        entry = cache.getEntry(id);
                        if (entry) {
                            if (changed[modelName]) {
                                if (!changed[modelName].includes(id))
                                    changed[modelName].push(id);
                            } else
                                changed[modelName] = [id];
                        }
                        tmp = CrudObject.getChangedRelations(model, entry, change['data']);
                    } else if (method == 'POST') {
                        rs = await cache.getCompleteRecordSet();
                        if (rs) {
                            if (changed[modelName]) {
                                if (!changed[modelName].includes(id))
                                    changed[modelName].push(id);
                            } else
                                changed[modelName] = [id];
                        }
                        tmp = CrudObject.getChangedRelations(model, null, change['data']);
                    } else if (method == 'DELETE') {
                        if (cache.getEntry(id))
                            await cache.delete(id);
                        tmp = null; //TODO: use change['data'] after adaptation of API implementation 
                    } else
                        throw new Error('Unknown method!');
                    if (tmp && Object.keys(tmp).length > 0) {
                        for (const [key, value] of Object.entries(tmp)) {
                            if (changed[key]) {
                                if (Array.isArray(value)) {
                                    for (var x of value) {
                                        if (!changed[key].includes(x))
                                            changed[key].push(x);
                                    }
                                } else {
                                    if (!changed[key].includes(value))
                                        changed[key].push(value);
                                }
                            } else {
                                if (Array.isArray(value))
                                    changed[key] = value;
                                else
                                    changed[key] = [value];
                            }
                        }
                    }
                }

                if (Object.keys(changed).length > 0) {
                    var ds = this._controller.getDataService();
                    var promises = [];
                    for (const [key, value] of Object.entries(changed)) {
                        if (this._modelCacheArr[key])
                            cache = this._modelCacheArr[key];
                        else
                            cache = await this.createModelCache(key);
                        rs = await cache.getCompleteRecordSet();
                        if (rs)
                            entry = value;
                        else
                            entry = cache.getEntry(value);
                        if (entry.length > 0)
                            promises.push(ds.fetchData(key, entry, null, null, null, null, null, true));
                    }
                    if (promises.length > 0)
                        await Promise.all(promises);
                }
            }
            if (timestamp)
                this._lastUpdate = new Date(timestamp);
        }
        return Promise.resolve(timestamp);
    }
}