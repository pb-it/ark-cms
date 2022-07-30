class ModelCache {

    _model;
    _defaultSort;

    _dataCache;
    _urls;
    _completeRecordSet;

    constructor(model) {
        this._model = model;
        this._defaultSort = model.getModelDefaultsController().getDefaultSort();

        this._dataCache = [];
        this._urls = [];
    }

    cache(action, url, data) {
        if (action && action == ActionEnum.create) {
            if (this._completeRecordSet) {
                if (this._defaultSort) {
                    this._completeRecordSet.push(data);
                    this._completeRecordSet = DataService.sortData(this._model, this._defaultSort, this._completeRecordSet);
                } else
                    this._completeRecordSet.unshift(data);
            }
            this._urls = []; // delete outdated queries
        }
        this._urls[url] = data;
        if (Array.isArray(data)) {
            for (var d of data) {
                this._dataCache[d['id']] = d;
            }
        } else
            this._dataCache[data['id']] = data;
    }

    delete(id) {
        this._urls = []; // delete outdated queries
        delete this._dataCache[id];
        if (this._completeRecordSet)
            this._completeRecordSet = this._completeRecordSet.filter(function (x) { return x['id'] != id });
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

    setCompleteRecordSet(data, sort) {
        var sorted;
        if (sort) {
            var sorted;
            if (this._defaultSort && this._defaultSort != sort)
                sorted = DataService.sortData(this._model, this._defaultSort, [...data]);
        }
        if (!sorted)
            sorted = data;
        this._completeRecordSet = sorted;

        for (var d of data) {
            this._dataCache[d['id']] = d;
        }
    }

    getCompleteRecordSet() {
        return this._completeRecordSet;
    }
}