class SideNavigationBar {

    _$sideNav;

    _topIconBar;
    _$topIconBar;
    _topIconBarExtensions;

    _bottomIconBar;
    _$bottomIconBar;
    _bottomIconBarExtensions;

    _confMenuItem;

    _sidePanel;
    _$sidePanel;

    constructor() {
        this._$sideNav = $('div#sidenav');

        this._topIconBarExtensions = [];
        this._bottomIconBarExtensions = [];

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
            var controller = app.getController();
            var modalController = controller.getModalController();
            if (modalController && !modalController.isModalOpen()) {
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

        const controller = app.getController();
        var bNotification = false;
        if (controller.hasConnection()) {
            const info = controller.getApiController().getApiInfo();
            if (info) {
                if (info['state'] !== 'running') // openReloadRequest, ...
                    bNotification = true;
            } else
                bNotification = true;
            const vc = controller.getVersionController();
            if (vc) {
                if (!vc.isCompatible())
                    bNotification = true;
            } else
                bNotification = true;
            const ec = controller.getExtensionController();
            const extensions = ec.getExtensionsInfo();
            if (extensions && Object.keys(extensions).length > 0) {
                for (var name in extensions) {
                    if (!extensions[name]['version']) {
                        bNotification = true;
                        break;
                    }
                }
            }
        } else
            bNotification = true;

        if (bNotification)
            this._confMenuItem.addNotification('!');

        this.close();
    }

    _initTopIconBar() {
        this._topIconBar.clearMenu();

        var controller = app.getController();
        if (controller.hasConnection()) {
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

            if (controller.isInDebugMode()) {
                conf = {
                    'style': 'iconbar',
                    'icon': "redo",
                    'tooltip': "Reload",
                    'click': async function (event, icon) {
                        this.close();
                        if (event.ctrlKey)
                            await controller.getDataService().getCache().deleteModelCache();
                        return controller.reloadState(event.ctrlKey);
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

                        return controller.getModalController().openPanelInModal(new NavigationPanel());
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
                    this.close();
                    if (activeIcon != icon) {
                        this._topIconBar.activateItem(icon);
                        await this._sidePanel.showModelSelect();
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
                    this.close();
                    if (activeIcon != icon) {
                        this._topIconBar.activateItem(icon);
                        await this._sidePanel.showStateSelect();
                    }
                }.bind(this)
            };
            menuItem = new MenuItem(conf);
            this._topIconBar.addMenuItem(menuItem);

            if (controller.isInDebugMode() && controller.getConfigController().experimentalFeaturesEnabled()) {
                conf = {
                    'style': 'iconbar',
                    'icon': "bookmark",
                    'tooltip': "Bookmarks",
                    'click': async function (event, icon) {
                        this.close();

                        var config = { 'minWidth': '1000px' };
                        return app.getController().getModalController().openPanelInModal(new ManageBookmarkPanel(config));
                    }.bind(this)
                };
                menuItem = new MenuItem(conf);
                this._topIconBar.addMenuItem(menuItem);
            }

            if (this._topIconBarExtensions && this._topIconBarExtensions.length > 0) {
                for (var ext of this._topIconBarExtensions) {
                    conf = ext();
                    if (conf) {
                        menuItem = new MenuItem(conf);
                        this._topIconBar.addMenuItem(menuItem);
                    }
                }
            }
        }
    }

    _initBottomIconBar() {
        this._bottomIconBar.clearMenu();

        var conf;
        var menuItem;
        if (this._bottomIconBarExtensions && this._bottomIconBarExtensions.length > 0) {
            for (var ext of this._bottomIconBarExtensions) {
                conf = ext();
                if (conf) {
                    menuItem = new MenuItem(conf);
                    this._bottomIconBar.addMenuItem(menuItem);
                }
            }
        }

        const controller = app.getController();
        if (controller && controller.hasConnection()) {
            var apiController = controller.getApiController();
            if (apiController && apiController.isAdministrator()) {
                conf = {
                    'style': 'iconbar',
                    'icon': "puzzle-piece",
                    'tooltip': "Extensions",
                    'click': async function (event, icon) {
                        var activeIcon = this._bottomIconBar.getActiveItem();
                        this.close();
                        if (activeIcon != icon) {
                            this._bottomIconBar.activateItem(icon);
                            await this._sidePanel.showExtensionSelect();
                        }
                    }.bind(this)
                };
                menuItem = new MenuItem(conf);
                this._bottomIconBar.addMenuItem(menuItem);
            }

            if (controller.isInDebugMode()) {
                if (controller.getDataService()) {
                    conf = {
                        'style': 'iconbar',
                        'icon': "clipboard",
                        'tooltip': "Cache",
                        'click': async function (event, icon) {
                            this.close();

                            var config = { 'minWidth': '400px' };
                            return app.getController().getModalController().openPanelInModal(new CachePanel(config));
                        }.bind(this)
                    };
                    menuItem = new MenuItem(conf);
                    this._bottomIconBar.addMenuItem(menuItem);
                }

                if (controller.getRouteController()) {
                    conf = {
                        'style': 'iconbar',
                        'icon': "map",
                        'tooltip': "Sitemap",
                        'click': async function (event, icon) {
                            this.close();

                            return app.getController().getModalController().openPanelInModal(new ManageRoutesPanel());
                        }.bind(this)
                    };
                    menuItem = new MenuItem(conf);
                    this._bottomIconBar.addMenuItem(menuItem);
                }
            }
        }

        conf = {
            'style': 'iconbar',
            'icon': "cog",
            'tooltip': "Configuration",
            'click': async function (event, icon) {
                this.close();

                return app.getController().getModalController().openPanelInModal(new ConfigPanel());
            }.bind(this)
        };
        this._confMenuItem = new MenuItem(conf);
        this._bottomIconBar.addMenuItem(this._confMenuItem);
    }

    close() {
        this._topIconBar.activateItem();
        this._bottomIconBar.activateItem();
        this._sidePanel.hideSidePanel();
    }

    addIconBarItem(ext, bTop = true) {
        if (bTop)
            this._topIconBarExtensions.push(ext);
        else
            this._bottomIconBarExtensions.push(ext);
    }
}