class Cache {

    _controller;
    _modelCacheArr;

    constructor() {
        this._controller = app.getController();
        this._modelCacheArr = [];
    }

    getModelCache(name) {
        var res;
        if (name)
            res = this._modelCacheArr[name];
        else
            res = { ...this._modelCacheArr };
        return res;
    }

    async createModelCache(model) {
        const name = model.getName();
        const cache = new ModelCache(model);
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

    async getChanges(id) {
        var changes;
        const apiClient = app.getController().getApiController().getApiClient();
        const response = await apiClient.request('GET', apiClient.getDataPath() + '_change?id_gt=' + id); // model_neq=\\_%
        if (response)
            changes = JSON.parse(response);
        return Promise.resolve(changes);
    }

    async applyChanges(changes) {
        var last;
        if (changes) {
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
                    if (!last || change['id'] > last)
                        last = change['id'];
                    modelName = change['model'];
                    if (!modelName.startsWith('_')) {
                        model = this._controller.getModelController().getModel(modelName);
                        if (model) {
                            if (this._modelCacheArr[modelName])
                                cache = this._modelCacheArr[modelName];
                            else
                                cache = await this.createModelCache(model);
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
                    }
                }

                if (Object.keys(changed).length > 0) {
                    const ds = this._controller.getDataService();
                    const promises = [];
                    for (const [key, value] of Object.entries(changed)) {
                        cache = this._modelCacheArr[key];
                        if (cache) {
                            id = null;
                            rs = await cache.getCompleteRecordSet();
                            if (rs)
                                id = value;
                            else {
                                entry = cache.getEntry(value);
                                if (entry.length > 0)
                                    id = entry.map(x => x['id']);
                            }
                            if (id)
                                promises.push(ds.fetchData(key, id, null, null, null, null, null, true));
                        }
                    }
                    if (promises.length > 0)
                        await Promise.all(promises);
                }
            }
        }
        return Promise.resolve(last);
    }

    async update() {
        const ds = this._controller.getDataService();
        const promises = [];
        for (const [key, value] of Object.entries(this._modelCacheArr)) {
            promises.push(ds.fetchData(key, null, null, null, null, null, null, true));
        }
        if (promises.length > 0)
            await Promise.all(promises);
        return Promise.resolve();
    }
}