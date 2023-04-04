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
            res = this._modelCacheArr;
        if (!res) {
            var model = this._controller.getModelController().getModel(name);
            if (!model)
                throw new Error('Unknown model \'' + name + '\'');
            res = new ModelCache(model);
            this._modelCacheArr[name] = res;
        }
        return res;
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
                        if (cache.getCompleteRecordSet())
                            await this._controller.getDataService().fetchData(modelName, id);
                    } else if (method == 'DELETE') {
                        if (cache.getEntry(id))
                            cache.delete(id);
                    }
                }
            }
        }
        this._lastUpdate = date;
        return Promise.resolve();
    }
}