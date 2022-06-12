class SelectStatePanel extends Panel {

    _modelName;

    constructor(name) {
        super();
        this._modelName = name;
    }

    async _renderContent() {
        var $div = $('<div/>');

        var msc = app.controller.getModelController().getModel(this._modelName).getModelStateController();
        var tree = msc.getStateTree(this._modelName);
        if (tree) {
            var flatten = Tree.flattenTree(tree);
            for (let state of flatten) {
                state.click = function (event) {
                    app.controller.loadState(new State(this), true);
                }.bind(state);
            }

            this._tree = new Tree(tree);
            var $tree = this._tree.render();
            $div.append($tree);
            $div.append("<br>");

            $div.append($('<button/>')
                .text('new')
                .click(async function (event) {
                    event.stopPropagation();

                    app.controller.getView().getSideNavigationBar().close();

                    var state = new State();
                    state.typeString = this._modelName;
                    state.limit = -1;
                    var panel = new CreateStatePanel(state);
                    return app.controller.getModalController().openPanelInModal(panel);
                }.bind(this))
            );

            $div.append($('<button/>')
                .text('add folder')
                .click(async function (event) {
                    event.stopPropagation();

                    var skeleton = [{
                        "name": "name",
                        "dataType": "string"
                    }];
                    var panel = new FormPanel(null, skeleton);
                    panel.setApplyAction(async function () {
                        var data = await panel.getForm().readForm();
                        this.addFolder(data.name);
                        panel.dispose();
                        return Promise.resolve();
                    }.bind(this._tree));
                    return app.controller.getModalController().openPanelInModal(panel);
                }.bind(this))
            );

            $div.append($('<button/>')
                .text('show json')
                .click(this._tree, async function (event) {
                    event.stopPropagation();

                    return app.controller.getModalController().openPanelInModal(new JsonPanel(event.data.getConf()));
                }.bind(this))
            );

            $div.append($('<button/>')
                .text('save')
                .click(this._tree, async function (event) {
                    try {
                        app.controller.getModelController().getModel(this._modelName).getModelStateController().updateStates(event.data.getConf());
                    } catch (error) {
                        app.controller.showError(error);
                    }
                    return Promise.resolve();
                }.bind(this))
            );
        }

        return Promise.resolve($div);
    }
}