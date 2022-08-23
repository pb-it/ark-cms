class ModelSelect {

    static async openCreateModelModal() {
        var strRestrict = "only alphanumeric characters, underscore(except first position) and minus(dash/hyphen) are allowed";

        var skeleton = [
            { name: "name", dataType: "string", required: true, "tooltip": strRestrict },
            { name: "tableName", dataType: "string" },
            { name: "increments", dataType: "boolean", required: true, readonly: true },
            { name: "timestamps", dataType: "boolean", required: true, readonly: true }
        ];
        var data = {
            increments: true,
            timestamps: true
        };
        var panel = new FormPanel(null, skeleton, data);
        panel.setApplyAction(async function () {
            var data = await panel.getForm().readForm();
            if (data.name) {
                var lower = data.name.toLowerCase();
                var names = app.controller.getModelController().getModels().map(function (model) {
                    return model.getDefinition()['name'];
                });
                for (var name of names) {
                    if (name.toLowerCase() === lower)
                        throw new Error("Model '" + name + "' is already defined");
                }

                if (!data.name.startsWith('_')) {
                    if (!/[^a-zA-Z0-9_-]/.test(data.name)) {
                        delete data.increments;
                        delete data.timestamps;
                        data.options = { increments: true, timestamps: true };
                        var model = new XModel(data);
                        var config = { 'minWidth': '1000px' };
                        await app.controller.getModalController().openPanelInModal(new EditModelPanel(config, model));
                    } else
                        throw new Error("For field 'name' " + strRestrict);
                } else
                    throw new Error("Field 'name' must not start with an underscore");
            }
            panel.dispose();
            return Promise.resolve();
        });
        return app.controller.getModalController().openPanelInModal(panel);
    }

    _$modelSelect;

    _$mSelect;
    _$actionSelect;

    _modelName;
    _action;

    _names;

    constructor() {
        $(window).on("changed.model", function (event, data) {
            if (this._$modelSelect && this._names) {
                if (!data || (data['name'] && !this._names.includes(data['name']))) {
                    this._$modelSelect.empty();
                    this._$mSelect = null;
                    this._updateModelSelect();
                }
            }
        }.bind(this));
    }

    renderModelSelect() {
        if (!this._$modelSelect) {
            this._$modelSelect = $('<div/>');
            this._updateModelSelect();
        }
        return this._$modelSelect;
    }

    _updateModelSelect(model) {
        this._renderModelSelect();

        if (!model) {
            if (this._modelName)
                this._modelName = null;
            if (this._$actionSelect)
                this._$actionSelect.remove();
        } else {
            if (this._modelName != model) {
                this._modelName = model;
                if (this._$actionSelect)
                    this._$actionSelect.remove();
                this._renderActionSelect();
            }
        }
    }

    _renderModelSelect() {
        if (!this._$mSelect) {
            var group = new SubMenuGroup();

            var conf;
            var menuItem;

            conf = {
                'name': 'Import',
                'click': function (event, item) {
                    event.stopPropagation();

                    app.controller.getView().getSideNavigationBar().close();

                    try {
                        var $input = $('<input/>')
                            .prop('type', 'file')
                            .on("change", function () {
                                if (this.files.length == 1) {
                                    const reader = new FileReader();
                                    reader.onload = async function fileReadCompleted() {
                                        var version;
                                        var models = [];
                                        var profiles;
                                        var bookmarks;
                                        if (reader.result) {
                                            try {
                                                var conf = JSON.parse(reader.result);
                                                version = conf[MODEL_VERSION_IDENT];

                                                var mDataArr = conf[ModelController.MODELS_IDENT];
                                                if (mDataArr) {
                                                    for (var mData of mDataArr) {
                                                        models.push(new XModel(mData, version));
                                                    }
                                                }

                                                profiles = conf[ProfileController.CONFIG_PROFILE_IDENT];
                                                bookmarks = conf[BookmarkController.CONFIG_BOOKMARK_IDENT];
                                            } catch (error) {
                                                app.controller.showError(error);
                                            }
                                        }
                                        if (models.length > 0 || profiles)
                                            app.controller.getModalController().openPanelInModal(new ImportModelPanel(version, models, profiles, bookmarks));
                                        else
                                            alert("File does not contain any applicable data");
                                    };
                                    reader.readAsText(this.files[0]);
                                }
                            });
                        $input.click();
                    } catch (error) {
                        app.controller.showError(error, "Reading of file failed");
                    }
                }.bind(this)
            };
            menuItem = new MenuItem(conf);
            group.addMenuItem(menuItem);

            conf = {
                'name': 'Export',
                'click': async function (event, item) {
                    event.stopPropagation();

                    app.controller.getView().getSideNavigationBar().close();
                    return app.controller.getModalController().openPanelInModal(new ExportModelPanel());
                }.bind(this)
            };
            menuItem = new MenuItem(conf);
            group.addMenuItem(menuItem);

            conf = {
                'name': 'New',
                'click': async function (event, item) {
                    event.stopPropagation();

                    app.controller.getView().getSideNavigationBar().close();
                    return ModelSelect.openCreateModelModal();
                }
            };
            menuItem = new MenuItem(conf);
            group.addMenuItem(menuItem);

            var dummyGroup = new SubMenuGroup();

            var models = app.controller.getModelController().getModels(app.controller.isInDebugMode());
            this._names = models.map(function (model) {
                return model.getName();
            });
            this._names.sort((a, b) => a.localeCompare(b));
            for (let name of this._names) {
                conf = {
                    'name': name,
                    'click': function (event, item) {
                        if (item.isActive()) {
                            group.activateItem();
                            this._updateModelSelect();
                        } else {
                            group.activateItem(item);
                            this._updateModelSelect(name);
                        }
                    }.bind(this)
                };

                menuItem = new MenuItem(conf);
                menuItem.addSubMenuGroup(dummyGroup);
                if (this._modelName && this._modelName === name)
                    menuItem.setActive();
                group.addMenuItem(menuItem);
            }

            group.showSubMenuGroup();
            this._$mSelect = group.renderMenu();
            this._$modelSelect.append(this._$mSelect);
        }
    }

    _renderActionSelect() {
        var conf;
        var menuItem;
        var group = new SubMenuGroup();

        conf = {
            'name': 'Edit',
            'click': async function (event, item) {
                event.stopPropagation();

                app.controller.getView().getSideNavigationBar().close();

                var config = { 'minWidth': '1000px' };
                var model = app.controller.getModelController().getModel(this._modelName);
                return app.controller.getModalController().openPanelInModal(new EditModelPanel(config, model));
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        group.addMenuItem(menuItem);

        conf = {
            'name': 'Delete',
            'click': async function (event, item) {
                event.stopPropagation();

                app.controller.getView().getSideNavigationBar().close();

                var model = app.controller.getModelController().getModel(this._modelName);
                var panel = new DeleteModelPanel(model);
                return app.controller.getModalController().openPanelInModal(panel);
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        group.addMenuItem(menuItem);

        group.showSubMenuGroup();
        this._$actionSelect = group.renderMenu();
        this._$modelSelect.append(this._$actionSelect);
    }
}