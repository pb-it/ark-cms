class JsonPanel extends Panel {

    _obj;

    constructor(obj) {
        super();
        this._obj = obj;
    }

    async _renderContent() {
        var html;
        if (this._obj) {
            if (typeof this._obj === 'object')
                html = JSON.stringify(this._obj, null, '&emsp;').replace(/(?:\r\n|\r|\n)/g, '<br>');
            else if (typeof this._obj === 'string')
                html = this._obj;
        }
        if (!html)
            html = '';
        var $div = $('<div/>')
            .html(html);
        return Promise.resolve($div);
    }
}