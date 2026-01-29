class TextPanel extends Panel {

    _text;

    constructor(text) {
        super();
        this._text = text;
    }

    async _renderContent() {
        const $div = $('<div/>')
            .addClass('pre')
            .html(this._text);
        return Promise.resolve($div);
    }
}