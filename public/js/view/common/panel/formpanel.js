class FormPanel extends Dialog {

    _skeleton;
    _data;
    _form;

    constructor(config, skeleton, data) {
        super(config);
        this._skeleton = skeleton;
        this._data = data;
    }

    getClass() {
        return FormPanel;
    }

    async _renderDialog() {
        this._form = new Form(this._skeleton, this._data);
        var $form = await this._form.renderForm();
        return Promise.resolve($form);
    }

    getForm() {
        return this._form;
    }

    async getData() {
        return this._readData(false);
    }

    async _readData(bValidate) {
        var data;
        if (this._form)
            data = await this._form.readForm({ bValidate: bValidate });
        return Promise.resolve(data);
    }

    async getChanges(bValidate, oldData) {
        var changed;
        if (!oldData)
            oldData = this._data;
        if (oldData) {
            const newData = await this._readData(bValidate);
            changed = await CrudObject.getChanges(this._skeleton, oldData, newData);
        }
        return Promise.resolve(changed);
    }
}