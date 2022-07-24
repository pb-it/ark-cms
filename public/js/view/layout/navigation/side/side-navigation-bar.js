class SideNavigationBar {

    _$sideNav;
    _$iconBar;

    _iconBar;
    _sidePanel;

    constructor() {
        this._$sideNav = $('div#sidenav');

        this._iconBar = new Menu();
        this._$iconBar = this._iconBar.renderMenu();
        this._$iconBar.addClass('iconbar');
        this._$sideNav.append(this._$iconBar);

        this._sidePanel = new SidePanel();
        this._$sideNav.append(this._sidePanel.renderSidePanel());

        window.addEventListener('click', function (event) {
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
        }.bind(this));
    }

    renderSideNavigationBar() {
        this._initIconBar();
        this._iconBar.renderMenu();
        this.close();
    }

    _initIconBar() {
        this._iconBar.clearMenu();

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
        this._iconBar.addMenuItem(menuItem, true);

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
            this._iconBar.addMenuItem(menuItem);

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
            this._iconBar.addMenuItem(menuItem);

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
            this._iconBar.addMenuItem(menuItem);
        }

        conf = {
            'style': 'iconbar',
            'icon': "cog",
            'tooltip': "Configuration",
            'click': async function (event, icon) {
                this.close();

                return app.controller.getModalController().openPanelInModal(new ConfigPanel());
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        this._iconBar.addMenuItem(menuItem);

        conf = {
            'style': 'iconbar',
            'icon': "cube",
            'tooltip': "Models",
            'click': async function (event, icon) {
                var activeIcon = this._iconBar.getActiveItem();
                if (activeIcon != icon) {
                    this._iconBar.activateItem(icon);
                    await this._sidePanel.showModelSelect();
                } else {
                    this.close();
                }
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        this._iconBar.addMenuItem(menuItem);

        conf = {
            'style': 'iconbar',
            'icon': "database",
            'tooltip': "Data",
            'click': async function (event, icon) {
                //event.preventDefault();
                //event.stopPropagation();
                var activeIcon = this._iconBar.getActiveItem();
                if (activeIcon != icon) {
                    this._iconBar.activateItem(icon);
                    await this._sidePanel.showStateSelect();
                } else {
                    this.close();
                }
            }.bind(this)
        };
        menuItem = new MenuItem(conf);
        this._iconBar.addMenuItem(menuItem);

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
            this._iconBar.addMenuItem(menuItem);
        }
    }

    close() {
        this._iconBar.activateItem();
        this._sidePanel.hideSidePanel();
    }
}