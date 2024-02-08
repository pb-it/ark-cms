class ContextMenuEntry {

    _name;
    _funcVisible;
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

    isVisible(target) {
        if (this._funcVisible)
            return this._funcVisible(target);
        else
            return true;
    }
}