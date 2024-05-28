class XModel {

    _data;
    _id;
    _version;

    _module;

    _configTabs;
    _sideMenuEntries;
    _contextMenuEntries;
    _doubleClickAction;
    _prepareDataAction;
    _crudDialogActions;

    constructor(data, version) {
        this._data = data;
        this._id = this._data['id'];
        this._version = version;
    }

    async initModel() {
        this._configTabs = [];
        this._sideMenuEntries = [];
        this._contextMenuEntries = ContextMenuController.getContextMenuEntries(this); //TODO:
        this._crudDialogActions = [];

        if (this._data.hasOwnProperty('extensions')) {
            const extension = this._data['extensions']['client'];
            if (extension) {
                this._module = await loadModule(extension);
                // this._crudDialogActions.push(module.checkAction);
                if (this._module && this._module.init)
                    this._module.init.call(this);
                // eval(extension);
                // loadCode(extension);
            }
        }

        const controller = app.getController();
        const ec = controller.getExtensionController();
        if (ec) {
            const extensions = ec.getExtensions();
            if (extensions.length > 0) {
                var module;
                for (var ext of extensions) {
                    module = ext['module'];
                    if (module && typeof module['initModel'] == 'function')
                        await module.initModel(this);
                }
            }
        }

        return Promise.resolve();
    }

    getDefinition() {
        return this._data;
    }

    async setDefinition(data, bUpload = true, bForce) {
        this._data = data;
        if (bUpload)
            await this.uploadData(bForce);
        return Promise.resolve();
    }

    getId() {
        return this._id;
    }

    setId(id) {
        this._id = id;
        this._data['id'] = id;
    }

    getName() {
        return this._data['name'];
    }

    getModule() {
        return this._module;
    }

    async uploadData(bForce, bInit) {
        const controller = app.getController();
        const ac = controller.getApiController();
        var version = this._version;
        if (!version) {
            const info = ac.getApiInfo();
            version = info['version'];
        }
        var resource = "_model?v=" + encodeURIComponent(version);
        if (bForce)
            resource += "&forceMigration=true";
        const id = await ac.getApiClient().requestData("PUT", resource, null, this._data);
        if (bInit) {
            if (!this._id) {
                await controller.getModelController().init(); //TODO: quickfix: reload all models if new one was created
            } else
                await this.initModel();
        }
        this._id = id;
        return Promise.resolve(this._id);
    }

    async deleteModel() {
        if (this._id) {
            const controller = app.getController();
            const ac = controller.getApiController();
            await ac.getApiClient().requestData("DELETE", "_model/" + this._id);
            await controller.getModelController().init(); //TODO: remove single one from controller and update view
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

    getConfigTabs() {
        return this._configTabs;
    }

    getSideMenuEntries() {
        return this._sideMenuEntries;
    }

    getContextMenuEntries() {
        return this._contextMenuEntries;
    }

    getMedia(obj) {
        return Media.parse(obj);
    }

    getPrepareDataAction() {
        return this._prepareDataAction;
    }

    getDoubleClickAction() {
        return this._doubleClickAction;
    }

    getCrudDialogActions() {
        return this._crudDialogActions;
    }
}