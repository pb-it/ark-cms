class ModelController {

    static MODELS_IDENT = 'models';

    _configController;

    _models;

    constructor(configController) {
        this._configController = configController;
    }

    async init() {
        this._models = [];
        var api = this._configController.getApi();
        var url = api.substring(0, api.length - 3) + "models";
        var apiModels = await WebClient.fetchJson(url);
        var model;
        for (var data of apiModels) {
            model = new XModel(data);
            model.init();
            this._models.push(model);
        }
        return Promise.resolve();
    }

    isModelDefined(name) {
        for (var model of this._models) {
            if (model.getData().name === name)
                return true;
        }
        return false;
    }

    getModels() {
        return this._models.filter(function (x) { return x.getData()['name'].charAt(0) !== '_' });
    }

    getModel(name) {
        return this._models.filter(function (x) { return x.getData()['name'] === name })[0];
    }
}