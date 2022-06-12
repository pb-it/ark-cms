class ListVis {

    _config;
    _name;
    _list;

    _$div;

    _nodes;

    constructor(config, name, list) {
        this._config = config;
        this._name = name;
        this._list = list;

        this._$div = $('<div/>').addClass('list');
    }

    init() {
        this._nodes = [];
        for (var entry of this._list.getEntries()) {
            this._nodes.push(new UniversalNode({}, null, entry.getName(), entry));
        }
    }

    getList() {
        return this._list;
    }

    renderList() {
        this._$div.empty();

        if (this._config['alignment'] === 'vertical') {
            for (var node of this._nodes) {
                this._$div.append(node.renderNode());
            }
        } else {
            alert("NotImplementedException");
        }
        return this._$div;
    }
}