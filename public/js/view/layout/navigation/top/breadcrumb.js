class Breadcrumb {

    _$breadcrumb;

    constructor() {
    }

    initBreadcrumb() {
        this._$breadcrumb = $('<div/>')
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
            this._renderModelIconBar();

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


            this._renderFilterIconBar();
        }
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

    _renderModelIconBar() {
        var state = app.controller.getStateController().getState();
        if (!state.action || state.action == ActionEnum.read) {
            var $div = $('<div/>')
                .css({
                    'display': 'inline-block',
                    'vertical-align': 'top'
                });

            var conf = {
                'icon': new Icon('plus'),
                'root': true,
                'click': async function (event, icon) {
                    var state = new State();
                    state.typeString = app.controller.getStateController().getState().typeString;
                    state.action = ActionEnum.create;
                    return app.getController().loadState(state, true);
                }.bind(this)
            };
            var $d = new MenuItemVis(new MenuItem(conf)).renderMenuItem();
            $d.css({ 'margin': '0 1 0 1' });
            $div.append($d);

            this._$breadcrumb.append($div);
        }
    }

    _renderFilterIconBar() {
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
                var state = app.controller.getStateController().getState();
                delete state.name;
                delete state.id;
                app.controller.loadState(state, true);
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
}