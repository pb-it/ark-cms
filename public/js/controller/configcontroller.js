const MODEL_VERSION_IDENT = "version";
const DEBUG_IDENT = "debug";
const API_IDENT = "api";

class ConfigController {

    _controller;
    _storageController;

    _debugConfig;
    _api;

    constructor() {
        this._controller = app.getController();
        this._storageController = this._controller.getStorageController();
    }

    async initConfigController() {
        var debugConfig = this._storageController.loadLocal(DEBUG_IDENT);
        if (debugConfig)
            this._debugConfig = JSON.parse(debugConfig);
        this._api = this._storageController.loadLocal(API_IDENT);

        if (!this._debugConfig)
            this.setDefaultDebugConfig();

        if (!this._api)
            this.setDefaultApi();

        return Promise.resolve();
    }

    async import(models, profiles, bookmarks, bForce) {
        var bError = false;
        const controller = this._controller;
        controller.setLoadingState(true);
        try {
            var resp;
            for (var model of models) {
                resp = await model.uploadData(bForce);
                //console.log(resp);
            }

            if (profiles)
                await controller.getProfileController().setProfiles(profiles);

            if (bookmarks)
                await controller.getBookmarkController().setBookmarks(bookmarks);

            controller.setLoadingState(false);
        } catch (error) {
            bError = true;
            controller.setLoadingState(false);
            controller.showError(error);
        }
        if (!bError) {
            try {
                controller.setLoadingState(true);
                const ac = controller.getApiController();
                const info = await ac.fetchApiInfo();
                if (info) {
                    var bRestart = false;
                    if (info['state'] === 'openRestartRequest') {
                        controller.setLoadingState(false);
                        bRestart = await controller.getModalController().openConfirmModal("Some changes need a restart to take effect. Do you want to restart the backend now?");
                        controller.setLoadingState(true);
                    }
                    if (bRestart) {
                        await ac.restartApi();
                        await sleep(5000);
                    } else
                        await ac.reloadModels();
                    var bReady = await ac.waitApiReady();
                    if (bReady) {
                        alert('Application is going to reload in order to finish import!');
                        controller.reloadApplication(); //TODO: quickfix ? overact?
                    } else {
                        controller.setLoadingState(false);
                        if (bRestart)
                            controller.showErrorMessage("Backend not reachable after restart. Please inspect your backend manually!");
                        else
                            controller.showErrorMessage("Automatic reloading of models failed. Please restart your backend manually!");
                    }
                } else {
                    controller.setLoadingState(false);
                    controller.showError(error, "Automatic reloading of models failed. Please restart your backend manually!");
                }
            } catch (error) {
                controller.setLoadingState(false);
                controller.showError(error, "Automatic reloading of models failed. Please restart your backend manually!");
            }
            controller.setLoadingState(false);
        }
        return Promise.resolve();
    }

    async export(models) {
        const controller = this._controller;
        if (!models)
            models = controller.getModelController().getModels();

        var config = {};
        const ac = controller.getApiController();
        var info = ac.getApiInfo();
        config[MODEL_VERSION_IDENT] = info['version'];

        config[ModelController.MODELS_IDENT] = models.map(function (model) {
            return model.getDefinition();
        });
        config[ModelController.MODELS_IDENT].sort((a, b) => a.name.localeCompare(b.name));

        var profiles = controller.getProfileController().getProfileConfig();
        if (profiles)
            config[ProfileController.CONFIG_PROFILE_IDENT] = profiles;

        var bookmarks = controller.getBookmarkController().getBookmarks();
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
            this._storageController.storeLocal(DEBUG_IDENT, JSON.stringify(conf));
        else
            this._storageController.storeLocal(DEBUG_IDENT, '');
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
            this._storageController.storeLocal(API_IDENT, api);
        else
            this._storageController.storeLocal(API_IDENT, '');
    }

    confirmOnLeave() {
        return this._storageController.loadLocal('bConfirmOnLeave') === 'true';
    }

    confirmOnApply() {
        return this._controller.isInDebugMode() || (this._storageController.loadLocal('bConfirmOnApply') === 'true');
    }

    experimentalFeaturesEnabled() {
        return this._storageController.loadLocal('bExperimentalFeatures') === 'true';
    }
}