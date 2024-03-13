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

    getFormData() {
        return this._data;
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
        if (name) {
            if (this._entries) {
                for (var e of this._entries) {
                    if (e.getName() === name) {
                        entry = e;
                        break;
                    }
                }
            }
        } else
            entry = this._entries;
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

    async renderForm(bInline = true) {
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
            if (bInline)
                this._$form.addClass('inline');
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
                                var dt;
                                const dtc = app.getController().getDataTypeController();
                                if (dtc)
                                    dt = dtc.getDataType(attribute['dataType']);
                                if (dt) {
                                    var attr;
                                    var C = dt.getFormEntryClass();
                                    if (!C)
                                        C = BasicFormEntry;
                                    const bdt = dt.getBaseDataType();
                                    if (bdt) {
                                        attr = { ...bdt };
                                        attr['name'] = attribute['name'];
                                    } else
                                        attr = attribute;
                                    entry = new C(this, attr);
                                } else
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
                if (this._data)
                    value = this._data[entry.getName()];
                else
                    value = null;
                this._$form.append(await entry.renderEntry(value));
            }
        }
        return Promise.resolve(this._$form);
    }

    async readForm(bSkipNullValues = true, bValidate = true, bIncludeReadonly = true) {
        var data;
        if (this._entries) {
            data = {};

            var name;
            var val;
            for (var entry of this._entries) {
                if (entry.isVisible() && (entry.isEditable() || bIncludeReadonly)) {
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