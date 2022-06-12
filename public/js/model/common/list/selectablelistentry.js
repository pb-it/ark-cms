class SelectableListEntry extends ListEntry {

    _bSelected;

    constructor(name, data, bSelected) {
        super(name, data)
        this._bSelected = bSelected;
    }

    setSelected(bSelected) {
        this._bSelected = bSelected;
    }

    isSelected() {
        return this._bSelected;
    }
}