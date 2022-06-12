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
        return this._model.getData()[ModelStateController.STATE_IDENT];
    }

    getAllStatesAlphabetical() {
        var res;
        var tree = this.getStateTree();
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

    updateStates(states) {
        var data = this._model.getData();
        data[ModelStateController.STATE_IDENT] = states;
        this._model.setData(data);
    }

    saveState(state, bUpdate) {
        var data = this._model.getData();
        if (data[ModelStateController.STATE_IDENT] && data[ModelStateController.STATE_IDENT].length > 0) {
            var node = Tree.getNode(data[ModelStateController.STATE_IDENT], state.name);
            if (node) {
                if (bUpdate) {
                    node.typeString = state.typeString; //TODO: WTF?
                    node.id = state.id;
                    node.where = state.where;
                    node.sort = state.sort;
                    node.limit = state.limit;
                    node.filters = state.filters;
                } else
                    throw new Error("It already exists a filter with this name");
            } else {
                if (!bUpdate)
                    data[ModelStateController.STATE_IDENT].push(state);
            }
        } else
            data[ModelStateController.STATE_IDENT] = [state];
        this._model.setData(data);
    }

    /*deleteState(state) {
        var data = this._model.getData();
        var states = data[ModelStateController.STATE_IDENT].filter(function (x) { return x.name != state.name });
        data[ModelStateController.STATE_IDENT] = states;
        this._model.setData(data);
    }*/
}