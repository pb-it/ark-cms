class Controller {

    _model;
    _view;

    _logger;

    _storageController;
    _configController;
    _apiController;
    _versionController;
    _stateController;

    _bConnection = false;

    _bLoading = false;
    _selected;

    _dataservice;

    _data;

    _modelController;
    _profileController;
    _routeController;
    _bookmarkController;

    _panelController;
    _modalController;

    constructor(model, view) {
        this._model = model;
        this._view = view;

        this._selected = [];
    }

    getLogger(name) {
        var logger;
        if (!name)
            name = '';
        if (this._logger)
            logger = this._logger[name];
        else
            this._logger = [];
        if (!logger) {
            logger = new Logger();
            this._logger[name] = logger;
        }
        return logger;
    }

    getView() {
        return this._view;
    }

    getStorageController() {
        return this._storageController;
    }

    getConfigController() {
        return this._configController;
    }

    getApiController() {
        return this._apiController;
    }

    getVersionController() {
        return this._versionController;
    }

    getStateController() {
        return this._stateController;
    }

    getModelController() {
        return this._modelController;
    }

    getRouteController() {
        return this._routeController;
    }

    getProfileController() {
        return this._profileController;
    }

    getBookmarkController() {
        return this._bookmarkController;
    }

    getDataService() {
        return this._dataservice;
    }

    getPanelController() {
        return this._panelController;
    }

    getModalController() {
        return this._modalController;
    }

    async initController() {
        var bInitDone = false;
        this._bConnection = false;
        this.setLoadingState(true);

        this._storageController = new StorageController();

        this._configController = new ConfigController();
        await this._configController.initConfigController();

        this._apiController = new ApiController(this._configController.getApi());

        this._modalController = new ModalController(); //VersionController may open a modal

        try {
            this._versionController = new VersionController();
            await this._versionController.initVersionController();

            this._stateController = new StateController();
            //this._view.init(); //TODO: untidy/unlovely that view depends on parsed state

            this._panelController = new PanelController();

            this._modelController = new ModelController(this._configController);
            await this._modelController.init();

            this._dataservice = new DataService();

            this._routeController = new RouteController();
            await this._routeController.init();

            this._profileController = new ProfileController();
            await this._profileController.init();

            this._bookmarkController = new BookmarkController();
            await this._bookmarkController.init();

            this._bConnection = true;
            bInitDone = true;
        } catch (error) {
            this.showError(error, "Connection to API failed");
        } finally {
            this.setLoadingState(false);
        }
        return Promise.resolve(bInitDone);
    }

    hasConnection() {
        return this._bConnection;
    }

    async loadState(state, push, replace) {
        this._data = null;
        try {
            if (!this._versionController.hasOpenModal())
                this._modalController.closeAll();

            this.setLoadingState(true);

            this._stateController.setState(state, push, replace);
            this.clearSelected();
            this._view.init();

            var typeString;
            var bSpecial = false;
            if (state) {
                typeString = state.typeString;
                if (typeString !== null && typeString !== undefined) {
                    var mc = app.controller.getModelController();
                    if (mc.isModelDefined(typeString)) {
                        var action = state.action;
                        if (!action || action != ActionEnum.create)
                            this._data = await this._dataservice.fetchDataByState(state);
                    } else {
                        bSpecial = true;
                        var rc = app.controller.getRouteController();
                        var route = rc.getRoute(typeString);
                        if (route) {
                            const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
                            new AsyncFunction(route['code'])();
                        } else
                            throw new Error("Unknown model '" + typeString + "'");
                    }
                }
            }
            if (typeString) {
                if (!bSpecial)
                    await this.updateCanvas();
            } else {
                var homePanels = [];
                /*var panel = new Panel();
                panel.setContent(`TODO:<br/>
                Allow customizing 'Home' page with panels/shortcuts - see following panels for examles`);
                homePanels.push(panel);
    
                panel = new Panel();
                panel.setContent(`common tasks:<br/>
                <a href="#" onclick=\"event.stopPropagation();ModelSelect.openCreateModelModal();return false;\">create model</a><br/>...`);
                homePanels.push(panel);
    
                panel = new Panel();
                panel.setContent(`recently created models/entries:</br>...`);
                homePanels.push(panel);
    
                panel = new Panel();
                panel.setContent(`recently / most used / favourite states:</br>...`);
                homePanels.push(panel);*/

                await this._view.getCanvas().showPanels(homePanels);
            }
        } catch (error) {
            this.showError(error);
        } finally {
            if (state)
                state.bIgnoreCache = false;
            this.setLoadingState(false);
        }
    }

    showError(error, msg) {
        if (error) {
            if (!msg) {
                if (error.status && error.statusText) {
                    if (error.response)
                        msg = error.status + ": " + error.response;
                    else
                        msg = error.status + ": " + error.statusText;
                } else if (error.message)
                    msg = error.message;
            }
            console.log(error);
        }
        if (!msg)
            msg = "An error has occurred";
        this._modalController.openErrorModal(error, msg);
    }

    showErrorMessage(msg) {
        var logger = this.getLogger();
        logger.addLogEntry(new LogEntry(msg, SeverityEnum.ERROR));
        alert(msg);
    }

    async updateCanvas() {
        var state = this._stateController.getState();
        await this._view.getCanvas().showData(this._data, state.typeString, state.action);
        return Promise.resolve();
    }

    async select(ctrl, shift, panel) {
        if (ctrl == true) {
            if (panel.isSelected()) {
                this._selected.splice(this._selected.indexOf(panel), 1);
                await panel.select(false);
            } else {
                this._selected.push(panel);
                await panel.select(true);
            }
        } else if (shift == true) {
            var last = this._selected[this._selected.length - 1];
            this._selected = [];
            var panels = this._view.getCanvas().getPanels();
            var p;
            var bSelect = false;
            var bSecondMatch = false;
            for (var i = 0; i < panels.length; i++) {
                p = panels[i];
                if (!bSecondMatch && (p == last || p == panel)) {
                    if (bSelect)
                        bSecondMatch = true;
                    else
                        bSelect = true;
                }

                if (bSelect)
                    this._selected.push(p);
                if (p.isSelected() != bSelect)
                    await p.select(bSelect);

                if (bSelect && bSecondMatch)
                    bSelect = false;
            }
        } else {
            await this.clearSelected();
            this._selected.push(panel);
            await panel.select(true);
        }
        return Promise.resolve();
    }

    async clearSelected() {
        var item;
        for (var i = 0; i < this._selected.length; i++) {
            item = this._selected[i];
            await item.select(false);
        }
        this._selected = [];
        return Promise.resolve();
    }

    async selectAll() {
        this._selected = [];
        var item;
        var panels = this._view.getCanvas().getPanels();
        for (var i = 0; i < panels.length; i++) {
            item = panels[i];
            await item.select(true);
            this._selected.push(item);
        }
        return Promise.resolve();
    }

    getSelected() {
        return this._selected;
    }

    getSelectedObjects() {
        var items;
        if (this._selected.length > 0) {
            items = this._selected.map(function (panel) {
                return panel.getObject();
            });
        }
        return items;
    }

    setLoadingState(b) {
        var changed = false;
        if (this._bLoading != b) {
            if (b) {
                document.body.style.cursor = 'wait';
                Overlay.open();
                this._bLoading = true;
            } else {
                Overlay.close();
                document.body.style.cursor = 'default';
                this._bLoading = false;
            }
            changed = true;
        }
        return changed;
    }

    reloadApplication() {
        this.setLoadingState(true);
        location.reload();
    }

    reloadState() {
        var state = this.getStateController().getState();
        /*var ds = app.controller.getDataService();
        var cache = ds.getCache();
        cache.updateCachedTypeMaps(null, state.typeString);*/
        this.loadState(state);
    }

    isInDebugMode() {
        var res = false;
        var debugConfig = this._configController.getDebugConfig();
        if (debugConfig && debugConfig['bDebug']) {
            res = true;
        }
        return res;
    }
}