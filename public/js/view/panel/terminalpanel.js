class TerminalPanel extends Panel {

    _$input;
    _$output;

    constructor() {
        super();
    }

    async _renderContent() {
        var $div = $('<div/>')
            .css({ 'padding': '10' });

        this._$input = $('<textarea/>')
            .attr('rows', 5)
            .attr('cols', 80)
            .val('await sleep(1000);\nreturn \'123\';');
        $div.append(this._$input);
        this._$output = $('<textarea/>')
            .attr('rows', 5)
            .attr('cols', 80);
        $div.append(this._$output);
        $div.append("<br/>");

        var $eval = $('<button>')
            .text('Run')
            .click(async function (event) {
                event.stopPropagation();

                try {
                    app.controller.setLoadingState(true);
                    var code = this._$input.val();
                    //eval(code);

                    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
                    var response = await new AsyncFunction(code)();
                    this._$output.val(response);
                    app.controller.setLoadingState(false);
                } catch (error) {
                    app.controller.setLoadingState(false);
                    app.controller.showError(error);
                }

                return Promise.resolve();
            }.bind(this));
        $div.append($eval);

        return Promise.resolve($div);
    }
}