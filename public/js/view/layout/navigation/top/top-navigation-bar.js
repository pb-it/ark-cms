class TopNavigationBar {

    _$topNavigationBar;

    _breadcrumb;
    _$breadcrumb;

    _searchForm;
    _$searchForm;
    _$searchContainer;

    _rightIconBarExtensions;
    _rightMenuItems;
    _$menu;

    constructor() {
        this._$topNavigationBar = $('div#topnav');
        this._$topNavigationBar.empty();

        this._breadcrumb = new Breadcrumb();
        this._$breadcrumb = this._breadcrumb.initBreadcrumb();
        this._$topNavigationBar.append(this._$breadcrumb);

        this._rightIconBarExtensions = [];

        this._$menu = $('<div/>')
            .css({ 'float': 'right' });
        this._$topNavigationBar.append(this._$menu);

        this._searchForm = new SearchForm();
        this._$searchForm = this._searchForm.initSearchForm();

        this._$searchContainer = $('<div/>')
            .prop('id', 'searchContainer');
        //this._$searchContainer.css({ 'float': 'right' });

        this._$topNavigationBar.append(this._$searchContainer);
    }

    getBreadcrumb() {
        return this._breadcrumb;
    }

    getSearchForm() {
        return this._searchForm;
    }

    renderTopNavigationBar() {
        const controller = app.getController();
        if (controller && controller.hasConnection()) {
            const sc = controller.getStateController();
            if (sc) {
                this._breadcrumb.renderBreadcrumb();

                const state = sc.getState();
                if (state && state.getModel() && (!state['action'] || state['action'] === ActionEnum.read)) {
                    if (this._$searchContainer.children().length == 0)
                        this._$searchContainer.append(this._$searchForm);
                    this._searchForm.renderSearchForm();
                } else {
                    this._$searchForm.detach();
                    this._$searchContainer.empty();
                }
            }
        } else {
            this._$breadcrumb.empty();
            this._$searchContainer.empty();
        }

        this._$menu.empty();
        this._rightMenuItems = [];
        if (this._rightIconBarExtensions.length > 0) {
            var tmp;
            var menuItem;
            var menuItemVis;
            var $vis;
            for (var ext of this._rightIconBarExtensions) {
                if (typeof ext.func === 'function') {
                    try {
                        tmp = ext.func();
                        if (tmp) {
                            if (tmp instanceof MenuItem)
                                menuItem = tmp;
                            else
                                menuItem = new MenuItem(tmp);
                            menuItemVis = new MenuItemVis(menuItem);
                            $vis = menuItemVis.renderMenuItem();
                            $vis.css({
                                'display': 'inline-block'
                            });
                            this._$menu.append($vis);
                            this._rightMenuItems.push({ 'name': ext['name'], 'menu': menuItemVis });
                        }
                    } catch (error) {
                        controller.showError(error);
                    }
                }
            }
        }
        if (controller.getConfigController().experimentalFeaturesEnabled())
            this._renderNotifications();
        this._renderMenu();
    }

    addIconBarItem(ext) {
        if (ext['name'])
            this._rightIconBarExtensions = this._rightIconBarExtensions.filter(function (x) {
                return x['name'] !== ext['name'];
            });
        this._rightIconBarExtensions.push(ext);
    }

    getIconBarItem(name) {
        var item;
        if (name) {
            var tmp = this._rightMenuItems.filter(function (x) {
                return x['name'] === name;
            });
            if (tmp.length === 1)
                item = tmp[0];
        } else
            item = this._rightMenuItems;
        return item;
    }

    _renderNotifications() {
        var conf = {
            'icon': new Icon('bell'),
            'click': async function (event, item) {
                event.stopPropagation();
                alert('TODO');
                return Promise.resolve();
            }.bind(this)
        };
        const menuItem = new MenuItem(conf);
        const notifications = app.getController().getNotificationController().getNotifications();
        if (notifications && notifications.length > 0)
            menuItem.setNotification(notifications.length);
        const $vis = new MenuItemVis(menuItem).renderMenuItem()
        $vis.css({
            'display': 'inline-block'
        });
        this._$menu.append($vis);
    }

    _renderMenu() {
        var conf = {
            'icon': new Icon('bars'),
            'root': true
        };
        const rootMenuItem = new MenuItem(conf);

        const menuItems = [];

        const controller = app.getController();
        const authController = controller.getAuthController();
        if (authController) {
            const user = authController.getUser();
            if (user) {
                conf = {
                    'icon': new Icon('sign-out'),
                    'name': 'Sign out',
                    'click': async function (event, item) {
                        event.stopPropagation();
                        return app.getController().getAuthController().logout();
                    }.bind(this)
                };
                menuItems.push(new MenuItem(conf));

                conf = {
                    'icon': new Icon('user'),
                    'name': 'User'
                };
                menuItems.push(new MenuItem(conf));
            } else {
                conf = {
                    'icon': new Icon('sign-in'),
                    'name': 'Sign in',
                    'click': async function (event, item) {
                        //event.stopPropagation();
                        await authController.showLoginDialog();
                        return Promise.resolve();
                    }.bind(this)
                };
                menuItems.push(new MenuItem(conf));
            }
        }

        conf = {
            'icon': new Icon('globe'),
            'name': 'About',
            'click': async function (event, item) {
                const win = window.open('https://github.com/pb-it/ark-cms?tab=readme-ov-file#readme', '_blank');
                win.focus();
                return Promise.resolve();
            }.bind(this)
        };
        menuItems.push(new MenuItem(conf));

        conf = {
            'icon': new Icon('envelope'),
            'name': 'Contact'
        };
        menuItems.push(new MenuItem(conf));

        conf = {
            'icon': new Icon('info-circle'),
            'name': 'Info'
        };
        menuItems.push(new MenuItem(conf));

        conf = {
            'icon': new Icon('question-circle'),
            'name': 'Help',
            'click': async function (event, item) {
                const controller = app.getController();
                try {
                    const mc = controller.getModalController();
                    await mc.openPanelInModal(new HelpPanel());
                } catch (error) {
                    controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this)
        };
        menuItems.push(new MenuItem(conf));

        conf = {
            'icon': new Icon('comments'),
            'name': 'FAQ',
            'click': async function (event, item) {
                const win = window.open('https://github.com/pb-it/ark-cms/discussions/categories/q-a', '_blank');
                win.focus();
                return Promise.resolve();
            }.bind(this)
        };
        menuItems.push(new MenuItem(conf));

        conf = {
            'direction': 'down',
            'alignment': 'right'
        }
        const subMenu = new Menu(conf);
        subMenu.setItems(menuItems);

        rootMenuItem.setSubMenu(subMenu);

        this._$menu.append(new MenuItemVis(rootMenuItem).renderMenuItem());
    }
}