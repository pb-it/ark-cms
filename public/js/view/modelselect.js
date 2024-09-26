class ModelSelect {

    static async openCreateModelModal() {
        const controller = app.getController();
        const strRestrict = "only alphanumeric characters, underscore(except first position) and minus(dash/hyphen) are allowed";

        const skeleton = [
            { name: "name", dataType: "string", required: true, "tooltip": strRestrict },
            { name: "tableName", dataType: "string" },
            { name: "increments", dataType: "boolean", required: true, readonly: true },
            { name: "timestamps", dataType: "boolean", required: true, readonly: true },
            {
                name: "public",
                tooltip: "**Info**: Entries of public models are readable without authentication.",
                dataType: "boolean",
                required: true,
                defaultValue: false
            },
        ];
        const info = controller.getApiController().getApiInfo();
        const client = info['db']['client'];
        if (client === 'mysql' || client === 'mysql2') {
            skeleton.push(
                {
                    'name': 'charEncoding',
                    'label': 'Encoding',
                    'tooltip': `**Info**: The default character encoding for the table will be taken from your database client.`,
                    'dataType': 'enumeration',
                    'options': [
                        { 'value': 'default' },
                        { 'value': 'latin1' },
                        { 'value': 'utf8' },
                        { 'value': 'utf8mb4' }
                    ],
                    'view': 'select'
                }
            );
        }
        const data = {
            increments: true,
            timestamps: true
        };
        const panel = new FormPanel(null, skeleton, data);
        panel.setApplyAction(async function () {
            const controller = app.getController();
            var data = await panel.getForm().readForm();
            if (data.name) {
                var lower = data.name.toLowerCase();
                var names = controller.getModelController().getModels().map(function (model) {
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
                        await controller.getModalController().openPanelInModal(new EditModelPanel(config, model));
                    } else
                        throw new Error("For field 'name' " + strRestrict);
                } else
                    throw new Error("Field 'name' must not start with an underscore");
            }
            panel.dispose();
            return Promise.resolve();
        });
        return controller.getModalController().openPanelInModal(panel);
    }

    _modelMenu;

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
                    this._modelMenu = null;
                    //this._$mSelect = null;
                    this._updateModelSelect(this._modelName);
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
        this._modelName = model;

        this._$modelSelect.empty();
        this._renderModelSelect();
        if (this._$actionSelect)
            this._$actionSelect.remove();
        if (this._modelName)
            this._renderActionSelect();
    }

    _renderModelSelect() {
        if (!this._modelMenu)
            this._modelMenu = this._createModelMenu();

        this._$mSelect = new MenuVis(this._modelMenu).renderMenu();
        this._$modelSelect.append(this._$mSelect);
    }

    _createModelMenu() {
        const menuItems = [];

        var conf;
        var menuItem;

        conf = {
            'name': 'Import',
            'click': function (event, item) {
                event.stopPropagation();

                const controller = app.getController();
                controller.getView().getSideNavigationBar().close();
                try {
                    var $input = $('<input/>')
                        .prop('type', 'file')
                        .prop('accept', 'application/json')
                        .on("change", function () {
                            if (this.files.length == 1) {
                                const reader = new FileReader();
                                reader.onload = async function fileReadCompleted() {
                                    var version;
                                    var models = [];
                                    var profiles;
                                    const controller = app.getController();
                                    if (reader.result) {
                                        try {
                                            const conf = JSON.parse(reader.result);
                                            version = conf[MODEL_VERSION_IDENT];

                                            const mDataArr = conf[ModelController.MODELS_IDENT];
                                            if (mDataArr) {
                                                for (var mData of mDataArr) {
                                                    models.push(new XModel(mData, version));
                                                }
                                            }

                                            profiles = conf[ProfileController.CONFIG_PROFILE_IDENT];
                                        } catch (error) {
                                            controller.showError(error);
                                        }
                                    }
                                    if (models.length > 0 || profiles)
                                        controller.getModalController().openPanelInModal(new ImportModelPanel(version, models, profiles));
                                    else
                                        alert("File does not contain any applicable data");
                                };
                                reader.readAsText(this.files[0]);
                            }
                        });
                    $input.click();
                } catch (error) {
                    controller.showError(error, "Reading of file failed");
                }
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        menuItems.push(menuItem);

        conf = {
            'name': 'Export',
            'click': async function (event, item) {
                event.stopPropagation();

                const controller = app.getController();
                controller.getView().getSideNavigationBar().close();
                return controller.getModalController().openPanelInModal(new ExportModelPanel());
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        menuItems.push(menuItem);

        conf = {
            'name': 'New',
            'click': async function (event, item) {
                event.stopPropagation();

                app.getController().getView().getSideNavigationBar().close();
                return ModelSelect.openCreateModelModal();
            }
        };
        menuItem = new MenuItem(conf);
        menuItems.push(menuItem);

        const controller = app.getController();
        var models = controller.getModelController().getModels(controller.isInDebugMode());
        this._names = models.map(function (model) {
            return model.getName();
        });
        this._names.sort((a, b) => a.localeCompare(b));
        for (let name of this._names) {
            conf = {
                'name': name,
                'click': function (event, item) {
                    event.preventDefault();
                    event.stopPropagation();
                    const menuItem = item.getMenuItem();
                    const menu = menuItem.getMenu();
                    if (item.isActive()) {
                        menu.setActiveItem();
                        this._updateModelSelect();
                    } else {
                        menu.setActiveItem(menuItem);
                        this._updateModelSelect(name);
                    }
                }.bind(this)
            };

            menuItem = new MenuItem(conf);
            menuItem.setSubMenu(new Menu());
            if (this._modelName && this._modelName === name)
                menuItem.setActive();
            menuItems.push(menuItem);
        }

        const menu = new Menu({ 'class': ['float'] });
        menu.setItems(menuItems);
        return menu;
    }

    _renderActionSelect() {
        var conf;
        var menuItem;
        const menuItems = [];

        conf = {
            'name': 'Edit',
            'click': async function (event, item) {
                event.stopPropagation();

                const controller = app.getController();
                controller.getView().getSideNavigationBar().close();

                const config = { 'minWidth': '1000px' };
                const model = controller.getModelController().getModel(this._modelName);
                return controller.getModalController().openPanelInModal(new EditModelPanel(config, model));
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        menuItems.push(menuItem);

        conf = {
            'name': 'Delete',
            'click': async function (event, item) {
                event.stopPropagation();

                const controller = app.getController();
                controller.getView().getSideNavigationBar().close();

                const model = controller.getModelController().getModel(this._modelName);
                const panel = new DeleteModelPanel(model);
                return controller.getModalController().openPanelInModal(panel);
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        menuItems.push(menuItem);

        const menu = new Menu({ 'class': ['float'] });
        menu.setItems(menuItems);
        this._$actionSelect = new MenuVis(menu).renderMenu();
        this._$modelSelect.append(this._$actionSelect);
    }
}