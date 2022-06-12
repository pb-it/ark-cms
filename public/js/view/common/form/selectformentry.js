class SelectFormEntry extends FormEntry {

    _select;

    constructor(form, attribute) {
        super(form, attribute);
    }

    async renderValue(value) {
        if (value) {
            if (!this._attribute.multiple)
                value = [value];
        } else
            value = [];

        var $div = $('<div/>').addClass('value');

        this._select = new Select(this._id, this._attribute.model, this._form.getCallback());
        await this._select.initSelect(null, value);
        $div.append(await this._select.render());

        return Promise.resolve($div);
    }

    async readValue() {
        var data;
        if (this._select) {
            var selected = this._select.getSelectedIds();
            if (selected) {
                if (this._attribute.multiple == true)
                    data = selected;
                else {
                    if (selected.length > 0)
                        data = selected[0];
                }
            }
        }
        return Promise.resolve(data);
    }
}