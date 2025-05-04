class TestPanel extends Panel {

    _form;
    _$result;

    constructor() {
        super();
    }

    async _renderContent() {
        const $div = $('<div/>');

        var options = [
            { 'value': 'val1' },
            { 'value': 'val2' },
            { 'value': 'val3' }
        ];

        var skeleton = [
            {
                name: 'testList',
                dataType: 'list',
                options: options,
                columns: 1
            }
        ];

        var data = {
            'testList': ['val1', 'val3']
        };
        this._form = new Form(skeleton, data);
        var $form = await this._form.renderForm();
        $div.append($form);

        $div.append($('<button/>')
            .text('read')
            .click(this._tree, async function (event) {
                event.preventDefault();
                event.stopPropagation();

                const controller = app.getController();
                controller.setLoadingState(true);
                try {
                    await this._renderResult();
                    controller.setLoadingState(false);
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }

                return Promise.resolve();
            }.bind(this))
        );

        this._$result = $('<div/>');
        $div.append(this._$result);

        var $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }

    async _renderResult() {
        this._$result.empty();

        var fData = await this._form.readForm();
        this._$result.append(JSON.stringify(fData['testList']));

        return Promise.resolve();
    }
}