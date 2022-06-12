class UniversalNode {

    _config;
    _id;
    _name;
    _data;

    _$div;

    constructor(config, id, name, data) {
        this._config = config;
        if (id)
            this._id = id;
        else if (name)
            this._id = name + Date.now();
        else
            this._id = Date.now();
        this._name = name;
        this._data = data;

        this._$div = $('<div/>')
            .addClass('node');
    }

    getName() {
        return this._name;
    }

    getData() {
        return this._data;
    }

    renderNode() {
        this._$div.empty();
        this._$div.append(this._name);
        return this._$div;
    }
}