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
        this._panels.push(this._$attributesPanel);

        this._$defaultsPanel = new EditModelDefaultsPanel(this._model);
        this._panels.push(this._$defaultsPanel);

        if (app.controller.isInDebugMode()) {
            this._$extensionsPanel = await this._createExtensionsPanel();
            this._panels.push(this._$extensionsPanel);

            this._$actionsPanel = await this._createActionsPanel();
            this._panels.push(this._$actionsPanel);

            this._$rawPanel = await this._createRawPanel();
            this._panels.push(this._$rawPanel);
        }

        await this.openTab(this._$attributesPanel);

        this.setTabSwitchCallback(async function (oldTab, newTab) {
            try {
                if (oldTab == this._$rawPanel) {
                    var fData = await this._rawForm.readForm();
                    this._definition = JSON.parse(fData.json);
                    await this._model.setData(this._definition, false);
                } else {
                    this._definition = await this._readDefinition();
                }
            } catch (error) {
                app.controller.showError(error);
            }
            return Promise.resolve();
        }.bind(this));

        return Promise.resolve();
    }

    async _createAttributesPanel() {
        var panel = new Panel({ 'title': 'Attributes' });
        panel._renderContent = async function () {
            var $div = $('<div/>');

            var list = new List();
            if (this._definition['attributes']) {
                for (var a of this._definition['attributes']) {
                    list.addEntry(new ListEntry(a['name'] + ": " + a['dataType'], a));
                }
            }

            var vListConfig = {
                alignment: 'vertical'
            }
            this._listVis = new ListVis(vListConfig, 'attributes', list);
            this._listVis.init();
            $div.append(this._listVis.renderList());

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
                { name: 'init', tooltip: 'Code is evaluated once during application load.', dataType: 'text' },
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
        var defaults = shrink(await this._$defaultsPanel.getData());
        if (defaults)
            definition['defaults'] = defaults;

        if (this._actionForm) {
            var fData = await this._actionForm.readForm();
            if (!isEmpty(fData))
                definition['actions'] = fData;
            else if (definition['actions'] || definition['actions'] === null)
                delete definition['actions'];
        }

        if (this._extensionForm) {
            var fData = await this._extensionForm.readForm();
            if (!isEmpty(fData['extensions']))
                definition['extensions'] = fData['extensions'];
            else if (definition['extensions'] || definition['extensions'] === null)
                delete definition['extensions'];
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

        var org;
        if (this._originalModel.getId())
            org = this._originalModel.getData();
        var current = data;
        if (!isEqualJson(org, current)) {
            var bTitle = false;
            var defaults = data['defaults'];
            if (defaults && defaults['title'])
                bTitle = true;

            if (bTitle || this._originalModel.getId()) {
                await this._checkConfirm(org, current);
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

                        panel.dispose();
                        await this._checkConfirm(org, current);

                        return Promise.resolve();
                    }.bind(this));
                $div.append($ignore);

                $div.append("<br/>");

                panel.setContent($div);
                await app.controller.getModalController().openPanelInModal(panel);
            }
        } else {
            alert('Nothing changed');
            this.dispose();
        }
        return Promise.resolve();
    }

    async _checkConfirm(org, current) {
        if (app.controller.getConfigController().confirmOnApply()) {
            var bConfirm = await app.controller.getModalController().openDiffJsonModal(org, current);
            if (!bConfirm)
                return Promise.resolve();
        }

        var bForce = false;
        var ac = app.controller.getApiController();
        var info = await ac.getInfo();
        var appVersion = app.controller.getVersionController().getAppVersion();
        if (appVersion != info['version']) {
            var bConfirmation = await app.controller.getModalController().openConfirmModal("Application versions do not match! Still force update?");
            if (bConfirmation)
                bForce = true;
            else
                return Promise.resolve();
        }

        await this._model.setData(current, true, bForce);
        app.controller.reloadApplication();
        this.dispose();
        return Promise.resolve();
    }

    async _hasChanged() {
        var org = this._originalModel.getData();
        var current = await this._readDefinition();
        return Promise.resolve(!isEqualJson(org, current));
    }
}