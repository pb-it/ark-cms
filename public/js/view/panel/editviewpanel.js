class EditViewPanel extends TabPanel {

    static detailsEnumToString(details) {
        var str;
        switch (details) {
            case DetailsEnum.none:
                str = "none";
                break;
            case DetailsEnum.title:
                str = "title";
                break;
            case DetailsEnum.all:
                str = "all";
                break;
            default:
        }
        return str;
    }

    static getPanelViewForm(model, data) {
        const bEdit = model.getId() != null;
        var attributeNames;
        var options;
        var searchOptions;
        const mac = model.getModelAttributesController();
        const attributes = mac.getAttributes(true);
        if (attributes) {
            attributeNames = attributes.map(function (x) { return x['name'] });
            options = attributes.map(function (x) { return { 'value': x['name'] } });
            const sAttr = attributes.filter(function (x) { return x['dataType'] != 'relation' });
            searchOptions = sAttr.map(function (x) { return { 'value': x['name'] } });
        }

        const form = new Form();

        var bHidden = true;
        if (data) {
            if (data['details'] === EditViewPanel.detailsEnumToString(DetailsEnum.all))
                bHidden = false;

            if (!data['detailsAttr'])
                data['detailsAttr'] = attributeNames;

            if (!data['searchFields']) {
                var prop = model.getModelDefaultsController().getDefaultTitleProperty();
                if (prop)
                    data['searchFields'] = [prop];
            }
        }

        const panelOptions = [];
        var tmp = app.getController().getPanelController().getPanelClass();
        for (var name of Object.keys(tmp)) {
            panelOptions.push({ 'value': name });
        }

        const skeleton = [
            {
                name: ModelDefaultsController.PANEL_TYPE_IDENT,
                label: 'panelType',
                dataType: 'enumeration',
                options: panelOptions,
                view: 'select'
            },
            {
                name: 'details',
                dataType: 'enumeration',
                options: [{ 'value': 'none' }, { 'value': 'title' }, { 'value': 'all' }],
                view: 'select',
                changeAction: async function (entry) {
                    var fData = await entry._form.readForm();
                    var e = entry._form.getFormEntry('detailsAttr');

                    var attribute = e.getAttribute();
                    if (fData['details'] === EditViewPanel.detailsEnumToString(DetailsEnum.all)) {
                        if (!fData['detailsAttr'])
                            e.setValue(attribute['options'].map(function (x) { return x['value'] }));
                        await e.show();
                    } else
                        await e.hide();

                    //await entry.renderValue(???);
                    //this.setFormData(fData); //backup already made changes
                    //await this.renderForm();
                    return Promise.resolve();
                }
            },
            {
                name: "detailsAttr",
                dataType: "list",
                options: options,
                columns: 5,
                hidden: bHidden
            },
            {
                name: "display",
                dataType: "enumeration",
                options: [{ 'value': 'block' }, { 'value': 'inline-block' }],
                view: 'select'
            },
            {
                name: "float",
                dataType: "enumeration",
                options: [{ 'value': 'none' }, { 'value': 'left' }],
                view: 'select'
            },
            {
                name: "bSelectable",
                label: "*Selectable",
                tooltip: "**INFO**: Not stored! Gets calculated/reseted on every data/side reload!",
                dataType: "boolean",
                hidden: !bEdit
            },
            {
                name: "bContextMenu",
                label: "*ContextMenu",
                tooltip: "**INFO**: Not stored! Gets calculated/reseted on every data/side reload!",
                dataType: "boolean",
                hidden: !bEdit
            },
            {
                name: "paging",
                dataType: "enumeration",
                options: [{ 'value': 'default' }, { 'value': 'none' }],
                view: 'select'
            },
            {
                name: "searchFields",
                label: "*SearchFields",
                tooltip: "**INFO**: Not stored!",
                dataType: "list",
                options: searchOptions,
                columns: 5,
                hidden: !bEdit
            }
        ];
        form.init(skeleton, data);
        return form;
    }

    static getThumbnailViewForm(data) {
        var skeleton = [
            {
                name: "format",
                dataType: "enumeration",
                options: [{ 'value': 'custom' }, { 'value': '16/9' }, { 'value': '4/3' }],
                view: 'select'
            },
            {
                name: "width",
                dataType: "integer"
            },
            {
                name: "height",
                dataType: "integer"
            },
            {
                name: "autoplay",
                dataType: "boolean"
            }
        ];
        return new Form(skeleton, data);
    }

    _model;

    _data;
    _panelConfig;

    _$viewPanel;
    _$jsonPanel;

    _thumbnailViewForm;
    _panelViewForm;

    _jsonForm;

    constructor(config, model) {
        super(config);

        this._model = model;
    }

    async _init() {
        await super._init();

        this._$viewPanel = await this._createViewPanel();
        this._panels.push(this._$viewPanel);

        if (app.getController().isInDebugMode()) {
            this._$jsonPanel = await this._createJsonPanel();
            this._panels.push(this._$jsonPanel);
        }

        await this.openTab(this._$viewPanel);

        this.setTabSwitchCallback(async function (oldTab, newTab) {
            try {
                this._panelConfig = await this._readPanelConfig();
            } catch (error) {
                app.getController().showError(error);
            }
            return Promise.resolve();
        }.bind(this));

        return Promise.resolve();
    }

    async _createViewPanel() {
        const panel = new Panel({ 'title': 'View' });
        panel._renderContent = async function () {
            var $div = $('<div/>')
                .css({ 'padding': '10' });

            const state = app.getController().getStateController().getState();
            const mpcc = this._model.getModelPanelConfigController();

            var panelConfig;
            if (this._panelConfig)
                panelConfig = this._panelConfig;
            else {
                if (state.panelConfig) {
                    panelConfig = new MediaPanelConfig();
                    panelConfig.initPanelConfig(this._model, state.action, state.panelConfig);
                } else
                    panelConfig = mpcc.getPanelConfig(state.action);
                this._panelConfig = panelConfig;
            }
            const Cp = panelConfig.getPanelClass();

            const details = panelConfig['details'];
            if (details && typeof details === 'number')
                panelConfig['details'] = EditViewPanel.detailsEnumToString(details);

            this._panelViewForm = EditViewPanel.getPanelViewForm(this._model, panelConfig);
            var $form = await this._panelViewForm.renderForm();
            $div.append($form);
            $div.append('<br/>');

            if (Cp == MediaPanel) {
                this._thumbnailViewForm = EditViewPanel.getThumbnailViewForm(panelConfig);
                $form = await this._thumbnailViewForm.renderForm();
                $div.append($form);
                $div.append('<br/>');
            }

            $div.append($('<button/>')
                .html("Set as default")
                .click(async function (event) {
                    event.stopPropagation();

                    const controller = app.getController();
                    controller.setLoadingState(true);
                    try {
                        var data = await this._read();
                        delete data['bSelectable'];
                        delete data['bContextMenu'];
                        delete data['searchFields'];

                        await this._model.getModelDefaultsController().setDefaultPanelConfig(data);
                        controller.setLoadingState(false);
                        alert('Changed successfully');
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }
                    return Promise.resolve();
                }.bind(this))
            );
            $div.append($('<button/>')
                .css({ 'float': 'right' })
                .text("Apply")
                .click(async function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    return this._applyPanelConfig();
                }.bind(this)));
            return Promise.resolve($div);
        }.bind(this);

        return Promise.resolve(panel);
    }

    async _createJsonPanel() {
        const panel = new Dialog({ 'title': 'JSON' });
        panel._renderDialog = async function () {
            const $div = $('<div/>')
                .css({ 'padding': '10' });

            const skeleton = [
                { name: "json", dataType: "json" }
            ];

            const data = { "json": this._data };

            this._jsonForm = new Form(skeleton, data);
            const $form = await this._jsonForm.renderForm();

            $div.append($form);
            return Promise.resolve($div);
        }.bind(this);
        panel.setApplyAction(this._applyPanelConfig.bind(this));

        return Promise.resolve(panel);
    }

    async _readPanelConfig() {
        this._data = await this._read();
        const state = app.getController().getStateController().getState();
        const panelConfig = new MediaPanelConfig();
        panelConfig.initPanelConfig(this._model, state.action, this._data);
        return Promise.resolve(panelConfig);
    }

    async _read() {
        var data;

        if (this.getOpenTab() == this._$jsonPanel) {
            const fData = await this._jsonForm.readForm();
            data = fData['json'];
        } else {
            if (this._thumbnailViewForm)
                data = { ...await this._panelViewForm.readForm(), ...await this._thumbnailViewForm.readForm() };
            else
                data = await this._panelViewForm.readForm();
        }

        return Promise.resolve(data);
    }

    async _applyPanelConfig() {
        const controller = app.getController();
        const state = controller.getStateController().getState();
        state.panelConfig = await this._readPanelConfig();
        //controller.updateCanvas();
        controller.loadState(state, true);

        this.dispose();
        return Promise.resolve(true);
    }
}