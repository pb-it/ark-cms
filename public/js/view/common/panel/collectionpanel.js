class CollectionPanel extends ContainerPanel {

    /**
     * obj needs to be of type container with property items
     * @param {*} config
     * @param {*} obj
     */
    constructor(config, obj) {
        super(config, obj);
    }

    getClass() {
        return CollectionPanel;
    }

    async _init() {
        if (!this._bRendered && this._config.action != ActionEnum.create && this._config.details != DetailsEnum.all) {
            this._initDrop();
        }
        return super._init();
    }

    async _renderContent() {
        this._panels = [];

        var data = this._obj.getData();
        if (data) {
            try {
                await this._obj.initContainer();
                var items = this._obj.getAllItems();
                if (items && items.length > 0) {
                    var model = app.controller.getModelController().getModel(this._obj.getCollectionType());
                    if (model) {
                        var mpcc = model.getModelPanelConfigController();
                        var panelConfig = mpcc.getPanelConfig();
                        var Cp = panelConfig.getPanelClass();

                        var panel;
                        var item;
                        for (var i = 0; i < items.length; i++) {
                            item = items[i];
                            panel = new Cp(panelConfig, item);
                            if (this._bLazy) // app.controller.getView().getCanvas().isLoading()
                                panel.setLazy(true);
                            panel.parent = this;
                            this._panels.push(panel);
                        }
                    }
                }
            } catch (error) {
                app.controller.showError(error);
            }
        }
        return super._renderContent();
    }
}