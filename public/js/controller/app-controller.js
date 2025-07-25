class AppController {

    _apps;
    _settings;

    constructor() {
    }

    async initAppController() {
        this._apps = [];
        this._settings = await app.getController().getAuthController().getUserSettings();
        return Promise.resolve;
    }

    getApps() {
        return this._apps;
    }

    addApp(application) {
        this._apps.push(application);
        if (this._settings && this._settings.hasOwnProperty('apps')) {
            var tmp = this._settings['apps'].filter(x => x['name'] === application['name']);
            if (tmp && tmp.length == 1 && tmp[0]['bPinned']) {
                app.getController().getView().getSideNavigationBar().addIconBarItem({
                    name: application['name'],
                    func: () => {
                        var conf;
                        const controller = app.getController();
                        if (controller.hasConnection()) {
                            conf = {
                                'style': 'iconbar',
                                'icon': application['icon'],
                                'tooltip': application['name'],
                                'click': async function (event, icon) {
                                    event.preventDefault();
                                    event.stopPropagation();

                                    const controller = app.getController();
                                    try {
                                        /*const snb = controller.getView().getSideNavigationBar();
                                        const bib = snb.getBottomIconBar();
                                        const activeIcon = bib.getActiveItem();
                                        snb.close();*/
                                        controller.getView().getSideNavigationBar().close();

                                        await application['start'](event, icon);
                                    } catch (error) {
                                        controller.showError(error);
                                    }
                                    return Promise.resolve();
                                }
                            };
                        }
                        return conf;
                    }
                }, false);
            }
        }
    }
}