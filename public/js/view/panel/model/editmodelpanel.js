class EditModelPanel extends TabPanel {

    _model;
    _tmpModel;

    _extensionForm;
    _rawForm;

    _$attributesPanel;
    _$defaultsPanel;
    _$extensionsPanel;
    _$rawPanel;

    constructor(config, model) {
        super(config);

        this._model = model;
        var data = this._model.getDefinition();
        var copy = JSON.parse(JSON.stringify(data));
        this._tmpModel = new XModel(copy);
    }

    async _init() {
        await super._init();

        this._$attributesPanel = new EditAttributesPanel(this._tmpModel);
        this._panels.push(this._$attributesPanel);

        this._$defaultsPanel = new EditModelDefaultsPanel(this._tmpModel);
        this._panels.push(this._$defaultsPanel);

        if (app.controller.isInDebugMode()) {
            this._$extensionsPanel = await this._createExtensionsPanel();
            this._panels.push(this._$extensionsPanel);

            this._$rawPanel = await this._createRawPanel();
            this._panels.push(this._$rawPanel);
        }

        await this.openTab(this._$attributesPanel);

        this.setTabSwitchCallback(async function (oldTab, newTab) {
            try {
                this._tmpModel.setDefinition(await this._readDefinition(oldTab), false);
            } catch (error) {
                app.controller.showError(error);
            }
            return Promise.resolve();
        }.bind(this));

        return Promise.resolve();
    }

    async _createExtensionsPanel() {
        var panel = new Panel({ 'title': 'Extensions' });
        panel._renderContent = async function () {
            var $d = $('<div/>');

            var skeleton = [
                { name: 'server', dataType: 'text', size: '20' },
                { name: 'client', dataType: 'text', size: '20' }
            ];
            this._extensionForm = new Form(skeleton, this._tmpModel.getDefinition()['extensions']);
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

            var skeleton = [{ name: 'json', dataType: 'text', size: '40' }];
            var definition = this._tmpModel.getDefinition();
            this._rawForm = new Form(skeleton, { 'json': JSON.stringify(definition, null, '\t') });
            var $form = await this._rawForm.renderForm();
            $d.append($form);

            return Promise.resolve($d);
        }.bind(this);

        return Promise.resolve(panel);
    }

    async _readDefinition(tab) {
        var definition;
        if (tab == this._$rawPanel)
            definition = await this._readRawPanel();
        else
            definition = await this._readAllPanels();
        return Promise.resolve(definition);
    }

    async _readRawPanel() {
        var fData = await this._rawForm.readForm();
        var definition = JSON.parse(fData.json);
        return Promise.resolve(definition);
    }

    async _readAllPanels() {
        var definition = this._tmpModel.getDefinition();

        definition['attributes'] = this._$attributesPanel.getAttributes();

        var defaults = shrink(await this._$defaultsPanel.getData());
        if (defaults)
            definition['defaults'] = defaults;

        if (this._extensionForm) {
            var fData = await this._extensionForm.readForm();
            if (!isEmpty(fData))
                definition['extensions'] = fData;
            else if (definition['extensions'] || definition['extensions'] === null)
                delete definition['extensions'];
        }
        return Promise.resolve(definition);
    }

    async _apply() {
        try {
            app.controller.setLoadingState(true);
            var data = await this._readDefinition(this.getOpenTab());

            var org;
            var id = this._model.getId();
            if (id)
                org = this._model.getDefinition();
            var current = data;

            if (typeof JsDiff === 'undefined') {
                var buildUrl = "http://incaseofstairs.com/jsdiff/";
                await loadScript(buildUrl + "diff.js");
            }
            var delta = JsDiff.diffJson(org, current);
            var bChanged = !(delta.length === 1 && typeof delta[0].removed === 'undefined' && typeof delta[0].added === 'undefined');
            if (bChanged) {
                var bTitle = false;
                var defaults = data['defaults'];
                if (defaults && defaults['title'])
                    bTitle = true;

                if (bTitle || id) {
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
                app.controller.setLoadingState(false);
                var bClose = await app.controller.getModalController().openConfirmModal("No changes detected! Close window?");
                if (bClose)
                    this.dispose();
            }
            app.controller.setLoadingState(false);
        } catch (error) {
            app.controller.setLoadingState(false);
            app.controller.showError(error);
        }
        return Promise.resolve();
    }

    async _checkConfirm(org, current) {
        try {
            if (app.controller.getConfigController().confirmOnApply()) {
                var bConfirm = await app.controller.getModalController().openDiffJsonModal(org, current);
                if (!bConfirm)
                    return Promise.resolve();
            }

            app.controller.setLoadingState(true);

            var bForce = false;
            if (!app.controller.getVersionController().isCompatible()) {
                app.controller.setLoadingState(false);
                var bConfirmation = await app.controller.getModalController().openConfirmModal("Application versions do not match! Still force upload?");
                if (bConfirmation)
                    bForce = true;
                else
                    return Promise.resolve();
            }

            app.controller.setLoadingState(true);
            var id = this._model.getId();
            await this._model.setDefinition(current, true, bForce);

            if (!id)
                await app.controller.getModelController().init(); //TODO: quickfix: reload all models if new one was created
            else
                await this._model.initModel();

            this.dispose();

            //await app.controller.getApiController().fetchApiInfo(); // needed for notification in side bar
            //app.controller.getView().initView(); //redraw of visualisation with new menus is also done with event 'changed.model'
            app.controller.reloadState();
            //app.controller.reloadApplication();

            app.controller.setLoadingState(false);
        } catch (error) {
            app.controller.setLoadingState(false);
            app.controller.showError(error);
        }
        return Promise.resolve();
    }

    async _hasChanged() {
        app.controller.setLoadingState(true);
        var org = this._model.getDefinition();
        var current = await this._readDefinition(this.getOpenTab());
        if (typeof JsDiff === 'undefined') {
            var buildUrl = "http://incaseofstairs.com/jsdiff/";
            await loadScript(buildUrl + "diff.js");
        }
        var delta = JsDiff.diffJson(org, current);
        var bChanged = !(delta.length === 1 && typeof delta[0].removed === 'undefined' && typeof delta[0].added === 'undefined');
        app.controller.setLoadingState(false);
        return Promise.resolve(bChanged);
    }
}