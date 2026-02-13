class Breadcrumb {

    _breadcrumbExtensions;

    _$breadcrumb;

    constructor() {
        this._breadcrumbExtensions = [];
    }

    getBreadcrumbExtensions() {
        return this._breadcrumbExtensions;
    }

    initBreadcrumb() {
        this._$breadcrumb = $('<div/>')
            .addClass('breadcrumb')
            .css({ 'float': 'left' });

        return this._$breadcrumb;
    }

    renderBreadcrumb() {
        this._$breadcrumb.empty();

        var state;
        var stateName;
        var defaultSort;
        const controller = app.getController();
        const sc = controller.getStateController();
        if (sc) {
            state = sc.getState();
            if (state) {
                const typeString = state['typeString'];
                if (typeString) {
                    const mc = controller.getModelController();
                    if (mc.isModelDefined(typeString)) {
                        stateName = typeString;
                        if (state['name'] && !state['where'])
                            stateName += '(' + state['name'] + ')';

                        const model = mc.getModel(typeString);
                        defaultSort = model.getModelDefaultsController().getDefaultSort();
                    }
                }
            }
        }

        if (stateName) {
            this._renderModelMenu(stateName);
            this._renderAdd();
            this._renderState(state, defaultSort);
            this._renderIconBar();
        } else if (state['customRoute'] && state['customRoute'] === '/extensions') {
            this._renderAddExtension();
        } else if (state.funcState)
            this._renderState(state);

        this._renderExtensions();
    }

    _renderModelMenu(name) {
        var conf = {
            'icon': new Icon('map-marker'),
            'name': name,
            'root': true
        };
        const menuItem = new MenuItem(conf);

        const menuItems = [];

        const controller = app.getController();
        const state = controller.getStateController().getState();
        const view = controller.getView();
        const Panel = view.getCrudStatePanelClass();
        if (Panel) {

            if (state['name']) {
                conf = {
                    'icon': new Icon('edit'),
                    'name': 'Edit',
                    'click': async function (event) {
                        return controller.getModalController().openPanelInModal(new Panel(ActionEnum.update, state));
                    }
                };
                menuItems.push(new MenuItem(conf));
            }

            conf = {
                'icon': new Icon('save'),
                'name': 'Save',
                'click': async function (event) {
                    var copy = { ...state };
                    delete copy['name'];
                    return controller.getModalController().openPanelInModal(new Panel(ActionEnum.create, copy));
                }
            };
            menuItems.push(new MenuItem(conf));
        }

        const model = state.getModel();
        const entries = model.getTopMenuEntries();
        if (entries.length > 0) {
            for (var conf of entries) {
                menuItems.push(new MenuItem(conf));
            }
        }

        conf = {
            'icon': new Icon('remove'),
            'name': 'Remove',
            'click': function (event) {
                controller.loadState(new State(), true);
            }
        };
        menuItems.push(new MenuItem(conf));

        conf = {
            'direction': 'down',
            'alignment': 'left'
        }
        const subMenu = new Menu(conf);
        subMenu.setItems(menuItems);

        menuItem.setSubMenu(subMenu);

        const $div = new MenuItemVis(menuItem).renderMenuItem();
        $div.css({ 'margin': '0 1 0 0' });

        this._$breadcrumb.append($div);
    }

    _renderAdd() {
        const state = app.getController().getStateController().getState();
        if (!state.action || state.action == ActionEnum.read) {
            const $div = $('<div/>')
                .css({
                    'display': 'inline-block',
                    'vertical-align': 'top'
                });

            const conf = {
                'icon': new Icon('plus'),
                'tooltip': 'New',
                'root': true,
                'click': async function (event, icon) {
                    const state = new State();
                    state.typeString = app.getController().getStateController().getState().typeString;
                    state.action = ActionEnum.create;
                    return app.getController().loadState(state, true);
                }.bind(this)
            };
            const $d = new MenuItemVis(new MenuItem(conf)).renderMenuItem();
            $d.css({ 'margin': '0 1 0 1' });
            $div.append($d);

            this._$breadcrumb.append($div);
        }
    }

    _renderState(state, defaultSort) {
        if (state.id)
            this._renderId(state.id);
        if (state.where)
            this._renderWhere(state);
        if (state.sort && (!defaultSort || state.sort != defaultSort))
            this._renderSort(state.sort);
        if (state.limit)
            this._renderLimit(state.limit);
        if (state.filters && state.filters.length > 0)
            this._renderFilters(state.filters);
        if (state.funcState)
            this._renderFunction(state.funcState);
    }

    _renderId(id) {
        var text;
        if (Array.isArray(id)) {
            if (id.length > 10)
                text = 'id:' + id.slice(0, 9).join(',') + ',...';
            else
                text = 'id:' + id.join(',');
        } else if (isNaN(id)) {
            if (id.length < 70)
                text = 'id:' + id;
            else
                text = 'id:' + id.substring(0, 70) + '...';
        } else
            text = 'id:' + id;

        var $button = $('<button/>')
            .text(text)
            .css({ 'margin': '0 1 0 1' })
            .click(function (event) {
                event.stopPropagation();
                var state = app.getController().getStateController().getState();
                delete state.name;
                delete state.id;
                app.getController().loadState(state, true);
            });
        this._$breadcrumb.append($button);
    }

    _renderWhere(state) {
        var text;
        if (state['name'])
            text = state['name']
        else {
            if (state['where'].length < 70)
                text = 'where:' + state['where'];
            else
                text = 'where:' + state['where'].substring(0, 70) + '...';
        }
        const $button = $('<button/>')
            .text(text)
            .css({ 'margin': '0 1 0 1' })
            .click(function (event) {
                event.stopPropagation();
                const controller = app.getController();
                const state = controller.getStateController().getState();
                delete state.name;
                delete state.where;
                controller.loadState(state, true);
            });
        this._$breadcrumb.append($button);
    }

    _renderSort(sort) {
        const $button = $('<button/>')
            .text('sort:' + sort)
            .css({ 'margin': '0 1 0 1' })
            .click(function (event) {
                event.stopPropagation();
                const controller = app.getController();
                const state = controller.getStateController().getState();
                delete state.name;
                delete state.sort;
                controller.loadState(state, true);
            });
        this._$breadcrumb.append($button);
    }

    _renderLimit(limit) {
        const $button = $('<button/>')
            .text('limit:' + limit)
            .css({ 'margin': '0 1 0 1' })
            .click(function (event) {
                event.stopPropagation();
                const controller = app.getController();
                const state = controller.getStateController().getState();
                delete state.name;
                delete state.limit;
                controller.loadState(state, true);
            });
        this._$breadcrumb.append($button);
    }

    _renderFilters(filters) {
        const controller = app.getController();
        var name;
        var conf;
        var menuItem;
        var menuItems;
        var subMenu;
        var $div;
        for (let filter of filters) {
            if (filter['name'])
                name = filter['name'];
            else
                name = "<undefined>::filter";

            conf = {
                'name': name,
                'root': true
            };
            menuItem = new MenuItem(conf);

            menuItems = [];

            const view = controller.getView();
            const Panel = view.getCreateFilterPanelClass();
            if (Panel) {
                conf = {
                    'icon': new Icon('edit'),
                    'name': 'Edit',
                    'click': async function (event) {
                        const controller = app.getController();
                        const model = controller.getStateController().getState().getModel();
                        const panel = new Panel(model, filter)
                        return controller.getModalController().openPanelInModal(panel);
                    }
                };
                menuItems.push(new MenuItem(conf));
            }

            conf = {
                'icon': new Icon('remove'),
                'name': 'Remove',
                'click': function (event) {
                    const controller = app.getController();
                    const state = controller.getStateController().getState();
                    delete state['name'];
                    state['filters'] = state['filters'].filter(function (x) { return x != filter; });
                    controller.loadState(state, true);
                }
            };
            menuItems.push(new MenuItem(conf));

            conf = {
                'direction': 'down',
                'alignment': 'left'
            }
            subMenu = new Menu(conf);
            subMenu.setItems(menuItems);

            menuItem.setSubMenu(subMenu);

            $div = new MenuItemVis(menuItem).renderMenuItem();
            $div.addClass('filter')
                .css({ 'margin': '0 1 0 1' });

            this._$breadcrumb.append($div);
        }
    }

    _renderFunction(func) {
        const $button = $('<button/>')
            .text('<undefined>::function')
            .css({ 'margin': '0 1 0 1' })
            .click(function (event) {
                event.stopPropagation();
                const controller = app.getController();
                const state = controller.getStateController().getState();
                delete state.name;
                delete state.funcState;
                controller.loadState(state, true);
            });
        this._$breadcrumb.append($button);
    }

    _renderIconBar() {
        const controller = app.getController();
        const state = controller.getStateController().getState();
        if (!state.action || state.action == ActionEnum.read || state.action == ActionEnum.update) {
            const $div = $('<div/>')
                .css({
                    'display': 'inline-block',
                    'vertical-align': 'top'
                });

            var conf;
            var $d;
            const view = controller.getView();
            const Panel = view.getSelectFilterPanelClass();
            if (Panel) {
                conf = {
                    'icon': new Icon('filter'),
                    'tooltip': 'Filter',
                    'root': true,
                    'click': async function (event, icon) {
                        var panel = new Panel(controller.getStateController().getState().typeString);
                        panel.setApplyAction(function (data) {
                            var filters = this.getSelected();
                            if (filters) {
                                var f;
                                if (state.filters)
                                    f = state.filters;
                                else
                                    f = [];
                                for (var filter of filters) {
                                    f.push(filter);
                                }
                                state.filters = f;
                            }
                            panel.dispose();
                            return controller.loadState(state, true);
                        }.bind(panel));
                        return controller.getModalController().openPanelInModal(panel);
                    }.bind(this)
                };
                $d = new MenuItemVis(new MenuItem(conf)).renderMenuItem();
                $d.css({ 'margin': '0 1 0 1' });
                $div.append($d);
            }

            conf = {
                'icon': new Icon('sort'),
                'tooltip': 'Sort',
                'root': true,
                'click': async function (event, icon) {
                    event.preventDefault();

                    return controller.getModalController().openPanelInModal(new EditSortPanel());
                }.bind(this)
            };
            $d = new MenuItemVis(new MenuItem(conf)).renderMenuItem();
            $d.css({ 'margin': '0 1 0 1' });
            $div.append($d);

            conf = {
                'icon': new Icon('th'),
                'tooltip': 'View',
                'root': true,
                'click': async function (event, icon) {
                    event.preventDefault();

                    var model = controller.getStateController().getState().getModel();
                    return controller.getModalController().openPanelInModal(new EditViewPanel(null, model));
                }.bind(this)
            };
            $d = new MenuItemVis(new MenuItem(conf)).renderMenuItem();
            $d.css({ 'margin': '0 1 0 1' });
            $div.append($d);

            this._$breadcrumb.append($div);
        }
    }

    _renderExtensions() {
        if (this._breadcrumbExtensions && this._breadcrumbExtensions.length > 0) {
            const $div = $('<div/>')
                .css({
                    'display': 'inline-block',
                    'vertical-align': 'top'
                });

            var conf;
            var $d;
            for (var ext of this._breadcrumbExtensions) {
                if (typeof ext.func === 'function') {
                    try {
                        conf = ext.func();
                        if (conf) {
                            $d = new MenuItemVis(new MenuItem(conf)).renderMenuItem();
                            $d.css({ 'margin': '0 1 0 1' });
                            $div.append($d);
                        }
                    } catch (error) {
                        app.getController().showError(error);
                    }
                }
            }

            this._$breadcrumb.append($div);
        }
    }

    _renderAddExtension() {
        const $div = $('<div/>')
            .css({
                'display': 'inline-block',
                'vertical-align': 'top'
            });

        const conf = {
            'icon': new Icon('plus'),
            'tooltip': 'Add',
            'root': true,
            'click': async function (event, icon) {
                const controller = app.getController();
                try {
                    await controller.getExtensionController().openExtensionUpload();
                } catch (error) {
                    controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this)
        };
        const $d = new MenuItemVis(new MenuItem(conf)).renderMenuItem();
        $d.css({ 'margin': '0 1 0 0' });
        $div.append($d);

        this._$breadcrumb.append($div);
    }
}