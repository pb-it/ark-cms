class SelectableNodeVis extends UniversalNodeVis {

    _$checkbox;

    constructor(id, parent, node, bSelected) {
        super(id, parent, node);

        this._$checkbox = $('<input />', { type: 'checkbox', id: this._id, value: this._name });
        this._$checkbox.prop('checked', bSelected);
        const options = node.getOptions();
        if (options) {
            if (options['clickAction'])
                this._$checkbox.click(options['clickAction']);
            if (options['changeAction'])
                this._$checkbox.change(options['changeAction']);
        }
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