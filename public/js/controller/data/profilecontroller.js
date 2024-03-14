class ProfileController {

    static CONFIG_PROFILE_IDENT = 'profiles';
    static CONFIG_PROFILE_AVAILABLE_IDENT = 'available';
    static CONFIG_PROFILE_MENU_IDENT = 'menu';

    _apiClient;
    _config;
    _profiles;

    constructor() {
        this._apiClient = app.getController().getApiController().getApiClient();
    }

    async init() {
        var entry = await this._apiClient.requestData("GET", "_registry?key=profiles");
        if (entry && entry.length == 1) {
            var value = entry[0]['value'];
            if (value) {
                try {
                    this._config = JSON.parse(value);
                } catch (error) {
                    app.getController().showErrorMessage('Failed to parse profiles');
                }
            }
        }
        if (this._config && this._config[ProfileController.CONFIG_PROFILE_AVAILABLE_IDENT])
            this._profiles = this._config[ProfileController.CONFIG_PROFILE_AVAILABLE_IDENT];
        return Promise.resolve();
    }

    async setProfiles(profiles) {
        this._profiles = profiles;
        return this._apiClient.requestData("PUT", "_registry", null, { 'key': 'profiles', 'value': JSON.stringify(this._profiles) });
    }

    getProfileConfig() {
        return this._config;
    }

    getProfiles() {
        return this._profiles;
    }

    getProfile(name) {
        var res;
        if (this._profiles)
            res = this._profiles.filter(function (x) { return x.name === name })[0];
        return res;
    }

    getCurrentProfileName() {
        var res;
        //TODO: load from state
        return res;
    }

    setCurrentProfileName(str) {
        //TODO: save in state
    }

    getMenu(name) {
        var res;
        var profile;
        if (!name)
            name = this.getCurrentProfileName();
        if (name)
            profile = this.getProfile(name);
        if (profile)
            res = profile[ProfileController.CONFIG_PROFILE_MENU_IDENT];
        return res;
    }

    getAllUsedModels() {
        var arr = [];
        if (this._profiles) {
            var menu;
            var name;
            for (var profile of this._profiles) {
                menu = profile[ProfileController.CONFIG_PROFILE_MENU_IDENT];
                if (menu) {
                    for (name of menu) {
                        if (!arr.includes[name])
                            arr.push(name);
                    }
                }
            }
        }
        return arr;
    }
}