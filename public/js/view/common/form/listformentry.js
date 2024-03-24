class ListFormEntry extends FormEntry {

    _list;
    _listVis;

    constructor(form, attribute) {
        super(form, attribute);
    }

    async renderValue(value) {
        if (this._$value)
            this._$value.empty();
        else
            this._$value = $('<div/>').addClass('value');

        this._list = new List();
        if (this._attribute['options']) {
            var options;
            if (this._attribute['changeAction'])
                options = { 'changeAction': function () { this._attribute['changeAction'](this) }.bind(this) }
            if (value && Array.isArray(value) && value.length > 0) {
                for (var o of this._attribute['options']) {
                    this._list.addEntry(new SelectableListEntry(o['value'], o['value'], options, value.includes(o['value'])));
                }
            } else {
                for (var o of this._attribute['options']) {
                    this._list.addEntry(new SelectableListEntry(o['value'], o['value'], options));
                }
            }
        }

        const vListConfig = {
            alignment: 'vertical',
            selectButtons: true,
            changeAction: this._attribute['changeAction']
        }
        if (this._attribute['columns'])
            vListConfig['columns'] = this._attribute['columns'];
        this._listVis = new SelectableListVis(vListConfig, this._attribute['name'], this._list);
        this._listVis.init();
        this._$value.append(this._listVis.renderList());

        return Promise.resolve(this._$value);
    }

    async readValue() {
        var value;
        if (this._listVis) {
            this._list = this._listVis.getList();
            var selectedEntries = this._list.getEntries().filter(function (x) { return x.isSelected() });
            value = selectedEntries.map(function (x) { return x.getData(); });
        }
        return Promise.resolve(value);
    }
}