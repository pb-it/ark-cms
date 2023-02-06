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

        var selected;
        if (value)
            selected = value.map(function (x) { return x['value'] })

        this._list = new List();
        if (this._attribute['options']) {
            if (selected) {
                for (var o of this._attribute['options']) {
                    this._list.addEntry(new SelectableListEntry(o['value'], null, selected.includes(o['value'])));
                }
            } else {
                for (var o of this._attribute['options']) {
                    this._list.addEntry(new SelectableListEntry(o['value']));
                }
            }
        }

        var vListConfig = {
            alignment: 'vertical',
            selectButtons: true
        }
        this._listVis = new SelectableListVis(vListConfig, 'attributes', this._list);
        this._listVis.init();
        this._$value.append(this._listVis.renderList());

        return Promise.resolve(this._$value);
    }

    async readValue() {
        var value;
        if (this._listVis) {
            this._list = this._listVis.getList();
            var selectedEntries = this._list.getEntries().filter(function (x) { return x.isSelected() });
            value = selectedEntries.map(function (x) {
                return { 'value': x.getName() };
            });
        }
        return Promise.resolve(value);
    }
}