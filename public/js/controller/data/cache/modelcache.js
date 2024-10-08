class ModelCache {

    _model;
    _defaultSort;

    _dataCache;
    _urls;
    _completeRecordSet;

    _bIncrements;
    _db;

    constructor(model) {
        this._model = model;
        var tmp = model.getModelDefaultsController().getDefaultSort();
        if (tmp) {
            var parts = tmp.split(':');
            if (parts.length == 2) {
                var attribute = model.getModelAttributesController().getAttribute(parts[0]);
                if (attribute['persistent'] === undefined || attribute['persistent'] === null || attribute['persistent'])
                    this._defaultSort = tmp;
            }
        }

        this._dataCache = [];
        this._urls = [];

        this._bIncrements = this._model.getDefinition()['options']['increments'];
        var db = app.getController().getDatabase();
        if (db && !this._model.getName().startsWith('_') && this._bIncrements)
            this._db = db;
    }

    async initCache() {
        if (this._db) {
            var rs = await this._db.getAll(this._model.getName());
            if (rs)
                await this.setCompleteRecordSet(rs);
        }
        return Promise.resolve();
    }

    async cacheData(url, data) {
        var bNew = false;
        if (Array.isArray(data)) {
            var id;
            var bExist;
            for (var d of data) {
                id = d['id'];
                bExist = this._dataCache[id];
                this._dataCache[d['id']] = d;
                if (!bExist && !bNew)
                    bNew = true;
            }
        } else {
            var id = data['id'];
            var bExist = this._dataCache[id];
            this._dataCache[id] = data;
            if (!bExist && !bNew)
                bNew = true;
        }
        if (this._completeRecordSet && this._db)
            await this._db.put(this._model.getName(), data);

        if (bNew)
            this._urls = []; // delete outdated queries
        if (url)
            this._urls[url] = data;

        if (this._completeRecordSet) {
            this._completeRecordSet = Array.from(this._dataCache.values()).filter(x => x); // remove empty slots
            if (this._defaultSort)
                this._completeRecordSet = DataService.sortData(this._model, this._defaultSort, this._completeRecordSet);
        }
        return Promise.resolve();
    }

    async delete(id) {
        this._urls = []; // delete outdated queries
        delete this._dataCache[id];
        if (this._completeRecordSet) {
            this._completeRecordSet = this._completeRecordSet.filter(function (x) { return x['id'] != id });
            if (this._db)
                await this._db.delete(this._model.getName(), id);
        }
        return Promise.resolve();
    }

    getUrl(url) {
        var res;
        if (this._urls[url]) {
            res = [];
            for (var item of this._urls[url]) {
                res.push(this._dataCache[item['id']]);
            }
        }
        return res;
    }

    getEntry(id) {
        var res;
        if (id) {
            if (Array.isArray(id)) {
                res = [];
                var data;
                for (var i of id) {
                    data = this._dataCache[i];
                    if (data)
                        res.push(data);
                }
            } else
                res = this._dataCache[id];
        }
        else
            res = this._dataCache;
        return res;
    }

    async setCompleteRecordSet(data, sort, id) {
        var sorted;
        if (this._defaultSort) {
            var sorted;
            if (!sort || this._defaultSort != sort)
                sorted = DataService.sortData(this._model, this._defaultSort, [...data]);
        }
        if (!sorted)
            sorted = data;
        this._completeRecordSet = sorted;

        if (this._bIncrements) {
            this._dataCache = [];
            for (var d of data) {
                this._dataCache[d['id']] = d;
            }
        }

        if (this._db && id) {
            const name = this._model.getName();
            await this._db.initObjectStore(name, data, id);
        }
        return Promise.resolve();
    }

    async getCompleteRecordSet() {
        return Promise.resolve(this._completeRecordSet);
    }
}