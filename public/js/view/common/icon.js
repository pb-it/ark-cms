class Icon {

    _iconType;

    constructor(iconType) {
        this._iconType = iconType;
    }

    getIconType() {
        return this._iconType;
    }

    renderIcon() {
        var $i;
        var bSolid = false;
        if (bSolid == true)
            $i = $("<i class='fas fa-" + this._iconType + "' aria-hidden='true'>");
        else
            $i = $("<i class='fa fa-" + this._iconType + "' aria-hidden='true'>");

        return $i;
    }
}
