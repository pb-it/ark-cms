class ModelController {

    static MODELS_IDENT = 'models';

    _configController;

    _models;

    constructor(configController) {
        this._configController = configController;
    }

    async init() {
        this._models = [];
        var ac = app.controller.getApiController();
        var modelsUrl = ac.getApiOrigin() + "/api/_model";
        var apiModels = await WebClient.fetchJson(modelsUrl);
        if (apiModels) {
            var model;
            for (var data of apiModels) {
                model = new XModel(data['definition']);
                model.setId(data['id']);
                model.init();
                this._models.push(model);
            }
        }
        $(window).trigger('changed.model');
        return Promise.resolve();
    }

    isModelDefined(name) {
        for (var model of this._models) {
            if (model.getData().name === name)
                return true;
        }
        return false;
    }

    getModels(bIncludeSystem) {
        if (!bIncludeSystem)
            return this._models.filter(function (x) { return x.getData()['name'].charAt(0) !== '_' });
        else
            return this._models;
    }

    getModel(name) {
        return this._models.filter(function (x) { return x.getData()['name'] === name })[0];
    }
}