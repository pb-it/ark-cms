class CreateFilterPanel extends Panel {

    static objectToQuery(obj) {
        var res;
        var skeleton = obj.getSkeleton(true);
        var data = obj.getData();
        var strBuilder;
        var str;
        var value;
        var field;
        for (var property in data) {
            str = "";
            value = data[property];
            if (value) {
                field = skeleton.find(x => x.name === property);
                if (field) {
                    if (field['dataType'] === "relation") {
                        if (Array.isArray(value)) {
                            if (value.length > 0) {
                                var arr = [];
                                for (var item of value) {
                                    if (Number.isInteger(item))
                                        arr.push(item);
                                    else
                                        arr.push(item.id);
                                }
                                str = "@." + property + "[*].id==" + arr.join(",");
                            }
                        } else {
                            str = "@." + property + ".id==" + value;
                        }
                    } else {
                        if (typeof value === 'number' || typeof value === 'string' || value instanceof String) {
                            str = "@." + property + "==\"" + value + "\"";
                        } else
                            console.log(typeof value);
                    }
                }
            }

            if (str) {
                if (strBuilder && strBuilder.length > 0)
                    strBuilder += " && " + str;
                else
                    strBuilder = str;
            }
        }
        if (strBuilder)
            res = "$.[?(" + strBuilder + ")]";
        return res;
    }

    _model;
    _filter;

    _form;
    _obj;

    constructor(model, filter) {
        super();
        this._model = model;
        if (filter)
            this._filter = filter;
        else
            this._filter = { 'typeString': this._model.getName() };
    }

    async _renderContent() {
        var $div = $('<div/>')
            .append(await this._renderStringForm());
        return Promise.resolve($div);
    }

    async _renderStringForm() {
        var skeleton = [
            { name: "name", dataType: "string" }, //not required when not saving!
            { name: "typeString", label: "model", dataType: "string", readonly: true },
            { name: "query", dataType: "text", required: true },
            { name: "comment", dataType: "text" }];
        this._form = new Form(skeleton, this._filter);
        var $form = await this._form.renderForm();

        $form.append('<br/><br/>');

        var mfc = this._model.getModelFilterController();
        $form.append($('<button/>')
            .text("QueryBuilder")
            .click(async function (event) {
                event.preventDefault();

                if (!this._obj) {
                    this._obj = new CrudObject(this._model.getName());
                }
                var skeleton = this._obj.getSkeleton(true);
                skeleton = [...skeleton];
                for (var attr of skeleton) {
                    if (attr['readonly'])
                        delete attr['readonly'];
                    if (attr['required'])
                        delete attr['required'];
                }
                var panel = new FormPanel(null, skeleton, this._obj.getData());
                panel.setApplyAction(async function () {
                    event.preventDefault();

                    app.controller.setLoadingState(true);
                    try {
                        var data = await panel.getForm().readForm();
                        this._obj.setData(data);
                        this._filter = await this._form.readForm(true, false);
                        this._filter.query = CreateFilterPanel.objectToQuery(this._obj);
                        this.render();
                        panel.dispose();
                        app.controller.setLoadingState(false);
                    } catch (error) {
                        app.controller.setLoadingState(false);
                        app.controller.showError(error);
                    }
                    return Promise.resolve();
                }.bind(this));
                return app.controller.getModalController().openPanelInModal(panel);
            }.bind(this)));

        $form.append(SPACE);

        $form.append($('<button/>')
            .text("Save")
            .click(async function (event) {
                event.preventDefault();

                app.controller.setLoadingState(true);
                try {
                    var newFilter = await this._form.readForm();
                    if (newFilter.name && newFilter.name != "") {
                        await mfc.saveFilter(newFilter);
                        this._filter = newFilter;
                        //this.render();
                        alert('Saved successfully');
                    } else {
                        this._form.getFormEntry('name').getInput().focus();
                        throw new Error("Field 'name' is required");
                    }

                    app.controller.setLoadingState(false);
                } catch (error) {
                    app.controller.setLoadingState(false);
                    app.controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this)));

        $form.append(SPACE);

        $form.append($('<button/>')
            .text("Update")
            .click(async function (event) {
                event.preventDefault();

                app.controller.setLoadingState(true);
                try {
                    var newFilter = await this._form.readForm();
                    if (newFilter.name && newFilter.name != "") {
                        if (this._filter.name)
                            await mfc.deleteFilter(this._filter);
                        await mfc.saveFilter(newFilter, true);
                        this._filter = newFilter;
                        //this.render();
                        alert('Updated successfully');
                    } else {
                        this._form.getFormEntry('name').getInput().focus();
                        throw new Error("Field 'name' is required");
                    }

                    app.controller.setLoadingState(false);
                } catch (error) {
                    app.controller.setLoadingState(false);
                    app.controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this)));

        $form.append($('<button/>')
            .text("Filter")
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.preventDefault();
                this._applyFilter(await this._form.readForm());
            }.bind(this)));
        return Promise.resolve($form);
    }

    _applyFilter(filter) {
        var state = app.controller.getStateController().getState();

        if (state.filters) {
            var bReplaced = false;
            for (var i = 0; i < state.filters.length; i++) {
                if (state.filters[i].name === filter.name) {
                    state.filters[i] = filter;
                    bReplaced = true;
                    break;
                }
            }
            if (!bReplaced)
                state.filters.push(filter);
        } else
            state.filters = [filter];

        app.controller.loadState(state, true);

        this.dispose();
    }
}