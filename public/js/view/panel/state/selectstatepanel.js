class SelectStatePanel extends Panel {

    _modelName;

    _tree;

    constructor(name) {
        super();
        this._modelName = name;

        $(window).on("changed.model", function (event, data) {
            if (!data || (data['name'] === this._modelName)) {
                this._tree = null;
                this.render();
            }
        }.bind(this));
    }

    async _renderContent() {
        const $div = $('<div/>').css({
            'padding': '10px'
        });

        const controller = app.getController();
        if (!this._tree) {
            const msc = controller.getModelController().getModel(this._modelName).getModelStateController();
            var nodes;
            var tree = msc.getStateTree();
            if (tree)
                nodes = JSON.parse(JSON.stringify(tree));
            this._tree = new Tree(nodes);
        }
        if (this._tree) {
            var treeConf = this._tree.getTreeConf();
            if (treeConf) {
                var treeNodes = Tree.getAllTreeNodes(treeConf);
                for (let node of treeNodes) {
                    if (!node['type'] || node['type'] === 'node') {
                        node['actions'] = {};

                        node['actions']['clickAction'] = function (event) {
                            controller.loadState(new State(this), true);
                        }.bind(node);

                        node['actions']['editAction'] = async function (state) {
                            var panel = new CrudStatePanel(ActionEnum.update, state);
                            controller.getModalController().openPanelInModal(panel);
                            return Promise.resolve(node);
                        }.bind(node);
                    }
                }

                var treeVisConf = { 'editable': true };
                var treeVis = new TreeVis(treeVisConf, this._tree);
                var $tree = treeVis.render();
                $div.append($tree);
                $div.append("<br>");
            }

            $div.append($('<button/>')
                .text('new')
                .click(async function (event) {
                    event.stopPropagation();

                    //app.controller.getView().getSideNavigationBar().close();

                    const state = new State();
                    state.typeString = this._modelName;
                    state.limit = -1;
                    const panel = new CrudStatePanel(ActionEnum.create, state);
                    return app.getController().getModalController().openPanelInModal(panel);
                }.bind(this))
            );

            $div.append($('<button/>')
                .text('add folder')
                .click(async function (event) {
                    event.stopPropagation();

                    const skeleton = [{
                        "name": "name",
                        "dataType": "string"
                    }];
                    const panel = new FormPanel(null, skeleton);
                    panel.setApplyAction(async function () {
                        const data = await panel.getForm().readForm();
                        this._tree.addTreeNode(data.name);
                        panel.dispose();
                        this.render();
                        return Promise.resolve();
                    }.bind(this));
                    return app.getController().getModalController().openPanelInModal(panel);
                }.bind(this))
            );

            if (app.controller.isInDebugMode()) {
                $div.append($('<button/>')
                    .text('edit json')
                    .click(async function (event) {
                        event.stopPropagation();
                        var changed;
                        const controller = app.getController();
                        try {
                            const conf = this._tree.getTreeConf(true);
                            changed = await controller.getModalController().openEditJsonModal(conf);
                            this._tree.setTreeConf(changed);
                        } catch (error) {
                            if (error)
                                controller.showError(error);
                        }
                        if (changed)
                            this.render();
                        return Promise.resolve();
                    }.bind(this))
                );
            };

            $div.append($('<button/>')
                .text('save')
                .click(this._tree, async function (event) {
                    const controller = app.getController();
                    try {
                        const msc = controller.getModelController().getModel(this._modelName).getModelStateController();
                        const newStates = event.data.getTreeConf(true);
                        const oldStates = msc.getStateTree();
                        const bChanged = !isEqualJson(oldStates, newStates);
                        if (bChanged) {
                            var bSave = false;
                            if (controller.getConfigController().confirmOnApply())
                                bSave = await controller.getModalController().openDiffJsonModal(oldStates, newStates);
                            else
                                bSave = true;

                            if (bSave) {
                                await msc.updateStates(newStates);
                                alert('Saved successfully');
                            }
                        } else
                            alert('Nothing changed');
                    } catch (error) {
                        if (error)
                            controller.showError(error);
                    }
                    return Promise.resolve();
                }.bind(this))
            );
        }

        return Promise.resolve($div);
    }
}