class EditModelPanel extends TabPanel {

    _model;
    _tmpModel;

    _extensionForm;
    _tabs;
    _rawForm;

    _$attributesPanel;
    _$defaultsPanel;
    _$extensionsPanel;
    _$rawPanel;

    constructor(config, model) {
        super(config);

        this._model = model;
        const def = this._model.getDefinition();
        const copy = JSON.parse(JSON.stringify(def)); //deep copy
        this._tmpModel = new XModel(copy);
    }

    async _init() {
        await super._init();
        const controller = app.getController();

        this._$attributesPanel = new EditAttributesPanel(this._tmpModel);
        this._panels.push(this._$attributesPanel);

        this._$defaultsPanel = new EditModelDefaultsPanel(this._tmpModel);
        this._panels.push(this._$defaultsPanel);

        const authController = controller.getAuthController();
        if (authController && authController.isAdministrator()) {
            this._$extensionsPanel = await this._createExtensionsPanel();
            this._panels.push(this._$extensionsPanel);

            this._tabs = this._model.getConfigTabs();
            if (this._tabs && this._tabs.length > 0) {
                for (var tab of this._tabs) {
                    await tab.init(this._tmpModel);
                    this._panels.push(tab);
                }
            }
        }

        if (controller.isInDebugMode()) {
            this._$rawPanel = await this._createRawPanel();
            this._panels.push(this._$rawPanel);
        }

        await this.openTab(this._$attributesPanel);

        this.setTabSwitchCallback(async function (oldTab, newTab) {
            try {
                this._tmpModel.setDefinition(await this._readDefinition(oldTab), false);
            } catch (error) {
                app.getController().showError(error);
            }
            return Promise.resolve();
        }.bind(this));

        return Promise.resolve();
    }

    async _createExtensionsPanel() {
        const panel = new Panel({ 'title': 'Extensions' });
        panel._renderContent = async function () {
            const $d = $('<div/>');

            const skeleton = [
                { name: 'server', dataType: 'text', size: '20' },
                { name: 'client', dataType: 'text', size: '20' }
            ];
            this._extensionForm = new Form(skeleton, this._tmpModel.getDefinition()['extensions']);
            const $form = await this._extensionForm.renderForm();
            $d.append($form);

            return Promise.resolve($d);
        }.bind(this);

        return Promise.resolve(panel);
    }

    async _createRawPanel() {
        const panel = new Panel({ 'title': 'RAW' });
        panel._renderContent = async function () {
            const $d = $('<div/>');

            const skeleton = [{ name: 'json', dataType: 'text', size: '40' }];
            const definition = this._tmpModel.getDefinition();
            this._rawForm = new Form(skeleton, { 'json': JSON.stringify(definition, null, '\t') });
            const $form = await this._rawForm.renderForm();
            $d.append($form);

            return Promise.resolve($d);
        }.bind(this);

        return Promise.resolve(panel);
    }

    async _readDefinition(tab) {
        var definition;
        if (tab == this._$rawPanel) {
            var fData = await this._rawForm.readForm();
            definition = JSON.parse(fData.json);
        } else {
            definition = this._tmpModel.getDefinition();
            if (tab == this._$attributesPanel) {
                definition['attributes'] = this._$attributesPanel.getAttributes();
                const changes = this._$attributesPanel.getChanges();
                if (changes && changes.length > 0)
                    definition['changes'] = this._$attributesPanel.getChanges();
            } else if (tab == this._$defaultsPanel) {
                var defaults = shrink(await this._$defaultsPanel.getData());
                if (defaults)
                    definition['defaults'] = defaults;
                else if (definition['defaults'])
                    delete definition['defaults'];
            } else if (tab == this._$extensionsPanel) {
                if (this._extensionForm) {
                    var fData = await this._extensionForm.readForm();
                    if (!isEmpty(fData))
                        definition['extensions'] = fData;
                    else if (definition['extensions'] || definition['extensions'] === null)
                        delete definition['extensions'];
                }
            }

            if (this._tabs && this._tabs.length > 0) {
                for (var tab of this._tabs) {
                    if (typeof tab['applyChanges'] === 'function')
                        await tab.applyChanges(definition);
                }
            }
            if (definition['extensions'] && Object.keys(definition['extensions']).length === 0)
                delete definition['extensions'];
        }
        return Promise.resolve(definition);
    }

