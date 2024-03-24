class SelectableListVis extends ListVis {

    constructor(config, name, data) {
        super(config, name, data);
    }

    init() {
        this._nodes = [];
        var node;
        for (var entry of this._list.getEntries()) {
            node = new SelectableNodeVis(null, this, entry, entry.isSelected());
            this._nodes.push(node);
        }
    }

    getList() {
        var entry;
        for (var node of this._nodes) {
            entry = node.getNode();
            entry.setSelected(node.isSelected());
        }
        return this._list;
    }

    renderList() {
        super.renderList();

        if (this._config['selectButtons']) {
            var bDisabled = this._nodes.length == 0;
            var $selectAllButton = $("<button/>")
                .text("Select All")
                .prop("disabled", bDisabled)
                .click(function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    for (var node of this._nodes) {
                        node.setSelected(true);
                    }
                    if (this._config['changeAction'])
                        this._config['changeAction']();
                }.bind(this));
            this._$div.append($selectAllButton);

            var $deselectAllButton = $("<button/>")
                .text("Deselect All")
                .prop("disabled", bDisabled)
                .click(function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    for (var node of this._nodes) {
                        node.setSelected(false);
                    }
                    if (this._config['changeAction'])
                        this._config['changeAction']();
                }.bind(this));
            this._$div.append($deselectAllButton);
        }
        return this._$div;
    }
}