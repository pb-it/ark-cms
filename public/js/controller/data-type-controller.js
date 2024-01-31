class DataTypeController {

    _store;

    constructor() {
    }

    addDataType(type) {
        if (type instanceof DataType) {
            if (!this._store)
                this._store = {};
            var tag = type.getTag();
            if (tag)
                this._store[tag] = type;
        } else
            throw new Error("Data Types must be instances of 'DataType' class");
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