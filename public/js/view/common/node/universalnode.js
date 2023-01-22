class UniversalNode {

    _config;
    _id;
    _parent;
    _name;
    _data;

    _bEditable;

    _$div;

    constructor(config, id, parent, name, data) {
        this._config = config;
        if (id)
            this._id = id;
        else if (name)
            this._id = name + Date.now();
        else
            this._id = Date.now();
        this._parent = parent;
        this._name = name;
        this._data = data;

        this._$div = $('<div/>')
            .addClass('node');
    }

    setEditable(bEditable) {
        this._bEditable = bEditable;
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

        if (this._bEditable && this._parent) {
            this._$div.on("contextmenu", async function (event) {
                event.preventDefault();
                event.stopPropagation();

                var entries = [];
                entries.push(new ContextMenuEntry("Delete", async function () {
                    this._parent.removeNode(this);
                    return Promise.resolve();
                }.bind(this)));

                var contextMenu = new ContextMenu(entries);
                contextMenu.renderMenu(event.pageX, event.pageY);

                return Promise.resolve();
            }.bind(this));
        }

        return this._$div;
    }
}