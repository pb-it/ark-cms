class ModelStateController {

    static STATE_IDENT = "states";

    _model;

    constructor(model) {
        this._model = model;

        this._init();
    }

    _init() {
    }

    getStateTree() {
        var states;
        const data = this._model.getDefinition();
        if (data['_sys'])
            states = data['_sys'][ModelStateController.STATE_IDENT];
        return states;
    }

    getAllStatesAlphabetical() {
        var res;
        var tree = this.getStateTree();
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

    async updateStates(states) {
        const data = this._model.getDefinition();
        if (!data['_sys'])
            data['_sys'] = {};
        data['_sys'][ModelStateController.STATE_IDENT] = states;
        await this._model.setDefinition(data, false);
        return app.getController().getApiController().getApiClient().requestData("PUT", "_model/" + this._model.getId() + "/" + ModelStateController.STATE_IDENT, null, states);
    }

    async saveState(state, bUpdate) {
        var states = this.getStateTree();
        if (states && states.length > 0) {
            var node = Tree.getNode(states, state.name);
            if (node) {
                if (bUpdate) {
                    node.typeString = state.typeString; //TODO: WTF?
                    node.id = state.id;
                    node.where = state.where;
                    node.sort = state.sort;
                    node.limit = state.limit;
                    node.filters = state.filters;
                    if (state.funcState)
                        node.funcState = state.funcState;
                    else if (node.funcState)
                        delete node.funcState;
                } else
                    throw new Error("It already exists a state with this name");
            } else {
                if (!bUpdate)
                    states.push(state);
            }
        } else
            states = [state];
        await this.updateStates(states);
        $(window).trigger('changed.model');
        return Promise.resolve();
    }

    /*async deleteState(state) {
        const data = this._model.getDefinition();
        var states;
        if (data['_sys'])
            states = data['_sys'][ModelStateController.STATE_IDENT].filter(function (x) { return x.name != state.name });
        return this.updateStates(states);
    }*/
}