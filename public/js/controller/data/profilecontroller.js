class ProfileController {

    static CONFIG_PROFILE_IDENT = 'profiles';
    static CONFIG_PROFILE_AVAILABLE_IDENT = 'available';
    static CONFIG_PROFILE_MENU_IDENT = 'menu';

    _url;
    _config;
    _profiles;

    constructor() {
    }

    async init() {
        this._url = app.controller.getConfigController().getApiOrigin() + "/profiles";
        this._config = await WebClient.fetchJson(this._url);
        if (this._config && this._config[ProfileController.CONFIG_PROFILE_AVAILABLE_IDENT])
            this._profiles = this._config[ProfileController.CONFIG_PROFILE_AVAILABLE_IDENT];
        return Promise.resolve();
    }

    async setProfiles(profiles) {
        this._profiles = profiles;
        return WebClient.request("PUT", this._url, this._profiles);
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
}