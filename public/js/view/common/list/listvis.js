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
        this._$div.empty();
        if (this._config['columns']) {
            var $table = $('<table/>');//.addClass('list');
            var $row = $('<tr>');
            var $column = $('<td>');

            for (var i = 0; i < this._nodes.length; i++) {
                if (i % this._config['columns'] == 0) {
                    $row = $('<tr>');
                    $table.append($row);
                }
                $column = $('<td>');
                $column.append(this._nodes[i].renderNode());
                $row.append($column);
            }
            this._$div.append($table);
        } else {
            var $ul = $('<ul/>');
            if (this._config['alignment'] === 'vertical') {
                var $item;
                for (var node of this._nodes) {
                    $item = $('<li/>');
                    $item.append(node.renderNode());
                    $ul.append($item);
                }
            } else {
                alert("NotImplementedException");
            }
            this._$div.append($ul);
        }
        return this._$div;
    }
}