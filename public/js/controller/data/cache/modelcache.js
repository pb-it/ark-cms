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
                this._completeRecordSet.push(data);
                if (this._defaultSort)
                    this._completeRecordSet = DataService.sortData(this._model, this._defaultSort, this._completeRecordSet);
            }
            this._urls = []; // delete outdated queries
        }
        this._urls[url] = data;
        if (Array.isArray(data)) {
            for (var d of data)
                this._dataCache[d['id']] = d;
        } else
            this._dataCache[data['id']] = data;

        if (this._completeRecordSet) {
            var arr = [];
            if (Array.isArray(data)) {
                var map = new Map();
                for (var d of data)
                    map.set(d['id'], d);

                var x;
                for (var d of this._completeRecordSet) {
                    x = map.get(d['id']);
                    if (x)
                        arr.push(x);
                    else
                        arr.push(d);
                }
            } else {
                for (var d of this._completeRecordSet) {
                    if (d['id'] == data['id'])
                        arr.push(data);
                    else
                        arr.push(d);
                }
            }
            this._completeRecordSet = arr;
        }
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