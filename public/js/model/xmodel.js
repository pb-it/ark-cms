class XModel {

    _data;

    constructor(data) {
        this._data = data;
    }

    init() {
        if (this._data.actions && this._data.actions.init)
            eval(this._data.actions.init);
    }

    getData() {
        return this._data;
    }

    async setData(data, bUpload = true) {
        this._data = data;
        if (bUpload)
            await this.uploadData();
        return Promise.resolve();
    }

    getName() {
        return this._data['name'];
    }

    async uploadData() {
        var url = app.controller.getConfigController().getApiOrigin() + "/models";
        return WebClient.request("PUT", url, this._data);
    }

    getModelAttributesController() {
        return new ModelAttributesController(this);
    }

    getModelDefaultsController() {
        return new ModelDefaultsController(this);
    }

    getModelPanelConfigController() {
        return new ModelPanelConfigController(this);
    }

    getModelStateController() {
        return new ModelStateController(this);
    }

    getModelFilterController() {
        return new ModelFilterController(this);
    }

    isCollection() {
        if (this.getModelDefaultsController().getDefaultCollectionModel())
            return true;
        else if (this.getModelDefaultsController().getDefaultCollectionModelProperty())
            return true;
        else
            return false;
    }

    getCheckAction() {
        var action;
        if (this._data.actions && this._data.actions.check) {
            const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
            action = new AsyncFunction('data', this._data.actions.check);
        }
        return action;
    }

    getContextMenuExtensions() {
        var action;
        if (this._data.actions && this._data.actions.contextMenuExtensions)
            action = new Function('panel', this._data.actions.contextMenuExtensions);
        return action;
    }
}