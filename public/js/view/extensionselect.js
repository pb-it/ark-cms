class ExtensionSelect {

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
        if (!this._$eSelect) {
            var group = new SubMenuGroup();

            var conf;
            var menuItem;

            conf = {
                'name': 'Add',
                'click': function (event, item) {
                    event.stopPropagation();

                    app.controller.getView().getSideNavigationBar().close();

                    try {
                        var $input = $('<input/>')
                            .prop('type', 'file')
                            .prop('accept', 'application/zip')
                            .prop('multiple', true)
                            .on("change", async function () {
                                if (this.files.length > 0) {
                                    try {
                                        app.controller.setLoadingState(true);
                                        var name;
                                        var existing;
                                        var res;
                                        var msg;
                                        var extensions = app.controller.getExtensionController().getExtensions();
                                        for (var file of this.files) {
                                            if (file.type == 'application/zip') {
                                                name = file.name.split('@')[0];
                                                existing = null;
                                                for (var x of extensions) {
                                                    if (x['name'] == name) {
                                                        existing = x;
                                                        break;
                                                    }
                                                }
                                                if (!existing)
                                                    res = await app.controller.getExtensionController().addExtension(file);
                                                else if (confirm('An extension with name \'' + name + '\' already exists. Do you want to override it?'))
                                                    res = await app.controller.getExtensionController().addExtension(file, existing);
                                                else
                                                    msg = 'Aborted';

                                                if (!msg) {
                                                    if (res == 'OK')
                                                        msg = 'Uploaded \'' + name + '\' successfully. Reload website for the changes to take effect!';
                                                    else
                                                        msg = 'Something went wrong!';
                                                }
                                            } else
                                                msg = 'An extension has to be provided as zip archive! Skipping \'' + name + '\'';
                                            alert(msg)
                                        }
                                        app.controller.setLoadingState(false);
                                    } catch (error) {
                                        app.controller.setLoadingState(false);
                                        app.controller.showError(error);
                                    }
                                }
                                return Promise.resolve();
                            });
                        $input.click();
                    } catch (error) {
                        app.controller.showError(error, "Reading of file failed");
                    }
                }.bind(this)
            };
            menuItem = new MenuItem(conf);
            group.addMenuItem(menuItem);

            var dummyGroup = new SubMenuGroup(); // only to show carret

            var extensions = app.controller.getExtensionController().getExtensions();
            this._names = extensions.map(function (x) {
                return x['name'];
            });
            this._names.sort((a, b) => a.localeCompare(b));
            for (let name of this._names) {
                conf = {
                    'name': name,
                    'click': function (event, item) {
                        if (item.isActive()) {
                            group.activateItem();
                            this._updateExtensionSelect();
                        } else {
                            group.activateItem(item);
                            this._updateExtensionSelect(name);
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
            this._$eSelect = group.renderMenu();
            this._$extensionSelect.append(this._$eSelect);
        }
    }

    _renderActionSelect() {
        var conf;
        var menuItem;
        var group = new SubMenuGroup();

        /*conf = {
            'name': 'Edit',
            'click': async function (event, item) {
                event.stopPropagation();

                app.controller.getView().getSideNavigationBar().close();

                //TODO:
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        group.addMenuItem(menuItem);*/

        conf = {
            'name': 'Delete',
            'click': async function (event, item) {
                event.stopPropagation();

                if (confirm("Delete extension '" + this._extension + "'?")) {
                    try {

                        app.controller.setLoadingState(true);
                        var res = await app.controller.getExtensionController().deleteExtension(this._extension);
                        app.controller.setLoadingState(false);

                        if (res == 'OK') {
                            app.controller.getView().getSideNavigationBar().close();
                            alert('Deleted extension successfully. Reload website for the changes to take effect!')
                        } else
                            alert('Something went wrong!');
                    } catch (error) {
                        app.controller.setLoadingState(false);
                        app.controller.showError(error);
                    }
                }

                return Promise.resolve();
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        group.addMenuItem(menuItem);

        group.showSubMenuGroup();
        this._$actionSelect = group.renderMenu();
        this._$extensionSelect.append(this._$actionSelect);
    }
}