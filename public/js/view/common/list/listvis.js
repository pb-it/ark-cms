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
        var node;
        for (var entry of this._list.getEntries()) {
            node = new UniversalNode({}, null, this, entry.getName(), entry);
            if (this._config['editable'])
                node.setEditable(true);
            this._nodes.push(node);
        }
    }

    getList() {
        return this._list;
    }

    isEditable() {
        return this._config['editable'];
    }

    removeNode(node) {
        this._nodes = this._nodes.filter(function (x) { return x != node });
        this._list.removeEntry(node.getData());
        this.renderList();
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