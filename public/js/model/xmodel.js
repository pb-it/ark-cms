class XModel {

    _data;
    _id;
    _version;

    constructor(data, version) {
        this._data = data;
        this._id = data['id'];
        delete data['id'];
        this._version = version;
    }

    init() {
        if (this._data.actions && this._data.actions.init)
            eval(this._data.actions.init);
    }

    getData() {
        return this._data;
    }

    async setData(data, bUpload = true, bForce) {
        this._data = data;
        if (bUpload)
            await this.uploadData(bForce);
        $(window).trigger('changed.model', this._data);
        return Promise.resolve();
    }

    getId() {
        return this._id;
    }

    getName() {
        return this._data['name'];
    }

    async uploadData(bForce) {
        var version;
        if (this._version)
            version = this._version;
        else
            version = app.controller.getVersionController().getAppVersion();
        var url = app.controller.getApiController().getApiOrigin() + "/models?v=" + encodeURIComponent(version);
        if (bForce)
            url += "&force=true";
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