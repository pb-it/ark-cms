class Form {

    _skeleton;
    _data;
    _name;

    _callback;

    _entries;
    _$form;

    constructor(skeleton, data) {
        this._skeleton = skeleton;
        this._data = data;
    }

    getName() {
        return this._name;
    }

    setData(data) {
        this._data = data;
    }

    getSkeleton() {
        return this._skeleton;
    }

    getFormEntry(name) {
        return this._entries.filter(function (x) { return x.getName() === name })[0];
    }

    getEntries() {
        return this._entries;
    }

    setCallback(callback) {
        this._callback = callback;
    }

    getCallback() {
        return this._callback;
    }

    async renderForm() {
        //<form action="javascript:void(0);" id="filter" enctype="multipart/form-data" method="post"></form>

        if (this._$form)
            this._$form.empty();
        else {
            this._$form = $('<form/>')
                .addClass('crudform')
                .submit(function (event) {
                    event.preventDefault();
                    return false;
                });
        }

        /*if (this._data && this._data.id)
            this._$form.append("<input type='hidden' name='id' id='id' value='" + this._data.id + "' />");*/

        this._entries = [];

        var entry;

        var value;

        var $label;

        if (this._skeleton) {
            var bFirst = true;
            for (var attribute of this._skeleton) {
                if (!attribute.hidden && attribute['dataType']) {
                    if (bFirst)
                        bFirst = false;
                    else
                        this._$form.append("<br>");

                    switch (attribute['dataType']) {
                        case "list":
                            entry = new ListFormEntry(this, attribute);
                            break;
                        case "relation":
                            entry = new SelectFormEntry(this, attribute);
                            break;
                        case "base64":
                        case "blob":
                        case "file":
                            entry = new FileFormEntry(this, attribute);
                            break;
                        default:
                            entry = new BasicFormEntry(this, attribute);
                    }
                    this._entries.push(entry);

                    $label = entry.renderLabel();
                    if ($label)
                        this._$form.append($label);

                    if (this._data)
                        value = this._data[attribute.name];
                    else
                        value = null;
                    this._$form.append(await entry.renderValue(value));
                }
            }
        }

        return Promise.resolve(this._$form);
    }

    async readForm(bSkipNullValues = true, bValidate = true) {
        var data;
        if (this._entries) {
            data = {};

            var name;
            var val;
            for (var entry of this._entries) {
                name = entry.getName();
                val = await entry.readValue(bValidate);
                if (!(val === null || val === undefined || val === '') || !bSkipNullValues)
                    data[name] = val;
            }
        }
        return Promise.resolve(data);
    }
}