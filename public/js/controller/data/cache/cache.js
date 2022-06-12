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
            res = new ModelCache(app.controller.getModelController().getModel(name));
            this._modelCacheArr[name] = res;
        }
        return res;
    }
}