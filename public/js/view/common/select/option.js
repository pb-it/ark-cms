class Option {

    _name;
    _data;

    _id;
    _bSelected;

    constructor(name, data, bSelected = false) {
        if (name)
            this._name = name;
        else
            this._name = '<n/a>';
        this._data = data;

        this._bSelected = bSelected;

        this._id = data.id;
    }

    getName() {
        return this._name;
    }

    getData() {
        return this._data;
    }

    getID() {
        return this._id;
    }

    setSelected(bSelected) {
        this._bSelected = bSelected;
    }

    isSelected() {
        return this._bSelected;
    }
}