class EditModelMiscPanel extends Panel {

    _model;

    _publicForm;

    constructor(model) {
        super({ 'title': 'Misc.' });

        this._model = model;
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        const def = this._model.getDefinition();
        var skeleton = [
            {
                name: 'public',
                tooltip: '**INFO**: Grant access to data without authentication.',
                dataType: 'boolean',
                required: true,
                defaultValue: false
            }
        ];
        var data = { 'public': def['public'] };
        this._publicForm = new Form(skeleton, data);
        var $form = await this._publicForm.renderForm();
        $div.append($form);
        $div.append('</br>');

        return Promise.resolve($div);
    }

    async getData() {
        var data;
        if (this._bRendered) {
            data = {
                ...await this._publicForm.readForm()
            };
        }
        return Promise.resolve(data);
    }
}