    async _apply() {
        const controller = app.getController();
        try {
            controller.setLoadingState(true);
            const current = await this._readDefinition(this.getOpenTab());

            var org;
            var id = this._model.getId();
            if (id)
                org = this._model.getDefinition();

            var delta = await diffJson(org, current);
            var bChanged = !(delta.length === 1 && typeof delta[0].removed === 'undefined' && typeof delta[0].added === 'undefined');
            if (bChanged) {
                var bTitle = false;
                const defaults = current['defaults'];
                if (defaults && defaults['title'])
                    bTitle = true;

                if (bTitle || id) {
                    await this._checkConfirm(org, current);
                } else {
                    const panel = new Panel();

                    const $div = $('<div/>')
                        .css({ 'padding': '10' });

                    $div.append(`<b>Information:</b><br/>
You have not choosen an attibute which holds the title for your model.<br/>
As a result the title of your records will build up upon their ID,<br/>
which may not be very convenient to work with in search fields.<br/><br/>`);

                    const $change = $('<button/>')
                        .text("Change") //Abort
                        .click(async function (event) {
                            event.preventDefault();

                            await this.openTab(this._$defaultsPanel);
                            const form = this._$defaultsPanel.getTitleForm();
                            const entry = form.getEntries()[0];
                            const $input = entry.getInput();
                            const $option = $input.first();
                            $option.focus(); //TODO: focus is not working!

                            panel.dispose();

                            return Promise.resolve();
                        }.bind(this));
                    $div.append($change);

                    const $ignore = $('<button/>')
                        .text("Ignore")
                        .css({ 'float': 'right' })
                        .click(async function (event) {
                            event.preventDefault();

                            panel.dispose();
                            const controller = app.getController();
                            try {
                                await this._checkConfirm(org, current);
                            } catch (error) {
                                controller.setLoadingState(false);
                                if (error)
                                    controller.showError(error);
                            }

                            return Promise.resolve();
                        }.bind(this));
                    $div.append($ignore);

                    $div.append("<br/>");

                    panel.setContent($div);
                    await controller.getModalController().openPanelInModal(panel);
                }
            } else {
                controller.setLoadingState(false);
                const bClose = await app.controller.getModalController().openConfirmModal("No changes detected! Close window?");
                if (bClose)
                    this.dispose();
            }
            controller.setLoadingState(false);
        } catch (error) {
            controller.setLoadingState(false);
            controller.showError(error);
        }
        return Promise.resolve();
    }

    async _checkConfirm(org, current) {
        const controller = app.getController();
        if (controller.getConfigController().confirmOnApply()) {
            var bConfirm = await controller.getModalController().openDiffJsonModal(org, current);
            if (!bConfirm)
                return Promise.reject();
        }

        controller.setLoadingState(true);

        var bForce = false;
        if (!controller.getVersionController().isCompatible()) {
            controller.setLoadingState(false);
            var bConfirm = await controller.getModalController().openConfirmModal("Application versions do not match! Still force upload?");
            if (bConfirm)
                bForce = true;
            else
                return Promise.reject();
        }

        controller.setLoadingState(true);
        const id = this._model.getId();
        await this._model.setDefinition(current, true, bForce);
        if (!id)
            await controller.getModelController().init(); //TODO: quickfix: reload all models if new one was created
        else
            await this._model.initModel();
        this.dispose();
        $(window).trigger('changed.model');
        controller.setLoadingState(false);
        return Promise.resolve();
    }

    async _hasChanged() {
        const controller = app.getController();
        controller.setLoadingState(true);
        const org = this._model.getDefinition();
        const current = await this._readDefinition(this.getOpenTab());
        const delta = await diffJson(org, current);
        const bChanged = !(delta.length === 1 && typeof delta[0].removed === 'undefined' && typeof delta[0].added === 'undefined');
        controller.setLoadingState(false);
        return Promise.resolve(bChanged);
    }
}