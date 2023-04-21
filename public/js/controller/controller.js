class Controller {

    _model;
    _view;

    _logger;
    _database;

    _storageController;
    _configController;
    _apiController;
    _authController;
    _versionController;
    _stateController;

    _bFirstLoadAfterInit = false;
    _bConnection = false;

    _bLoading = false;
    _selected;

    _dataservice;

    _data;

    _modelController;
    _profileController;
    _routeController;
    _extensionController;
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

    getDatabase() {
        return this._database;
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

    getAuthController() {
        return this._authController;
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

    getExtensionController() {
        return this._extensionController;
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

    getLocale() {
        return "de-DE";
    }

    async initController() {
        var bInitDone = false;
        this._bConnection = false;
        this.setLoadingState(true);

        this._modalController = new ModalController(); //VersionController may open a modal

        this._storageController = new StorageController();

        this._configController = new ConfigController();
        await this._configController.initConfigController();

        this._versionController = new VersionController();
        this._apiController = new ApiController(this._configController.getApi());
        this._authController = new AuthController();

        if (app.getController().getStorageController().loadLocal('bIndexedDB') === 'true') {
            this._database = new Database('cache');
            await this._database.initDatabase();
        }

        try {
            await this._apiController.initApiController();
            await this._versionController.initVersionController();

            this._routeController = new RouteController();
            await this._routeController.init();

            this._stateController = new StateController();
            //this._view.initView(); //TODO: untidy/unlovely that view depends on parsed state

            this._panelController = new PanelController();

            this._modelController = new ModelController(this._configController);
            await this._modelController.init();

            this._dataservice = new DataService();

            this._extensionController = new ExtensionController();
            await this._extensionController.init();

            this._profileController = new ProfileController();
            await this._profileController.init();

            this._bookmarkController = new BookmarkController();
            await this._bookmarkController.init();

            await this._apiController.fetchSessionInfo();
            this._bConnection = true;
            bInitDone = true;
        } catch (error) {
            if (error && error.status == 401)
                await this._authController.showLoginDialog();
            else
                this.showError(error, "Connection to API failed");
        } finally {
            this.setLoadingState(false);
        }

        $(document).keyup(async function (e) {
            if ((e.keyCode == 88 && e.ctrlKey) || e.keyCode == 27) { // strg+x or esc
                var modals = this._modalController.getModals();
                if (modals) {
                    var length = modals.length;
                    if (length > 0)
                        await modals[length - 1]._closeOnConfirm();
                }
            }
            return Promise.resolve();
        }.bind(this));

        this._bFirstLoadAfterInit = true;
        return Promise.resolve(bInitDone);
    }

    hasConnection() {
        return this._bConnection;
    }

    async navigate(path) {
        try {
            var state = State.getStateFromPath(path);
            await this.loadState(state, true);
        } catch (error) {
            this.showError(error);
        }
        return Promise.resolve();
    }

    async loadState(state, push, replace) {
        this._data = null;
        try {
            this.setLoadingState(true);

            var oldState = this._stateController.getState();
            if (oldState && oldState['action'] && oldState['action'] == ActionEnum.create) {
                var panels = this._view.getCanvas().getPanels();
                if (panels && panels.length == 1) {
                    var obj = panels[0].getObject();
                    var form = panels[0].getForm();
                    if (obj && form) {
                        var skeleton = obj.getSkeleton(true);
                        var data = await form.readForm(true, false);
                        var res = {};
                        var property;
                        var tmp;
                        for (var field of skeleton) {
                            property = field['name'];
                            if (data[property]) {
                                if (field['dataType'] == 'file' && data[property]['base64']) {
                                    tmp = { ...data[property] };
                                    delete tmp['base64'];
                                    res[property] = tmp;
                                } else
                                    res[property] = data[property];
                            }
                        }
                        oldState['data'] = res;
                    }
                }
                /*var modals = this.getModalController().getModals();
                if (modals && modals.length > 0) {
                    ...
                }*/
                this._stateController.setState(oldState, false, true);
            }

            if (this._bFirstLoadAfterInit)
                this._bFirstLoadAfterInit = false;
            else {
                this._modalController.closeAll();
                try {
                    await this._apiController.fetchApiInfo(); // needed for notification in side bar
                    if (!this._bConnection)
                        this._bConnection = true;
                } catch (error) {
                    if (this._bConnection) {
                        this._bConnection = false;
                        this.showError(error, "Connection to API interruppted");
                    }
                }
            }

            this._stateController.setState(state, push, replace);
            await this.clearSelected();
            this._view.initView();

            var bHome = false;
            if (state) {
                if (state['customRoute']) {
                    var route = this._routeController.getMatchingRoute(state['customRoute']);
                    if (route) {
                        if (route['fn'])
                            route['fn']();
                    } else if (state['customRoute'].startsWith('/ext/')) {
                        var parts = state['customRoute'].split('/');
                        if (parts.length >= 3 && this._extensionController.getExtension(parts[2])) {
                            var response = await this._apiController.getApiClient().request("GET", '/api' + state['customRoute']);
                            var panel;
                            try {
                                var data = JSON.parse(response);
                                panel = new JsonPanel(data);
                            } catch (error) {
                                ;
                            }
                            if (!panel) {
                                panel = new Panel();
                                var $iframe = $('<iframe>', {
                                    src: 'about:blank',
                                    frameborder: 0,
                                    scrolling: 'no'
                                });
                                $iframe.on("load", function () {
                                    this.contents().find('body').append(response);
                                }.bind($iframe));
                                panel.setContent($iframe);
                            }
                            await this._view.getCanvas().showPanels([panel]);
                        } else
                            throw new Error("Unknown route '" + state['customRoute'] + "'");
                    } else if (state['customRoute'].startsWith('/data/')) {
                        this._data = await this._apiController.getApiClient().requestData("GET", state['customRoute'].substring('/data/'.length));
                        await this.updateCanvas();
                    } else if (state['customRoute'].startsWith('/dashboard/')) {
                        var parts = state['customRoute'].split('/');
                        if (parts.length == 3) {
                            var model = this._modelController.getModel(parts[2]);
                            if (model && model.hasOwnProperty('createDashboard'))
                                panels = await model.createDashboard();
                        }
                        if (panels)
                            await this._view.getCanvas().showPanels(panels);
                        else
                            throw new Error("No dashboard defined");
                    } else
                        throw new Error("Unknown route '" + state['customRoute'] + "'");
                } else if (state['typeString']) {
                    var typeString = state.typeString;
                    if (this._modelController.isModelDefined(typeString)) {
                        if (state['data'])
                            this._data = state['data'];
                        else if (!state['action'] || state['action'] != ActionEnum.create)
                            this._data = await this._dataservice.fetchDataByState(state);
                        await this.updateCanvas();
                    } else
                        throw new Error("Unknown model '" + typeString + "'");
                } else
                    bHome = true;
            } else
                bHome = true;

            if (bHome) {
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

    showError(error, message) {
        var msg;
        if (error) {
            if (error.status) {
                msg = "status:" + error.status;
                if (error.statusText)
                    msg += " - " + error.statusText;
                if (error.response)
                    msg += "\nresposnse: " + error.response;
            } else if (error.message)
                msg = error.message;

            console.log(error);
        }
        if (!msg) {
            if (message)
                msg = message;
            else
                msg = "An error has occurred";
        }
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

    getLoadingState() {
        return this._bLoading;
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

    async reloadState(bIgnoreCache) {
        if (this._stateController) {
            var state = this.getStateController().getState();
            if (bIgnoreCache)
                state.bIgnoreCache = true;
            return this.loadState(state);
        } else
            return Promise.reject();
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