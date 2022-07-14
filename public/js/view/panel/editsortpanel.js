class EditSortPanel extends Panel {

    static getSortForm(model, sort) {
        var attributes = model.getModelAttributesController().getAttributes(true);
        var sortAttr = attributes.filter(function (x) { return !(x['dataType'] === 'relation' || x['dataType'] === 'blob' || x['dataType'] === 'base64') });
        var options = sortAttr.map(function (x) { return { 'value': x['name'] } });
        var skeleton = [
            {
                name: 'sortCriteria',
                tooltip: 'default sort depends on used database but is mostly newest records first',
                dataType: 'enumeration',
                options: options,
                view: 'select'
            },
            { name: 'sort', dataType: 'enumeration', options: [{ 'value': 'asc' }, { 'value': 'desc' }], required: true, defaultValue: 'asc', view: 'select' }
        ];
        var data = {};
        if (sort) {
            var parts = sort.split(":");
            if (parts.length == 2) {
                data['sortCriteria'] = parts[0];
                data['sort'] = parts[1];
            }
        }
        return new Form(skeleton, data);
    }

    _form;

    constructor() {
        super();
    }

    async _renderContent() {
        var $div = $('<div/>');

        var state = app.controller.getStateController().getState();
        this._form = EditSortPanel.getSortForm(state.getModel(), state['sort']);
        var $form = await this._form.renderForm();

        $div.append($form);

        $div.append('<br/>');

        $div.append($('<button/>')
            .html("Set as default")
            .click(async function (event) {
                event.stopPropagation();

                try {
                    var sort;
                    var data = await this._form.readForm();
                    if (data['sortCriteria'])
                        sort = data['sortCriteria'] + ":" + data['sort'];
                    await this._model.getModelDefaultsController().setDefaultSort(sort);
                } catch (error) {
                    app.controller.showError(error);
                }
            }.bind(this))
        );
        $div.append($('<button/>')
            .css({ 'float': 'right' })
            .text("Apply")
            .click(async function (event) {
                event.preventDefault();

                var sort;
                var data = await this._form.readForm();
                if (data['sortCriteria'])
                    sort = data['sortCriteria'] + ":" + data['sort'];

                var state = app.controller.getStateController().getState();
                if (sort)
                    state['sort'] = sort;
                else
                    delete state['sort'];
                app.controller.loadState(state, false, true);

                this.dispose();
                return Promise.resolve();
            }.bind(this)));
        return Promise.resolve($div);
    }
}