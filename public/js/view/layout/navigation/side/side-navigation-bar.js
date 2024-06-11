class SideNavigationBar {

    _$sideNav;

    _topIconBar;
    _topIconBarVis;
    _$topIconBar;
    _topIconBarExtensions;

    _bottomIconBar;
    _bottomIconBarVis;
    _$bottomIconBar;
    _bottomIconBarExtensions;

    _confMenuItem;

    _sidePanel;
    _$sidePanel;

    constructor() {
        this._$sideNav = $('div#sidenav');

        this._topIconBarExtensions = [];
        this._bottomIconBarExtensions = [];

        this._sidePanel = new SidePanel();

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
        if (this._$sidePanel)
            this._$sidePanel.detach();
        this._$sideNav.empty();

        this._initTopIconBar();
        this._initBottomIconBar();

        this._checkNotification();

        if (!this._$sidePanel) {
            this._sidePanel.initSidePanel();
            this._$sidePanel = this._sidePanel.renderSidePanel();
        }
        this._$sideNav.append(this._$sidePanel);

        this.close();
    }

    _checkNotification() {
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

        if (bNotification) {
            this._confMenuItem.setNotification('!');
            this.updateSideNavigationBar();
        }
    }

    _initTopIconBar() {
        const menuItems = [];

        const controller = app.getController();
        if (controller.hasConnection()) {
            var conf = {
                'style': 'iconbar',
                'icon': new Icon('home'),
                'tooltip': 'Home',
                'click': function (event, icon) {
                    event.preventDefault();
                    event.stopPropagation();

                    this.close();

                    controller.loadState(new State(), true);
                }.bind(this)
            };
            var menuItem = new MenuItem(conf);
            menuItem.setActive();
            menuItems.push(menuItem);

            if (controller.isInDebugMode()) {
                conf = {
                    'style': 'iconbar',
                    'icon': new Icon('redo'),
                    'tooltip': 'Reload',
                    'click': async function (event, icon) {
                        event.preventDefault();
                        event.stopPropagation();

                        this.close();

                        if (event.ctrlKey)
                            await controller.getDataService().getCache().deleteModelCache();
                        return controller.reloadState(event.ctrlKey);
                    }.bind(this)
                };
                menuItem = new MenuItem(conf);
                menuItems.push(menuItem);

                conf = {
                    'style': 'iconbar',
                    'icon': new Icon('compass'),
                    'tooltip': 'Navigate',
                    'click': async function (event, icon) {
                        event.preventDefault();
                        event.stopPropagation();

                        this.close();

                        return controller.getModalController().openPanelInModal(new NavigationPanel());
                    }.bind(this)
                };
                menuItem = new MenuItem(conf);
                menuItems.push(menuItem);
            }

            conf = {
                'style': 'iconbar',
                'icon': new Icon('pen-ruler'),
                'tooltip': 'Models',
                'click': async function (event, icon) {
                    event.preventDefault();
                    event.stopPropagation();

                    const activeIcon = this._topIconBar.getActiveItem();
                    this.close();

                    const item = icon.getMenuItem();
                    if (activeIcon != item) {
                        this._topIconBar.setActiveItem(item);
                        this.updateSideNavigationBar();
                        await this._sidePanel.showModelSelect();
                    }
                    return Promise.resolve();
                }.bind(this)
            };
            menuItem = new MenuItem(conf);
            menuItems.push(menuItem);

            conf = {
                'style': 'iconbar',
                'icon': new Icon('database'),
                'tooltip': 'Data',
                'click': async function (event, icon) {
                    event.preventDefault();
                    event.stopPropagation();

                    const activeIcon = this._topIconBar.getActiveItem();
                    this.close();

                    const item = icon.getMenuItem();
                    if (activeIcon != item) {
                        this._topIconBar.setActiveItem(item);
                        this.updateSideNavigationBar();
                        await this._sidePanel.showStateSelect();
                    }
                    return Promise.resolve();
                }.bind(this)
            };
            menuItem = new MenuItem(conf);
            menuItems.push(menuItem);

            if (controller.isInDebugMode() && controller.getConfigController().experimentalFeaturesEnabled()) {
                conf = {
                    'style': 'iconbar',
                    'icon': new Icon('bookmark'),
                    'tooltip': 'Bookmarks',
                    'click': async function (event, icon) {
                        event.preventDefault();
                        event.stopPropagation();

                        this.close();

                        var config = { 'minWidth': '1000px' };
                        return app.getController().getModalController().openPanelInModal(new ManageBookmarkPanel(config));
                    }.bind(this)
                };
                menuItem = new MenuItem(conf);
                menuItems.push(menuItem);
            }

            if (this._topIconBarExtensions && this._topIconBarExtensions.length > 0) {
                for (var ext of this._topIconBarExtensions) {
                    if (typeof ext.func === 'function') {
                        conf = ext.func();
                        if (conf) {
                            menuItem = new MenuItem(conf);
                            menuItems.push(menuItem);
                        }
                    }
                }
            }
        }
        this._topIconBar = new Menu();
        this._topIconBar.setItems(menuItems);
        this._topIconBarVis = new MenuVis(this._topIconBar);
        this._$topIconBar = this._topIconBarVis.renderMenu();
        this._$topIconBar.addClass('iconbar');
        this._$sideNav.append(this._$topIconBar);
    }

    _initBottomIconBar() {
        const menuItems = [];

        var conf;
        var menuItem;
        if (this._bottomIconBarExtensions && this._bottomIconBarExtensions.length > 0) {
            for (var ext of this._bottomIconBarExtensions) {
                if (typeof ext.func === 'function') {
                    conf = ext.func();
                    if (conf) {
                        menuItem = new MenuItem(conf);
                        menuItems.push(menuItem);
                    }
                }
            }
        }

        const controller = app.getController();
        if (controller && controller.hasConnection()) {
            const authController = controller.getAuthController();
            if (authController && authController.isAdministrator()) {
                conf = {
                    'style': 'iconbar',
                    'icon': new Icon('puzzle-piece'),
                    'tooltip': 'Extensions',
                    'click': async function (event, icon) {
                        event.preventDefault();
                        event.stopPropagation();

                        const activeIcon = this._bottomIconBar.getActiveItem();
                        this.close();

                        const item = icon.getMenuItem();
                        if (activeIcon != item) {
                            this._bottomIconBar.setActiveItem(item);
                            this.updateSideNavigationBar();
                            await this._sidePanel.showExtensionSelect();
                        }
                        return Promise.resolve();
                    }.bind(this)
                };
                menuItem = new MenuItem(conf);
                menuItems.push(menuItem);
            }

            if (controller.isInDebugMode()) {
                if (controller.getDataService()) {
                    conf = {
                        'style': 'iconbar',
                        'icon': new Icon('clipboard'),
                        'tooltip': 'Cache',
                        'click': async function (event, icon) {
                            event.preventDefault();
                            event.stopPropagation();

                            this.close();

                            var config = { 'minWidth': '400px' };
                            return app.getController().getModalController().openPanelInModal(new CachePanel(config));
                        }.bind(this)
                    };
                    menuItem = new MenuItem(conf);
                    menuItems.push(menuItem);
                }

                if (controller.getRouteController()) {
                    conf = {
                        'style': 'iconbar',
                        'icon': new Icon('map'),
                        'tooltip': 'Sitemap',
                        'click': async function (event, icon) {
                            event.preventDefault();
                            event.stopPropagation();

                            this.close();

                            return app.getController().getModalController().openPanelInModal(new ManageRoutesPanel());
                        }.bind(this)
                    };
                    menuItem = new MenuItem(conf);
                    menuItems.push(menuItem);
                }
            }
        }

        conf = {
            'style': 'iconbar',
            'icon': new Icon('cog'),
            'tooltip': 'Configuration',
            'click': async function (event, icon) {
                event.preventDefault();
                event.stopPropagation();

                this.close();

                return app.getController().getModalController().openPanelInModal(new ConfigPanel());
            }.bind(this)
        };
        this._confMenuItem = new MenuItem(conf);
        menuItems.push(this._confMenuItem);

        this._bottomIconBar = new Menu();
        this._bottomIconBar.setItems(menuItems);
        this._bottomIconBarVis = new MenuVis(this._bottomIconBar);
        this._$bottomIconBar = this._bottomIconBarVis.renderMenu();
        this._$bottomIconBar.addClass('iconbar');
        this._$bottomIconBar.css({ 'position': 'absolute', 'bottom': 0, 'left': 0 });
        this._$sideNav.append(this._$bottomIconBar);
    }

    updateSideNavigationBar() {
        this._topIconBarVis.renderMenu();
        this._bottomIconBarVis.renderMenu();
    }

    close() {
        this._topIconBar.setActiveItem();
        this._bottomIconBar.setActiveItem();
        this.updateSideNavigationBar();
        this._sidePanel.hideSidePanel();
    }

    addIconBarItem(ext, bTop = true) {
        if (bTop) {
            if (ext['name'])
                this._topIconBarExtensions = this._topIconBarExtensions.filter(function (x) {
                    return x['name'] !== ext['name'];
                });
            this._topIconBarExtensions.push(ext);
        } else {
            if (ext['name'])
                this._bottomIconBarExtensions = this._bottomIconBarExtensions.filter(function (x) {
                    return x['name'] !== ext['name'];
                });
            this._bottomIconBarExtensions.push(ext);
        }
    }
}