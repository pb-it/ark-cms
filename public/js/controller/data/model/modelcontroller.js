class ModelController {

    static MODELS_IDENT = 'models';

    _configController;

    _models;

    constructor(configController) {
        this._configController = configController;
    }

    async init() {
        var models;
        const controller = app.getController();
        const ds = controller.getDataService();
        if (ds) {
            /*const cache = ds.getCache();
            const mc = cache.getModelCache('_model');
            await cache.deleteModelCache('_model');*/
            models = await controller.getDataService().fetchData('_model', null, null, null, null, null, null, true);
        } else
            models = await controller.getApiController().getApiClient().requestData('GET', '_model');
        this._models = [];
        if (models) {
            var model;
            for (var data of models) {
                try {
                    model = new XModel(data['definition']);
                    model.setId(data['id']);
                    await model.initModel();
                } catch (error) {
                    controller.showError(error, "Initialising model '" + model.getName() + "' failed");
                }
                this._models.push(model); // still push to enable edit
            }
        }

        $(window).trigger('changed.model');
        //controller.reloadState(); //redraw visualisation with new menus
        //controller.reloadApplication(true);
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

    async getRelations(model) {
        const res = [];
        const name = model.getName();
        var definition;
        for (var m of this._models) {
            definition = m.getDefinition();
            if (definition['name'] != name) {
                if (definition['attributes']) {
                    for (var attr of definition['attributes']) {
                        if (attr['dataType'] == 'relation' && attr['model'] == name)
                            res.push(definition['name'] + '[' + attr['name'] + ']');
                    }
                }
            }
        }
        return Promise.resolve(res);
    }
}