class SelectableListEntry extends ListEntry {

    _bSelected;

    constructor(name, data, options, bSelected) {
        super(name, data, options)
        this._bSelected = bSelected;
    }

    setSelected(bSelected) {
        this._bSelected = bSelected;
    }

    isSelected() {
        return this._bSelected;
    }
}