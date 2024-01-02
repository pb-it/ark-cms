class PanelController {

    static createPanel(typeString, data, action) {
        if (!action) {
            if (!data)
                action = ActionEnum.create;
        }
        var obj;
        const controller = app.getController();
        const model = controller.getModelController().getModel(typeString);
        if (model.isCollection())
            obj = new CrudContainer(typeString, data);
        else
            obj = new CrudObject(typeString, data);
        const mpcc = model.getModelPanelConfigController();
        const panelConfig = mpcc.getPanelConfig(action);
        return PanelController.createPanelForObject(obj, panelConfig);
    }

    static createPanelForObject(obj, config) {
        const Cp = config.getPanelClass();
        const panel = new Cp(config, obj);
        if (Cp == MediaPanel && app.getController().getView().getCanvas().isLoading())
            panel.setLazy(true);
        return panel;
    }

    _panels;

    constructor() {
        this._panels = {
            'CrudPanel': CrudPanel,
            'MediaPanel': MediaPanel,
            'CollectionPanel': CollectionPanel
        };
    }

    async init() {

        return Promise.resolve();
    }

    getPanelClass(name) {
        var res;
        if (name)
            res = this._panels[name];
        else
            res = this._panels;
        return res;
    }

    addPanelClass(name, clazz) {
        this._panels[name] = clazz;
    }
}