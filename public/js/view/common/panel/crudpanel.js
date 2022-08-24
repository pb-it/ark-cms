class CrudPanel extends CanvasPanel {

    _obj;
    _skeleton;
    _form;

    constructor(config, obj) {
        super(config);
        this._obj = obj;
    }

    getClass() {
        return CrudPanel;
    }

    getObject() {
        return this._obj;
    }

    getForm() {
        return this._form;
    }

    async _init() {
        var skeleton = this._obj.getSkeleton(true);
        if (this._config['detailsAttr']) {
            var attr = this._config['detailsAttr'].split(';');
            this._skeleton = skeleton.filter(function (x) {
                return (attr.indexOf(x['name']) > -1);
            });
        } else
            this._skeleton = skeleton;

        if (this._config.details == DetailsEnum.none)
            this._title = this._obj.getTitle();

        await super._init();

        //@depricated - don't make the application depend on data stored in the visualization
        //this._$panel.attr("data-type", this._obj.getTypeString());
        //this._$panel.attr("data-id", this._obj.getData().id);

        return Promise.resolve();
    }

    async _renderContent() {
        var $div;
        if (this._config.action) {
            switch (this._config.action) {
                case ActionEnum.create:
                    $div = await this._renderCreate();
                    break;
                case ActionEnum.read:
                    $div = await this._renderRead();
                    break;
                case ActionEnum.update:
                    $div = await this._renderUpdate();
                    break;
                case ActionEnum.delete:
                    $div = this._renderDelete();
                    break;
            }
        } else {
            $div = await this._renderRead();
        }
        if ($div)
            $div.append($('<div>')
                .addClass('clear'));
        return Promise.resolve($div);
    }

    async _renderCreate() {
        var $div = $('<div/>')
            .addClass('data');
        this._form = new Form(this._skeleton, this._obj.getData());
        var $form = await this._form.renderForm();
        $div.append($form);

        $div.append('<br/>');

        $div.append(this._renderActionButtons());
        $div.append($('<button/>')
            .css({ 'float': 'right' })
            .html("Create")
            .click(async function (event) {
                event.preventDefault();
                event.stopPropagation();

                try {
                    await this._create();
                } catch (error) {
                    if (error)
                        app.controller.showError(error);
                }

                return Promise.resolve();
            }.bind(this)));
        return Promise.resolve($div);
    }

    async _renderRead() {
        var $div;
        switch (this._config.details) {
            case DetailsEnum.all:
                $div = $('<div/>')
                    .addClass('data');
                var $form = await DataView.renderData(this._skeleton, this._obj.getData());
                $div.append($form);

                $div.append('<br/>');

                $div.append($('<button/>')
                    .html("Delete")
                    .click(async function (event) {
                        event.preventDefault();
                        event.stopPropagation();

                        try {
                            await this._openDelete();
                        } catch (error) {
                            if (error)
                                app.controller.showError(error);
                        }

                        return Promise.resolve();
                    }.bind(this)));
                $div.append($('<button/>')
                    .css({ 'float': 'right' })
                    .html("Edit")
                    .click(async function (event) {
                        event.preventDefault();
                        event.stopPropagation();

                        try {
                            await this._openEdit();
                        } catch (error) {
                            if (error)
                                app.controller.showError(error);
                        }

                        return Promise.resolve();
                    }.bind(this)));
                break;
            case DetailsEnum.none:
                break;
            case DetailsEnum.title:
            default:
                $div = $('<div/>')
                    .html(encodeText(this._obj.getTitle()));
        }
        return Promise.resolve($div);
    }

    async _renderUpdate() {
        var $div = $('<div/>')
            .addClass('data');
        this._form = new Form(this._skeleton, this._obj.getData());
        var $form = await this._form.renderForm();
        $div.append($form);

        $div.append('<br/>');

        $div.append(this._renderActionButtons());
        $div.append($('<button/>')
            .css({ 'float': 'right' })
            .html("Commit")
            .click(async function (event) {
                event.preventDefault();
                event.stopPropagation();

                try {
                    await this._update();
                } catch (error) {
                    if (error)
                        app.controller.showError(error);
                }

                return Promise.resolve();
            }.bind(this)));
        return Promise.resolve($div);
    }

    _renderActionButtons() {
        var $div = $('<div/>').css({ 'float': 'left' });
        var actions = this._obj.getModel().getCrudDialogActions();
        if (actions && actions.length > 0) {
            for (let action of actions) {
                $div.append($('<button/>')
                    .html(action['name'])
                    .click(async function (event) {
                        event.preventDefault();
                        event.stopPropagation();

                        try {
                            await this._applyAction(action['fn']);
                        } catch (error) {
                            if (error)
                                app.controller.showError(error);
                        }

                        return Promise.resolve();
                    }.bind(this)));
            }
        }
        return $div;
    }

    _renderDelete() {
        var $confirm = $('<input/>').attr({ type: 'submit', id: 'confirm', name: 'confirm', value: 'Confirm' })
            .click(async function (event) {
                event.preventDefault();
                event.stopPropagation();

                try {
                    await this._delete();
                } catch (error) {
                    if (error)
                        app.controller.showError(error);
                }

                return Promise.resolve();
            }.bind(this));
        return $confirm;
    }

    /**
     * object data is only overritten temporary for updating form
     * @returns
     */
    async _applyAction(fn) {
        if (this._form) {
            try {
                app.controller.setLoadingState(true);

                var data = await this._readData(false);
                data = await fn(data);
                if (data) {
                    //hidden attributes which got changed must be made visible
                    var copy = [];
                    var replacement;
                    for (var attribute of this._skeleton) {
                        replacement = undefined;
                        if (attribute['hidden']) {
                            name = attribute['name'];
                            if (data[name]) {
                                replacement = { ...attribute };
                                replacement['hidden'] = false;
                                replacement['readonly'] = true;
                            }
                        }
                        if (replacement)
                            copy.push(replacement);
                        else
                            copy.push(attribute);
                    }
                    this._obj.setSkeleton(copy);
                }

                var dataBackup = this._obj.getData();
                this._obj.setData(data);
                await this.render();
                this._obj.setData(dataBackup);
            } catch (error) {
                app.controller.showError(error)
            }
            finally {
                app.controller.setLoadingState(false);
            }
        }
        return Promise.resolve();
    }

    async _readData(bValidate) {
        var data;
        if (this._form)
            data = await this._form.readForm(true, bValidate);
        return Promise.resolve(data);
    }

    async _getChanges(bValidate, oldData) {
        var changes;
        if (this._config.action == ActionEnum.create || this._config.action == ActionEnum.update) {
            if (!oldData) {
                var data = this._obj.getData();
                if (data)
                    oldData = data;
                else
                    oldData = {};
            }
            var newData = await this._readData(bValidate);
            changes = CrudObject.getChanges(this._skeleton, oldData, newData);
        }
        return Promise.resolve(changes);
    }

    async _hasChanged() {
        var changes = await this._getChanges();
        if (changes)
            return Promise.resolve(Object.keys(changes).length > 0);
        else
            return Promise.resolve(false);
    }

    async _openEdit() {
        app.controller.setLoadingState(true);
        try {
            var action = ActionEnum.update;

            if (this._config.bSelectable) {
                await this.openInModal(action);
            } else {
                var model = this._obj.getModel();
                var panelConfig = new MediaPanelConfig();
                panelConfig.initPanelConfig(model, ActionEnum.update, this._config);
                this._config = panelConfig;

                await this.render();
            }
        } catch (err) {
            console.log(err);
            alert(err);
        }
        app.controller.setLoadingState(false);
        return Promise.resolve();
    }

    async _openDelete() {
        app.controller.setLoadingState(true);
        if (this._config.bSelectable) {
            await this.openInModal(ActionEnum.delete);
        } else {
            var model = this._obj.getModel();
            var mpcc = model.getModelPanelConfigController();
            this._config = mpcc.getPanelConfig(ActionEnum.delete);

            await this.render();
        }
        app.controller.setLoadingState(false);
        return Promise.resolve();
    }

    async _create() {
        if (this._form) {
            try {
                app.controller.setLoadingState(true);

                var changed = await this._getChanges(true, {}); // empty object as reference - because object creation may be done with predefined data

                if (app.controller.getConfigController().confirmOnApply()) {
                    app.controller.setLoadingState(false);
                    var bConfirm = await app.controller.getModalController().openDiffJsonModal({}, changed);
                    if (!bConfirm)
                        return Promise.reject();
                    app.controller.setLoadingState(true);
                }

                await this._obj.create(changed);

                await sleep(500);

                var data = this._obj.getData();
                if (this._config.crudCallback) {
                    if (await this._config.crudCallback(data))
                        this.dispose();
                } else {
                    var state = app.controller.getStateController().getState();
                    if (this._obj.getTypeString() === state.typeString && state.panelConfig)
                        this._config = state.panelConfig;
                    else {
                        var model = this._obj.getModel();
                        /*var mpcc = model.getModelPanelConfigController();
                        this._config = mpcc.getPanelConfig(ActionEnum.read, DetailsEnum.all);*/
                        var config = new MediaPanelConfig();
                        config.initPanelConfig(model, ActionEnum.read, this._config);
                        this._config = config;
                    }

                    await this.render();
                }
                app.controller.setLoadingState(false);
            } catch (error) {
                app.controller.setLoadingState(false);
                app.controller.showError(error);
            }
        }
        return Promise.resolve();
    }

    async _update() {
        if (this._form) {
            try {
                app.controller.setLoadingState(true);

                var changed = await this._getChanges(true);

                if (changed) {
                    if (app.controller.getConfigController().confirmOnApply()) {
                        var oldData = this.getObject().getData();
                        var newData = await this._readData();
                        app.controller.setLoadingState(false);
                        var bConfirm = await app.controller.getModalController().openDiffJsonModal(oldData, newData);
                        if (!bConfirm)
                            return Promise.reject();
                        app.controller.setLoadingState(true);
                    }

                    await this._obj.update(changed);
                } else
                    alert('Nothing changed');

                if (this._config.crudCallback) {
                    if (await this._config.crudCallback(this.getObject().getData()))
                        this.dispose();
                } else {
                    var state = app.controller.getStateController().getState();
                    if (this._obj.getTypeString() === state.typeString && state.panelConfig)
                        this._config = state.panelConfig;
                    else {
                        var model = this._obj.getModel();
                        /*var mpcc = model.getModelPanelConfigController();
                        this._config = mpcc.getPanelConfig(ActionEnum.read, DetailsEnum.all);*/
                        var config = new MediaPanelConfig();
                        config.initPanelConfig(model, ActionEnum.read, this._config);
                        this._config = config;
                    }

                    await this.render();
                }
                app.controller.setLoadingState(false);
            } catch (error) {
                app.controller.setLoadingState(false);
                app.controller.showError(error);
            }
        }
        return Promise.resolve();
    }

    async _delete() {
        try {
            app.controller.setLoadingState(true);
            await this._obj.delete();

            if (this._config.crudCallback) {
                if (await this._config.crudCallback())
                    this.dispose();
            } else
                this.dispose();

            var state = app.controller.getStateController().getState();
            state.bIgnoreCache = true;
            app.controller.loadState(state);
            app.controller.setLoadingState(false);
        } catch (error) {
            app.controller.setLoadingState(false);
            app.controller.showError(error);
        }
        return Promise.resolve();
    }

    _dblclick() {
        this.openInModal(ActionEnum.read);
    }

    async _drag(event) {
        await super._drag(event);
        if (this._obj) {
            var state = new State();
            state.typeString = this._obj.getTypeString();

            var selected = app.controller.getSelectedObjects();
            if (selected) {
                if (selected.length == 1) {
                    state.id = selected[0].getData().id;
                } else {
                    var params = [];
                    for (var item of selected)
                        params.push("id=" + item.getData().id);
                    state.where = params.join('&');
                }
            } else
                state.id = this._obj.getData().id;

            event.originalEvent.dataTransfer.setData("text/plain", window.location.origin + State.getUrlFromState(state));
        }
        return Promise.resolve();
    }

    async _drop(event) {
        event.preventDefault();
        event.stopPropagation();
        var str = event.originalEvent.dataTransfer.getData("text/plain");
        var url = new URL(str);
        var state = State.getStateFromUrl(url);
        if (state) {
            var droptype = state.typeString;
            var model = this._obj.getModel();
            if (this._config.getPanelClass() == MediaPanel) {
                var id = state.id;
                if (isNaN(id)) {
                    alert("invalid data!");
                    return Promise.reject();
                }
                var prop = model.getModelDefaultsController().getDefaultThumbnailProperty();
                if (prop) {
                    if (droptype === "contents") {
                        var bConfirmation = await app.controller.getModalController().openConfirmModal("Change thumbnail?");
                        if (bConfirmation) {
                            var obj = new Object();
                            obj[prop] = id;
                            await this._obj.update(obj);
                            this.render();
                        }
                    }
                }
            } else if (model.isCollection()) {
                if (droptype === "collections") {
                    alert("NotImplementedException");
                } else if (droptype === this._obj.getCollectionType()) {
                    var urlParams = new URLSearchParams(url.search);

                    var arr = urlParams.getAll('id');
                    var ids = [];
                    var id;
                    for (var str of arr) {
                        id = parseInt(str);
                        if (isNaN(id)) {
                            alert("invalid data!");
                            return Promise.reject();
                        } else {
                            ids.push(id);
                        }
                    }

                    try {
                        var items = await app.controller.getDataService().fetchObjectById(droptype, ids);
                        this.addItems(items);
                    } catch (err) {
                        alert("failed!");
                    }
                } else {
                    alert("type not supported by the collection");
                }
            }
        }
        return Promise.resolve();
    }

    async openInNewTab(action) {
        var win = window.open(this._obj.getUrl(action), '_blank');
        win.focus();
        return Promise.resolve();
    }

    async openInModal(action) {
        var model = this._obj.getModel();
        var mpcc = model.getModelPanelConfigController();
        var panelConfig = mpcc.getPanelConfig(action, DetailsEnum.all);

        var panel = PanelController.createPanelForObject(this._obj, panelConfig);

        panelConfig.crudCallback = async function (data) {
            await this.render();
            return Promise.resolve(true);
        }.bind(this);

        await app.controller.getModalController().openPanelInModal(panel);
        return Promise.resolve();
    }
}