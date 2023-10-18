const MODEL_VERSION_IDENT = "version";
const DEBUG_IDENT = "debug";
const API_IDENT = "api";

class ConfigController {

    _config;

    _debugConfig;
    _api;

    constructor() {
    }

    async initConfigController() {
        var debugConfig = app.controller.getStorageController().loadLocal(DEBUG_IDENT);
        if (debugConfig)
            this._debugConfig = JSON.parse(debugConfig);
        this._api = app.controller.getStorageController().loadLocal(API_IDENT);

        if (!this._debugConfig)
            this.setDefaultDebugConfig();

        if (!this._api)
            this.setDefaultApi();

        return Promise.resolve();
    }

    async import(models, profiles, bookmarks, bForce) {
        var bError = false;
        app.controller.setLoadingState(true);
        try {
            var resp;
            for (var model of models) {
                resp = await model.uploadData(bForce);
                //console.log(resp);
            }

            if (profiles)
                await app.controller.getProfileController().setProfiles(profiles);

            if (bookmarks)
                await app.controller.getBookmarkController().setBookmarks(bookmarks);

            app.controller.setLoadingState(false);
        } catch (error) {
            bError = true;
            app.controller.setLoadingState(false);
            app.controller.showError(error);
        }
        if (!bError) {
            try {
                app.controller.setLoadingState(true);
                var ac = app.controller.getApiController();
                var info = await ac.fetchApiInfo();
                if (info) {
                    var bRestart = false;
                    if (info['state'] === 'openRestartRequest') {
                        app.controller.setLoadingState(false);
                        bRestart = await app.controller.getModalController().openConfirmModal("Some changes need a restart to take effect. Do you want to restart the backend now?");
                        app.controller.setLoadingState(true);
                    }
                    if (bRestart)
                        await ac.restartApi();
                    else
                        await ac.reloadModels();
                    var bReady = await ac.waitApiReady();
                    if (bReady) {
                        alert('Application is going to reload in order to finish import!');
                        app.controller.reloadApplication(); //TODO: quickfix ? overact?
                    } else {
                        app.controller.setLoadingState(false);
                        if (bRestart)
                            app.controller.showErrorMessage("Backend not reachable after restart. Please inspect your backend manually!");
                        else
                            app.controller.showErrorMessage("Automatic reloading of models failed. Please restart your backend manually!");
                    }
                } else {
                    app.controller.setLoadingState(false);
                    app.controller.showError(error, "Automatic reloading of models failed. Please restart your backend manually!");
                }
            } catch (error) {
                app.controller.setLoadingState(false);
                app.controller.showError(error, "Automatic reloading of models failed. Please restart your backend manually!");
            }
            app.controller.setLoadingState(false);
        }
        return Promise.resolve();
    }

    async export(models) {
        if (!models)
            models = app.controller.getModelController().getModels();

        var config = {};
        var ac = app.controller.getApiController();
        var info = ac.getApiInfo();
        config[MODEL_VERSION_IDENT] = info['version'];

        config[ModelController.MODELS_IDENT] = models.map(function (model) {
            return model.getDefinition();
        });
        config[ModelController.MODELS_IDENT].sort((a, b) => a.name.localeCompare(b.name));

        var profiles = app.controller.getProfileController().getProfileConfig();
        if (profiles)
            config[ProfileController.CONFIG_PROFILE_IDENT] = profiles;

        var bookmarks = app.controller.getBookmarkController().getBookmarks();
        if (bookmarks)
            config[BookmarkController.CONFIG_BOKKMARK_IDENT] = bookmarks;

        FileCreator.createFileFromText(`models_${FileCreator.createFilenameByDateTime()}.json`, JSON.stringify(config, null, '\t'));

        return Promise.resolve();
    }

    getDebugConfig() {
        return this._debugConfig;
    }

    setDefaultDebugConfig() {
        var conf;
        /*if (window.location.hostname === "localhost") {
            conf = {
                'bDebug': true,
                'ajax': { 'skip': false, 'delay': 0 }
            };
        } else*/
        conf = {
            'bDebug': false
        };
        this.setDebugConfig(conf);
    }

    setDebugConfig(conf) {
        this._debugConfig = conf;
        if (conf)
            app.controller.getStorageController().storeLocal(DEBUG_IDENT, JSON.stringify(conf));
        else
            app.controller.getStorageController().storeLocal(DEBUG_IDENT, '');
    }

    getApi() {
        return this._api;
    }

    setDefaultApi() {
        this.setApi(ApiController.getDefaultApiOrigin());
    }

    setApi(api) {
        this._api = api;
        if (api)
            app.controller.getStorageController().storeLocal(API_IDENT, api);
        else
            app.controller.getStorageController().storeLocal(API_IDENT, '');
    }

    confirmOnLeave() {
        return app.controller.getStorageController().loadLocal('bConfirmOnLeave') === 'true';
    }

    confirmOnApply() {
        return app.controller.isInDebugMode() || (app.controller.getStorageController().loadLocal('bConfirmOnApply') === 'true');
    }

    experimentalFeaturesEnabled() {
        return app.controller.getStorageController().loadLocal('bExperimentalFeatures') === 'true';
    }
}