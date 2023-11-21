class NavigationPanel extends Panel {

    _$form;

    constructor() {
        super();
    }

    async _renderContent() {
        var $div = $('<div/>')
            .css({ 'padding': '10' });

        var skeleton = [{ id: 'path', name: 'path', dataType: 'string' }];
        var data = { 'path': window.location.pathname + window.location.search + window.location.hash };
        var form = new Form(skeleton, data);
        this._$form = await form.renderForm();
        this._$form.on('submit', async function () {
            const controller = app.getController();
            try {
                var fdata = await form.readForm();
                await controller.navigate(fdata['path']);
                this.dispose();
            } catch (error) {
                controller.showError(error);
            }
            return Promise.resolve();
        }.bind(this));
        $div.append(this._$form);

        var $load = $('<button>')
            .text('Load')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                this._$form.submit();

                return Promise.resolve();
            }.bind(this));
        $div.append($load);

        var $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }
}