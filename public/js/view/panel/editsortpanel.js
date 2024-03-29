class EditSortPanel extends Panel {

    static getSortForm(model, sort) {
        var attributes = model.getModelAttributesController().getAttributes(true);
        var options = [];
        for (var attribute of attributes) {
            if (!(attribute['dataType'] === 'relation' || attribute['dataType'] === 'file' && (attribute['storage'] === 'blob' || attribute['storage'] === 'base64'))) {
                if (attribute['persistent'] === undefined || attribute['persistent'] === null || attribute['persistent'])
                    options.push({ 'value': attribute['name'] });
                else
                    options.push({ 'value': attribute['name'], 'disabled': true, 'tooltip': '**INFO**: To sort according to an non-persistent field is currently not supported' });
            }
        }
        var skeleton = [
            {
                name: 'sortCriteria',
                tooltip: 'if undefined default sort depends on used database but most common is oldest record first',
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

    _model;
    _form;

    constructor() {
        super();
    }

    async _renderContent() {
        var $div = $('<div/>');

        var sort;
        var state = app.controller.getStateController().getState();
        this._model = state.getModel();
        if (state['sort'])
            sort = state['sort'];
        else
            sort = this._model.getModelDefaultsController().getDefaultSort();
        this._form = EditSortPanel.getSortForm(this._model, sort);
        var $form = await this._form.renderForm();

        $div.append($form);

        $div.append('<br/>');

        $div.append($('<button/>')
            .html("Set as default")
            .click(async function (event) {
                event.stopPropagation();

                app.controller.setLoadingState(true);
                try {
                    var sort;
                    var data = await this._form.readForm();
                    if (data['sortCriteria'])
                        sort = data['sortCriteria'] + ":" + data['sort'];
                    await this._model.getModelDefaultsController().setDefaultSort(sort);
                    app.controller.setLoadingState(false);
                    alert('Changed successfully');
                } catch (error) {
                    app.controller.setLoadingState(false);
                    app.controller.showError(error);
                }
                return Promise.resolve();
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