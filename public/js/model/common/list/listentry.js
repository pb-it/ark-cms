class ListEntry {

    _name;
    _data;

    constructor(name, data) {
        this._name = name;
        this._data = data;
    }

    getName() {
        return this._name;
    }

    getData() {
        return this._data;
    }
}