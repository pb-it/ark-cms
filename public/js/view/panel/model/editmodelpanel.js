class EditModelPanel extends TabPanel {

    _originalModel;
    _model;

    _definition;

    _actionForm;
    _extensionForm;
    _rawForm;

    _$attributesPanel;
    _$defaultsPanel;
    _$actionsPanel;
    _$extensionsPanel;
    _$rawPanel;

    constructor(config, model) {
        super(config);

        this._originalModel = model;

        this._definition = JSON.parse(JSON.stringify(this._originalModel.getData()));

        this._model = new XModel(this._definition);
    }

    async _init() {
        await super._init();

        this._$attributesPanel = await this._createAttributesPanel();
        this._$defaultsPanel = new EditModelDefaultsPanel(this._model);
        this._$actionsPanel = await this._createActionsPanel();
        this._$extensionsPanel = await this._createExtensionsPanel();
        this._$rawPanel = await this._createRawPanel();

        this._panels.push(this._$attributesPanel);
        this._panels.push(this._$defaultsPanel);
        this._panels.push(this._$actionsPanel);
        this._panels.push(this._$extensionsPanel);
        this._panels.push(this._$rawPanel);

        await this.openTab(this._$attributesPanel);

        this.setTabSwitchCallback(async function (oldTab, newTab) {
            if (oldTab == this._$rawPanel) {
                var fData = await this._rawForm.readForm();
                this._definition = JSON.parse(fData.json);
                await this._model.setData(this._definition, false);
            }
            return Promise.resolve();
        }.bind(this));

        return Promise.resolve();
    }

    async _createAttributesPanel() {
        var panel = new Panel({ 'title': 'Attributes' });
        panel._renderContent = async function () {
            var $div = $('<div/>');

            var conf = [];
            if (this._definition['attributes']) {
                for (var a of this._definition['attributes']) {
                    conf.push({
                        'name': a['name'] + ": " + a['dataType'],
                        'type': 'node'
                    });
                }
            }

            var tree = new Tree(conf);
            $div.append(tree.render());

            $div.append('<br/>');

            var $button = $('<button>')
                .text('Add Attribute')
                .click(async function (event) {
                    event.stopPropagation();

                    var aac = new AddAttributeController(this._model, async function (data) {
                        if (this._definition['attributes'])
                            this._definition['attributes'].push(data);
                        else
                            this._definition['attributes'] = [data];

                        return this._$attributesPanel.render();
                    }.bind(this));
                    return aac.renderForm1();
                }.bind(this));
            $div.append($button);

            return Promise.resolve($div);
        }.bind(this);

        return Promise.resolve(panel);
    }

    async _createActionsPanel() {
        var panel = new Panel({ 'title': 'Actions' });
        panel._renderContent = async function () {
            var $d = $('<div/>');

            var skeleton = [
                { name: 'prepare', dataType: 'text' },
                { name: 'check', dataType: 'text' },
                { name: 'contextMenuExtensions', label: 'contextMenuExt.', dataType: 'text' }
            ];
            this._actionForm = new Form(skeleton, this._definition['actions']);
            var $form = await this._actionForm.renderForm();
            $d.append($form);

            return Promise.resolve($d);
        }.bind(this);

        return Promise.resolve(panel);
    }

    async _createExtensionsPanel() {
        var panel = new Panel({ 'title': 'Extensions' });
        panel._renderContent = async function () {
            var $d = $('<div/>');

            var skeleton = [{ name: 'extensions', dataType: 'text' }];
            this._extensionForm = new Form(skeleton, { extensions: this._definition['extensions'] });
            var $form = await this._extensionForm.renderForm();
            $d.append($form);

            return Promise.resolve($d);
        }.bind(this);

        return Promise.resolve(panel);
    }

    async _createRawPanel() {
        var panel = new Panel({ 'title': 'RAW' });
        panel._renderContent = async function () {
            var $d = $('<div/>');

            var skeleton = [{ name: 'json', dataType: 'text', size: '20' }];
            this._rawForm = new Form(skeleton, { 'json': JSON.stringify(await this._readDefinition(), null, '\t') });
            var $form = await this._rawForm.renderForm();
            $d.append($form);

            return Promise.resolve($d);
        }.bind(this);

        return Promise.resolve(panel);
    }

    async _readDefinition() {
        var definition = this._definition;
        var defaults = await this._$defaultsPanel.getData();
        if (defaults)
            definition['defaults'] = defaults;

        if (this._actionForm) {
            var fData = await this._actionForm.readForm();
            if (Object.keys(fData).length > 0)
                definition['actions'] = fData;
        }

        if (this._extensionForm) {
            fData = await this._extensionForm.readForm();
            if (fData['extensions'])
                definition['extensions'] = fData['extensions'];
        }

        return Promise.resolve(definition);
    }

    async _apply() {
        var data;
        if (this.getOpenTab() == this._$rawPanel) {
            var fData = await this._rawForm.readForm();
            data = JSON.parse(fData.json);
        } else {
            data = await this._readDefinition();
        }

        var bTitle = false;
        var defaults = data['defaults'];
        if (defaults && defaults['title'])
            bTitle = true;

        if (bTitle || data['id']) {
            await this._model.setData(data);
            app.controller.reload();
            this.dispose();
        } else {
            var panel = new Panel();

            var $div = $('<div/>')
                .css({ 'padding': '10' });

            $div.append(`<b>Information:</b><br/>
            You have not choosen an attibute which holds the title for your model.<br/>
            As a result the title of your records will build up upon their ID,<br/>
            which may not be very convenient to work with in search fields.<br/><br/>`);

            var $change = $('<button/>')
                .text("Change") //Abort
                .click(async function (event) {
                    event.preventDefault();

                    await this.openTab(this._$defaultsPanel);
                    var form = this._$defaultsPanel.getTitleForm();
                    var entry = form.getEntries()[0];
                    var $input = entry.getInput();
                    var $option = $input.first();
                    $option.focus(); //TODO: focus is not working!

                    panel.dispose();

                    return Promise.resolve();
                }.bind(this));
            $div.append($change);

            var $ignore = $('<button/>')
                .text("Ignore")
                .css({ 'float': 'right' })
                .click(async function (event) {
                    event.preventDefault();

                    await this._model.setData(data);
                    app.controller.reload();

                    panel.dispose();
                    this.dispose();

                    return Promise.resolve();
                }.bind(this));
            $div.append($ignore);

            $div.append("<br/>");

            panel.setContent($div);
            await app.controller.getModalController().openPanelInModal(panel);
        }
        Promise.resolve();
    }
}