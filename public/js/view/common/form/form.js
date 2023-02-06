class Form {

    _skeleton;
    _data;
    _name;

    _callback;

    _entries;
    _$form;

    constructor(skeleton, data) {
        this.init(skeleton, data);
    }

    init(skeleton, data) {
        this._skeleton = skeleton;
        this._data = data;
    }

    getName() {
        return this._name;
    }

    setFormData(data) {
        this._data = data;
    }

    getSkeleton() {
        return this._skeleton;
    }

    setSkeleton(skeleton) {
        this._skeleton = skeleton;
    }

    getFormEntry(name) {
        var entry;
        if (this._entries) {
            for (var e of this._entries) {
                if (e.getName() === name) {
                    entry = e;
                    break;
                }
            }
        }
        return entry;
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

        if (!this._entries) {
            this._entries = [];
            var entry;
            if (this._skeleton) {
                for (var attribute of this._skeleton) {
                    if (attribute['dataType']) {
                        switch (attribute['dataType']) {
                            case "list":
                                entry = new ListFormEntry(this, attribute);
                                break;
                            case "relation":
                                entry = new SelectFormEntry(this, attribute);
                                break;
                            case "file":
                                entry = new FileFormEntry(this, attribute);
                                break;
                            default:
                                entry = new BasicFormEntry(this, attribute);
                        }
                        this._entries.push(entry);
                    }
                }
            }
        }
        if (this._entries) {
            var value;
            for (var entry of this._entries) {
                if (this._data) {
                    if (entry instanceof FileFormEntry) { // entry.getAttribute()['dataType'] == 'file'
                        value = {};
                        var attr = entry.getAttribute();
                        if (attr['storage'] == 'filesystem')
                            value['filename'] = this._data[entry.getName()];
                        else if (attr['filename_prop'])
                            value['filename'] = this._data[attr['filename_prop']];
                        if (attr['url_prop'])
                            value['url'] = this._data[attr['url_prop']];
                    } else
                        value = this._data[entry.getName()];
                } else
                    value = null;
                this._$form.append(await entry.renderEntry(value));
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
                if (entry.isVisible()) {
                    name = entry.getName();
                    val = await entry.readValue(bValidate);
                    if (!(val === null || val === undefined || val === '') || !bSkipNullValues)
                        data[name] = val;
                }
            }
        }
        return Promise.resolve(data);
    }
}