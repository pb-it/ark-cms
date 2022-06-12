class NavigationPanel extends Panel {

    constructor() {
        super();
    }

    async _renderContent() {
        var $div = $('<div/>');

        var skeleton = [{ name: 'url', dataType: 'string' }];
        var data = { 'url': window.location.href };
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
                var url = new URL(fdata.url);
                var state = State.getStateFromUrl(url);
                app.controller.loadState(state, true);
            }.bind(this));
        $div.append($apply);
        return Promise.resolve($div);
    }
}