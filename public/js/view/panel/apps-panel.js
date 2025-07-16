class AppsPanel extends Panel {

    constructor() {
        super();
    }

    async _init() {
        super._init();
        this._$panel.css({
            'background': 'white',
            'minHeight': '400px'
        });
        return Promise.resolve();
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({
                'padding': '10'
            });

        var iColumns = 8;
        var iRows = 3;
        var $table = $('<table/>');
        var $row;
        var $cell;
        var panel;
        var $d;
        for (var i = 0; i < iRows; i++) {
            $row = $('<tr/>');
            for (var j = 0; j < iColumns; j++) {
                $cell = $('<td/>');
                panel = new Panel();
                $d = $('<div/>')
                    .css({
                        'width': '200px',
                        'height': '200px',
                        'background': '#e9e9e9'
                    });
                panel.setContent($d);
                $cell.append(await panel.render());
                $row.append($cell);
            }
            $table.append($row);
        }
        $div.append($table);

        return Promise.resolve($div);
    }
}