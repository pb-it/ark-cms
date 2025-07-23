class Icon {

    _name;
    _svg;

    constructor(name) {
        this._name = name;
    }

    setSvg(svg) {
        this._svg = svg;
    }

    renderIcon() {
        var $i;
        if (this._svg)
            $i = $("<i>").append(this._svg);
        else if (this._name) {
            var bSolid = false;
            if (bSolid == true)
                $i = $("<i class='fas fa-" + this._name + "' aria-hidden='true'>");
            else
                $i = $("<i class='fa fa-" + this._name + "' aria-hidden='true'>");
        }
        if ($i)
            $i.css({
                'min-width': '16px',
                'text-align': 'center'
            });
        return $i;
    }
}
