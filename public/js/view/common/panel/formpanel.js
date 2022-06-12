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
}