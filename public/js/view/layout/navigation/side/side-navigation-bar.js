class SideNavigationBar {

    _$sideNav;

    _topIconBar;
    _$topIconBar;

    _bottomIconBar;
    _$bottomIconBar;

    _confMenuItem;

    _sidePanel;
    _$sidePanel;

    constructor() {
        this._$sideNav = $('div#sidenav');

        this._topIconBar = new Menu();
        this._$topIconBar = this._topIconBar.renderMenu();
        this._$topIconBar.addClass('iconbar');
        this._$sideNav.append(this._$topIconBar);

        this._bottomIconBar = new Menu();
        this._$bottomIconBar = this._bottomIconBar.renderMenu();
        this._$bottomIconBar.addClass('iconbar');
        this._$bottomIconBar.css({ 'position': 'absolute', 'bottom': 0, 'left': 0 });
        this._$sideNav.append(this._$bottomIconBar);

        this._sidePanel = new SidePanel();
        this._$sidePanel = this._sidePanel.renderSidePanel();
        this._$sideNav.append(this._$sidePanel);

        window.addEventListener('click', function (event) {
            if (!app.controller.getModalController().isModalOpen()) {
                var node = $(event.target);
                var bInside = node.is(this._$sideNav);
                while (!bInside) {
                    node = $(node).parent();
                    if (node.length > 0)
                        bInside = node.is(this._$sideNav);
                    else
                        break;
                }
                if (!bInside) {
                    this.close();
                }
            }
        }.bind(this));
    }

    renderSideNavigationBar() {
        this._initTopIconBar();
        this._topIconBar.renderMenu();

        this._initBottomIconBar();
        this._bottomIconBar.renderMenu();

        var bError = false;
        if (app.controller.hasConnection()) {
            var ac = app.controller.getApiController();
            var info = ac.getApiInfo();
            var appVersion = app.controller.getVersionController().getAppVersion();
            if (appVersion !== info['version'])
                bError = true;
            else if (info['state'] !== 'running')
                bError = true;
        } else
            bError = true;

        if (bError)
            this._confMenuItem.addNotification('!');

        this.close();
    }

    _initTopIconBar() {
        this._topIconBar.clearMenu();

        if (app.controller.hasConnection()) {
            var conf = {
                'style': 'iconbar',
                'icon': "home",
                'tooltip': "Home",
                'click': function (event, icon) {
                    this.close();
                    app.controller.loadState(new State(), true);
                }.bind(this)
            };
            var menuItem = new MenuItem(conf);
            this._topIconBar.addMenuItem(menuItem, true);

            if (app.controller.isInDebugMode()) {
                conf = {
                    'style': 'iconbar',
                    'icon': "redo",
                    'tooltip': "Reload",
                    'click': function (event, icon) {
                        this.close();
                        var state = app.controller.getStateController().getState();
                        state.bIgnoreCache = true;
                        app.controller.loadState(state);
                    }.bind(this)
                };
                menuItem = new MenuItem(conf);
                this._topIconBar.addMenuItem(menuItem);

                conf = {
                    'style': 'iconbar',
                    'icon': "compass",
                    'tooltip': "Navigate",
                    'click': async function (event, icon) {
                        this.close();

                        return app.controller.getModalController().openPanelInModal(new NavigationPanel());
                    }.bind(this)
                };
                menuItem = new MenuItem(conf);
                this._topIconBar.addMenuItem(menuItem);

                conf = {
                    'style': 'iconbar',
                    'icon': "clipboard",
                    'tooltip': "Cache",
                    'click': async function (event, icon) {
                        this.close();

                        return app.controller.getModalController().openPanelInModal(new CachePanel());
                    }.bind(this)
                };
                menuItem = new MenuItem(conf);
                this._topIconBar.addMenuItem(menuItem);
            }

            conf = {
                'style': 'iconbar',
                'icon': "pen-ruler",
                'tooltip': "Models",
                'click': async function (event, icon) {
                    var activeIcon = this._topIconBar.getActiveItem();
                    if (activeIcon != icon) {
                        this._topIconBar.activateItem(icon);
                        await this._sidePanel.showModelSelect();
                    } else {
                        this.close();
                    }
                }.bind(this)
            };
            menuItem = new MenuItem(conf);
            this._topIconBar.addMenuItem(menuItem);

            conf = {
                'style': 'iconbar',
                'icon': "database",
                'tooltip': "Data",
                'click': async function (event, icon) {
                    //event.preventDefault();
                    //event.stopPropagation();
                    var activeIcon = this._topIconBar.getActiveItem();
                    if (activeIcon != icon) {
                        this._topIconBar.activateItem(icon);
                        await this._sidePanel.showStateSelect();
                    } else {
                        this.close();
                    }
                }.bind(this)
            };
            menuItem = new MenuItem(conf);
            this._topIconBar.addMenuItem(menuItem);

            if (app.controller.isInDebugMode()) {
                conf = {
                    'style': 'iconbar',
                    'icon': "bookmark",
                    'tooltip': "Bookmarks",
                    'click': async function (event, icon) {
                        this.close();

                        var config = { 'minWidth': '1000px' };
                        return app.controller.getModalController().openPanelInModal(new ManageBookmarkPanel(config));
                    }.bind(this)
                };
                menuItem = new MenuItem(conf);
                this._topIconBar.addMenuItem(menuItem);
            }
        }
    }

    _initBottomIconBar() {
        this._bottomIconBar.clearMenu();

        var conf = {
            'style': 'iconbar',
            'icon': "cog",
            'tooltip': "Configuration",
            'click': async function (event, icon) {
                this.close();

                return app.controller.getModalController().openPanelInModal(new ConfigPanel());
            }.bind(this)
        };
        this._confMenuItem = new MenuItem(conf);
        this._bottomIconBar.addMenuItem(this._confMenuItem);
    }

    close() {
        this._topIconBar.activateItem();
        this._sidePanel.hideSidePanel();
    }
}