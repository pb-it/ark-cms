class CachePanel extends Panel {

    constructor() {
        super();
    }

    async _renderContent() {
        var $div = $('<div/>');
        var $table = $('<table>');
        var $row;
        var $col;
        var size;
        var $button;

        var cache = app.controller.getDataService().getCache();
        var arr = cache.getModelCache();
        for (var typeString in arr) {
            $row = $('<tr>');
            $col = $('<td>').text(typeString);
            $row.append($col);

            size = Object.keys(arr[typeString].getEntry()).length;

            $col = $('<td>').text(size);
            $row.append($col);

            $col = $('<td>');
            $button = $('<button>')
                .text('Clear')
                .click(typeString, function (event) {
                    event.stopPropagation();
                    delete arr[event.data];
                    this.render();
                }.bind(this));
            $col.append($button);
            $row.append($col);

            $table.append($row);
        }
        $div.append($table);
        $div.append("<br>");

        /*$table = $('<table>');
        var urls = cache.getCachedUrls();
        for (var url in urls) {
            $row = $('<tr>');
            $col = $('<td>').text(url);
            $row.append($col);
            $col = $('<td>').text(urls[url].length);
            $row.append($col);

            $col = $('<td>');
            $button = $('<button>')
                .text('Remove')
                .click(url, function (event) {
                    event.stopPropagation();
                    var ds = app.controller.getDataService();
                    var cache = ds.getCache();
                    cache.removeCachedUrl(event.data);
                    this.render();
                }.bind(this));
            $col.append($button);
            $row.append($col);

            $table.append($row);
        }
        $div.append($table);*/
        return Promise.resolve($div);
    }
}