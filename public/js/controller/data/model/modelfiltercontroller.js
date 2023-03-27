class ModelFilterController {

    static FILTERS_IDENT = "filters";

    _model;

    constructor(model) {
        this._model = model;

        this._init();
    }

    _init() {
    }

    getFilterTree() {
        return this._model.getDefinition()[ModelFilterController.FILTERS_IDENT];
    }

    getAllFiltersAlphabetical() {
        var res;
        var tree = this.getFilterTree();
        if (tree) {
            res = Tree.getAllTreeNodes(tree).filter(function (x) { return (!x['type'] || x['type'] === 'node') });
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
        var data = this._model.getDefinition();
        data[ModelFilterController.FILTERS_IDENT] = filters;
        await this._model.setDefinition(data, false);
        return app.getController().getApiController().getApiClient().request("PUT", "/api/_model/" + this._model.getId() + "/" + ModelFilterController.FILTERS_IDENT, filters);
    }

    async saveFilter(filter, bUpdate) {
        var data = this._model.getDefinition();
        var filters = data[ModelFilterController.FILTERS_IDENT];
        if (filters && filters.length > 0) {
            var node = Tree.getNode(filters, filters.name);
            if (node) {
                if (bUpdate) {
                    node.typeString = filters.typeString; //TODO: like the name it should not have changed!
                    node.query = filters.query;
                    node.comment = filters.comment;
                } else
                    throw new Error("It already exists a filter with this name");
            } else {
                if (!bUpdate)
                    filters.push(filter);
            }
        } else
            filters = [filter];
        return this.updateFilters(filters);
    }

    async deleteFilter(filter) {
        var data = this._model.getDefinition();
        var filters = data[ModelFilterController.FILTERS_IDENT].filter(function (x) { return x.name != filter.name });
        return this.updateFilters(filters);
    }
}