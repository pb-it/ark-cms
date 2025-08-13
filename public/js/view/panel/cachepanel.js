class CachePanel extends TabPanel {

    _cache;
    _db;

    _$cachePanel;
    _$databasePanel;
    _$offlinePanel;

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

        if (app.getController().getConfigController().experimentalFeaturesEnabled()) {
            this._$offlinePanel = await this._createOfflinePanel();
            this._panels.push(this._$offlinePanel);
        }

        await this.openTab(this._$cachePanel);

        return Promise.resolve();
    }

    async _createCachePanel() {
        const panel = new Panel({ 'title': 'Cache' });
        panel._renderContent = async function () {
            const controller = app.getController();
            const bLoading = controller.getLoadingState();
            if (!bLoading)
                controller.setLoadingState(true);

            const $div = $('<div/>');
            var $table = $('<table>');
            var $row;
            var $col;
            var size;
            var $button;

            const arr = this._cache.getModelCache();
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
            $div.append('<br>');

            if (!this._db) {
                $button = $('<button>')
                    .text('Update')
                    .click(async function (event) {
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
        const panel = new Panel({ 'title': 'Database' });
        panel._renderContent = async function () {
            const controller = app.getController();
            const bLoading = controller.getLoadingState();
            if (!bLoading)
                controller.setLoadingState(true);

            const $div = $('<div/>');
            if (this._db.isConnected()) {
                var $table = $('<table>');
                var arr = await this._db.getObjectStoreNames();
                if (arr) {
                    var $row;
                    var $col;
                    var size;
                    var id;
                    var $button;

                    $row = $('<tr>');
                    $col = $('<th>').text('model');
                    $row.append($col);
                    $col = $('<th>').text('count');
                    $row.append($col);
                    $col = $('<th>').text('state').attr('title', 'Change ID');
                    $row.append($col);
                    $table.append($row);

                    const meta = this._db.getMetaData();
                    for (var typeString of arr) {
                        $row = $('<tr>');
                        $col = $('<td>').text(typeString);
                        $row.append($col);

                        size = await this._db.count(typeString);
                        $col = $('<td>').css({ 'min-width': '50px' }).text(size);
                        $row.append($col);

                        id = meta[typeString];
                        $col = $('<td>').css({ 'min-width': '50px' }).text(id);
                        $row.append($col);

                        $col = $('<td>');
                        $button = $('<button>')
                            .text('Clear')
                            .click(typeString, async function (event) {
                                event.stopPropagation();

                                controller.setLoadingState(true);
                                try {
                                    await this._db.deleteObjectStore(event.data);
                                    await this._cache.deleteModelCache(event.data);
                                    controller.setLoadingState(false);
                                } catch (error) {
                                    controller.setLoadingState(false);
                                    controller.showError(error);
                                }

                                this._$databasePanel.render();
                                return Promise.resolve();
                            }.bind(this));
                        $col.append($button);
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
                }
                $div.append($table);
                $div.append("<br>");
            } else
                $div.append("Not connected!<br>");

            $button = $('<button>')
                .text('Reload All')
                .click(async function (event) {
                    event.stopPropagation();

                    controller.setLoadingState(true);
                    try {
                        //var meta = this._db.getMetaData();
                        var names = this._db.getObjectStoreNames();
                        if (names) {
                            var promises = [];
                            for (var x of names) {
                                promises.push(this._relaod(x));
                            }
                            await Promise.all(promises);
                        }
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
                        await this._db.initDatabase(null, true);
                        controller.setLoadingState(false);
                        alert('Database cleared!');
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }

                    await this._$databasePanel.render();
                    return Promise.resolve();
                }.bind(this));
            $div.append($button);

            if (!bLoading)
                controller.setLoadingState(false);

            return Promise.resolve($div);
        }.bind(this);

        return Promise.resolve(panel);
    }

    async _createOfflinePanel() {
        const panel = new Panel({ 'title': 'Offline Mode' });
        panel._renderContent = async function () {
            const controller = app.getController();
            controller.setLoadingState(true);

            const $div = $('<div/>');

            const $offline = $('<input/>')
                .attr('type', 'checkbox')
                .prop('id', 'offlineMode')
                .prop('checked', controller._bOfflineMode)
                .click(function () {
                    controller._bOfflineMode = this.checked;
                    controller.getView().getSideNavigationBar().updateSideNavigationBar();
                });
            const $label = $('<label/>')
                .attr('for', 'offlineMode')
                .append('Enable');
            $div.append($offline);
            $div.append($label);
            $div.append('<br>');

            const ds = controller.getDataService();
            if (ds._pending.length > 0) {
                $div.append('<h3>Pending:</h3>');

                const $table = $('<table>');
                var $row;
                var $col;
                for (var entry of ds._pending) {
                    $row = $('<tr>');
                    $col = $('<td>').text(entry['typeString']);
                    $row.append($col);
                    $table.append($row);
                }
                $div.append($table);
                $div.append('<br>');

                const $button = $('<button>')
                    .text('Update')
                    .click(async function (event) {
                        event.stopPropagation();

                        const controller = app.getController();
                        try {
                            controller.setLoadingState(true);
                            if (controller._bOfflineMode) {
                                const ds = controller.getDataService();
                                if (ds._pending.length > 0) {
                                    controller._bOfflineMode = false;
                                    for (var entry of ds._pending) {
                                        await ds.request(entry['typeString'], entry['action'], entry['id'], entry['data']);
                                    }
                                    controller._bOfflineMode = true;
                                    ds._pending = [];
                                }
                            }
                            //await this._cache.update();
                            await controller._updateDatabase(true);
                            await this._$offlinePanel.render();
                            controller.setLoadingState(false);
                        } catch (error) {
                            controller.setLoadingState(false);
                            controller.showError(error);
                        }
                        return Promise.resolve();
                    }.bind(this));
                $div.append($button);
                $div.append('<br>');
            }

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