class DiffJsonPanel extends Panel {

    _oldObj;
    _newObj;

    constructor(oldObj, newObj) {
        super();

        this._oldObj = oldObj;
        this._newObj = newObj;
    }

    async _renderContent() {
        var $div = $('<div/>');

        $div.append($('<textarea/>')
            .attr('rows', 5)
            .attr('cols', 80)
            .val(JSON.stringify(this._oldObj, null, '\t')));

        $div.append('<br/>');

        $div.append($('<textarea/>')
            .attr('rows', 5)
            .attr('cols', 80)
            .val(JSON.stringify(this._newObj, null, '\t')));

        $div.append('<br/>');

        var diff = JsDiff.diffJson(this._oldObj, this._newObj);
        var span;
        diff.forEach((part) => {
            const color = part.added ? 'green' :
                part.removed ? 'red' : 'grey';
            span = document.createElement('span');
            span.style.color = color;
            span.appendChild(document
                .createTextNode(part.value));
            $div.append(span);
        });

        return Promise.resolve($div);
    }
}