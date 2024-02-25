class ContextMenuEntry {

    _name;
    _icon;
    _shortcut;
    _funcVisible;
    _funcEnabled;
    _funcClick;
    entries;

    constructor(name, funcClick, entries) {
        this._name = name;
        this._funcClick = funcClick;
        this.entries = entries;
    }

    getName() {
        return this._name;
    }

    setIcon(icon) {
        this._icon = icon;
    }

    getIcon() {
        return this._icon;
    }

    setShortcut(shortcut) {
        this._shortcut = shortcut;
    }

    getShortcut() {
        return this._shortcut;
    }

    click(event, target) {
        if (this._funcClick) {
            this._funcClick(event, target);
            return true;
        } else
            return false;
    }

    setVisibilityFunction(funcVisible) {
        this._funcVisible = funcVisible;
    }

    async isVisible(target) {
        if (this._funcVisible)
            return this._funcVisible(target);
        else
            return Promise.resolve(true);
    }

    setEnabledFunction(funcEnabled) {
        this._funcEnabled = funcEnabled;
    }

    async isEnabled(target) {
        if (this._funcEnabled)
            return this._funcEnabled(target);
        else
            return Promise.resolve(true);
    }
}