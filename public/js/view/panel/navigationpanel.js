class NavigationPanel extends Panel {

    constructor() {
        super();
    }

    async _renderContent() {
        var $div = $('<div/>');

        var skeleton = [{ name: 'path', dataType: 'string' }];
        var data = { 'path': window.location.pathname + window.location.search + window.location.hash };
        var form = new Form(skeleton, data);
        var $form = await form.renderForm();
        $div.append($form);

        $div.append("<br>");

        var $apply = $('<button>')
            .text('Load')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                this.dispose();

                var fdata = await form.readForm();

                return app.getController().navigate(fdata['path']);
            }.bind(this));
        $div.append($apply);
        return Promise.resolve($div);
    }
}