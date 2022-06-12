class ModelFilterController {

    static FILTER_IDENT = "filters";

    _model;

    constructor(model) {
        this._model = model;

        this._init();
    }

    _init() {
    }

    getFilterTree() {
        return this._model.getData()[ModelFilterController.FILTER_IDENT];
    }

    getAllFiltersAlphabetical() {
        var res;
        var tree = this.getFilterTree();
        if (tree) {
            res = Tree.flattenTree(tree);
            res.sort(function (a, b) {
                if (a.name < b.name) { return -1; }
                if (a.name > b.name) { return 1; }
                return 0;
            });
        }
        return res;
    }

    getFilter(name) {
        var filters = this.getAllFiltersAlphabetical();
        return filters.filter(function (x) { return x.name === name })[0];
    }

    async updateFilters(filters) {
        var data = this._model.getData();
        data[ModelFilterController.FILTER_IDENT] = filters;
        return this._model.setData(data);
    }

    async saveFilter(filter) {
        var data = this._model.getData();
        if (data[ModelFilterController.FILTER_IDENT] && data[ModelFilterController.FILTER_IDENT].length > 0) {
            var filters = data[ModelFilterController.FILTER_IDENT].filter(function (x) { return x.name != filter.name });
            filters.push(filter);
            filters.sort((a, b) => a.name.localeCompare(b.name));
            data[ModelFilterController.FILTER_IDENT] = filters;
        } else
            data[ModelFilterController.FILTER_IDENT] = [filter];
        return this._model.setData(data);
    }

    async deleteFilter(filter) {
        var data = this._model.getData();
        var filters = data[ModelFilterController.FILTER_IDENT].filter(function (x) { return x.name != filter.name });
        data[ModelFilterController.FILTER_IDENT] = filters;
        return this._model.setData(data, false);
    }
}