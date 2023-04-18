class CachePanel extends Panel {

    _cache;

    constructor() {
        super();

        this._cache = app.getController().getDataService().getCache();
    }

    async _renderContent() {
        var $div = $('<div/>');
        var $table = $('<table>');
        var $row;
        var $col;
        var size;
        var $button;

        var arr = this._cache.getModelCache();
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

        $button = $('<button>')
            .text('Update')
            .click(typeString, async function (event) {
                event.stopPropagation();
                await this._cache.update();
                await this.render();
                return Promise.resolve();
            }.bind(this));
        $div.append($button);
        $div.append("<br>");

        var db = app.getController().getDatabase();
        if (db) {
            $div.append('IndexedDB:<br>');
            $button = $('<button>')
                .text('Reconnect')
                .click(typeString, async function (event) {
                    event.stopPropagation();

                    var controller = app.getController();
                    try {
                        controller.setLoadingState(true);

                        await db.initDatabase();
                        controller.setLoadingState(false);
                        alert('Reconnected!');
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }
                    return Promise.resolve();
                }.bind(this));
            $div.append($button);
            $button = $('<button>')
                .text('Clear Database')
                .click(typeString, async function (event) {
                    event.stopPropagation();

                    var controller = app.getController();
                    try {
                        controller.setLoadingState(true);

                        await db.deleteDatabase();
                        await db.initDatabase();
                        controller.setLoadingState(false);
                        alert('Database cleared!');
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }
                    return Promise.resolve();
                }.bind(this));
            $div.append($button);
        }

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