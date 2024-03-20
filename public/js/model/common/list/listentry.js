class ListEntry {

    _name;
    _data;
    _options;

    constructor(name, data, options) {
        this._name = name;
        this._data = data;
        this._options = options;
    }

    getName() {
        return this._name;
    }

    setName(name) {
        this._name = name;
    }

    getData() {
        return this._data;
    }

    setData(data) {
        this._data = data;
    }

    getOptions() {
        return this._options;
    }

    setOptions(options) {
        this._options = options;
    }
}