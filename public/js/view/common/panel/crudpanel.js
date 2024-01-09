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
            var attr = this._config['detailsAttr'];
            this._skeleton = skeleton.filter(function (x) {
                return (attr.indexOf(x['name']) > -1);
            });
        } else
            this._skeleton = skeleton;

        if (this._config.details == DetailsEnum.none || this._config.details == DetailsEnum.title)
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
                        app.getController().showError(error);
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
                                app.getController().showError(error);
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
                                app.getController().showError(error);
                        }

                        return Promise.resolve();
                    }.bind(this)));
                break;
            case DetailsEnum.none:
                break;
            case DetailsEnum.title:
            default:
                var title = this._obj.getTitle();
                var $p = $('<p/>')
                    .html(encodeText(title))
                    .css({
                        "margin": "0px",
                        "overflow": "hidden",
                        "white-space": "nowrap",
                        "text-overflow": "ellipsis"
                    });
                $div = $('<div/>').append($p);
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

        var text = 'Update';
        $div.append($('<button/>')
            .css({ 'float': 'right' })
            .html(text)
            .click(async function (event) {
                event.preventDefault();
                event.stopPropagation();

                try {
                    await this._update();
                } catch (error) {
                    if (error)
                        app.getController().showError(error);
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
                                app.getController().showError(error);
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
                        app.getController().showError(error);
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
            const controller = app.getController();
            try {
                controller.setLoadingState(true);

                var data = await this._readData(false);
                data = await fn.call(this, data);
                if (data)
                    await this.setData(data);
            } catch (error) {
                controller.showError(error)
            }
            finally {
                controller.setLoadingState(false);
            }
        }
        return Promise.resolve();
    }

    async setData(data) {
        if (data) {
            //hidden attributes which got changed must be made visible
            var copy = [];
            var replacement;
            for (var attribute of this._skeleton) {
                replacement = undefined;
                if (attribute['hidden']) {
                    if (data[attribute['name']]) {
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
        return Promise.resolve();
    }

    async getData() {
        return this._readData(false);
    }

    async _readData(bValidate) {
        var data;
        if (this._form)
            data = await this._form.readForm(true, bValidate);
        return Promise.resolve(data);
    }

    async _hasChanged() {
        var changes;
        if (this._config.action == ActionEnum.create || this._config.action == ActionEnum.update) {
            var oldData = this._obj.getData();
            var newData = await this._readData(false);
            changes = CrudObject.getChanges(this._skeleton, oldData, newData);
        }
        if (changes)
            return Promise.resolve(Object.keys(changes).length > 0);
        else
            return Promise.resolve(false);
    }

    async _openEdit() {
        const controller = app.getController();
        controller.setLoadingState(true);
        try {
            const action = ActionEnum.update;

            if (this._config.bSelectable) {
                await this.openInModal(action);
            } else {
                const model = this._obj.getModel();
                const panelConfig = new MediaPanelConfig();
                panelConfig.initPanelConfig(model, ActionEnum.update, this._config);
                this._config = panelConfig;

                await this.render();
            }
        } catch (err) {
            console.log(err);
            alert(err);
        }
        controller.setLoadingState(false);
        return Promise.resolve();
    }

    async _openDelete() {
        const controller = app.getController();
        controller.setLoadingState(true);
        if (this._config.bSelectable) {
            await this.openInModal(ActionEnum.delete);
        } else {
            const model = this._obj.getModel();
            const mpcc = model.getModelPanelConfigController();
            this._config = mpcc.getPanelConfig(ActionEnum.delete);

            await this.render();
        }
        controller.setLoadingState(false);
        return Promise.resolve();
    }

    async _create() {
        if (this._form) {
            const controller = app.getController();
            try {
                controller.setLoadingState(true);

                const oldData = {}; // empty object as reference - because object creation may be done with predefined data
                const newData = await this._readData();
                const changed = CrudObject.getChanges(this._skeleton, oldData, newData);
                if (changed) {
                    if (controller.getConfigController().confirmOnApply()) {
                        controller.setLoadingState(false);
                        const skeleton = this._obj.getSkeleton(true);
                        const bConfirm = await controller.getModalController().openDiffJsonModal({}, CrudObject.collapse(skeleton, changed));
                        if (!bConfirm)
                            return Promise.reject();
                        controller.setLoadingState(true);
                    }
                } else {
                    if (!confirm('Create empty entry?')) {
                        controller.setLoadingState(false);
                        return Promise.reject();
                    }
                }
                await this._obj.create(changed);
                await sleep(500);

                const data = this._obj.getData();
                if (this._config.crudCallback) {
                    if (await this._config.crudCallback(data))
                        this.dispose();
                } else {
                    const state = controller.getStateController().getState();
                    if (this._obj.getTypeString() === state.typeString && state.panelConfig)
                        this._config = state.panelConfig;
                    else {
                        const model = this._obj.getModel();
                        /*const mpcc = model.getModelPanelConfigController();
                        this._config = mpcc.getPanelConfig(ActionEnum.read, DetailsEnum.all);*/
                        const config = new MediaPanelConfig();
                        config.initPanelConfig(model, ActionEnum.read, this._config);
                        this._config = config;
                    }
                    await this.render();
                }
                controller.setLoadingState(false);
            } catch (error) {
                controller.setLoadingState(false);
                controller.showError(error);
            }
        }
        return Promise.resolve();
    }

    async _update() {
        if (this._form) {
            const controller = app.getController();
            try {
                controller.setLoadingState(true);

                const oldData = this._obj.getData();
                const newData = await this._readData();
                const changed = CrudObject.getChanges(this._skeleton, oldData, newData);
                if (changed) {
                    if (controller.getConfigController().confirmOnApply()) {
                        controller.setLoadingState(false);
                        const skeleton = this._obj.getSkeleton(true);
                        const bConfirm = await controller.getModalController().openDiffJsonModal(CrudObject.collapse(skeleton, oldData), CrudObject.collapse(skeleton, newData));
                        if (!bConfirm)
                            return Promise.reject();
                        controller.setLoadingState(true);
                    }
                    await this._obj.update(changed);

                    if (this._config.crudCallback) {
                        if (await this._config.crudCallback(this.getObject().getData()))
                            this.dispose();
                    } else {
                        const state = controller.getStateController().getState();
                        if (this._obj.getTypeString() === state.typeString && state.panelConfig)
                            this._config = state.panelConfig;
                        else {
                            const model = this._obj.getModel();
                            /*const mpcc = model.getModelPanelConfigController();
                            this._config = mpcc.getPanelConfig(ActionEnum.read, DetailsEnum.all);*/
                            const config = new MediaPanelConfig();
                            config.initPanelConfig(model, ActionEnum.read, this._config);
                            this._config = config;
                        }
                        await this.render();
                    }
                    controller.setLoadingState(false);
                } else {
                    controller.setLoadingState(false);
                    const bClose = await controller.getModalController().openConfirmModal("No changes detected! Close window?");
                    if (bClose)
                        this.dispose();
                }
            } catch (error) {
                controller.setLoadingState(false);
                controller.showError(error);
            }
        }
        return Promise.resolve();
    }

    async _delete() {
        const controller = app.getController();
        try {
            controller.setLoadingState(true);
            await this._obj.delete();

            if (this._config.crudCallback) {
                if (await this._config.crudCallback())
                    this.dispose();
            } else
                this.dispose();

            return controller.reloadState();
        } catch (error) {
            controller.setLoadingState(false);
            controller.showError(error);
        }
        return Promise.resolve();
    }

    _dblclick() {
        const model = this._obj.getModel();
        const action = model.getDoubleClickAction();
        if (action)
            action(this);
        else
            this.openInModal(ActionEnum.read);
    }

    async _drag(event) {
        await super._drag(event);
        if (this._obj) {
            const state = new State();
            state.typeString = this._obj.getTypeString();

            const selected = app.getController().getSelectedObjects();
            if (selected) {
                if (selected.length == 1)
                    state.id = selected[0].getData()['id'];
                else if (selected.length > 0)
                    state.id = selected.map(function (x) { return x.getData()['id'] });
            } else
                state.id = this._obj.getData()['id'];

            const url = window.location.origin + State.getUrlFromState(state);
            //console.log(url);
            event.originalEvent.dataTransfer.setData("text/plain", url);
            event.originalEvent.dataTransfer.dropEffect = 'copy'; // 'move'

        }
        return Promise.resolve();
    }

    async _drop(event) {
        event.preventDefault();
        event.stopPropagation();
        const dT = event.originalEvent.dataTransfer;
        if (dT) {
            const str = dT.getData("text/plain");
            //console.log(str);
            const url = new URL(str);
            const state = State.getStateFromUrl(url);
            if (state) {
                const controller = app.getController();
                const droptype = state['typeString'];
                const model = this._obj.getModel();
                if (this._config.getPanelClass() == MediaPanel) {
                    const id = state.id;
                    if (isNaN(id)) {
                        alert("invalid data!");
                        return Promise.reject();
                    }
                    const prop = model.getModelDefaultsController().getDefaultThumbnailProperty();
                    if (prop) {
                        if (droptype === "contents") {
                            const bConfirmation = await controller.getModalController().openConfirmModal("Change thumbnail?");
                            if (bConfirmation) {
                                const obj = new Object();
                                obj[prop] = id;
                                await this._obj.update(obj);
                                this.render();
                            }
                        }
                    }
                } else if (model.isCollection()) {
                    if (droptype === "collections")
                        alert("NotImplementedException");
                    else if (droptype === this._obj.getCollectionType()) {
                        try {
                            controller.setLoadingState(true);
                            var items;
                            var data = await controller.getDataService().fetchDataByState(state);
                            if (data) {
                                if (Array.isArray(data)) {
                                    if (data.length > 0) {
                                        var items = [];
                                        for (var x of data) {
                                            items.push(new CrudObject(droptype, x));
                                        }
                                        await this.addItems(items);
                                    }
                                } else
                                    await this.addItems(new CrudObject(droptype, data));
                            }
                            controller.setLoadingState(false);
                        } catch (error) {
                            controller.setLoadingState(false);
                            controller.showError(error);
                        }
                    } else
                        alert("type not supported by the collection");
                }
            }
        }
        return Promise.resolve();
    }

    async openInNewTab(action) {
        const win = window.open(this._obj.getUrl(action), '_blank');
        win.focus();
        return Promise.resolve();
    }

    async openInModal(action) {
        const model = this._obj.getModel();
        const mpcc = model.getModelPanelConfigController();
        const panelConfig = mpcc.getPanelConfig(action, DetailsEnum.all);

        const panel = PanelController.createPanelForObject(this._obj, panelConfig);

        panelConfig.crudCallback = async function (data) {
            await this.render();
            return Promise.resolve(true);
        }.bind(this);

        const modal = await app.getController().getModalController().openPanelInModal(panel);
        return Promise.resolve(modal);
    }
}