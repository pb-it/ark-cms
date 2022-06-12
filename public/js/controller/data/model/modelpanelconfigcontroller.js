class ModelPanelConfigController {

    _model;

    constructor(model) {
        this._model = model;

        this._init();
    }

    _init() {
    }

    getPanelConfig(action, details) {
        var panelConfig = new MediaPanelConfig();
        var conf = { ...this._model.getModelDefaultsController().getDefaultPanelConfig() };
        if (details)
            conf['details'] = details;
        panelConfig.init(this._model, action, conf);
        return panelConfig;
    }
}