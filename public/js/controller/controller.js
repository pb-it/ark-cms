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
    _dataTypeController;
    _panelController;
    _extensionController;
    _bookmarkController;

    _modalController;

    _formatter;

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

    getDataTypeController() {
        return this._dataTypeController;
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

        this.setupShortcuts();

        this._modalController = new ModalController(); //VersionController may open a modal

        this._storageController = new StorageController();

        this._configController = new ConfigController();
        await this._configController.initConfigController();

        if (this._storageController.loadLocal('bIndexedDB') === 'true') {
            this._database = new Database('cache');
            try {
                await this._database.initDatabase();
            } catch (error) {
                alert(`IndexDB encountered an error while restoring your cached data!
More details are provided within the browser console.
The usage of the cache will be paused until the problem got solved.
You can also try to reset your cache via the 'Cache-Panel'.`);
            }
        }

        this._versionController = new VersionController();
        this._apiController = new ApiController(this._configController.getApi());
        this._authController = new AuthController();

        try {
            await this._apiController.initApiController();
            await this._authController.initAuthController();
            await this._versionController.initVersionController();

            this._routeController = new RouteController();
            await this._routeController.init();

            this._stateController = new StateController();
            //this._view.initView(); //TODO: untidy/unlovely that view depends on parsed state

            this._modelController = new ModelController(this._configController);
            await this._modelController.init();

            this._dataservice = new DataService();

            this._dataTypeController = new DataTypeController();
            this._panelController = new PanelController();
            this._extensionController = new ExtensionController();
            await this._extensionController.init();

            this._profileController = new ProfileController();
            await this._profileController.init();

            this._bookmarkController = new BookmarkController();
            await this._bookmarkController.init();

            if (this._database) {
                var oldest = this._database.getTimestamp();
                if (oldest) {
                    var changes = await this._dataservice.getCache().getChanges(oldest);
                    if (changes) {
                        var data = changes['data'];
                        if (data && data.length > 0) {
                            if (this._configController.automaticUpdateCache()) {
                                if (this._database)
                                    await this._database.updateDatabase(changes);
                                else
                                    await this._dataservice.getCache().applyChanges(changes);
                            } else {
                                const modal = await this._modalController.openPanelInModal(new UpdateCachePanel(changes));
                                this.setLoadingState(false);
                                await modal.waitClosed();
                            }
                        }
                    }
                }
            }

            this._bConnection = true;
            bInitDone = true;
        } catch (error) {
            if (error) {
                if (error instanceof HttpError && error['response']) {
                    var status = error['response']['status'];
                    if (status == 0) {
                        if (error['response']['body'])
                            this.showError(error);
                        else {
                            var url = this._configController.getApi();
                            var panel = new Panel();

                            var $d = $('<div/>')
                                .css({ 'padding': '10' });

                            if (error['response']['timeout']) {
                                $d.append("<h2>API can't be reached</h2>");
                                $d.append("<a href='" + url + "' target='_blank'>" + url + "</a> took too long to respond.<br><br>");
                                $d.append("ERR_CONNECTION_TIMED_OUT<br><br>");
                            } else {
                                $d.append("<h2>Attempt to connect to API failed</h2>");
                                $d.append("If you are using this application with an unverified self signed certificate,<br/>");
                                $d.append("please open your API server URL and confirm that the certificate is accepted by your browser.<br/><br/>");
                                $d.append("API base URL: <a href='" + url + "' target='_blank'>" + url + "</a><br><br>");
                            }

                            var $config = $('<button>')
                                .text('Change')
                                .css({ 'float': 'left' })
                                .click(async function (event) {
                                    event.stopPropagation();

                                    await panel.dispose();
                                    return this.getModalController().openPanelInModal(new ConfigPanel());
                                }.bind(this));
                            $d.append($config);

                            var $reload = $('<button>')
                                .text('Retry')
                                .css({ 'float': 'right' })
                                .click(async function (event) {
                                    event.stopPropagation();

                                    this.reloadApplication();
                                    return Promise.resolve();
                                }.bind(this));
                            $d.append($reload);

                            var $footer = $('<div/>')
                                .addClass('clear');
                            $d.append($footer);

                            panel.setContent($d);

                            await this._modalController.openPanelInModal(panel);
                        }
                    } else if (status == 401)
                        await this._authController.showLoginDialog();
                    else
                        this.showError(error);
                } else
                    this.showError(error);
            } else
                this.showErrorMessage('An unexpected error has occurred');
        } finally {
            this.setLoadingState(false);
        }

        this._bFirstLoadAfterInit = true;
        return Promise.resolve(bInitDone);
    }

    setupShortcuts() {
        $(document).keydown(async function (e) { // window.addEventListener('keydown', function() { ... });
            if (e.ctrlKey) {
                if (!e.shiftKey) {
                    switch (e.keyCode) {
                        case 65: // Ctrl + a
                            if (document.activeElement == document.body) {
                                e.preventDefault();
                                e.stopPropagation();

                                try {
                                    await this.selectAll();
                                } catch (error) {
                                    this.showError(error);
                                }
                            }
                            break;
                        case 67: // Ctrl + c
                            var activeElement = e.currentTarget.activeElement;
                            if (activeElement && activeElement == document.body) { //activeElement.nodeType == 1 && !['input', 'textarea'].includes(activeElement.tagName.toLowerCase()
                                var text;
                                if (window.getSelection)
                                    text = window.getSelection().toString();
                                else if (document.selection && document.selection.type != "Control")
                                    text = document.selection.createRange().text;
                                if (!text) {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    try {
                                        await this.copy();
                                    } catch (error) {
                                        this.showError(error);
                                    }
                                }
                            }
                            break;
                        case 75: // Ctrl + k
                            e.preventDefault();
                            e.stopPropagation();

                            var modal;
                            var mc = this.getModalController();
                            var modals = mc.getModals();
                            if (!modals || modals.length === 0) {
                                try {
                                    const form = this._view.getTopNavigationBar().getSearchForm();
                                    if (form)
                                        form.getSearchField().focus();
                                } catch (error) {
                                    this.showError(error);
                                }
                            }
                            break;
                        case 82: // Ctrl + r
                            e.preventDefault();
                            e.stopPropagation();

                            try {
                                await this.getDataService().getCache().deleteModelCache();
                                var modal;
                                var mc = this.getModalController();
                                var modals = mc.getModals();
                                if (modals) {
                                    var length = modals.length;
                                    if (length > 0)
                                        modal = modals[length - 1];
                                }
                                if (modal) {
                                    var panel = modal.getPanel();
                                    if (panel instanceof CrudPanel) {
                                        var data = await panel.getData();
                                        await panel.setData(data);
                                    } else
                                        await panel.render();
                                } else
                                    await this.reloadState(true);
                                this.setLoadingState(false);
                            } catch (error) {
                                this.setLoadingState(false);
                                this.showError(error);
                            }
                            break;
                        case 88: // Ctrl + x
                            e.preventDefault();
                            e.stopPropagation();

                            try {
                                await this.escape();
                            } catch (error) {
                                this.showError(error);
                            }
                            break;
                        case 188: // Ctrl + ,
                            e.preventDefault();
                            e.stopPropagation();

                            try {
                                if (!this.getLoadingState())
                                    await this.getModalController().openPanelInModal(new ConfigPanel());
                            } catch (error) {
                                this.showError(error);
                            }
                            break;
                    }
                } else {
                    switch (e.keyCode) {
                        case 68: // Ctrl + Shift + d
                            e.preventDefault();
                            e.stopPropagation();

                            try {
                                if (!this.getLoadingState()) {
                                    var config = { 'minWidth': '400px' };
                                    await this.getModalController().openPanelInModal(new CachePanel(config));
                                }
                                break;
                            } catch (error) {
                                this.showError(error);
                            }
                    }
                }
            } else if (e.shiftKey) {
                if (e.keyCode == 63) { // Shift + ?
                    var activeElement = e.currentTarget.activeElement;
                    if (activeElement && activeElement.nodeType == 1 && !['input', 'textarea'].includes(activeElement.tagName.toLowerCase())) {
                        e.preventDefault();
                        e.stopPropagation();

                        try {
                            var mc = this.getModalController();
                            await mc.openPanelInModal(new HelpPanel());
                        } catch (error) {
                            this.showError(error);
                        }
                    }
                }
            } else if (e.keyCode == 27) { // Esc
                e.preventDefault();
                e.stopPropagation();

                try {
                    await this.escape();
                } catch (error) {
                    this.showError(error);
                }
            } // else if (e.keyCode === 116) { // F5
        }.bind(this));

        //$(document).on('copy', function(e) { ... }); //document.addEventListener('copy', ...);
    }

    hasConnection() {
        return this._bConnection;
    }

    async navigate(url) {
        var bDone = false;
        try {
            var path;
            if (url) {
                if (url.startsWith('/'))
                    path = url;
                else if (url.startsWith(window.location.origin))
                    path = url.substring(window.location.origin.length);
            } else
                path = '/';
            if (path) {
                var spath;
                var fragment;
                var search;
                var index = path.indexOf("#");
                if (index >= 0) {
                    fragment = path.substring(index + 1);
                    spath = path.substring(0, index);
                } else
                    spath = path;
                index = spath.indexOf("?");
                if (index >= 0) {
                    search = spath.substring(index + 1);
                    spath = spath.substring(0, index);
                }
                const state = State.getStateFromPath(spath, search, fragment);
                await this.loadState(state, true);
                bDone = true;
            } else
                this.showErrorMessage('Invalid destination!');
        } catch (error) {
            this.showError(error);
        }
        return Promise.resolve(bDone);
    }

    async loadState(state, push, replace) {
        if (this._stateController) {
            this._data = null;
            try {
                this.setLoadingState(true);

                $(document).unbind('keydown.panel');
                $(document).unbind('keyup.panel');

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
                        var res = this._routeController.getMatchingRoute(state['customRoute']);
                        if (res) {
                            var route = res['route'];
                            if (route && route['fn'])
                                await route['fn'](state['customRoute'], res['match']);
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
                            var data = await this._apiController.getApiClient().requestData("GET", state['customRoute'].substring('/data/'.length));
                            if (state['typeString']) {
                                this._data = data;
                                await this.updateCanvas();
                            } else {
                                var str;
                                if (typeof data === 'object')
                                    str = JSON.stringify(data, null, '\t');
                                else if (typeof data === 'string' || typeof data === 'number')
                                    str = data;
                                else
                                    str = 'Unexpected response!';
                                alert(str);
                            }

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
        } else
            this.showErrorMessage('Application is not properly initialized');
        return Promise.resolve();
    }

    async showError(error, message) {
        var msg;
        if (error) {
            msg = error['message'];
            console.error(error);
        }
        if (!msg) {
            if (message)
                msg = message;
            else
                msg = "An error has occurred";
        }
        return this._modalController.openErrorModal(error, msg);
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

    setLoadingState(bLoading, bOpenOverlay = true) {
        var changed = false;
        if (this._bLoading != bLoading) {
            if (bLoading) {
                if (bOpenOverlay)
                    Overlay.open();
                document.body.style.cursor = 'wait';
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

    async escape() {
        if (this.getLoadingState()) {
            if (confirm('Abort loading?'))
                this.setLoadingState(false);
        } else {
            var modals = this._modalController.getModals();
            if (modals) {
                var length = modals.length;
                if (length > 0)
                    await modals[length - 1]._closeOnConfirm();
            }
        }
        return Promise.resolve();
    }

    async copy() {
        var text;
        var selected = app.getController().getSelectedObjects();
        if (selected && selected.length > 0) {
            var state = new State();
            state.typeString = selected[0].getTypeString();
            state.id = selected.map(function (x) { return x.getData()['id'] });
            text = window.location.origin + State.getUrlFromState(state);
        }
        if (text) {
            if (window.location.protocol == 'https:') {
                /*var result = await navigator.permissions.query({ name: "write-on-clipboard" });
                if (result.state == "granted" || result.state == "prompt")*/
                if (navigator && navigator.clipboard && navigator.clipboard.writeText)
                    await navigator.clipboard.writeText(text);
                else
                    this.showErrorMessage('The Clipboard API is not available!');
            } else if (document.queryCommandSupported('copy')) {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'absolute';
                textArea.style.left = '-999999px';
                document.body.prepend(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                } catch (error) {
                    this.showError(error);
                } finally {
                    textArea.remove();
                }
            }
        }
        return Promise.resolve();
    }

    getFormatter() {
        if (!this._formatter)
            this._formatter = new Formatter();
        return this._formatter;
    }
}