class JsonPanel extends Panel {

    _obj;

    constructor(obj) {
        super();
        this._obj = obj;
    }

    async _renderContent() {
        var $div = $('<div/>')
            .html(JSON.stringify(this._obj, null, '&emsp;').replace(/(?:\r\n|\r|\n)/g, '<br>'));
        return Promise.resolve($div);
    }
}