class Dialog extends Panel {

    _applyAction;

    constructor(config) {
        super(config)
    }

    getClass() {
        return Dialog;
    }

    /**
    * Function for setting the action which gets triggered when user press apply
    * @param    {function} action    Function
    */
    setApplyAction(action) {
        this._applyAction = action;
    }

    async _renderContent() {
        var $dialog = $('<div/>')
            .addClass('dialog')
            .css({ 'display': 'inline-block' });
        $dialog.append(await this._renderDialog());

        if (this._applyAction) {
            $dialog.append('<br/>');
            var $div = $('<div/>')
            $div.append($('<button/>')
                .html("Apply")
                .css({ 'float': 'right' })
                .click(async function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    try {
                        if (await this._applyAction(this))
                            this.dispose();
                    } catch (error) {
                        app.controller.showError(error);
                    }

                    return Promise.resolve();
                }.bind(this))
            );
            $dialog.append($div);
        }
        return Promise.resolve($dialog);
    }

    async _renderDialog() {
        return Promise.resolve();
    }
}