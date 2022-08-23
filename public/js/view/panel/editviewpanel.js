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
        var options;
        var mac = model.getModelAttributesController();
        var attributes = mac.getAttributes();
        if (attributes)
            options = attributes.map(function (x) { return { 'value': x['name'] } });

        var form = new Form();
        var bHidden = true;
        if (data && data['details'] === EditViewPanel.detailsEnumToString(DetailsEnum.all))
            bHidden = false;
        var skeleton = [
            {
                name: ModelDefaultsController.PANEL_TYPE_IDENT,
                label: 'panelType',
                dataType: 'enumeration',
                options: [{ 'value': 'CrudPanel' }, { 'value': 'MediaPanel' }, { 'value': 'CollectionPanel' }, { 'value': 'NotePanel' }, { 'value': 'WikiPanel' }],
                view: 'select'
            },
            {
                name: "details",
                dataType: "enumeration",
                options: [{ 'value': 'none' }, { 'value': 'title' }, { 'value': 'all' }],
                view: 'select',
                changeAction: async function () {
                    var fData = await this.readForm();
                    var entry = this.getFormEntry("detailsAttr");
                    var attribute = entry.getAttribute();
                    attribute['hidden'] = (fData['details'] !== EditViewPanel.detailsEnumToString(DetailsEnum.all));
                    //await entry.renderValue(???);
                    this.setFormData(fData); //backup changes
                    await this.renderForm();
                    return Promise.resolve();
                }.bind(form)
            },
            {
                name: "detailsAttr",
                dataType: "list",
                options: options,
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
                name: "bContextMenu",
                label: "ContextMenu",
                tooltip: "**INFO**: Calculated value",
                dataType: "boolean",
                readonly: "true"
            },
            {
                name: "paging",
                dataType: "enumeration",
                options: [{ 'value': 'default' }, { 'value': 'none' }],
                view: 'select'
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

        if (app.controller.isInDebugMode()) {
            this._$jsonPanel = await this._createJsonPanel();
            this._panels.push(this._$jsonPanel);
        }

        await this.openTab(this._$viewPanel);

        this.setTabSwitchCallback(async function (oldTab, newTab) {
            try {
                this._panelConfig = await this._readPanelConfig();
            } catch (error) {
                app.controller.showError(error);
            }
            return Promise.resolve();
        }.bind(this));

        return Promise.resolve();
    }

    async _createViewPanel() {
        var panel = new Panel({ 'title': 'View' });
        panel._renderContent = async function () {
            var $div = $('<div/>')
                .css({ 'padding': '10' });

            var state = app.controller.getStateController().getState();
            var mpcc = this._model.getModelPanelConfigController();

            var panelConfig;
            if (this._panelConfig)
                panelConfig = this._panelConfig;
            else {
                if (state.panelConfig)
                    panelConfig = state.panelConfig;
                else
                    panelConfig = mpcc.getPanelConfig(state.action);
                this._panelConfig = panelConfig;
            }
            var Cp = panelConfig.getPanelClass();

            if (panelConfig['details'])
                panelConfig['details'] = EditViewPanel.detailsEnumToString(panelConfig['details']);

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

                    app.controller.setLoadingState(true);
                    try {
                        var data = await this._read();
                        await this._model.getModelDefaultsController().setDefaultPanelConfig(data);
                        app.controller.setLoadingState(false);
                        alert('Changed successfully');
                    } catch (error) {
                        app.controller.setLoadingState(false);
                        app.controller.showError(error);
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
        var panel = new Dialog({ 'title': 'JSON' });
        panel._renderDialog = async function () {
            var $div = $('<div/>')
                .css({ 'padding': '10' });

            var skeleton = [
                { name: "json", dataType: "json" }
            ];

            var data = { "json": JSON.stringify(this._data, null, '\t') };

            this._jsonForm = new Form(skeleton, data);
            var $form = await this._jsonForm.renderForm();

            $div.append($form);
            return Promise.resolve($div);
        }.bind(this);
        panel.setApplyAction(this._applyPanelConfig.bind(this));

        return Promise.resolve(panel);
    }

    async _readPanelConfig() {
        this._data = await this._read();
        var state = app.controller.getStateController().getState();
        var panelConfig = new MediaPanelConfig();
        panelConfig.initPanelConfig(this._model, state.action, this._data);
        return Promise.resolve(panelConfig);
    }

    async _read() {
        var data;

        if (this.getOpenTab() == this._$jsonPanel) {
            var fData = await this._jsonForm.readForm();
            data = JSON.parse(fData['json']);
        } else {
            if (this._thumbnailViewForm)
                data = { ...await this._panelViewForm.readForm(), ...await this._thumbnailViewForm.readForm() };
            else
                data = await this._panelViewForm.readForm();

            delete data['bContextMenu'];
        }

        return Promise.resolve(data);
    }

    async _applyPanelConfig() {
        var state = app.controller.getStateController().getState();
        state.panelConfig = await this._readPanelConfig();
        //app.controller.updateCanvas();
        app.controller.loadState(state, true);

        this.dispose();
        return Promise.resolve(true);
    }
}