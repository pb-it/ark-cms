class Cache {

    _controller;
    _modelCacheArr;
    _lastUpdate;

    constructor() {
        this._controller = app.getController();
        this._modelCacheArr = [];
        this._lastUpdate = new Date();
    }

    async getModelCache(name) {
        var res;
        if (name)
            res = this._modelCacheArr[name];
        else
            res = { ...this._modelCacheArr };
        if (!res && name) {
            var model = this._controller.getModelController().getModel(name);
            if (!model)
                throw new Error('Unknown model \'' + name + '\'');
            var cache = new ModelCache(model);
            await cache.initCache();
            this._modelCacheArr[name] = cache;
            res = cache;
        }
        return Promise.resolve(res);
    }

    async deleteModelCache(name) {
        var db = app.getController().getDatabase();
        if (db)
            await db.deleteObjectStore(name);
        delete this._modelCacheArr[name];
        return Promise.resolve();
    }

    async update() {
        var date = new Date();
        var changes = await this._controller.getDataService().fetchData('_change', null, 'timestamp_gte=' + this._lastUpdate.toISOString());
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
        this._lastUpdate = date;
        return Promise.resolve();
    }
}