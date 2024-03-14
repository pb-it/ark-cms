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
        return this._model.getDefinition()[ModelStateController.STATE_IDENT];
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
        var data = this._model.getDefinition();
        data[ModelStateController.STATE_IDENT] = states;
        await this._model.setDefinition(data, false);
        return app.getController().getApiController().getApiClient().requestData("PUT", "_model/" + this._model.getId() + "/" + ModelStateController.STATE_IDENT, null, states);
    }

    async saveState(state, bUpdate) {
        var data = this._model.getDefinition();
        var states = data[ModelStateController.STATE_IDENT];
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
                } else
                    throw new Error("It already exists a state with this name");
            } else {
                if (!bUpdate)
                    states.push(state);
            }
        } else
            states = [state];
        return this.updateStates(states);
    }

    /*async deleteState(state) {
        var data = this._model.getDefinition();
        var states = data[ModelStateController.STATE_IDENT].filter(function (x) { return x.name != state.name });
        return this.updateStates(states);
    }*/
}