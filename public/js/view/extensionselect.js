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
            'click': function (event, item) {
                event.stopPropagation();

                const controller = app.getController();
                controller.getView().getSideNavigationBar().close();

                try {
                    var $input = $('<input/>')
                        .prop('type', 'file')
                        .prop('accept', 'application/zip')
                        .prop('multiple', true)
                        .css({ 'visibility': 'hidden' })
                        .bind("click", function (e) {
                            this.remove();
                        })
                        .on("change", async function () {
                            if (this.files.length > 0) {
                                try {
                                    controller.setLoadingState(true);
                                    var name;
                                    var existing;
                                    var res;
                                    var msg;
                                    var extensions = controller.getExtensionController().getExtensions();
                                    var tmp;
                                    for (var file of this.files) {
                                        if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
                                            msg = null;
                                            tmp = file.name.indexOf('@');
                                            if (tmp != -1)
                                                name = file.name.substring(0, tmp);
                                            else if (file.name.endsWith('.zip'))
                                                name = file.name.substring(0, file.name.length - 4);
                                            else
                                                throw new Error('Filename does not comply specification');
                                            existing = null;
                                            for (var x of extensions) {
                                                if (x['name'] == name) {
                                                    existing = x;
                                                    break;
                                                }
                                            }
                                            if (!existing)
                                                res = await controller.getExtensionController().addExtension(file);
                                            else if (confirm('An extension with name \'' + name + '\' already exists!\nDo you want to override it?'))
                                                res = await controller.getExtensionController().addExtension(file, existing);
                                            else
                                                msg = 'Aborted';

                                            if (!msg) {
                                                if (res == 'OK') {
                                                    msg = 'Uploaded \'' + name + '\' successfully!';
                                                    var bRestart;
                                                    var ac = controller.getApiController();
                                                    var info = await ac.fetchApiInfo();
                                                    if (info)
                                                        bRestart = info['state'] === 'openRestartRequest';
                                                    if (bRestart) {
                                                        msg += '\nAPI server application needs to be restarted for the changes to take effect!';
                                                        //controller.getView().initView(); // shows notification, but clears canvas
                                                        //await reloadState();
                                                        //controller.getView().getSideNavigationBar().updateSideNavigationBar(); // not updating notification
                                                        controller.getView().getSideNavigationBar().renderSideNavigationBar();
                                                    } else {
                                                        controller.getView().getSideNavigationBar().close();
                                                        msg += '\nReload website for the changes to take effect!';
                                                    }
                                                } else
                                                    msg = 'Something went wrong!';
                                            }
                                        } else
                                            msg = 'An extension has to be provided as zip archive!\nSkipping \'' + name + '\'';
                                        alert(msg);
                                    }
                                    controller.setLoadingState(false);
                                } catch (error) {
                                    controller.setLoadingState(false);
                                    if (error instanceof HttpError && error['response']) {
                                        if (error['response']['status'] == 422 && error['response']['body'])
                                            controller.showErrorMessage(error['response']['body']);
                                        else
                                            controller.showErrorMessage(error['message']);
                                    } else
                                        controller.showError(error);
                                }
                            }
                            this.remove();
                            return Promise.resolve();
                        });
                    $input.click();
                } catch (error) {
                    controller.showError(error, "Reading of file failed");
                }
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

                try {
                    var bConfirm;
                    if (module && typeof module['teardown'] == 'function')
                        bConfirm = await module.teardown();
                    else
                        bConfirm = confirm("Delete extension '" + this._extension + "'?");
                    if (bConfirm) {
                        controller.setLoadingState(true);
                        var res = await controller.getExtensionController().deleteExtension(this._extension);
                        controller.setLoadingState(false);

                        if (res == 'OK') {
                            var msg = 'Deleted extension successfully!';
                            var bRestart;
                            var ac = controller.getApiController();
                            var info = await ac.fetchApiInfo();
                            if (info)
                                bRestart = info['state'] === 'openRestartRequest';
                            if (bRestart) {
                                msg += '\nAPI server application needs to be restarted for the changes to take effect!';
                                controller.getView().getSideNavigationBar().renderSideNavigationBar();
                            } else {
                                controller.getView().getSideNavigationBar().close();
                                msg += '\nReload website for the changes to take effect!';
                            }
                            alert(msg);
                        } else
                            alert('Something went wrong!');
                    }
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }
                return Promise.resolve();
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