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
        this._url = app.controller.getApiController().getApiOrigin() + "/api/_registry";
        var entry = await WebClient.fetchJson(this._url + '?key=profiles');
        if (entry && entry.length == 1) {
            var value = entry[0]['value'];
            if (value)
                this._config = JSON.parse(value);
        }
        if (this._config && this._config[ProfileController.CONFIG_PROFILE_AVAILABLE_IDENT])
            this._profiles = this._config[ProfileController.CONFIG_PROFILE_AVAILABLE_IDENT];
        return Promise.resolve();
    }

    async setProfiles(profiles) {
        this._profiles = profiles;
        return WebClient.request("PUT", this._url, { 'key': 'profiles', 'value': JSON.stringify(this._profiles) });
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