class EditSearchPanel extends Panel {

    static getForm(model, data) {
        const bEdit = model.getId() != null;
        var searchOptions;
        const mac = model.getModelAttributesController();
        const attributes = mac.getAttributes(true);
        if (attributes) {
            const sAttr = attributes.filter(function (x) { return x['dataType'] != 'relation' });
            searchOptions = sAttr.map(function (x) { return { 'value': x['name'] } });
        }

        const form = new Form();
        if (data) {
            if (!data['searchFields']) {
                var prop = model.getModelDefaultsController().getDefaultTitleProperty();
                if (prop)
                    data['searchFields'] = [prop];
            }
        }
        const skeleton = [
            {
                name: "regex",
                label: "RegEx",
                tooltip: "**INFO**: Regular Expression",
                dataType: "boolean",
                required: true,
                defaultValue: false,
                readonly: true
            },
            {
                name: "xpath",
                label: "xPath",
                tooltip: "**INFO**: Searchquery with xPath syntax",
                dataType: "boolean",
                required: true,
                defaultValue: true,
                readonly: true
            },
            {
                name: "searchFields",
                label: "Attributes",
                tooltip: "**INFO**: Attributes to search through",
                dataType: "list",
                options: searchOptions,
                columns: 5,
                hidden: !bEdit
            }
        ];
        form.init(skeleton, data);
        return form;
    }

    _model;

    _form

    constructor(config, model) {
        super(config);

        this._model = model;
    }

    /*async _init() {
        await super._init();
        return Promise.resolve();
    }*/

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        const controller = app.getController();
        const state = controller.getStateController().getState();
        const data = {};
        if (state['panelConfig'])
            data['searchFields'] = state['panelConfig']['searchFields'];
        if (!data['searchFields']) {
            const prop = this._model.getModelDefaultsController().getDefaultTitleProperty();
            if (prop)
                data['searchFields'] = [prop];
        }
        this._form = EditSearchPanel.getForm(this._model, data);
        const $form = await this._form.renderForm();
        $div.append($form);
        $div.append('<br/>');

        $div.append($('<button/>')
            .css({ 'float': 'right' })
            .text("Apply")
            .click(async function (event) {
                event.preventDefault();
                event.stopPropagation();

                return this._apply();
            }.bind(this)));

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }

    async _apply() {
        const controller = app.getController();
        const state = controller.getStateController().getState();

        const data = await this._form.readForm();
        if (state['panelConfig']) {
            state['panelConfig']['searchFields'] = data['searchFields'];
        } else {
            const panelConfig = new MediaPanelConfig();
            const conf = { ...this._model.getModelDefaultsController().getDefaultPanelConfig() };
            conf['searchFields'] = data['searchFields'];
            panelConfig.initPanelConfig(this._model, state.action, conf);
            state['panelConfig'] = panelConfig;
        }
        controller.loadState(state, true);

        this.dispose();
        return Promise.resolve(true);
    }
}