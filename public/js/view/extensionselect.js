class ExtensionSelect {

    _extensionMenu;

    _$extensionSelect;

    _$eSelect;
    _$actionSelect;

    _extension;
    _action;

    _names;

    constructor() {
        $(window).on("changed.extension", function (event, data) {
            if (this._$extensionSelect && this._names) {
                if (!data || (data['name'] && !this._names.includes(data['name']))) {
                    this._$extensionSelect.empty();
                    this._$eSelect = null;
                    this._updateExtensionSelect();
                }
            }
        }.bind(this));
    }

    renderExtensionSelect() {
        if (!this._$extensionSelect) {
            this._$extensionSelect = $('<div/>');
            this._updateExtensionSelect();
        }
        return this._$extensionSelect;
    }

    _updateExtensionSelect(extension) {
        this._$extensionSelect.empty();
        this._renderExtensionSelect();

        if (!extension) {
            if (this._extension)
                this._extension = null;
            if (this._$actionSelect)
                this._$actionSelect.remove();
        } else {
            if (this._extension != extension) {
                this._extension = extension;
                if (this._$actionSelect)
                    this._$actionSelect.remove();
                this._renderActionSelect();
            }
        }
    }

    _renderExtensionSelect() {
        if (!this._extensionMenu)
            this._extensionMenu = this._createExtensionMenu();

        this._$eSelect = new MenuVis(this._extensionMenu).renderMenu();
        this._$extensionSelect.append(this._$eSelect);
    }

    _createExtensionMenu() {
        const menuItems = [];

        var conf;
        var menuItem;

        conf = {
            'name': 'Add',
            'click': async function (event, item) {
                event.stopPropagation();

                const controller = app.getController();
                controller.getView().getSideNavigationBar().close();

                return controller.getExtensionController().openExtensionUpload();
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        menuItems.push(menuItem);

        var extensions = app.getController().getExtensionController().getExtensions();
        this._names = extensions.map(function (x) {
            return x['name'];
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
                        this._updateExtensionSelect();
                    } else {
                        menu.setActiveItem(menuItem);
                        this._updateExtensionSelect(name);
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

        const controller = app.getController();
        const ext = controller.getExtensionController().getExtension(this._extension);
        const module = ext['module'];
        if (module && typeof module['configure'] == 'function') {
            conf = {
                'name': 'Configure',
                'click': async function (event, item) {
                    event.stopPropagation();

                    try {
                        await module.configure();
                        controller.getView().getSideNavigationBar().close();
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }
                    return Promise.resolve();
                }.bind(this)
            };
            menuItem = new MenuItem(conf);
            menuItems.push(menuItem);
        }

        conf = {
            'name': 'Delete',
            'click': async function (event, item) {
                event.stopPropagation();

                return app.getController().getExtensionController().deleteExtension(this._extension);
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        menuItems.push(menuItem);

        const menu = new Menu({ 'class': ['float'] });
        menu.setItems(menuItems);
        this._$actionSelect = new MenuVis(menu).renderMenu();
        this._$extensionSelect.append(this._$actionSelect);
    }
}