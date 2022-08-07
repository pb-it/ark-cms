class ListVis {

    _config;
    _name;
    _list;

    _$ul;

    _nodes;

    constructor(config, name, list) {
        this._config = config;
        this._name = name;
        this._list = list;

        this._$ul = $('<ul/>').addClass('list');
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
        this._$ul.empty();

        if (this._config['alignment'] === 'vertical') {
            var $item;
            for (var node of this._nodes) {
                $item = $('<li/>');
                $item.append(node.renderNode());
                this._$ul.append($item);
            }
        } else {
            alert("NotImplementedException");
        }
        return this._$ul;
    }
}