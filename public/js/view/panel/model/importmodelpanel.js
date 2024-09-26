class ImportModelPanel extends Panel {

    _version;
    _models;
    _profiles;

    _form;
    _listVis;

    constructor(version, models, profiles) {
        super();

        this._version = version;

        if (models && models.length > 1)
            this._models = models.sort((a, b) => a.getName().localeCompare(b.getName()));
        else
            this._models = models;

        this._profiles = profiles;
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        if (this._profiles) {
            const skeleton = [
                {
                    name: "importProfiles",
                    label: "Import Profiles",
                    dataType: "boolean",
                    required: true,
                    defaultValue: true,
                    view: "labelRight"
                }
            ];
            this._form = new Form(skeleton, {});
            $div.append(await this._form.renderForm());

            $div.append("<br/>");
        }

        const list = new List();
        for (var model of this._models) {
            list.addEntry(new SelectableListEntry(model.getName(), model, null, true));
        }

        const vListConfig = {
            alignment: 'vertical',
            selectButtons: true
        }
        this._listVis = new SelectableListVis(vListConfig, 'models', list);
        this._listVis.init();
        $div.append(this._listVis.renderList());

        $div.append('<br/>');

        const $abortButton = $('<button/>')
            .text("Abort")
            .click(async function (event) {
                event.preventDefault();
                this.dispose();
                return Promise.resolve();
            }.bind(this));
        $div.append($abortButton);

        const $importButton = $('<button/>')
            .text("Import")
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.preventDefault();

                const controller = app.getController();
                try {
                    const list = this._listVis.getList();
                    const selectedEntries = list.getEntries().filter(function (x) { return x.isSelected() });
                    const selectedModels = selectedEntries.map(function (x) { return x.getData() });

                    if (selectedModels && selectedModels.length > 0) {
                        const models = controller.getModelController().getModels();
                        const names = models.map(function (model) {
                            return model.getName();
                        });
                        const conflictingModels = [];
                        for (var model of selectedModels) {
                            if (names.indexOf(model.getName()) >= 0)
                                conflictingModels.push(model);
                        }

                        if (conflictingModels.length == 0) {
                            this._import(selectedModels);
                        } else {
                            const panel = new Panel();

                            const $div = $('<div/>')
                                .css({ 'padding': '10' });

                            $div.append(`<b>Information:</b><br/>
                                        Following models already exist and will be overwritten:<br/><br/>`);

                            for (var model of conflictingModels)
                                $div.append(model.getName() + "<br/>");

                            $div.append("<br/>");

                            const $change = $('<button/>')
                                .text("Abort") //Abort
                                .click(async function (event) {
                                    event.preventDefault();

                                    panel.dispose();

                                    return Promise.resolve();
                                }.bind(this));
                            $div.append($change);

                            const $ignore = $('<button/>')
                                .text("Continue")
                                .css({ 'float': 'right' })
                                .click(async function (event) {
                                    event.preventDefault();

                                    panel.dispose();

                                    await this._import(selectedModels);

                                    return Promise.resolve();
                                }.bind(this));
                            $div.append($ignore);

                            $div.append("<br/>");

                            panel.setContent($div);
                            await controller.getModalController().openPanelInModal(panel);
                        }
                    } else
                        alert('select at least one model');
                } catch (error) {
                    controller.showError(error);
                }

                return Promise.resolve();
            }.bind(this));
        $div.append($importButton);

        return Promise.resolve($div);
    }

    async _import(models) {
        const controller = app.getController();
        try {
            controller.setLoadingState(true);

            var bForce = false;
            const ac = controller.getApiController();
            const info = ac.getApiInfo();
            if (!VersionController.compatible(this._version, info['version'])) {
                controller.setLoadingState(false);
                var bConfirmation = await controller.getModalController().openConfirmModal("Version of imported models may not be compatible with backend application version! Still force upload?");
                if (bConfirmation)
                    bForce = true;
                else
                    return Promise.resolve();
            }

            var profiles;
            if (this._profiles && this._form) {
                var fData = await this._form.readForm();
                if (fData['importProfiles'])
                    profiles = this._profiles;
            }
            await controller.getConfigController().import(models, profiles, bForce);

            this.dispose();
        } catch (error) {
            controller.setLoadingState(false);
            controller.showError(error, "Import of models failed!");
        }
        return Promise.resolve();
    }
}