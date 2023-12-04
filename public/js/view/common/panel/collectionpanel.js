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

        const data = this._obj.getData();
        if (data) {
            const controller = app.getController();
            if (this._obj instanceof CrudContainer) {
                try {
                    await this._obj.initContainer();
                    const items = this._obj.getAllItems();
                    if (items && items.length > 0) {
                        const model = controller.getModelController().getModel(this._obj.getCollectionType());
                        if (model) {
                            const mpcc = model.getModelPanelConfigController();
                            const panelConfig = mpcc.getPanelConfig();
                            const Cp = panelConfig.getPanelClass();

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
                    controller.showError(error);
                }
            } else
                throw new Error('CollectionPanel expected CrudContainer but got \'' + this._obj.constructor.name + '\'');
        }
        return super._renderContent();
    }
}