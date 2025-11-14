class SideNavigationBar {

    _$sideNav;
    _$sideMenu;

    _topIconBar;
    _topIconBarVis;
    _$topIconBar;
    _topIconBarExtensions;

    _bottomIconBar;
    _bottomIconBarVis;
    _$bottomIconBar;
    _bottomIconBarExtensions;

    _cacheMenuItem;
    _confMenuItem;

    _sidePanel;
    _$sidePanel;

    _extensionSelect;
    _modelSelect;
    _stateSelect;

    constructor() {
        this._$sideNav = $('div#sidenav');

        this._topIconBarExtensions = [];
        this._bottomIconBarExtensions = [];

        this._sidePanel = new SidePanel();

        this._extensionSelect = new ExtensionSelect();
        this._modelSelect = new ModelSelect();
        this._stateSelect = new StateSelect();

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

    getTopIconBar() {
        return this._topIconBar;
    }

    getBottomIconBar() {
        return this._bottomIconBar;
    }

    getSidePanel() {
        return this._sidePanel;
    }

    getStateSelect() {
        return this._stateSelect;
    }

    renderSideNavigationBar() {
        if (this._$sidePanel)
            this._$sidePanel.detach();
        this._$sideNav.empty();

        this._$sideMenu = $('<div/>')
            .prop('id', 'sidemenu');
        this._$sideMenu.append(this._initTopIconBar());
        this._$sideMenu.append(this._initBottomIconBar());
        this._$sideNav.append(this._$sideMenu);

        this._checkNotification();

        if (!this._$sidePanel) {
            this._stateSelect.initStateSelect();
            this._$sidePanel = this._sidePanel.renderSidePanel();
        }
        this._$sideNav.append(this._$sidePanel);

        this.close();
    }

    _checkNotification() {
        const controller = app.getController();
        var bNotification = false;

        /*const notifications = controller.getNotificationController().getNotifications();
        if (notifications && notifications.length > 0)
            bNotification = true;*/
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
            this._confMenuItem.setNotification('!');

        if (controller._bOfflineMode) {
            bNotification = true;
            this._cacheMenuItem.setNotification('!');
        }

        if (bNotification)
            this.updateSideNavigationBar();
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
                        this._sidePanel.show(this._modelSelect.renderModelSelect());
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
                        const $content = await this._stateSelect.renderStateSelect();
                        $content.off('contextmenu');
                        $content.on('contextmenu', async function (event) {
                            event.preventDefault();
                            event.stopPropagation();

                            const controller = app.getController();
                            try {
                                controller.setLoadingState(true, false);
                                const entries = [];
                                const editEntry = new ContextMenuEntry('Edit', async function (event, target) {
                                    var data;
                                    var bExists;
                                    const controller = app.getController();
                                    var tmp = await controller.getDataService().fetchData('_registry', null, 'key=profiles');
                                    if (tmp) {
                                        if (tmp.length == 0)
                                            data = { 'key': 'profiles', 'value': '{"available":[]}' };
                                        else if (tmp.length == 1) {
                                            bExists = true;
                                            data = tmp[0];
                                        }
                                    }
                                    if (data) {
                                        const obj = new CrudObject('_registry', data);
                                        const model = obj.getModel();
                                        const mpcc = model.getModelPanelConfigController();
                                        const panelConfig = mpcc.getPanelConfig(ActionEnum.delete);
                                        /*panelConfig.crudCallback = async function (data) { // overwritten by modal
                                            $(window).trigger('changed.model');
                                            return Promise.resolve(true);
                                        }.bind(this);*/
                                        const panel = PanelController.createPanelForObject(obj, panelConfig);
                                        const modal = await panel.openInModal(bExists ? ActionEnum.update : ActionEnum.create);
                                        const $modal = modal.getModalDomElement();
                                        $modal.on("remove", async function () {
                                            await app.getController().getProfileController().init();
                                            $(window).trigger('changed.model');
                                            return Promise.resolve();
                                        });
                                    }
                                    return Promise.resolve();
                                });
                                editEntry.setIcon(new Icon('pen-to-square'));
                                entries.push(editEntry);

                                const contextMenu = new ContextMenu(this);
                                contextMenu.setEntries(entries);
                                await contextMenu.renderContextMenu(event.pageX, event.pageY);
                                controller.setLoadingState(false);
                            } catch (error) {
                                controller.setLoadingState(false);
                                controller.showError(error);
                            }

                            return Promise.resolve();
                        }.bind(this));
                        this._sidePanel.show($content);
                    }
                    return Promise.resolve();
                }.bind(this)
            };
            menuItem = new MenuItem(conf);
            menuItems.push(menuItem);

            if (controller.getConfigController().experimentalFeaturesEnabled()) {
                conf = {
                    'style': 'iconbar',
                    'icon': new Icon('clock-rotate-left'),
                    'tooltip': 'Chronik',
                    'click': async function (event, icon) {
                        event.preventDefault();
                        event.stopPropagation();

                        alert('TODO');

                        return Promise.resolve();
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
        this._$topIconBar.css({
            'position': 'absolute',
            'z-index': 1
        });
        return this._$topIconBar;
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
            var icon = new Icon();
            icon.setSvg(`<svg width="16px" height="16px" viewBox="0 -0.5 21 21" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Dribbble-Light-Preview" transform="translate(-219.000000, -200.000000)" fill="#000000">
            <g id="icons" transform="translate(56.000000, 160.000000)">
                <path d="M181.9,54 L179.8,54 C178.63975,54 177.7,54.895 177.7,56 L177.7,58 C177.7,59.105 178.63975,60 179.8,60 L181.9,60 C183.06025,60 184,59.105 184,58 L184,56 C184,54.895 183.06025,54 181.9,54 M174.55,54 L172.45,54 C171.28975,54 170.35,54.895 170.35,56 L170.35,58 C170.35,59.105 171.28975,60 172.45,60 L174.55,60 C175.71025,60 176.65,59.105 176.65,58 L176.65,56 C176.65,54.895 175.71025,54 174.55,54 M167.2,54 L165.1,54 C163.93975,54 163,54.895 163,56 L163,58 C163,59.105 163.93975,60 165.1,60 L167.2,60 C168.36025,60 169.3,59.105 169.3,58 L169.3,56 C169.3,54.895 168.36025,54 167.2,54 M181.9,47 L179.8,47 C178.63975,47 177.7,47.895 177.7,49 L177.7,51 C177.7,52.105 178.63975,53 179.8,53 L181.9,53 C183.06025,53 184,52.105 184,51 L184,49 C184,47.895 183.06025,47 181.9,47 M174.55,47 L172.45,47 C171.28975,47 170.35,47.895 170.35,49 L170.35,51 C170.35,52.105 171.28975,53 172.45,53 L174.55,53 C175.71025,53 176.65,52.105 176.65,51 L176.65,49 C176.65,47.895 175.71025,47 174.55,47 M167.2,47 L165.1,47 C163.93975,47 163,47.895 163,49 L163,51 C163,52.105 163.93975,53 165.1,53 L167.2,53 C168.36025,53 169.3,52.105 169.3,51 L169.3,49 C169.3,47.895 168.36025,47 167.2,47 M181.9,40 L179.8,40 C178.63975,40 177.7,40.895 177.7,42 L177.7,44 C177.7,45.105 178.63975,46 179.8,46 L181.9,46 C183.06025,46 184,45.105 184,44 L184,42 C184,40.895 183.06025,40 181.9,40 M174.55,40 L172.45,40 C171.28975,40 170.35,40.895 170.35,42 L170.35,44 C170.35,45.105 171.28975,46 172.45,46 L174.55,46 C175.71025,46 176.65,45.105 176.65,44 L176.65,42 C176.65,40.895 175.71025,40 174.55,40 M169.3,42 L169.3,44 C169.3,45.105 168.36025,46 167.2,46 L165.1,46 C163.93975,46 163,45.105 163,44 L163,42 C163,40.895 163.93975,40 165.1,40 L167.2,40 C168.36025,40 169.3,40.895 169.3,42" id="grid-[#1526]"></path>
            </g>
        </g>
    </g>
</svg>`);

            conf = {
                'style': 'iconbar',
                'icon': icon,
                'tooltip': 'Apps',
                'click': async function (event, icon) {
                    event.preventDefault();
                    event.stopPropagation();

                    this.close();
                    return controller.loadState(new State({ customRoute: '/apps' }), true);
                }.bind(this)
            };
            menuItem = new MenuItem(conf);
            menuItems.push(menuItem);

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

                        if (true) {
                            controller.loadState(new State({ customRoute: '/extensions' }), true);
                        } else {
                            const item = icon.getMenuItem();
                            if (activeIcon != item) {
                                this._bottomIconBar.setActiveItem(item);
                                this.updateSideNavigationBar();
                                await this._sidePanel.show(this._extensionSelect.renderExtensionSelect());
                            }
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

                            var config = {
                                'css': { 'minWidth': '400px' }
                            };
                            return app.getController().getModalController().openPanelInModal(new CachePanel(config));
                        }.bind(this)
                    };
                    this._cacheMenuItem = new MenuItem(conf);
                    menuItems.push(this._cacheMenuItem);
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
        return this._$bottomIconBar;
    }

    updateSideNavigationBar() {
        if (this._cacheMenuItem) {
            if (app.getController()._bOfflineMode)
                this._cacheMenuItem.setNotification('!');
            else
                this._cacheMenuItem.setNotification();
        }

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