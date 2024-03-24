class DeleteModelPanel extends Panel {

    _model;

    constructor(model) {
        super();
        this._model = model;
    }

    async _init() {
        await super._init();
        const ref = await app.getController().getModelController().getRelations(this._model);
        console.log(ref);
        return Promise.resolve;
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        $div.append("<b>Warning:</b> Are you sure you want to permanently delete the model '" + this._model.getName() + "'?<br/><br/>");

        const skeleton = [
            {
                name: "deleteRecords",
                label: "Also delete all entries/records",
                dataType: "boolean",
                required: true,
                defaultValue: false,
                view: "labelRight",
                readonly: true
            }
        ];
        const form = new Form(skeleton, {});
        $div.append(await form.renderForm());

        $div.append("<br/>");

        const $abort = $('<button/>')
            .text("Cancel") //Abort
            .click(async function (event) {
                event.preventDefault();
                this.dispose();
            }.bind(this));
        $div.append($abort);
        const $confirm = $('<button/>')
            .text("Delete") //Confirm
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.preventDefault();

                const controller = app.getController();
                controller.setLoadingState(true);
                try {
                    await this._model.deleteModel();
                    this.dispose();
                    controller.setLoadingState(false);
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this));
        $div.append($confirm);

        return Promise.resolve($div);
    }
}