class DataTypeController {

    _store;

    constructor() {
    }

    addDataType(type) {
        if (!this._store)
            this._store = {};
        var tag = type['tag'];
        if (tag)
            this._store[tag] = type;
    }

    getDataType(tag) {
        var res;
        if (this._store) {
            if (tag)
                res = this._store[tag];
            else
                res = this._store;
        }
        return res;
    }
}