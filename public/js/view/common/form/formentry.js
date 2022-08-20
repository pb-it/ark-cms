class FormEntry {

    _form;
    _attribute;

    _id;
    _value;
    _$div;

    constructor(form, attribute) {
        this._form = form;
        this._attribute = attribute;

        var formName = this._form.getName();
        if (formName)
            this._id = formName + "." + this._attribute.name;
        else
            this._id = this._attribute.name + Date.now();
    }

    getAttribute() {
        return this._attribute;
    }

    getName() {
        return this._attribute['name'];
    }

    getId() {
        return this._id;
    }

    setValue(value) {
        this._value = value;
    }

    isVisible() {
        return !this._attribute['hidden'];
    }

    async renderEntry(value) {
        this._value = value;
        var $div = $('<div/>').addClass('formentry');
        var $label = this.renderLabel();
        if ($label)
            $div.append($label);
        $div.append(await this.renderValue(this._value));
        return Promise.resolve($div);
    }

    /**
     * for enumerations of type radio the label is the legend of the fieldset
     * checkboxes can have the label right
     * @returns 
     */
    renderLabel() {
        var $label;
        if (!(this._attribute['dataType'] === 'enumeration' && this._attribute['view'] === 'radio') &&
            !(this._attribute['dataType'] === 'boolean' && this._attribute['view'] === 'labelRight')) {
            $label = $('<label/>')
                .attr('for', this._id)
                .text(this.getLabel() + ":");
            if (this._attribute['tooltip'])
                $label.attr('title', this._attribute['tooltip']);
        }
        return $label;
    }

    getLabel() {
        var label = this._attribute['label'];
        if (!label)
            label = this._attribute['name'];
        if (this._attribute['required'] && !(this._attribute['readonly']) && !(this._attribute['defaultValue'] === true || this._attribute['defaultValue'] === false))
            label += '*';
        return label;
    }

    async renderValue(value) {
        throw new Error("Abstract method!");
    }

    async readValue(bValidate) {
        throw new Error("Abstract method!");
    }
}