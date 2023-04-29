class CachePanel extends TabPanel {

    _cache;
    _db;

    _$cachePanel;
    _$databasePanel;

    constructor(config) {
        super(config);

        var controller = app.getController();
        this._cache = controller.getDataService().getCache();
        this._db = controller.getDatabase();
    }

    async _init() {
        await super._init();

        this._$cachePanel = await this._createCachePanel();
        this._panels.push(this._$cachePanel);

        if (this._db) {
            this._$databasePanel = await this._createDatabasePanel();
            this._panels.push(this._$databasePanel);
        }

        await this.openTab(this._$cachePanel);

        return Promise.resolve();
    }

    async _createCachePanel() {
        var panel = new Panel({ 'title': 'Cache' });
        panel._renderContent = async function () {
            var controller = app.getController();
            var bLoading = controller.getLoadingState();
            if (!bLoading)
                controller.setLoadingState(true);

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
                    .click(typeString, async function (event) {
                        event.stopPropagation();

                        controller.setLoadingState(true);
                        try {
                            await this._cache.deleteModelCache(event.data);
                            controller.setLoadingState(false);
                        } catch (error) {
                            controller.setLoadingState(false);
                            controller.showError(error);
                        }

                        this._$cachePanel.render();
                        return Promise.resolve();
                    }.bind(this));
                $col.append($button);
                $row.append($col);

                $table.append($row);
            }
            $div.append($table);
            $div.append("<br>");

            if (!this._db) {
                $button = $('<button>')
                    .text('Update')
                    .click(typeString, async function (event) {
                        event.stopPropagation();
                        await this._cache.update();
                        await this._$cachePanel.render();
                        return Promise.resolve();
                    }.bind(this));
                $div.append($button);
            }

            if (!bLoading)
                controller.setLoadingState(false);

            return Promise.resolve($div);
        }.bind(this);

        return Promise.resolve(panel);
    }

    async _createDatabasePanel() {
        var panel = new Panel({ 'title': 'Database' });
        panel._renderContent = async function () {
            var controller = app.getController();
            var bLoading = controller.getLoadingState();
            if (!bLoading)
                controller.setLoadingState(true);

            var $div = $('<div/>');
            var $table = $('<table>');
            var $row;
            var $col;
            var size;
            var timestamp;
            var $button;

            var arr = await this._db.getObjectStoreNames();
            var meta = this._db.getMetaData();
            for (var typeString of arr) {
                $row = $('<tr>');
                $col = $('<td>').text(typeString);
                $row.append($col);

                size = await this._db.count(typeString);
                $col = $('<td>').text(size);
                $row.append($col);

                timestamp = meta[typeString];
                $col = $('<td>').text(timestamp);
                $row.append($col);

                $col = $('<td>');
                $button = $('<button>')
                    .text('Reload')
                    .click(typeString, async function (event) {
                        event.stopPropagation();

                        controller.setLoadingState(true);
                        try {
                            await this._relaod(event.data);
                            controller.setLoadingState(false);
                        } catch (error) {
                            controller.setLoadingState(false);
                            controller.showError(error);
                        }

                        this._$databasePanel.render();
                        return Promise.resolve();
                    }.bind(this));
                $col.append($button);
                $row.append($col);

                $table.append($row);
            }
            $div.append($table);
            $div.append("<br>");

            $button = $('<button>')
                .text('Reload All')
                .click(async function (event) {
                    event.stopPropagation();

                    controller.setLoadingState(true);
                    try {
                        //var meta = this._db.getMetaData();
                        var names = this._db.getObjectStoreNames();
                        var promises = [];
                        for (var x of names) {
                            promises.push(this._relaod(x));
                        }
                        await Promise.all(promises);
                        controller.setLoadingState(false);
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }

                    await this._$databasePanel.render();
                    return Promise.resolve();
                }.bind(this));
            $div.append($button);

            $button = $('<button>')
                .text('Update')
                .click(async function (event) {
                    event.stopPropagation();

                    controller.setLoadingState(true);
                    try {
                        var timestamp = await this._db.updateDatabase();
                        if (timestamp)
                            alert('Updated successfully!');
                        else
                            alert('Nothing to update!');
                        controller.setLoadingState(false);
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }

                    await this._$databasePanel.render();
                    return Promise.resolve();
                }.bind(this));
            $div.append($button);
            $div.append("<br>");

            $button = $('<button>')
                .text('Reconnect')
                .click(typeString, async function (event) {
                    event.stopPropagation();

                    try {
                        controller.setLoadingState(true);

                        await this._db.initDatabase();
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

                    try {
                        controller.setLoadingState(true);

                        await this._db.deleteDatabase();
                        await this._db.initDatabase();
                        controller.setLoadingState(false);
                        alert('Database cleared!');
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }
                    return Promise.resolve();
                }.bind(this));
            $div.append($button);

            if (!bLoading)
                controller.setLoadingState(false);

            return Promise.resolve($div);
        }.bind(this);

        return Promise.resolve(panel);
    }

    async _relaod(modelName) {
        await this._db.clearObjectStore(modelName);
        await this._cache.deleteModelCache(modelName);
        await app.getController().getDataService().fetchData(modelName, null, null, null, null, null, null, true);
        return Promise.resolve();
    }
}