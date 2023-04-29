class Cache {

    _controller;
    _modelCacheArr;
    _lastUpdate;

    constructor() {
        this._controller = app.getController();
        this._modelCacheArr = [];

        var db = app.getController().getDatabase();
        if (db) {
            var meta = db.getMetaData();
            var timestamp;
            var oldest;
            for (var x in meta) {
                timestamp = new Date(meta[x]);
                if (oldest) {
                    if (timestamp < oldest)
                        oldest = timestamp;
                } else
                    oldest = timestamp;
            }
            this._lastUpdate = oldest;
        } else
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
        delete this._modelCacheArr[name];
        return Promise.resolve();
    }

    async updateCache() {
        var changes;
        var timestamp;
        var apiClient = app.getController().getApiController().getApiClient();
        var response = await apiClient.request("GET", apiClient.getDataPath() + '_change?timestamp_gte=' + this._lastUpdate.toISOString());
        if (response) {
            var o = JSON.parse(response);
            timestamp = o['timestamp'];
            changes = o['data'];
        }
        if (changes && changes.length > 0) {
            var modelName;
            var cache;
            var method;
            var id;
            for (var change of changes) {
                modelName = change['model'];
                cache = this._modelCacheArr[modelName];
                if (cache) {
                    method = change['method'];
                    id = change['record_id'];
                    if (method == 'PUT') {
                        if (cache.getEntry(id))
                            await this._controller.getDataService().fetchData(modelName, id, null, null, null, null, null, true);
                    } else if (method == 'POST') {
                        var rs = await cache.getCompleteRecordSet();
                        if (rs)
                            await this._controller.getDataService().fetchData(modelName, id);
                    } else if (method == 'DELETE') {
                        if (cache.getEntry(id))
                            await cache.delete(id);
                    }
                }
            }
        }
        this._lastUpdate = new Date(timestamp);
        return Promise.resolve(timestamp);
    }
}