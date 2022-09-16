class XModel {

    static uploadData(data, version, bForce) {
        if (!version)
            version = app.controller.getVersionController().getAppVersion();
        var url = app.controller.getApiController().getApiOrigin() + "/api/_model?v=" + encodeURIComponent(version);
        if (bForce)
            url += "&forceMigration=true";
        return WebClient.request("PUT", url, data);
    }

    _data;
    _id;
    _version;

    _prepareDataAction;
    _crudDialogActions;
    _contextMenuExtensionAction;

    constructor(data, version) {
        this._data = data;
        this._version = version;
    }

    async initModel() {
        this._crudDialogActions = [];

        if (this._data['extensions']) {
            var extension = this._data['extensions']['client'];
            if (extension) {
                var bModule = false; //TODO: create concept/evaluate
                if (bModule) {
                    const objectURL = URL.createObjectURL(new Blob([extension], { type: 'text/javascript' }));
                    const module = await import(objectURL);
                    // this._crudDialogActions.push(module.checkAction);
                } else
                    eval(extension);
            }
        }
        return Promise.resolve();
    }

    getDefinition() {
        return this._data;
    }

    async setDefinition(data, bUpload = true, bForce) {
        if (bUpload)
            await XModel.uploadData(data, this._version, bForce);
        this._data = data;
        if (this._id)
            $(window).trigger('changed.model', this._data);
        return Promise.resolve();
    }

    getId() {
        return this._id;
    }

    setId(id) {
        this._id = id;
    }

    getName() {
        return this._data['name'];
    }

    async uploadData(bForce) {
        return XModel.uploadData(this._data, this._version, bForce)
    }

    async deleteModel() {
        if (this._id) {
            var url = app.controller.getApiController().getApiOrigin() + "/api/_model/" + this._id;
            await WebClient.request("DELETE", url);
        }
        return Promise.resolve();
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

    getPrepareDataAction() {
        return this._prepareDataAction;
    }

    getCrudDialogActions() {
        return this._crudDialogActions;
    }

    getContextMenuExtensionAction() {
        return this._contextMenuExtensionAction;
    }
}