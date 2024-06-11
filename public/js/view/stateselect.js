class StateSelect {

    _profileMenu;
    _profileMenuVis;
    _modelMenu;
    _modelMenuVis;
    _actionMenu;
    _actionMenuVis;
    _showMenu;
    _showMenuVis;

    _$stateSelect;

    _$profileSelect;
    _$modelSelect;
    _$actionSelect;
    _$showSelect;
    _$storedSelect;

    _profile;
    _model;
    _action;
    _show;

    constructor() {
    }

    initStateSelect() {
        $(window).on("changed.model", function (event, data) {
            if (this._$stateSelect) {
                //this._$stateSelect.empty();
                if (this._$profileSelect) {
                    this._profileMenu = null;
                    this._$profileSelect.remove();
                    this._$profileSelect = null;
                }
                if (this._$modelSelect) {
                    this._modelMenu = null;
                    this._$modelSelect.remove();
                    this._$modelSelect = null;
                }
                if (this._$actionSelect) {
                    this._actionMenu = null;
                    this._$actionSelect.remove();
                    this._$actionSelect = null;
                }
                if (this._$showSelect) {
                    this._showMenu = null;
                    this._$showSelect.remove();
                    this._$showSelect = null;
                }
                if (this._$storedSelect) {
                    this._$storedSelect.remove();
                    this._$storedSelect = null;
                }

                this._updateStateSelect(this._profile, this._model, this._action, this._show);
            }
        }.bind(this));
    }

    async renderStateSelect() {
        if (!this._$stateSelect) {
            this._$stateSelect = $('<div/>');
            const pc = app.getController().getProfileController();
            if (pc)
                await this._updateStateSelect(pc.getCurrentProfileName());
            else
                await this._updateStateSelect(this._profile);
        }
        return Promise.resolve(this._$stateSelect);
    }

    async _updateStateSelect(profile, model, action, show) {
        var bProfileChanged;
        var bRenderModelSelect;
        var bRemoveModelSelect;
        var bModelChanged;
        var bRenderActionSelect;
        var bRemoveActionSelect;
        var bActionChanged;
        var bRenderShowSelect;
        var bRemoveShowSelect;
        var bShowChanged;
        var bRenderStoredSelect;
        var bRemoveStoredSelect;

        var avail;
        const pc = app.getController().getProfileController();
        if (pc)
            avail = pc.getProfiles();
        if (avail) {
            if (profile) {
                if (this._profile != profile) {
                    this._profile = profile;
                    bProfileChanged = true;
                }
                if (!this._$modelSelect)
                    bRenderModelSelect = true;
            } else {
                if (this._profile) {
                    this._profile = null;
                    bProfileChanged = true;
                }
                bRemoveModelSelect = true;
            }
        } else {
            if (!this._$modelSelect)
                bRenderModelSelect = true;
        }

        if (model) {
            if (this._model != model) {
                this._model = model;
                bModelChanged = true;
            }
            if (!this._$actionSelect)
                bRenderActionSelect = true;
        } else {
            if (this._model) {
                this._model = null;
                bModelChanged = true;
            }
            bRemoveActionSelect = true;
        }

        if (action) {
            if (this._action != action) {
                this._action = action;
                bActionChanged = true;
            }
            if (!this._$showSelect && this._action === 'show')
                bRenderShowSelect = true;
        } else {
            if (this._action) {
                this._action = null;
                bActionChanged = true;
            }
            bRemoveShowSelect = true;
        }

        if (show) {
            if (this._show != show) {
                this._show = show;
                bShowChanged = true;
            }
            if (!this._$storedSelect && this._show === 'state')
                bRenderStoredSelect = true;
        } else {
            if (this._show) {
                this._show = null;
                bShowChanged = true;
            }
            bRemoveStoredSelect = true;
        }


        if (avail)
            this._renderProfileSelect(profile);

        // model-menu
        if (bProfileChanged || bRemoveModelSelect) {
            if (this._$modelSelect) {
                this._modelMenu = null;
                this._$modelSelect.remove();
                this._$modelSelect = null;
            }
            if (profile)
                bRenderModelSelect = true;
        }
        if (!bRemoveModelSelect && (bModelChanged || bRenderModelSelect))
            this._renderModelSelect(model);

        // action-menu
        if (bModelChanged || bRemoveActionSelect) {
            if (this._$actionSelect) {
                this._actionMenu = null;
                this._$actionSelect.remove();
                this._$actionSelect = null;
            }
            if (model)
                bRenderActionSelect = true;
        }
        if (!bRemoveActionSelect && (bActionChanged || bRenderActionSelect))
            this._renderActionSelect(action);

        // show-menu
        if (bActionChanged || bRemoveShowSelect) {
            if (this._$showSelect) {
                this._showMenu = null;
                this._$showSelect.remove();
                this._$showSelect = null;
            }
            if (action)
                bRenderShowSelect = true;
        }
        if (!bRemoveShowSelect && (bShowChanged || bRenderShowSelect))
            this._renderShowSelect(show);

        // stored
        if (bShowChanged || bRemoveStoredSelect) {
            if (this._$storedSelect) {
                this._$storedSelect.remove();
                this._$storedSelect = null;
            }
            if (show)
                bRenderStoredSelect = true;
        }
        if (!bRemoveStoredSelect && bRenderStoredSelect)
            await this._renderStoredSelect();

        return Promise.resolve(this._$stateSelect);
    }

    _renderProfileSelect(profile) {
        if (!this._profileMenu) {
            this._profileMenu = this._createProfileMenu(profile);
            this._profileMenuVis = new MenuVis(this._profileMenu);
            this._$profileSelect = this._profileMenuVis.renderMenu();
            this._$stateSelect.append(this._$profileSelect);
        } else if (this._profileMenuVis)
            this._profileMenuVis.renderMenu();
    }

    _createProfileMenu(profile) {
        const menuItems = [];

        const controller = app.getController();
        const pc = controller.getProfileController();
        var avail;
        if (pc)
            avail = pc.getProfiles();
        if (avail) {
            avail = [...avail];
            var conf;
            var menuItem;
            avail.push({ 'name': 'other' })
            for (let prof of avail) {
                conf = {
                    'name': prof['name'],
                    'click': async function (event, item) {
                        event.preventDefault();
                        event.stopPropagation();
                        const name = item.getName(); // prof['name']
                        const menuItem = item.getMenuItem();
                        const menu = menuItem.getMenu();
                        if (item.isActive()) {
                            menu.setActiveItem();
                            //this._profile = null;
                            await this._updateStateSelect();
                        } else {
                            menu.setActiveItem(menuItem);
                            //this._profile = name;
                            await this._updateStateSelect(name);
                        }
                    }.bind(this)
                };
                menuItem = new MenuItem(conf);
                menuItem.setSubMenu(new Menu());
                if (profile && profile === prof['name'])
                    menuItem.setActive();
                menuItems.push(menuItem);
            }
        }
        const menu = new Menu({ 'class': ['float'] });
        menu.setItems(menuItems);
        return menu;
    }

    _renderModelSelect(model) {
        if (!this._modelMenu) {
            this._modelMenu = this._createModelMenu(model);
            this._modelMenuVis = new MenuVis(this._modelMenu);
            this._$modelSelect = this._modelMenuVis.renderMenu();
            this._$stateSelect.append(this._$modelSelect);
        } else if (this._modelMenuVis)
            this._modelMenuVis.renderMenu();
    }

    _createModelMenu(model) {
        const menuItems = [];

        var modelNames;
        const controller = app.getController();
        const pc = controller.getProfileController();
        if (pc && pc.getProfiles()) {
            if (this._profile === 'other') {
                var used = pc.getAllUsedModels();
                var models = controller.getModelController().getModels(controller.isInDebugMode());
                modelNames = models.map(function (model) {
                    return model.getDefinition()['name'];
                }).filter(function (x) { return !used.includes(x) });
                modelNames.sort((a, b) => a.localeCompare(b));
            } else
                modelNames = pc.getMenu(this._profile);
        } else {
            const models = controller.getModelController().getModels(controller.isInDebugMode());
            modelNames = models.map(function (model) {
                return model.getDefinition()['name'];
            });
            modelNames.sort((a, b) => a.localeCompare(b));
        }
        if (modelNames) {
            var conf;
            var menuItem;
            const mc = controller.getModelController();
            for (let modelName of modelNames) {
                if (!modelName) {
                    conf = {
                        'name': '-'
                    };
                    menuItem = new MenuItem(conf);
                } else if (mc.isModelDefined(modelName)) {
                    conf = {
                        'name': modelName,
                        'click': async function (event, item) {
                            event.preventDefault();
                            event.stopPropagation();
                            var name = item.getName(); // modelName
                            const menuItem = item.getMenuItem();
                            const menu = menuItem.getMenu();
                            if (item.isActive()) {
                                menu.setActiveItem();
                                //this._model = null;
                                await this._updateStateSelect(this._profile);
                            } else {
                                menu.setActiveItem(menuItem);
                                //this._model = name;
                                await this._updateStateSelect(this._profile, name);
                            }
                        }.bind(this)
                    };
                    menuItem = new MenuItem(conf);
                    menuItem.setSubMenu(new Menu());
                    if (model && model === modelName)
                        menuItem.setActive();
                } else {
                    conf = {
                        'name': modelName
                    };
                    var rc = controller.getRouteController();
                    let path = '/' + modelName;
                    var res = rc.getMatchingRoute(path);
                    if (res) {
                        var route = res['route'];
                        if (route && route['fn']) {
                            conf['click'] = function (event, item) {
                                var state = new State();
                                state['customRoute'] = path;
                                controller.loadState(state, true);
                            }.bind(this);
                        }
                    }
                    menuItem = new MenuItem(conf);
                    if (model && model === modelName)
                        menuItem.setActive();
                }
                menuItems.push(menuItem);
            }
        }

        const menu = new Menu({ 'class': ['float'] });
        menu.setItems(menuItems);
        return menu;
    }

    _renderActionSelect(action) {
        if (!this._actionMenu) {
            this._actionMenu = this._createActionMenu(action);
            this._actionMenuVis = new MenuVis(this._actionMenu);
            this._$actionSelect = this._actionMenuVis.renderMenu();
            this._$stateSelect.append(this._$actionSelect);
        } else if (this._actionMenuVis)
            this._actionMenuVis.renderMenu();
    }

    _createActionMenu(action) {
        const menuItems = [];

        var conf = {
            'name': 'Show',
            'click': async function (event, item) {
                event.preventDefault();
                event.stopPropagation();
                const menuItem = item.getMenuItem();
                const menu = menuItem.getMenu();
                if (item.isActive()) {
                    menu.setActiveItem();
                    await this._updateStateSelect(this._profile, this._model);
                } else {
                    menu.setActiveItem(menuItem);
                    await this._updateStateSelect(this._profile, this._model, 'show');
                }
            }.bind(this)
        };
        var menuItem = new MenuItem(conf);
        menuItem.setSubMenu(new Menu());
        if (action && action === 'show')
            menuItem.setActive();
        menuItems.push(menuItem);

        conf = {
            'name': 'Create',
            'click': function (event, item) {
                event.preventDefault();
                event.stopPropagation();

                const controller = app.getController();
                //controller.getView().getSideNavigationBar().close();

                const state = new State();
                state.typeString = this._model;
                state.action = ActionEnum.create;
                controller.loadState(state, true);
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        menuItems.push(menuItem);

        const menu = new Menu({ 'class': ['float'] });
        menu.setItems(menuItems);
        return menu;
    }

    _renderShowSelect(show) {
        if (!this._showMenu) {
            this._showMenu = this._createShowMenu(show);
            this._showMenuVis = new MenuVis(this._showMenu);
            this._$showSelect = this._showMenuVis.renderMenu();
            this._$stateSelect.append(this._$showSelect);
        } else if (this._showMenuVis)
            this._showMenuVis.renderMenu();
    }

    _createShowMenu(show) {
        const menuItems = [];

        var conf = {
            'name': 'State',
            'click': async function (event, item) {
                event.preventDefault();
                event.stopPropagation();
                const menuItem = item.getMenuItem();
                const menu = menuItem.getMenu();
                if (item.isActive()) {
                    menu.setActiveItem();
                    await this._updateStateSelect(this._profile, this._model, this._action);
                } else {
                    menu.setActiveItem(menuItem);
                    await this._updateStateSelect(this._profile, this._model, this._action, 'state');
                }
                return Promise.resolve();
            }.bind(this)
        };
        var menuItem = new MenuItem(conf);
        menuItem.setSubMenu(new Menu());
        if (show && show === 'state')
            menuItem.setActive();
        menuItems.push(menuItem);

        conf = {
            'name': 'All',
            'click': async function (event, item) {
                var state = new State();
                state.typeString = this._model;
                return app.getController().loadState(state, true);
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        menuItems.push(menuItem);

        if (this._model) {
            const model = app.getController().getModelController().getModel(this._model);
            if (model) {
                const entries = model.getSideMenuEntries();
                if (entries.length > 0) {
                    var menuItem;
                    for (var conf of entries) {
                        menuItem = new MenuItem(conf);
                        if (conf['panel'])
                            menuItem.setSubMenu(new Menu());
                        menuItems.push(menuItem);
                    }
                }
            }
        }

        const menu = new Menu({ 'class': ['float'] });
        menu.setItems(menuItems);
        return menu;
    }

    async _renderStoredSelect() {
        const panel = new SelectStatePanel(this._model);
        const $d = await panel.render();
        $d.css({
            'float': 'left',
            'height': '100%',
            'overflow-y': 'auto'
        });
        this._$storedSelect = $d;
        this._$stateSelect.append(this._$storedSelect);
        return Promise.resolve();
    }
}