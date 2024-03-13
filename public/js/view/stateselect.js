class StateSelect {

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
        $(window).on("changed.model", function (event, data) {
            if (this._$stateSelect) {
                //this._$stateSelect.empty();
                if (this._$modelSelect) {
                    this._$modelSelect.remove();
                    this._$modelSelect = null;
                }
                if (this._$actionSelect) {
                    this._$actionSelect.remove();
                    this._$actionSelect = null;
                }
                if (this._$showSelect) {
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
            var pc = app.controller.getProfileController();
            if (pc)
                await this._updateStateSelect(pc.getCurrentProfileName());
        }
        return Promise.resolve(this._$stateSelect);
    }

    async _updateStateSelect(profile, model, action, show) {
        var avail;
        const pc = app.controller.getProfileController();
        if (pc)
            avail = pc.getProfiles();
        if (avail) {
            this._renderProfileSelect(profile);

            if (!profile) {
                if (this._profile)
                    this._profile = null;
                if (this._$modelSelect) {
                    this._$modelSelect.remove();
                    this._$modelSelect = null;
                }
            } else {
                if (this._profile != profile) {
                    this._profile = profile;
                    if (this._$modelSelect) {
                        this._$modelSelect.remove();
                        this._$modelSelect = null;
                    }
                }
                if (!this._$modelSelect)
                    this._renderModelSelect(model);
            }
        } else {
            if (!this._$modelSelect)
                this._renderModelSelect(model);
        }

        if (!model) {
            if (this._model)
                this._model = null;
            if (this._$actionSelect) {
                this._$actionSelect.remove();
                this._$actionSelect = null;
            }
        } else {
            if (this._model != model) {
                this._model = model;
                if (this._$actionSelect) {
                    this._$actionSelect.remove();
                    this._$actionSelect = null;
                }
            }
            if (!this._$actionSelect)
                this._renderActionSelect(action);
        }

        if (!action) {
            if (this._action)
                this._action = null;
            if (this._$showSelect) {
                this._$showSelect.remove();
                this._$showSelect = null;
            }
        } else {
            if (this._action != action) {
                this._action = action;
                if (this._$showSelect) {
                    this._$showSelect.remove();
                    this._$showSelect = null;
                }
            }
            if (!this._$showSelect && this._action === 'show')
                this._renderShowSelect(show);
        }

        if (!show) {
            if (this._show)
                this._show = null;
            if (this._$storedSelect) {
                this._$storedSelect.remove();
                this._$storedSelect = null;
            }
        } else {
            if (this._show != show) {
                this._show = show;
                if (this._$storedSelect) {
                    this._$storedSelect.remove();
                    this._$storedSelect = null;
                }
            }
            if (!this._$storedSelect && this._show === 'state')
                await this._renderStoredSelect();
        }

        return Promise.resolve(this._$stateSelect);
    }

    _renderProfileSelect(profile) {
        if (!this._$profileSelect) {
            var group = new SubMenuGroup();

            var pc = app.controller.getProfileController();
            var avail = pc.getProfiles();
            if (avail) {
                avail = [...avail];
                var conf;
                var menuItem;
                var dummyGroup = new SubMenuGroup();
                avail.push({ 'name': 'other' })
                for (let prof of avail) {
                    conf = {
                        'name': prof.name,
                        'click': async function (event, item) {
                            var p;
                            if (item.isActive()) {
                                group.activateItem();
                                await this._updateStateSelect();
                            } else {
                                group.activateItem(item);
                                p = prof.name;
                                await this._updateStateSelect(p);
                            }
                            pc.setCurrentProfileName(p);
                        }.bind(this)
                    };
                    menuItem = new MenuItem(conf);
                    menuItem.addSubMenuGroup(dummyGroup);
                    if (profile && profile === prof.name)
                        menuItem.setActive();
                    group.addMenuItem(menuItem);
                }
            }
            group.showSubMenuGroup();
            this._$profileSelect = group.renderMenu();
            this._$stateSelect.append(this._$profileSelect);
        }
    }

    _renderModelSelect(model) {
        var group = new SubMenuGroup();

        var modelNames;
        var pc = app.controller.getProfileController();
        if (pc.getProfiles()) {
            if (this._profile === 'other') {
                var used = pc.getAllUsedModels();
                var models = app.controller.getModelController().getModels(app.controller.isInDebugMode());
                modelNames = models.map(function (model) {
                    return model.getDefinition()['name'];
                }).filter(function (x) { return !used.includes(x) });
                modelNames.sort((a, b) => a.localeCompare(b));
            } else
                modelNames = pc.getMenu(this._profile);
        } else {
            var models = app.controller.getModelController().getModels(app.controller.isInDebugMode());
            modelNames = models.map(function (model) {
                return model.getDefinition()['name'];
            });
            modelNames.sort((a, b) => a.localeCompare(b));
        }
        if (modelNames) {
            var conf;
            var menuItem;
            var dummyGroup = new SubMenuGroup();
            var mc = app.controller.getModelController();
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
                            if (item.isActive()) {
                                group.activateItem();
                                await this._updateStateSelect(this._profile);
                            } else {
                                group.activateItem(item);
                                await this._updateStateSelect(this._profile, item.getName());
                            }
                        }.bind(this)
                    };
                    menuItem = new MenuItem(conf);
                    menuItem.addSubMenuGroup(dummyGroup);
                    if (model && model === modelName)
                        menuItem.setActive();
                } else {
                    conf = {
                        'name': modelName
                    };
                    var controller = app.getController();
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
                group.addMenuItem(menuItem);
            }
        }

        group.showSubMenuGroup();
        this._$modelSelect = group.renderMenu();
        this._$stateSelect.append(this._$modelSelect);
    }

    _renderActionSelect(action) {
        var group = new SubMenuGroup();

        var conf;
        var menuItem;
        var dummyGroup = new SubMenuGroup();

        conf = {
            'name': 'Show',
            'click': async function (event, item) {
                if (item.isActive()) {
                    group.activateItem();
                    await this._updateStateSelect(this._profile, this._model);
                } else {
                    group.activateItem(item);
                    await this._updateStateSelect(this._profile, this._model, 'show');
                }
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        menuItem.addSubMenuGroup(dummyGroup);
        if (action && action === 'show')
            menuItem.setActive();
        group.addMenuItem(menuItem);

        conf = {
            'name': 'Create',
            'click': function (event, item) {
                var state = new State();
                state.typeString = this._model;
                state.action = ActionEnum.create;
                app.controller.loadState(state, true);
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        group.addMenuItem(menuItem);

        group.showSubMenuGroup();
        this._$actionSelect = group.renderMenu();
        this._$stateSelect.append(this._$actionSelect);
    }

    _renderShowSelect(show) {
        var group = new SubMenuGroup();

        var conf;
        var menuItem;
        var dummyGroup = new SubMenuGroup();

        conf = {
            'name': 'State',
            'click': async function (event, item) {
                if (item.isActive()) {
                    group.activateItem();
                    await this._updateStateSelect(this._profile, this._model, this._action);
                } else {
                    group.activateItem(item);
                    await this._updateStateSelect(this._profile, this._model, this._action, 'state');
                }
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        menuItem.addSubMenuGroup(dummyGroup);
        if (show && show === 'state')
            menuItem.setActive();
        group.addMenuItem(menuItem);

        var model = app.getController().getModelController().getModel(this._model);
        if (model.hasOwnProperty('createDashboard')) {
            conf = {
                'name': 'Dashboard',
                'click': function (event, item) {
                    var state = new State();
                    //state.typeString = this._model;
                    state['customRoute'] = '/dashboard/' + this._model;
                    app.getController().loadState(state, true);
                }.bind(this)
            };
            menuItem = new MenuItem(conf);
            group.addMenuItem(menuItem);
        }

        conf = {
            'name': 'All',
            'click': async function (event, item) {
                var state = new State();
                state.typeString = this._model;
                return app.getController().loadState(state, true);
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        group.addMenuItem(menuItem);

        group.showSubMenuGroup();
        this._$showSelect = group.renderMenu();
        this._$stateSelect.append(this._$showSelect);
    }

    async _renderStoredSelect() {
        var panel = new SelectStatePanel(this._model);
        var $d = await panel.render();
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