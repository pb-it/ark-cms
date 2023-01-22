class SelectableNode extends UniversalNode {

    _$checkbox;

    constructor(config, id, parent, name, data) {
        super(config, id, parent, name, data);

        this._$checkbox = $('<input />', { type: 'checkbox', id: this._id, value: this._name });
    }

    setSelected(bSelected) {
        this._$checkbox.prop('checked', bSelected);
    }

    isSelected() {
        return this._$checkbox.is(':checked');
    }

    renderNode() {
        this._$div.empty();
        this._$div.append(this._$checkbox);
        var $label = $('<label/>')
            .attr('for', this._id)
            .text(this._name);
        this._$div.append($label);
        return this._$div;
    }
}