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
        if (window.localStorage) {
            var debugConfig = window.localStorage.getItem(DEBUG_IDENT);
            if (debugConfig)
                this._debugConfig = JSON.parse(debugConfig);
            this._api = window.localStorage.getItem(API_IDENT);
        }

        if (!this._debugConfig)
            this.setDefaultDebugConfig();

        if (!this._api)
            this.setDefaultApi();

        return Promise.resolve();
    }

    async import(models, profiles, bookmarks) {
        var bError = false;
        app.controller.setLoadingState(true);
        try {
            for (var model of models) {
                await model.uploadData();
            }

            if (profiles)
                await app.controller.getProfileController().setProfiles(profiles);

            if (bookmarks)
                await app.controller.getBookmarkController().setBookmarks(bookmarks);
        } catch (error) {
            bError = true;
            app.controller.setLoadingState(false);
            app.controller.showError(error);
        }
        if (!bError) {
            try {
                await app.controller.reloadModels();
                app.controller.reload();
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
        config[MODEL_VERSION_IDENT] = app.getAppVersion();

        config[ModelController.MODELS_IDENT] = models.map(function (model) {
            return model.getData();
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
        if (window.location.hostname === "localhost") {
            conf = {
                'bDebug': true,
                'ajax': { 'skip': false, 'delay': 0 }
            };
        } else
            conf = {
                'bDebug': false
            };
        this.setDebugConfig(conf);
    }

    setDebugConfig(conf) {
        this._debugConfig = conf;
        if (window.localStorage) {
            if (conf)
                window.localStorage.setItem(DEBUG_IDENT, JSON.stringify(conf));
            else
                window.localStorage.setItem(DEBUG_IDENT, '');
        }
    }

    getApi() {
        var api;
        if (this._api && this._api.endsWith('/'))
            api = this._api.substr(0, this._api.length - 1);
        else
            api = this._api;
        return api;
    }

    setDefaultApi() {
        this.setApi(window.location.protocol + "//" + window.location.hostname + ":3002/api");
    }

    setApi(api) {
        this._api = api;
        if (window.localStorage) {
            if (api)
                window.localStorage.setItem(API_IDENT, api);
            else
                window.localStorage.setItem(API_IDENT, '');
        }
    }
}