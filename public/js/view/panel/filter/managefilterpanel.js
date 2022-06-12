class ManageFilterPanel extends Panel {

    _state;
    _tree;

    constructor(state) {
        super();
        this._state = state;
    }

    getTree() {
        return this._tree;
    }

    async _renderContent() {
        var $div = $('<div/>');

        var mfc = app.controller.getModelController().getModel(this._state.typeString).getModelFilterController();
        var tree = mfc.getFilterTree();
        if (tree) {
            this._tree = new Tree(tree);
            var $tree = this._tree.render();
            $div.append($tree);
            $div.append("<br>");

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
                        await app.controller.getModelController().getModel(this._state.typeString).getModelFilterController().updateFilters(event.data.getConf());
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