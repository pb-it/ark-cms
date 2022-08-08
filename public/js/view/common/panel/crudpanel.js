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
        return Promise.resolve($div);
    }

    async _renderCreate() {
        var $div = $('<div/>')
            .addClass('data');
        this._form = new Form(this._skeleton, this._obj.getData());
        var $form = await this._form.renderForm();
        $div.append($form);

        $div.append('<br/>');

        $div.append($('<button/>')
            .html("Check")
            .click(async function (event) {
                event.preventDefault();
                event.stopPropagation();
                return this._checkData();
            }.bind(this)));
        $div.append($('<button/>')
            .css({ 'float': 'right' })
            .html("Create")
            .click(function (event) {
                event.stopPropagation();
                this._create();
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
                    .click(function (event) {
                        event.stopPropagation();
                        this._openDelete();
                    }.bind(this)));
                $div.append($('<button/>')
                    .css({ 'float': 'right' })
                    .html("Edit")
                    .click(function (event) {
                        event.stopPropagation();
                        this._openEdit();
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

        $div.append($('<button/>')
            .html("Check")
            .click(async function (event) {
                event.stopPropagation();
                return this._checkData();
            }.bind(this)));
        $div.append($('<button/>')
            .css({ 'float': 'right' })
            .html("Commit")
            .click(function (event) {
                event.stopPropagation();
                this._update();
            }.bind(this)));
        return Promise.resolve($div);
    }

    _renderDelete() {
        var $confirm = $('<input/>').attr({ type: 'submit', id: 'confirm', name: 'confirm', value: 'Confirm' })
            .click(async function (event) {
                event.preventDefault();
                await this._delete();
            }.bind(this));
        return $confirm;
    }

    /**
     * object data is only overritten temporary for updating form
     * @returns
     */
    async _checkData() {
        if (this._form) {
            try {
                app.controller.setLoadingState(true);

                var data = await this._readData(false);
                var check = this._obj.getModel().getCheckAction();
                if (check) {
                    data = await check(data);
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
                } else
                    app.controller.showErrorMessage("No check action defined");//nevertheless rerender for thumbnail

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
            data = await this._form.readForm(bValidate);
        return data;
    }

    async _getChanges(bValidate, oldData) {
        var changed;
        if (this._config.action == ActionEnum.create || this._config.action == ActionEnum.update) {
            if (!oldData) {
                var data = this._obj.getData();
                if (data)
                    oldData = data;
                else
                    oldData = {};
            }
            var newData = await this._readData(bValidate);
            changed = CrudObject.getChanges(this._skeleton, oldData, newData);
        }
        return Promise.resolve(changed);
    }

    async _hasChanged() {
        return Object.keys(await this._getChanges()).length > 0;
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
                panelConfig.init(model, ActionEnum.update, this._config);
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
                        config.init(model, ActionEnum.read, this._config);
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
    }

    async _update() {
        if (this._form) {
            try {
                app.controller.setLoadingState(true);
                var changed = await this._getChanges(true);
                if (changed)
                    await this._obj.update(changed);

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
                        config.init(model, ActionEnum.read, this._config);
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
    }

    _dblclick() {
        this.openInModal(ActionEnum.read);
    }

    async _drag(event) {
        await super._drag(event);
        if (this._obj) {
            var typeString = this._obj.getTypeString();
            var ids;
            var selected = app.controller.getSelectedObjects();
            if (selected) {
                var arr = [];
                for (var item of selected)
                    arr.push(item.getData().id);
                ids = arr.join(',');
            } else
                ids = this._obj.getData().id;
            event.originalEvent.dataTransfer.setData("text/plain", typeString + ":" + ids);
        }
    }

    async _drop(event) {
        event.preventDefault();
        event.stopPropagation();
        var str = event.originalEvent.dataTransfer.getData("text/plain");
        const parts = str.split(':');
        if (parts.length == 2) {
            var droptype = parts[0];
            var model = this._obj.getModel();
            if (this._config.getPanelClass() == MediaPanel) {
                var id = parseInt(parts[1]);
                if (isNaN(id)) {
                    alert("invalid data!");
                    return Promise.reject();
                }
                var prop = model.getModelDefaultsController().getDefaultThumbnailProperty();
                if (prop) {
                    if (droptype === "contents") {
                        var bConfirmaltion = await app.controller.getModalController().openConfirmModal("Change thumbnail?");
                        if (bConfirmaltion) {
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
                    var arr = parts[1].split(',');
                    var id;
                    var ids = [];
                    for (var str of arr) {
                        var id = parseInt(str);
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
        Promise.resolve();
    }

    async openInNewTab(action) {
        var win = window.open(this._obj.getUrl(action), '_blank');
        win.focus();
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