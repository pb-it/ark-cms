class FormEntry {

    _form;
    _attribute;

    _id;
    _value;
    _bVisible;
    _bEditable;

    _$div;
    //_$label;
    _$value;

    constructor(form, attribute) {
        this._form = form;
        this._attribute = attribute;

        const id = this._attribute['id'] ?? this._attribute['name'];
        this._id = id + ':' + Date.now();

        this._bVisible = !this._attribute['hidden'];
        this._bEditable = !this._attribute['readonly'];
    }

    setAttribute(attribute) {
        this._attribute = attribute;
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
        return this._bVisible;
    }

    async hide() {
        this._value = await this.readValue(false);
        this._bVisible = false;
        if (this._$div)
            this._$div.empty();
        return Promise.resolve();
    }

    async show() {
        this._bVisible = true;
        return this.renderEntry(this._value);
    }

    isEditable() {
        return this._bEditable;
    }

    async enable() {
        this._bEditable = true;
        return this.renderEntry(await this.readValue(false));
    }

    async disable() {
        this._bEditable = false;
        return this.renderEntry(await this.readValue(false));
    }

    async renderEntry(value) {
        this._value = value;

        if (this._$div)
            this._$div.empty();
        else {
            const formName = this._form.getName() ?? 'form';
            this._$div = $('<div/>')
                .attr('id', formName + ':' + this._id)
                .addClass('formentry');
        }

        if (!this._bVisible)
            this._$div.empty();
        else {
            const $label = this.renderLabel();
            if ($label)
                this._$div.append($label);
            const $value = await this.renderValue(this._value);
            this._$div.append($value);
        }
        return Promise.resolve(this._$div);
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
            var text;
            if (this._attribute['persistent'] === false)
                text = $('<i/>').append(this.getLabel());
            else
                text = this.getLabel();
            $label = $('<label/>')
                .attr('for', this._id)
                .append(text)
                .append(':');
            var tooltip;
            if (this._attribute['tooltip'])
                tooltip = this._attribute['tooltip'];
            else
                tooltip = '';
            $label.attr('title', tooltip);

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