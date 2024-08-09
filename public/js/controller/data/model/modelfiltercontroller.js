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
        var filters;
        const data = this._model.getDefinition();
        if (data['_sys'])
            filters = data['_sys'][ModelFilterController.FILTERS_IDENT];
        return filters;
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
        const data = this._model.getDefinition();
        if (!data['_sys'])
            data['_sys'] = {};
        data['_sys'][ModelFilterController.FILTERS_IDENT] = filters;
        await this._model.setDefinition(data, false);
        return app.getController().getApiController().getApiClient().requestData("PUT", "_model/" + this._model.getId() + "/" + ModelFilterController.FILTERS_IDENT, null, filters);
    }

    async saveFilter(filter, bUpdate) {
        var filters = this.getFilterTree();
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
        const data = this._model.getDefinition();
        var filters;
        if (data['_sys'])
            filters = data['_sys'][ModelFilterController.FILTERS_IDENT].filter(function (x) { return x.name != filter.name });
        return this.updateFilters(filters);
    }
}