class SelectableListVis extends ListVis {

    constructor(config, name, data) {
        super(config, name, data);
    }

    init() {
        this._nodes = [];
        var node;
        for (var entry of this._list.getEntries()) {
            node = new SelectableNode({}, null, this, entry.getName(), entry);
            node.setSelected(entry.isSelected());
            this._nodes.push(node);
        }
    }

    getList() {
        var entry;
        for (var node of this._nodes) {
            entry = node.getData();
            entry.setSelected(node.isSelected());
        }
        return this._list;
    }

    renderList() {
        super.renderList();

        if (this._config['selectButtons']) {
            var $selectAllButton = $("<button/>")
                .text("Select All")
                .click(function (event) {
                    event.stopPropagation();

                    for (var node of this._nodes) {
                        node.setSelected(true);
                    }
                }.bind(this));
            this._$div.append($selectAllButton);

            var $deselectAllButton = $("<button/>")
                .text("Deselect All")
                .click(function (event) {
                    event.stopPropagation();

                    for (var node of this._nodes) {
                        node.setSelected(false);
                    }
                }.bind(this));
            this._$div.append($deselectAllButton);
        }
        return this._$div;
    }
}