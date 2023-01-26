class CrudStatePanel extends Panel {

    _action;
    _state;

    constructor(action, state) {
        super();
        this._action = action;
        this._state = state;
    }

    async _renderContent() {
        var $div = $('<div/>');

        var skeleton = [{ name: "name", dataType: "string", required: true, 'readonly': this._action == ActionEnum.update },
        { name: "typeString", dataType: "string", required: true },
        { name: "id", dataType: "integer" },
        { name: "where", dataType: "string" },
        { name: "sort", dataType: "string" },
        { name: "limit", dataType: "string" },
        { name: "filters", dataType: "text" },
        { name: "bIgnoreCache", dataType: "boolean" },
        { name: "comment", dataType: "text" }];
        var state = new State(this._state);
        if (state.filters && state.filters.length > 0) {
            state.filters = JSON.stringify(state.filters);
        }
        var form = new Form(skeleton, state);
        var $form = await form.renderForm();

        $form.append('<br/><br/>');

        var label;
        if (this._action == ActionEnum.create)
            label = 'Save';
        else
            label = 'Update';
        $form.append($('<button/>')
            .html(label)
            .click(async function (event) {
                event.stopPropagation();

                app.controller.setLoadingState(true);
                try {
                    var newState = await form.readForm();
                    if (newState.name && newState.name != "") {
                        if (newState.filters)
                            newState.filters = JSON.parse(newState.filters);
                        this._state = newState;

                        var msc = app.controller.getModelController().getModel(this._state['typeString']).getModelStateController();
                        await msc.saveState(this._state, this._action == ActionEnum.update);
                        //TODO: await app.controller.getBookmarkController().addBookmark(newState);

                        //this.render();
                        app.controller.setLoadingState(false);
                        alert(label + 'd successfully');
                    } else {
                        this._form.getFormEntry('name').getInput().focus();
                        throw new Error("Field 'name' is required");
                    }
                } catch (error) {
                    app.controller.setLoadingState(false);
                    app.controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this))
        );

        if (this._action == ActionEnum.update) {
            $form.append($('<button/>')
                .html("Load")
                .css({ 'float': 'right' })
                .click(async function (event) {
                    event.stopPropagation();
                    var state = await form.readForm();
                    if (state.filters)
                        state.filters = JSON.parse(state.filters);
                    this._load(new State(state));
                }.bind(this))
            );
        }

        $div.append($form);

        return Promise.resolve($div);
    }

    async _load(state) {
        this.dispose();
        app.controller.loadState(state, true);
    }
}