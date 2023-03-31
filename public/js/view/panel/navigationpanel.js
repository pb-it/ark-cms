class NavigationPanel extends Panel {

    _$form;

    constructor() {
        super();
    }

    async _renderContent() {
        var $div = $('<div/>');

        var skeleton = [{ id: 'path', name: 'path', dataType: 'string' }];
        var data = { 'path': window.location.pathname + window.location.search + window.location.hash };
        var form = new Form(skeleton, data);
        this._$form = await form.renderForm();
        this._$form.on('submit', async function () {
            this.dispose();
            var fdata = await form.readForm();
            await app.getController().navigate(fdata['path']);
            return true;
        }.bind(this));
        $div.append(this._$form);

        $div.append("<br>");

        var $apply = $('<button>')
            .text('Load')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                this._$form.submit();

                return Promise.resolve();
            }.bind(this));
        $div.append($apply);
        return Promise.resolve($div);
    }
}