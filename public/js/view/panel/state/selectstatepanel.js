class SelectStatePanel extends Panel {

    _modelName;

    _tree;

    constructor(name) {
        super();
        this._modelName = name;

        $(window).on("changed.model", function (event, data) {
            if (data && data['name'] === this._modelName) {
                this._tree = null;
                this.render();
            }
        }.bind(this));
    }

    async _renderContent() {
        var $div = $('<div/>').css({
            'padding': '10px'
        });

        if (!this._tree) {
            var msc = app.controller.getModelController().getModel(this._modelName).getModelStateController();
            var nodes;
            var tree = msc.getStateTree();
            if (tree)
                nodes = JSON.parse(JSON.stringify(tree));
            var treeConf = {
                'type': 'dummyRoot',
                'nodes': nodes
            };
            this._tree = new Tree(treeConf);
        }
        if (this._tree) {
            var treeConf = this._tree.getTreeConf();

            var treeNodes = Tree.getAllTreeNodes(treeConf);
            for (let node of treeNodes) {
                if (!node['type'] || node['type'] === 'node') {
                    node['actions'] = {};

                    node['actions']['clickAction'] = function (event) {
                        app.controller.loadState(new State(this), true);
                    }.bind(node);

                    node['actions']['editAction'] = async function (state) {
                        var panel = new CrudStatePanel(ActionEnum.update, state);
                        app.controller.getModalController().openPanelInModal(panel);
                        return Promise.resolve(node);
                    }.bind(node);
                }
            }

            var treeVisConf = { 'editable': true };
            var treeVis = new TreeVis(treeVisConf, this._tree);
            var $tree = treeVis.render();
            $div.append($tree);

            $div.append("<br>");

            $div.append($('<button/>')
                .text('new')
                .click(async function (event) {
                    event.stopPropagation();

                    //app.controller.getView().getSideNavigationBar().close();

                    var state = new State();
                    state.typeString = this._modelName;
                    state.limit = -1;
                    var panel = new CrudStatePanel(ActionEnum.create, state);
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
                        this._tree.addTreeNode(data.name);
                        panel.dispose();
                        this.render();
                        return Promise.resolve();
                    }.bind(this));
                    return app.controller.getModalController().openPanelInModal(panel);
                }.bind(this))
            );

            if (app.controller.isInDebugMode()) {
                $div.append($('<button/>')
                    .text('edit json')
                    .click(async function (event) {
                        event.stopPropagation();
                        var bChanged = false;
                        try {
                            this._tree.setTreeConf(await app.controller.getModalController().openEditJsonModal(this._tree.getTreeConf().nodes));
                            bChanged = true;
                        } catch (error) {
                            if (error)
                                app.controller.showError(error);
                        }
                        if (bChanged)
                            this.render();
                        return Promise.resolve();
                    }.bind(this))
                );
            };

            $div.append($('<button/>')
                .text('save')
                .click(this._tree, async function (event) {
                    try {
                        var msc = app.controller.getModelController().getModel(this._modelName).getModelStateController();
                        var states = event.data.getTreeConf(true).nodes;

                        var bSave = false;
                        if (app.controller.getConfigController().confirmOnApply())
                            bSave = await app.controller.getModalController().openDiffJsonModal(msc.getStateTree(), states);
                        else
                            bSave = true;

                        if (bSave)
                            await msc.updateStates(states);
                    } catch (error) {
                        if (error)
                            app.controller.showError(error);
                    }
                    return Promise.resolve();
                }.bind(this))
            );
        }

        return Promise.resolve($div);
    }
}