class MenuItem {

    _conf;
    _menu;

    _bActive;
    _notification;
    _subMenu;

    constructor(conf, menu) {
        if (conf)
            this._conf = conf;
        else
            this._conf = {};
        this._menu = menu;
        this._bActive = false;
    }

    getMenuItemConfig() {
        return this._conf;
    }

    setMenuItemConfig(conf) {
        this._conf = conf;
    }

    getMenu() {
        return this._menu;
    }

    setMenu(menu) {
        this._menu = menu;
    }

    getName() {
        return this._conf['name'];
    }

    setName(name) {
        this._conf['name'] = name;
    }

    isActive() {
        return this._bActive;
    }

    setActive() {
        this._bActive = true;
    }

    setInactive() {
        this._bActive = false;
    }

    getNotification() {
        return this._notification;
    }

    setNotification(text) {
        this._notification = text;
    }

    getSubMenu() {
        return this._subMenu;
    }

    setSubMenu(menu) {
        this._subMenu = menu;
    }
}