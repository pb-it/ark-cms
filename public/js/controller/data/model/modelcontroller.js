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
                try {
                    model = new XModel(data['definition']);
                    model.setId(data['id']);
                    await model.initModel();
                } catch (error) {
                    app.controller.showError(error, "Initialising model '" + model.getName() + "' failed");
                }
                this._models.push(model); // still push to enable edit
            }
        }
        $(window).trigger('changed.model');
        return Promise.resolve();
    }

    isModelDefined(name) {
        for (var model of this._models) {
            if (model.getDefinition().name === name)
                return true;
        }
        return false;
    }

    getModels(bIncludeSystem) {
        if (!bIncludeSystem)
            return this._models.filter(function (x) { return x.getDefinition()['name'].charAt(0) !== '_' });
        else
            return this._models;
    }

    getModel(name) {
        return this._models.filter(function (x) { return x.getDefinition()['name'] === name })[0];
    }
}