class Cache {

    _modelCacheArr;

    constructor() {
        this._modelCacheArr = [];
    }

    getModelCache(name) {
        var res;
        if (name)
            res = this._modelCacheArr[name];
        else
            res = this._modelCacheArr;
        if (!res) {
            var model = app.controller.getModelController().getModel(name);
            if (!model)
                throw new Error('Unknown model \'' + name + '\'');
            res = new ModelCache(model);
            this._modelCacheArr[name] = res;
        }
        return res;
    }
}