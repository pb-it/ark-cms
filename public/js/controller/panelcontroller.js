class PanelController {

    static createPanel(typeString, data, action) {
        if (!action) {
            if (!data)
                action = ActionEnum.create;
        }
        var obj;
        var model = app.controller.getModelController().getModel(typeString);
        if (model.isCollection())
            obj = new CrudContainer(typeString, data);
        else
            obj = new CrudObject(typeString, data);

        var mpcc = model.getModelPanelConfigController();
        var panelConfig = mpcc.getPanelConfig(action);
        return PanelController.createPanelForObject(obj, panelConfig);
    }

    static createPanelForObject(obj, config) {
        var Cp = config.getPanelClass();
        var panel = new Cp(config, obj);
        if (Cp == MediaPanel && app.controller.getView().getCanvas().isLoading())
            panel.setLazy(true);
        return panel;
    }
}