class ImportModelPanel extends Panel {

    _version;
    _models;
    _profiles;
    _bookmarks;

    _form;
    _listVis;

    constructor(version, models, profiles, bookmarks) {
        super();

        this._version = version;

        if (models && models.length > 1)
            this._models = models.sort((a, b) => a.getName().localeCompare(b.getName()));
        else
            this._models = models;

        this._profiles = profiles;
        this._bookmarks = bookmarks;
    }

    async _renderContent() {
        var $div = $('<div/>')
            .css({ 'padding': '10' });

        if (this._profiles) {
            var skeleton = [
                {
                    name: "importProfiles",
                    label: "Import Profiles",
                    dataType: "boolean",
                    required: true,
                    defaultValue: true,
                    view: "labelRight"
                },
                {
                    name: "importBookmarks",
                    label: "Import Bookmarks",
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

        var list = new List();
        for (var model of this._models) {
            list.addEntry(new SelectableListEntry(model.getName(), model, true));
        }

        var vListConfig = {
            alignment: 'vertical',
            selectButtons: true
        }
        this._listVis = new SelectableListVis(vListConfig, 'models', list);
        this._listVis.init();
        $div.append(this._listVis.renderList());

        $div.append('<br/>');

        var $abortButton = $('<button/>')
            .text("Abort")
            .click(async function (event) {
                event.preventDefault();
                this.dispose();
                return Promise.resolve();
            }.bind(this));
        $div.append($abortButton);

        var $importButton = $('<button/>')
            .text("Import")
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.preventDefault();

                try {
                    var list = this._listVis.getList();
                    var selectedEntries = list.getEntries().filter(function (x) { return x.isSelected() });
                    var selectedModels = selectedEntries.map(function (x) { return x.getData() });

                    if (selectedModels && selectedModels.length > 0) {
                        var models = app.controller.getModelController().getModels();
                        var names = models.map(function (model) {
                            return model.getName();
                        });
                        var conflictingModels = [];
                        for (var model of selectedModels) {
                            if (names.indexOf(model.getName()) >= 0)
                                conflictingModels.push(model);
                        }

                        if (conflictingModels.length == 0) {
                            this._import(selectedModels);
                        } else {
                            var panel = new Panel();

                            var $div = $('<div/>')
                                .css({ 'padding': '10' });

                            $div.append(`<b>Information:</b><br/>
                                        Following models already exist and will be overwritten:<br/><br/>`);

                            for (var model of conflictingModels)
                                $div.append(model.getName() + "<br/>");

                            $div.append("<br/>");

                            var $change = $('<button/>')
                                .text("Abort") //Abort
                                .click(async function (event) {
                                    event.preventDefault();

                                    panel.dispose();

                                    return Promise.resolve();
                                }.bind(this));
                            $div.append($change);

                            var $ignore = $('<button/>')
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
                            await app.controller.getModalController().openPanelInModal(panel);
                        }
                    } else
                        alert('select at least one model');
                } catch (error) {
                    app.controller.showError(error);
                }

                return Promise.resolve();
            }.bind(this));
        $div.append($importButton);

        return Promise.resolve($div);
    }

    async _import(models) {
        try {
            app.controller.setLoadingState(true);

            var bForce = false;
            var ac = app.controller.getApiController();
            var info = ac.getApiInfo();
            if (this._version != info['version']) {
                app.controller.setLoadingState(false);
                var bConfirmation = await app.controller.getModalController().openConfirmModal("Application versions do not match! Still force upload?");
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
            var bookmarks;
            if (this._bookmarks && this._form) {
                var fData = await this._form.readForm();
                if (fData['importBookmarks'])
                    bookmarks = this._bookmarks;
            }
            await app.controller.getConfigController().import(models, profiles, bookmarks, bForce);

            this.dispose();
        } catch (error) {
            app.controller.setLoadingState(false);
            app.controller.showError(error, "Import of models failed!");
        }
        return Promise.resolve();
    }
}